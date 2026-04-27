from __future__ import annotations

from collections.abc import Iterable
from datetime import datetime
from typing import Any, cast

from sqlalchemy import delete, func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import joinedload
from sqlmodel import Session, select

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
    QuestionGroup,
    RefreshToken,
    Test,
    User,
)
from app.domain.repositories import (
    FileRepository,
    JobRepository,
    MaterialRepository,
    OcrCacheRepository,
    PasswordResetTokenRepository,
    PdfExportCacheRepository,
    PendingVerificationRepository,
    RefreshTokenRepository,
    TestRepository,
    UserRepository,
)

from . import mappers


class SqlModelUserRepository(UserRepository):
    def __init__(self, session: Session):
        self._session = session

    def add(self, user: User) -> User:
        db_user = mappers.user_to_row(user)
        self._session.add(db_user)
        self._session.commit()
        self._session.refresh(db_user)
        return mappers.user_to_domain(db_user)

    def get(self, user_id: int) -> User | None:
        db_user = self._session.get(db_models.User, user_id)
        return mappers.user_to_domain(db_user) if db_user else None

    def get_by_email(self, email: str) -> User | None:
        stmt = select(db_models.User).where(db_models.User.email == email)
        db_user = cast(Any, self._session).exec(stmt).first()
        return mappers.user_to_domain(db_user) if db_user else None

    def remove(self, user_id: int) -> None:
        db_user = self._session.get(db_models.User, user_id)
        if db_user:
            self._session.delete(db_user)
            self._session.commit()

    def update(self, user: User) -> User:
        db_user = self._session.get(db_models.User, user.id)
        if not db_user:
            raise ValueError(f"User {user.id} not found")
        
        db_user.email = user.email
        db_user.hashed_password = user.hashed_password
        db_user.first_name = user.first_name
        db_user.last_name = user.last_name
        
        self._session.add(db_user)
        self._session.commit()
        self._session.refresh(db_user)
        return mappers.user_to_domain(db_user)


