from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordRequestForm

from app.api.dependencies import get_auth_service, get_turnstile_service
from app.api.schemas.auth import (
    PasswordResetConfirm,
    PasswordResetRequest,
    RegistrationRequested,
    Token,
    VerificationResponse,
)
from app.api.schemas.users import UserCreate
from app.application.services import AuthService, TurnstileService
from app.application.services.auth_service import normalize_frontend_base_url
from app.core.limiter import limiter

router = APIRouter()


@router.post(
    "/register",
    response_model=RegistrationRequested,
    status_code=status.HTTP_202_ACCEPTED,
)
@limiter.limit("10/minute")
async def register(
    request: Request,
    user_in: UserCreate,
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    turnstile_service: Annotated[TurnstileService, Depends(get_turnstile_service)],
) -> RegistrationRequested:
    if not await turnstile_service.verify_token(user_in.turnstile_token):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Błąd weryfikacji Turnstile. Spróbuj ponownie.",
        )

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
async def login(
    request: Request,
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    turnstile_service: Annotated[TurnstileService, Depends(get_turnstile_service)],
) -> Token:
    form = await request.form()
    token_value = form.get("cf-turnstile-response") or form.get("turnstile_token")
    turnstile_token = str(token_value) if token_value else None

    if not await turnstile_service.verify_token(turnstile_token):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Błąd weryfikacji Turnstile. Spróbuj ponownie.",
        )

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
                    )
        return VerificationResponse(
            access_token=token_obj.access_token,
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

