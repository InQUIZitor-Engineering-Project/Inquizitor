from __future__ import annotations

from collections.abc import Iterable
from datetime import datetime
from pathlib import Path

from app.db import models as db_models
from app.domain.models import (
    File,
    Job,
    Material,
    OcrCache,
    PasswordResetToken,
    PdfExportCache,
    PendingVerification,
    Question,
    RefreshToken,
    Test,
    User,
)
from app.domain.models.enums import (
    AnalysisStatus,
    JobStatus,
    JobType,
    ProcessingStatus,
    QuestionDifficulty,
    RoutingTier,
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

    return Question(
        id=row.id,
        text=row.text,
        is_closed=row.is_closed,
        difficulty=QuestionDifficulty(row.difficulty),
        choices=choices,
        correct_choices=correct_choices,
        citations=row.citations or [],
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
        citations=question.citations or None,
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
    )


def file_to_row(file: File) -> db_models.File:
    return db_models.File(
        id=file.id,
        owner_id=file.owner_id,
        filename=file.filename,
        filepath=str(file.stored_path),
        uploaded_at=file.uploaded_at or datetime.utcnow(),
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
        page_count=row.page_count,
        status=ProcessingStatus(status_value),
        extracted_text=row.extracted_text,
        processing_error=row.processing_error,
        analysis_status=AnalysisStatus(
            row.analysis_status.value
            if isinstance(row.analysis_status, db_models.AnalysisStatus)
            else str(row.analysis_status)
        ),
        routing_tier=(
            RoutingTier(row.routing_tier.value)
            if isinstance(row.routing_tier, db_models.RoutingTier)
            else (
                RoutingTier(str(row.routing_tier))
                if row.routing_tier
                else None
            )
        ),
        analysis_version=row.analysis_version,
        markdown_twin=row.markdown_twin,
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
        page_count=material.page_count,
        extracted_text=material.extracted_text,
        processing_status=material.status.value,
        processing_error=material.processing_error,
        analysis_status=material.analysis_status.value,
        routing_tier=material.routing_tier.value if material.routing_tier else None,
        analysis_version=material.analysis_version,
        markdown_twin=material.markdown_twin,
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


def pdf_export_cache_to_domain(row: db_models.PdfExportCache) -> PdfExportCache:
    return PdfExportCache(
        id=row.id,
        test_id=row.test_id,
        cache_key=row.cache_key,
        config_hash=row.config_hash,
        template_version=row.template_version,
        stored_path=row.stored_path,
        created_at=row.created_at,
    )


def pdf_export_cache_to_row(entry: PdfExportCache) -> db_models.PdfExportCache:
    return db_models.PdfExportCache(
        id=entry.id,
        test_id=entry.test_id,
        cache_key=entry.cache_key,
        config_hash=entry.config_hash,
        template_version=entry.template_version,
        stored_path=entry.stored_path,
        created_at=entry.created_at or datetime.utcnow(),
    )


def ocr_cache_to_domain(row: db_models.OcrCache) -> OcrCache:
    return OcrCache(
        id=row.id,
        user_id=row.user_id,
        file_hash=row.file_hash,
        ocr_options_hash=row.ocr_options_hash,
        pipeline_version=row.pipeline_version,
        result_ref=row.result_ref,
        cache_key=row.cache_key,
        created_at=row.created_at,
    )


def ocr_cache_to_row(entry: OcrCache) -> db_models.OcrCache:
    return db_models.OcrCache(
        id=entry.id,
        user_id=entry.user_id,
        file_hash=entry.file_hash,
        ocr_options_hash=entry.ocr_options_hash,
        pipeline_version=entry.pipeline_version,
        result_ref=entry.result_ref,
        cache_key=entry.cache_key,
        created_at=entry.created_at or datetime.utcnow(),
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


def refresh_token_to_domain(row: db_models.RefreshToken) -> RefreshToken:
    return RefreshToken(
        id=row.id,
        user_id=row.user_id,
        token_hash=row.token_hash,
        expires_at=row.expires_at,
        created_at=row.created_at,
        revoked_at=row.revoked_at,
    )


def refresh_token_to_row(token: RefreshToken) -> db_models.RefreshToken:
    return db_models.RefreshToken(
        id=token.id,
        user_id=token.user_id,
        token_hash=token.token_hash,
        expires_at=token.expires_at,
        created_at=token.created_at,
        revoked_at=token.revoked_at,
    )


__all__ = [
    "file_to_domain",
    "file_to_row",
    "job_to_domain",
    "job_to_row",
    "material_to_domain",
    "material_to_row",
    "password_reset_token_to_domain",
    "password_reset_token_to_row",
    "pending_verification_to_domain",
    "pending_verification_to_row",
    "question_to_domain",
    "question_to_row",
    "refresh_token_to_domain",
    "refresh_token_to_row",
    "test_to_domain",
    "test_to_row",
    "user_to_domain",
    "user_to_row",
]
