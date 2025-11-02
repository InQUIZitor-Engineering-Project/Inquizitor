# app/schemas/test.py
from typing import List, Optional, Literal
from pydantic import BaseModel, field_validator, model_validator
from datetime import datetime

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
    def exactly_one_source(self):
        if bool(self.text) == bool(self.file_id):
            raise ValueError("Podaj albo text, albo file_id, ale nie oba na raz")
        return self


class TestGenerateResponse(BaseModel):
    test_id: int
    num_questions: int


__all__ = [
    "FileUploadResponse",
    "TextInput",
    "TestOut",
    "GenerateParams",
    "TestGenerateRequest",
    "TestGenerateResponse",
]
