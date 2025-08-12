# server/app/schemas/virtual_database_schema.py
from pydantic import BaseModel, Field
from datetime import datetime
from app.models.database_collab_model import DBRole
import uuid

class VirtualDatabaseBase(BaseModel):
    virtual_name: str = Field(..., min_length=3, max_length=50, pattern=r"^[a-zA-Z0-9_]+$")

class VirtualDatabaseCreate(VirtualDatabaseBase):
    pass

class VirtualDatabaseRead(VirtualDatabaseBase):
    id: uuid.UUID
    physical_name: str
    created_at: datetime
    current_user_role: DBRole | None = None

    class Config:
        from_attributes = True