
from pydantic import BaseModel


class PasswordResetRequest(BaseModel):
    email: str


class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str


class VerificationResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str
    redirect_url: str | None = None

