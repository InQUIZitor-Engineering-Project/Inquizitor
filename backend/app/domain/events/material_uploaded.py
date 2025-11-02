from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime

from .base import DomainEvent


@dataclass(frozen=True, slots=True)
class MaterialUploaded(DomainEvent):
    material_id: int
    owner_id: int
    checksum: str

    @staticmethod
    def create(*, material_id: int, owner_id: int, checksum: str) -> "MaterialUploaded":
        return MaterialUploaded(
            occurred_at=datetime.utcnow(),
            material_id=material_id,
            owner_id=owner_id,
            checksum=checksum,
        )


__all__ = ["MaterialUploaded"]

