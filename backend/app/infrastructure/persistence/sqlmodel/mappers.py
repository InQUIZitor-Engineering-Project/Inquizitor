from __future__ import annotations

from collections.abc import Iterable
from datetime import datetime
from pathlib import Path

from app.db import models as db_models
from app.domain.models import (
    File,
    Job,
    Material,
    PasswordResetToken,
    PendingVerification,
    Question,
    Test,
    User,
)
from app.domain.models.enums import (
    JobStatus,
    JobType,
    ProcessingStatus,
    QuestionDifficulty,
)


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
    choices = row.choices or []
    correct_choices = row.correct_choices or []
    
    # Self-healing logic for corrupted DB data (e.g. from LLM mismatch)
    if row.is_closed:
        # 1. Clean whitespace
        choices = [str(c).strip() for c in choices if str(c).strip()]
        correct_choices = [str(c).strip() for c in correct_choices if str(c).strip()]
        
        # 2. Ensure consistency
        if choices:
            valid_correct = [c for c in correct_choices if c in choices]
            if not valid_correct:
                valid_correct = [choices[0]]
            correct_choices = valid_correct
        elif correct_choices:
            choices = correct_choices[:]

    choices = row.choices or []
    correct_choices = row.correct_choices or []
    
    # Self-healing logic for corrupted DB data (e.g. from LLM mismatch)
    if row.is_closed:
        # 1. Clean whitespace
        choices = [str(c).strip() for c in choices if str(c).strip()]
        correct_choices = [str(c).strip() for c in correct_choices if str(c).strip()]
        
        # 2. Ensure consistency
        if choices:
            valid_correct = [c for c in correct_choices if c in choices]
            if not valid_correct:
                valid_correct = [choices[0]]
            correct_choices = valid_correct
        elif correct_choices:
            choices = correct_choices[:]

    return Question(
        id=row.id,
        text=row.text,
        is_closed=row.is_closed,
        difficulty=QuestionDifficulty(row.difficulty),
        choices=choices,
        correct_choices=correct_choices,
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


def test_to_domain(
    row: db_models.Test, questions: Iterable[db_models.Question] | None = None
) -> Test:
    question_models = (
        list(questions) if questions is not None else list(row.questions or [])
    )
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
        content_hash=row.content_hash,
    )


def file_to_row(file: File) -> db_models.File:
    if file.content_hash is None:
        raise ValueError("content_hash is required when creating a File")
    return db_models.File(
        id=file.id,
        owner_id=file.owner_id,
        filename=file.filename,
        filepath=str(file.stored_path),
        uploaded_at=file.uploaded_at or datetime.utcnow(),
        content_hash=file.content_hash,
    )


def material_to_domain(
    row: db_models.Material, file_row: db_models.File | None = None
) -> Material:
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


def job_to_domain(row: db_models.Job) -> Job:
    status_value = (
        row.status.value
        if isinstance(row.status, db_models.JobStatus)
        else str(row.status)
    )
    type_value = (
        row.job_type.value
        if isinstance(row.job_type, db_models.JobType)
        else str(row.job_type)
    )
    return Job(
        id=row.id,
        owner_id=row.owner_id,
        job_type=JobType(type_value),
        status=JobStatus(status_value),
        payload=row.payload or {},
        result=row.result or None,
        error=row.error,
        created_at=row.created_at,
        updated_at=row.updated_at,
    )


def job_to_row(job: Job) -> db_models.Job:
    return db_models.Job(
        id=job.id,
        owner_id=job.owner_id,
        job_type=job.job_type.value,
        status=job.status.value,
        payload=job.payload or {},
        result=job.result or None,
        error=job.error,
        created_at=job.created_at or datetime.utcnow(),
        updated_at=job.updated_at or datetime.utcnow(),
    )


def pending_verification_to_row(
    p: PendingVerification,
) -> db_models.PendingEmailVerification:
    return db_models.PendingEmailVerification(
        id=p.id,
        email=p.email,
        hashed_password=p.hashed_password,
        first_name=p.first_name,
        last_name=p.last_name,
        token_hash=p.token_hash,
        expires_at=p.expires_at,
        created_at=p.created_at or datetime.utcnow(),
    )


def pending_verification_to_domain(
    row: db_models.PendingEmailVerification,
) -> PendingVerification:
    return PendingVerification(
        id=row.id,
        email=row.email,
        hashed_password=row.hashed_password,
        first_name=row.first_name,
        last_name=row.last_name,
        token_hash=row.token_hash,
        expires_at=row.expires_at,
        created_at=row.created_at,
    )


def password_reset_token_to_row(t: PasswordResetToken) -> db_models.PasswordResetToken:
    return db_models.PasswordResetToken(
        id=t.id,
        email=t.email,
        token_hash=t.token_hash,
        expires_at=t.expires_at,
        created_at=t.created_at or datetime.utcnow(),
    )


def password_reset_token_to_domain(
    row: db_models.PasswordResetToken,
) -> PasswordResetToken:
    return PasswordResetToken(
        id=row.id,
        email=row.email,
        token_hash=row.token_hash,
        expires_at=row.expires_at,
        created_at=row.created_at,
    )


__all__ = [
    "file_to_domain",
    "file_to_row",
    "material_to_domain",
    "material_to_row",
    "question_to_domain",
    "question_to_row",
    "test_to_domain",
    "test_to_row",
    "user_to_domain",
    "user_to_row",
]

