from sqlalchemy.orm import Session
from app.models import QueryHistory, SavedQuery
from app.schemas.history_schema import SavedQueryCreate

def get_query_history(db: Session, limit: int = 50):
    return db.query(QueryHistory).order_by(QueryHistory.executed_at.desc()).limit(limit).all()

def log_query_history(db: Session, command: str, sql: str, status: str):
    query_type = sql.strip().split()[0].upper()
    db_history = QueryHistory(
        command_text=command,
        generated_sql=sql,
        status=status,
        query_type=query_type
    )
    db.add(db_history)
    db.commit()
    db.refresh(db_history)
    return db_history

def get_saved_queries(db: Session):
    return db.query(SavedQuery).order_by(SavedQuery.name).all()

def save_query(db: Session, query: SavedQueryCreate):
    db_query = SavedQuery(name=query.name, query=query.query)
    db.add(db_query)
    db.commit()
    db.refresh(db_query)
    return db_query