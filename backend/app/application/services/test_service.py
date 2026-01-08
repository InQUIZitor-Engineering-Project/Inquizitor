"""Service handling test generation and management use-cases."""

from __future__ import annotations

import json
import logging
import random
import re
import unicodedata
from collections.abc import Callable
from pathlib import Path
from typing import Any, cast

from fastapi import HTTPException

from app.api.schemas.tests import (
    BulkConvertQuestionsRequest,
    BulkDeleteQuestionsRequest,
    BulkRegenerateQuestionsRequest,
    BulkUpdateQuestionsRequest,
    PdfExportConfig,
    QuestionCreate,
    QuestionOut,
    QuestionUpdate,
    TestDetailOut,
    TestGenerateRequest,
    TestGenerateResponse,
    TestOut,
)
from app.application import dto
from app.application.interfaces import (
    FileStorage,
    OCRService,
    QuestionGenerator,
    UnitOfWork,
)
from app.db.models import Question as QuestionRow
from app.db.models import Test as TestRow
from app.domain.events import TestGenerated
from app.domain.models import Test as TestDomain
from app.domain.models.enums import QuestionDifficulty
from app.infrastructure.exporting import (
    compile_tex_to_pdf,
    render_custom_test_to_tex,
    render_test_to_tex,
    test_to_xml_bytes,
)
from app.infrastructure.extractors.extract_composite import composite_text_extractor
from app.infrastructure.llm.gemini import GeminiQuestionGenerator
from app.infrastructure.llm.prompts import PromptBuilder

