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
                "easy": 1,
                "medium": 2,
                "hard": 3,
                "łatwy": 1,
                "średni": 2,
                "trudny": 3,
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
        self.correct_choices = cast("list[str | int] | None", normalized_correct)
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
    def __init__(self, model_name: str | None = None) -> None:
        settings = get_settings()
        self._model_name = model_name or settings.GEMINI_MODEL_NAME

    @staticmethod
    @lru_cache
    def _client() -> genai.Client:
        settings = get_settings()
        return genai.Client(api_key=settings.GEMINI_API_KEY)

    def generate(
        self, *, source_text: str, params: GenerateParams
    ) -> tuple[str | None, list[Question], dict[str, Any]]:
        prompt = _build_prompt(source_text, params)
        generation_config = types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=_response_schema(),
        )

        usage: dict[str, Any] = {}
        max_attempts = 3
        last_validation_error: ValueError | None = None

        for attempt in range(max_attempts):
            try:
                response = self._client().models.generate_content(
                    model=self._model_name,
                    contents=prompt,
                    config=cast(Any, generation_config),
                )
            except Exception as exc:
                # ... existing error handling ...
                message = str(exc)
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

            # Extract usage metadata
            if response.usage_metadata:
                usage = {
                    "prompt_tokens": response.usage_metadata.prompt_token_count,
                    "candidates_tokens": response.usage_metadata.candidates_token_count,
                    "total_tokens": response.usage_metadata.total_token_count,
                }

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
                    last_validation_error = initial_err
                    if attempt < max_attempts - 1:
                        logger.info(
                            (
                                "LLM response invalid, retrying generation "
                                "(attempt %s/%s)."
                            ),
                            attempt + 2,
                            max_attempts,
                        )
                        prompt = self._build_retry_prompt(
                            source_text, params, str(initial_err)
                        )
                        continue
                    raise initial_err
                validated = repaired

            try:
                questions = self._select_questions(validated, params)
            except ValueError as exc:
                last_validation_error = exc
                if attempt < max_attempts - 1:
                    logger.info(
                        (
                            "LLM response mismatched config, retrying generation "
                            "(attempt %s/%s)."
                        ),
                        attempt + 2,
                        max_attempts,
                    )
                    prompt = self._build_retry_prompt(source_text, params, str(exc))
                    continue
                raise exc

            return validated.title, questions, usage

        if last_validation_error is not None:
            raise last_validation_error
        raise ValueError("Generowanie testu nie powiodło się.")

    @staticmethod
    def _select_questions(
        validated: LLMResponse, params: GenerateParams
    ) -> list[Question]:
        closed_p = params.closed
        need_tf = closed_p.true_false
        need_single = closed_p.single_choice
        need_multi = closed_p.multi_choice
        need_open = params.num_open
        tf_questions: list[Question] = []
        single_questions: list[Question] = []
        multi_questions: list[Question] = []
        open_questions: list[Question] = []

        for payload in validated.questions:
            q = Question(
                id=None,
                text=payload.text,
                is_closed=payload.is_closed,
                difficulty=QuestionDifficulty(int(payload.difficulty)),
                choices=(payload.choices or []) if payload.is_closed else [],
                correct_choices=cast(list[str], payload.correct_choices or [])
                if payload.is_closed
                else [],
            )

            if not q.is_closed:
                open_questions.append(q)
                continue

            # Detekcja typu + walidacje liczności poprawnych odpowiedzi
            is_tf = len(q.choices) == 2 and any(
                c.lower() in ["prawda", "fałsz", "true", "false"] for c in q.choices
            )
            correct_len = len(q.correct_choices)
            is_multi = correct_len >= 2
            is_single = (not is_tf) and correct_len == 1

            if is_tf and correct_len == 1:
                tf_questions.append(q)
            elif is_multi:
                multi_questions.append(q)
            elif is_single:
                single_questions.append(q)

        if len(tf_questions) < need_tf:
            raise ValueError(
                "LLM nie zwrócił wymaganej liczby pytań Prawda/Fałsz."
            )
        if len(single_questions) < need_single:
            raise ValueError(
                "LLM nie zwrócił wymaganej liczby pytań jednokrotnego wyboru."
            )
        if len(multi_questions) < need_multi:
            raise ValueError(
                "LLM nie zwrócił wymaganej liczby pytań wielokrotnego wyboru "
                "(co najmniej 2 poprawne odpowiedzi)."
            )
        if len(open_questions) < need_open:
            raise ValueError("LLM nie zwrócił wymaganej liczby pytań otwartych.")

        return (
            tf_questions[:need_tf]
            + single_questions[:need_single]
            + multi_questions[:need_multi]
            + open_questions[:need_open]
        )

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
            msg = f"Odpowiedź LLM nie spełnia wymaganego schematu. Szczegóły: {exc}"
            raise ValueError(msg) from exc

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
    def _build_retry_prompt(
        text: str, params: GenerateParams, reason: str
    ) -> str:
        return (
            "Poprzednia odpowiedź nie spełniała konfiguracji. "
            f"Powód: {reason}\n"
            "Wygeneruj test PONOWNIE, ściśle według konfiguracji.\n\n"
            + _build_prompt(text, params)
        )

    @staticmethod
    def _build_repair_prompt(bad_json: str, params: GenerateParams) -> str:
        c = params.closed
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
            '"choices": ["..."] (wymagane dla is_closed=true), '
            '"correct_choices": ["..."] (co najmniej jedna dla is_closed=true) '
            "} ] "
            "}\n"
            "Wymagane liczby pytań:\n"
            f"- Prawda/Fałsz: {c.true_false}\n"
            f"- Jednokrotny wybór: {c.single_choice}\n"
            f"- Wielokrotny wybór (min. 2 poprawne): {c.multi_choice}\n"
            f"- Otwarte: {params.num_open}\n\n"
            "Wejściowa odpowiedź do naprawy:\n"
            f"{bad_json}"
        )


__all__ = ["GeminiQuestionGenerator"]
