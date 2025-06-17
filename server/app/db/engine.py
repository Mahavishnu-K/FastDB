# app/db/engine.py
from sqlalchemy import create_engine
from sqlalchemy.engine import Engine
from typing import Dict

from app.core.config import settings


class ConnectionManager:
    """
    Manages and caches SQLAlchemy engines for multiple databases.
    This prevents creating new connection pools for every request.
    """
    def __init__(self):
        self._engines: Dict[str, Engine] = {}
        
        # Load the connection components from environment variables
        self.db_user = settings.POSTGRES_USER
        self.db_password = settings.POSTGRES_PASSWORD
        self.db_host = settings.POSTGRES_SERVER
        self.db_port = settings.POSTGRES_PORT
        self.default_db_name = settings.POSTGRES_DB

        # Basic validation
        if not all([self.db_user, self.db_password, self.db_host, self.db_port, self.default_db_name]):
            raise ValueError("One or more database environment variables are not set.")

    def _create_db_url(self, db_name: str) -> str:
        """Constructs a database URL for a given database name."""
        return f"postgresql+psycopg2://{self.db_user}:{self.db_password}@{self.db_host}:{self.db_port}/{db_name}"

    def get_engine(self, db_name: str | None = None) -> Engine:
        """
        Retrieves a cached engine for the given db_name.
        If db_name is None, it returns the engine for the default database.
        If an engine for the target database doesn't exist, it creates and caches it.
        """
        # If no specific database is requested, use the default one from .env
        target_db = db_name if db_name else self.default_db_name
        
        if target_db not in self._engines:
            print(f"ConnectionManager: Creating and caching new engine for database: '{target_db}'")
            db_url = self._create_db_url(target_db)
            
            # Create the new engine with the same pool settings you had before
            new_engine = create_engine(
                db_url,
                pool_pre_ping=True,    # Checks for "stale" connections before use
                pool_recycle=3600,     # Recycles connections after 1 hour
                echo=True # Uncomment for debugging
            )
            self._engines[target_db] = new_engine
            
        return self._engines[target_db]

# Create a single, global instance of the manager.
# Your application will import and use this one instance everywhere.
connection_manager = ConnectionManager()