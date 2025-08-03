# server/app/models/virtual_database_model.py
from sqlalchemy import Column, String, ForeignKey, DateTime, func
from sqlalchemy.orm import relationship
import uuid

from app.db.base import Base

def generate_uuid_hex():
    return uuid.uuid4().hex

class VirtualDatabase(Base):
    __tablename__ = "fastdb_virtual_databases"

    id = Column(String(32), primary_key=True, default=generate_uuid_hex)
    user_id = Column(String(32), ForeignKey("fastdb_users.user_id"), nullable=False, index=True)
    
    virtual_name = Column(String(255), nullable=False)
    # The actual, unique name of the database in PostgreSQL
    physical_name = Column(String(255), unique=True, nullable=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # This creates a relationship so you can easily access the user from a db object
    owner = relationship("User")