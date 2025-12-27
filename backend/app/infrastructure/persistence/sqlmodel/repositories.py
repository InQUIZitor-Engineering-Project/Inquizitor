from __future__ import annotations

from typing import Iterable, List
from datetime import datetime

from sqlalchemy.orm import Session, joinedload
from sqlmodel import select

from app.db import models as db_models
from app.domain.models import (
    File,
    Material,
    Question,
    Test,
    User,
    Job,
    PendingVerification,
    PasswordResetToken,
)
from app.domain.repositories import (
    FileRepository,
    JobRepository,
    MaterialRepository,
    TestRepository,
    UserRepository,
    PendingVerificationRepository,
    PasswordResetTokenRepository,
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
        db_user = self._session.exec(stmt).first()
        return mappers.user_to_domain(db_user) if db_user else None

    def remove(self, user_id: int) -> None:
        db_user = self._session.get(db_models.User, user_id)
        if db_user:
            self._session.delete(db_user)
            self._session.commit()


class SqlModelTestRepository(TestRepository):
    def __init__(self, session: Session):
        self._session = session

    def create(self, test: Test) -> Test:
        db_test = mappers.test_to_row(test)
        self._session.add(db_test)
        self._session.commit()
        self._session.refresh(db_test)
        return mappers.test_to_domain(db_test)

    def add_question(self, test_id: int, question: Question) -> Question:
        db_question = mappers.question_to_row(question, test_id=test_id)
        self._session.add(db_question)
        self._session.commit()
        self._session.refresh(db_question)
        return mappers.question_to_domain(db_question)

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
                db_models.Test.id.asc(),
            )
        )
        rows = self._session.exec(stmt).all()
        return [mappers.test_to_domain(row) for row in rows]


    def remove(self, test_id: int) -> None:
        db_test = self._session.get(db_models.Test, test_id)
        if db_test:
            self._session.delete(db_test)
            self._session.commit()


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
        rows = self._session.exec(stmt).all()
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
        db_material = self._session.get(db_models.Material, material_id)
        return mappers.material_to_domain(db_material) if db_material else None
    
    def get_by_file_id(self, file_id: int) -> Material | None:
        stmt = (
            select(db_models.Material)
            .where(db_models.Material.file_id == file_id)
            .options(joinedload(db_models.Material.file))
        )
        row = self._session.exec(stmt).first()
        return mappers.material_to_domain(row) if row else None

    def list_for_user(self, user_id: int) -> Iterable[Material]:
        stmt = select(db_models.Material).where(db_models.Material.owner_id == user_id)
        rows = self._session.exec(stmt).all()
        materials: List[Material] = []
        for row in rows:
            materials.append(mappers.material_to_domain(row))
        return materials

    def update(self, material: Material) -> Material:
        db_material = self._session.get(db_models.Material, material.id)
        if not db_material:
            raise ValueError(f"Material {material.id} not found")

        db_material.mime_type = material.mime_type
        db_material.size_bytes = material.size_bytes
        db_material.checksum = material.checksum
        db_material.extracted_text = material.extracted_text
        db_material.processing_status = material.status.value
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

        db_job.job_type = job.job_type.value
        db_job.status = job.status.value
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
            .order_by(db_models.Job.created_at.desc())
        )
        rows = self._session.exec(stmt).all()
        return [mappers.job_to_domain(row) for row in rows]


class SqlModelPendingVerificationRepository(PendingVerificationRepository):
    def __init__(self, session: Session):
        self._session = session

    def upsert(self, pending: PendingVerification) -> PendingVerification:
        stmt = select(db_models.PendingEmailVerification).where(db_models.PendingEmailVerification.email == pending.email)
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
        stmt = select(db_models.PendingEmailVerification).where(db_models.PendingEmailVerification.email == email)
        row = self._session.exec(stmt).first()
        return mappers.pending_verification_to_domain(row) if row else None

    def get_by_token_hash(self, token_hash: str) -> PendingVerification | None:
        stmt = select(db_models.PendingEmailVerification).where(db_models.PendingEmailVerification.token_hash == token_hash)
        row = self._session.exec(stmt).first()
        return mappers.pending_verification_to_domain(row) if row else None

    def delete_by_email(self, email: str) -> None:
        stmt = select(db_models.PendingEmailVerification).where(db_models.PendingEmailVerification.email == email)
        row = self._session.exec(stmt).first()
        if row:
            self._session.delete(row)
            self._session.commit()


class SqlModelPasswordResetTokenRepository(PasswordResetTokenRepository):
    def __init__(self, session: Session):
        self._session = session

    def upsert(self, token: PasswordResetToken) -> PasswordResetToken:
        stmt = select(db_models.PasswordResetToken).where(db_models.PasswordResetToken.email == token.email)
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
        stmt = select(db_models.PasswordResetToken).where(db_models.PasswordResetToken.email == email)
        row = self._session.exec(stmt).first()
        return mappers.password_reset_token_to_domain(row) if row else None

    def get_by_token_hash(self, token_hash: str) -> PasswordResetToken | None:
        stmt = select(db_models.PasswordResetToken).where(db_models.PasswordResetToken.token_hash == token_hash)
        row = self._session.exec(stmt).first()
        return mappers.password_reset_token_to_domain(row) if row else None

    def delete_by_email(self, email: str) -> None:
        stmt = select(db_models.PasswordResetToken).where(db_models.PasswordResetToken.email == email)
        row = self._session.exec(stmt).first()
        if row:
            self._session.delete(row)
            self._session.commit()


__all__ = [
    "SqlModelUserRepository",
    "SqlModelTestRepository",
    "SqlModelFileRepository",
    "SqlModelMaterialRepository",
    "SqlModelJobRepository",
    "SqlModelPendingVerificationRepository",
    "SqlModelPasswordResetTokenRepository",
]

