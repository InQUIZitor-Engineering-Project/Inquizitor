"""Service responsible for user authentication and registration."""

from __future__ import annotations

import hashlib
import secrets
from collections.abc import Callable
from datetime import datetime, timedelta
from urllib.parse import urlparse, urlunparse

from app.api.schemas.auth import Token
from app.api.schemas.users import UserCreate
from app.application.interfaces import UnitOfWork
from app.core.config import get_settings
from app.core.security import (
    create_access_token,
    get_password_hash,
    verify_password,
)
from app.domain.models import (
    PasswordResetToken,
    PendingVerification,
    RefreshToken,
    User,
)


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
    
    # Don't add 'www.' to localhost or if it's already there
    if netloc and not netloc.startswith("www.") and "localhost" not in netloc:
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
                raise ValueError("Email jest już zarejestrowany")

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

        from app.tasks.email import (
            send_verification_email_task,  # local import to avoid cycles
        )

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
            if not user:
                # Check if account is awaiting verification
                pending = uow.pending_verifications.get_by_email(email)
                if pending:
                    raise ValueError(
                        "Konto nie zostało jeszcze aktywowane. "
                        "Sprawdź swoją skrzynkę e-mail."
                    )
                raise ValueError("Niepoprawny e-mail lub hasło")

            if not self._password_verifier(password, user.hashed_password):
                raise ValueError("Niepoprawny e-mail lub hasło")
            return user

    def _create_refresh_token(self, user_id: int, uow: UnitOfWork) -> str:
        settings = get_settings()
        raw_token = secrets.token_urlsafe(32)
        token_hash = hashlib.sha256(raw_token.encode()).hexdigest()
        expires_at = datetime.utcnow() + timedelta(
            days=settings.REFRESH_TOKEN_EXPIRE_DAYS
        )

        refresh_token = RefreshToken(
            id=None,
            user_id=user_id,
            token_hash=token_hash,
            expires_at=expires_at,
            created_at=datetime.utcnow(),
        )
        uow.refresh_tokens.add(refresh_token)
        return raw_token

    def issue_token(self, user: User) -> Token:
        """Generates access and refresh tokens for the given user."""

        settings = get_settings()
        expires_delta = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        
        with self._uow_factory() as uow:
            # Generate Access Token
            access_token = self._token_issuer(
                data={"sub": user.email},
                expires_delta=expires_delta,
            )
            
            # Generate Refresh Token
            if user.id is None:
                raise ValueError("Cannot issue tokens for unsaved user")
            refresh_token_str = self._create_refresh_token(user.id, uow)

        return Token(
            access_token=access_token,
            refresh_token=refresh_token_str,
            token_type="bearer"
        )

    def refresh_access_token(self, refresh_token: str) -> Token:
        """Validates refresh token and issues a new pair of tokens."""
        token_hash = hashlib.sha256(refresh_token.encode()).hexdigest()
        
        with self._uow_factory() as uow:
            stored_token = uow.refresh_tokens.get_by_token_hash(token_hash)
            
            if not stored_token or not stored_token.is_valid:
                raise ValueError("Invalid or expired refresh token")

            user = uow.users.get(stored_token.user_id)
            if not user:
                raise ValueError("User not found")

            # Revoke the used refresh token (Rotation)
            stored_token.revoke()
            uow.refresh_tokens.update(stored_token)  # Update state

            # Create new tokens
            settings = get_settings()
            expires_delta = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
            new_access_token = self._token_issuer(
                data={"sub": user.email},
                expires_delta=expires_delta,
            )
            if user.id is None:
                raise ValueError("User ID missing during refresh")
            new_refresh_token_str = self._create_refresh_token(user.id, uow)

        return Token(
            access_token=new_access_token,
            refresh_token=new_refresh_token_str,
            token_type="bearer"
        )

    def verify_and_create_user(self, *, token: str) -> Token:
        settings = get_settings()
        token_hash = hashlib.sha256(token.encode()).hexdigest()
        with self._uow_factory() as uow:
            pending = uow.pending_verifications.get_by_token_hash(token_hash)
            if not pending:
                raise ValueError("Nieprawidłowy lub wygasły token")
            if pending.expires_at < datetime.utcnow():
                uow.pending_verifications.delete_by_email(pending.email)
                raise ValueError("Token wygasł")
            if uow.users.get_by_email(pending.email):
                uow.pending_verifications.delete_by_email(pending.email)
                raise ValueError("Email jest już zarejestrowany")

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
            
            # Create tokens for the new user
            expires_delta = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
            access_token = self._token_issuer(
                data={"sub": created.email},
                expires_delta=expires_delta,
            )
            if created.id is None:
                raise ValueError("User ID missing after creation")
            refresh_token_str = self._create_refresh_token(created.id, uow)

        return Token(
            access_token=access_token,
            refresh_token=refresh_token_str,
            token_type="bearer"
        )

    def request_password_reset(self, email: str) -> None:
        """Generates a password reset token and enqueues the email."""
        with self._uow_factory() as uow:
            user = uow.users.get_by_email(email)
            if not user:
                # Security: don't reveal if user exists, just return
                return

            settings = get_settings()
            expires_minutes = 15  # Password reset tokens expire quickly
            frontend_base = normalize_frontend_base_url(settings.FRONTEND_BASE_URL)
            if not frontend_base:
                raise ValueError("FRONTEND_BASE_URL is not configured")

            raw_token = secrets.token_urlsafe(32)
            token_hash = hashlib.sha256(raw_token.encode()).hexdigest()
            expires_at = datetime.utcnow() + timedelta(minutes=expires_minutes)

            reset_token = PasswordResetToken(
                id=None,
                email=email,
                token_hash=token_hash,
                expires_at=expires_at,
                created_at=datetime.utcnow(),
            )
            uow.password_reset_tokens.upsert(reset_token)

        from app.tasks.email import send_password_reset_email_task  # local import

        reset_url = f"{frontend_base.rstrip('/')}/reset-password?token={raw_token}"
        send_password_reset_email_task.delay(
            to_email=email,
            reset_url=reset_url,
            expires_minutes=expires_minutes,
        )

    def reset_password(self, *, token: str, new_password: str) -> None:
        """Validates the reset token and updates the user's password."""
        token_hash = hashlib.sha256(token.encode()).hexdigest()
        with self._uow_factory() as uow:
            reset_token = uow.password_reset_tokens.get_by_token_hash(token_hash)
            if not reset_token:
                raise ValueError("Nieprawidłowy lub wygasły token")

            if reset_token.expires_at < datetime.utcnow():
                uow.password_reset_tokens.delete_by_email(reset_token.email)
                raise ValueError("Token wygasł")

            user = uow.users.get_by_email(reset_token.email)
            if not user:
                uow.password_reset_tokens.delete_by_email(reset_token.email)
                raise ValueError("Użytkownik nie został znaleziony")

            hashed_password = self._password_hasher(new_password)
            user.hashed_password = hashed_password
            uow.users.update(user)
            uow.password_reset_tokens.delete_by_email(reset_token.email)
            
            # Optionally revoke all refresh tokens for security
            if user.id is not None:
                uow.refresh_tokens.revoke_all_for_user(user.id)


__all__ = ["AuthService"]
