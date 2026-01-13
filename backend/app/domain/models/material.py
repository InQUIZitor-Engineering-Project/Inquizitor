from __future__ import annotations

from dataclasses import dataclass

from .enums import ProcessingStatus
from .file import File


@dataclass(slots=True)
class Material:
    """Domain entity representing source material for generating content."""

    id: int | None
    owner_id: int
    file: File
    mime_type: str | None
    size_bytes: int | None
    checksum: str | None
    page_count: int | None = None
    status: ProcessingStatus = ProcessingStatus.PENDING
    extracted_text: str | None = None
    processing_error: str | None = None

    def mark_processed(self, text: str) -> None:
        self.status = ProcessingStatus.DONE
        self.extracted_text = text
        self.processing_error = None

    def mark_failed(self, error: str) -> None:
        self.status = ProcessingStatus.FAILED
        self.processing_error = error
        self.extracted_text = None


__all__ = ["Material"]

