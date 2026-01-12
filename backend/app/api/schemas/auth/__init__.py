from pydantic import BaseModel

from app.api.schemas.users import UserCreate, UserRead

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
