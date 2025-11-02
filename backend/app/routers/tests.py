from fastapi import APIRouter, Depends, HTTPException, Response, status

from app.api.dependencies import get_test_service
from app.api.schemas.tests import TestDetailOut, TestGenerateRequest, TestGenerateResponse
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


@router.get("/{test_id}", response_model=TestDetailOut)
def get_test(
    test_id: int,
    current_user: User = Depends(get_current_user),
    test_service: TestService = Depends(get_test_service),
):
    try:
        return test_service.get_test_detail(owner_id=current_user.id, test_id=test_id)
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


@router.get("/{test_id}/export/pdf")
def export_pdf(
    test_id: int,
    show_answers: bool = False,
    current_user: User = Depends(get_current_user),
    test_service: TestService = Depends(get_test_service),
):
    try:
        pdf_bytes, filename = test_service.export_test_pdf(
            owner_id=current_user.id, test_id=test_id, show_answers=show_answers
        )
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc

    return Response(
        pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/{test_id}/export/xml")
def export_xml(
    test_id: int,
    current_user: User = Depends(get_current_user),
    test_service: TestService = Depends(get_test_service),
):
    try:
        xml_bytes, filename = test_service.export_test_xml(owner_id=current_user.id, test_id=test_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc

    return Response(
        xml_bytes,
        media_type="application/xml",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
