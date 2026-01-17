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

    try:
        document = docx.Document(str(path))
    except Exception:
        document = None

    parts: list[str] = []

    def collect_text(parent: object) -> None:
        paragraphs = getattr(parent, "paragraphs", None)
        if paragraphs:
            for paragraph in paragraphs:
                text = paragraph.text.strip()
                if text:
                    parts.append(text)

        tables = getattr(parent, "tables", None)
        if tables:
            for table in tables:
                for row in table.rows:
                    for cell in row.cells:
                        collect_text(cell)

    if document:
        collect_text(document)
        for section in document.sections:
            collect_text(section.header)
            collect_text(section.footer)

    text_value = "\n".join(parts)
    if len(text_value.strip()) >= 50:
        return text_value

    try:
        import docx2txt

        fallback_text = docx2txt.process(str(path))
        return fallback_text.strip()
    except Exception:
        return text_value


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
