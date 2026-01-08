from pydantic import BaseModel


class Token(BaseModel):
    access_token: str
    token_type: str


class RegistrationRequested(BaseModel):
    message: str = "verification_email_sent"


class VerificationResponse(Token):
    redirect_url: str | None = None


class TokenData(BaseModel):
    email: str | None = None


class PasswordResetRequest(BaseModel):
    email: str


class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str


class PasswordResetRequest(BaseModel):
    email: str


class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str


__all__ = [
    "PasswordResetConfirm",
    "PasswordResetRequest",
    "RegistrationRequested",
    "Token",
    "TokenData",
    "VerificationResponse",
]

