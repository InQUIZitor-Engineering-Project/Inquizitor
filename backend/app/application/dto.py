"""Utilities to map domain entities to API schemas."""

from __future__ import annotations

from typing import Dict, Iterable, List

from app.api.schemas.materials import MaterialOut
from app.api.schemas.tests import TestOut, TestDetailOut, QuestionOut
from app.api.schemas.users import UserRead
from app.domain.models import Material, Question, Test, User


def to_user_read(user: User) -> UserRead:
    return UserRead.model_validate(user, from_attributes=True)


def to_test_out(test: Test) -> TestOut:
    return TestOut.model_validate(test, from_attributes=True)


def to_question_dict(question: Question) -> Dict:
    return {
        "id": question.id,
        "text": question.text,
        "is_closed": question.is_closed,
        "difficulty": question.difficulty.value,
        "choices": list(question.choices),
        "correct_choices": list(question.correct_choices),
    }


def to_question_out(question: Question) -> QuestionOut:
    return QuestionOut(
        id=question.id,
        text=question.text,
        is_closed=question.is_closed,
        difficulty=question.difficulty.value,
        choices=list(question.choices) if question.choices else None,
        correct_choices=list(question.correct_choices) if question.correct_choices else None,
    )


def to_test_detail(test: Test) -> TestDetailOut:
    return TestDetailOut(
        test_id=test.id,
        title=test.title,
        questions=[to_question_out(question) for question in test.questions],
    )


def to_test_response(test: Test) -> Dict:
    return {
        "test_id": test.id,
        "title": test.title,
        "questions": [to_question_dict(question) for question in test.questions],
    }


def to_material_out(material: Material) -> MaterialOut:
    return MaterialOut(
        id=material.id,
        file_id=material.file.id,
        filename=material.file.filename,
        mime_type=material.mime_type,
        size_bytes=material.size_bytes,
        checksum=material.checksum,
        processing_status=material.status.value,
        created_at=material.file.uploaded_at,
    )


def to_materials_out(materials: Iterable[Material]) -> List[MaterialOut]:
    return [to_material_out(material) for material in materials]


__all__ = [
    "to_user_read",
    "to_test_out",
    "to_question_dict",
    "to_question_out",
    "to_test_response",
    "to_test_detail",
    "to_material_out",
    "to_materials_out",
]

