# app/services/collaboration_service.py
from sqlalchemy.orm import Session
from typing import List

from app.models.user_model import User
from app.models.virtual_database_model import VirtualDatabase
from app.models.database_collab_model import DatabaseMember, DBRole
from app.services import user_service

def add_member_to_db(db: Session, *, inviter: User, virtual_db: VirtualDatabase, invitee_email: str, role: DBRole) -> DatabaseMember:
    """Adds a user as a member to a virtual database."""
    # Authorization: Only the owner can invite others.
    if virtual_db.user_id != inviter.user_id:
        raise PermissionError("Only the database owner can invite members.")

    invitee = user_service.get_user_by_email(db, email=invitee_email)
    if not invitee:
        raise ValueError(f"User with email '{invitee_email}' not found.")
    
    if invitee.user_id == inviter.user_id:
        raise ValueError("Cannot invite the database owner.")

    # Check if already a member
    existing_member = db.query(DatabaseMember).filter_by(user_id=invitee.user_id, database_id=virtual_db.id).first()
    if existing_member:
        raise ValueError(f"User '{invitee_email}' is already a member of this database.")

    new_member = DatabaseMember(
        user_id=invitee.user_id,
        database_id=virtual_db.id,
        role=role
    )
    db.add(new_member)
    db.commit()
    db.refresh(new_member)
    return new_member

def get_database_members(db: Session, *, virtual_db: VirtualDatabase) -> List[DatabaseMember]:
    """Lists all members of a virtual database."""
    return db.query(DatabaseMember).filter_by(database_id=virtual_db.id).all()