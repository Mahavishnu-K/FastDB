from sqlalchemy import create_engine
from sqlalchemy.engine import Engine
from app.core.config import settings


engine: Engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True, # Checks for "stale" connections before use
    pool_recycle=3600,  # Recycles connections after 1 hour
    # echo=True # Uncomment for debugging to see all generated SQL
)

def get_engine() -> Engine:
    """Dependency to get the engine instance."""
    return engine