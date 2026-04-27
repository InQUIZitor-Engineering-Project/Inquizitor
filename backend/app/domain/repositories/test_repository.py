from __future__ import annotations

from abc import ABC, abstractmethod
from collections.abc import Iterable

from app.domain.models import Question, QuestionGroup, Test


class TestRepository(ABC):
    @abstractmethod
    def create(self, test: Test) -> Test:
        raise NotImplementedError

    @abstractmethod
    def add_question(self, test_id: int, question: Question, group_id: int) -> Question:
        raise NotImplementedError

    @abstractmethod
    def bulk_add_questions(
        self, test_id: int, questions: list[Question], group_id: int
    ) -> list[Question]:
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

    @abstractmethod
    def reorder_questions(self, test_id: int, question_ids: list[int]) -> None:
        """Update question positions to match the order of question_ids."""
        raise NotImplementedError

    # --- Question groups ---

    @abstractmethod
    def get_groups_for_test(self, test_id: int) -> list[QuestionGroup]:
        raise NotImplementedError

    @abstractmethod
    def get_group(self, group_id: int) -> QuestionGroup | None:
        raise NotImplementedError

    @abstractmethod
    def create_group(
        self, test_id: int, label: str, position: int = 0
    ) -> QuestionGroup:
        raise NotImplementedError

    @abstractmethod
    def update_group(
        self, group_id: int, *, label: str | None = None, position: int | None = None
    ) -> QuestionGroup | None:
        raise NotImplementedError

    @abstractmethod
    def delete_group(self, group_id: int) -> None:
        """Delete all questions in the group, then the group. No move."""
        raise NotImplementedError

    @abstractmethod
    def duplicate_group(
        self, test_id: int, group_id: int
    ) -> tuple[QuestionGroup, list[Question]]:
        """New group with same label + ' (kopia)', copy all questions. Returns it."""
        raise NotImplementedError

    @abstractmethod
    def assign_questions_to_group(self, question_ids: list[int], group_id: int) -> None:
        raise NotImplementedError


__all__ = ["TestRepository"]

