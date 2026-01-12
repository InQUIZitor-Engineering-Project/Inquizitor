from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime


@dataclass(slots=True)
class RefreshToken:
    """Domain entity representing a refresh token."""

    id: int | None
    user_id: int
    token_hash: str
    expires_at: datetime
    created_at: datetime
    revoked_at: datetime | None = None

    @property
    def is_valid(self) -> bool:
        return (
            self.revoked_at is None
            and self.expires_at > datetime.utcnow()
        )

    def revoke(self) -> None:
        self.revoked_at = datetime.utcnow()


__all__ = ["RefreshToken"]

