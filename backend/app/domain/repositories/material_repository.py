from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Iterable

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


__all__ = ["MaterialRepository"]

