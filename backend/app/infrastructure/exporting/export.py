from __future__ import annotations

import json
import subprocess
import tempfile
import xml.etree.ElementTree as ET
from pathlib import Path
from typing import Any, cast

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


def latex_with_math(text: str) -> str:
    """
    Escape LaTeX special chars, but keep math segments written as $...$ or $$...$$
    intact so they are rendered in math mode.
    """
    if text is None:
        return ""

    s = str(text)
    out: list[str] = []
    i = 0
    n = len(s)

    while i < n:
        if s.startswith("$$", i):
            end = s.find("$$", i + 2)
            if end == -1:
                # no closing $$ - treat the rest as plain text
                out.append(latex_escape(s[i:]))
                break
            inner = s[i + 2 : end]
            out.append("$$" + inner + "$$")
            i = end + 2
        elif s[i] == "$":
            end = s.find("$", i + 1)
            if end == -1:
                out.append(latex_escape(s[i:]))
                break
            inner = s[i + 1 : end]
            out.append("$" + inner + "$")
            i = end + 1
        else:
            start = i
            while i < n and s[i] != "$":
                i += 1
            out.append(latex_escape(s[start:i]))

    return "".join(out)


def _to_list(value: Any) -> list[str] | None:
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
env.filters["latex_math"] = latex_with_math


def render_test_to_tex(
    title: str,
    questions: list[dict[str, Any]],
    show_answers: bool = False,
    *,
    brand_hex: str = "4CAF4F",
    logo_path: str | None = None,
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


def render_custom_test_to_tex(context: dict[str, Any]) -> str:
    """
    Render a customized test PDF using the advanced LaTeX template.
    """
    template = env.get_template("test_export.tex.j2")
    return template.render(**context)


def _needs_rerun(output: str) -> bool:
    if not output:
        return False
    rerun_markers = [
        "Rerun to get cross-references right",
        "Label(s) may have changed",
        "There were undefined references",
    ]
    return any(marker in output for marker in rerun_markers)


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
        proc = subprocess.run(cmd, capture_output=True, text=True)
        if proc.returncode != 0:
            raise RuntimeError(
                f"LaTeX error:\nSTDOUT:\n{proc.stdout}\nSTDERR:\n{proc.stderr}"
            )

        combined_output = f"{proc.stdout}\n{proc.stderr}"
        if _needs_rerun(combined_output):
            proc = subprocess.run(cmd, capture_output=True, text=True)
            if proc.returncode != 0:
                raise RuntimeError(
                    f"LaTeX error:\nSTDOUT:\n{proc.stdout}\nSTDERR:\n{proc.stderr}"
                )

        pdf_path = tmpdir / "test.pdf"
        return pdf_path.read_bytes()


def test_to_xml_bytes(test: dict[str, Any]) -> bytes:
    root = ET.Element("quiz")

    cat_question = ET.SubElement(root, "question", type="category")
    cat_elem = ET.SubElement(cat_question, "category")
    title = test.get("title", "Default Test")
    ET.SubElement(cat_elem, "text").text = f"$course$/{title}"

    def _ensure_list(val: Any) -> list[Any]:
        return val if isinstance(val, list) else []

    for question in test.get("questions", []):
        is_closed = question.get("is_closed", True)
        
        q_type = "multichoice" if is_closed else "essay"
        
        q_elem = ET.SubElement(root, "question", type=q_type)

        name_elem = ET.SubElement(q_elem, "name")
        q_text_short = question.get("text", "")[:20]
        ET.SubElement(name_elem, "text").text = f"Q{question['id']} - {q_text_short}..."

        qtext_elem = ET.SubElement(q_elem, "questiontext", format="html")
        ET.SubElement(qtext_elem, "text").text = question.get("text", "")

        difficulty = str(question.get("difficulty", 1))
        ET.SubElement(q_elem, "defaultgrade").text = difficulty
        
        gen_feedback = ET.SubElement(q_elem, "generalfeedback", format="html")
        ET.SubElement(gen_feedback, "text").text = ""

        if q_type == "essay":
            answer_elem = ET.SubElement(q_elem, "answer", fraction="0")
            ET.SubElement(answer_elem, "text").text = ""

        elif q_type == "multichoice":
            choices = _ensure_list(question.get("choices"))
            correct_choices = set(_ensure_list(question.get("correct_choices")))
            
            num_correct = len(correct_choices)
            is_single = num_correct <= 1
            
            ET.SubElement(q_elem, "single").text = "true" if is_single else "false"
            ET.SubElement(q_elem, "shuffleanswers").text = "true"
            ET.SubElement(q_elem, "answernumbering").text = "abc"

            if num_correct > 0:
                correct_fraction = 100.0 if is_single else (100.0 / num_correct)
            else:
                correct_fraction = 100.0 # Fallback

            for choice in choices:
                is_correct = choice in correct_choices
                
                fraction = f"{correct_fraction:.5g}" if is_correct else "0"
                
                answer_elem = ET.SubElement(
                    q_elem, "answer", fraction=fraction, format="html"
                )
                ET.SubElement(answer_elem, "text").text = str(choice)
                
                fb_elem = ET.SubElement(answer_elem, "feedback", format="html")
                if is_correct:
                    ET.SubElement(fb_elem, "text").text = "Correct!"
                else:
                    ET.SubElement(fb_elem, "text").text = "Incorrect."

    return cast(bytes, ET.tostring(root, encoding="utf-8", xml_declaration=True))


__all__ = [
    "compile_tex_to_pdf",
    "render_custom_test_to_tex",
    "render_test_to_tex",
    "test_to_xml_bytes",
]
