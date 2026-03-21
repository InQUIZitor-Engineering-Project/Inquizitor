from __future__ import annotations

from abc import ABC, abstractmethod
from collections.abc import Iterable

from app.domain.models import Material


class MaterialRepository(ABC):
    @abstractmethod
    def add(self, material: Material) -> Material:
        raise NotImplementedError

    @abstractmethod
    def get(self, material_id: int) -> Material | None:
        raise NotImplementedError

    @abstractmethod
    def list_for_user(self, user_id: int) -> Iterable[Material]:
        raise NotImplementedError

    @abstractmethod
    def update(self, material: Material) -> Material:
        raise NotImplementedError

    @abstractmethod
    def remove(self, material_id: int) -> None:
        raise NotImplementedError
    
    @abstractmethod
    def get_by_file_id(self, file_id: int) -> Material | None:
        raise NotImplementedError

    @abstractmethod
    def get_by_checksum(self, owner_id: int, checksum: str) -> Material | None:
        """Find a material by checksum for the given owner."""
        raise NotImplementedError

    @abstractmethod
    def update_analysis(self, material: Material) -> Material:
        """Update only analysis fields; preserves processing_status and thumbnail."""
        raise NotImplementedError

    @abstractmethod
    def list_without_thumbnail(self) -> Iterable[Material]:
        """List materials with no thumbnail and an associated file (backfill)."""
        raise NotImplementedError


__all__ = ["MaterialRepository"]
