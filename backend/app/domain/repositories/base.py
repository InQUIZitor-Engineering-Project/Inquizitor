from __future__ import annotations

from abc import ABC, abstractmethod
from collections.abc import Iterable
from typing import Generic, TypeVar

T = TypeVar("T")


class Repository(ABC, Generic[T]):
    """Bazowy interfejs repozytorium domenowego."""

    @abstractmethod
    def add(self, entity: T) -> T:
        raise NotImplementedError

    @abstractmethod
    def get(self, entity_id: int) -> T | None:
        raise NotImplementedError

    @abstractmethod
    def remove(self, entity_id: int) -> None:
        raise NotImplementedError

    @abstractmethod
    def list(self) -> Iterable[T]:
        raise NotImplementedError


__all__ = ["Repository"]

