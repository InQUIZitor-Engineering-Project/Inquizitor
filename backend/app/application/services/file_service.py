"""Service coordinating file upload and management."""

from __future__ import annotations

from datetime import datetime
from pathlib import Path
from typing import Callable, Iterable, List, Optional, Sequence

from app.api.schemas.tests import FileUploadResponse
from app.application import dto
from app.application.interfaces import FileStorage, UnitOfWork
from app.domain.models import File as FileDomain


class FileService:
    def __init__(
        self,
        uow_factory: Callable[[], UnitOfWork],
        *,
        storage: FileStorage,
    ) -> None:
        self._uow_factory = uow_factory
        self._storage = storage

    def upload_file(
        self,
        *,
        owner_id: int,
        filename: str,
        content: bytes,
        allowed_extensions: Optional[Sequence[str]] = None,
    ) -> FileUploadResponse:
        extension = Path(filename).suffix.lower()
        if allowed_extensions and extension not in allowed_extensions:
            raise ValueError("Unsupported file extension")

        stored_path = self._storage.save(
            owner_id=owner_id,
            filename=filename,
            content=content,
        )

        file_domain = FileDomain(
            id=None,
            owner_id=owner_id,
            filename=filename,
            stored_path=Path(stored_path),
            uploaded_at=datetime.utcnow(),
        )

        with self._uow_factory() as uow:
            created_file = uow.files.add(file_domain)

        return FileUploadResponse(
            file_id=created_file.id,
            filename=created_file.filename,
        )

    def list_files(self, *, owner_id: int) -> Iterable[FileDomain]:
        with self._uow_factory() as uow:
            files = list(uow.files.list_for_user(owner_id))
        return files

    def delete_file(self, *, owner_id: int, file_id: int) -> None:
        with self._uow_factory() as uow:
            file_record = uow.files.get(file_id)
            if not file_record or file_record.owner_id != owner_id:
                raise ValueError("File not found")

            uow.files.remove(file_id)
            self._storage.delete(stored_path=str(file_record.stored_path))


__all__ = ["FileService"]

