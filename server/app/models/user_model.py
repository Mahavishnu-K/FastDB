# server/app/models/user.py
from sqlalchemy import Column, String
from sqlalchemy.dialects.postgresql import UUID
import uuid

from app.db.base import Base

def generate_uuid_hex():
    return uuid.uuid4().hex

class User(Base):
    __tablename__ = "fastdb_users"

    user_id = Column(String(32), primary_key=True, default=generate_uuid_hex)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    api_key = Column(String(255), unique=True, index=True, nullable=False)