from fastapi import APIRouter, Depends, HTTPException, status

from app.api.dependencies import get_test_service
from app.api.schemas.tests import TestGenerateRequest, TestGenerateResponse
from app.application.services import TestService
from app.core.security import get_current_user
from app.db.models import User

router = APIRouter()

@router.post("/generate", response_model=TestGenerateResponse, status_code=status.HTTP_201_CREATED)
def generate_test(
    req: TestGenerateRequest,
    current_user: User = Depends(get_current_user),
    test_service: TestService = Depends(get_test_service),
):
    try:
        return test_service.generate_test_from_input(
            request=req, owner_id=current_user.id
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=f"LLM error: {exc}") from exc


@router.get("/{test_id}", response_model=dict)
def get_test(
    test_id: int,
    current_user: User = Depends(get_current_user),
    test_service: TestService = Depends(get_test_service),
):
    try:
        return test_service.get_test(owner_id=current_user.id, test_id=test_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.patch("/{test_id}/edit/{question_id}")
def edit_question(
    test_id: int,
    question_id: int,
    payload: dict,
    current_user: User = Depends(get_current_user),
    test_service: TestService = Depends(get_test_service),
):
    try:
        test_service.update_question(
            owner_id=current_user.id,
            test_id=test_id,
            question_id=question_id,
            payload=payload,
        )
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return {"msg": "Question updated"}


@router.get("/{test_id}/export")
def export_test(
    test_id: int,
    current_user: User = Depends(get_current_user),
    test_service: TestService = Depends(get_test_service),
):
    try:
        data = test_service.get_test(owner_id=current_user.id, test_id=test_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc

    content = f"Test: {data['title']}\n\n"
    for i, q in enumerate(data["questions"], start=1):
        content += f"Q{i}. {q['text']}\n"
        if q.get("is_closed") and q.get("choices"):
            content += f"  Options: {q['choices']}\n"
            content += f"  Correct: {q['correct_choices']}\n"
        content += "\n"

    return {"export_text": content}
