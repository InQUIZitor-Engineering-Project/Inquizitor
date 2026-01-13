import logging
from collections.abc import Callable
from functools import lru_cache
from pathlib import Path
from typing import Any, cast

import magic
from fastapi import FastAPI, Request, status
from fastapi.exceptions import HTTPException as FastAPIHTTPException
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from sqladmin import Admin

from app.api.admin import setup_admin_views
from app.api.routers import (
    auth,
    files,
    jobs,
    materials,
    notifications,
    support,
    tests,
    users,
)
from app.application.services import (
    AuthService,
    FileService,
    JobService,
    MaterialService,
    NotificationService,
    SupportService,
    TestService,
    TurnstileService,
    UserService,
)
from app.application.unit_of_work import SqlAlchemyUnitOfWork
from app.core.config import Settings, get_settings
from app.core.limiter import limiter
from app.core.monitoring import init_sentry
from app.db.session import get_engine, get_session_factory, init_db
from app.domain.services import FileStorage
from app.infrastructure import (
    DefaultOCRService,
    GeminiQuestionGenerator,
    LocalFileStorage,
    R2FileStorage,
    ResendEmailSender,
    SqlModelFileRepository,
    SqlModelJobRepository,
    SqlModelMaterialRepository,
    SqlModelTestRepository,
    SqlModelUserRepository,
)
from app.infrastructure.extractors.extract_composite import composite_text_extractor
from app.middleware import LoggingMiddleware
from app.middleware.sentry import SentryUserContextMiddleware


class AppContainer:
    """Minimal container for application-wide dependency injection."""

    def __init__(self, settings: Settings):
        self._settings = settings
        self._question_generator = GeminiQuestionGenerator()
        self._ocr_service = DefaultOCRService()
        self._turnstile_service = TurnstileService(
            secret_key=settings.TURNSTILE_SECRET_KEY
        )
        self._file_storage = self._create_storage(base_dir=Path("uploads"))
        self._materials_storage = self._create_storage(
            base_dir=Path("uploads/materials")
        )
        self._exports_storage = self._create_storage(base_dir=Path("uploads/exports"))
        self._session_factory = get_session_factory(settings)
        self._email_sender = self._create_email_sender()

    @property
    def settings(self) -> Settings:
        return self._settings

    def provide_limiter(self) -> Limiter:
        return limiter

    def provide_db_session(self) -> Callable[..., Any]:
        from app.db.session import get_session

        return get_session

    def provide_question_generator(self) -> GeminiQuestionGenerator:
        return self._question_generator

    def provide_ocr_service(self) -> DefaultOCRService:
        return self._ocr_service

    def provide_turnstile_service(self) -> TurnstileService:
        return self._turnstile_service

    def provide_file_storage(self) -> FileStorage:
        return self._file_storage

    def provide_export_storage(self) -> FileStorage:
        return self._exports_storage

    def provide_user_repository(self, session: Any) -> SqlModelUserRepository:
        return SqlModelUserRepository(session)

    def provide_test_repository(self, session: Any) -> SqlModelTestRepository:
        return SqlModelTestRepository(session)

    def provide_file_repository(self, session: Any) -> SqlModelFileRepository:
        return SqlModelFileRepository(session)

    def provide_material_repository(self, session: Any) -> SqlModelMaterialRepository:
        return SqlModelMaterialRepository(session)

    def provide_job_repository(self, session: Any) -> SqlModelJobRepository:
        return SqlModelJobRepository(session)

    def provide_unit_of_work(self) -> SqlAlchemyUnitOfWork:
        return SqlAlchemyUnitOfWork(self._session_factory)

    def provide_auth_service(self) -> AuthService:
        return AuthService(lambda: self.provide_unit_of_work())

    def provide_test_service(self) -> TestService:
        return TestService(
            lambda: self.provide_unit_of_work(),
            question_generator=self._question_generator,
            ocr_service=self._ocr_service,
            storage=self._file_storage,
        )

    def provide_file_service(self) -> FileService:
        return FileService(
            lambda: self.provide_unit_of_work(),
            storage=self._file_storage,
        )

    def provide_user_service(self) -> UserService:
        return UserService(lambda: self.provide_unit_of_work())

    def provide_job_service(self) -> JobService:
        return JobService(lambda: self.provide_unit_of_work())

    def provide_notification_service(self) -> NotificationService:
        return NotificationService(lambda: self.provide_unit_of_work())

    def provide_support_service(self) -> SupportService:
        return SupportService(lambda: self.provide_unit_of_work())

    def provide_material_service(self) -> MaterialService:
        return MaterialService(
            lambda: self.provide_unit_of_work(),
            storage=self._materials_storage,
            text_extractor=composite_text_extractor,
            mime_detector=self._detect_mime,
        )

    def provide_email_sender(self) -> ResendEmailSender:
        return self._email_sender

    def _create_storage(self, base_dir: Path | str) -> LocalFileStorage | R2FileStorage:
        backend = (self._settings.STORAGE_BACKEND or "local").lower()
        if backend == "r2":
            missing = [
                name
                for name, value in [
                    ("R2_ACCESS_KEY_ID", self._settings.R2_ACCESS_KEY_ID),
                    ("R2_SECRET_ACCESS_KEY", self._settings.R2_SECRET_ACCESS_KEY),
                    ("R2_BUCKET", self._settings.R2_BUCKET),
                    ("R2_ENDPOINT_URL", self._settings.R2_ENDPOINT_URL),
                ]
                if not value
            ]
            if missing:
                raise ValueError(
                    f"R2 storage selected but missing settings: {', '.join(missing)}"
                )
            return R2FileStorage(
                bucket=self._settings.R2_BUCKET,  # type: ignore[arg-type]
                access_key_id=self._settings.R2_ACCESS_KEY_ID,  # type: ignore[arg-type]
                secret_access_key=self._settings.R2_SECRET_ACCESS_KEY,  # type: ignore[arg-type]
                endpoint_url=self._settings.R2_ENDPOINT_URL,  # type: ignore[arg-type]
                region=self._settings.R2_REGION,
                base_prefix=str(base_dir).strip("/"),
                public_base_url=self._settings.R2_PUBLIC_BASE_URL,
                presign_expiration=self._settings.R2_PRESIGN_EXPIRATION,
            )
        return LocalFileStorage(base_dir=base_dir)

    def _create_email_sender(self) -> ResendEmailSender:
        if not self._settings.RESEND_API_KEY or not self._settings.EMAIL_FROM:
            raise ValueError(
                "RESEND_API_KEY and EMAIL_FROM must be configured for email sending"
            )

        # Use specific branding logo from assets domain
        logo_url = "https://assets.inquizitor.pl/branding/logo_full.png"

        return ResendEmailSender(
            api_key=self._settings.RESEND_API_KEY,
            sender=self._settings.EMAIL_FROM,
            frontend_url=self._settings.FRONTEND_BASE_URL or "http://localhost:5173",
            logo_url=logo_url,
        )

    @staticmethod
    def _detect_mime(path: Path) -> str | None:
        if not magic:
            return None
        try:
            return cast(str | None, magic.from_file(str(path), mime=True))
        except Exception:
            return None


