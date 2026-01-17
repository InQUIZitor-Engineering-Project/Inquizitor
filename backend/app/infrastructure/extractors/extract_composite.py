# app/infrastructure/extract_composite.py
from __future__ import annotations

from pathlib import Path

import pytesseract
from pdf2image import convert_from_path  # type: ignore[attr-defined]

from app.infrastructure.ocr import DefaultOCRService

from .text import extract_text_from_file

IMAGE_EXTS = {".png", ".jpg", ".jpeg", ".tif", ".tiff", ".bmp", ".webp"}
PDF_MIME = "application/pdf"
DEFAULT_LANG = "pol+eng"


def composite_text_extractor(path: Path, mime: str | None) -> str:
    """
    Extracts text from a file using standard text extractors.
    No OCR (Tesseract) is performed here - we rely on LLM for scanned files.
    """
    text = extract_text_from_file(path, mime) or ""
    return text.strip()
