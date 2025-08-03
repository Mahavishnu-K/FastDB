from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey
from sqlalchemy.sql import func
from app.db.base import Base

class SavedQuery(Base):
    __tablename__ = 'fastdb_saved_queries'

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String(32), ForeignKey("fastdb_users.user_id"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    query = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())