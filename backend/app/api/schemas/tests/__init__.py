# app/schemas/test.py
import json
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field, field_validator, model_validator

ClosedType = Literal["true_false", "single_choice", "multi_choice"]

MAX_QUESTIONS_TOTAL = 30

class ClosedBreakdown(BaseModel):
    true_false: int = 0
    single_choice: int = 0
    multi_choice: int = 0

    @model_validator(mode="after")
    def non_negative(self):
        for k, v in self.model_dump().items():
            if v < 0:
                raise ValueError(f"{k} must be >= 0")
            if v > MAX_QUESTIONS_TOTAL:
                raise ValueError(f"{k} must be <= {MAX_QUESTIONS_TOTAL}")
        return self

    def total(self) -> int:
        return self.true_false + self.single_choice + self.multi_choice

class FileUploadResponse(BaseModel):
    file_id: int
    filename: str

class TextInput(BaseModel):
    text: str

class TestOut(BaseModel):
    id: int
    title: str
    created_at: datetime

    class Config:
        from_attributes = True

class GenerateParams(BaseModel):
    closed: ClosedBreakdown = Field(default_factory=ClosedBreakdown)
    num_open: int = 0

    easy: int = 0
    medium: int = 0
    hard: int = 0

    additional_instructions: str | None = None

    @model_validator(mode="after")
    def check_counts(self):
        if self.num_open < 0:
            raise ValueError("num_open must be >= 0")
        if self.num_open > MAX_QUESTIONS_TOTAL:
            raise ValueError(f"num_open must be <= {MAX_QUESTIONS_TOTAL}")

        for field in ("easy", "medium", "hard"):
            value = getattr(self, field)
            if value < 0:
                raise ValueError(f"{field} must be >= 0")
            if value > MAX_QUESTIONS_TOTAL:
                raise ValueError(f"{field} must be <= {MAX_QUESTIONS_TOTAL}")

        total = self.easy + self.medium + self.hard
        expected = self.closed.total() + self.num_open
        if expected > MAX_QUESTIONS_TOTAL:
            raise ValueError(f"Total questions must be <= {MAX_QUESTIONS_TOTAL}")
        if total != expected:
            raise ValueError(
                "The sum of easy, medium, and hard must equal "
                "closed.total() + num_open"
            )
        return self



class TestGenerateRequest(GenerateParams):
    text: str | None = None
    file_id: int | None = None

    @model_validator(mode="after")
    def validate_source(self):
        text_value = (self.text or "").strip() if self.text else ""
        has_text = bool(text_value)
        has_file = self.file_id is not None

        if not has_text and not has_file:
            raise ValueError("Please provide text or file_id")

        self.text = text_value or None
        return self


class TestGenerateResponse(BaseModel):
    test_id: int
    num_questions: int


class QuestionOut(BaseModel):
    id: int
    text: str
    is_closed: bool
    difficulty: int
    choices: list[str] | None = None
    correct_choices: list[str] | None = None

    @field_validator("choices", "correct_choices", mode="before")
    @classmethod
    def coerce_list(cls, v):
        if v is None:
            return None
        if isinstance(v, list):
            return [str(item) for item in v]
        if isinstance(v, str):
            try:
                parsed = json.loads(v)
                if isinstance(parsed, list):
                    return [str(item) for item in parsed]
                return [str(parsed)]
            except Exception:
                return [v.strip().strip('"').strip("'")]
        return [str(v)]

class QuestionCreate(BaseModel):
    text: str
    is_closed: bool = True
    difficulty: int = 1
    choices: list[str] | None = None
    correct_choices: list[str] | None = None

    @field_validator("choices", "correct_choices", mode="before")
    @classmethod
    def coerce_list(cls, v):
        return QuestionOut.coerce_list(v)

    @model_validator(mode="after")
    def validate_closed_open(self):
        if not self.is_closed:
            self.choices = None
            self.correct_choices = None

        if self.is_closed and self.correct_choices and self.choices:
            invalid = set(self.correct_choices) - set(self.choices)
            if invalid:
                raise ValueError("correct_choices must be a subset of choices")
        return self


class QuestionUpdate(BaseModel):
    text: str | None = None
    is_closed: bool | None = None
    difficulty: int | None = None
    choices: list[str] | None = None
    correct_choices: list[str] | None = None

    @field_validator("choices", "correct_choices", mode="before")
    @classmethod
    def coerce_list(cls, v):
        return QuestionOut.coerce_list(v)

    @model_validator(mode="after")
    def validate_closed_open(self):
        if self.is_closed is False:
            self.choices = None
            self.correct_choices = None

        if self.choices is not None and self.correct_choices is not None:
            invalid = set(self.correct_choices) - set(self.choices)
            if invalid:
                raise ValueError("correct_choices must be a subset of choices")
        return self



class TestDetailOut(BaseModel):
    test_id: int
    title: str
    questions: list[QuestionOut]

class TestTitleUpdate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)

class BulkUpdateQuestionsRequest(BaseModel):
    question_ids: list[int]
    difficulty: int | None = None
    is_closed: bool | None = None

class BulkDeleteQuestionsRequest(BaseModel):
    question_ids: list[int]

class BulkRegenerateQuestionsRequest(BaseModel):
    question_ids: list[int]
    instruction: str | None = None

class BulkConvertQuestionsRequest(BaseModel):
    question_ids: list[int]
    target_type: Literal["open", "closed"]

class PdfExportConfig(BaseModel):
    """
    Configuration options for customized PDF export of a test.
    """

    answer_space_style: Literal["grid", "lines", "blank"] = "blank"
    space_height_cm: float = 3.0

    include_answer_key: bool = False
    generate_variants: bool = False
    variant_mode: Literal["shuffle", "llm_variant"] = "shuffle"
    swap_order_variants: bool | None = None

    student_header: bool = True
    use_scratchpad: bool = False
    mark_multi_choice: bool = True

    @model_validator(mode="after")
    def validate_numeric(self) -> "PdfExportConfig":
        if self.space_height_cm < 1 or self.space_height_cm > 10:
            raise ValueError("space_height_cm must be between 1 and 10")
        return self

__all__ = [
    "BulkConvertQuestionsRequest",
    "BulkDeleteQuestionsRequest",
    "BulkRegenerateQuestionsRequest",
    "BulkUpdateQuestionsRequest",
    "ClosedBreakdown",
    "FileUploadResponse",
    "GenerateParams",
    "PdfExportConfig",
    "QuestionCreate",
    "QuestionOut",
    "QuestionUpdate",
    "TestDetailOut",
    "TestGenerateRequest",
    "TestGenerateResponse",
    "TestOut",
    "TestTitleUpdate",
    "TextInput",
]
