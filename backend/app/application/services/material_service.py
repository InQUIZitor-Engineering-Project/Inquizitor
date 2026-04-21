"""Service for material upload and processing workflows."""

from __future__ import annotations

import hashlib
import logging
import math
from collections.abc import Callable, Sequence
from datetime import datetime
from pathlib import Path

from app.api.schemas.materials import MaterialOut, MaterialUpdate
from app.application import dto
from app.application.interfaces import DocumentAnalyzer, FileStorage, UnitOfWork
from app.domain.models import File as FileDomain
from app.domain.models import Material as MaterialDomain
from app.domain.models.enums import AnalysisStatus, ProcessingStatus
from app.infrastructure.converters import convert_docx_to_pdf
from app.infrastructure.extractors.text import _read_docx
from app.infrastructure.thumbnails import (
    can_generate_thumbnail,
    generate_and_save_thumbnail,
)

logger = logging.getLogger(__name__)


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
            # Check if material with same checksum already exists (cache hit)
            existing_material = uow.materials.get_by_checksum(owner_id, checksum)
            
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

            # If existing material has markdown_twin (from cache), copy to new material
            if existing_material and existing_material.markdown_twin:
                material.extracted_text = existing_material.extracted_text
                material.markdown_twin = existing_material.markdown_twin
                material.analysis_status = existing_material.analysis_status
                material.routing_tier = existing_material.routing_tier
                material.analysis_version = existing_material.analysis_version
                material.status = ProcessingStatus.DONE
                # Copy thumbnail if it exists, otherwise we'll generate it
                material.thumbnail_path = existing_material.thumbnail_path

            material_record = uow.materials.add(material)
            
            # If we copied from cache but don't have thumbnail, generate it
            no_thumb = not material_record.thumbnail_path
            if existing_material and existing_material.markdown_twin and no_thumb:
                mid = material_record.id
                if mid is not None:
                    import tempfile
                    with tempfile.NamedTemporaryFile(
                        delete=True, 
                        suffix=extension
                    ) as tmp:
                        tmp.write(content)
                        tmp.flush()
                        local_path = Path(tmp.name)
                        thumb_path = generate_and_save_thumbnail(
                            self._storage,
                            owner_id=owner_id,
                            material_id=mid,
                            local_path=local_path,
                            mime_type=mime_type,
                            filename=filename,
                        )
                        if thumb_path:
                            material_record.thumbnail_path = thumb_path
                            material_record = uow.materials.update(material_record)
                        else:
                            logger.warning(
                                "Failed to generate thumbnail for cached material %s",
                                mid,
                            )

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

    def generate_thumbnail_for_material(
        self, *, owner_id: int, material_id: int
    ) -> bool:
        """
        Generate and save thumbnail for one material (for backfill).
        Returns True if thumbnail was generated and saved, False otherwise.
        """
        with self._uow_factory() as uow:
            material = uow.materials.get(material_id)
            if not material or material.owner_id != owner_id:
                raise ValueError("Materiał nie został znaleziony")
            file_record = material.file
            if not file_record or not material.id:
                return False
            if not can_generate_thumbnail(material.mime_type, file_record.filename):
                return False
            try:
                with self._storage.download_to_temp(
                    stored_path=str(file_record.stored_path)
                ) as local_path:
                    local = Path(local_path)
                    mime_type = self._detect_mime(local) or material.mime_type
                    thumb_path = generate_and_save_thumbnail(
                        self._storage,
                        owner_id=owner_id,
                        material_id=material.id,
                        local_path=local,
                        mime_type=mime_type,
                        filename=file_record.filename,
                    )
                    if thumb_path:
                        material.thumbnail_path = thumb_path
                        uow.materials.update(material)
                        return True
            except Exception as exc:
                logger.warning(
                    "Backfill thumbnail failed for material %s: %s",
                    material_id,
                    exc,
                    exc_info=True,
                )
        return False

    def list_materials_without_thumbnail(self) -> list[tuple[int, int]]:
        """List (owner_id, material_id) for materials without thumbnail (backfill)."""
        with self._uow_factory() as uow:
            materials = list(uow.materials.list_without_thumbnail())
        return [(m.owner_id, m.id) for m in materials if m.id is not None]

    def get_material_file_for_download(
        self, *, owner_id: int, material_id: int
    ) -> tuple[str, str, str | None]:
        """Return (filename, stored_path, mime_type) for download.
        Raises ValueError if not found."""
        with self._uow_factory() as uow:
            material = uow.materials.get(material_id)
            if not material or material.owner_id != owner_id:
                raise ValueError("Materiał nie został znaleziony")
            if not material.file:
                raise ValueError("Plik nie został znaleziony")
            return (
                material.file.filename,
                str(material.file.stored_path),
                material.mime_type,
            )

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

            if payload.filename is not None and payload.filename.strip():
                material.file.rename(payload.filename.strip())

            updated = uow.materials.update(material)

        return dto.to_material_out(updated)

    def delete_material(self, *, owner_id: int, material_id: int) -> None:
        with self._uow_factory() as uow:
            material = uow.materials.get(material_id)
            if not material or material.owner_id != owner_id:
                raise ValueError("Materiał nie został znaleziony")

            # Jeśli materiał ma checksum, usuń wszystkie materiały z tym samym checksum
            # (duplikaty tego samego pliku)
            if material.checksum:
                # Znajdź wszystkie materiały użytkownika z tym samym checksum
                all_materials = list(uow.materials.list_for_user(owner_id))
                duplicates = [
                    m for m in all_materials
                    if m.checksum == material.checksum and m.id is not None
                ]
                
                # Usuń wszystkie duplikaty
                stored_paths_to_delete = set()
                file_ids_to_delete = set()
                
                for dup in duplicates:
                    if dup.file and dup.file.id:
                        stored_paths_to_delete.add(str(dup.file.stored_path))
                        file_ids_to_delete.add(dup.file.id)
                    if dup.id:
                        uow.materials.remove(dup.id)
                
                # Usuń pliki z storage (tylko raz dla każdego unikalnego path)
                for stored_path in stored_paths_to_delete:
                    self._storage.delete(stored_path=stored_path)
                
                # Usuń rekordy File z bazy
                for file_id in file_ids_to_delete:
                    uow.files.remove(file_id)
            else:
                # Jeśli nie ma checksum, usuń tylko ten jeden materiał
                single_file_id: int | None = (
                    material.file.id if material.file else None
                )
                single_stored_path: str | None = (
                    str(material.file.stored_path) if material.file else None
                )

                uow.materials.remove(material_id)
                if single_stored_path:
                    self._storage.delete(stored_path=single_stored_path)
                if single_file_id is not None:
                    uow.files.remove(single_file_id)

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

                # .docx → PDF so Gemini can process embedded images/charts
                converted_pdf: Path | None = None
                docx_text_fallback: str | None = None
                is_docx = (file_record.filename or "").lower().endswith(".docx") or local.suffix.lower() == ".docx"
                if is_docx:
                    try:
                        converted_pdf = convert_docx_to_pdf(local)
                        local = converted_pdf
                    except Exception as exc:
                        logger.warning("DOCX→PDF conversion failed, falling back to text extraction: %s", exc)
                        try:
                            docx_text_fallback = _read_docx(local) or ""
                        except Exception:
                            docx_text_fallback = ""

                mime_type = self._detect_mime(local)
                material.mime_type = mime_type
                material.size_bytes = local.stat().st_size if local.exists() else None

                if material.page_count is None:
                    material.page_count = self._estimate_page_count(
                        local, mime_type, filename=file_record.filename
                    )

                # 0. Generate thumbnail (if supported);
                # stored with material_id in metadata.
                can_thumb = can_generate_thumbnail(mime_type, file_record.filename)
                if can_thumb and material.id:
                    thumb_path = generate_and_save_thumbnail(
                        self._storage,
                        owner_id=owner_id,
                        material_id=material.id,
                        local_path=local,
                        mime_type=mime_type,
                        filename=file_record.filename,
                    )
                    if thumb_path:
                        material.thumbnail_path = thumb_path
                    else:
                        logger.warning(
                            "Thumbnail None for material %s mime %s",
                            material.id,
                            mime_type,
                        )

                # 1. LLM Analysis (Multi-modal) - Gemini extracts from files.
                # We skip local text extraction and rely on Gemini.
                is_txt = (file_record.filename or "").lower().endswith(".txt")

                if docx_text_fallback is not None and self._analyzer:
                    # PDF conversion failed; pass extracted text as source_text (no file upload)
                    try:
                        markdown_twin, routing, _usage, _title = self._analyzer.analyze(
                            source_text=docx_text_fallback,
                            filename=file_record.filename,
                            mime_type="text/plain",
                            file_path=None,
                            user_id=owner_id,
                            ocr_cache_repository=uow.ocr_cache,
                        )
                        material.markdown_twin = markdown_twin
                        material.routing_tier = routing
                        material.analysis_status = AnalysisStatus.DONE
                        material.analysis_version = "v1"
                        if markdown_twin:
                            import re
                            plain_text = re.sub(r'[#*_`\[\]()]', '', markdown_twin)
                            plain_text = re.sub(r'\n+', '\n', plain_text).strip()
                            if plain_text:
                                material.extracted_text = plain_text
                                material.status = ProcessingStatus.DONE
                                material.processing_error = None
                            else:
                                material.mark_failed("Gemini returned empty content")
                        else:
                            material.mark_failed("Gemini returned no content")
                    except Exception as exc:
                        material.analysis_status = AnalysisStatus.FAILED
                        material.processing_error = f"LLM Analysis failed: {exc}"
                        material.mark_failed(material.processing_error)
                elif is_txt:
                    # For .txt files, read directly and use as markdown_twin
                    try:
                        raw_text: str | None = self._text_extractor(local, mime_type)
                        normalized_text: str | None = self._sanitize_text(raw_text)
                        if normalized_text and normalized_text.strip():
                            material.markdown_twin = normalized_text
                            material.extracted_text = normalized_text
                            material.analysis_status = AnalysisStatus.DONE
                            material.status = ProcessingStatus.DONE
                        else:
                            error_msg = self._empty_extraction_error(
                                local, mime_type, filename=file_record.filename
                            )
                            material.mark_failed(error_msg)
                    except Exception as exc:
                        material.mark_failed(str(exc))
                elif self._analyzer:
                    # Use Gemini to extract and analyze text from file
                    try:
                        markdown_twin, routing, _usage, _title = self._analyzer.analyze(
                            source_text="",  # Gemini extracts from file_path
                            filename=file_record.filename,
                            mime_type=mime_type,
                            file_path=str(local),
                            user_id=owner_id,
                            ocr_cache_repository=uow.ocr_cache,
                        )
                        material.markdown_twin = markdown_twin
                        material.routing_tier = routing
                        material.analysis_status = AnalysisStatus.DONE
                        material.analysis_version = "v1"
                        
                        # Extract plain text from markdown for extracted_text
                        if markdown_twin:
                            import re
                            # Remove markdown formatting to get plain text
                            plain_text = re.sub(r'[#*_`\[\]()]', '', markdown_twin)
                            plain_text = re.sub(r'\n+', '\n', plain_text).strip()
                            if plain_text:
                                material.extracted_text = plain_text
                                material.status = ProcessingStatus.DONE
                                material.processing_error = None
                            else:
                                # Empty markdown_twin - mark as failed
                                material.mark_failed("Gemini returned empty content")
                        else:
                            material.mark_failed("Gemini returned no content")
                    except Exception as exc:
                        material.analysis_status = AnalysisStatus.FAILED
                        material.processing_error = f"LLM Analysis failed: {exc}"
                        material.mark_failed(material.processing_error)
                else:
                    # No analyzer available - mark as failed
                    error_msg = "No analyzer available for this file type"
                    material.mark_failed(error_msg)

                if converted_pdf and converted_pdf.exists():
                    converted_pdf.unlink()

            # Update material with all changes (including thumbnail_path).
            # Guard against the race condition where the user deleted the material
            # while the background task was processing it.
            if uow.materials.get(material.id) is None:
                logger.warning(
                    "Material %s was deleted during processing — skipping update",
                    material.id,
                )
                return dto.to_material_out(material, cache_hit=False, duration_ocr_sec=None)
            updated = uow.materials.update(material)

        return dto.to_material_out(
            updated,
            cache_hit=False,
            duration_ocr_sec=None,
        )


__all__ = ["MaterialService"]

