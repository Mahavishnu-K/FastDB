# app/db/engine.py
from sqlalchemy import create_engine
from sqlalchemy.engine import Engine
from app.core.config import settings

# --- Engine 1: For the main application's metadata (users, virtual_dbs, etc.) ---
MAIN_APP_DB_URL = (
    f"postgresql+psycopg2://{settings.POSTGRES_USER}:{settings.POSTGRES_PASSWORD}@"
    f"{settings.POSTGRES_SERVER}:{settings.POSTGRES_PORT}/{settings.POSTGRES_DB}"
)
main_app_engine = create_engine(MAIN_APP_DB_URL, pool_pre_ping=True)

# --- Engine 2: For administrative tasks (CREATE/DROP DATABASE) ---
# Connects to the 'postgres' maintenance DB with a privileged user.
SUPERUSER_DB_URL = (
    f"postgresql+psycopg2://{settings.POSTGRES_SUPERUSER}:{settings.POSTGRES_SUPERUSER_PASSWORD}@"
    f"{settings.POSTGRES_SERVER}:{settings.POSTGRES_PORT}/{settings.POSTGRES_MAINTENANCE_DB}"
)
superuser_engine = create_engine(SUPERUSER_DB_URL, pool_pre_ping=True)

# We will keep a cache of engines for user databases to avoid creating new pools constantly.
_user_db_engines: dict[str, Engine] = {}

def get_engine_for_user_db(physical_db_name: str) -> Engine:
    """
    Engine 3: For connecting to a specific user's physical database.
    This function creates and caches engines on-demand.
    """
    if physical_db_name not in _user_db_engines:
        print(f"Creating and caching new engine for user database: '{physical_db_name}'")
        user_db_url = (
            f"postgresql+psycopg2://{settings.POSTGRES_USER}:{settings.POSTGRES_PASSWORD}@"
            f"{settings.POSTGRES_SERVER}:{settings.POSTGRES_PORT}/{physical_db_name}"
        )
        _user_db_engines[physical_db_name] = create_engine(user_db_url, pool_pre_ping=True)
    
    return _user_db_engines[physical_db_name]