from __future__ import annotations

from collections.abc import Callable
from contextlib import AbstractContextManager
from typing import Any

from sqlmodel import Session

from app.domain.repositories import (
    FileRepository,
    JobRepository,
    MaterialRepository,
    PasswordResetTokenRepository,
    PendingVerificationRepository,
    TestRepository,
    UserRepository,
)
from app.infrastructure.persistence.sqlmodel import (
    SqlModelFileRepository,
    SqlModelJobRepository,
    SqlModelMaterialRepository,
    SqlModelPasswordResetTokenRepository,
    SqlModelPendingVerificationRepository,
    SqlModelTestRepository,
    SqlModelUserRepository,
)


class SqlAlchemyUnitOfWork(AbstractContextManager["SqlAlchemyUnitOfWork"]):
    def __init__(self, session_factory: Callable[[], Session]):
        self._session_factory = session_factory
        self.session: Session | None = None
        self._users: UserRepository | None = None
        self._tests: TestRepository | None = None
        self._files: FileRepository | None = None
        self._materials: MaterialRepository | None = None
        self._jobs: JobRepository | None = None
        self._pending_verifications: PendingVerificationRepository | None = None
        self._password_reset_tokens: PasswordResetTokenRepository | None = None

    @property
    def users(self) -> UserRepository:
        if self._users is None:
            raise RuntimeError("UnitOfWork not initialized")
        return self._users

    @property
    def tests(self) -> TestRepository:
        if self._tests is None:
            raise RuntimeError("UnitOfWork not initialized")
        return self._tests

    @property
    def files(self) -> FileRepository:
        if self._files is None:
            raise RuntimeError("UnitOfWork not initialized")
        return self._files

    @property
    def materials(self) -> MaterialRepository:
        if self._materials is None:
            raise RuntimeError("UnitOfWork not initialized")
        return self._materials

    @property
    def jobs(self) -> JobRepository:
        if self._jobs is None:
            raise RuntimeError("UnitOfWork not initialized")
        return self._jobs

    @property
    def pending_verifications(self) -> PendingVerificationRepository:
        if self._pending_verifications is None:
            raise RuntimeError("UnitOfWork not initialized")
        return self._pending_verifications

    @property
    def password_reset_tokens(self) -> PasswordResetTokenRepository:
        if self._password_reset_tokens is None:
            raise RuntimeError("UnitOfWork not initialized")
        return self._password_reset_tokens

    def __enter__(self) -> SqlAlchemyUnitOfWork:
        self.session = self._session_factory()
        self.session.begin()
        self._users = SqlModelUserRepository(self.session)
        self._tests = SqlModelTestRepository(self.session)
        self._files = SqlModelFileRepository(self.session)
        self._materials = SqlModelMaterialRepository(self.session)
        self._jobs = SqlModelJobRepository(self.session)
        self._pending_verifications = SqlModelPendingVerificationRepository(
            self.session
        )
        self._password_reset_tokens = SqlModelPasswordResetTokenRepository(
            self.session
        )
        return self

    def __exit__(
        self,
        exc_type: type[BaseException] | None,
        exc: BaseException | None,
        tb: Any,
    ) -> None:
        try:
            if exc_type is None:
                self.commit()
            else:
                self.rollback()
        finally:
            if self.session:
                self.session.close()

    def commit(self) -> None:
        if self.session is None:
            raise RuntimeError("UnitOfWork session is not initialized")
        self.session.commit()

    def rollback(self) -> None:
        if self.session is None:
            raise RuntimeError("UnitOfWork session is not initialized")
        self.session.rollback()


__all__ = ["SqlAlchemyUnitOfWork"]