class SqlModelTestRepository(TestRepository):
    def __init__(self, session: Session):
        self._session = session

    def create(self, test: Test) -> Test:
        db_test = mappers.test_to_row(test)
        self._session.add(db_test)
        self._session.commit()
        self._session.refresh(db_test)
        return mappers.test_to_domain(db_test)

    def add_question(self, test_id: int, question: Question, group_id: int) -> Question:
        db_question = mappers.question_to_row(
            question, test_id=test_id, group_id=group_id
        )
        count_stmt = select(func.count()).select_from(db_models.Question).where(
            db_models.Question.group_id == group_id
        )
        db_question.position = (self._session.exec(count_stmt).one() or 0)
        self._session.add(db_question)
        self._session.commit()
        self._session.refresh(db_question)
        return mappers.question_to_domain(db_question)

    def bulk_add_questions(
        self, test_id: int, questions: list[Question], group_id: int
    ) -> list[Question]:
        count_stmt = select(func.count()).select_from(db_models.Question).where(
            db_models.Question.group_id == group_id
        )
        base_position = self._session.exec(count_stmt).one() or 0
        rows = []
        for i, question in enumerate(questions):
            row = mappers.question_to_row(question, test_id=test_id, group_id=group_id)
            row.position = base_position + i
            rows.append(row)
        self._session.add_all(rows)
        self._session.commit()
        for row in rows:
            self._session.refresh(row)
        return [mappers.question_to_domain(row) for row in rows]

    def get(self, test_id: int) -> Test | None:
        db_test = self._session.get(db_models.Test, test_id)
        return mappers.test_to_domain(db_test) if db_test else None

    def get_with_questions(self, test_id: int) -> Test | None:
        db_test = self._session.get(db_models.Test, test_id)
        if not db_test:
            return None
        questions = list(db_test.questions)
        return mappers.test_to_domain(db_test, questions)

    def list_for_user(self, user_id: int) -> Iterable[Test]:
        stmt = (
            select(db_models.Test)
            .where(db_models.Test.owner_id == user_id)
            .order_by(
                cast(Any, db_models.Test.created_at).desc(),
            )
        )
        rows = cast(Any, self._session).exec(stmt).all()
        return [mappers.test_to_domain(row) for row in rows]


    def remove(self, test_id: int) -> None:
        db_test = self._session.get(db_models.Test, test_id)
        if db_test:
            self._session.delete(db_test)
            self._session.commit()

    def reorder_questions(self, test_id: int, question_ids: list[int]) -> None:
        if not question_ids:
            return
        stmt = select(db_models.Question).where(db_models.Question.test_id == test_id)
        rows = list(self._session.exec(stmt).all())
        id_to_row = {r.id: r for r in rows}
        if set(id_to_row) != set(question_ids):
            raise ValueError("question_ids must match exactly the test's questions")
        for position, qid in enumerate(question_ids):
            id_to_row[qid].position = position
            self._session.add(id_to_row[qid])
        self._session.flush()

    def get_groups_for_test(self, test_id: int) -> list[QuestionGroup]:
        stmt = (
            select(db_models.QuestionGroup)
            .where(db_models.QuestionGroup.test_id == test_id)
            .order_by(db_models.QuestionGroup.position, db_models.QuestionGroup.id)
        )
        rows = list(self._session.exec(stmt).all())
        return [mappers.question_group_to_domain(r) for r in rows]

    def get_group(self, group_id: int) -> QuestionGroup | None:
        row = self._session.get(db_models.QuestionGroup, group_id)
        return mappers.question_group_to_domain(row) if row else None

    def create_group(
        self, test_id: int, label: str, position: int = 0
    ) -> QuestionGroup:
        count_stmt = select(func.count()).select_from(db_models.QuestionGroup).where(
            db_models.QuestionGroup.test_id == test_id
        )
        pos = (
            position
            if position >= 0
            else (self._session.exec(count_stmt).one() or 0)
        )
        db_group = db_models.QuestionGroup(
            test_id=test_id,
            label=label,
            position=pos,
        )
        self._session.add(db_group)
        self._session.commit()
        self._session.refresh(db_group)
        return mappers.question_group_to_domain(db_group)

    def update_group(
        self, group_id: int, *, label: str | None = None, position: int | None = None
    ) -> QuestionGroup | None:
        row = self._session.get(db_models.QuestionGroup, group_id)
        if not row:
            return None
        if label is not None:
            row.label = label
        if position is not None:
            row.position = position
        self._session.add(row)
        self._session.flush()
        return mappers.question_group_to_domain(row)

    def delete_group(self, group_id: int) -> None:
        stmt = delete(db_models.Question).where(db_models.Question.group_id == group_id)
        self._session.execute(stmt)
        group_row = self._session.get(db_models.QuestionGroup, group_id)
        if group_row:
            self._session.delete(group_row)
        self._session.flush()

    def duplicate_group(
        self, test_id: int, group_id: int
    ) -> tuple[QuestionGroup, list[Question]]:
        group_row = self._session.get(db_models.QuestionGroup, group_id)
        if not group_row or group_row.test_id != test_id:
            raise ValueError("Group not found or does not belong to test")
        groups = self.get_groups_for_test(test_id)
        new_position = len(groups)
        new_group = self.create_group(
            test_id, f"{group_row.label} (kopia)", position=new_position
        )
        if new_group.id is None:
            raise RuntimeError("Failed to create group")
        stmt = (
            select(db_models.Question)
            .where(db_models.Question.group_id == group_id)
            .order_by(db_models.Question.position, db_models.Question.id)
        )
        source_questions = list(self._session.exec(stmt).all())
        new_questions: list[Question] = []
        for idx, sq in enumerate(source_questions):
            db_new = db_models.Question(
                test_id=test_id,
                group_id=new_group.id,
                position=idx,
                text=sq.text,
                is_closed=sq.is_closed,
                difficulty=sq.difficulty,
                choices=sq.choices,
                correct_choices=sq.correct_choices,
                citations=sq.citations,
            )
            self._session.add(db_new)
        self._session.flush()
        stmt_new = select(db_models.Question).where(
            db_models.Question.group_id == new_group.id
        )
        for db_new in self._session.exec(stmt_new).all():
            new_questions.append(mappers.question_to_domain(db_new))
        return new_group, new_questions

    def assign_questions_to_group(self, question_ids: list[int], group_id: int) -> None:
        if not question_ids:
            return
        stmt = select(db_models.Question).where(
            cast(Any, db_models.Question.id).in_(question_ids)
        )
        rows = list(self._session.exec(stmt).all())
        for row in rows:
            row.group_id = group_id
            self._session.add(row)
        self._session.flush()


