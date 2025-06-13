# Import Iterator for correct type hinting of generator dependencies
from typing import Iterator

from sqlalchemy.engine import Connection, Engine
from sqlalchemy.orm import sessionmaker, Session
from .engine import get_engine

# Keep the connection dependency for raw SQL
def get_db_connection() -> Iterator[Connection]:
    """
    FastAPI dependency that provides a raw SQLAlchemy Connection.
    This is best for executing raw SQL with SQLAlchemy Core.
    """
    engine = get_engine()
    with engine.connect() as connection:
        yield connection

# Add a session dependency for ORM operations
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=get_engine())

def get_db_session() -> Iterator[Session]:
    """
    FastAPI dependency that provides a SQLAlchemy ORM Session.
    This is best for CRUD operations on your internal application models
    (like QueryHistory and SavedQuery).
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()