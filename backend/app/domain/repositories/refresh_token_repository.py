from __future__ import annotations

from abc import ABC, abstractmethod

from app.domain.models import RefreshToken


class RefreshTokenRepository(ABC):
    @abstractmethod
    def add(self, token: RefreshToken) -> RefreshToken:
        raise NotImplementedError

    @abstractmethod
    def update(self, token: RefreshToken) -> RefreshToken:
        raise NotImplementedError

    @abstractmethod
    def get_by_token_hash(self, token_hash: str) -> RefreshToken | None:
        raise NotImplementedError

    @abstractmethod
    def revoke_all_for_user(self, user_id: int) -> None:
        raise NotImplementedError

    @abstractmethod
    def remove_expired(self) -> None:
        raise NotImplementedError


__all__ = ["RefreshTokenRepository"]

