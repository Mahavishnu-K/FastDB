# app/core/authorization.py
from sqlalchemy.orm import Session
from app.models.user_model import User
from app.models.virtual_database_model import VirtualDatabase
from app.models.database_collab_model import DatabaseMember, DBRole

def get_user_role_for_db(db: Session, *, user: User, virtual_db: VirtualDatabase) -> DBRole | None:
    """
    Determines the role of a user for a specific virtual database.
    Returns the DBRole enum, or None if they have no access.
    """
    # Case 1: The user is the owner.
    if virtual_db.user_id == user.user_id:
        return DBRole.owner

    # Case 2: The user is a collaborator.
    member_record = db.query(DatabaseMember).filter_by(
        user_id=user.user_id,
        database_id=virtual_db.id
    ).first()

    if member_record:
        return member_record.role

    # Case 3: The user has no access.
    return None

def user_has_at_least_role(user_role: DBRole | None, required_role: DBRole) -> bool:
    """
    Checks if a user's role meets or exceeds the required role.
    Owner > Editor > Viewer
    """
    if not user_role:
        return False
    
    # Define the hierarchy of roles
    role_hierarchy = {
        DBRole.viewer: 1,
        DBRole.editor: 2,
        DBRole.owner: 3
    }
    
    return role_hierarchy.get(user_role, 0) >= role_hierarchy.get(required_role, 0)