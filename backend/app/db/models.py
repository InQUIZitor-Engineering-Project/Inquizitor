from typing import Optional, List
from datetime import datetime
from sqlmodel import SQLModel, Field, Relationship

class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(index=True, unique=True, max_length=100)
    hashed_password: str
    first_name: Optional[str] = Field(default=None, max_length=50)
    last_name:  Optional[str] = Field(default=None, max_length=50)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    tests: List["Test"] = Relationship(back_populates="owner")
    files: List["File"] = Relationship(back_populates="owner")


class Test(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    owner_id: int = Field(foreign_key="user.id")
    title: Optional[str] = Field(default="Nowy test")
    created_at: datetime = Field(default_factory=datetime.utcnow)

    owner: Optional[User] = Relationship(back_populates="tests")
    questions: List["Question"] = Relationship(back_populates="test")

class Question(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    test_id: int = Field(foreign_key="test.id")
    text: str
    is_closed: bool = Field(default=True)
    difficulty: int = Field(default=1)  # 1 - easy, 2 - medium, 3 - hard

    choices: Optional[str] = None        
    correct_choices: Optional[str] = None

    test: Optional[Test] = Relationship(back_populates="questions")

class File(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    owner_id: int = Field(foreign_key="user.id")
    filename: str
    filepath: str
    uploaded_at: datetime = Field(default_factory=datetime.utcnow)

    owner: Optional[User] = Relationship(back_populates="files")

