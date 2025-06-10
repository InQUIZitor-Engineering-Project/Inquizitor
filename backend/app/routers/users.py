# app/routers/users.py

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlmodel import select
from typing import List

from app.db.models import User, Test
from app.db.session import get_session
from app.schemas.user import UserRead
from app.schemas.test import TestOut 
from app.core.security import get_current_user

router = APIRouter()


@router.get("/me", response_model=UserRead)
def read_profile(current_user: User = Depends(get_current_user)):
    """
    Zwraca dane aktualnie zalogowanego użytkownika.
    """
    return current_user


@router.get("/me/tests", response_model=List[TestOut])
def list_my_tests(
    db: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """
    Zwraca listę testów należących do aktualnie zalogowanego użytkownika.
    """
    stmt = select(Test).where(Test.owner_id == current_user.id)
    tests = db.exec(stmt).all()
    return tests


@router.delete("/me/tests/{test_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_my_test(
    test_id: int,
    db: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """
    Usuwa test o zadanym ID, jeśli należy do aktualnego użytkownika.
    """
    test = db.get(Test, test_id)
    if not test or test.owner_id != current_user.id:
        raise HTTPException(status_code=404, detail="Test not found")
    db.delete(test)
    db.commit()
    return None
