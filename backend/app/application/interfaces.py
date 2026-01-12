"""Interfaces and protocols used by the application layer."""

from __future__ import annotations

from typing import Any, Protocol

from app.domain.repositories import (
    FileRepository,
    JobRepository,
    MaterialRepository,
    PasswordResetTokenRepository,
    PendingVerificationRepository,
    SupportRepository,
    TestRepository,
    UserRepository,
)
from app.domain.services import FileStorage, OCRService, QuestionGenerator


class UnitOfWork(Protocol):
    @property
    def users(self) -> UserRepository:
        ...

    @property
    def tests(self) -> TestRepository:
        ...

    @property
    def files(self) -> FileRepository:
        ...

    @property
    def materials(self) -> MaterialRepository:
        ...

    @property
    def jobs(self) -> JobRepository:
        ...

    @property
    def pending_verifications(self) -> PendingVerificationRepository:
        ...

    @property
    def password_reset_tokens(self) -> PasswordResetTokenRepository:
        ...

    @property
    def support_tickets(self) -> SupportRepository:
        ...

    def __enter__(self) -> UnitOfWork:
        ...

    def __exit__(
        self,
        exc_type: type[BaseException] | None,
        exc: BaseException | None,
        tb: Any,
    ) -> None:
        ...

    def commit(self) -> None:
        ...

    def rollback(self) -> None:
        ...


__all__ = ["FileStorage", "OCRService", "QuestionGenerator", "UnitOfWork"]

