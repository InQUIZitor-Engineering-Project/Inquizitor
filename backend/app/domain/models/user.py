from __future__ import annotations

import re
from dataclasses import dataclass
from datetime import datetime
from typing import Optional


EMAIL_REGEX = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


@dataclass(slots=True)
class User:
    """Domain entity representing an application user."""

    id: Optional[int]
    email: str
    hashed_password: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    created_at: Optional[datetime] = None

    def __post_init__(self) -> None:
        self.email = self.email.strip().lower()
        self._validate_email(self.email)
        if self.first_name:
            self.first_name = self.first_name.strip()
        if self.last_name:
            self.last_name = self.last_name.strip()

    @staticmethod
    def _validate_email(value: str) -> None:
        if not EMAIL_REGEX.match(value):
            raise ValueError("Invalid email address format")

    def update_profile(self, *, first_name: Optional[str], last_name: Optional[str]) -> None:
        if first_name is not None:
            self.first_name = first_name.strip() or None
        if last_name is not None:
            self.last_name = last_name.strip() or None


__all__ = ["User"]

