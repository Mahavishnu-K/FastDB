# server/app/api/routes/transaction.py
from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.engine import Engine
from app.core import transaction_manager
from sqlalchemy.orm import Session
from app.core.security import get_current_user
from app.models.user_model import User
from app.db.session import get_db_session
from app.db.engine import get_engine_for_user_db
from app.services import virtual_database_service as vdb_service

router = APIRouter()

@router.post("/begin", status_code=201, tags=["Transaction"])
def begin_new_transaction(
    x_target_database: str = Header(..., alias="X-Target-Database"),
    db_session: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user)
):
    """Securely starts a new transaction and returns its unique ID."""
    virtual_db = vdb_service.get_accessible_database(db_session, user=current_user, virtual_name=x_target_database)
    if not virtual_db:
        raise HTTPException(status_code=404, detail=f"Database '{x_target_database}' not found.")
    
    engine = get_engine_for_user_db(virtual_db.physical_name)

    connection = engine.connect() # Get a fresh connection from the pool
    tx_id = transaction_manager.begin_transaction(connection)
    return {"transaction_id": tx_id}

@router.post("/commit", tags=["Transaction"])
def commit_existing_transaction(
    x_transaction_id: str = Header(..., alias="X-Transaction-ID")
):
    """Commits an active transaction."""
    if not transaction_manager.get_transaction_connection(x_transaction_id):
        raise HTTPException(status_code=404, detail="Transaction not found or already closed.")
    transaction_manager.end_transaction(x_transaction_id, commit=True)
    return {"message": "Transaction committed."}

@router.post("/rollback", tags=["Transaction"])
def rollback_existing_transaction(
    x_transaction_id: str = Header(..., alias="X-Transaction-ID")
):
    """Rolls back an active transaction."""
    if not transaction_manager.get_transaction_connection(x_transaction_id):
        raise HTTPException(status_code=404, detail="Transaction not found or already closed.")
    transaction_manager.end_transaction(x_transaction_id, commit=False)
    return {"message": "Transaction rolled back."}