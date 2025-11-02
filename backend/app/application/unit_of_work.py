from __future__ import annotations

from contextlib import AbstractContextManager
from typing import Callable, Optional

from sqlalchemy.orm import Session

from app.domain.repositories import (
    FileRepository,
    MaterialRepository,
    TestRepository,
    UserRepository,
)
from app.infrastructure.persistence.sqlmodel import (
    SqlModelFileRepository,
    SqlModelMaterialRepository,
    SqlModelTestRepository,
    SqlModelUserRepository,
)


class SqlAlchemyUnitOfWork(AbstractContextManager):
    def __init__(self, session_factory: Callable[[], Session]):
        self._session_factory = session_factory
        self.session: Optional[Session] = None
        self.users: Optional[UserRepository] = None
        self.tests: Optional[TestRepository] = None
        self.files: Optional[FileRepository] = None
        self.materials: Optional[MaterialRepository] = None

    def __enter__(self) -> "SqlAlchemyUnitOfWork":
        self.session = self._session_factory()
        self.session.begin()
        self.users = SqlModelUserRepository(self.session)
        self.tests = SqlModelTestRepository(self.session)
        self.files = SqlModelFileRepository(self.session)
        self.materials = SqlModelMaterialRepository(self.session)
        return self

    def __exit__(self, exc_type, exc, tb) -> None:
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

