from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from app.schemas.history_schema import QueryHistory, SavedQuery, SavedQueryCreate
from app.services import history_service
from app.db.session import get_db_session

router = APIRouter()

@router.get("/", response_model=List[QueryHistory], tags=["History"])
def read_query_history(db: Session = Depends(get_db_session)):
    return history_service.get_query_history(db)

@router.get("/saved-queries", response_model=List[SavedQuery], tags=["History"])
def read_saved_queries(db: Session = Depends(get_db_session)):
    return history_service.get_saved_queries(db)

@router.post("/saved-queries", response_model=SavedQuery, tags=["History"])
def create_saved_query(
    query: SavedQueryCreate,
    db: Session = Depends(get_db_session)
):
    return history_service.save_query(db, query)