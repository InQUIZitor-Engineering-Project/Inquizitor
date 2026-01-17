"""Service for material upload and processing workflows."""

from __future__ import annotations

import hashlib
import math
import time
from collections.abc import Callable, Sequence
from datetime import datetime
from pathlib import Path

from app.api.schemas.materials import MaterialOut, MaterialUpdate
from app.application import dto
from app.application.interfaces import DocumentAnalyzer, FileStorage, UnitOfWork
from app.domain.models import File as FileDomain
from app.domain.models import Material as MaterialDomain
from app.domain.models.enums import AnalysisStatus, ProcessingStatus


class MaterialService:
    def __init__(
        self,
        uow_factory: Callable[[], UnitOfWork],
        *,
        storage: FileStorage,
        text_extractor: Callable[[Path, str | None], str],
        analyzer: DocumentAnalyzer | None = None,
        mime_detector: Callable[[Path], str | None] | None = None,
        max_text_length: int = 1_000_000,
    ) -> None:
        self._uow_factory = uow_factory
        self._storage = storage
        self._text_extractor = text_extractor
        self._analyzer = analyzer
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

        # 1. Detect metadata from content directly (before S3 upload)
        import tempfile
        with tempfile.NamedTemporaryFile(delete=True, suffix=extension) as tmp:
            tmp.write(content)
            tmp.flush()
            local_path = Path(tmp.name)
            
            size_bytes = len(content)
            mime_type = self._detect_mime(local_path)
            page_count = self._estimate_page_count(
                local_path, mime_type, filename=filename
            )

        # 2. Save to S3
        stored_path_str = self._storage.save(
            owner_id=owner_id,
            filename=filename,
            content=content,
        )

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

    def _estimate_page_count(
        self,
        local: Path,
        mime_type: str | None,
        *,
        filename: str | None = None,
    ) -> int:
        extension = Path(filename).suffix.lower() if filename else local.suffix.lower()

        if extension in {".png", ".jpg", ".jpeg", ".webp"}:
            return 1

        if extension == ".pdf" or mime_type == "application/pdf":
            try:
                from pypdf import PdfReader

                reader = PdfReader(local)
                return len(reader.pages)
            except Exception:
                return 1

        if extension == ".docx":
            try:
                import xml.etree.ElementTree as ET
                import zipfile

                with zipfile.ZipFile(local) as docx_zip:
                    with docx_zip.open("docProps/app.xml") as app_xml:
                        tree = ET.parse(app_xml)
                        root = tree.getroot()
                        pages = root.find(".//{*}Pages")
                        if pages is not None and pages.text:
                            value = int(pages.text)
                            if value > 0:
                                return value
            except Exception:
                pass

            try:
                text = self._text_extractor(local, mime_type) or ""
            except Exception:
                text = ""

            char_count = len(text.strip())
            if char_count == 0:
                return 1
            return max(1, math.ceil(char_count / 2500))

        if extension in {".txt", ".md"}:
            try:
                text = self._text_extractor(local, mime_type) or ""
            except Exception:
                text = ""

            char_count = len(text.strip())
            if char_count == 0:
                return 1
            return max(1, math.ceil(char_count / 2500))

        return 1

    def _empty_extraction_error(
        self,
        local: Path,
        mime_type: str | None,
        *,
        filename: str | None = None,
    ) -> str:
        extension = Path(filename).suffix.lower() if filename else local.suffix.lower()
        is_pdf = extension == ".pdf" or mime_type == "application/pdf"
        is_image = extension in {".png", ".jpg", ".jpeg", ".webp"} or (
            mime_type and mime_type.startswith("image/")
        )

        if extension == ".docx":
            return (
                "Dokument DOCX nie zawiera tekstu do odczytu "
                "(może to być skan lub obraz)."
            )
        if is_pdf:
            return (
                "Nie udało się rozpoznać tekstu w PDF (brak warstwy tekstowej "
                "lub zbyt niska jakość skanu)."
            )
        if is_image:
            return (
                "Nie udało się rozpoznać tekstu na obrazie "
                "(sprawdź jakość lub kontrast)."
            )
        return "Could not extract text (unsupported or empty)."

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

                if material.page_count is None:
                    material.page_count = self._estimate_page_count(
                        local, mime_type, filename=file_record.filename
                    )

                # 1. Local text extraction (fast)
                try:
                    raw_text = self._text_extractor(local, mime_type)
                    normalized_text = self._sanitize_text(raw_text)
                    material.mark_processed(normalized_text or "")
                except Exception as exc:
                    material.mark_failed(str(exc))
                    normalized_text = ""

                # 2. LLM Analysis (Multi-modal)
                # Always send to LLM unless it's a plain .txt file
                is_txt = (file_record.filename or "").lower().endswith(".txt")
                
                if is_txt:
                    # For .txt files, twin is just the text
                    material.markdown_twin = normalized_text
                    material.analysis_status = AnalysisStatus.DONE
                elif self._analyzer:
                    try:
                        markdown_twin, routing, _usage, _title = self._analyzer.analyze(
                            source_text=normalized_text or "",
                            filename=file_record.filename,
                            mime_type=mime_type,
                            file_path=str(local),
                        )
                        material.markdown_twin = markdown_twin
                        material.routing_tier = routing
                        material.analysis_status = AnalysisStatus.DONE
                        material.analysis_version = "v1"
                    except Exception as exc:
                        material.analysis_status = AnalysisStatus.FAILED
                        material.processing_error = f"LLM Analysis failed: {exc}"

            updated = uow.materials.update(material)

        return dto.to_material_out(
            updated,
            cache_hit=False,
            duration_ocr_sec=None,
        )


__all__ = ["MaterialService"]

