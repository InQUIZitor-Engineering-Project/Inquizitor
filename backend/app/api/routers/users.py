from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Response, status

from app.api.dependencies import get_test_service, get_user_service
from app.api.schemas.tests import TestOut
from app.api.schemas.users import ChangePasswordRequest, UserRead, UserStatistics
from app.application.services import TestService, UserService
from app.core.security import get_current_user
from app.db.models import User

router = APIRouter()


@router.get("/me", response_model=UserRead)
def read_profile(current_user: Annotated[User, Depends(get_current_user)]) -> User:
    """Return data for the currently authenticated user."""
    return current_user


@router.get("/me/tests", response_model=list[TestOut])
def list_my_tests(
    current_user: Annotated[User, Depends(get_current_user)],
    test_service: Annotated[TestService, Depends(get_test_service)],
) -> list[TestOut]:
    """Return tests owned by the currently authenticated user."""
    if current_user.id is None:
        raise HTTPException(status_code=401, detail="User ID is missing")
    return test_service.list_tests_for_user(owner_id=current_user.id)


@router.delete("/me/tests/{test_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_my_test(
    test_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    test_service: Annotated[TestService, Depends(get_test_service)],
) -> Response:
    """Delete a test by ID if it belongs to the current user."""
    if current_user.id is None:
        raise HTTPException(status_code=401, detail="User ID is missing")
    try:
        test_service.delete_test(owner_id=current_user.id, test_id=test_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/me/statistics", response_model=UserStatistics)
def get_my_statistics(
    current_user: Annotated[User, Depends(get_current_user)],
    user_service: Annotated[UserService, Depends(get_user_service)],
) -> UserStatistics:
    if current_user.id is None:
        raise HTTPException(status_code=401, detail="User ID is missing")
    return user_service.get_user_statistics(user_id=current_user.id)


@router.post("/me/change-password", status_code=status.HTTP_200_OK)
def change_my_password(
    payload: ChangePasswordRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    user_service: Annotated[UserService, Depends(get_user_service)],
) -> dict[str, str]:
    if current_user.id is None:
        raise HTTPException(status_code=401, detail="User ID is missing")
    try:
        user_service.change_password(
            user_id=current_user.id,
            old_password=payload.old_password,
            new_password=payload.new_password,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)
        ) from exc

    return {"detail": "Hasło zostało pomyślnie zmienione."}

__all__ = ["router"]

