"""Service for deep document analysis and routing."""

from __future__ import annotations

from collections.abc import Callable
import logging
from pathlib import Path

from app.api.schemas.materials import MaterialOut
from app.application import dto
from app.application.interfaces import DocumentAnalyzer, FileStorage, UnitOfWork
from app.domain.models.enums import AnalysisStatus

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
                mime_type = self._detect_mime(local) or material.mime_type
                material.mime_type = mime_type

                try:
                    markdown_twin, routing, _usage, _title = self._analyzer.analyze(
                        source_text="",
                        filename=file_record.filename,
                        mime_type=mime_type,
                        file_path=str(local),
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
                    updated = uow.materials.update(material)
                    return dto.to_material_out(updated)

                material.routing_tier = routing
                material.analysis_version = ANALYSIS_PIPELINE_VERSION
                material.markdown_twin = markdown_twin
                material.analysis_status = AnalysisStatus.DONE

            updated = uow.materials.update(material)

        return dto.to_material_out(updated)

    def _detect_mime(self, path: Path) -> str | None:
        if not self._mime_detector:
            return None
        try:
            return self._mime_detector(path)
        except Exception:
            return None

__all__ = ["MaterialAnalysisService"]

