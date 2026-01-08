from __future__ import annotations

import json
import logging
from functools import lru_cache
from typing import Annotated, Any, cast

from google import genai
from google.genai import types
from pydantic import (
    BaseModel,
    Field,
    ValidationError,
    model_validator,
)

from app.api.schemas.tests import GenerateParams
from app.core.config import get_settings
from app.domain.models import Question
from app.domain.models.enums import QuestionDifficulty
from app.domain.services import QuestionGenerator

from .prompts import PromptBuilder

logger = logging.getLogger(__name__)


def _build_prompt(text: str, params: GenerateParams) -> str:
    return PromptBuilder.build_full_test_prompt(text, params)


def _response_schema() -> dict[str, Any]:
    """Schema passed to Gemini structured output."""
    return {
        "type": "object",
        "properties": {
            "title": {"type": "string"},
            "questions": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "text": {"type": "string"},
                        "is_closed": {"type": "boolean"},
                        "difficulty": {"type": "integer"},
                        "choices": {"type": "array", "items": {"type": "string"}},
                        "correct_choices": {
                            "type": "array",
                            "items": {"type": "string"},
                        },
                    },
                    "required": ["text", "is_closed", "difficulty"],
                },
            },
        },
        "required": ["questions"],
    }


class LLMQuestionPayload(BaseModel):
    text: str
    is_closed: bool
    difficulty: Annotated[int, Field(ge=1, le=3)]
    choices: list[str] | None = None
    correct_choices: list[str | int] | None = None

    @model_validator(mode="before")
    @classmethod
    def _coerce(cls, values: Any) -> Any:
        if not isinstance(values, dict):
            raise ValueError("Element listy pytań musi być obiektem JSON.")
        data = dict(values)

        # Mapowanie trudności z tekstu na liczby + fallback do 1
        raw_diff = data.get("difficulty")
        if isinstance(raw_diff, str):
            normalized = raw_diff.lower().strip()
            mapping = {
                "easy": 1, "medium": 2, "hard": 3,
                "łatwy": 1, "średni": 2, "trudny": 3,
            }
            if normalized in mapping:
                data["difficulty"] = mapping[normalized]
            else:
                try:
                    data["difficulty"] = int(normalized)
                except (ValueError, TypeError):
                    data["difficulty"] = 1
        elif not isinstance(raw_diff, int):
            data["difficulty"] = 1

        # Upewnienie się, że trudność mieści się w zakresie 1-3
        if not (1 <= data.get("difficulty", 1) <= 3):
            data["difficulty"] = 1

        if "is_closed" in data:
            data["is_closed"] = bool(data["is_closed"])
        return data

    @model_validator(mode="after")
    def _normalize(self) -> LLMQuestionPayload:
        self.text = str(self.text).strip()
        if not self.text:
            raise ValueError("Pole 'text' nie może być puste.")

        if not self.is_closed:
            self.choices = None
            self.correct_choices = None
            return self

        choices = [str(c).strip() for c in (self.choices or []) if str(c).strip()]
        if not choices:
            raise ValueError("Pytanie zamknięte musi zawierać 'choices'.")

        normalized_correct: list[str] = []
        for c in self.correct_choices or []:
            if isinstance(c, int):
                if 0 <= c < len(choices):
                    normalized_correct.append(choices[c])
            else:
                val = str(c).strip()
                if val:
                    normalized_correct.append(val)

        if normalized_correct:
            normalized_correct = [c for c in normalized_correct if c in choices]
            seen: set[str] = set()
            new_correct: list[str] = []
            for c in normalized_correct:
                if c not in seen:
                    seen.add(c)
                    new_correct.append(c)
            normalized_correct = new_correct

        if not normalized_correct:
            raise ValueError(
                "Pytanie zamknięte musi mieć co najmniej jedną poprawną odpowiedź."
            )

        self.choices = choices
        self.correct_choices = cast(list[str | int] | None, normalized_correct)
        return self


class LLMResponse(BaseModel):
    title: str | None = Field(default=None)
    questions: list[LLMQuestionPayload]

    @model_validator(mode="before")
    @classmethod
    def _ensure_container(cls, values: Any) -> Any:
        if isinstance(values, list):
            return {"questions": values}
        if isinstance(values, dict) and "questions" not in values:
            raise ValueError("Brak pola 'questions' w odpowiedzi.")
        return values

    @model_validator(mode="after")
    def _normalize_title(self) -> LLMResponse:
        if self.title is not None:
            self.title = str(self.title).strip() or None
        return self


