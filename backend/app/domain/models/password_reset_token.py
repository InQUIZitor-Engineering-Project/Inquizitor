from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from typing import Optional


@dataclass(slots=True)
class PasswordResetToken:
    id: Optional[int]
    email: str
    token_hash: str
    expires_at: datetime
    created_at: datetime


__all__ = ["PasswordResetToken"]
<<<<<<< .merge_file_UUx1sN
=======

>>>>>>> .merge_file_UmxkT3
