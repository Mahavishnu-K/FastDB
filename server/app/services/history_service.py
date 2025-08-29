# app/services/history_service.py
from sqlalchemy.orm import Session
from app.models.history_model import QueryHistory
from app.models.saved_query_model import SavedQuery
from app.models.user_model import User
from app.schemas.history_schema import SavedQueryCreate

def get_query_history(db: Session, *, owner: User, limit: int = 50):
    """Gets the query history ONLY for the specified owner."""
    return db.query(QueryHistory).filter(QueryHistory.user_id == owner.user_id).order_by(QueryHistory.executed_at.desc()).limit(limit).all()

def log_query_history(db: Session, *, owner: User, command: str, sql: str, status: str):
    """Logs a query history entry for the specified owner."""

    existing_entry = db.query(QueryHistory).filter(
        QueryHistory.user_id == owner.user_id,
        QueryHistory.generated_sql == sql
    ).first()

    # 2. If it exists, delete it.
    if existing_entry:
        print(f"DEBUG: Found and deleting duplicate history entry for user {owner.user_id}")
        db.delete(existing_entry)
        # We flush here to make sure the delete is part of the session's work
        # before we add the new item.
        db.flush() 

    query_type = sql.strip().split()[0].upper()
    db_history = QueryHistory(
        user_id=owner.user_id, 
        command_text=command,
        generated_sql=sql,
        status=status,
        query_type=query_type
    )
    db.add(db_history)
    db.commit()
    db.refresh(db_history)
    return db_history

def get_saved_queries(db: Session, *, owner: User):
    """Gets the saved queries ONLY for the specified owner."""
    return db.query(SavedQuery).filter(SavedQuery.user_id == owner.user_id).order_by(SavedQuery.name).all()

def save_query(db: Session, *, owner: User, query: SavedQueryCreate):
    """Saves a query for the specified owner."""
    db_query = SavedQuery(
        user_id=owner.user_id, 
        name=query.name, 
        query=query.query
    )
    db.add(db_query)
    db.commit()
    db.refresh(db_query)
    return db_query

def delete_saved_query(db: Session, *, owner: User, query_id: int):
    """
    Deletes a saved query by its ID, ensuring it belongs to the owner.
    """
    db_query = db.query(SavedQuery).filter(SavedQuery.id == query_id).first()

    if not db_query or db_query.user_id != owner.user_id:
        raise ValueError("Saved query not found.")

    db.delete(db_query)
    db.commit()
    return 