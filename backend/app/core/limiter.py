from fastapi import Request
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.core.config import get_settings


def get_real_user_key(request: Request) -> str:
    """
    Zwraca klucz limitowania:
    1. Token z nagłówka Authorization (jeśli istnieje) -> per User/Session
    2. Adres IP (jeśli brak tokena) -> per IP
    """
    if request.headers.get("Authorization"):
        return request.headers["Authorization"]
    return get_remote_address(request)


settings = get_settings()

limiter = Limiter(
    key_func=get_real_user_key,
    storage_uri=settings.CELERY_BROKER_URL,
    default_limits=["200/minute"],
)