@lru_cache
def get_container() -> AppContainer:
    return AppContainer(settings=get_settings())


def configure_logging(level: str, sql_echo: bool = False) -> None:
    """Konfiguruje logowanie z formatowaniem dla lepszej czytelności."""
    numeric_level = getattr(logging, level.upper(), logging.INFO)

    # Format logów z timestampem, poziomem, modułem i wiadomością
    log_format = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    date_format = "%Y-%m-%d %H:%M:%S"

    logging.basicConfig(
        level=numeric_level,
        format=log_format,
        datefmt=date_format,
        force=True,  # Nadpisz istniejącą konfigurację
    )

    # Ustaw poziom dla uvicorn access logs (żeby nie spamowały,
    # bo mamy własne logowanie)
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)

    # SQLAlchemy - pokazuj query tylko jeśli SQL_ECHO jest True
    sqlalchemy_level = logging.INFO if sql_echo else logging.WARNING
    logging.getLogger("sqlalchemy.engine").setLevel(sqlalchemy_level)


def create_app(settings_override: Settings | None = None) -> FastAPI:
    current_settings = settings_override or get_settings()

    init_sentry()

    configure_logging(current_settings.LOG_LEVEL, sql_echo=current_settings.SQL_ECHO)

    logger = logging.getLogger(__name__)

    app = FastAPI(
        title="Quiz Generator API",
        version="0.1.0",
    )

    # Dodaj middleware do logowania requestów (przed CORS,
    # żeby logować wszystkie requesty)
    app.add_middleware(LoggingMiddleware)
    app.add_middleware(SentryUserContextMiddleware)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=current_settings.BACKEND_CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Global exception handler dla wszystkich nieobsłużonych błędów
    @app.exception_handler(Exception)
    async def global_exception_handler(
        request: Request, exc: Exception
    ) -> JSONResponse:
        """Loguje wszystkie nieobsłużone błędy z pełnym stack trace."""
        logger.error(
            "Unhandled exception: %s",
            exc,
            exc_info=True,
            extra={
                "path": request.url.path,
                "method": request.method,
                "exception_type": type(exc).__name__,
            },
        )

        # Dla błędów HTTP zwróć odpowiedni status code
        if isinstance(exc, FastAPIHTTPException):
            return JSONResponse(
                status_code=exc.status_code,
                content={"detail": exc.detail},
            )

        # Dla innych błędów zwróć 500
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "detail": "Internal server error",
                "error_type": type(exc).__name__,
                "error_message": str(exc),
            },
        )

    # Handler dla błędów walidacji requestów
    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(
        request: Request, exc: RequestValidationError
    ) -> JSONResponse:
        """Loguje błędy walidacji."""
        logger.warning(
            "Validation error: %s - Path: %s",
            exc.errors(),
            request.url.path,
            extra={
                "path": request.url.path,
                "method": request.method,
                "validation_errors": exc.errors(),
            },
        )
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={"detail": exc.errors()},
        )

    container = (
        AppContainer(settings=current_settings)
        if settings_override
        else get_container()
    )
    app.state.container = container
    app.state.settings = current_settings
    app.state.limiter = container.provide_limiter()
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
    app.add_middleware(SlowAPIMiddleware)

    @app.on_event("startup")
    def on_startup() -> None:
        if current_settings.AUTO_CREATE_TABLES:
            logger.info("Auto-creating tables (AUTO_CREATE_TABLES=True)")
            init_db(create_tables=True)
        else:
            logger.info("Skipping auto table creation (AUTO_CREATE_TABLES=False)")

    @app.get("/ping")
    def pong() -> dict[str, str]:
        return {"msg": "pong"}

    app.include_router(auth.router, prefix="/auth", tags=["auth"])
    app.include_router(users.router, prefix="/users", tags=["users"])
    app.include_router(files.router, prefix="/files", tags=["files"])
    app.include_router(tests.router, prefix="/tests", tags=["tests"])
    app.include_router(
        notifications.router, prefix="/notifications", tags=["notifications"]
    )
    app.include_router(support.router, prefix="/support", tags=["support"])
    app.include_router(materials.router)
    app.include_router(jobs.router)

    # Initialize SQLAdmin
    engine = get_engine(current_settings)
    admin = Admin(app, engine, base_url="/admin")
    setup_admin_views(admin)

    return app
