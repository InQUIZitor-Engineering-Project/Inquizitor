from __future__ import annotations

from dataclasses import dataclass, field
from typing import List, Optional

from .enums import QuestionDifficulty


@dataclass(slots=True)
class Question:
    """Domain question entity decoupled from persistence."""

    id: Optional[int]
    text: str
    is_closed: bool
    difficulty: QuestionDifficulty
    choices: List[str] = field(default_factory=list)
    correct_choices: List[str] = field(default_factory=list)

    def __post_init__(self) -> None:
        self.text = self.text.strip()
        if not self.text:
            raise ValueError("Question text cannot be empty")
        if self.is_closed:
            self._validate_choices()
        else:
            self.choices = []
            self.correct_choices = []

    def _validate_choices(self) -> None:
        if not self.choices:
            raise ValueError("Closed question must define choices")
        if not set(self.correct_choices).issubset(set(self.choices)):
            raise ValueError("Correct choices must be a subset of available choices")

    def set_choices(self, choices: List[str], correct: List[str]) -> None:
        self.choices = [choice.strip() for choice in choices if choice.strip()]
        self.correct_choices = [choice.strip() for choice in correct if choice.strip()]
        self._validate_choices()


__all__ = ["Question"]