class SqlModelFileRepository(FileRepository):
    def __init__(self, session: Session):
        self._session = session

    def add(self, file: File) -> File:
        db_file = mappers.file_to_row(file)
        self._session.add(db_file)
        self._session.commit()
        self._session.refresh(db_file)
        return mappers.file_to_domain(db_file)

    def get(self, file_id: int) -> File | None:
        db_file = self._session.get(db_models.File, file_id)
        return mappers.file_to_domain(db_file) if db_file else None

    def list_for_user(self, user_id: int) -> Iterable[File]:
        stmt = select(db_models.File).where(db_models.File.owner_id == user_id)
        rows = cast(Any, self._session).exec(stmt).all()
        return [mappers.file_to_domain(row) for row in rows]

    def remove(self, file_id: int) -> None:
        db_file = self._session.get(db_models.File, file_id)
        if db_file:
            self._session.delete(db_file)
            self._session.commit()


class SqlModelMaterialRepository(MaterialRepository):
    def __init__(self, session: Session):
        self._session = session

    def add(self, material: Material) -> Material:
        db_material = mappers.material_to_row(material)
        self._session.add(db_material)
        self._session.commit()
        self._session.refresh(db_material)
        return mappers.material_to_domain(db_material)

    def get(self, material_id: int) -> Material | None:
        stmt = (
            select(db_models.Material)
            .where(db_models.Material.id == material_id)
            .options(joinedload(db_models.Material.file))
        )
        db_material = cast(Any, self._session).exec(stmt).first()
        return mappers.material_to_domain(db_material) if db_material else None

    def get_many(self, material_ids: list[int]) -> list[Material]:
        if not material_ids:
            return []
        stmt = (
            select(db_models.Material)
            .where(cast(Any, db_models.Material.id).in_(material_ids))
            .options(joinedload(db_models.Material.file))
        )
        rows = cast(Any, self._session).exec(stmt).all()
        by_id = {r.id: r for r in rows}
        return [
            mappers.material_to_domain(by_id[mid])
            for mid in material_ids
            if mid in by_id
        ]

    def get_by_file_id(self, file_id: int) -> Material | None:
        stmt = (
            select(db_models.Material)
            .where(db_models.Material.file_id == file_id)
            .options(joinedload(db_models.Material.file))
        )
        row = cast(Any, self._session).exec(stmt).first()
        return mappers.material_to_domain(row) if row else None

    def get_by_checksum(self, owner_id: int, checksum: str) -> Material | None:
        """Find a material by checksum for the given owner."""
        stmt = (
            select(db_models.Material)
            .where(
                db_models.Material.owner_id == owner_id,
                db_models.Material.checksum == checksum,
            )
            .options(joinedload(db_models.Material.file))
            .order_by(cast(Any, db_models.Material.created_at).desc())
        )
        row = cast(Any, self._session).exec(stmt).first()
        return mappers.material_to_domain(row) if row else None

    def list_for_user(self, user_id: int) -> Iterable[Material]:
        stmt = (
            select(db_models.Material)
            .where(db_models.Material.owner_id == user_id)
            .options(joinedload(db_models.Material.file))
            .order_by(cast(Any, db_models.Material.created_at).desc())
        )
        rows = cast(Any, self._session).exec(stmt).all()
        materials: list[Material] = []
        seen_checksums: set[str] = set()
        for row in rows:
            # Jeśli materiał ma checksum i już widzieliśmy ten checksum, pomiń go
            if row.checksum and row.checksum in seen_checksums:
                continue
            if row.checksum:
                seen_checksums.add(row.checksum)
            materials.append(mappers.material_to_domain(row))
        return materials

    def list_without_thumbnail(self) -> Iterable[Material]:
        stmt = (
            select(db_models.Material)
            .where(
                db_models.Material.thumbnail_path == None,  # noqa: E711
                db_models.Material.file_id != None,  # noqa: E711
            )
            .options(joinedload(db_models.Material.file))
            .order_by(cast(Any, db_models.Material.id).asc())
        )
        rows = cast(Any, self._session).exec(stmt).all()
        return [mappers.material_to_domain(row) for row in rows]

    def update(self, material: Material) -> Material:
        db_material = self._session.get(db_models.Material, material.id)
        if not db_material:
            raise ValueError(f"Material {material.id} not found")

        if material.file is not None and material.file.id is not None:
            db_file = self._session.get(db_models.File, material.file.id)
            if db_file is not None:
                db_file.filename = material.file.filename
                self._session.add(db_file)

        db_material.mime_type = material.mime_type
        db_material.size_bytes = material.size_bytes
        db_material.checksum = material.checksum
        db_material.page_count = material.page_count
        db_material.extracted_text = material.extracted_text
        db_material.processing_status = db_models.ProcessingStatus(
            material.status.value
        )
        db_material.processing_error = material.processing_error
        db_material.analysis_status = db_models.AnalysisStatus(
            material.analysis_status.value
        )
        db_material.routing_tier = (
            db_models.RoutingTier(material.routing_tier.value)
            if material.routing_tier
            else None
        )
        db_material.analysis_version = material.analysis_version
        db_material.markdown_twin = material.markdown_twin
        db_material.thumbnail_path = material.thumbnail_path

        self._session.add(db_material)
        self._session.commit()
        self._session.refresh(db_material)
        return mappers.material_to_domain(db_material)

    def update_analysis(self, material: Material) -> Material:
        """Update only analysis fields; preserves processing_status and thumbnail."""
        db_material = self._session.get(db_models.Material, material.id)
        if not db_material:
            raise ValueError(f"Material {material.id} not found")

        db_material.mime_type = material.mime_type
        db_material.analysis_status = db_models.AnalysisStatus(
            material.analysis_status.value
        )
        db_material.routing_tier = (
            db_models.RoutingTier(material.routing_tier.value)
            if material.routing_tier
            else None
        )
        db_material.analysis_version = material.analysis_version
        db_material.markdown_twin = material.markdown_twin
        if material.processing_error:
            db_material.processing_error = material.processing_error

        self._session.add(db_material)
        self._session.commit()
        self._session.refresh(db_material)
        return mappers.material_to_domain(db_material)

    def remove(self, material_id: int) -> None:
        db_material = self._session.get(db_models.Material, material_id)
        if db_material:
            self._session.delete(db_material)
            self._session.commit()


