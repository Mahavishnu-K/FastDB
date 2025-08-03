# server/app/schemas/virtual_database_schema.py
from pydantic import BaseModel, Field
from datetime import datetime
import uuid

class VirtualDatabaseBase(BaseModel):
    virtual_name: str = Field(..., min_length=3, max_length=50, pattern=r"^[a-zA-Z0-9_]+$")

class VirtualDatabaseCreate(VirtualDatabaseBase):
    pass

class VirtualDatabaseRead(VirtualDatabaseBase):
    id: uuid.UUID
    physical_name: str
    created_at: datetime

    class Config:
        from_attributes = True