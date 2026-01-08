from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime


@dataclass(slots=True)
class PasswordResetToken:
    id: int | None
    email: str
    token_hash: str
    expires_at: datetime
    created_at: datetime


__all__ = ["PasswordResetToken"]
