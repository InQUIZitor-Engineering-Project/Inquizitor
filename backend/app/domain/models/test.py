from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from typing import List, Optional

from .enums import QuestionDifficulty
from .question import Question


@dataclass(slots=True)
class Test:
    """Aggregate root for a test with an associated question collection."""

    id: Optional[int]
    owner_id: int
    title: str
    created_at: Optional[datetime] = None
    questions: List[Question] = field(default_factory=list)

    def __post_init__(self) -> None:
        self.title = self.title.strip() or "Untitled Test"

    def add_question(self, question: Question) -> None:
        self._validate_question(question)
        self.questions.append(question)

    def _validate_question(self, question: Question) -> None:
        if not isinstance(question, Question):
            raise TypeError("Expected Question instance")
        if not isinstance(question.difficulty, QuestionDifficulty):
            raise TypeError("Question difficulty must be a QuestionDifficulty enum")
        if question.is_closed and not question.choices:
            raise ValueError("Closed question must include choices")

    def remove_question(self, question_id: int) -> None:
        self.questions = [q for q in self.questions if q.id != question_id]


__all__ = ["Test"]

