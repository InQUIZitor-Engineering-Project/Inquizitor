from __future__ import annotations

from typing import Protocol

from app.api.schemas.tests import GenerateParams
from app.domain.models import Question


class QuestionGenerator(Protocol):
    def generate(
        self, *, source_text: str, params: GenerateParams
    ) -> tuple[str | None, list[Question]]:
        ...


__all__ = ["QuestionGenerator"]

