import logging
import secrets
from typing import Annotated
from urllib.parse import urlencode

import httpx
from fastapi import APIRouter, Body, Cookie, Depends, HTTPException, Request, status
from fastapi.responses import RedirectResponse
from fastapi.security import OAuth2PasswordRequestForm
from itsdangerous import BadSignature, SignatureExpired, URLSafeTimedSerializer
from pydantic import BaseModel

from app.api.dependencies import get_auth_service
from app.api.schemas.auth import (
    PasswordResetConfirm,
    PasswordResetRequest,
    RegistrationRequested,
    Token,
    VerificationResponse,
)
from app.api.schemas.users import UserCreate
from app.application.services import AuthService
from app.application.services.auth_service import normalize_frontend_base_url
from app.core.config import get_settings
from app.core.limiter import limiter

router = APIRouter()

REFRESH_TOKEN_COOKIE = "refresh_token"


class RefreshTokenRequest(BaseModel):
    refresh_token: str | None = None


@router.post(
    "/register",
    response_model=RegistrationRequested,
    status_code=status.HTTP_202_ACCEPTED,
)
@limiter.limit("10/minute")
def register(
    request: Request,
    user_in: UserCreate,
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
) -> RegistrationRequested:
    try:
        auth_service.register_user(user_in)
        return RegistrationRequested()
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc


@router.post("/login", response_model=Token)
@limiter.limit("5/minute")
def login(
    request: Request,
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
) -> Token:
    try:
        user = auth_service.authenticate_user(
            email=form_data.username,
            password=form_data.password,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(exc),
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc

    return auth_service.issue_token(user)


def _get_refresh_token_value(
    payload: RefreshTokenRequest,
    cookie_refresh_token: Annotated[str | None, Cookie(alias=REFRESH_TOKEN_COOKIE)] = None,
) -> str:
    """Prefer body for refresh token; fall back to cookie (e.g. after Google OAuth)."""
    if payload.refresh_token:
        return payload.refresh_token
    if cookie_refresh_token:
        return cookie_refresh_token
    raise ValueError("Missing refresh token (body or cookie)")


@router.post("/refresh", response_model=Token)
def refresh_token(
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    payload: Annotated[RefreshTokenRequest | None, Body()] = None,
    cookie_refresh_token: Annotated[
        str | None, Cookie(alias=REFRESH_TOKEN_COOKIE)
    ] = None,
) -> Token:
    try:
        refresh_value = _get_refresh_token_value(
            payload or RefreshTokenRequest(), cookie_refresh_token
        )
        token = auth_service.refresh_access_token(refresh_value)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not refresh token",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc
    return token


def _build_google_redirect_uri() -> str:
    settings = get_settings()
    base = (settings.BACKEND_BASE_URL or "").rstrip("/")
    if not base:
        raise ValueError("BACKEND_BASE_URL is not configured for Google OAuth")
    return f"{base}/auth/google/callback"


def _build_frontend_callback_url(access_token: str, token_type: str = "bearer") -> str:
    """Frontend URL with access_token in fragment (refresh_token is set in cookie)."""
    settings = get_settings()
    frontend_base = normalize_frontend_base_url(settings.FRONTEND_BASE_URL)
    if not frontend_base:
        raise ValueError("FRONTEND_BASE_URL is not configured")
    backend_base = (settings.BACKEND_BASE_URL or "").rstrip("/")
    frontend_normalized = frontend_base.rstrip("/")
    if backend_base and frontend_normalized == backend_base:
        raise ValueError(
            "FRONTEND_BASE_URL nie może być taki sam jak BACKEND_BASE_URL (powoduje pętlę przekierowań). "
            "Ustaw FRONTEND_BASE_URL na adres aplikacji React (np. http://localhost:5173)."
        )
    fragment = f"access_token={access_token}&token_type={token_type}"
    return f"{frontend_normalized}/auth/callback#{fragment}"


def _refresh_cookie_parts(refresh_token_value: str) -> list[str]:
    settings = get_settings()
    max_age = settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 3600
    parts = [f"{REFRESH_TOKEN_COOKIE}={refresh_token_value}", "Path=/", f"Max-Age={max_age}", "SameSite=Lax", "HttpOnly"]
    if settings.COOKIE_DOMAIN:
        parts.append(f"Domain={settings.COOKIE_DOMAIN}")
    return parts


GOOGLE_METADATA_URL = "https://accounts.google.com/.well-known/openid-configuration"
_cached_google_metadata: dict | None = None
_OAUTH_STATE_MAX_AGE = 300  # 5 minutes


def _create_oauth_state() -> str:
    """Create a signed, self-contained state token (no session/cookie needed)."""
    s = URLSafeTimedSerializer(get_settings().SECRET_KEY)
    return s.dumps(secrets.token_urlsafe(16))


def _verify_oauth_state(state: str) -> bool:
    """Verify the signed state token. Returns True if valid and not expired."""
    s = URLSafeTimedSerializer(get_settings().SECRET_KEY)
    try:
        s.loads(state, max_age=_OAUTH_STATE_MAX_AGE)
        return True
    except (BadSignature, SignatureExpired):
        return False


async def _get_google_metadata() -> dict:
    global _cached_google_metadata
    if _cached_google_metadata is not None:
        return _cached_google_metadata
    async with httpx.AsyncClient() as client:
        resp = await client.get(GOOGLE_METADATA_URL)
        resp.raise_for_status()
        _cached_google_metadata = resp.json()
        return _cached_google_metadata


@router.get("/google/authorize")
async def google_authorize(request: Request) -> RedirectResponse:
    """Redirect to Google OAuth. State is a signed token — no session needed."""
    settings = get_settings()
    if not settings.GOOGLE_CLIENT_ID or not settings.GOOGLE_CLIENT_SECRET:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Google login is not configured",
        )

    metadata = await _get_google_metadata()
    params = urlencode({
        "client_id": settings.GOOGLE_CLIENT_ID,
        "redirect_uri": _build_google_redirect_uri(),
        "response_type": "code",
        "scope": "openid email profile",
        "state": _create_oauth_state(),
    })
    return RedirectResponse(f"{metadata['authorization_endpoint']}?{params}")


