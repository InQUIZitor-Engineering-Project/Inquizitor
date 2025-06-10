# app/routers/auth.py
from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlmodel import select
from sqlalchemy.orm import Session

from app.db.models import User
from app.db.session import get_session
from app.schemas.user import UserCreate, UserRead, Token
from app.core.security import (
    get_password_hash,
    verify_password,
    create_access_token,
)
from app.core.config import settings

router = APIRouter()


@router.post("/register", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def register(user_in: UserCreate, db: Session = Depends(get_session)):
    stmt = select(User).where(User.email == user_in.email)
    existing = db.exec(stmt).first()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    hashed_pw = get_password_hash(user_in.password)
    user = User(
        email=user_in.email, 
        hashed_password=hashed_pw,
        first_name=user_in.first_name,
        last_name=user_in.last_name
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_session)):
    stmt = select(User).where(User.email == form_data.username)
    user = db.exec(stmt).first()

    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email},
        expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}
