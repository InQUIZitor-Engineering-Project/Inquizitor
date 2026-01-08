from __future__ import annotations

from pathlib import Path


def _read_txt(path: Path) -> str:
    try:
        import chardet

        data = path.read_bytes()
        encoding = chardet.detect(data)["encoding"] or "utf-8"
        # Always return valid UTF-8 without surrogate characters - unsupported
        # bytes are replaced when necessary.
        return data.decode(encoding, errors="replace")
    except Exception:
        return path.read_text(errors="replace")


def _read_pdf(path: Path) -> str:
    from pypdf import PdfReader

    reader = PdfReader(str(path))
    return "\n".join((page.extract_text() or "") for page in reader.pages)


def _read_docx(path: Path) -> str:
    import docx

    document = docx.Document(str(path))
    return "\n".join(paragraph.text for paragraph in document.paragraphs)


def extract_text_from_file(path: Path, mime: str | None) -> str | None:
    _ = mime
    extension = path.suffix.lower()
    try:
        if extension in [".txt", ".md", ".csv"]:
            return _read_txt(path)
        if extension == ".pdf":
            return _read_pdf(path)
        if extension == ".docx":
            return _read_docx(path)
        # Image OCR (jpg/png) is not handled here - fallback to dedicated OCR
        return None
    except Exception:
        return None
