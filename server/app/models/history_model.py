from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey  
from sqlalchemy.sql import func
from app.db.base import Base

class QueryHistory(Base):
    __tablename__ = 'fastdb_query_history' 

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String(32), ForeignKey("fastdb_users.user_id"), nullable=False, index=True)
    virtual_database_id = Column(String(32), ForeignKey("fastdb_virtual_databases.id", ondelete="CASCADE"), nullable=False, index=True)
    command_text = Column(String(1000), nullable=True) 
    generated_sql = Column(Text, nullable=False)
    executed_at = Column(DateTime(timezone=True), server_default=func.now())
    status = Column(String(50), nullable=False) 
    query_type = Column(String(50), nullable=False)