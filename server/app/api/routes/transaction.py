# server/app/api/routes/transaction.py
from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.engine import Engine
from app.core import transaction_manager
from app.db.session import get_engine 

router = APIRouter()

@router.post("/begin", status_code=201, tags=["Transaction"])
def begin_new_transaction(
    x_target_database: str = Header(..., alias="X-Target-Database")
):
    """Starts a new transaction and returns its unique ID."""
    engine = get_engine(x_target_database)
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