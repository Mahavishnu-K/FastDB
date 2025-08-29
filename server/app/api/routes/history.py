# app/api/routes/history.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.security import get_current_user
from app.models.user_model import User

from app.schemas.history_schema import QueryHistory, SavedQuery, SavedQueryCreate
from app.services import history_service
from app.db.session import get_db_session

router = APIRouter()

@router.get("/", response_model=List[QueryHistory], tags=["History"])
def read_query_history(
    db: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user) 
):
    """Gets the query history for the currently authenticated user."""
    return history_service.get_query_history(db, owner=current_user)

@router.get("/saved-queries", response_model=List[SavedQuery], tags=["History"])
def read_saved_queries(
    db: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user) 
):
    """Gets the saved queries for the currently authenticated user."""
    return history_service.get_saved_queries(db, owner=current_user)

@router.post("/saved-queries", response_model=SavedQuery, tags=["History"])
def create_saved_query(
    query: SavedQueryCreate,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user) 
):
    """Saves a query for the currently authenticated user."""
    return history_service.save_query(db, owner=current_user, query=query)

@router.delete("/saved-queries/{query_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["History"])
def delete_user_saved_query(
    query_id: int,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user)
):
    """Deletes a saved query for the currently authenticated user."""
    try:
        history_service.delete_saved_query(db, owner=current_user, query_id=query_id)
        return
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))