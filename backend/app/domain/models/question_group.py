from __future__ import annotations

from dataclasses import dataclass


@dataclass(slots=True)
class QuestionGroup:
    """Domain entity for a group of questions within a test."""

    id: int | None
    test_id: int
    label: str
    position: int = 0


__all__ = ["QuestionGroup"]
