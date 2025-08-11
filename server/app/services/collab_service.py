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

def update_member_role(
    db: Session,
    *,
    updater: User,
    virtual_db: VirtualDatabase,
    member_user_id: str,
    new_role: DBRole
) -> DatabaseMember:
    """Updates the role of an existing member in a database."""
    # Authorization Check 1: Only the owner can change roles.
    if virtual_db.user_id != updater.user_id:
        raise PermissionError("Only the database owner can change member roles.")

    # Authorization Check 2: The owner cannot change their own role via this method.
    if member_user_id == updater.user_id:
        raise ValueError("The owner's role cannot be changed.")

    # Find the specific membership record to update.
    member_record = db.query(DatabaseMember).filter_by(
        database_id=virtual_db.id,
        user_id=member_user_id
    ).first()

    if not member_record:
        raise ValueError("Member not found in this database.")

    # Update the role, commit, and refresh.
    member_record.role = new_role
    db.commit()
    db.refresh(member_record)
    return member_record

def remove_member_from_db(
    db: Session,
    *,
    revoker: User,
    virtual_db: VirtualDatabase,
    member_user_id: str
):
    """Removes a collaborator's access to a database."""
    # Authorization Check 1: Only the owner can remove members.
    if virtual_db.user_id != revoker.user_id:
        raise PermissionError("Only the database owner can remove members.")

    # Authorization Check 2: The owner cannot remove themselves.
    if member_user_id == revoker.user_id:
        raise ValueError("The owner cannot be removed from their own database.")

    # Find the specific membership record to delete.
    member_record = db.query(DatabaseMember).filter_by(
        database_id=virtual_db.id,
        user_id=member_user_id
    ).first()

    if not member_record:
        raise ValueError("Member not found in this database.")

    # Delete the record and commit the change.
    db.delete(member_record)
    db.commit()
    return 

def get_database_members(db: Session, *, virtual_db: VirtualDatabase) -> List[DatabaseMember]:
    """Lists all members of a virtual database."""
    return db.query(DatabaseMember).filter_by(database_id=virtual_db.id).all()