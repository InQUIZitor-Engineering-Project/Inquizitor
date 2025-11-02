# app/schemas/test.py
from typing import List, Optional, Literal
from pydantic import BaseModel, field_validator, model_validator
from datetime import datetime
from typing import List, Optional
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
            raise ValueError("Sum(a,b,c) musi równać się num_closed + num_open")
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
            return v
        if isinstance(v, str):
            try:
                j = json.loads(v)
                if isinstance(j, list):
                    return j
                return [str(j)]
            except Exception:
                return [v.strip().strip('"').strip("'")]
        return [str(v)]

class TestDetailOut(BaseModel):
    test_id: int
    title: str
    questions: List[QuestionOut]