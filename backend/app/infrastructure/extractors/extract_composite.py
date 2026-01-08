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


def _ocr_pdf(path: Path, language: str = DEFAULT_LANG, dpi: int = 300) -> str:
    """
    OCR fallback for PDFs without text layer.
    Converts pages to images and runs Tesseract.
    """
    try:
        images = convert_from_path(path, dpi=dpi)
    except Exception:
        return ""

    texts = []
    for img in images:
        try:
            texts.append(pytesseract.image_to_string(img, lang=language) or "")
        except Exception:
            continue
    return "\n".join(texts).strip()


def composite_text_extractor(path: Path, mime: str | None) -> str:
    text = extract_text_from_file(path, mime) or ""
    text = text.strip()

    is_pdf = path.suffix.lower() == ".pdf" or (
        mime and mime.lower().startswith(PDF_MIME)
    )
    if not text and is_pdf:
        text = _ocr_pdf(path)

    is_image = (mime and mime.startswith("image/")) or (
        path.suffix.lower() in IMAGE_EXTS
    )
    if not text and is_image:
        ocr = DefaultOCRService(language=DEFAULT_LANG)
        try:
            text = (ocr.extract_text(file_path=str(path)) or "").strip()
        except Exception:
            text = ""

    return text
