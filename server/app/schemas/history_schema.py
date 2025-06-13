from pydantic import BaseModel
from datetime import datetime
from typing import List

# Schema for creating a new saved query
class SavedQueryCreate(BaseModel):
    name: str
    query: str

# Schema for reading a saved query from the DB
class SavedQuery(BaseModel):
    id: int
    name: str
    query: str
    created_at: datetime

    class Config:
        orm_mode = True # This tells Pydantic to read data from ORM models

# Schema for reading a history entry from the DB
class QueryHistory(BaseModel):
    id: int
    command_text: str | None = None
    generated_sql: str
    executed_at: datetime
    status: str
    query_type: str

    class Config:
        orm_mode = True