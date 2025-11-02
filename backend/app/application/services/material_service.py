"""Service for material upload and processing workflows."""

from __future__ import annotations

import hashlib
from datetime import datetime
from pathlib import Path
from typing import Callable, Iterable, Optional, Sequence

from app.api.schemas.materials import MaterialOut, MaterialUpdate
from app.application import dto
from app.application.interfaces import FileStorage, UnitOfWork
from app.domain.models import File as FileDomain, Material as MaterialDomain
from app.domain.models.enums import ProcessingStatus


class MaterialService:
    def __init__(
        self,
        uow_factory: Callable[[], UnitOfWork],
        *,
        storage: FileStorage,
        text_extractor: Callable[[Path, Optional[str]], str],
        mime_detector: Optional[Callable[[Path], Optional[str]]] = None,
        max_text_length: int = 1_000_000,
    ) -> None:
        self._uow_factory = uow_factory
        self._storage = storage
        self._text_extractor = text_extractor
        self._mime_detector = mime_detector
        self._max_text_length = max_text_length

    def upload_material(
        self,
        *,
        owner_id: int,
        filename: str,
        content: bytes,
        allowed_extensions: Optional[Sequence[str]] = None,
    ) -> MaterialOut:
        extension = Path(filename).suffix.lower()
        if allowed_extensions and extension not in allowed_extensions:
            raise ValueError("Unsupported file extension")

        stored_path_str = self._storage.save(
            owner_id=owner_id,
            filename=filename,
            content=content,
        )
        stored_path = Path(stored_path_str)
        size_bytes = stored_path.stat().st_size if stored_path.exists() else len(content)
        mime_type = self._detect_mime(stored_path)
        checksum = hashlib.sha256(content).hexdigest()

        file_domain = FileDomain(
            id=None,
            owner_id=owner_id,
            filename=filename,
            stored_path=stored_path,
            uploaded_at=datetime.utcnow(),
        )

        with self._uow_factory() as uow:
            file_record = uow.files.add(file_domain)

            extracted_text = self._text_extractor(stored_path, mime_type)
            normalized_text = (
                extracted_text[: self._max_text_length]
                if extracted_text
                else None
            )

            status = (
                ProcessingStatus.DONE
                if normalized_text
                else ProcessingStatus.FAILED
            )
            processing_error = None if normalized_text else "Could not extract text (unsupported or empty)"

            material = MaterialDomain(
                id=None,
                owner_id=owner_id,
                file=file_record,
                mime_type=mime_type,
                size_bytes=size_bytes,
                checksum=checksum,
                status=status,
                extracted_text=normalized_text,
                processing_error=processing_error,
            )

            material_record = uow.materials.add(material)

        return dto.to_material_out(material_record)

    def list_materials(self, *, owner_id: int) -> List[MaterialOut]:
        with self._uow_factory() as uow:
            materials = list(uow.materials.list_for_user(owner_id))

        return dto.to_materials_out(materials)

    def get_material(self, *, owner_id: int, material_id: int) -> MaterialOut:
        with self._uow_factory() as uow:
            material = uow.materials.get(material_id)
            if not material or material.owner_id != owner_id:
                raise ValueError("Material not found")
        return dto.to_material_out(material)

    def update_material(
        self,
        *,
        owner_id: int,
        material_id: int,
        payload: MaterialUpdate,
    ) -> MaterialOut:
        with self._uow_factory() as uow:
            material = uow.materials.get(material_id)
            if not material or material.owner_id != owner_id:
                raise ValueError("Material not found")

            if payload.extracted_text is not None:
                material.extracted_text = payload.extracted_text[: self._max_text_length]
                material.status = ProcessingStatus.DONE
                material.processing_error = None

            if payload.processing_status is not None:
                material.status = ProcessingStatus(payload.processing_status)

            updated = uow.materials.update(material)

        return dto.to_material_out(updated)

    def delete_material(self, *, owner_id: int, material_id: int) -> None:
        with self._uow_factory() as uow:
            material = uow.materials.get(material_id)
            if not material or material.owner_id != owner_id:
                raise ValueError("Material not found")

            file_id = material.file.id
            stored_path = str(material.file.stored_path)

            uow.materials.remove(material_id)
            self._storage.delete(stored_path=stored_path)
            if file_id is not None:
                uow.files.remove(file_id)

    def _detect_mime(self, path: Path) -> Optional[str]:
        if not self._mime_detector:
            return None
        try:
            return self._mime_detector(path)
        except Exception:
            return None


__all__ = ["MaterialService"]

