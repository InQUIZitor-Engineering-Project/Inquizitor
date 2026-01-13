"""Service for material upload and processing workflows."""

from __future__ import annotations

import hashlib
from collections.abc import Callable, Sequence
from datetime import datetime
from pathlib import Path

from app.api.schemas.materials import MaterialOut, MaterialUpdate
from app.application import dto
from app.application.interfaces import FileStorage, UnitOfWork
from app.domain.models import File as FileDomain
from app.domain.models import Material as MaterialDomain
from app.domain.models.enums import ProcessingStatus


class MaterialService:
    def __init__(
        self,
        uow_factory: Callable[[], UnitOfWork],
        *,
        storage: FileStorage,
        text_extractor: Callable[[Path, str | None], str],
        mime_detector: Callable[[Path], str | None] | None = None,
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
        allowed_extensions: Sequence[str] | None = None,
    ) -> MaterialOut:
        extension = Path(filename).suffix.lower()
        if allowed_extensions and extension not in allowed_extensions:
            raise ValueError("Unsupported file extension")

        stored_path_str = self._storage.save(
            owner_id=owner_id,
            filename=filename,
            content=content,
        )
        with self._storage.download_to_temp(stored_path=stored_path_str) as local_path:
            local = Path(local_path)
            size_bytes = local.stat().st_size if local.exists() else len(content)
            mime_type = self._detect_mime(local)

            page_count = None
            if mime_type == "application/pdf" or local.suffix.lower() == ".pdf":
                try:
                    from pypdf import PdfReader

                    reader = PdfReader(local)
                    page_count = len(reader.pages)
                except Exception:
                    pass

        checksum = hashlib.sha256(content).hexdigest()

        file_domain = FileDomain(
            id=None,
            owner_id=owner_id,
            filename=filename,
            stored_path=Path(stored_path_str),
            uploaded_at=datetime.utcnow(),
        )

        with self._uow_factory() as uow:
            file_record = uow.files.add(file_domain)

            material = MaterialDomain(
                id=None,
                owner_id=owner_id,
                file=file_record,
                mime_type=mime_type,
                size_bytes=size_bytes,
                page_count=page_count,
                checksum=checksum,
                status=ProcessingStatus.PENDING,
                extracted_text=None,
                processing_error=None,
            )

            material_record = uow.materials.add(material)

        return dto.to_material_out(material_record)

    def list_materials(self, *, owner_id: int) -> list[MaterialOut]:
        with self._uow_factory() as uow:
            materials = list(uow.materials.list_for_user(owner_id))

        return dto.to_materials_out(materials)

    def get_material(self, *, owner_id: int, material_id: int) -> MaterialOut:
        with self._uow_factory() as uow:
            material = uow.materials.get(material_id)
            if not material or material.owner_id != owner_id:
                raise ValueError("Materiał nie został znaleziony")
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
                raise ValueError("Materiał nie został znaleziony")

            if payload.extracted_text is not None:
                material.extracted_text = self._sanitize_text(payload.extracted_text)
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
                raise ValueError("Materiał nie został znaleziony")

            file_id = material.file.id
            stored_path = str(material.file.stored_path)

            uow.materials.remove(material_id)
            self._storage.delete(stored_path=stored_path)
            if file_id is not None:
                uow.files.remove(file_id)

    def _detect_mime(self, path: Path) -> str | None:
        if not self._mime_detector:
            return None
        try:
            return self._mime_detector(path)
        except Exception:
            return None

    def _sanitize_text(self, text: str | None) -> str | None:
        """
        Ensure a string is valid Unicode and does not contain surrogate
        characters. Invalid bytes/characters are replaced and the result
        is truncated to `max_text_length`.
        """
        if not text:
            return None

        cleaned = (
            text.encode("utf-8", errors="replace").decode("utf-8", errors="replace")
        )
        return cleaned[: self._max_text_length]

    def process_material(self, *, owner_id: int, material_id: int) -> MaterialOut:
        with self._uow_factory() as uow:
            material = uow.materials.get(material_id)
            if not material or material.owner_id != owner_id:
                raise ValueError("Materiał nie został znaleziony")

            file_record = material.file
            if not file_record:
                raise ValueError("Plik nie został znaleziony dla tego materiału")

            with self._storage.download_to_temp(
                stored_path=str(file_record.stored_path)
            ) as local_path:
                local = Path(local_path)
                mime_type = self._detect_mime(local)
                material.mime_type = mime_type
                material.size_bytes = local.stat().st_size if local.exists() else None

                # Detect page count for PDFs
                if mime_type == "application/pdf" or local.suffix.lower() == ".pdf":
                    try:
                        from pypdf import PdfReader
                        reader = PdfReader(local)
                        material.page_count = len(reader.pages)
                    except Exception:
                        material.page_count = None

                try:
                    raw_text = self._text_extractor(local, mime_type)
                    normalized_text = self._sanitize_text(raw_text)
                    if normalized_text:
                        material.mark_processed(normalized_text)
                    else:
                        material.mark_failed(
                            "Could not extract text (unsupported or empty)"
                        )
                except Exception as exc:
                    material.mark_failed(str(exc))

            updated = uow.materials.update(material)

        return dto.to_material_out(updated)


__all__ = ["MaterialService"]