class SqlModelJobRepository(JobRepository):
    def __init__(self, session: Session):
        self._session = session

    def add(self, job: Job) -> Job:
        row = mappers.job_to_row(job)
        self._session.add(row)
        self._session.commit()
        self._session.refresh(row)
        return mappers.job_to_domain(row)

    def update(self, job: Job) -> Job:
        db_job = self._session.get(db_models.Job, job.id)
        if not db_job:
            raise ValueError(f"Job {job.id} not found")

        db_job.job_type = db_models.JobType(job.job_type.value)
        db_job.status = db_models.JobStatus(job.status.value)
        db_job.result = job.result or None
        db_job.error = job.error
        db_job.payload = job.payload or {}
        db_job.updated_at = job.updated_at or datetime.utcnow()

        self._session.add(db_job)
        self._session.commit()
        self._session.refresh(db_job)
        return mappers.job_to_domain(db_job)

    def get(self, job_id: int) -> Job | None:
        db_job = self._session.get(db_models.Job, job_id)
        return mappers.job_to_domain(db_job) if db_job else None

    def list_for_user(self, owner_id: int):
        stmt = (
            select(db_models.Job)
            .where(db_models.Job.owner_id == owner_id)
            .order_by(cast(Any, db_models.Job.created_at).desc())
        )
        rows = cast(Any, self._session).exec(stmt).all()
        return [mappers.job_to_domain(row) for row in rows]

    def get_many(self, owner_id: int, job_ids: list[int]) -> list[Job]:
        if not job_ids:
            return []
        job_id_col = cast(Any, db_models.Job.id)
        stmt = (
            select(db_models.Job)
            .where(
                db_models.Job.owner_id == owner_id,
                job_id_col.in_(job_ids),
            )
        )
        rows = cast(Any, self._session).exec(stmt).all()
        return [mappers.job_to_domain(row) for row in rows]

    def get_generation_job_by_test_id(self, test_id: int) -> Job | None:

        # Szukamy joba typu test_generation, którego result zawiera test_id
        stmt = (
            select(db_models.Job)
            .where(
                db_models.Job.job_type == db_models.JobType.test_generation,
                cast(Any, db_models.Job.result)["test_id"].astext == str(test_id)
            )
        )
        row = cast(Any, self._session).exec(stmt).first()
        return mappers.job_to_domain(row) if row else None


