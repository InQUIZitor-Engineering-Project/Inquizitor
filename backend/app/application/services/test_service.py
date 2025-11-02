"""Service handling test generation and management use-cases."""

from __future__ import annotations

from typing import Callable, Dict, List

from app.api.schemas.tests import TestGenerateRequest, TestGenerateResponse, TestOut
from app.application import dto
from app.application.interfaces import OCRService, QuestionGenerator, UnitOfWork
from app.domain.events import TestGenerated
from app.domain.models import Test as TestDomain
from app.db.models import Question as QuestionRow


class TestService:
    def __init__(
        self,
        uow_factory: Callable[[], UnitOfWork],
        *,
        question_generator: QuestionGenerator,
        ocr_service: OCRService,
    ) -> None:
        self._uow_factory = uow_factory
        self._question_generator = question_generator
        self._ocr_service = ocr_service

    def generate_test_from_input(
        self,
        *,
        request: TestGenerateRequest,
        owner_id: int,
    ) -> TestGenerateResponse:
        with self._uow_factory() as uow:
            if request.text:
                source_text = request.text
                title = "From raw text"
            else:
                if request.file_id is None:
                    raise ValueError("file_id is required when text is not provided")
                source_file = uow.files.get(request.file_id)
                if not source_file or source_file.owner_id != owner_id:
                    raise ValueError("File not found")
                source_text = self._ocr_service.extract_text(file_path=str(source_file.stored_path))
                title = source_file.filename

            test = TestDomain(id=None, owner_id=owner_id, title=title)
            persisted_test = uow.tests.create(test)

            questions = self._question_generator.generate(
                source_text=source_text,
                params=request,
            )

            for question in questions:
                uow.tests.add_question(persisted_test.id, question)

            TestGenerated.create(
                test_id=persisted_test.id,
                owner_id=owner_id,
                question_count=len(questions),
            )

            return TestGenerateResponse(test_id=persisted_test.id, num_questions=len(questions))

    def get_test(self, *, owner_id: int, test_id: int) -> Dict:
        with self._uow_factory() as uow:
            test = uow.tests.get_with_questions(test_id)
            if not test or test.owner_id != owner_id:
                raise ValueError("Test not found")

            return dto.to_test_response(test)

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

    def update_question(
        self,
        *,
        owner_id: int,
        test_id: int,
        question_id: int,
        payload: Dict,
    ) -> None:
        with self._uow_factory() as uow:
            test = uow.tests.get(test_id)
            if not test or test.owner_id != owner_id:
                raise ValueError("Test not found")

            if uow.session is None:
                raise RuntimeError("UnitOfWork session is not initialized")

            question_row = uow.session.get(QuestionRow, question_id)
            if not question_row or question_row.test_id != test_id:
                raise ValueError("Question not found")

            allowed_fields = {"text", "is_closed", "difficulty", "choices", "correct_choices"}
            for field, value in payload.items():
                if field in allowed_fields:
                    setattr(question_row, field, value)

            uow.session.add(question_row)

    @staticmethod
    def _serialize_test(test: TestDomain) -> Dict:
        return {
            "test_id": test.id,
            "title": test.title,
            "questions": [
                {
                    "id": question.id,
                    "text": question.text,
                    "is_closed": question.is_closed,
                    "difficulty": question.difficulty.value,
                    "choices": list(question.choices),
                    "correct_choices": list(question.correct_choices),
                }
                for question in test.questions
            ],
        }


__all__ = ["TestService"]

