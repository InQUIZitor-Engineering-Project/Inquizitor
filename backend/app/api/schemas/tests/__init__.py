# app/schemas/test.py
from typing import List, Optional, Literal
from pydantic import BaseModel, field_validator, model_validator
from datetime import datetime
import json

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
    num_closed: int
    num_open: int
    closed_types: Optional[List[Literal["true_false", "single_choice", "multi_choice"]]] = None
    easy: int = 0
    medium: int = 0
    hard: int = 0

    @model_validator(mode="after")
    def check_difficulty_sum(self):
        total = self.easy + self.medium + self.hard
        if total != self.num_closed + self.num_open:
            raise ValueError("The sum of easy, medium, and hard must equal num_closed + num_open")
        return self


class TestGenerateRequest(GenerateParams):
    text: Optional[str] = None
    file_id: Optional[int] = None

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
    choices: Optional[List[str]] = None
    correct_choices: Optional[List[str]] = None

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


class TestDetailOut(BaseModel):
    test_id: int
    title: str
    questions: List[QuestionOut]


__all__ = [
    "FileUploadResponse",
    "TextInput",
    "TestOut",
    "GenerateParams",
    "TestGenerateRequest",
    "TestGenerateResponse",
    "QuestionOut",
    "TestDetailOut",
]
