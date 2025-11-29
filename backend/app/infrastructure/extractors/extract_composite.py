# app/infrastructure/extract_composite.py
from __future__ import annotations
from pathlib import Path
from typing import Optional

from app.infrastructure.extractors import extract_text_from_file
from app.infrastructure.ocr import DefaultOCRService

IMAGE_EXTS = {".png", ".jpg", ".jpeg", ".tif", ".tiff", ".bmp", ".webp"}

def composite_text_extractor(path: Path, mime: Optional[str]) -> str:
    text = extract_text_from_file(path, mime) or ""
    text = text.strip()

    is_image = (mime and mime.startswith("image/")) or (path.suffix.lower() in IMAGE_EXTS)
    if not text and is_image:
        ocr = DefaultOCRService(language="pol+eng")
        try:
            text = (ocr.extract_text(file_path=str(path)) or "").strip()
        except Exception:
            text = ""

    return text
