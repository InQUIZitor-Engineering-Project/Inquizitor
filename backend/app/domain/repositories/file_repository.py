from __future__ import annotations

from abc import ABC, abstractmethod
from collections.abc import Iterable

from app.domain.models import File


class FileRepository(ABC):
    @abstractmethod
    def add(self, file: File) -> File:
        raise NotImplementedError

    @abstractmethod
    def get(self, file_id: int) -> File | None:
        raise NotImplementedError

    @abstractmethod
    def get_by_lookup(self, owner_id: int, content_hash: str) -> File | None:
        raise NotImplementedError

    @abstractmethod
    def list_for_user(self, user_id: int) -> Iterable[File]:
        raise NotImplementedError

    @abstractmethod
    def remove(self, file_id: int) -> None:
        raise NotImplementedError


__all__ = ["FileRepository"]

