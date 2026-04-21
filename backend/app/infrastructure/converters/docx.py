from __future__ import annotations

import subprocess
from pathlib import Path


def convert_docx_to_pdf(docx_path: Path) -> Path:
    """Convert a .docx file to PDF using LibreOffice headless.

    The output PDF is placed next to the source file. The caller is
    responsible for deleting it after use.
    """
    outdir = docx_path.parent
    result = subprocess.run(
        [
            "libreoffice",
            "--headless",
            "--convert-to", "pdf",
            "--outdir", str(outdir),
            str(docx_path),
        ],
        capture_output=True,
        text=True,
        timeout=120,
    )
    if result.returncode != 0:
        raise RuntimeError(
            f"LibreOffice conversion failed (code {result.returncode}): {result.stderr}"
        )

    pdf_path = outdir / (docx_path.stem + ".pdf")
    if not pdf_path.exists():
        raise RuntimeError(f"LibreOffice did not produce a PDF at {pdf_path}")

    return pdf_path
