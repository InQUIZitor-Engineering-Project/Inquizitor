from __future__ import annotations

from enum import Enum


class QuestionDifficulty(Enum):
    EASY = 1
    MEDIUM = 2
    HARD = 3


class ProcessingStatus(Enum):
    PENDING = "pending"
    DONE = "done"
    FAILED = "failed"


class MaterialType(Enum):
    FILE = "file"
    TEXT = "text"


__all__ = ["QuestionDifficulty", "ProcessingStatus", "MaterialType"]

