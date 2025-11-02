from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime

from .base import DomainEvent


@dataclass(frozen=True, slots=True)
class TestGenerated(DomainEvent):
    test_id: int
    owner_id: int
    question_count: int

    @staticmethod
    def create(*, test_id: int, owner_id: int, question_count: int) -> "TestGenerated":
        return TestGenerated(
            occurred_at=datetime.utcnow(),
            test_id=test_id,
            owner_id=owner_id,
            question_count=question_count,
        )


__all__ = ["TestGenerated"]

