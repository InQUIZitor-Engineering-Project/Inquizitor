from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Generic, Iterable, Optional, TypeVar


T = TypeVar("T")


class Repository(ABC, Generic[T]):
    """Bazowy interfejs repozytorium domenowego."""

    @abstractmethod
    def add(self, entity: T) -> T:
        raise NotImplementedError

    @abstractmethod
    def get(self, entity_id: int) -> Optional[T]:
        raise NotImplementedError

    @abstractmethod
    def remove(self, entity_id: int) -> None:
        raise NotImplementedError

    @abstractmethod
    def list(self) -> Iterable[T]:
        raise NotImplementedError


__all__ = ["Repository"]

