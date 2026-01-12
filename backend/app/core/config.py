from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
        env_ignore_empty=True,
    )
    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    GEMINI_API_KEY: str
    CELERY_BROKER_URL: str = "redis://redis:6379/0"
    CELERY_RESULT_BACKEND: str = "redis://redis:6379/1"
    CELERY_TASK_DEFAULT_QUEUE: str = "default"
    STORAGE_BACKEND: str = "r2"  # options: "r2", "local"
    R2_ACCESS_KEY_ID: str | None = None
    R2_SECRET_ACCESS_KEY: str | None = None
    R2_BUCKET: str | None = None
    R2_ENDPOINT_URL: str | None = None
    R2_REGION: str = "auto"
    R2_PUBLIC_BASE_URL: str | None = None
    R2_PRESIGN_EXPIRATION: int = 3600
    RESEND_API_KEY: str | None = None
    EMAIL_FROM: str | None = None
    FRONTEND_BASE_URL: str | None = None
    EMAIL_VERIFICATION_EXP_MIN: int = 60
    GUNICORN_WORKERS: int = 4
    GUNICORN_TIMEOUT: int = 90
    BACKEND_CORS_ORIGINS: list[str] = Field(
        default_factory=lambda: [
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "http://www.localhost:5173",
            "https://inquizitor.pl",
            "https://www.inquizitor.pl",
            "https://inquizitor.pages.dev",
        ]
    )
    LOG_LEVEL: str = "INFO"
    AUTO_CREATE_TABLES: bool = False
    SQL_ECHO: bool = True


@lru_cache
def get_settings() -> Settings:
    return Settings()
