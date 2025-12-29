from fastapi import APIRouter, Depends, HTTPException, Response, status

from app.api.dependencies import get_test_service, get_job_service
from app.api.schemas.tests import (
    TestDetailOut,
    TestGenerateRequest,
    QuestionOut,
    QuestionCreate,
    QuestionUpdate,
    BulkUpdateQuestionsRequest,
    BulkDeleteQuestionsRequest,
    BulkRegenerateQuestionsRequest,
    BulkConvertQuestionsRequest,
    TestTitleUpdate,
    TestOut,
    PdfExportConfig,
)
from app.api.schemas.jobs import JobEnqueueResponse
from app.application.services import TestService
from app.application.services import JobService
from app.core.security import get_current_user
from app.db.models import User
from app.domain.models.enums import JobType
from app.tasks.tests import (
    generate_test_task,
    export_test_pdf_task,
    export_custom_test_pdf_task,
    bulk_regenerate_questions_task,
    bulk_convert_questions_task,
)

router = APIRouter()


@router.post("/generate", response_model=JobEnqueueResponse, status_code=status.HTTP_202_ACCEPTED)
def generate_test(
    req: TestGenerateRequest,
    current_user: User = Depends(get_current_user),
    job_service: JobService = Depends(get_job_service),
):
    job = job_service.create_job(
        owner_id=current_user.id,
        job_type=JobType.TEST_GENERATION,
        payload=req.model_dump(),
    )
    generate_test_task.delay(job.id, current_user.id, req.model_dump())
    return JobEnqueueResponse(job_id=job.id, status=job.status.value)


