# app/models/database_collab_model.py
from sqlalchemy import Column, String, ForeignKey, Enum
from sqlalchemy.orm import relationship
from app.db.base import Base
import enum

# Define the roles as an Enum for data integrity
class DBRole(enum.Enum):
    owner = "owner"
    editor = "editor"
    viewer = "viewer"

class DatabaseMember(Base):
    __tablename__ = "fastdb_database_members"

    # We don't need a separate ID, a composite primary key is perfect here
    user_id = Column(String(32), ForeignKey("fastdb_users.user_id"), primary_key=True)
    database_id = Column(String(32), ForeignKey("fastdb_virtual_databases.id"), primary_key=True)
    
    role = Column(Enum(DBRole), nullable=False, default=DBRole.editor)

    # Relationships to easily access the user and database objects
    user = relationship("User")
    database = relationship("VirtualDatabase")