# app/schemas/collaboration_schema.py
from pydantic import BaseModel, EmailStr
from app.models.database_collab_model import DBRole

class DatabaseMemberBase(BaseModel):
    email: EmailStr
    role: DBRole = DBRole.editor

class DatabaseMemberCreate(DatabaseMemberBase):
    pass

class DatabaseMemberUpdate(BaseModel):
    role: DBRole

class DatabaseMemberRead(BaseModel):
    user_id: str
    name: str
    email: EmailStr
    role: DBRole

    class Config:
        from_attributes = True