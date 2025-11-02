from __future__ import annotations

from datetime import datetime
from pathlib import Path
from typing import Iterable, Optional

from app.db import models as db_models
from app.domain.models import File, Material, Question, Test, User
from app.domain.models.enums import ProcessingStatus, QuestionDifficulty


def user_to_domain(row: db_models.User) -> User:
    return User(
        id=row.id,
        email=row.email,
        hashed_password=row.hashed_password,
        first_name=row.first_name,
        last_name=row.last_name,
        created_at=row.created_at,
    )


def user_to_row(user: User) -> db_models.User:
    return db_models.User(
        id=user.id,
        email=user.email,
        hashed_password=user.hashed_password,
        first_name=user.first_name,
        last_name=user.last_name,
        created_at=user.created_at or datetime.utcnow(),
    )


def question_to_domain(row: db_models.Question) -> Question:
    return Question(
        id=row.id,
        text=row.text,
        is_closed=row.is_closed,
        difficulty=QuestionDifficulty(row.difficulty),
        choices=row.choices or [],
        correct_choices=row.correct_choices or [],
    )


def question_to_row(question: Question, test_id: int) -> db_models.Question:
    return db_models.Question(
        id=question.id,
        test_id=test_id,
        text=question.text,
        is_closed=question.is_closed,
        difficulty=question.difficulty.value,
        choices=question.choices or None,
        correct_choices=question.correct_choices or None,
    )


def test_to_domain(row: db_models.Test, questions: Optional[Iterable[db_models.Question]] = None) -> Test:
    question_models = list(questions) if questions is not None else list(row.questions or [])
    return Test(
        id=row.id,
        owner_id=row.owner_id,
        title=row.title or "Untitled Test",
        created_at=row.created_at,
        questions=[question_to_domain(q) for q in question_models],
    )


def test_to_row(test: Test) -> db_models.Test:
    return db_models.Test(
        id=test.id,
        owner_id=test.owner_id,
        title=test.title,
        created_at=test.created_at or datetime.utcnow(),
    )


def file_to_domain(row: db_models.File) -> File:
    return File(
        id=row.id,
        owner_id=row.owner_id,
        filename=row.filename,
        stored_path=Path(row.filepath),
        uploaded_at=row.uploaded_at,
    )


def file_to_row(file: File) -> db_models.File:
    return db_models.File(
        id=file.id,
        owner_id=file.owner_id,
        filename=file.filename,
        filepath=str(file.stored_path),
        uploaded_at=file.uploaded_at or datetime.utcnow(),
    )


def material_to_domain(row: db_models.Material, file_row: Optional[db_models.File] = None) -> Material:
    file_model = file_row or row.file
    if file_model is None:
        raise ValueError("Material row must include related file")

    status_value = (
        row.processing_status.value
        if isinstance(row.processing_status, db_models.ProcessingStatus)
        else str(row.processing_status)
    )

    return Material(
        id=row.id,
        owner_id=row.owner_id,
        file=file_to_domain(file_model),
        mime_type=row.mime_type,
        size_bytes=row.size_bytes,
        checksum=row.checksum,
        status=ProcessingStatus(status_value),
        extracted_text=row.extracted_text,
        processing_error=row.processing_error,
    )


def material_to_row(material: Material) -> db_models.Material:
    if material.file is None or material.file.id is None:
        raise ValueError("Material requires a persisted file with an id")

    return db_models.Material(
        id=material.id,
        owner_id=material.owner_id,
        file_id=material.file.id,
        mime_type=material.mime_type,
        size_bytes=material.size_bytes,
        checksum=material.checksum,
        extracted_text=material.extracted_text,
        processing_status=material.status.value,
        processing_error=material.processing_error,
    )


__all__ = [
    "user_to_domain",
    "user_to_row",
    "question_to_domain",
    "question_to_row",
    "test_to_domain",
    "test_to_row",
    "file_to_domain",
    "file_to_row",
    "material_to_domain",
    "material_to_row",
]