@router.post("/", response_model=TestOut, status_code=status.HTTP_201_CREATED)
def create_test(
    payload: TestTitleUpdate,
    current_user: User = Depends(get_current_user),
    test_service: TestService = Depends(get_test_service),
):
    """Create a new empty test with a title."""
    try:
        return test_service.create_empty_test(
            owner_id=current_user.id,
            title=payload.title,
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


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

@router.delete("/{test_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_test(
    test_id: int,
    current_user: User = Depends(get_current_user),
    test_service: TestService = Depends(get_test_service),
):
    try:
        test_service.delete_test(
            owner_id=current_user.id,
            test_id=test_id,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    return Response(status_code=status.HTTP_204_NO_CONTENT)

@router.patch("/{test_id}/edit/{question_id}")
def edit_question(
    test_id: int,
    question_id: int,
    payload: QuestionUpdate,
    current_user: User = Depends(get_current_user),
    test_service: TestService = Depends(get_test_service),
):
    try:
        updated = test_service.update_question(
            owner_id=current_user.id,
            test_id=test_id,
            question_id=question_id,
            payload=payload,
        )
        return updated  # mapowane na QuestionOut
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc

@router.post("/{test_id}/questions", response_model=QuestionOut, status_code=status.HTTP_201_CREATED)
def add_question(
    test_id: int,
    payload: QuestionCreate,
    current_user: User = Depends(get_current_user),
    test_service: TestService = Depends(get_test_service),
):
    try:
        created = test_service.add_question(
            owner_id=current_user.id,
            test_id=test_id,
            payload=payload,
        )
        return created
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.delete("/{test_id}/questions/{question_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_question(
    test_id: int,
    question_id: int,
    current_user: User = Depends(get_current_user),
    test_service: TestService = Depends(get_test_service),
):
    try:
        test_service.delete_question(
            owner_id=current_user.id,
            test_id=test_id,
            question_id=question_id,
        )
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc

    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.patch("/{test_id}/questions/bulk")
def bulk_update_questions(
    test_id: int,
    payload: BulkUpdateQuestionsRequest,
    current_user: User = Depends(get_current_user),
    test_service: TestService = Depends(get_test_service),
):
    try:
        test_service.bulk_update_questions(
            owner_id=current_user.id,
            test_id=test_id,
            payload=payload,
        )
        return {"msg": "Questions updated successfully"}
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.delete("/{test_id}/questions/bulk", status_code=status.HTTP_204_NO_CONTENT)
def bulk_delete_questions(
    test_id: int,
    payload: BulkDeleteQuestionsRequest,
    current_user: User = Depends(get_current_user),
    test_service: TestService = Depends(get_test_service),
):
    try:
        test_service.bulk_delete_questions(
            owner_id=current_user.id,
            test_id=test_id,
            payload=payload,
        )
        return Response(status_code=status.HTTP_204_NO_CONTENT)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.post("/{test_id}/questions/bulk/regenerate", response_model=JobEnqueueResponse)
def bulk_regenerate_questions(
    test_id: int,
    payload: BulkRegenerateQuestionsRequest,
    current_user: User = Depends(get_current_user),
    test_service: TestService = Depends(get_test_service),
    job_service: JobService = Depends(get_job_service),
):
    try:
        # Sprawdzamy czy test należy do usera
        test_service.get_test_detail(owner_id=current_user.id, test_id=test_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc

    job = job_service.create_job(
        owner_id=current_user.id,
        job_type=JobType.QUESTIONS_REGENERATION,
        payload={"test_id": test_id, "question_ids": payload.question_ids, "instruction": payload.instruction},
    )
    bulk_regenerate_questions_task.delay(job.id, current_user.id, test_id, payload.model_dump())
    return JobEnqueueResponse(job_id=job.id, status=job.status.value)


@router.post("/{test_id}/questions/bulk/convert", response_model=JobEnqueueResponse)
def bulk_convert_questions(
    test_id: int,
    payload: BulkConvertQuestionsRequest,
    current_user: User = Depends(get_current_user),
    test_service: TestService = Depends(get_test_service),
    job_service: JobService = Depends(get_job_service),
):
    try:
        # Sprawdzamy czy test należy do usera
        test_service.get_test_detail(owner_id=current_user.id, test_id=test_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc

    job = job_service.create_job(
        owner_id=current_user.id,
        job_type=JobType.QUESTIONS_CONVERSION,
        payload={"test_id": test_id, "question_ids": payload.question_ids, "target_type": payload.target_type},
    )
    bulk_convert_questions_task.delay(job.id, current_user.id, test_id, payload.model_dump())
    return JobEnqueueResponse(job_id=job.id, status=job.status.value)


@router.get("/{test_id}/export/pdf", response_model=JobEnqueueResponse)
def export_pdf(
    test_id: int,
    show_answers: bool = False,
    current_user: User = Depends(get_current_user),
    test_service: TestService = Depends(get_test_service),
    job_service: JobService = Depends(get_job_service),
):
    try:
        test_service.get_test_detail(owner_id=current_user.id, test_id=test_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc

    job = job_service.create_job(
        owner_id=current_user.id,
        job_type=JobType.PDF_EXPORT,
        payload={"test_id": test_id, "show_answers": show_answers},
    )
    export_test_pdf_task.delay(job.id, current_user.id, test_id, show_answers)
    return JobEnqueueResponse(job_id=job.id, status=job.status.value)


@router.post("/{test_id}/export/pdf/custom", response_model=JobEnqueueResponse)
def export_custom_pdf(
    test_id: int,
    config: PdfExportConfig,
    current_user: User = Depends(get_current_user),
    test_service: TestService = Depends(get_test_service),
    job_service: JobService = Depends(get_job_service),
):
    """
    Export a test as a customized PDF according to PdfExportConfig.
    """
    try:
        test_service.get_test_detail(owner_id=current_user.id, test_id=test_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc

    job = job_service.create_job(
        owner_id=current_user.id,
        job_type=JobType.PDF_EXPORT,
        payload={"test_id": test_id, "config": config.model_dump()},
    )
    export_custom_test_pdf_task.delay(job.id, current_user.id, test_id, config.model_dump())
    return JobEnqueueResponse(job_id=job.id, status=job.status.value)


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

@router.patch("/{test_id}/title", response_model=TestOut)
def update_test_title(
    test_id: int,
    payload: TestTitleUpdate,
    current_user: User = Depends(get_current_user),
    test_service: TestService = Depends(get_test_service),
):
    try:
        return test_service.update_test_title(
            owner_id=current_user.id,
            test_id=test_id,
            title=payload.title,
        )
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail="Failed to update title") from exc


__all__ = ["router"]

