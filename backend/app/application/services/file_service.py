"""Service coordinating file upload and management."""

from __future__ import annotations

import hashlib
from collections.abc import Callable, Iterable, Sequence
from datetime import datetime
from pathlib import Path

from app.api.schemas.tests import FileUploadResponse
from app.api.schemas.files import FileExistsResponse
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
        allowed_extensions: Sequence[str] | None = None,
    ) -> FileUploadResponse:
        extension = Path(filename).suffix.lower()
        if allowed_extensions and extension not in allowed_extensions:
            raise ValueError("Unsupported file extension")

        # Calculate content hash
        content_hash = hashlib.sha256(content).hexdigest()

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
            content_hash=content_hash,
        )

        with self._uow_factory() as uow:
            created_file = uow.files.add(file_domain)

        return FileUploadResponse(
            file_id=created_file.id,
            filename=created_file.filename,
        )

    def lookup_file_by_hash(
        self,
        *,
        owner_id: int,
        content_hash: str,
    ) -> FileExistsResponse:
        """Look up a file by its content hash for the current user."""
        with self._uow_factory() as uow:
            existing_file = uow.files.get_by_lookup(owner_id, content_hash)
        
        if existing_file:
            return FileExistsResponse(
                exists=True,
                file_id=existing_file.id,
                filename=existing_file.filename,
            )
        
        return FileExistsResponse(exists=False)

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

