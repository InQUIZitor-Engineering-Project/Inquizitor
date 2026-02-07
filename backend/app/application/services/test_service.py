"""Service handling test generation and management use-cases."""

from __future__ import annotations

import json
import logging
import random
import re
import time
import unicodedata
from collections.abc import Callable
from typing import Any, cast

from fastapi import HTTPException

from app.api.schemas.tests import (
    AssignQuestionsToGroupRequest,
    BulkConvertQuestionsRequest,
    BulkDeleteQuestionsRequest,
    BulkRegenerateQuestionsRequest,
    BulkUpdateQuestionsRequest,
    GroupOut,
    GroupUpdate,
    PdfExportConfig,
    QuestionCreate,
    QuestionOut,
    QuestionUpdate,
    ReorderQuestionsRequest,
    TestDetailOut,
    TestGenerateRequest,
    TestGenerateResponse,
    TestOut,
)
from app.application import dto
from app.application.interfaces import (
    FileStorage,
    QuestionGenerator,
    UnitOfWork,
)
from app.db.models import Question as QuestionRow
from app.db.models import Test as TestRow
from app.domain.events import TestGenerated
from app.domain.models import PdfExportCache
from app.domain.models import Question as QuestionDomain
from app.domain.models import Test as TestDomain
from app.domain.models.enums import QuestionDifficulty
from app.infrastructure.cache.cache_utils import (
    PDF_TEMPLATE_VERSION,
    hash_payload,
    normalize_config,
)
from app.infrastructure.exporting import (
    compile_tex_to_pdf,
    render_custom_test_to_tex,
    render_test_to_tex,
    test_to_xml_bytes,
)
from app.infrastructure.llm.gemini import GeminiQuestionGenerator
from app.infrastructure.llm.prompts import PromptBuilder
from app.infrastructure.monitoring.posthog_client import analytics

logger = logging.getLogger(__name__)


