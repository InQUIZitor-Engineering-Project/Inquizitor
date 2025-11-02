from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Iterable

from app.domain.models import Question, Test


class TestRepository(ABC):
    @abstractmethod
    def create(self, test: Test) -> Test:
        raise NotImplementedError

    @abstractmethod
    def add_question(self, test_id: int, question: Question) -> Question:
        raise NotImplementedError

    @abstractmethod
    def get(self, test_id: int) -> Test | None:
        raise NotImplementedError

    @abstractmethod
    def get_with_questions(self, test_id: int) -> Test | None:
        raise NotImplementedError

    @abstractmethod
    def list_for_user(self, user_id: int) -> Iterable[Test]:
        raise NotImplementedError

    @abstractmethod
    def remove(self, test_id: int) -> None:
        raise NotImplementedError


__all__ = ["TestRepository"]

