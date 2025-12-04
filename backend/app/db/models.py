from typing import Optional, List
from datetime import datetime
from sqlmodel import SQLModel, Field, Relationship
from enum import Enum
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy import Column, ForeignKey, Integer

class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(index=True, unique=True, max_length=100)
    hashed_password: str
    first_name: Optional[str] = Field(default=None, max_length=50)
    last_name:  Optional[str] = Field(default=None, max_length=50)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    tests: List["Test"] = Relationship(back_populates="owner")
    files: List["File"] = Relationship(back_populates="owner")
    materials: List["Material"] = Relationship(back_populates="owner")

class Test(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    owner_id: int = Field(foreign_key="user.id", index=True)
    title: Optional[str] = Field(default="Nowy test")
    created_at: datetime = Field(default_factory=datetime.utcnow)

    owner: Optional[User] = Relationship(back_populates="tests")
    questions: List["Question"] = Relationship(
        back_populates="test",
        sa_relationship_kwargs={
            "cascade": "all, delete-orphan",
            "order_by": "Question.id"
        },
        )

class Question(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
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

    choices: Optional[List[str]] = Field(
        default=None, sa_column=Column(JSONB)
    )
    correct_choices: Optional[List[str]] = Field(
        default=None, sa_column=Column(JSONB)
    )

    test: Optional[Test] = Relationship(back_populates="questions")

class File(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    owner_id: int = Field(foreign_key="user.id", index=True)
    filename: str
    filepath: str
    uploaded_at: datetime = Field(default_factory=datetime.utcnow)

    owner: Optional[User] = Relationship(back_populates="files")
    material: Optional["Material"] = Relationship(back_populates="file")


class FilePurpose(str, Enum):
    generic = "generic"
    material = "material"

class ProcessingStatus(str, Enum):
    pending = "pending"
    done = "done"
    failed = "failed"

class Material(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    owner_id: int = Field(foreign_key="user.id", index=True)
    file_id: int = Field(foreign_key="file.id", unique=True, index=True)
    mime_type: Optional[str] = Field(default=None, index=True)
    size_bytes: Optional[int] = None
    checksum: Optional[str] = Field(default=None, index=True)
    extracted_text: Optional[str] = None
    processing_status: ProcessingStatus = Field(default=ProcessingStatus.done, index=True)
    processing_error: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow, index=True)

    owner: Optional[User] = Relationship(back_populates="materials")
    file: Optional[File] = Relationship(back_populates="material")