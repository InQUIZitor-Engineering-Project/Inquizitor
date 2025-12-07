"""Interfaces and protocols used by the application layer."""

from __future__ import annotations

from typing import Protocol

from app.domain.repositories import (
    FileRepository,
    MaterialRepository,
    TestRepository,
    UserRepository,
    JobRepository,
    PendingVerificationRepository,
)
from app.domain.services import FileStorage, OCRService, QuestionGenerator


class UnitOfWork(Protocol):
    users: UserRepository
    tests: TestRepository
    files: FileRepository
    materials: MaterialRepository
    jobs: JobRepository
    pending_verifications: PendingVerificationRepository

    def __enter__(self) -> "UnitOfWork":
        ...

    def __exit__(self, exc_type, exc, tb) -> None:
        ...

    def commit(self) -> None:
        ...

    def rollback(self) -> None:
        ...


__all__ = ["UnitOfWork", "FileStorage", "OCRService", "QuestionGenerator"]

