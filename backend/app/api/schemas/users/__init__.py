# app/schemas/user.py
from datetime import datetime

from pydantic import BaseModel, EmailStr


class UserBase(BaseModel):
    email: EmailStr


class UserCreate(UserBase):
    password: str
    first_name: str
    last_name: str


class UserRead(UserBase):
    id: int
    first_name: str
    last_name: str
    created_at: datetime

    class Config:
        from_attributes = True


__all__ = [
    "UserBase",
    "UserCreate",
    "UserRead",
]
