"""Utilities to map domain entities to API schemas."""

from __future__ import annotations

import json
from collections.abc import Iterable
from typing import Any

from app.api.schemas.jobs import JobOut
from app.api.schemas.materials import MaterialOut
from app.api.schemas.tests import QuestionOut, TestDetailOut, TestOut
from app.api.schemas.users import UserRead
from app.domain.models import Job, Material, Question, Test, User


def _as_list(value: Any) -> list[str] | None:
    """
    Zwraca listę stringów albo None.
    - Jeśli value to list -> rzutuje elementy na str.
    - Jeśli value to string JSON-owy z listą -> parsuje do listy.
    - Jeśli value to zwykły string -> zwraca jednoelementową listę.
    - Jeśli None -> None.
    Nigdy nie zwraca listy znaków.
    """
    if value is None:
        return None
    if isinstance(value, list):
        return [str(x) for x in value]
    if isinstance(value, str):
        s = value.strip()
        # spróbuj sparsować JSON listę
        try:
            parsed = json.loads(s)
            if isinstance(parsed, list):
                return [str(x) for x in parsed]
            # np. "Prawda" -> ["Prawda"]
            return [str(parsed)]
        except Exception:
            # zwykły string -> jednoelementowa lista
            return [s.strip('"').strip("'")]
    # inne typy (np. tuple) -> opakuj w listę
    return [str(value)]


def to_user_read(user: User) -> UserRead:
    return UserRead.model_validate(user, from_attributes=True)


def to_test_out(test: Test) -> TestOut:
    return TestOut.model_validate(test, from_attributes=True)


def to_question_dict(question: Question) -> dict:
    return {
        "id": question.id,
        "text": question.text,
        "is_closed": question.is_closed,
        "difficulty": getattr(question.difficulty, "value", question.difficulty),
        "choices": _as_list(getattr(question, "choices", None)) or [],
        "correct_choices": _as_list(getattr(question, "correct_choices", None)) or [],
    }


def to_question_out(question: Question) -> QuestionOut:
    return QuestionOut(
        id=question.id,
        text=question.text,
        is_closed=question.is_closed,
        difficulty=getattr(question.difficulty, "value", question.difficulty),
        choices=_as_list(getattr(question, "choices", None)),
        correct_choices=_as_list(getattr(question, "correct_choices", None)),
    )


def to_test_detail(test: Test) -> TestDetailOut:
    return TestDetailOut(
        test_id=test.id,
        title=test.title,
        questions=[to_question_out(q) for q in test.questions],
    )


def to_test_response(test: Test) -> dict:
    return {
        "test_id": test.id,
        "title": test.title,
        "questions": [to_question_dict(q) for q in test.questions],
    }


def to_material_out(material: Material) -> MaterialOut:
    return MaterialOut(
        id=material.id,
        file_id=material.file.id,
        filename=material.file.filename,
        mime_type=material.mime_type,
        size_bytes=material.size_bytes,
        page_count=material.page_count,
        checksum=material.checksum,
        processing_status=material.status.value,
        created_at=material.file.uploaded_at,
        extracted_text=material.extracted_text,
        processing_error=material.processing_error,
    )


def to_materials_out(materials: Iterable[Material]) -> list[MaterialOut]:
    return [to_material_out(m) for m in materials]


def to_job_out(job: Job) -> JobOut:
    return JobOut(
        id=job.id,
        owner_id=job.owner_id,
        job_type=job.job_type.value,
        status=job.status.value,
        payload=job.payload or {},
        result=job.result,
        error=job.error,
        created_at=job.created_at,
        updated_at=job.updated_at,
    )


__all__ = [
    "to_job_out",
    "to_material_out",
    "to_materials_out",
    "to_question_dict",
    "to_question_out",
    "to_test_detail",
    "to_test_out",
    "to_test_response",
    "to_user_read",
]
