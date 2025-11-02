from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.orm import Session
from sqlmodel import select
import json
from typing import Any, Dict, List, Optional

from app.db.session import get_session
from app.db.models import Test, File as FileModel, User, Question
from app.schemas.test import TestDetailOut, TestGenerateRequest, TestGenerateResponse, QuestionOut
from app.core.security import get_current_user
from services.llm import generate_questions_from_text
from services.ocr import ocr_extract_text
from services.export import render_test_to_tex, compile_tex_to_pdf, test_to_xml_bytes

router = APIRouter()

def _to_list(v: Any) -> Optional[List[str]]:
    if v is None:
        return None
    if isinstance(v, list):
        return [str(x) for x in v]
    if isinstance(v, str):
        try:
            j = json.loads(v)
            if isinstance(j, list):
                return [str(x) for x in j]
            return [str(j)]
        except Exception:
            return [v.strip().strip('"').strip("'")]
    return [str(v)]

@router.post("/generate", response_model=TestGenerateResponse, status_code=status.HTTP_201_CREATED)
def generate_test(
    req: TestGenerateRequest,
    db: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    # źródło tekstu
    if getattr(req, "text", None):
        text = req.text
        title = "From raw text"
    else:
        if getattr(req, "file_id", None) is None:
            raise HTTPException(status_code=400, detail="Either text or file_id is required")
        db_file = db.get(FileModel, req.file_id)
        if not db_file or db_file.owner_id != current_user.id:
            raise HTTPException(status_code=404, detail="File not found")
        text = ocr_extract_text(db_file.filepath)
        title = db_file.filename

    # utwórz test
    test = Test(owner_id=current_user.id, title=title)
    db.add(test)
    db.commit()
    db.refresh(test)

    # wygeneruj pytania
    try:
        questions = generate_questions_from_text(text, req)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"LLM error: {e}")

    # zapisz pytania — upewnij się, że choices/correct są listami (JSONB)
    for q in questions:
        payload: Dict[str, Any] = {
            "test_id": test.id,
            "text": q.get("text", ""),
            "is_closed": bool(q.get("is_closed", True)),
            "difficulty": int(q.get("difficulty", 1)),
            "choices": _to_list(q.get("choices")),
            "correct_choices": _to_list(q.get("correct_choices")),
        }
        db.add(Question(**payload))
    db.commit()

    return TestGenerateResponse(test_id=test.id, num_questions=len(questions))



@router.get("/{test_id}", response_model=TestDetailOut)
def get_test(
    test_id: int,
    db: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    test = db.get(Test, test_id)
    if not test or test.owner_id != current_user.id:
        raise HTTPException(status_code=404, detail="Test not found")

    stmt = select(Question).where(Question.test_id == test_id).order_by(Question.id.asc())
    rows = db.exec(stmt).all()

    questions = [
        QuestionOut(
            id=q.id,
            text=q.text,
            is_closed=q.is_closed,
            difficulty=q.difficulty,
            choices=_to_list(q.choices),
            correct_choices=_to_list(q.correct_choices),
        )
        for q in rows
    ]

    return TestDetailOut(
        test_id=test.id,
        title=test.title or f"Test #{test.id}",
        questions=questions,
    )

@router.patch("/{test_id}/edit/{question_id}")
def edit_question(
    test_id: int,
    question_id: int,
    payload: dict,
    db: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    test = db.get(Test, test_id)
    if not test or test.owner_id != current_user.id:
        raise HTTPException(status_code=404, detail="Test not found")

    question = db.get(Question, question_id)
    if not question or question.test_id != test_id:
        raise HTTPException(status_code=404, detail="Question not found")

    for field, value in payload.items():
        if hasattr(question, field):
            setattr(question, field, value)

    db.add(question)
    db.commit()
    db.refresh(question)
    return {"msg": "Question updated"}

def _load_test(session: Session, user: User, test_id: int) -> Test:
    test = session.get(Test, test_id)
    if not test or test.owner_id != user.id:
        raise HTTPException(status_code=404, detail="Test not found")
    # wymuś załadowanie relacji (jeśli lazy)
    _ = test.questions
    return test

@router.get("/{test_id}/export/pdf")
def export_pdf(
    test_id: int,
    show_answers: bool = False,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
):
    test = _load_test(session, user, test_id)
    # przygotuj dane pod szablon
    questions = [{
        "id": q.id,
        "text": q.text,
        "is_closed": q.is_closed,
        "difficulty": q.difficulty,
        "choices": q.choices,
        "correct_choices": q.correct_choices,
    } for q in test.questions]
    logo_path = "/app/app/templates/logo.png"
    tex = render_test_to_tex(test.title or f"Test #{test.id}", questions, show_answers=show_answers, brand_hex="4CAF4F", logo_path=logo_path,)
    pdf_bytes = compile_tex_to_pdf(tex)
    fname = f"test_{test.id}.pdf"
    return Response(pdf_bytes, media_type="application/pdf", headers={
        "Content-Disposition": f'attachment; filename="{fname}"'
    })

@router.get("/{test_id}/export/xml")
def export_xml(
    test_id: int,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
):
    test = _load_test(session, user, test_id)
    data = {
        "id": test.id,
        "title": test.title or f"Test #{test.id}",
        "questions": [{
            "id": q.id,
            "text": q.text,
            "is_closed": q.is_closed,
            "difficulty": q.difficulty,
            "choices": q.choices,
            "correct_choices": q.correct_choices,
        } for q in test.questions]
    }
    xml_bytes = test_to_xml_bytes(data)
    fname = f"test_{test.id}.xml"
    return Response(xml_bytes, media_type="application/xml", headers={
        "Content-Disposition": f'attachment; filename="{fname}"'
    })
