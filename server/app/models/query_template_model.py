# app/models/query_template_model.py
from sqlalchemy import Column, String, Text, JSON
from app.db.base import Base

class QueryTemplate(Base):
    __tablename__ = "fastdb_query_templates"

    # A hash of the user_id + normalized_prompt_template
    id = Column(String(64), primary_key=True)
    user_id = Column(String(32), index=True, nullable=False)
    normalized_prompt = Column(Text, nullable=False)
    sql_template = Column(Text, nullable=False)
    original_param_map = Column(JSON, nullable=False)