# server/app/api/routes/auth.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.schemas.user import UserCreate, UserRead, Token, UserLogin 
from app.services.user_service import get_user_by_email, create_user
from app.core.security import create_access_token
from app.utils.hashing import verify_password

from app.db.session import get_db_session

auth_router = APIRouter()

@auth_router.post("/signup", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def signup_new_user(
    *,
    db: Session = Depends(get_db_session),
    user_in: UserCreate,
):
    """
    Create new user.
    """
    user = get_user_by_email(db, email=user_in.email)
    if user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists.",
        )
    new_user = create_user(db, user=user_in)
    return new_user

@auth_router.post("/login", response_model=Token)
def login_for_access_token(
    *,
    db: Session = Depends(get_db_session),
    user_in: UserLogin
):
    user = get_user_by_email(db, email=user_in.email)
    if not user or not verify_password(user_in.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}