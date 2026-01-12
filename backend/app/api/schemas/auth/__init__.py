from pydantic import BaseModel

from .verification import (
    PasswordResetConfirm,
    PasswordResetRequest,
    VerificationResponse,
)


class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str


class TokenPayload(BaseModel):
    sub: str | None = None
    exp: int | None = None


class UserCreate(BaseModel):
    email: str
    password: str
    first_name: str | None = None
    last_name: str | None = None


class UserRead(BaseModel):
    id: int
    email: str
    first_name: str | None = None
    last_name: str | None = None
    created_at: str


class RegistrationRequested(BaseModel):
    message: str = "verification_email_sent"


__all__ = [
    "PasswordResetConfirm",
    "PasswordResetRequest",
    "RegistrationRequested",
    "Token",
    "TokenPayload",
    "UserCreate",
    "UserRead",
    "VerificationResponse",
]