@router.get("/google/callback")
async def google_callback(
    request: Request,
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
) -> RedirectResponse:
    """Exchange code for tokens, get or create user, redirect to frontend."""
    code = request.query_params.get("code")
    state = request.query_params.get("state")

    if not code:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing code parameter",
        )
    if not state or not _verify_oauth_state(state):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired OAuth state",
        )

    settings = get_settings()
    metadata = await _get_google_metadata()

    try:
        async with httpx.AsyncClient() as client:
            # Exchange authorization code for tokens
            token_resp = await client.post(
                metadata["token_endpoint"],
                data={
                    "code": code,
                    "client_id": settings.GOOGLE_CLIENT_ID,
                    "client_secret": settings.GOOGLE_CLIENT_SECRET,
                    "redirect_uri": _build_google_redirect_uri(),
                    "grant_type": "authorization_code",
                },
            )
            if token_resp.status_code != 200:
                logging.error("Google token exchange failed: %s", token_resp.text)
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Google token exchange failed",
                )

            # Fetch user info from Google
            access_token = token_resp.json()["access_token"]
            userinfo_resp = await client.get(
                metadata["userinfo_endpoint"],
                headers={"Authorization": f"Bearer {access_token}"},
            )
            if userinfo_resp.status_code != 200:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Failed to get user info from Google",
                )
            userinfo = userinfo_resp.json()
    except httpx.HTTPError as exc:
        logging.exception("Google OAuth HTTP error")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Google authorization failed",
        ) from exc

    email = (userinfo.get("email") or "").strip().lower()
    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Google did not provide an email",
        )

    user = auth_service.get_or_create_user_from_google(
        email=email,
        first_name=userinfo.get("given_name") or None,
        last_name=userinfo.get("family_name") or None,
    )
    token_response = auth_service.issue_token(user)

    try:
        url = _build_frontend_callback_url(
            token_response.access_token,
            token_response.token_type,
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        ) from e

    response = RedirectResponse(url=url, status_code=status.HTTP_302_FOUND)
    cookie_parts = _refresh_cookie_parts(token_response.refresh_token)
    if url.startswith("https://"):
        cookie_parts.append("Secure")
    response.headers.append("Set-Cookie", "; ".join(cookie_parts))
    return response


@router.get("/verify-email", response_model=VerificationResponse)
def verify_email(
    token: str,
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    redirect: bool = False,
) -> VerificationResponse:
    try:
        token_obj = auth_service.verify_and_create_user(token=token)
        redirect_url = None
        if redirect:
            from app.core.config import get_settings

            settings = get_settings()
            if settings.FRONTEND_BASE_URL:
                base = normalize_frontend_base_url(settings.FRONTEND_BASE_URL)
                if base:
                    redirect_url = (
                        f"{base.rstrip('/')}/verify-email/success"
                        f"?token={token_obj.access_token}"
                        f"&refresh_token={token_obj.refresh_token}"
                    )
        return VerificationResponse(
            access_token=token_obj.access_token,
            refresh_token=token_obj.refresh_token,
            token_type=token_obj.token_type,
            redirect_url=redirect_url,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc


@router.post("/password-reset/request", status_code=status.HTTP_202_ACCEPTED)
@limiter.limit("3/minute")
def request_password_reset(
    request: Request,
    payload: PasswordResetRequest,
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
) -> dict[str, str]:
    auth_service.request_password_reset(payload.email)
    return {
        "message": (
            "Jeśli e-mail istnieje, "
            "link do resetowania hasła został wysłany."
        )
    }


@router.post("/password-reset/reset")
def reset_password(
    payload: PasswordResetConfirm,
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
) -> dict[str, str]:
    try:
        auth_service.reset_password(
            token=payload.token,
            new_password=payload.new_password,
        )
        return {"message": "Hasło zostało pomyślnie zresetowane."}
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc


__all__ = ["router"]
