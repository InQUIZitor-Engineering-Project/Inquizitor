from typing import List

from fastapi import APIRouter, Depends, HTTPException, Response, status

from app.api.dependencies import get_test_service
from app.api.schemas.tests import TestOut
from app.api.schemas.users import UserRead
from app.application.services import TestService
from app.core.security import get_current_user
from app.db.models import User

router = APIRouter()


@router.get("/me", response_model=UserRead)
def read_profile(current_user: User = Depends(get_current_user)):
    """Return data for the currently authenticated user."""
    return current_user


@router.get("/me/tests", response_model=List[TestOut])
def list_my_tests(
    current_user: User = Depends(get_current_user),
    test_service: TestService = Depends(get_test_service),
):
    """Return tests owned by the currently authenticated user."""
    return test_service.list_tests_for_user(owner_id=current_user.id)


@router.delete("/me/tests/{test_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_my_test(
    test_id: int,
    current_user: User = Depends(get_current_user),
    test_service: TestService = Depends(get_test_service),
):
    """Delete a test by ID if it belongs to the current user."""
    try:
        test_service.delete_test(owner_id=current_user.id, test_id=test_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return Response(status_code=status.HTTP_204_NO_CONTENT)


__all__ = ["router"]

