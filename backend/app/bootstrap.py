import logging
from functools import lru_cache
from pathlib import Path
from typing import Optional

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.application.services import AuthService, FileService, MaterialService, TestService
from app.application.unit_of_work import SqlAlchemyUnitOfWork
from app.core.config import Settings, get_settings
from app.db.session import get_session_factory, init_db
from app.infrastructure import (
    DefaultOCRService,
    GeminiQuestionGenerator,
    LocalFileStorage,
    SqlModelFileRepository,
    SqlModelMaterialRepository,
    SqlModelTestRepository,
    SqlModelUserRepository,
)
from app.api.routers import auth, files, materials, tests, users
from app.infrastructure.extractors import extract_text_from_file

try:  # pragma: no cover - optional dependency
    import magic
except Exception:  # noqa: B902 - best effort fallback if libmagic unavailable
    magic = None


class AppContainer:
    """Minimal container for application-wide dependency injection."""

    def __init__(self, settings: Settings):
        self._settings = settings
        self._question_generator = GeminiQuestionGenerator()
        self._ocr_service = DefaultOCRService()
        self._file_storage = LocalFileStorage()
        self._materials_storage = LocalFileStorage(base_dir=Path("uploads/materials"))
        self._session_factory = get_session_factory(settings)

    @property
    def settings(self) -> Settings:
        return self._settings

    def provide_db_session(self):
        from app.db.session import get_session

        return get_session

    def provide_question_generator(self) -> GeminiQuestionGenerator:
        return self._question_generator

    def provide_ocr_service(self) -> DefaultOCRService:
        return self._ocr_service

    def provide_file_storage(self) -> LocalFileStorage:
        return self._file_storage

    def provide_user_repository(self, session) -> SqlModelUserRepository:
        return SqlModelUserRepository(session)

    def provide_test_repository(self, session) -> SqlModelTestRepository:
        return SqlModelTestRepository(session)

    def provide_file_repository(self, session) -> SqlModelFileRepository:
        return SqlModelFileRepository(session)

    def provide_material_repository(self, session) -> SqlModelMaterialRepository:
        return SqlModelMaterialRepository(session)

    def provide_unit_of_work(self) -> SqlAlchemyUnitOfWork:
        return SqlAlchemyUnitOfWork(self._session_factory)

    def provide_auth_service(self) -> AuthService:
        return AuthService(lambda: self.provide_unit_of_work())

    def provide_test_service(self) -> TestService:
        return TestService(
            lambda: self.provide_unit_of_work(),
            question_generator=self._question_generator,
            ocr_service=self._ocr_service,
        )

    def provide_file_service(self) -> FileService:
        return FileService(
            lambda: self.provide_unit_of_work(),
            storage=self._file_storage,
        )

    def provide_material_service(self) -> MaterialService:
        return MaterialService(
            lambda: self.provide_unit_of_work(),
            storage=self._materials_storage,
            text_extractor=extract_text_from_file,
            mime_detector=self._detect_mime,
        )

    @staticmethod
    def _detect_mime(path: Path) -> Optional[str]:
        if not magic:
            return None
        try:
            return magic.from_file(str(path), mime=True)
        except Exception:
            return None


@lru_cache()
def get_container() -> AppContainer:
    return AppContainer(settings=get_settings())


def configure_logging(level: str) -> None:
    numeric_level = getattr(logging, level.upper(), logging.INFO)
    logging.basicConfig(level=numeric_level)


def create_app(settings_override: Optional[Settings] = None) -> FastAPI:
    current_settings = settings_override or get_settings()
    configure_logging(current_settings.LOG_LEVEL)

    logger = logging.getLogger(__name__)

    app = FastAPI(
        title="Quiz Generator API",
        version="0.1.0",
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=current_settings.BACKEND_CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    container = AppContainer(settings=current_settings) if settings_override else get_container()
    app.state.container = container
    app.state.settings = current_settings

    @app.on_event("startup")
    def on_startup() -> None:
        if current_settings.AUTO_CREATE_TABLES:
            logger.info("Auto-creating tables (AUTO_CREATE_TABLES=True)")
            init_db(create_tables=True)
        else:
            logger.info("Skipping auto table creation (AUTO_CREATE_TABLES=False)")

    @app.get("/ping")
    def pong():
        return {"msg": "pong"}

    app.include_router(auth.router, prefix="/auth", tags=["auth"])
    app.include_router(users.router, prefix="/users", tags=["users"])
    app.include_router(files.router, prefix="/files", tags=["files"])
    app.include_router(tests.router, prefix="/tests", tags=["tests"])
    app.include_router(materials.router)

    return app

