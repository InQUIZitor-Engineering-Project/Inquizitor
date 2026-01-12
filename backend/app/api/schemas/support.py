from datetime import datetime

from pydantic import BaseModel, EmailStr, Field

from app.db.models import SupportCategory, SupportStatus


class SupportTicketCreate(BaseModel):
    email: EmailStr
    first_name: str | None = Field(None, max_length=50)
    last_name: str | None = Field(None, max_length=50)
    category: SupportCategory = SupportCategory.general
    subject: str = Field(..., max_length=200)
    message: str = Field(..., min_length=10)
    turnstile_token: str | None = None

class SupportTicketRead(BaseModel):
    id: int
    user_id: int | None
    email: str
    first_name: str | None
    last_name: str | None
    category: SupportCategory
    subject: str
    message: str
    status: SupportStatus
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

