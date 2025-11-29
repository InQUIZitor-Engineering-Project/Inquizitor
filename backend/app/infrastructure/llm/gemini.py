from __future__ import annotations

import json
from functools import lru_cache
from typing import List, Any

from google import genai

from app.api.schemas.tests import GenerateParams
from app.core.config import get_settings
from app.domain.models import Question
from app.domain.models.enums import QuestionDifficulty
from app.domain.services import QuestionGenerator


def _build_prompt(text: str, params: GenerateParams) -> str:
    c_tf = params.closed.true_false
    c_sc = params.closed.single_choice
    c_mc = params.closed.multi_choice
    c_total = c_tf + c_sc + c_mc

    parts = [
        "Pracujesz jako ekspert dydaktyczny języka polskiego.",
        "Twoim zadaniem jest przygotowanie pytań testowych na podstawie przekazanego materiału.",
        "Każde pytanie i wszystkie odpowiedzi muszą być w języku polskim.",
        f"Na podstawie poniższego tekstu utwórz łącznie {c_total} pytań zamkniętych oraz {params.num_open} pytań otwartych.",
        f"Z pytań zamkniętych przygotuj dokładnie: {c_tf} × prawda/fałsz, {c_sc} × jednokrotnego wyboru oraz {c_mc} × wielokrotnego wyboru.",
        "",
        "Dodatkowo wygeneruj krótki, treściwy tytuł testu po polsku, który dobrze opisuje główny temat materiału.",
        "",
        f"Rozłóż poziomy trudności następująco: {params.easy} łatwych, {params.medium} średnich, {params.hard} trudnych.",
        "",
        "Zwróć DOKŁADNIE JEDEN obiekt JSON o strukturze:",
        """
{
  "title": "Krótki tytuł testu po polsku",
  "questions": [
    {
      "text": "...",               // treść pytania
      "is_closed": true | false,   // pytanie zamknięte / otwarte
      "difficulty": 1 | 2 | 3,     // 1=łatwe, 2=średnie, 3=trudne
      "choices": [ ... ] lub null, // dla zamkniętych
      "correct_choices": [ ... ] lub null  // dla zamkniętych (stringi lub indeksy)
    }
  ]
}
        """,
        "Wymagania:",
        f"- Łącznie pytań: {c_total + params.num_open}.",
        f"- Dokładnie {c_total} zamkniętych ({c_tf} TF, {c_sc} single, {c_mc} multi) i {params.num_open} otwartych.",
        "- Zwróć WYŁĄCZNIE poprawny JSON (bez komentarzy/tekstu dookoła).",
        "- Jeśli czegoś nie możesz wygenerować, i tak zwróć poprawny JSON (pusta lista 'questions').",
        f"- Weź pod uwagę następujące preferencje odnośnie generowanego testu: {params.additional_instructions}\n" if params.additional_instructions is not "" else "",
        f"Tekst źródłowy:\n{text}\n",
    ]

    return "\n".join(parts)



class GeminiQuestionGenerator(QuestionGenerator):
    def __init__(self, model_name: str = "gemini-2.0-flash") -> None:
        self._model_name = model_name

    @staticmethod
    @lru_cache()
    def _client() -> genai.Client:
        settings = get_settings()
        return genai.Client(api_key=settings.GEMINI_API_KEY)

    def generate(
        self, *, source_text: str, params: GenerateParams
    ) -> tuple[str | None, List[Question]]:
        prompt = _build_prompt(source_text, params)

        try:
            response = self._client().models.generate_content(
                model=self._model_name,
                contents=prompt,
            )
        except Exception as exc:  # noqa: BLE001
            raise RuntimeError(f"Gemini request failed: {exc}") from exc

        raw_output = (response.text or "").strip()

        if raw_output.startswith("```"):
            first_nl = raw_output.find("\n")
            if first_nl != -1:
                raw_output = raw_output[first_nl + 1 :].strip()
            if raw_output.endswith("```"):
                raw_output = raw_output[:-3].strip()

        if raw_output.lower().startswith("json"):
            raw_output = raw_output[4:].lstrip(":").strip()

        try:
            parsed = json.loads(raw_output)
        except json.JSONDecodeError as exc:
            snippet = raw_output[:800]
            raise ValueError(
                "Nie udało się sparsować odpowiedzi LLM jako JSON. "
                f"Fragment odpowiedzi:\n{snippet}"
            ) from exc

        title: str | None = None

        if isinstance(parsed, dict):
            title = parsed.get("title") or None
            questions_payload = parsed.get("questions")
            if not isinstance(questions_payload, list):
                raise ValueError(
                    "Odpowiedź LLM zawiera obiekt, ale pole 'questions' nie jest listą."
                )
        elif isinstance(parsed, list):
            questions_payload = parsed
        else:
            raise ValueError(
                "Nieoczekiwany format odpowiedzi LLM. "
                "Spodziewano listy pytań lub obiektu z polem 'questions'."
            )

        questions: List[Question] = []

        for item in questions_payload:
            if not isinstance(item, dict):
                raise ValueError("Element listy pytań nie jest obiektem JSON.")

            missing = {"text", "is_closed", "difficulty"} - item.keys()
            if missing:
                raise ValueError(f"Brak wymaganych pól w pytaniu: {missing}")

            text = str(item["text"])
            is_closed = bool(item["is_closed"])
            difficulty = QuestionDifficulty(int(item["difficulty"]))

            raw_choices = item.get("choices") or []
            raw_correct = item.get("correct_choices") or []

            choices: List[str] = []
            if is_closed and raw_choices:
                if not isinstance(raw_choices, list):
                    raise ValueError("Pole 'choices' musi być listą.")
                choices = [str(c) for c in raw_choices]

            correct_choices: List[str] = []
            if is_closed and raw_correct:
                if isinstance(raw_correct, list) and all(
                    isinstance(c, int) for c in raw_correct
                ):
                    for idx in raw_correct:
                        if 0 <= idx < len(choices):
                            correct_choices.append(choices[idx])
                else:
                    if not isinstance(raw_correct, list):
                        raise ValueError(
                            "Pole 'correct_choices' musi być listą indeksów lub stringów."
                        )
                    correct_choices = [str(c) for c in raw_correct]

            if not is_closed:
                choices = []
                correct_choices = []

            questions.append(
                Question(
                    id=None,
                    text=text,
                    is_closed=is_closed,
                    difficulty=difficulty,
                    choices=choices or None,
                    correct_choices=correct_choices or None,
                )
            )
        need_closed = params.closed.true_false + params.closed.single_choice + params.closed.multi_choice
        need_open = params.num_open

        selected: List[Question] = []
        got_closed = 0
        got_open = 0

        for q in questions:
            if q.is_closed and got_closed < need_closed:
                selected.append(q)
                got_closed += 1
            elif (not q.is_closed) and got_open < need_open:
                selected.append(q)
                got_open += 1
            if got_closed >= need_closed and got_open >= need_open:
                break

        questions = selected

        return title, questions



__all__ = ["GeminiQuestionGenerator"]

