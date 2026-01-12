from datetime import datetime
from enum import Enum
from typing import Optional

from sqlalchemy import Column, ForeignKey, Integer
from sqlalchemy import Enum as SAEnum
from sqlalchemy.dialects.postgresql import JSONB
from sqlmodel import Field, Relationship, SQLModel


class User(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    email: str = Field(index=True, unique=True, max_length=100)
    hashed_password: str
    first_name: str | None = Field(default=None, max_length=50)
    last_name:  str | None = Field(default=None, max_length=50)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    tests: list["Test"] = Relationship(back_populates="owner")
    files: list["File"] = Relationship(back_populates="owner")
    materials: list["Material"] = Relationship(back_populates="owner")
    refresh_tokens: list["RefreshToken"] = Relationship(back_populates="owner")


class RefreshToken(SQLModel, table=True):
    __tablename__ = "refresh_tokens"
    id: int | None = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", index=True)
    token_hash: str = Field(index=True, unique=True, max_length=128)
    expires_at: datetime = Field(index=True)
    created_at: datetime = Field(default_factory=datetime.utcnow, index=True)
    revoked_at: datetime | None = Field(default=None)

    owner: User | None = Relationship(back_populates="refresh_tokens")


class PendingEmailVerification(SQLModel, table=True):
    __tablename__ = "pending_email_verification"
    id: int | None = Field(default=None, primary_key=True)
    email: str = Field(index=True, unique=True, max_length=100)
    hashed_password: str
    first_name: str | None = Field(default=None, max_length=50)
    last_name: str | None = Field(default=None, max_length=50)
    token_hash: str = Field(index=True, unique=True, max_length=128)
    expires_at: datetime = Field(index=True)
    created_at: datetime = Field(default_factory=datetime.utcnow, index=True)

class PasswordResetToken(SQLModel, table=True):
    __tablename__ = "password_reset_tokens"
    id: int | None = Field(default=None, primary_key=True)
    email: str = Field(index=True, max_length=100)
    token_hash: str = Field(index=True, unique=True, max_length=128)
    expires_at: datetime = Field(index=True)
    created_at: datetime = Field(default_factory=datetime.utcnow, index=True)

class Test(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    owner_id: int = Field(foreign_key="user.id", index=True)
    title: str | None = Field(default="Nowy test")
    created_at: datetime = Field(default_factory=datetime.utcnow)

    owner: User | None = Relationship(back_populates="tests")
    questions: list["Question"] = Relationship(
        back_populates="test",
        sa_relationship_kwargs={
            "cascade": "all, delete-orphan",
            "order_by": "Question.id"
        },
        )

class Question(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    test_id: int = Field(
        sa_column=Column(
            "test_id",
            Integer,
            ForeignKey("test.id", ondelete="CASCADE"),
            index=True,
            nullable=False
        )
    )
    text: str
    is_closed: bool = Field(default=True)
    difficulty: int = Field(default=1)  # 1-easy, 2-medium, 3-hard

    choices: list[str] | None = Field(
        default=None, sa_column=Column(JSONB)
    )
    correct_choices: list[str] | None = Field(
        default=None, sa_column=Column(JSONB)
    )

    test: Test | None = Relationship(back_populates="questions")

class File(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    owner_id: int = Field(foreign_key="user.id", index=True)
    filename: str
    filepath: str
    uploaded_at: datetime = Field(default_factory=datetime.utcnow)

    owner: User | None = Relationship(back_populates="files")
    material: Optional["Material"] = Relationship(back_populates="file")


class FilePurpose(str, Enum):
    generic = "generic"
    material = "material"

class ProcessingStatus(str, Enum):
    pending = "pending"
    done = "done"
    failed = "failed"

class JobStatus(str, Enum):
    pending = "pending"
    running = "running"
    done = "done"
    failed = "failed"

class JobType(str, Enum):
    test_generation = "test_generation"
    pdf_export = "pdf_export"
    material_processing = "material_processing"
    questions_regeneration = "questions_regeneration"
    questions_conversion = "questions_conversion"

class SupportCategory(str, Enum):
    general = "general"
    bug = "bug"
    feature_request = "feature_request"
    account = "account"
    other = "other"

class SupportStatus(str, Enum):
    new = "new"
    read = "read"
    resolved = "resolved"

class Material(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    owner_id: int = Field(foreign_key="user.id", index=True)
    file_id: int = Field(foreign_key="file.id", unique=True, index=True)
    mime_type: str | None = Field(default=None, index=True)
    size_bytes: int | None = None
    checksum: str | None = Field(default=None, index=True)
    extracted_text: str | None = None
    processing_status: ProcessingStatus = Field(
        default=ProcessingStatus.done, index=True
    )
    processing_error: str | None = None
    created_at: datetime = Field(default_factory=datetime.utcnow, index=True)

    owner: User | None = Relationship(back_populates="materials")
    file: File | None = Relationship(back_populates="material")


class Job(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    owner_id: int = Field(foreign_key="user.id", index=True)
    job_type: JobType = Field(sa_column=Column("job_type", SAEnum(JobType), index=True))
    status: JobStatus = Field(sa_column=Column("status", SAEnum(JobStatus), index=True))
    payload: dict = Field(default_factory=dict, sa_column=Column(JSONB))
    result: dict | None = Field(default=None, sa_column=Column(JSONB, nullable=True))
    error: str | None = Field(default=None)
    created_at: datetime = Field(default_factory=datetime.utcnow, index=True)
    updated_at: datetime = Field(default_factory=datetime.utcnow, index=True)

class SystemNotification(SQLModel, table=True):
    __tablename__ = "system_notifications"
    
    id: int | None = Field(default=None, primary_key=True)
    title: str = Field(max_length=200)
    message: str 
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    type: str = Field(default="info", max_length=20) 
    recipient_id: int | None = Field(default=None, foreign_key="user.id", nullable=True)

class UserReadNotification(SQLModel, table=True):
    __tablename__ = "user_read_notifications"
    
    user_id: int = Field(foreign_key="user.id", primary_key=True)
    notification_id: int = Field(
        foreign_key="system_notifications.id", primary_key=True
    )
    read_at: datetime = Field(default_factory=datetime.utcnow)

class SupportTicket(SQLModel, table=True):
    __tablename__ = "support_tickets"
    id: int | None = Field(default=None, primary_key=True)
    user_id: int | None = Field(
        default=None, foreign_key="user.id", index=True, nullable=True
    )
    email: str = Field(index=True, max_length=100)
    first_name: str | None = Field(default=None, max_length=50)
    last_name: str | None = Field(default=None, max_length=50)
    category: SupportCategory = Field(
        sa_column=Column(
            "category",
            SAEnum(SupportCategory),
            index=True,
            default=SupportCategory.general,
        )
    )
    subject: str = Field(max_length=200)
    message: str
    status: SupportStatus = Field(
        sa_column=Column(
            "status",
            SAEnum(SupportStatus),
            index=True,
            default=SupportStatus.new,
        )
    )
    created_at: datetime = Field(default_factory=datetime.utcnow, index=True)
    updated_at: datetime = Field(default_factory=datetime.utcnow, index=True)

    user: User | None = Relationship()
