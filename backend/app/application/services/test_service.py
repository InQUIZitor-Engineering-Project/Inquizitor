"""Service handling test generation and management use-cases."""

from __future__ import annotations
import logging

logger = logging.getLogger(__name__)
import json
import random
from pathlib import Path
from typing import Callable, Dict, List, Tuple
import re
import unicodedata
from fastapi import HTTPException

from app.api.schemas.tests import (
    TestDetailOut,
    TestGenerateRequest,
    TestGenerateResponse,
    TestOut,
    QuestionOut,
    QuestionCreate,
    QuestionUpdate,
    PdfExportConfig,
)
from app.application import dto
from app.application.interfaces import OCRService, QuestionGenerator, UnitOfWork, FileStorage
from app.domain.events import TestGenerated
from app.domain.models import Test as TestDomain
from app.domain.models.enums import QuestionDifficulty
from app.db.models import Question as QuestionRow
from app.db.models import Test as TestRow

from app.infrastructure.exporting import (
    compile_tex_to_pdf,
    render_test_to_tex,
    render_custom_test_to_tex,
    test_to_xml_bytes,
)
from app.infrastructure.llm.gemini import GeminiQuestionGenerator
from app.infrastructure.extractors.extract_composite import composite_text_extractor

class TestService:
    def __init__(
        self,
        uow_factory: Callable[[], UnitOfWork],
        *,
        question_generator: QuestionGenerator,
        ocr_service: OCRService,
        storage: FileStorage,
        tex_renderer: Callable[..., str] = render_test_to_tex,
        pdf_compiler: Callable[[str], bytes] = compile_tex_to_pdf,
        xml_serializer: Callable[[Dict], bytes] = test_to_xml_bytes,
        custom_tex_renderer: Callable[[Dict], str] = render_custom_test_to_tex,
    ) -> None:
        self._uow_factory = uow_factory
        self._question_generator = question_generator
        self._ocr_service = ocr_service
        self._storage = storage
        self._render_test_to_tex = tex_renderer
        self._compile_tex_to_pdf = pdf_compiler
        self._test_to_xml = xml_serializer
        self._render_custom_test_to_tex = custom_tex_renderer

    @staticmethod
    def _difficulty_order(value: int | QuestionDifficulty | None) -> int:
        """Mapuje poziom trudności na stabilny klucz sortujący (łatwe → średnie → trudne)."""
        try:
            raw = value.value if isinstance(value, QuestionDifficulty) else int(value)  # type: ignore[arg-type]
        except Exception:
            raw = None
        return {1: 0, 2: 1, 3: 2}.get(raw, 99)

    @classmethod
    def _sort_questions(cls, questions):
        """
        Zwraca listę pytań posortowaną rosnąco po trudności, a następnie stabilnie po id.
        Działa zarówno dla obiektów domenowych, jak i dictów/DTO (używa getattr / get).
        """
        def _key(q):
            difficulty = getattr(q, "difficulty", None)
            qid = getattr(q, "id", None)
            if isinstance(q, dict):
                difficulty = q.get("difficulty", difficulty)
                qid = q.get("id", qid)
            return (cls._difficulty_order(difficulty), qid or 0)

        return sorted(questions, key=_key)

    @staticmethod
    def _shuffle_within_difficulty(questions: List[Dict]) -> List[Dict]:
        """
        Tasuje pytania tylko wewnątrz bucketów trudności, utrzymując kolejność bucketów
        (łatwe→średnie→trudne→inne).
        """
        buckets = {1: [], 2: [], 3: [], "other": []}
        for q in questions:
            d = q.get("difficulty")
            if d in (1, 2, 3):
                buckets[d].append(q)
            else:
                buckets["other"].append(q)

        for key in (1, 2, 3, "other"):
            random.shuffle(buckets[key])

        return buckets[1] + buckets[2] + buckets[3] + buckets["other"]

    # --- LLM wariant pytań (bliźniaczy zestaw) ---
    def _build_variant_prompt(self, questions: List[Dict]) -> str:
        """
        Buduje prompt do wygenerowania wariantów pytań w jednej odpowiedzi JSON (lista).
        """
        template = {
            "text": "Nowe pytanie po polsku",
            "is_closed": True,
            "difficulty": 1,
            "choices": ["A", "B"],
            "correct_choices": ["A"],
        }
        return (
            "Przygotuj dla każdego pytania nowy, bardzo podobny wariant po polsku.\n"
            "- Zachowaj poziom trudności (difficulty) i typ (is_closed).\n"
            "- Dla pytań zamkniętych zachowaj liczbę odpowiedzi i liczbę poprawnych; poprawne mogą się zmienić.\n"
            "- Dla pytań otwartych tylko zmień treść.\n"
            "- Nie powtarzaj oryginalnego tekstu; zmień dane/liczby/kontekst, ale zachowaj sens i trudność.\n"
            "- Zwróć WYŁĄCZNIE JSON: listę obiektów w tej samej kolejności co wejście.\n"
            f"Przykład pojedynczego obiektu: {json.dumps(template, ensure_ascii=False)}\n"
            "Wejściowe pytania (JSON lista):\n"
            f"{json.dumps(questions, ensure_ascii=False)}"
        )

    def _generate_llm_variant(self, questions: List[Dict]) -> List[Dict]:
        """
        Próbuje wygenerować wariant B pytań z użyciem LLM. W razie błędu zwraca oryginał.
        """
        if not questions:
            return questions

        prompt = self._build_variant_prompt(questions)

        try:
            client = GeminiQuestionGenerator._client()
            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt,
            )
            raw = (response.text or "").strip()
            if raw.startswith("```"):
                first_nl = raw.find("\n")
                if first_nl != -1:
                    raw = raw[first_nl + 1 :].strip()
                if raw.endswith("```"):
                    raw = raw[:-3].strip()
            if raw.lower().startswith("json"):
                raw = raw[4:].lstrip(":").strip()
            parsed = json.loads(raw)
        except Exception as exc:  # noqa: BLE001
            logger.warning("LLM variant generation failed: %s", exc)
            return questions

        if not isinstance(parsed, list):
            logger.warning("LLM variant returned non-list")
            return questions

        variants: List[Dict] = []
        for orig, item in zip(questions, parsed):
            if not isinstance(item, dict):
                variants.append(orig)
                continue

            # Walidacja minimalna: typ i trudność muszą być zgodne
            difficulty = item.get("difficulty", orig.get("difficulty"))
            is_closed = item.get("is_closed", orig.get("is_closed"))
            if difficulty != orig.get("difficulty") or bool(is_closed) != bool(
                orig.get("is_closed")
            ):
                variants.append(orig)
                continue

            choices = item.get("choices")
            correct_choices = item.get("correct_choices")

            if is_closed:
                # Zachowaj liczność odpowiedzi i poprawnych; jeśli brak, fallback do oryginału
                if not isinstance(choices, list) or not choices:
                    variants.append(orig)
                    continue
                if not isinstance(correct_choices, list) or len(correct_choices) == 0:
                    variants.append(orig)
                    continue
                # Przytnij/uzupełnij do tej samej liczby co oryginał, aby zachować układ
                target_len = len(orig.get("choices") or choices)
                choices = choices[:target_len]
                while len(choices) < target_len:
                    choices.append("")

            variants.append(
                {
                    "id": orig.get("id"),
                    "text": str(item.get("text") or orig.get("text")),
                    "is_closed": bool(is_closed),
                    "difficulty": difficulty,
                    "choices": choices if is_closed else None,
                    "correct_choices": correct_choices if is_closed else None,
                }
            )

        # Jeśli LLM zwrócił mniej elementów, domknij oryginałami
        if len(variants) < len(questions):
            variants.extend(questions[len(variants) :])

        return variants

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
                with self._storage.download_to_temp(
                    stored_path=str(source_file.stored_path)
                ) as local_path:
                    local_path = Path(local_path)
                    # Prefer composite extractor (text layer + PDF OCR fallback). If still empty, fallback to raw OCR.
                    source_text = composite_text_extractor(local_path, None).strip()
                    if not source_text:
                        source_text = (
                            self._ocr_service.extract_text(file_path=str(local_path))
                            or ""
                        ).strip()
                if not source_text:
                    raise ValueError("Could not extract text from the provided file.")
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

            questions = self._sort_questions(questions)

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

            test.questions = self._sort_questions(test.questions)
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

    def export_custom_test_pdf(
        self,
        *,
        owner_id: int,
        test_id: int,
        config: PdfExportConfig,
    ) -> Tuple[bytes, str]:
        """
        Export a test to a customized PDF using PdfExportConfig and the advanced LaTeX template.
        """
        detail = self.get_test_detail(owner_id=owner_id, test_id=test_id)
        context = self._prepare_pdf_context(detail, config)
        tex = self._render_custom_test_to_tex(context)
        filename = self._build_export_filename(
            detail.title, detail.test_id, suffix="pdf"
        )
        return self._compile_tex_to_pdf(tex), filename

    @staticmethod
    def _build_question_payload(q: QuestionOut) -> Dict:
        choices = q.choices or []
        correct = q.correct_choices or []
        is_multi = bool(q.is_closed and correct and len(correct) > 1)
        return {
            "id": q.id,
            "text": q.text,
            "is_closed": q.is_closed,
            "difficulty": q.difficulty,
            "choices": choices,
            "correct_choices": correct,
            "is_multi": is_multi,
        }

    def _prepare_pdf_context(
        self,
        detail: TestDetailOut,
        config: PdfExportConfig,
    ) -> Dict:
        """
        Prepare context for the advanced PDF export template.
        Supports single-variant and A/B variants scenarios.
        """
        questions = [self._build_question_payload(q) for q in detail.questions]
        questions = self._sort_questions(questions)

        if config.generate_variants and len(questions) > 0:
            variant_a = self._shuffle_within_difficulty(list(questions))

            if getattr(config, "variant_mode", "shuffle") == "llm_variant":
                generated_b = self._generate_llm_variant(questions)
                variant_b = self._shuffle_within_difficulty(
                    self._sort_questions(generated_b)
                )
            else:  # default shuffle in-bucket
                variant_b = self._shuffle_within_difficulty(list(questions))

            variants = [
                {"name": "A", "questions": variant_a},
                {"name": "B", "questions": variant_b},
            ]
        else:
            variants = [{"name": None, "questions": questions}]

        return {
            "title": detail.title or f"Test #{detail.test_id}",
            "test_id": detail.test_id,
            "variants": variants,
            "config": config,
            "brand_hex": "4CAF4F",
            "logo_path": "/app/app/templates/logo.png",
        }

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
    def _build_export_filename(
        title: str | None,
        test_id: int,
        *,
        suffix: str,
    ) -> str:
        base = title or f"test_{test_id}"

        base = unicodedata.normalize("NFKD", base)
        base = base.encode("ascii", "ignore").decode("ascii")

        base = re.sub(r"[^a-zA-Z0-9_-]+", "_", base).strip("_")

        if not base:
            base = f"test_{test_id}"

        return f"{base}_{test_id}.{suffix}"
    
    def update_test_title(self, *, owner_id: int, test_id: int, title: str) -> TestOut:
        title = (title or "").strip()
        if not title:
            raise ValueError("Title cannot be empty")

        with self._uow_factory() as uow:
            session = getattr(uow, "session", None)
            if session is None:
                raise RuntimeError("UnitOfWork session is not initialized")

            test_row = session.get(TestRow, test_id)
            if not test_row or test_row.owner_id != owner_id:
                raise ValueError("Test not found")

            test_row.title = title
            session.add(test_row)
            session.flush()

            return dto.to_test_out(test_row)



__all__ = ["TestService"]

