"""Service responsible for user authentication and registration."""

from __future__ import annotations

from datetime import datetime, timedelta
from typing import Callable
from urllib.parse import urlparse, urlunparse
import secrets
import hashlib

from app.api.schemas.auth import Token
from app.api.schemas.users import UserCreate
from app.application.interfaces import UnitOfWork
from app.core.config import get_settings
from app.core.security import (
    create_access_token,
    get_password_hash,
    verify_password,
)
from app.domain.models import User
from app.domain.models import PendingVerification


def normalize_frontend_base_url(url: str | None) -> str:
    """
    Ensure FRONTEND_BASE_URL includes scheme and 'www.' prefix.
    """
    cleaned = (url or "").strip()
    if not cleaned:
        return ""
    if "://" not in cleaned:
        cleaned = f"https://{cleaned}"
    parsed = urlparse(cleaned)
    netloc = parsed.netloc
    if netloc and not netloc.startswith("www."):
        netloc = f"www.{netloc}"
    parsed = parsed._replace(netloc=netloc)
    return urlunparse(parsed)


class AuthService:
    def __init__(
        self,
        uow_factory: Callable[[], UnitOfWork],
        *,
        password_hasher: Callable[[str], str] = get_password_hash,
        password_verifier: Callable[[str, str], bool] = verify_password,
        token_issuer: Callable[..., str] = create_access_token,
    ) -> None:
        self._uow_factory = uow_factory
        self._password_hasher = password_hasher
        self._password_verifier = password_verifier
        self._token_issuer = token_issuer

    def register_user(self, payload: UserCreate) -> None:
        """Creates pending verification and enqueues verification email."""

        with self._uow_factory() as uow:
            existing = uow.users.get_by_email(payload.email)
            if existing:
                raise ValueError("Email already registered")

            hashed_password = self._password_hasher(payload.password)
            settings = get_settings()
            if not settings.FRONTEND_BASE_URL:
                raise ValueError("FRONTEND_BASE_URL is not configured")
            expires_minutes = settings.EMAIL_VERIFICATION_EXP_MIN
            frontend_base = normalize_frontend_base_url(settings.FRONTEND_BASE_URL)
            if not frontend_base:
                raise ValueError("FRONTEND_BASE_URL is not configured")

            raw_token = secrets.token_urlsafe(32)
            token_hash = hashlib.sha256(raw_token.encode()).hexdigest()
            expires_at = datetime.utcnow() + timedelta(minutes=expires_minutes)

            pending = User(
                id=None,
                email=payload.email,
                hashed_password=hashed_password,
                first_name=payload.first_name,
                last_name=payload.last_name,
                created_at=datetime.utcnow(),
            )

            pending_entry = PendingVerification(
                id=None,
                email=pending.email,
                hashed_password=hashed_password,
                first_name=pending.first_name,
                last_name=pending.last_name,
                token_hash=token_hash,
                expires_at=expires_at,
                created_at=datetime.utcnow(),
            )
            uow.pending_verifications.upsert(pending_entry)

        from app.tasks.email import send_verification_email_task  # local import to avoid cycles

        verify_url = f"{frontend_base.rstrip('/')}/verify-email?token={raw_token}"
        send_verification_email_task.delay(
            to_email=pending.email,
            verify_url=verify_url,
            expires_minutes=expires_minutes,
        )

    def authenticate_user(self, *, email: str, password: str) -> User:
        """Validates credentials and returns the domain user."""

        with self._uow_factory() as uow:
            user = uow.users.get_by_email(email)
            if not user or not self._password_verifier(password, user.hashed_password):
                raise ValueError("Incorrect email or password")
            return user

    def issue_token(self, user: User) -> Token:
        """Generates an access token for the given user."""

        settings = get_settings()
        expires_delta = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        token = self._token_issuer(
            data={"sub": user.email},
            expires_delta=expires_delta,
        )
        return Token(access_token=token, token_type="bearer")

    def verify_and_create_user(self, *, token: str) -> Token:
        settings = get_settings()
        token_hash = hashlib.sha256(token.encode()).hexdigest()
        with self._uow_factory() as uow:
            pending = uow.pending_verifications.get_by_token_hash(token_hash)
            if not pending:
                raise ValueError("Invalid or expired token")
            if pending.expires_at < datetime.utcnow():
                uow.pending_verifications.delete_by_email(pending.email)
                raise ValueError("Token expired")
            if uow.users.get_by_email(pending.email):
                uow.pending_verifications.delete_by_email(pending.email)
                raise ValueError("Email already registered")

            user = User(
                id=None,
                email=pending.email,
                hashed_password=pending.hashed_password,
                first_name=pending.first_name,
                last_name=pending.last_name,
                created_at=datetime.utcnow(),
            )
            created = uow.users.add(user)
            uow.pending_verifications.delete_by_email(pending.email)

        expires_delta = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        token_str = self._token_issuer(
            data={"sub": created.email},
            expires_delta=expires_delta,
        )
        return Token(access_token=token_str, token_type="bearer")


__all__ = ["AuthService"]