class GeminiQuestionGenerator(QuestionGenerator):
    def __init__(self, model_name: str = "gemini-2.0-flash") -> None:
        self._model_name = model_name

    @staticmethod
    @lru_cache
    def _client() -> genai.Client:
        settings = get_settings()
        return genai.Client(
            api_key=settings.GEMINI_API_KEY
        )

    def generate(
        self, *, source_text: str, params: GenerateParams
    ) -> tuple[str | None, list[Question]]:
        prompt = _build_prompt(source_text, params)
        generation_config = types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=_response_schema(),
        )

        try:
            response = self._client().models.generate_content(
                model=self._model_name,
                contents=prompt,
                config=cast(Any, generation_config),
            )
        except Exception as exc:
            message = str(exc)
            # Map quota/rate errors to ValueError so they surface to the user
            # and don't look like 500s
            is_quota = (
                "RESOURCE_EXHAUSTED" in message
                or "quota" in message.lower()
                or "429" in message
            )
            if is_quota:
                raise ValueError(
                    "Limit zapytań do Gemini został przekroczony. "
                    "Spróbuj ponownie za chwilę."
                ) from exc
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
            validated = self._parse_and_validate(raw_output)
        except ValueError as initial_err:
            repaired = self._attempt_repair(
                raw_output, params, cast(dict[str, Any], generation_config)
            )
            if repaired is None:
                raise initial_err
            validated = repaired

        closed_p = params.closed
        need_closed = (
            closed_p.true_false
            + closed_p.single_choice
            + closed_p.multi_choice
        )
        need_open = params.num_open

        selected: list[Question] = []
        got_closed = 0
        got_open = 0

        for payload in validated.questions:
            q = Question(
                id=None,
                text=payload.text,
                is_closed=payload.is_closed,
                difficulty=QuestionDifficulty(int(payload.difficulty)),
                choices=cast(list[str], payload.choices or [])
                if payload.is_closed
                else [],
                correct_choices=cast(list[str], payload.correct_choices or [])
                if payload.is_closed
                else [],
            )

            if q.is_closed and got_closed < need_closed:
                selected.append(q)
                got_closed += 1
            elif (not q.is_closed) and got_open < need_open:
                selected.append(q)
                got_open += 1
            if got_closed >= need_closed and got_open >= need_open:
                break

        questions = selected

        return validated.title, questions

    @staticmethod
    def _parse_and_validate(raw: str) -> LLMResponse:
        try:
            parsed = json.loads(raw)
        except json.JSONDecodeError as exc:
            snippet = raw[:800]
            raise ValueError(
                "Nie udało się sparsować odpowiedzi LLM jako JSON. "
                f"Fragment odpowiedzi:\n{snippet}"
            ) from exc

        try:
            return LLMResponse.model_validate(parsed)
        except ValidationError as exc:
            raise ValueError(
                "Odpowiedź LLM nie spełnia wymaganego schematu. "
                f"Szczegóły: {exc}"
            ) from exc

    def _attempt_repair(
        self,
        bad_output: str,
        params: GenerateParams,
        generation_config: dict[str, Any],
    ) -> LLMResponse | None:
        prompt = self._build_repair_prompt(bad_output, params)
        try:
            response = self._client().models.generate_content(
                model=self._model_name,
                contents=prompt,
                config=cast(Any, generation_config),
            )
        except Exception as exc:
            logger.warning("LLM repair attempt failed to call model: %s", exc)
            return None

        repaired = (response.text or "").strip()
        if repaired.startswith("```"):
            first_nl = repaired.find("\n")
            if first_nl != -1:
                repaired = repaired[first_nl + 1 :].strip()
            if repaired.endswith("```"):
                repaired = repaired[:-3].strip()
        if repaired.lower().startswith("json"):
            repaired = repaired[4:].lstrip(":").strip()

        try:
            return self._parse_and_validate(repaired)
        except ValueError as exc:
            logger.warning("LLM repair produced invalid JSON: %s", exc)
            return None

    @staticmethod
    def _build_repair_prompt(bad_json: str, params: GenerateParams) -> str:
        closed_total = (
            params.closed.true_false
            + params.closed.single_choice
            + params.closed.multi_choice
        )
        return (
            "Napraw poniższą odpowiedź LLM tak, aby była poprawnym JSON "
            "zgodnym ze schematem. "
            "Zwróć WYŁĄCZNIE JSON, bez komentarzy ani kodowych fence'ów. "
            "Schema:\n"
            "{"
            '"title": "string opcjonalny", '
            '"questions": [ { '
            '"text": "string", '
            '"is_closed": true | false, '
            '"difficulty": 1 | 2 | 3, '
            '"choices": [\"...\"] (wymagane dla is_closed=true), '
            '"correct_choices": [\"...\"] (co najmniej jedna dla is_closed=true) '
            "} ] "
            "}\n"
            f"Wymagane liczby pytań: zamknięte={closed_total}, "
            f"otwarte={params.num_open}. "
            "Wejściowa odpowiedź do naprawy:\n"
            f"{bad_json}"
        )



__all__ = ["GeminiQuestionGenerator"]

