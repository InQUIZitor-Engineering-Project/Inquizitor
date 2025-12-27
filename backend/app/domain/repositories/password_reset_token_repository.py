from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Optional

from app.domain.models.password_reset_token import PasswordResetToken


class PasswordResetTokenRepository(ABC):
    @abstractmethod
    def upsert(self, token: PasswordResetToken) -> PasswordResetToken:
        raise NotImplementedError

    @abstractmethod
    def get_by_email(self, email: str) -> Optional[PasswordResetToken]:
        raise NotImplementedError

    @abstractmethod
    def get_by_token_hash(self, token_hash: str) -> Optional[PasswordResetToken]:
        raise NotImplementedError

    @abstractmethod
    def delete_by_email(self, email: str) -> None:
        raise NotImplementedError


__all__ = ["PasswordResetTokenRepository"]