class SqlModelPdfExportCacheRepository(PdfExportCacheRepository):
    def __init__(self, session: Session):
        self._session = session

    def add(self, entry: PdfExportCache) -> PdfExportCache:
        row = mappers.pdf_export_cache_to_row(entry)
        self._session.add(row)
        self._session.commit()
        self._session.refresh(row)
        return mappers.pdf_export_cache_to_domain(row)

    def get_by_key(self, cache_key: str) -> PdfExportCache | None:
        stmt = select(db_models.PdfExportCache).where(
            db_models.PdfExportCache.cache_key == cache_key
        )
        row = cast(Any, self._session).exec(stmt).first()
        return mappers.pdf_export_cache_to_domain(row) if row else None

    def remove(self, entry_id: int) -> None:
        row = self._session.get(db_models.PdfExportCache, entry_id)
        if row:
            self._session.delete(row)
            self._session.commit()

    def remove_for_test(self, test_id: int) -> None:
        stmt = delete(db_models.PdfExportCache).where(
            db_models.PdfExportCache.test_id == test_id
        )
        cast(Any, self._session).exec(stmt)
        self._session.commit()


class SqlModelOcrCacheRepository(OcrCacheRepository):
    def __init__(self, session: Session):
        self._session = session

    def add(self, entry: OcrCache) -> OcrCache:
        row = mappers.ocr_cache_to_row(entry)
        self._session.add(row)
        try:
            self._session.commit()
            self._session.refresh(row)
            return mappers.ocr_cache_to_domain(row)
        except IntegrityError:
            self._session.rollback()
            existing = self.get_by_key(entry.cache_key)
            if existing is not None:
                return existing
            raise

    def get_by_key(self, cache_key: str) -> OcrCache | None:
        stmt = select(db_models.OcrCache).where(
            db_models.OcrCache.cache_key == cache_key
        )
        row = cast(Any, self._session).exec(stmt).first()
        return mappers.ocr_cache_to_domain(row) if row else None

    def remove(self, entry_id: int) -> None:
        row = self._session.get(db_models.OcrCache, entry_id)
        if row:
            self._session.delete(row)
            self._session.commit()


class SqlModelPendingVerificationRepository(PendingVerificationRepository):
    def __init__(self, session: Session):
        self._session = session

    def upsert(self, pending: PendingVerification) -> PendingVerification:
        stmt = select(db_models.PendingEmailVerification).where(
            db_models.PendingEmailVerification.email == pending.email
        )
        existing = self._session.exec(stmt).first()
        if existing:
            existing.hashed_password = pending.hashed_password
            existing.first_name = pending.first_name
            existing.last_name = pending.last_name
            existing.token_hash = pending.token_hash
            existing.expires_at = pending.expires_at
            existing.created_at = pending.created_at
            db_obj = existing
        else:
            db_obj = mappers.pending_verification_to_row(pending)
            self._session.add(db_obj)
        self._session.commit()
        self._session.refresh(db_obj)
        return mappers.pending_verification_to_domain(db_obj)

    def get_by_email(self, email: str) -> PendingVerification | None:
        stmt = select(db_models.PendingEmailVerification).where(
            db_models.PendingEmailVerification.email == email
        )
        row = cast(Any, self._session).exec(stmt).first()
        return mappers.pending_verification_to_domain(row) if row else None

    def get_by_token_hash(self, token_hash: str) -> PendingVerification | None:
        stmt = select(db_models.PendingEmailVerification).where(
            db_models.PendingEmailVerification.token_hash == token_hash
        )
        row = cast(Any, self._session).exec(stmt).first()
        return mappers.pending_verification_to_domain(row) if row else None

    def delete_by_email(self, email: str) -> None:
        stmt = select(db_models.PendingEmailVerification).where(
            db_models.PendingEmailVerification.email == email
        )
        row = cast(Any, self._session).exec(stmt).first()
        if row:
            self._session.delete(row)
            self._session.commit()


