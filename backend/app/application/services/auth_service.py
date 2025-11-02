"""Service responsible for user authentication and registration."""

from __future__ import annotations

from datetime import datetime, timedelta
from typing import Callable

from app.api.schemas.auth import Token
from app.api.schemas.users import UserCreate, UserRead
from app.application import dto
from app.application.interfaces import UnitOfWork
from app.core.config import get_settings
from app.core.security import (
    create_access_token,
    get_password_hash,
    verify_password,
)
from app.domain.models import User


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

    def register_user(self, payload: UserCreate) -> UserRead:
        """Creates a new user if the e-mail does not yet exist."""

        with self._uow_factory() as uow:
            existing = uow.users.get_by_email(payload.email)
            if existing:
                raise ValueError("Email already registered")

            hashed_password = self._password_hasher(payload.password)
            user = User(
                id=None,
                email=payload.email,
                hashed_password=hashed_password,
                first_name=payload.first_name,
                last_name=payload.last_name,
                created_at=datetime.utcnow(),
            )

            created_user = uow.users.add(user)

        return dto.to_user_read(created_user)

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


__all__ = ["AuthService"]

