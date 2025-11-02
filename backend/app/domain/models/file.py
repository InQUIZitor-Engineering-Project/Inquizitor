from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Optional


@dataclass(slots=True)
class File:
    """Domain entity representing a file stored by a user."""

    id: Optional[int]
    owner_id: int
    filename: str
    stored_path: Path
    uploaded_at: Optional[datetime] = None

    def __post_init__(self) -> None:
        self.filename = self.filename.strip()
        if not self.filename:
            raise ValueError("Filename cannot be empty")
        if isinstance(self.stored_path, str):
            self.stored_path = Path(self.stored_path)

    @property
    def extension(self) -> str:
        return self.stored_path.suffix.lower()

    def relocate(self, new_path: Path) -> None:
        self.stored_path = Path(new_path)

    def rename(self, new_filename: str) -> None:
        new_filename = new_filename.strip()
        if not new_filename:
            raise ValueError("Filename cannot be empty")
        self.filename = new_filename


__all__ = ["File"]

