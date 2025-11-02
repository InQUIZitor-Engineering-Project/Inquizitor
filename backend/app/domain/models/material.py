from __future__ import annotations

from dataclasses import dataclass
from typing import Optional

from .enums import ProcessingStatus
from .file import File


@dataclass(slots=True)
class Material:
    """Domain entity representing source material for generating content."""

    id: Optional[int]
    owner_id: int
    file: File
    mime_type: Optional[str]
    size_bytes: Optional[int]
    checksum: Optional[str]
    status: ProcessingStatus = ProcessingStatus.PENDING
    extracted_text: Optional[str] = None
    processing_error: Optional[str] = None

    def mark_processed(self, text: str) -> None:
        self.status = ProcessingStatus.DONE
        self.extracted_text = text
        self.processing_error = None

    def mark_failed(self, error: str) -> None:
        self.status = ProcessingStatus.FAILED
        self.processing_error = error
        self.extracted_text = None


__all__ = ["Material"]

