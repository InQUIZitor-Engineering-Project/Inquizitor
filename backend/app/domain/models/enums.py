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

class JobStatus(Enum):
    PENDING = "pending"
    RUNNING = "running"
    DONE = "done"
    FAILED = "failed"

class JobType(Enum):
    TEST_GENERATION = "test_generation"
    PDF_EXPORT = "pdf_export"
    MATERIAL_PROCESSING = "material_processing"
    QUESTIONS_REGENERATION = "questions_regeneration"
    QUESTIONS_CONVERSION = "questions_conversion"


class MaterialType(Enum):
    FILE = "file"
    TEXT = "text"


__all__ = [
    "QuestionDifficulty",
    "ProcessingStatus",
    "MaterialType",
    "JobStatus",
    "JobType",
]