logger = logging.getLogger(__name__)


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
        xml_serializer: Callable[[Any], bytes] = test_to_xml_bytes,
        custom_tex_renderer: (
            Callable[[dict[str, Any]], str]
        ) = render_custom_test_to_tex,
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
    def _difficulty_order(value: Any) -> int:
        """
        Mapuje poziom trudności na stabilny klucz sortujący
        (łatwe → średnie → trudne).
        """
        raw: int | None = None
        if isinstance(value, QuestionDifficulty):
            raw = value.value
        elif isinstance(value, (int, str)):
            try:
                raw = int(value)
            except Exception:
                raw = None
        
        return {1: 0, 2: 1, 3: 2}.get(raw if raw is not None else -1, 99)

    @classmethod
    def _sort_questions(cls, questions: list[Any]) -> list[Any]:
        """
        Zwraca listę pytań posortowaną rosnąco po trudności, a następnie
        stabilnie po id. Działa zarówno dla obiektów domenowych, jak i
        dictów/DTO (używa getattr / get).
        """

        def _key(q: Any) -> tuple[int, int]:
            difficulty = getattr(q, "difficulty", None)
            qid = getattr(q, "id", None)
            if isinstance(q, dict):
                difficulty = q.get("difficulty", difficulty)
                qid = q.get("id", qid)
            return (cls._difficulty_order(difficulty), qid or 0)

        return sorted(questions, key=_key)

    @staticmethod
    def _shuffle_within_difficulty(
        questions: list[dict[str, Any]],
    ) -> list[dict[str, Any]]:
        """
        Tasuje pytania tylko wewnątrz bucketów trudności, utrzymując kolejność
        bucketów (łatwe→średnie→trudne→inne).
        """
        buckets: dict[int | str, list[dict[str, Any]]] = {
            1: [],
            2: [],
            3: [],
            "other": [],
        }
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
    def _build_variant_prompt(
        self, questions: list[dict[str, Any]], instruction: str | None = None
    ) -> str:
        """
        Buduje prompt do wygenerowania wariantów pytań w jednej odpowiedzi
        JSON (lista).
        """
        return PromptBuilder.build_regeneration_prompt(questions, instruction)

    def _generate_llm_variant(
        self, questions: list[dict[str, Any]], instruction: str | None = None
    ) -> list[dict[str, Any]]:
        """
        Próbuje wygenerować wariant B pytań z użyciem LLM. W razie błędu
        zwraca oryginał.
        """
        if not questions:
            return questions

        prompt = self._build_variant_prompt(questions, instruction)

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
        except Exception as exc:
            logger.warning("LLM variant generation failed: %s", exc)
            return questions

        if not isinstance(parsed, list):
            logger.warning("LLM variant returned non-list")
            return questions

        variants: list[dict[str, Any]] = []
        for orig, item in zip(questions, parsed, strict=False):
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
                # Zachowaj liczność odpowiedzi i poprawnych;
                # jeśli brak, fallback do oryginału
                if not isinstance(choices, list) or not choices:
                    variants.append(orig)
                    continue
                
                # Czyścimy i normalizujemy choices
                choices = [str(c).strip() for c in choices if str(c).strip()]
                
                if not choices:
                    variants.append(orig)
                    continue

                if not isinstance(correct_choices, list):
                    correct_choices = (
                        [correct_choices] if correct_choices is not None else []
                    )
                
                # Czyścimy i upewniamy się, że są w choices
                correct_choices = [
                    str(c).strip() for c in correct_choices if str(c).strip()
                ]
                correct_choices = [c for c in correct_choices if c in choices]

                if not correct_choices:
                    # Fallback do pierwszej opcji jeśli LLM nie zwrócił
                    # nic poprawnego z listy
                    correct_choices = [choices[0]]

                # Przytnij/uzupełnij do tej samej liczby co oryginał, aby zachować układ
                target_len = len(orig.get("choices") or choices)
                choices = choices[:target_len]
                while len(choices) < target_len:
                    choices.append("")
                
                # Ponowna walidacja correct_choices po potencjalnym przycięciu choices
                correct_choices = [c for c in correct_choices if c in choices]
                if not correct_choices:
                    correct_choices = [choices[0]]

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
                        raise ValueError("Plik nie został znaleziony")
                    base_title = source_file.filename
                else:
                    base_title = "From raw text"
            elif request.file_id is not None:
                existing_material = uow.materials.get_by_file_id(request.file_id)

                if (
                    existing_material
                    and existing_material.extracted_text
                    and existing_material.owner_id == owner_id
                ):
                    logger.info(
                        f"Using cached text from material {existing_material.id} "
                        f"for file {request.file_id}"
                    )
                    source_text = existing_material.extracted_text
                    base_title = (
                        existing_material.file.filename
                        if existing_material.file
                        else "Unknown file"
                    )

                else:
                    source_file = uow.files.get(request.file_id)
                    if not source_file or source_file.owner_id != owner_id:
                        raise ValueError("Plik nie został znaleziony")
                    with self._storage.download_to_temp(
                        stored_path=str(source_file.stored_path)
                    ) as local_path:
                        local_path = Path(local_path)
                        # Prefer composite extractor (text layer + PDF OCR fallback).
                        # If still empty, fallback to raw OCR.
                        source_text = composite_text_extractor(
                            local_path, None
                        ).strip()
                        if not source_text:
                            source_text = (
                                self._ocr_service.extract_text(file_path=str(local_path))
                                or ""
                            ).strip()
                    if not source_text:
                        raise ValueError(
                            "Could not extract text from the provided file."
                        )
                    base_title = source_file.filename
            else:
                raise ValueError("Either text or file_id must be provided")
            
            try:
                llm_title, questions = self._question_generator.generate(
                    source_text=source_text,
                    params=request,
                )
            except ValueError as exc:
                raise HTTPException(status_code=400, detail=str(exc)) from exc
            except Exception as exc:
                raise HTTPException(
                    status_code=500, detail=f"LLM error: {exc}"
                ) from exc

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
            if persisted_test.id is None:
                raise RuntimeError("Failed to persist test")

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
                raise ValueError("Test nie został znaleziony")

            test.questions = self._sort_questions(test.questions)
            return dto.to_test_detail(test)

    def list_tests_for_user(self, *, owner_id: int) -> list[TestOut]:
        with self._uow_factory() as uow:
            tests = uow.tests.list_for_user(owner_id)
        return [dto.to_test_out(t) for t in tests]

    def delete_test(self, *, owner_id: int, test_id: int) -> None:
        with self._uow_factory() as uow:
            test = uow.tests.get(test_id)
            if not test or test.owner_id != owner_id:
                raise ValueError("Test nie został znaleziony")
            uow.tests.remove(test_id)

    def export_test_pdf(
        self, *, owner_id: int, test_id: int, show_answers: bool = False
    ) -> tuple[bytes, str]:
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
        filename = self._build_export_filename(
            detail.title, detail.test_id, suffix="pdf"
        )
        return self._compile_tex_to_pdf(tex), filename

    def export_test_xml(self, *, owner_id: int, test_id: int) -> tuple[bytes, str]:
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
        filename = self._build_export_filename(
            detail.title, detail.test_id, suffix="xml"
        )
        return self._test_to_xml(data), filename

    def export_custom_test_pdf(
        self,
        *,
        owner_id: int,
        test_id: int,
        config: PdfExportConfig,
    ) -> tuple[bytes, str]:
        """
        Export a test to a customized PDF using PdfExportConfig and the
        advanced LaTeX template.
        """
        detail = self.get_test_detail(owner_id=owner_id, test_id=test_id)
        context = self._prepare_pdf_context(detail, config)
        tex = self._render_custom_test_to_tex(context)
        filename = self._build_export_filename(
            detail.title, detail.test_id, suffix="pdf"
        )
        return self._compile_tex_to_pdf(tex), filename

    @staticmethod
    def _build_question_payload(q: QuestionOut) -> dict[str, Any]:
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
    ) -> dict[str, Any]:
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

            variants: list[dict[str, Any]] = [
                {"name": "A", "questions": variant_a},
                {"name": "B", "questions": variant_b},
            ]
        else:
            variants = [{"name": "", "questions": questions}]

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
        payload: QuestionUpdate | dict[str, Any],
    ) -> QuestionOut:
        with self._uow_factory() as uow:
            test = uow.tests.get(test_id)
            if not test or test.owner_id != owner_id:
                raise ValueError("Test nie został znaleziony")

            session = getattr(uow, "session", None)
            if session is None:
                raise RuntimeError("UnitOfWork session is not initialized")

            question_row = session.get(QuestionRow, question_id)
            if not question_row or question_row.test_id != test_id:
                raise ValueError("Pytanie nie zostało znalezione")

            # ogarniamy payload niezależnie czy to Pydantic czy dict
            if isinstance(payload, QuestionUpdate):
                data = payload.model_dump(exclude_unset=True)
            else:
                data = payload

            allowed_fields = {
                "text",
                "is_closed",
                "difficulty",
                "choices",
                "correct_choices",
            }

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

    def bulk_update_questions(
        self,
        *,
        owner_id: int,
        test_id: int,
        payload: BulkUpdateQuestionsRequest,
    ) -> None:
        with self._uow_factory() as uow:
            test = uow.tests.get(test_id)
            if not test or test.owner_id != owner_id:
                raise ValueError("Test nie został znaleziony")

            session = getattr(uow, "session", None)
            if session is None:
                raise RuntimeError("UnitOfWork session is not initialized")

            # Pobieramy pytania należące do tego testu
            from sqlmodel import select
            statement: Any = select(QuestionRow).where(
                QuestionRow.test_id == test_id,
                cast(Any, QuestionRow.id).in_(payload.question_ids),
            )
            questions = session.exec(statement).all()

            for q in questions:
                if payload.difficulty is not None:
                    q.difficulty = payload.difficulty
                
                if payload.is_closed is not None:
                    q.is_closed = payload.is_closed
                    if payload.is_closed is False:
                        q.choices = None
                        q.correct_choices = None
                
                session.add(q)
            
            session.flush()

    def bulk_delete_questions(
        self,
        *,
        owner_id: int,
        test_id: int,
        payload: BulkDeleteQuestionsRequest,
    ) -> None:
        with self._uow_factory() as uow:
            test = uow.tests.get(test_id)
            if not test or test.owner_id != owner_id:
                raise ValueError("Test nie został znaleziony")

            session = getattr(uow, "session", None)
            if session is None:
                raise RuntimeError("UnitOfWork session is not initialized")

            from sqlalchemy import delete
            statement: Any = delete(QuestionRow).where(
                QuestionRow.test_id == test_id,
                cast(Any, QuestionRow.id).in_(payload.question_ids),
            )
            session.exec(statement)
            session.flush()

    def bulk_regenerate_questions(
        self,
        *,
        owner_id: int,
        test_id: int,
        payload: BulkRegenerateQuestionsRequest,
    ) -> int:
        """
        Regeneruje zaznaczone pytania przy użyciu LLM.
        Zwraca liczbę zregenerowanych pytań.
        """
        with self._uow_factory() as uow:
            test = uow.tests.get(test_id)
            if not test or test.owner_id != owner_id:
                raise ValueError("Test nie został znaleziony")

            session = getattr(uow, "session", None)
            if session is None:
                raise RuntimeError("UnitOfWork session is not initialized")

            from sqlmodel import select
            statement: Any = select(QuestionRow).where(
                QuestionRow.test_id == test_id,
                cast(Any, QuestionRow.id).in_(payload.question_ids),
            )
            questions_rows = session.exec(statement).all()
            
            if not questions_rows:
                return 0

            # Przygotowujemy payload dla LLM
            questions_payload = [
                {
                    "id": q.id,
                    "text": q.text,
                    "is_closed": q.is_closed,
                    "difficulty": q.difficulty,
                    "choices": q.choices,
                    "correct_choices": q.correct_choices,
                }
                for q in questions_rows
            ]

            # Wykorzystujemy istniejącą logikę generowania wariantów
            new_variants = self._generate_llm_variant(
                questions_payload, payload.instruction
            )

            # Aktualizujemy rekordy w bazie
            updated_count = 0
            for row in questions_rows:
                # Szukamy odpowiadającego wariantu po ID
                # (nasza metoda _generate_llm_variant zachowuje ID)
                variant = next(
                    (v for v in new_variants if v.get("id") == row.id), None
                )
                if variant:
                    row.text = variant["text"]
                    row.choices = variant["choices"]
                    row.correct_choices = variant["correct_choices"]
                    session.add(row)
                    updated_count += 1
            
            session.flush()
            return updated_count

    def bulk_convert_questions(
        self,
        *,
        owner_id: int,
        test_id: int,
        payload: BulkConvertQuestionsRequest,
    ) -> int:
        """
        Konwertuje zaznaczone pytania (Otwarte <-> Zamknięte).
        Dla Otwarte -> Zamknięte używa LLM.
        """
        with self._uow_factory() as uow:
            test = uow.tests.get(test_id)
            if not test or test.owner_id != owner_id:
                raise ValueError("Test nie został znaleziony")

            session = getattr(uow, "session", None)
            if session is None:
                raise RuntimeError("UnitOfWork session is not initialized")

            from sqlmodel import select
            statement: Any = select(QuestionRow).where(
                QuestionRow.test_id == test_id,
                cast(Any, QuestionRow.id).in_(payload.question_ids),
            )
            questions_rows = session.exec(statement).all()
            
            if not questions_rows:
                return 0

            updated_count = 0
            
            # 1. Konwersja na Otwarte (wymaga LLM do wygładzenia treści)
            if payload.target_type == "open":
                to_convert_to_open = [q for q in questions_rows if q.is_closed]
                if not to_convert_to_open:
                    return 0

                questions_payload = [
                    {
                        "id": q.id,
                        "text": q.text,
                        "choices": q.choices,
                        "correct_choices": q.correct_choices,
                        "difficulty": q.difficulty,
                    }
                    for q in to_convert_to_open
                ]

                prompt = PromptBuilder.build_closed_to_open_prompt(questions_payload)

                try:
                    client = GeminiQuestionGenerator._client()
                    response = client.models.generate_content(
                        model="gemini-2.5-flash",
                        contents=prompt,
                    )
                    raw = (response.text or "").strip()
                    if "```json" in raw:
                        raw = raw.split("```json")[1].split("```")[0].strip()
                    elif "```" in raw:
                        raw = raw.split("```")[1].split("```")[0].strip()
                    
                    parsed = json.loads(raw)
                    
                    for row in to_convert_to_open:
                        variant = next(
                            (v for v in parsed if v.get("id") == row.id), None
                        )
                        if variant:
                            row.is_closed = False
                            # AI wygładza treść, usuwając kontekst opcji wyboru
                            row.text = str(variant.get("text", row.text)).strip()
                            row.choices = None
                            row.correct_choices = None
                            session.add(row)
                            updated_count += 1
                    
                    session.flush()
                    return updated_count
                except Exception as exc:
                    logger.error("Failed to convert questions to open via LLM: %s", exc)
                    raise RuntimeError(
                        f"Błąd konwersji na otwarte przez AI: {exc!s}"
                    ) from exc

            # 2. Konwersja na Zamknięte (wymaga LLM)
            # Filtrujemy tylko te, które faktycznie są otwarte
            to_convert_to_closed = [q for q in questions_rows if not q.is_closed]
            if not to_convert_to_closed:
                return 0

            questions_payload = [
                {
                    "id": q.id,
                    "text": q.text,
                    "difficulty": q.difficulty,
                }
                for q in to_convert_to_closed
            ]

            prompt = PromptBuilder.build_conversion_prompt(questions_payload)

            try:
                client = GeminiQuestionGenerator._client()
                response = client.models.generate_content(
                    model="gemini-2.5-flash",
                    contents=prompt,
                )
                raw = (response.text or "").strip()
                # Prosty cleanup markdowna
                if "```json" in raw:
                    raw = raw.split("```json")[1].split("```")[0].strip()
                elif "```" in raw:
                    raw = raw.split("```")[1].split("```")[0].strip()
                
                parsed = json.loads(raw)
                
                for row in to_convert_to_closed:
                    variant = next((v for v in parsed if v.get("id") == row.id), None)
                    if variant:
                        row.is_closed = True
                        
                        # Aktualizujemy tekst pytania na ten od AI
                        row.text = str(variant.get("text", row.text)).strip()
                        
                        # Pobieramy i czyścimy opcje
                        raw_choices = variant.get("choices", ["A", "B", "C", "D"])
                        row.choices = [
                            str(c).strip() for c in raw_choices if str(c).strip()
                        ]
                        
                        # Pobieramy i czyścimy poprawne odpowiedzi,
                        # upewniając się że są w choices
                        raw_correct = variant.get("correct_choices", [])
                        if not isinstance(raw_correct, list):
                            raw_correct = [raw_correct]
                        
                        clean_correct = [
                            str(c).strip() for c in raw_correct if str(c).strip()
                        ]
                        valid_correct = [c for c in clean_correct if c in row.choices]
                        
                        # Jeśli LLM nawaliło i nie podało poprawnej z listy,
                        # bierzemy pierwszą jako fallback
                        if not valid_correct and row.choices:
                            valid_correct = [row.choices[0]]
                            
                        row.correct_choices = valid_correct
                        session.add(row)
                        updated_count += 1
                
                session.flush()
                return updated_count
            except Exception as exc:
                logger.error("Failed to convert questions to closed via LLM: %s", exc)
                raise RuntimeError(f"Błąd konwersji przez AI: {exc!s}") from exc

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
                raise ValueError("Test nie został znaleziony")

            session = getattr(uow, "session", None)
            if session is None:
                raise RuntimeError("UnitOfWork session is not initialized")

            # Bezpieczne ogarnięcie choices / correct_choices
            choices = (
                self._coerce_to_list(payload.choices)
                if payload.choices is not None
                else None
            )
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
                raise ValueError("Test nie został znaleziony")

            session = getattr(uow, "session", None)
            if session is None:
                raise RuntimeError("UnitOfWork session is not initialized")

            question_row = session.get(QuestionRow, question_id)
            if not question_row or question_row.test_id != test_id:
                raise ValueError("Pytanie nie zostało znalezione")

            session.delete(question_row)

    @staticmethod
    def _coerce_to_list(value: Any) -> list[Any] | None:
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
                raise ValueError("Test nie został znaleziony")

            test_row.title = title
            session.add(test_row)
            session.flush()

            return dto.to_test_out(test_row)



__all__ = ["TestService"]

