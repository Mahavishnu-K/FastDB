# app/api/routes/users.py
from fastapi import APIRouter, Depends
from app.schemas.user import UserRead
from app.models.user_model import User
from app.core.security import get_current_user_from_session

router = APIRouter()

@router.get("/me", response_model=UserRead, tags=["Users"])
def read_users_me(
    current_user: User = Depends(get_current_user_from_session)
):
    """
    Get the profile information for the currently logged-in user.
    This endpoint requires a JWT access token for authentication.
    """
    return current_user