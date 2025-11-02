from __future__ import annotations

import json
import subprocess
import tempfile
import xml.etree.ElementTree as ET
from pathlib import Path
from typing import List, Optional

from jinja2 import Environment, FileSystemLoader, select_autoescape

_LATEX_MAP = {
    "&": r"\&",
    "%": r"\%",
    "$": r"\$",
    "#": r"\#",
    "_": r"\_",
    "{": r"\{",
    "}": r"\}",
    "~": r"\textasciitilde{}",
    "^": r"\textasciicircum{}",
    "\\": r"\textbackslash{}",
}


def latex_escape(text: str) -> str:
    return "".join(_LATEX_MAP.get(ch, ch) for ch in text)


def _to_list(value) -> Optional[List[str]]:
    if value is None:
        return None
    if isinstance(value, list):
        return [str(item) for item in value]
    if isinstance(value, str):
        try:
            decoded = json.loads(value)
        except Exception:
            return [value.strip().strip('"').strip("'")]
        if isinstance(decoded, list):
            return [str(item) for item in decoded]
        return [str(decoded)]
    return [str(value)]


THIS_DIR = Path(__file__).resolve().parent
APP_ROOT = THIS_DIR.parents[2]
BACKEND_ROOT = APP_ROOT.parent


search_paths = list(
    dict.fromkeys(
        [
            "/app/app/templates",
            str(APP_ROOT / "templates"),
            str(BACKEND_ROOT / "templates"),
            str(THIS_DIR / "templates"),
        ]
    )
)

env = Environment(
    loader=FileSystemLoader(search_paths),
    autoescape=select_autoescape([]),
    block_start_string="[%",
    block_end_string="%]",
    variable_start_string="{{",
    variable_end_string="}}",
    comment_start_string="[#",
    comment_end_string="#]",
)
env.filters["latex"] = latex_escape


def render_test_to_tex(
    title: str,
    questions: List[dict],
    show_answers: bool = False,
    *,
    brand_hex: str = "4CAF4F",
    logo_path: Optional[str] = None,
) -> str:
    items = []
    for question in questions:
        choices = _to_list(question.get("choices")) or []
        correct = set(_to_list(question.get("correct_choices")) or [])
        items.append(
            {
                "text": str(question.get("text", "")),
                "is_closed": bool(question.get("is_closed", True)),
                "choices": choices,
                "correct_choices": list(correct),
            }
        )

    template = env.get_template("test.tex.j2")
    return template.render(
        title=title,
        questions=items,
        show_answers=show_answers,
        brand_hex=brand_hex,
        logo_path=logo_path,
    )


def compile_tex_to_pdf(tex_source: str) -> bytes:
    with tempfile.TemporaryDirectory() as tmp:
        tmpdir = Path(tmp)
        tex_path = tmpdir / "test.tex"
        tex_path.write_text(tex_source, encoding="utf-8")

        cmd = [
            "xelatex",
            "-interaction=nonstopmode",
            "-halt-on-error",
            "-output-directory",
            str(tmpdir),
            str(tex_path),
        ]
        for _ in range(2):
            proc = subprocess.run(cmd, capture_output=True, text=True)
            if proc.returncode != 0:
                raise RuntimeError(
                    "LaTeX error:\nSTDOUT:\n{stdout}\nSTDERR:\n{stderr}".format(
                        stdout=proc.stdout,
                        stderr=proc.stderr,
                    )
                )

        pdf_path = tmpdir / "test.pdf"
        return pdf_path.read_bytes()


def test_to_xml_bytes(test: dict) -> bytes:
    root = ET.Element(
        "Test",
        attrib={
            "id": str(test["id"]),
            "title": test["title"],
        },
    )
    for question in test["questions"]:
        question_el = ET.SubElement(
            root,
            "Question",
            attrib={
                "id": str(question["id"]),
                "type": "closed" if question.get("is_closed", True) else "open",
                "difficulty": str(question.get("difficulty", 1)),
            },
        )
        text_el = ET.SubElement(question_el, "Text")
        text_el.text = question.get("text", "")
        choices = _to_list(question.get("choices"))
        if choices:
            choices_el = ET.SubElement(question_el, "Choices")
            correct = set(_to_list(question.get("correct_choices")) or [])
            for choice in choices:
                choice_el = ET.SubElement(
                    choices_el,
                    "Choice",
                    attrib={"correct": "true" if choice in correct else "false"},
                )
                choice_el.text = choice
    return ET.tostring(root, encoding="utf-8", xml_declaration=True)


__all__ = [
    "render_test_to_tex",
    "compile_tex_to_pdf",
    "test_to_xml_bytes",
]
