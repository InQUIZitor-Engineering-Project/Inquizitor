from __future__ import annotations

from abc import ABC, abstractmethod

from app.domain.models import User


class UserRepository(ABC):
    @abstractmethod
    def add(self, user: User) -> User:
        raise NotImplementedError

    @abstractmethod
    def get(self, user_id: int) -> User | None:
        raise NotImplementedError

    @abstractmethod
    def get_by_email(self, email: str) -> User | None:
        raise NotImplementedError

    @abstractmethod
    def remove(self, user_id: int) -> None:
        raise NotImplementedError


__all__ = ["UserRepository"]

