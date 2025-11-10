"""Service handling test generation and management use-cases."""

from __future__ import annotations
import logging

logger = logging.getLogger(__name__)
import json
from typing import Callable, Dict, List, Tuple

from fastapi import HTTPException

from app.api.schemas.tests import (
    TestDetailOut,
    TestGenerateRequest,
    TestGenerateResponse,
    TestOut,
    QuestionOut,
    QuestionCreate,
    QuestionUpdate
)
from app.application import dto
from app.application.interfaces import OCRService, QuestionGenerator, UnitOfWork
from app.domain.events import TestGenerated
from app.domain.models import Test as TestDomain
from app.db.models import Question as QuestionRow
from app.db.models import Test as TestRow

from app.infrastructure.exporting import (
    compile_tex_to_pdf,
    render_test_to_tex,
    test_to_xml_bytes,
)

class TestService:
    def __init__(
        self,
        uow_factory: Callable[[], UnitOfWork],
        *,
        question_generator: QuestionGenerator,
        ocr_service: OCRService,
        tex_renderer: Callable[..., str] = render_test_to_tex,
        pdf_compiler: Callable[[str], bytes] = compile_tex_to_pdf,
        xml_serializer: Callable[[Dict], bytes] = test_to_xml_bytes,
    ) -> None:
        self._uow_factory = uow_factory
        self._question_generator = question_generator
        self._ocr_service = ocr_service
        self._render_test_to_tex = tex_renderer
        self._compile_tex_to_pdf = pdf_compiler
        self._test_to_xml = xml_serializer

    def generate_test_from_input(
        self,
        *,
        request: TestGenerateRequest,
        owner_id: int,
    ) -> TestGenerateResponse:
        with self._uow_factory() as uow:
            normalized_text = request.text.strip() if request.text else ""
            source_text: str
            base_title: str

            if normalized_text:
                source_text = normalized_text
                if request.file_id is not None:
                    source_file = uow.files.get(request.file_id)
                    if not source_file or source_file.owner_id != owner_id:
                        raise ValueError("File not found")
                    base_title = source_file.filename
                else:
                    base_title = "From raw text"
            else:
                if request.file_id is None:
                    raise ValueError("file_id is required when text is not provided")
                source_file = uow.files.get(request.file_id)
                if not source_file or source_file.owner_id != owner_id:
                    raise ValueError("File not found")
                source_text = self._ocr_service.extract_text(
                    file_path=str(source_file.stored_path)
                )
                base_title = source_file.filename

            try:
                llm_title, questions = self._question_generator.generate(
                    source_text=source_text,
                    params=request,
                )
            except ValueError as exc:
                raise HTTPException(status_code=400, detail=str(exc)) from exc
            except Exception as exc:
                raise HTTPException(status_code=500, detail=f"LLM error: {exc}") from exc

            if not questions:
                raise ValueError("LLM zwrócił pustą listę pytań.")

            final_title = (llm_title or "").strip() or base_title

            test = TestDomain(
                id=None,
                owner_id=owner_id,
                title=final_title,
            )
            persisted_test = uow.tests.create(test)

            for question in questions:
                uow.tests.add_question(persisted_test.id, question)

            TestGenerated.create(
                test_id=persisted_test.id,
                owner_id=owner_id,
                question_count=len(questions),
            )

            return TestGenerateResponse(
                test_id=persisted_test.id,
                num_questions=len(questions),
            )



    def get_test_detail(self, *, owner_id: int, test_id: int) -> TestDetailOut:
        with self._uow_factory() as uow:
            test = uow.tests.get_with_questions(test_id)
            if not test or test.owner_id != owner_id:
                raise ValueError("Test not found")

            return dto.to_test_detail(test)

    def list_tests_for_user(self, *, owner_id: int) -> List[TestOut]:
        with self._uow_factory() as uow:
            tests = uow.tests.list_for_user(owner_id)
        return [dto.to_test_out(t) for t in tests]

    def delete_test(self, *, owner_id: int, test_id: int) -> None:
        with self._uow_factory() as uow:
            test = uow.tests.get(test_id)
            if not test or test.owner_id != owner_id:
                raise ValueError("Test not found")
            uow.tests.remove(test_id)

    def export_test_pdf(self, *, owner_id: int, test_id: int, show_answers: bool = False) -> Tuple[bytes, str]:
        detail = self.get_test_detail(owner_id=owner_id, test_id=test_id)
        questions_payload = [
            {
                "id": q.id,
                "text": q.text,
                "is_closed": q.is_closed,
                "difficulty": q.difficulty,
                "choices": q.choices,
                "correct_choices": q.correct_choices,
            }
            for q in detail.questions
        ]
        tex = self._render_test_to_tex(
            detail.title or f"Test #{detail.test_id}",
            questions_payload,
            show_answers=show_answers,
            brand_hex="4CAF4F",
            logo_path="/app/app/templates/logo.png",
        )
        filename = self._build_export_filename(detail.title, detail.test_id, suffix="pdf")
        return self._compile_tex_to_pdf(tex), filename

    def export_test_xml(self, *, owner_id: int, test_id: int) -> Tuple[bytes, str]:
        detail = self.get_test_detail(owner_id=owner_id, test_id=test_id)
        data = {
            "id": detail.test_id,
            "title": detail.title,
            "questions": [
                {
                    "id": q.id,
                    "text": q.text,
                    "is_closed": q.is_closed,
                    "difficulty": q.difficulty,
                    "choices": q.choices,
                    "correct_choices": q.correct_choices,
                }
                for q in detail.questions
            ],
        }
        filename = self._build_export_filename(detail.title, detail.test_id, suffix="xml")
        return self._test_to_xml(data), filename

    def update_question(
        self,
        *,
        owner_id: int,
        test_id: int,
        question_id: int,
        payload: QuestionUpdate | Dict,
    ) -> QuestionOut:
        with self._uow_factory() as uow:
            test = uow.tests.get(test_id)
            if not test or test.owner_id != owner_id:
                raise ValueError("Test not found")

            session = getattr(uow, "session", None)
            if session is None:
                raise RuntimeError("UnitOfWork session is not initialized")

            question_row = session.get(QuestionRow, question_id)
            if not question_row or question_row.test_id != test_id:
                raise ValueError("Question not found")

            # ogarniamy payload niezależnie czy to Pydantic czy dict
            if isinstance(payload, QuestionUpdate):
                data = payload.model_dump(exclude_unset=True)
            else:
                data = payload

            allowed_fields = {"text", "is_closed", "difficulty", "choices", "correct_choices"}

            # jeśli w update dostajemy is_closed == False → czyścimy choices/correct
            if data.get("is_closed") is False:
                data["choices"] = None
                data["correct_choices"] = None

            for field, value in data.items():
                if field in allowed_fields:
                    if field in {"choices", "correct_choices"}:
                        setattr(question_row, field, self._coerce_to_list(value))
                    else:
                        setattr(question_row, field, value)

            session.add(question_row)
            session.flush()

            return QuestionOut(
                id=question_row.id,
                text=question_row.text,
                is_closed=question_row.is_closed,
                difficulty=question_row.difficulty,
                choices=question_row.choices,
                correct_choices=question_row.correct_choices,
            )


    def add_question(
        self,
        *,
        owner_id: int,
        test_id: int,
        payload: QuestionCreate,
    ) -> QuestionOut:
        """
        Dodaje nowe pytanie do testu użytkownika.
        Zwraca QuestionOut, żeby endpoint mógł od razu odesłać aktualne dane.
        """
        with self._uow_factory() as uow:
            test = uow.tests.get(test_id)
            if not test or test.owner_id != owner_id:
                raise ValueError("Test not found")

            session = getattr(uow, "session", None)
            if session is None:
                raise RuntimeError("UnitOfWork session is not initialized")

            # Bezpieczne ogarnięcie choices / correct_choices
            choices = self._coerce_to_list(payload.choices) if payload.choices is not None else None
            correct_choices = (
                self._coerce_to_list(payload.correct_choices)
                if payload.correct_choices is not None
                else None
            )

            # Dla otwartych pytań pola zamykamy
            if not payload.is_closed:
                choices = None
                correct_choices = None

            # Tworzymy rekord w DB
            new_question = QuestionRow(
                test_id=test_id,
                text=payload.text,
                is_closed=payload.is_closed,
                difficulty=payload.difficulty,
                choices=choices,
                correct_choices=correct_choices,
            )

            session.add(new_question)
            session.flush()  # żeby mieć new_question.id

            return QuestionOut(
                id=new_question.id,
                text=new_question.text,
                is_closed=new_question.is_closed,
                difficulty=new_question.difficulty,
                choices=new_question.choices,
                correct_choices=new_question.correct_choices,
            )

    def delete_question(
        self,
        *,
        owner_id: int,
        test_id: int,
        question_id: int,
    ) -> None:
        """
        Usuwa pytanie z testu użytkownika.
        """
        with self._uow_factory() as uow:
            test = uow.tests.get(test_id)
            if not test or test.owner_id != owner_id:
                raise ValueError("Test not found")

            session = getattr(uow, "session", None)
            if session is None:
                raise RuntimeError("UnitOfWork session is not initialized")

            question_row = session.get(QuestionRow, question_id)
            if not question_row or question_row.test_id != test_id:
                raise ValueError("Question not found")

            session.delete(question_row)

    @staticmethod
    def _coerce_to_list(value):
        if value is None:
            return None
        if isinstance(value, list):
            return value
        if isinstance(value, str):
            try:
                parsed = json.loads(value)
                if isinstance(parsed, list):
                    return parsed
                return [parsed]
            except Exception:
                return [value]
        return [value]

    @staticmethod
    def _build_export_filename(title: str | None, test_id: int, *, suffix: str) -> str:
        base = title or f"test_{test_id}"
        slug = "_".join(part for part in base.lower().split() if part)
        slug = slug or f"test_{test_id}"
        return f"{slug}_{test_id}.{suffix}"


__all__ = ["TestService"]

