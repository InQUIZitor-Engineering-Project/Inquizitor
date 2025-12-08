from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm

from app.api.dependencies import get_auth_service
from app.api.schemas.auth import Token, RegistrationRequested, VerificationResponse
from app.api.schemas.users import UserCreate
from app.application.services import AuthService
from app.application.services.auth_service import normalize_frontend_base_url

router = APIRouter()


@router.post("/register", response_model=RegistrationRequested, status_code=status.HTTP_202_ACCEPTED)
def register(
    user_in: UserCreate,
    auth_service: AuthService = Depends(get_auth_service),
):
    try:
        auth_service.register_user(user_in)
        return RegistrationRequested()
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc


@router.post("/login", response_model=Token)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    auth_service: AuthService = Depends(get_auth_service),
):
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
    redirect: bool = False,
    auth_service: AuthService = Depends(get_auth_service),
):
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


__all__ = ["router"]

