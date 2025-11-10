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
    parts = [
        "Pracujesz jako ekspert dydaktyczny języka polskiego.",
        "Twoim zadaniem jest przygotowanie pytań testowych na podstawie przekazanego materiału.",
        "Każde pytanie i wszystkie odpowiedzi muszą być w języku polskim.",
        f"Na podstawie poniższego tekstu utwórz {params.num_closed} pytań zamkniętych oraz {params.num_open} pytań otwartych.",
        "",
        "Dodatkowo wygeneruj krótki, treściwy tytuł testu po polsku, który dobrze opisuje główny temat materiału.",
        "",
        f"\n\nTekst źródłowy:\n{text}\n",
    ]

    if params.closed_types:
        closed_types_str = ", ".join(params.closed_types)
        parts.append(
            f"Dla pytań zamkniętych korzystaj wyłącznie z następujących typów: {closed_types_str}."
        )

    parts.append(
        f"Rozłóż poziomy trudności następująco: {params.easy} łatwych, {params.medium} średnich, {params.hard} trudnych."
    )

    parts.append(
        """
        Zwróć DOKŁADNIE JEDEN obiekt JSON o strukturze:
        {
        "title": "Krótki tytuł testu po polsku",
        "questions": [
            {
            "text": "...",              // treść pytania po polsku
            "is_closed": true | false,  // czy pytanie jest zamknięte
            "difficulty": 1 | 2 | 3,    // 1=łatwe, 2=średnie, 3=trudne
            "choices": [ ... ] lub null,
            "correct_choices": [ ... ] lub null
            },
            ...
        ]
        }

        Wymagania:
        - Zwróć WYŁĄCZNIE poprawny JSON, bez komentarzy, bez dodatkowego tekstu przed ani po.
        - Jeśli nie możesz czegoś wygenerować, nadal zwróć poprawny JSON z pustą tablicą "questions".
        """
    )

    return "\n\n".join(parts)


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

        return title, questions



__all__ = ["GeminiQuestionGenerator"]

