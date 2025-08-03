from fastapi import HTTPException, status, Depends, Request
from jose import JWTError, jwt
from datetime import datetime, timedelta, timezone
from app.schemas.user import TokenData

from sqlalchemy.orm import Session
from app.db.session import get_db_session
from app.services.user_service import get_user_by_api_key
from app.services import user_service

from .config import settings

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.JWTSECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def _decode_jwt_and_get_user(token: str, db: Session):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials (invalid JWT)",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.JWTSECRET_KEY, algorithms=[settings.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
        token_data = TokenData(email=email)
    except JWTError:
        raise credentials_exception
    
    user = user_service.get_user_by_email(db, email=token_data.email)
    if user is None:
        raise credentials_exception
    return user


async def get_current_user(
    request: Request,
    db: Session = Depends(get_db_session)
):
    """
    A single security dependency that validates a user from either a JWT or an API Key.
    """
    auth_header = request.headers.get("Authorization")
    if not auth_header:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authorization header is missing")

    try:
        scheme, _, token = auth_header.partition(' ')
        if scheme.lower() != 'bearer':
            raise ValueError()
    except ValueError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid Authorization header format. Use 'Bearer <token>'.")

    # --- The Core Logic: Try JWT first, then API Key ---
    try:
        # Call our new internal helper function.
        user = _decode_jwt_and_get_user(token=token, db=db)
        print("DEBUG: Authenticated user via JWT.")
        return user
    except HTTPException as jwt_exc:
        # If it's not a valid JWT, it might be an API Key.
        user = get_user_by_api_key(db, api_key=token)
        if not user:
            # If it's not a valid API key either, then authentication fails.
            raise jwt_exc
        
        print("DEBUG: Authenticated user via API Key.")
        return user