# app/services/extract.py
from pathlib import Path
from typing import Optional, List

def _read_txt(p: Path) -> str:
    try:
        import chardet
        data = p.read_bytes()
        enc = chardet.detect(data)["encoding"] or "utf-8"
        return data.decode(enc, errors="ignore")
    except Exception:
        return p.read_text(errors="ignore")

def _read_pdf(p: Path) -> str:
    from pypdf import PdfReader
    r = PdfReader(str(p))
    return "\n".join((page.extract_text() or "") for page in r.pages)

def _read_docx(p: Path) -> str:
    import docx
    d = docx.Document(str(p))
    return "\n".join(par.text for par in d.paragraphs)

def extract_text_from_file(path: Path, mime: Optional[str]) -> Optional[str]:
    ext = path.suffix.lower()
    try:
        if ext in [".txt", ".md", ".csv"]:
            return _read_txt(path)
        if ext == ".pdf":
            return _read_pdf(path)
        if ext in [".docx"]:
            return _read_docx(path)
        # Images (jpg/png) are not OCR'd here, return None for now
        return None
    except Exception:
        return None