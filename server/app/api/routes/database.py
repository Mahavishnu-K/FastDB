# app/api/routes/database.py
from fastapi import APIRouter, Depends
from typing import List
from app.db.engine import connection_manager

router = APIRouter()

@router.get("/", response_model=List[str], tags=["Database Management"])
async def list_databases():
    known_databases = list(connection_manager._engines.keys())
    return known_databases