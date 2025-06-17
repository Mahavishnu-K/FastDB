from fastapi import Depends, Header, HTTPException
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.engine import Engine, Connection
from sqlalchemy import text
from typing import Generator, Optional

from app.db.engine import connection_manager

# --- This part for internal DB session is still correct ---
main_app_engine = connection_manager.get_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=main_app_engine)

def get_db_session() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_engine(
    x_target_database: Optional[str] = Header(None, alias="X-Target-Database")
) -> Engine:
    # Debug output
    print(f"Header value received in get_engine: {x_target_database}")
    
    try:
        engine = connection_manager.get_engine(x_target_database)
        print(f"Engine URL: {engine.url}")
        with engine.connect() as conn:
            db_name = conn.execute(text("SELECT current_database()")).scalar()
            print(f"Successfully connected to database: {db_name}")

        return engine
    except Exception as e:
        error_msg = f"Connection failed for database '{x_target_database or 'default'}': {str(e)}"
        print(error_msg)
        raise HTTPException(status_code=503, detail=error_msg)

# --- START: THE CANONICAL, CORRECTED DEPENDENCY ---
def get_db_connection(
    engine: Engine = Depends(get_engine)
) -> Generator[Connection, None, None]:
    """
    Provides a single database connection from the correct engine's pool.
    The endpoint using this is responsible for managing the transaction.
    """
    with engine.connect() as connection:
        yield connection