# app/schemas/user.py
import re
from datetime import datetime

from pydantic import BaseModel, EmailStr, field_validator


class UserBase(BaseModel):
    email: EmailStr


class UserCreate(UserBase):
    password: str
    first_name: str
    last_name: str
    turnstile_token: str | None = None

    @field_validator("password")
    @classmethod
    def password_complexity(cls, v):
        if len(v) < 8:
            raise ValueError("Hasło musi mieć co najmniej 8 znaków")
        if not re.search(r"[A-Za-z]", v):
            raise ValueError("Hasło musi zawierać co najmniej jedną literę")
        if not re.search(r"\d", v):
            raise ValueError("Hasło musi zawierać co najmniej jedną cyfrę")
        if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", v):
            raise ValueError("Hasło musi zawierać co najmniej jeden symbol specjalny")
        return v


class UserRead(UserBase):
    id: int
    first_name: str
    last_name: str
    created_at: datetime

    class Config:
        from_attributes = True

class UserStatistics(BaseModel):
    total_tests: int
    total_questions: int
    total_files: int
    avg_questions_per_test: float
    last_test_created_at: datetime | None

    total_closed_questions: int
    total_open_questions: int
    total_easy_questions: int
    total_medium_questions: int
    total_hard_questions: int

class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str

__all__ = [
    "ChangePasswordRequest",
    "UserBase",
    "UserCreate",
    "UserRead",
    "UserStatistics",
]
