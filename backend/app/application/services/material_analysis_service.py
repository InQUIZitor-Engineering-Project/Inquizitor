"""Service for deep document analysis and routing."""

from __future__ import annotations

import logging
from collections.abc import Callable
from pathlib import Path

from app.api.schemas.materials import MaterialOut
from app.application import dto
from app.application.interfaces import DocumentAnalyzer, FileStorage, UnitOfWork
from app.domain.models.enums import AnalysisStatus
from app.infrastructure.converters import convert_docx_to_pdf
from app.infrastructure.extractors.text import _read_docx

logger = logging.getLogger(__name__)

ANALYSIS_PIPELINE_VERSION = "v1"


class MaterialAnalysisService:
    def __init__(
        self,
        uow_factory: Callable[[], UnitOfWork],
        *,
        storage: FileStorage,
        analyzer: DocumentAnalyzer,
        mime_detector: Callable[[Path], str | None] | None = None,
    ) -> None:
        self._uow_factory = uow_factory
        self._storage = storage
        self._analyzer = analyzer
        self._mime_detector = mime_detector

    def analyze_material(self, *, owner_id: int, material_id: int) -> MaterialOut:
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

                mime_type = self._detect_mime(local) or material.mime_type
                material.mime_type = mime_type

                try:
                    if docx_text_fallback is not None:
                        markdown_twin, routing, _usage, _title = self._analyzer.analyze(
                            source_text=docx_text_fallback,
                            filename=file_record.filename,
                            mime_type="text/plain",
                            file_path=None,
                            user_id=owner_id,
                            ocr_cache_repository=uow.ocr_cache,
                        )
                    else:
                        markdown_twin, routing, _usage, _title = self._analyzer.analyze(
                            source_text="",
                            filename=file_record.filename,
                            mime_type=mime_type,
                            file_path=str(local),
                            user_id=owner_id,
                            ocr_cache_repository=uow.ocr_cache,
                        )
                except Exception as exc:
                    message = str(exc).strip() or (
                        "Nie udało się przeanalizować dokumentu."
                    )
                    material.analysis_status = AnalysisStatus.FAILED
                    material.processing_error = message
                    logger.warning(
                        "Material analysis failed for %s: %s", material.id, message
                    )
                    updated = uow.materials.update_analysis(material)
                    if converted_pdf and converted_pdf.exists():
                        converted_pdf.unlink()
                    return dto.to_material_out(updated)

                if converted_pdf and converted_pdf.exists():
                    converted_pdf.unlink()

                material.routing_tier = routing
                material.analysis_version = ANALYSIS_PIPELINE_VERSION
                material.markdown_twin = markdown_twin
                material.analysis_status = AnalysisStatus.DONE

            updated = uow.materials.update_analysis(material)

        return dto.to_material_out(updated)

    def _detect_mime(self, path: Path) -> str | None:
        if not self._mime_detector:
            return None
        try:
            return self._mime_detector(path)
        except Exception:
            return None

__all__ = ["MaterialAnalysisService"]

