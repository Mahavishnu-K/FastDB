# server/app/api/routes/database.py
from fastapi import APIRouter, Depends, HTTPException
from typing import List
from sqlalchemy import text

# We use the main app engine to run this query.
from app.db.session import main_app_engine

router = APIRouter()

@router.get("/", response_model=List[str], tags=["Database Management"])
async def list_all_databases():
    """
    Connects to the PostgreSQL server and queries the pg_database catalog
    to get a live, accurate list of all user-created databases.
    """
    # This SQL query asks PostgreSQL for all non-template databases.
    # It also excludes the default 'postgres' database for a cleaner list.
    query = text("""
        SELECT datname FROM pg_database
        WHERE datistemplate = false AND datname != 'postgres';
    """)
    
    try:
        # We use the default engine to run this special query.
        with main_app_engine.connect() as connection:
            result = connection.execute(query)
            # The result is a list of tuples, so we extract the first element of each tuple.
            db_names = [row[0] for row in result.fetchall()]
        return db_names
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to query database list from PostgreSQL server: {e}"
        )