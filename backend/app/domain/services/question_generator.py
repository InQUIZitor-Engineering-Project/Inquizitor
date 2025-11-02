from __future__ import annotations

from typing import List, Protocol

from app.domain.models import Question
from app.api.schemas.tests import GenerateParams


class QuestionGenerator(Protocol):
    def generate(self, *, source_text: str, params: GenerateParams) -> List[Question]:
        ...


__all__ = ["QuestionGenerator"]

