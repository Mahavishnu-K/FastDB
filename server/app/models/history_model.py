from sqlalchemy import Column, Integer, String, DateTime, Text
from sqlalchemy.sql import func
from app.db.base import Base

class QueryHistory(Base):
    __tablename__ = 'fastdb_query_history' # Use a prefix to avoid name clashes

    id = Column(Integer, primary_key=True, index=True)
    command_text = Column(String(1000), nullable=True) # The original NL command
    generated_sql = Column(Text, nullable=False)
    executed_at = Column(DateTime(timezone=True), server_default=func.now())
    status = Column(String(50), nullable=False) # e.g., 'success', 'error'
    query_type = Column(String(50), nullable=False) # e.g., 'SELECT', 'CREATE'