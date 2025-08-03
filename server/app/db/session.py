# app/db/session.py
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.engine import Engine
from typing import Generator

from app.db.engine import main_app_engine, superuser_engine

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=main_app_engine)

def get_db_session() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- Engine Provider for Admin Tasks ---
def get_superuser_engine() -> Engine:
    """
    Provides the special engine for administrative tasks like CREATE DATABASE.
    This engine is connected to the 'postgres' maintenance database as a privileged user.
    """
    return superuser_engine