class TestService:
    def __init__(
        self,
        uow_factory: Callable[[], UnitOfWork],
        *,
        question_generator_fast: QuestionGenerator,
        question_generator_reasoning: QuestionGenerator,
        storage: FileStorage,
        tex_renderer: Callable[..., str] = render_test_to_tex,
        pdf_compiler: Callable[[str], bytes] = compile_tex_to_pdf,
        xml_serializer: Callable[[Any], bytes] = test_to_xml_bytes,
        custom_tex_renderer: (
            Callable[[dict[str, Any]], str]
        ) = render_custom_test_to_tex,
    ) -> None:
        self._uow_factory = uow_factory
        self._question_generator_fast = question_generator_fast
        self._question_generator_reasoning = question_generator_reasoning
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
        elif isinstance(value, int | str):
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
            choices = q.get("choices")
            if isinstance(choices, list) and len(choices) > 1:
                random.shuffle(choices)
                q["choices"] = choices

            d = q.get("difficulty")
            if d in (1, 2, 3):
                buckets[d].append(q)
            else:
                buckets["other"].append(q)

        for key in [1, 2, 3, "other"]:
            random.shuffle(buckets[cast(Any, key)])

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

                # Ponowna walidacja correct_choices po potencjalnym przycięciu choices
                correct_choices = [c for c in correct_choices if c in choices]
                if not correct_choices:
                    correct_choices = [choices[0]]

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
            routing_tier = None

            if normalized_text:
                source_text = normalized_text
                if request.file_id is not None:
                    source_file = uow.files.get(request.file_id)
                    if not source_file or source_file.owner_id != owner_id:
                        raise ValueError("Plik nie został znaleziony")
                    base_title = source_file.filename
                else:
                    base_title = "From raw text"
            elif request.material_ids:
                # We always use markdown_twin for materials
                texts = []
                base_title = "Z wielu plików"
                routing_tiers: list[str] = []
                for m_id in request.material_ids:
                    m = uow.materials.get(m_id)
                    if not m or m.owner_id != owner_id:
                        continue
                    
                    # Markdown twin is our source of truth
                    if m.markdown_twin:
                        texts.append(m.markdown_twin)
                    elif m.extracted_text:
                        # Fallback for old materials without twin
                        texts.append(m.extracted_text)
                    
                    if m.routing_tier:
                        routing_tiers.append(m.routing_tier.value)
                    if len(request.material_ids) == 1:
                        base_title = m.file.filename if m.file else "Unknown file"

                if not texts:
                    raise ValueError(
                        "Materiał nie jest gotowy. "
                        "Poczekaj na zakończenie przetwarzania."
                    )

                source_text = "\n\n".join(texts)
                routing_tier = (
                    "reasoning"
                    if any(tier == "reasoning" for tier in routing_tiers)
                    else "fast"
                )
            elif request.file_id is not None:
                existing_material = uow.materials.get_by_file_id(request.file_id)

                if (
                    existing_material
                    and existing_material.owner_id == owner_id
                    and existing_material.markdown_twin
                ):
                    logger.info(
                        f"Using cached text from material {existing_material.id} "
                        f"for file {request.file_id}"
                    )
                    source_text = existing_material.markdown_twin
                    base_title = (
                        existing_material.file.filename
                        if existing_material.file
                        else "Unknown file"
                    )
                    if existing_material.routing_tier:
                        routing_tier = existing_material.routing_tier.value

                else:
                    raise ValueError(
                        "Brak analizy dla wskazanego pliku. "
                        "Uruchom analizę dokumentu przed generowaniem testu."
                    )
            else:
                raise ValueError("Either text or file_id must be provided")

            try:
                generator = (
                    self._question_generator_reasoning
                    if routing_tier == "reasoning"
                    else self._question_generator_fast
                )
                llm_title, questions, usage = generator.generate(
                    source_text=source_text,
                    params=request,
                )
            except ValueError as exc:
                analytics.capture(
                    user_id=owner_id,
                    event="test_generation_failed",
                    properties={
                        "error_type": "ValueError",
                        "error_message": str(exc),
                        "source": "file" if request.file_id else "text"
                    }
                )
                raise HTTPException(status_code=400, detail=str(exc)) from exc
            except Exception as exc:
                analytics.capture(
                    user_id=owner_id,
                    event="test_generation_failed",
                    properties={
                        "error_type": type(exc).__name__,
                        "error_message": str(exc),
                        "source": "file" if request.file_id else "text"
                    }
                )
                raise HTTPException(
                    status_code=500, detail=f"LLM error: {exc}"
                ) from exc

            if not questions:
                raise ValueError("LLM zwrócił pustą listę pytań.")

            missing_citations = [
                q for q in questions if not getattr(q, "citations", None)
            ]
            if missing_citations:
                raise ValueError("Brak wymaganych cytowań w wygenerowanych pytaniach.")

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

            default_group = uow.tests.create_group(persisted_test.id, "Grupa A", 0)
            if default_group.id is None:
                raise RuntimeError("Failed to create default group")
            for question in questions:
                uow.tests.add_question(persisted_test.id, question, default_group.id)

            TestGenerated.create(
                test_id=persisted_test.id,
                owner_id=owner_id,
                question_count=len(questions),
            )
            
            analytics.capture(
                user_id=owner_id,
                event="test_generated",
                properties={
                    "test_id": persisted_test.id,
                    "question_count": len(questions),
                    "title": final_title,
                    "source": "file" if request.file_id else "text",
                    **usage
                }
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
            groups = uow.tests.get_groups_for_test(test_id)
            return dto.to_test_detail(test, groups)

    def list_tests_for_user(self, *, owner_id: int) -> list[TestOut]:
        with self._uow_factory() as uow:
            tests = uow.tests.list_for_user(owner_id)
        return [dto.to_test_out(t) for t in tests]

    def create_empty_test(self, *, owner_id: int, title: str) -> TestOut:
        with self._uow_factory() as uow:
            test = TestDomain(
                id=None,
                owner_id=owner_id,
                title=title,
            )
            persisted_test = uow.tests.create(test)
            if persisted_test.id is None:
                raise RuntimeError("Failed to create test")
            uow.tests.create_group(persisted_test.id, "Grupa A", 0)
            return dto.to_test_out(persisted_test)

    def create_group(
        self, *, owner_id: int, test_id: int, label: str, position: int = 0
    ) -> GroupOut:
        with self._uow_factory() as uow:
            test = uow.tests.get(test_id)
            if not test or test.owner_id != owner_id:
                raise ValueError("Test nie został znaleziony")
            group = uow.tests.create_group(test_id, label, position)
            return dto.to_group_out(group)

    def update_group(
        self,
        *,
        owner_id: int,
        test_id: int,
        group_id: int,
        payload: GroupUpdate,
    ) -> GroupOut | None:
        with self._uow_factory() as uow:
            test = uow.tests.get(test_id)
            if not test or test.owner_id != owner_id:
                raise ValueError("Test nie został znaleziony")
            group = uow.tests.get_group(group_id)
            if not group or group.test_id != test_id:
                raise ValueError("Grupa nie należy do tego testu")
            data = payload.model_dump(exclude_unset=True)
            updated = uow.tests.update_group(
                group_id,
                label=data.get("label"),
                position=data.get("position"),
            )
            return dto.to_group_out(updated) if updated else None

    def delete_group(self, *, owner_id: int, test_id: int, group_id: int) -> None:
        with self._uow_factory() as uow:
            test = uow.tests.get(test_id)
            if not test or test.owner_id != owner_id:
                raise ValueError("Test nie został znaleziony")
            group = uow.tests.get_group(group_id)
            if not group or group.test_id != test_id:
                raise ValueError("Grupa nie należy do tego testu")
            groups = uow.tests.get_groups_for_test(test_id)
            if len(groups) <= 1:
                raise ValueError("Nie można usunąć ostatniej grupy testu")
            uow.tests.delete_group(group_id)

    def duplicate_group(
        self, *, owner_id: int, test_id: int, group_id: int
    ) -> tuple[GroupOut, list[QuestionOut]]:
        with self._uow_factory() as uow:
            test = uow.tests.get(test_id)
            if not test or test.owner_id != owner_id:
                raise ValueError("Test nie został znaleziony")
            new_group, new_questions = uow.tests.duplicate_group(test_id, group_id)
            return dto.to_group_out(new_group), [
                dto.to_question_out(q) for q in new_questions
            ]

    def create_shuffled_variant_group(
        self, *, owner_id: int, test_id: int, group_id: int
    ) -> GroupOut:
        """Create a new group with the same questions as the source group but shuffled
        (question order within difficulty + choice order within each question). Same as
        former PDF 'generate two versions' with 'shuffle' mode."""
        with self._uow_factory() as uow:
            test = uow.tests.get_with_questions(test_id)
            if not test or test.owner_id != owner_id:
                raise ValueError("Test nie został znaleziony")
            group = uow.tests.get_group(group_id)
            if not group or group.test_id != test_id:
                raise ValueError("Grupa nie należy do tego testu")
            source_questions = [
                q
                for q in test.questions
                if getattr(q, "group_id", None) == group_id
            ]
            if not source_questions:
                raise ValueError("Grupa nie zawiera pytań")

        payloads = [
            {
                "text": q.text,
                "is_closed": q.is_closed,
                "difficulty": getattr(q.difficulty, "value", q.difficulty),
                "choices": list(q.choices or []),
                "correct_choices": list(q.correct_choices or []),
            }
            for q in source_questions
        ]
        shuffled = self._shuffle_within_difficulty(payloads)

        with self._uow_factory() as uow:
            test = uow.tests.get(test_id)
            if not test or test.owner_id != owner_id:
                raise ValueError("Test nie został znaleziony")
            groups = uow.tests.get_groups_for_test(test_id)
            next_letter = chr(65 + len(groups))
            new_group = uow.tests.create_group(
                test_id, f"Grupa {next_letter}", position=len(groups)
            )
            if new_group.id is None:
                raise RuntimeError("Nie udało się utworzyć grupy")
            for p in shuffled:
                q_domain = QuestionDomain(
                    id=None,
                    text=str(p.get("text", "")),
                    is_closed=bool(p.get("is_closed", True)),
                    difficulty=QuestionDifficulty(int(p.get("difficulty", 1))),
                    group_id=new_group.id,
                    choices=p.get("choices") or [],
                    correct_choices=p.get("correct_choices") or [],
                    citations=[],
                )
                uow.tests.add_question(test_id, q_domain, new_group.id)
            return dto.to_group_out(new_group)

    def assign_questions_to_group(
        self,
        *,
        owner_id: int,
        test_id: int,
        payload: AssignQuestionsToGroupRequest,
    ) -> None:
        with self._uow_factory() as uow:
            test = uow.tests.get(test_id)
            if not test or test.owner_id != owner_id:
                raise ValueError("Test nie został znaleziony")
            group = uow.tests.get_group(payload.group_id)
            if not group or group.test_id != test_id:
                raise ValueError("Grupa nie należy do tego testu")
            uow.tests.assign_questions_to_group(payload.question_ids, payload.group_id)

    def generate_group_ai_variant(
        self,
        *,
        owner_id: int,
        test_id: int,
        group_id: int,
        instruction: str | None = None,
    ) -> GroupOut:
        """Create a new group with AI-generated variants of the source group."""
        with self._uow_factory() as uow:
            test = uow.tests.get_with_questions(test_id)
            if not test or test.owner_id != owner_id:
                raise ValueError("Test nie został znaleziony")
            group = uow.tests.get_group(group_id)
            if not group or group.test_id != test_id:
                raise ValueError("Grupa nie należy do tego testu")
            source_questions = [
                q for q in test.questions if getattr(q, "group_id", None) == group_id
            ]
            if not source_questions:
                raise ValueError("Grupa nie zawiera pytań do wygenerowania wariantu")

        questions_payload = [
            {
                "id": q.id,
                "text": q.text,
                "is_closed": q.is_closed,
                "difficulty": getattr(q.difficulty, "value", q.difficulty),
                "choices": q.choices or [],
                "correct_choices": q.correct_choices or [],
            }
            for q in source_questions
        ]
        variants = self._generate_llm_variant(questions_payload, instruction)

        with self._uow_factory() as uow:
            test = uow.tests.get(test_id)
            if not test or test.owner_id != owner_id:
                raise ValueError("Test nie został znaleziony")
            groups = uow.tests.get_groups_for_test(test_id)
            next_letter = chr(65 + len(groups))
            new_group = uow.tests.create_group(
                test_id, f"Grupa {next_letter}", position=len(groups)
            )
            if new_group.id is None:
                raise RuntimeError("Nie udało się utworzyć grupy")
            for v in variants:
                q_domain = QuestionDomain(
                    id=None,
                    text=str(v.get("text", "")),
                    is_closed=bool(v.get("is_closed", True)),
                    difficulty=QuestionDifficulty(int(v.get("difficulty", 1))),
                    group_id=new_group.id,
                    choices=v.get("choices") or [],
                    correct_choices=v.get("correct_choices") or [],
                    citations=[],
                )
                uow.tests.add_question(test_id, q_domain, new_group.id)
            return dto.to_group_out(new_group)

    def delete_test(self, *, owner_id: int, test_id: int) -> None:
        with self._uow_factory() as uow:
            test = uow.tests.get(test_id)
            if not test or test.owner_id != owner_id:
                raise ValueError("Test nie został znaleziony")
            uow.pdf_exports.remove_for_test(test_id)
            uow.tests.remove(test_id)

    def export_test_pdf(
        self, *, owner_id: int, test_id: int, show_answers: bool = False
    ) -> tuple[bytes | None, str, str, str, str, str | None]:
        start_time = time.time()
        detail = self.get_test_detail(owner_id=owner_id, test_id=test_id)
        cache_key, config_hash = self._build_standard_pdf_cache_key(
            detail, show_answers
        )
        cached_path = self._get_cached_pdf_path(cache_key)
        filename = self._build_export_filename(
            detail.title, detail.test_id, suffix="pdf"
        )
        if cached_path:
            duration_sec = time.time() - start_time
            analytics.capture(
                user_id=owner_id,
                event="test_pdf_exported",
                properties={
                    "test_id": test_id,
                    "is_custom": False,
                    "show_answers": show_answers,
                    "duration_sec": duration_sec,
                    "question_count": len(detail.questions),
                    "cache_hit": True,
                },
            )
            return (
                None,
                filename,
                cache_key,
                config_hash,
                PDF_TEMPLATE_VERSION,
                cached_path,
            )
        questions_payload = [
            {
                "id": int(q.id) if q.id is not None else 0,
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
        pdf_bytes = self._compile_tex_to_pdf(tex)

        duration_sec = time.time() - start_time
        analytics.capture(
            user_id=owner_id,
            event="test_pdf_exported",
            properties={
                "test_id": test_id,
                "is_custom": False,
                "show_answers": show_answers,
                "duration_sec": duration_sec,
                "question_count": len(questions_payload),
                "cache_hit": False,
            },
        )

        return (
            pdf_bytes,
            filename,
            cache_key,
            config_hash,
            PDF_TEMPLATE_VERSION,
            None,
        )

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
    ) -> tuple[bytes | None, str, str, str, str, str | None]:
        """
        Export a test to a customized PDF using PdfExportConfig and the
        advanced LaTeX template.
        """
        start_time = time.time()
        detail = self.get_test_detail(owner_id=owner_id, test_id=test_id)
        cache_key, config_hash = self._build_pdf_cache_key(detail, config)
        cached_path = self._get_cached_pdf_path(cache_key)
        filename = self._build_export_filename(
            detail.title, detail.test_id, suffix="pdf"
        )
        if cached_path:
            duration_sec = time.time() - start_time
            analytics.capture(
                user_id=owner_id,
                event="test_pdf_exported",
                properties={
                    "test_id": test_id,
                    "is_custom": (
                        config.generate_variants or config.variant_mode != "shuffle"
                    ),
                    "duration_sec": duration_sec,
                    "question_count": len(detail.questions),
                    "config": (
                        config.model_dump()
                        if hasattr(config, "model_dump")
                        else str(config)
                    ),
                    "cache_hit": True,
                },
            )
            return (
                None,
                filename,
                cache_key,
                config_hash,
                PDF_TEMPLATE_VERSION,
                cached_path,
            )
        context = self._prepare_pdf_context(detail, config)
        tex = self._render_custom_test_to_tex(context)
        pdf_bytes = self._compile_tex_to_pdf(tex)

        duration_sec = time.time() - start_time
        analytics.capture(
            user_id=owner_id,
            event="test_pdf_exported",
            properties={
                "test_id": test_id,
                "is_custom": (
                    config.generate_variants or config.variant_mode != "shuffle"
                ),
                "duration_sec": duration_sec,
                "question_count": len(detail.questions),
                "config": (
                    config.model_dump()
                    if hasattr(config, "model_dump")
                    else str(config)
                ),
                "cache_hit": False,
            },
        )

        return (
            pdf_bytes,
            filename,
            cache_key,
            config_hash,
            PDF_TEMPLATE_VERSION,
            None,
        )

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
        # Use order from detail (custom order from UI)
        questions = [self._build_question_payload(q) for q in detail.questions]
        groups = getattr(detail, "groups", None) or []

        if groups:
            sorted_groups = sorted(groups, key=lambda g: (g.position, g.id))
            group_ids = {g.id for g in sorted_groups}
            questions_by_group: dict[int, list[dict[str, Any]]] = {
                g.id: [] for g in sorted_groups
            }
            for q in detail.questions:
                gid = getattr(q, "group_id", None)
                if gid is not None and gid in group_ids:
                    questions_by_group.setdefault(gid, []).append(
                        self._build_question_payload(q)
                    )
            variants = [
                {"name": g.label, "questions": questions_by_group.get(g.id, [])}
                for g in sorted_groups
            ]
        elif config.generate_variants and len(questions) > 0:
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
            variants = [{"name": "", "questions": questions}]

        return {
            "title": detail.title or f"Test #{detail.test_id}",
            "test_id": detail.test_id,
            "variants": variants,
            "config": config,
            "brand_hex": "4CAF4F",
            "logo_path": "/app/app/templates/logo.png",
        }

    def _build_pdf_cache_key(
        self, detail: TestDetailOut, config: PdfExportConfig
    ) -> tuple[str, str]:
        questions_hash = self._build_questions_hash(detail)
        config_hash = hash_payload(normalize_config(config))
        cache_key = hash_payload(
            str(detail.test_id),
            config_hash,
            PDF_TEMPLATE_VERSION,
            questions_hash,
        )
        return cache_key, config_hash

    def _build_standard_pdf_cache_key(
        self, detail: TestDetailOut, show_answers: bool
    ) -> tuple[str, str]:
        questions_hash = self._build_questions_hash(detail)
        config_hash = hash_payload(
            normalize_config({"show_answers": show_answers, "type": "standard"})
        )
        cache_key = hash_payload(
            str(detail.test_id),
            config_hash,
            PDF_TEMPLATE_VERSION,
            questions_hash,
        )
        return cache_key, config_hash

    @staticmethod
    def _build_questions_hash(detail: TestDetailOut) -> str:
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
        def _id_key(item: dict[str, Any]) -> int:
            value = item.get("id")
            if isinstance(value, list):
                return 0
            try:
                return int(value or 0)
            except Exception:
                return 0

        questions_payload = sorted(questions_payload, key=_id_key)
        return hash_payload(normalize_config(questions_payload))

    def _get_cached_pdf_path(self, cache_key: str) -> str | None:
        with self._uow_factory() as uow:
            entry = uow.pdf_exports.get_by_key(cache_key)
            return entry.stored_path if entry else None

    def record_pdf_export_cache(
        self,
        *,
        test_id: int,
        cache_key: str,
        config_hash: str,
        template_version: str,
        stored_path: str,
    ) -> None:
        with self._uow_factory() as uow:
            entry = PdfExportCache(
                id=None,
                test_id=test_id,
                cache_key=cache_key,
                config_hash=config_hash,
                template_version=template_version,
                stored_path=stored_path,
            )
            uow.pdf_exports.add(entry)

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

            analytics.capture(
                user_id=owner_id,
                event="question_manually_edited",
                properties={
                    "test_id": test_id,
                    "question_id": question_id,
                    "fields_changed": list(data.keys()),
                    "is_closed": question_row.is_closed,
                    "difficulty": question_row.difficulty
                }
            )

            return QuestionOut(
                id=question_row.id,
                text=question_row.text,
                is_closed=question_row.is_closed,
                difficulty=question_row.difficulty,
                group_id=getattr(question_row, "group_id", 0),
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

    def reorder_questions(
        self,
        *,
        owner_id: int,
        test_id: int,
        payload: ReorderQuestionsRequest,
    ) -> None:
        with self._uow_factory() as uow:
            test = uow.tests.get_with_questions(test_id)
            if not test or test.owner_id != owner_id:
                raise ValueError("Test nie został znaleziony")
            uow.tests.reorder_questions(test_id, payload.question_ids)

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
                variant = next((v for v in new_variants if v.get("id") == row.id), None)
                if variant:
                    row.text = variant["text"]
                    row.choices = variant["choices"]
                    row.correct_choices = variant["correct_choices"]
                    session.add(row)
                    updated_count += 1

            session.flush()
            
            analytics.capture(
                user_id=owner_id,
                event="bulk_questions_regenerated",
                properties={
                    "test_id": test_id,
                    "count": updated_count,
                    "instruction": payload.instruction
                }
            )
            
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
                    
                    analytics.capture(
                        user_id=owner_id,
                        event="bulk_questions_converted",
                        properties={
                            "test_id": test_id,
                            "count": updated_count,
                            "target_type": "open"
                        }
                    )
                    
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
                
                analytics.capture(
                    user_id=owner_id,
                    event="bulk_questions_converted",
                    properties={
                        "test_id": test_id,
                        "count": updated_count,
                        "target_type": "closed"
                    }
                )
                
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
        Dodaje nowe pytanie do testu użytkownika w podanej grupie.
        Zwraca QuestionOut, żeby endpoint mógł od razu odesłać aktualne dane.
        """
        with self._uow_factory() as uow:
            test = uow.tests.get(test_id)
            if not test or test.owner_id != owner_id:
                raise ValueError("Test nie został znaleziony")

            group = uow.tests.get_group(payload.group_id)
            if not group or group.test_id != test_id:
                raise ValueError("Grupa nie należy do tego testu")

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
            if not payload.is_closed:
                choices = None
                correct_choices = None

            q_domain = QuestionDomain(
                id=None,
                text=payload.text,
                is_closed=payload.is_closed,
                difficulty=QuestionDifficulty(payload.difficulty),
                group_id=payload.group_id,
                choices=choices or [],
                correct_choices=correct_choices or [],
                citations=getattr(payload, "citations", None) or [],
            )
            created = uow.tests.add_question(test_id, q_domain, payload.group_id)
            return dto.to_question_out(created)

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
                raise ValueError("Test nie został znaleziony")

            test_row.title = title
            session.add(test_row)
            session.flush()

            return dto.to_test_out(test_row)

    def get_test_generation_config(
        self,
        *,
        owner_id: int,
        test_id: int,
    ) -> dict[str, Any]:
        with self._uow_factory() as uow:
            job = uow.jobs.get_generation_job_by_test_id(test_id)
            if not job or job.owner_id != owner_id:
                raise ValueError("Nie znaleziono konfiguracji dla tego testu")
            
            config = job.payload.copy()
            
            # Jeśli config ma material_ids, sprawdź które materiały jeszcze istnieją
            if config.get("material_ids"):
                existing_material_ids = []
                for material_id in config["material_ids"]:
                    material = uow.materials.get(material_id)
                    # Tylko dodaj jeśli materiał istnieje i należy do użytkownika
                    if material and material.owner_id == owner_id:
                        existing_material_ids.append(material_id)
                
                # Jeśli wszystkie materiały zostały usunięte, usuń material_ids z config
                # (test nadal działa, ale nie można go edytować z materiałami)
                if existing_material_ids:
                    config["material_ids"] = existing_material_ids
                else:
                    config.pop("material_ids", None)
                    # Jeśli nie ma już materiałów, użyj tekstu jeśli jest dostępny
                    if "text" not in config or not config.get("text"):
                        # Jeśli nie ma ani materiałów ani tekstu, użyj pustego tekstu
                        config["text"] = ""
            
            return config


__all__ = ["TestService"]