class SqlModelPasswordResetTokenRepository(PasswordResetTokenRepository):
    def __init__(self, session: Session):
        self._session = session

    def upsert(self, token: PasswordResetToken) -> PasswordResetToken:
        stmt = select(db_models.PasswordResetToken).where(
            db_models.PasswordResetToken.email == token.email
        )
        existing = self._session.exec(stmt).first()
        if existing:
            existing.token_hash = token.token_hash
            existing.expires_at = token.expires_at
            existing.created_at = token.created_at
            db_obj = existing
        else:
            db_obj = mappers.password_reset_token_to_row(token)
            self._session.add(db_obj)
        self._session.commit()
        self._session.refresh(db_obj)
        return mappers.password_reset_token_to_domain(db_obj)

    def get_by_email(self, email: str) -> PasswordResetToken | None:
        stmt = select(db_models.PasswordResetToken).where(
            db_models.PasswordResetToken.email == email
        )
        row = cast(Any, self._session).exec(stmt).first()
        return mappers.password_reset_token_to_domain(row) if row else None

    def get_by_token_hash(self, token_hash: str) -> PasswordResetToken | None:
        stmt = select(db_models.PasswordResetToken).where(
            db_models.PasswordResetToken.token_hash == token_hash
        )
        row = cast(Any, self._session).exec(stmt).first()
        return mappers.password_reset_token_to_domain(row) if row else None

    def delete_by_email(self, email: str) -> None:
        stmt = select(db_models.PasswordResetToken).where(
            db_models.PasswordResetToken.email == email
        )
        row = cast(Any, self._session).exec(stmt).first()
        if row:
            self._session.delete(row)
            self._session.commit()


class SqlModelRefreshTokenRepository(RefreshTokenRepository):
    def __init__(self, session: Session):
        self._session = session

    def add(self, token: RefreshToken) -> RefreshToken:
        db_token = mappers.refresh_token_to_row(token)
        self._session.add(db_token)
        self._session.commit()
        self._session.refresh(db_token)
        return mappers.refresh_token_to_domain(db_token)

    def update(self, token: RefreshToken) -> RefreshToken:
        db_token = self._session.get(db_models.RefreshToken, token.id)
        if not db_token:
            raise ValueError(f"RefreshToken {token.id} not found")

        db_token.revoked_at = token.revoked_at
        db_token.expires_at = token.expires_at
        db_token.token_hash = token.token_hash

        self._session.add(db_token)
        self._session.commit()
        self._session.refresh(db_token)
        return mappers.refresh_token_to_domain(db_token)

    def get_by_token_hash(self, token_hash: str) -> RefreshToken | None:
        stmt = select(db_models.RefreshToken).where(
            db_models.RefreshToken.token_hash == token_hash
        )
        row = cast(Any, self._session).exec(stmt).first()
        return mappers.refresh_token_to_domain(row) if row else None

    def revoke_all_for_user(self, user_id: int) -> None:
        stmt = select(db_models.RefreshToken).where(
            db_models.RefreshToken.user_id == user_id,
            db_models.RefreshToken.revoked_at == None,  # noqa: E711
        )
        tokens = cast(Any, self._session).exec(stmt).all()
        now = datetime.utcnow()
        for token in tokens:
            token.revoked_at = now
            self._session.add(token)
        self._session.commit()

    def remove_expired(self) -> None:
        stmt = select(db_models.RefreshToken).where(
            db_models.RefreshToken.expires_at < datetime.utcnow()
        )
        expired_tokens = cast(Any, self._session).exec(stmt).all()
        for token in expired_tokens:
            self._session.delete(token)
        self._session.commit()


__all__ = [
    "SqlModelFileRepository",
    "SqlModelJobRepository",
    "SqlModelMaterialRepository",
    "SqlModelPasswordResetTokenRepository",
    "SqlModelPendingVerificationRepository",
    "SqlModelRefreshTokenRepository",
    "SqlModelTestRepository",
    "SqlModelUserRepository",
]