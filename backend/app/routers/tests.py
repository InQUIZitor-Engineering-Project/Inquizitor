from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlmodel import select
import json

from app.db.session import get_session
from app.db.models import Test, File as FileModel, User, Question
from app.schemas.test import TestGenerateRequest, TestGenerateResponse
from app.core.security import get_current_user
from services.llm import generate_questions_from_text
from services.ocr import ocr_extract_text

router = APIRouter()

@router.post("/generate", response_model=TestGenerateResponse, status_code=status.HTTP_201_CREATED)
def generate_test(
    req: TestGenerateRequest,
    db: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    if req.text:
        text = req.text
        title = "From raw text"
    else:
        db_file = db.get(FileModel, req.file_id)
        if not db_file or db_file.owner_id != current_user.id:
            raise HTTPException(status_code=404, detail="File not found")
        text = ocr_extract_text(db_file.filepath)
        title = db_file.filename

    test = Test(owner_id=current_user.id, title=title)
    db.add(test); db.commit(); db.refresh(test)

    try:
        questions = generate_questions_from_text(text, req)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"LLM error: {e}")

    for q in questions:
        q["test_id"] = test.id
        db.add(Question(**q))
    db.commit()

    return TestGenerateResponse(test_id=test.id, num_questions=len(questions))


@router.get("/{test_id}", response_model=dict)
def get_test(
    test_id: int,
    db: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    test = db.get(Test, test_id)
    if not test or test.owner_id != current_user.id:
        raise HTTPException(status_code=404, detail="Test not found")

    stmt = select(Question).where(Question.test_id == test_id)
    questions = db.exec(stmt).all()

    result = [
        {
            "id": q.id,
            "text": q.text,
            "is_closed": q.is_closed,
            "difficulty": q.difficulty,
            "choices": json.loads(q.choices) if q.choices else [],
            "correct_choices": json.loads(q.correct_choices) if q.correct_choices else [],
        }
        for q in questions
    ]
    return {"test_id": test.id, "title": test.title, "questions": result}


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


@router.get("/{test_id}/export")
def export_test(
    test_id: int,
    db: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    test = db.get(Test, test_id)
    if not test or test.owner_id != current_user.id:
        raise HTTPException(status_code=404, detail="Test not found")

    stmt = select(Question).where(Question.test_id == test_id)
    questions = db.exec(stmt).all()

    content = f"Test: {test.title}\n\n"
    for i, q in enumerate(questions, start=1):
        content += f"Q{i}. {q.text}\n"
        if q.is_closed and q.choices:
            content += f"  Options: {q.choices}\n"
            content += f"  Correct: {q.correct_choices}\n"
        content += "\n"

    return {"export_text": content}
