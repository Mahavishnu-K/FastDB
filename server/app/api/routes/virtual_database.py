# server/app/api/routes/virtual_database.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.db.session import get_db_session
from app.models.user_model import User
from app.core.security import get_current_user
from app.schemas.virtual_database_schema import VirtualDatabaseCreate, VirtualDatabaseRead
from app.services import virtual_database_service as vdb_service
from app.services.virtual_database_service import get_all_dbs_for_user

router = APIRouter()

@router.post(
    "/", 
    response_model=VirtualDatabaseRead, 
    status_code=status.HTTP_201_CREATED,
    tags=["Database Management"]
)
def create_user_database(
    *,
    db: Session = Depends(get_db_session),
    db_in: VirtualDatabaseCreate,
    current_user: User = Depends(get_current_user)
):
    """
    Create a new virtual database for the authenticated user.
    """
    existing_db = vdb_service.get_db_by_virtual_name(db, owner=current_user, virtual_name=db_in.virtual_name)
    if existing_db:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A database with this name already exists for your account."
        )
    
    try:
        new_db = vdb_service.create_virtual_database(db, owner=current_user, db_in=db_in)
        return new_db
    except Exception as e:
        # Catch potential database creation errors
        raise HTTPException(status_code=500, detail=f"Failed to create database: {str(e)}")

@router.get("/", response_model=List[VirtualDatabaseRead], tags=["Database Management"])
def list_user_databases(
    db: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user)
):
    """Lists all virtual databases owned by the current user."""
    return get_all_dbs_for_user(db, owner=current_user)