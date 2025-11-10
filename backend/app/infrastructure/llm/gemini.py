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
        self.last_title: str | None = None  # do wyciągania tytułu

    @staticmethod
    @lru_cache()
    def _client() -> genai.Client:
        settings = get_settings()
        return genai.Client(api_key=settings.GEMINI_API_KEY)

    def generate(self, *, source_text: str, params: GenerateParams) -> List[Question]:
        prompt = _build_prompt(source_text, params)

        try:
            response = self._client().models.generate_content(
                model=self._model_name,
                contents=prompt,
            )
        except Exception as exc:  # błąd HTTP / klienta
            raise RuntimeError(f"Gemini request failed: {exc}") from exc

        raw_output = (response.text or "").strip()

        if raw_output.startswith("```"):
            raw_output = raw_output.strip("`").strip()
        if raw_output.lower().startswith("json"):
            raw_output = raw_output[4:].strip()

        try:
            parsed = json.loads(raw_output)
        except json.JSONDecodeError:
            raise ValueError(
                "Model zwrócił odpowiedź w niepoprawnym formacie JSON. "
                "Spróbuj ponownie lub zmniejsz ilość tekstu wejściowego."
            )

        questions_payload: list

        # Obsługa dwóch formatów:
        # 1) { "title": "...", "questions": [ ... ] }
        # 2) [ { ... }, { ... } ]
        self.last_title = None

        if isinstance(parsed, dict):
            q_list = parsed.get("questions")
            if not isinstance(q_list, list):
                raise ValueError(
                    "Model nie zwrócił poprawnej listy 'questions' w odpowiedzi."
                )
            self.last_title = (
                str(parsed.get("title")).strip() or None
                if parsed.get("title") is not None else None
            )
            questions_payload = q_list
        elif isinstance(parsed, list):
            questions_payload = parsed
        else:
            raise ValueError(
                "Nieoczekiwany format odpowiedzi modelu. "
                "Oczekiwano tablicy pytań lub obiektu z polami 'title' i 'questions'."
            )

        if not questions_payload:
            raise ValueError("Model nie wygenerował żadnych pytań.")

        questions: List[Question] = []

        for idx, item in enumerate(questions_payload, start=1):
            if not isinstance(item, dict):
                raise ValueError(f"Pytanie #{idx} ma niepoprawny format.")

            missing = {"text", "is_closed", "difficulty", "choices", "correct_choices"} - set(item.keys())
            if missing:
                raise ValueError(
                    f"Pytanie #{idx} nie zawiera wymaganych pól: {', '.join(missing)}."
                )

            try:
                difficulty_val = int(item["difficulty"])
                difficulty = QuestionDifficulty(difficulty_val)
            except Exception:
                raise ValueError(
                    f"Pytanie #{idx} ma niepoprawną wartość 'difficulty': {item['difficulty']!r}."
                )

            choices = item.get("choices") or []
            correct_choices = item.get("correct_choices") or []

            if not isinstance(choices, list):
                choices = [choices]
            if not isinstance(correct_choices, list):
                correct_choices = [correct_choices]

            questions.append(
                Question(
                    id=None,
                    text=str(item["text"]),
                    is_closed=bool(item["is_closed"]),
                    difficulty=difficulty,
                    choices=[str(c) for c in choices] if choices else [],
                    correct_choices=[str(c) for c in correct_choices] if correct_choices else [],
                )
            )

        return questions

__all__ = ["GeminiQuestionGenerator"]

