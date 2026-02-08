from __future__ import annotations

from collections.abc import Callable
from datetime import datetime

from sqlalchemy import delete

from app.api.schemas.users import UserStatistics
from app.application.interfaces import UnitOfWork
from app.core.security import get_password_hash, verify_password
from app.db.models import PdfExportCache as PdfExportCacheRow
from app.db.models import User as UserRow


class UserService:
    def __init__(
        self,
        uow_factory: Callable[[], UnitOfWork],
        *,
        password_verifier: Callable[[str, str], bool] = verify_password,
        password_hasher: Callable[[str], str] = get_password_hash,
    ) -> None:
        self._uow_factory = uow_factory
        self._password_verifier = password_verifier
        self._password_hasher = password_hasher

    def get_user_statistics(self, *, user_id: int) -> UserStatistics:
        with self._uow_factory() as uow:
            tests = list(uow.tests.list_for_user(user_id))

            files_repo = getattr(uow, "files", None)
            total_files = 0
            if files_repo:
                total_files = len(list(files_repo.list_for_user(user_id)))

            total_tests = len(tests)
            total_questions = 0

            total_closed = 0
            total_open = 0
            easy = medium = hard = 0
            last_test_created_at: datetime | None = None

            for test in tests:
                if test.id is None:
                    continue
                test_with_q = uow.tests.get_with_questions(test.id)
                if not test_with_q:
                    continue

                questions = list(getattr(test_with_q, "questions", []) or [])
                total_questions += len(questions)

                for q in questions:
                    is_closed = bool(getattr(q, "is_closed", True))
                    if is_closed:
                        total_closed += 1
                    else:
                        total_open += 1

                    raw_diff = getattr(q, "difficulty", None)

                    v = getattr(raw_diff, "value", raw_diff)

                    diff: int
                    if isinstance(v, int):
                        diff = v
                    else:
                        name = str(getattr(raw_diff, "name", v)).lower()
                        if "easy" in name or name == "1":
                            diff = 1
                        elif "medium" in name or name == "2":
                            diff = 2
                        elif "hard" in name or name == "3":
                            diff = 3
                        else:
                            diff = 1

                    if diff == 1:
                        easy += 1
                    elif diff == 2:
                        medium += 1
                    elif diff == 3:
                        hard += 1
                    else:
                        easy += 1

                created_at = getattr(test, "created_at", None)
                if created_at and (
                    last_test_created_at is None or created_at > last_test_created_at
                ):
                    last_test_created_at = created_at

            avg = float(total_questions) / total_tests if total_tests > 0 else 0.0

            return UserStatistics(
                total_tests=total_tests,
                total_questions=total_questions,
                total_files=total_files,
                avg_questions_per_test=avg,
                last_test_created_at=last_test_created_at,
                total_closed_questions=total_closed,
                total_open_questions=total_open,
                total_easy_questions=easy,
                total_medium_questions=medium,
                total_hard_questions=hard,
            )


    def change_password(
        self, *, user_id: int, old_password: str, new_password: str
    ) -> None:
        with self._uow_factory() as uow:
            session = getattr(uow, "session", None)
            if session is None:
                raise RuntimeError("UnitOfWork session is not initialized")

            # Pobieramy użytkownika jako encję bazy danych (SQLModel/SQLAlchemy)
            user = session.get(UserRow, user_id)
            if not user:
                raise ValueError("Użytkownik nie został znaleziony")

            # Weryfikacja starego hasła
            if not verify_password(old_password, user.hashed_password):
                raise ValueError("Nieprawidłowe aktualne hasło")

            # Ustawienie nowego hasła
            user.hashed_password = get_password_hash(new_password)

            # Encja jest zmapowana, więc samo session.add(user) jest opcjonalne,
            # ale nie zaszkodzi:
            session.add(user)

    def update_consents(
        self, *, user_id: int, terms_accepted: bool, marketing_accepted: bool
    ) -> None:
        with self._uow_factory() as uow:
            session = getattr(uow, "session", None)
            if session is None:
                raise RuntimeError("UnitOfWork session is not initialized")

            user = session.get(UserRow, user_id)
            if not user:
                raise ValueError("Użytkownik nie został znaleziony")

            if user.terms_accepted != terms_accepted:
                user.terms_accepted = terms_accepted
                user.terms_accepted_at = datetime.utcnow() if terms_accepted else None

            if user.marketing_accepted != marketing_accepted:
                user.marketing_accepted = marketing_accepted
                user.marketing_accepted_at = (
                    datetime.utcnow() if marketing_accepted else None
                )

            session.add(user)

    def delete_account(self, *, user_id: int) -> list[str]:
        """
        Delete user and all related data in a single transaction.
        Returns list of physical file paths to clean up; caller should schedule
        cleanup task only after this returns (so after commit).
        """
        with self._uow_factory() as uow:
            session = getattr(uow, "session", None)
            if session is None:
                raise RuntimeError("UnitOfWork session is not initialized")

            user = session.get(UserRow, user_id)
            if not user:
                raise ValueError("Użytkownik nie został znaleziony")

            # Collect paths of physical files to delete (schedule after commit)
            file_paths: list[str] = []
            for file_row in user.files:
                if file_row.filepath:
                    file_paths.append(file_row.filepath)
            for material_row in user.materials:
                if material_row.thumbnail_path:
                    file_paths.append(material_row.thumbnail_path)

            # Remove pdf_export cache entries (no commit here – part of same tx)
            test_ids = [t.id for t in user.tests if t.id is not None]
            if test_ids:
                stmt = delete(PdfExportCacheRow).where(
                    PdfExportCacheRow.test_id.in_(test_ids)
                )
                session.execute(stmt)

            # Cascade delete will remove tests, files, materials, tokens, etc.
            session.delete(user)
            # UoW commits on exit; only then is the deletion durable

        return file_paths
