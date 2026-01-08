from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime


@dataclass(slots=True)
class PendingVerification:
    id: int | None
    email: str
    hashed_password: str
    first_name: str | None
    last_name: str | None
    token_hash: str
    expires_at: datetime
    created_at: datetime


__all__ = ["PendingVerification"]
