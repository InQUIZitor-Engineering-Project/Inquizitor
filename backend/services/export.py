from pathlib import Path
from typing import List, Optional
import subprocess
import tempfile
import json
from jinja2 import Environment, FileSystemLoader, select_autoescape
import xml.etree.ElementTree as ET

_LATEX_MAP = {
    "&": r"\&", "%": r"\%", "$": r"\$", "#": r"\#",
    "_": r"\_", "{": r"\{", "}": r"\}", "~": r"\textasciitilde{}",
    "^": r"\textasciicircum{}", "\\": r"\textbackslash{}",
}
def latex_escape(s: str) -> str:
    return "".join(_LATEX_MAP.get(ch, ch) for ch in s)

def _to_list(v) -> Optional[List[str]]:
    if v is None:
        return None
    if isinstance(v, list):
        return [str(x) for x in v]
    if isinstance(v, str):
        # jeśli to JSON (np. '["A","B"]'), zdekoduj:
        try:
            j = json.loads(v)
            if isinstance(j, list):
                return [str(x) for x in j]
            return [str(j)]
        except Exception:
            # zwykły tekst → jednoelementowa lista (bez cudzysłowów)
            return [v.strip().strip('"').strip("'")]
    return [str(v)]

# Inicjalizacja Jinja2
THIS_DIR = Path(__file__).resolve().parent
REPO_ROOT = THIS_DIR.parent
SEARCH_PATHS = [
    REPO_ROOT / "templates",
    REPO_ROOT / "app" / "templates",
    THIS_DIR / "templates",
]

search_paths = [str(p) for p in SEARCH_PATHS if p.exists()]
if not search_paths:
    search_paths = [str(REPO_ROOT / "app" / "templates")]

env = Environment(
    loader=FileSystemLoader(search_paths),
    autoescape=select_autoescape([]),
    block_start_string='[%',
    block_end_string='%]',
    variable_start_string='{{',
    variable_end_string='}}',
    comment_start_string='[#',
    comment_end_string='#]',
)
env.filters["latex"] = latex_escape

def render_test_to_tex(title: str, questions: List[dict], show_answers: bool = False, *, brand_hex: str = "4CAF4F", logo_path: Optional[str] = None,) -> str:
    items = []
    for q in questions:
        choices = _to_list(q.get("choices")) or []
        correct = set(_to_list(q.get("correct_choices")) or [])
        items.append({
            "text": str(q.get("text", "")),
            "is_closed": bool(q.get("is_closed", True)),
            "choices": choices,
            "correct_choices": list(correct),
        })
    tmpl = env.get_template("test.tex.j2")
    return tmpl.render(title=title, questions=items, show_answers=show_answers, brand_hex=brand_hex, logo_path=logo_path,)

def compile_tex_to_pdf(tex_source: str) -> bytes:
    with tempfile.TemporaryDirectory() as tmp:
        tmpdir = Path(tmp)
        tex_path = tmpdir / "test.tex"
        tex_path.write_text(tex_source, encoding="utf-8")

        cmd = ["xelatex", "-interaction=nonstopmode", "-halt-on-error", "-output-directory", str(tmpdir), str(tex_path)]
        for _ in range(2):
            proc = subprocess.run(cmd, capture_output=True, text=True)
            if proc.returncode != 0:
                raise RuntimeError(f"LaTeX error:\nSTDOUT:\n{proc.stdout}\nSTDERR:\n{proc.stderr}")

        pdf_path = tmpdir / "test.pdf"
        return pdf_path.read_bytes()

def test_to_xml_bytes(test: dict) -> bytes:
    root = ET.Element("Test", attrib={
        "id": str(test["id"]),
        "title": test["title"],
    })
    for q in test["questions"]:
        q_el = ET.SubElement(root, "Question", attrib={
            "id": str(q["id"]),
            "type": "closed" if q.get("is_closed", True) else "open",
            "difficulty": str(q.get("difficulty", 1)),
        })
        t_el = ET.SubElement(q_el, "Text")
        t_el.text = q.get("text", "")
        choices = _to_list(q.get("choices"))
        if choices:
            c_el = ET.SubElement(q_el, "Choices")
            corr = set(_to_list(q.get("correct_choices")) or [])
            for c in choices:
                item = ET.SubElement(c_el, "Choice", attrib={
                    "correct": "true" if c in corr else "false"
                })
                item.text = c
    return ET.tostring(root, encoding="utf-8", xml_declaration=True)