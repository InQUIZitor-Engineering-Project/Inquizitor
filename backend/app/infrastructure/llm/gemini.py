from __future__ import annotations

import json
from functools import lru_cache
from typing import List

from google import genai

from app.api.schemas.tests import GenerateParams
from app.core.config import get_settings
from app.domain.models import Question
from app.domain.models.enums import QuestionDifficulty
from app.domain.services import QuestionGenerator


def _build_prompt(text: str, params: GenerateParams) -> str:
    parts = [
        f"Na podstawie tekstu:\n{text}\n\nStwórz {params.num_closed} pytania zamknięte i {params.num_open} pytania otwarte."
    ]

    if params.closed_types:
        closed_types_str = ", ".join(params.closed_types)
        parts.append(f"Dla pytań zamkniętych użyj tylko typów: {closed_types_str}")

    parts.append(
        f"Poziomy trudności rozdaj tak: {params.easy} łatwych, {params.medium} średnich, {params.hard} trudnych."
    )

    parts.append(
        """
Każde pytanie wypisz jako JSON-owy obiekt ze strukturą:
{
  "text": "...",
  "is_closed": true lub false,
  "difficulty": 1|2|3,
  "choices": [..] lub null,
  "correct_choices": [..] lub null
}
Zwróć WYŁĄCZNIE listę takich obiektów w JSON (bez dodatkowego tekstu).
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

    def generate(self, *, source_text: str, params: GenerateParams) -> List[Question]:
        prompt = _build_prompt(source_text, params)

        try:
            response = self._client().models.generate_content(
                model=self._model_name,
                contents=prompt,
            )
        except Exception as exc:  # noqa: BLE001
            raise RuntimeError(f"Gemini request failed: {exc}") from exc

        raw_output = response.text or ""
        if raw_output.startswith("```"):
            raw_output = raw_output.strip("`")
        if raw_output.startswith("json"):
            raw_output = raw_output[4:].strip()

        try:
            questions_payload = json.loads(raw_output)
        except json.JSONDecodeError as exc:  # noqa: B904
            raise ValueError(f"Nie udało się sparsować odpowiedzi Gemini jako JSON:\n{raw_output}") from exc

        questions: List[Question] = []
        for item in questions_payload:
            missing = {"text", "is_closed", "difficulty", "choices", "correct_choices"} - item.keys()
            if missing:
                raise ValueError(f"Brakuje pól w wygenerowanym pytaniu: {missing}")

            difficulty = QuestionDifficulty(int(item["difficulty"]))
            choices = item["choices"] or []
            correct_choices = item["correct_choices"] or []

            question = Question(
                id=None,
                text=item["text"],
                is_closed=bool(item["is_closed"]),
                difficulty=difficulty,
                choices=choices,
                correct_choices=correct_choices,
            )
            questions.append(question)

        return questions


__all__ = ["GeminiQuestionGenerator"]

