from typing import Optional

from pydantic import BaseModel


class Token(BaseModel):
    access_token: str
    token_type: str


class RegistrationRequested(BaseModel):
    message: str = "verification_email_sent"


class VerificationResponse(Token):
    redirect_url: Optional[str] = None


class TokenData(BaseModel):
    email: Optional[str] = None


class PasswordResetRequest(BaseModel):
    email: str


class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str


__all__ = [
    "Token",
    "RegistrationRequested",
    "VerificationResponse",
    "TokenData",
    "PasswordResetRequest",
    "PasswordResetConfirm",
]

