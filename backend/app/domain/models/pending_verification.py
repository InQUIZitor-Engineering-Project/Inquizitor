from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from typing import Optional


@dataclass(slots=True)
class PendingVerification:
    id: Optional[int]
    email: str
    hashed_password: str
    first_name: Optional[str]
    last_name: Optional[str]
    token_hash: str
    expires_at: datetime
    created_at: datetime


__all__ = ["PendingVerification"]
