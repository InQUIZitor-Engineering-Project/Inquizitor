"""Generate thumbnail and save to storage with material association."""

from __future__ import annotations

import logging
from pathlib import Path

from app.domain.services import FileStorage

from .generator import (
    can_generate_thumbnail,
    generate_thumbnail_from_image,
    generate_thumbnail_from_pdf,
)

logger = logging.getLogger(__name__)


def generate_and_save_thumbnail(
    storage: FileStorage,
    *,
    owner_id: int,
    material_id: int,
    local_path: Path,
    mime_type: str | None,
    filename: str | None,
) -> str | None:
    """
    Generate thumbnail from file and save to storage.
    Associates the stored object with the material via metadata (e.g. R2 Metadata material_id).
    Returns stored_path if successful, None otherwise.
    """
    if not can_generate_thumbnail(mime_type, filename):
        return None

    try:
        thumbnail_bytes: bytes | None = None
        is_pdf = mime_type == "application/pdf" or (
            filename and filename.lower().endswith(".pdf")
        )
        if is_pdf:
            thumbnail_bytes = generate_thumbnail_from_pdf(local_path)
        elif mime_type and mime_type.startswith("image/"):
            thumbnail_bytes = generate_thumbnail_from_image(local_path)

        if not thumbnail_bytes:
            return None

        thumbnail_filename = f"thumb_{material_id}.jpg"
        stored_path = storage.save(
            owner_id=owner_id,
            filename=thumbnail_filename,
            content=thumbnail_bytes,
            metadata={"material_id": str(material_id)},
        )
        return stored_path
    except Exception as exc:
        logger.warning(
            "Thumbnail generate_and_save failed for material_id=%s: %s",
            material_id,
            exc,
            exc_info=True,
        )
        return None
