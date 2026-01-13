from __future__ import annotations

from typing import Any, Protocol

from app.api.schemas.tests import GenerateParams
from app.domain.models import Question


class QuestionGenerator(Protocol):
    def generate(
        self, *, source_text: str, params: GenerateParams
    ) -> tuple[str | None, list[Question], dict[str, Any]]:
        ...


__all__ = ["QuestionGenerator"]

