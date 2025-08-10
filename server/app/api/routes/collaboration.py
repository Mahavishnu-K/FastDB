# app/api/routes/collaboration.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.db.session import get_db_session
from app.models.user_model import User
from app.core.security import get_current_user
from app.schemas.collaboration_schema import DatabaseMemberCreate, DatabaseMemberRead, DatabaseMemberUpdate
from app.services import virtual_database_service as vdb_service
from app.services import collab_service

router = APIRouter()

@router.post(
    "/{virtual_db_name}/members",
    response_model=DatabaseMemberRead,
    status_code=status.HTTP_201_CREATED,
    tags=["Collaboration"]
)
def invite_user_to_database(
    virtual_db_name: str,
    member_in: DatabaseMemberCreate,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user)
):
    """Invite a user to collaborate on a database. Only the owner can do this."""
    virtual_db = vdb_service.get_accessible_database(db, user=current_user, virtual_name=virtual_db_name)
    if not virtual_db:
        raise HTTPException(status_code=404, detail="Database not found.")
    
    try:
        new_member = collab_service.add_member_to_db(
            db,
            inviter=current_user,
            virtual_db=virtual_db,
            invitee_email=member_in.email,
            role=member_in.role
        )
        # We need to format the response to match DatabaseMemberRead
        return DatabaseMemberRead(
            user_id=new_member.user.user_id,
            name=new_member.user.name,
            email=new_member.user.email,
            role=new_member.role
        )
    except (PermissionError, ValueError) as e:
        raise HTTPException(status_code=400, detail=str(e))
    
@router.get(
    "/{virtual_db_name}/members",
    response_model=List[DatabaseMemberRead],
    tags=["Collaboration"]
)
def get_members_of_database(
    virtual_db_name: str,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user)
):
    """
    Get the list of all collaborators for a database.
    The current user must be the owner or a member to see the list.
    """
    # 1. Authorize: Check if the current user can even access this database.
    virtual_db = vdb_service.get_accessible_database(db, user=current_user, virtual_name=virtual_db_name)
    if not virtual_db:
        raise HTTPException(status_code=404, detail="Database not found or you do not have access.")

    # 2. Get the list of members from the service.
    members = collab_service.get_database_members(db, virtual_db=virtual_db)
    
    # 3. Format the response to match the DatabaseMemberRead schema.
    #    We also need to add the owner to this list for the UI.
    
    owner_info = DatabaseMemberRead(
        user_id=virtual_db.owner.user_id,
        name=virtual_db.owner.name,
        email=virtual_db.owner.email,
        role="owner" # The owner always has the 'owner' role
    )
    
    collaborators_info = [
        DatabaseMemberRead(
            user_id=member.user.user_id,
            name=member.user.name,
            email=member.user.email,
            role=member.role
        ) for member in members
    ]
    
    return [owner_info] + collaborators_info
    
@router.put(
    "/{virtual_db_name}/members/{member_user_id}",
    response_model=DatabaseMemberRead,
    tags=["Collaboration"]
)
def update_database_member(
    virtual_db_name: str,
    member_user_id: str,
    role_update: DatabaseMemberUpdate, # The request body with the new role
    db: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user)
):
    """Update a collaborator's role. Only the owner can do this."""
    # 1. Find the database to ensure the current user has access to it at all.
    virtual_db = vdb_service.get_accessible_database(db, user=current_user, virtual_name=virtual_db_name)
    if not virtual_db:
        raise HTTPException(status_code=404, detail="Database not found.")
    
    # 2. Call the service to perform the update and handle the business logic/authorization.
    try:
        updated_member = collab_service.update_member_role(
            db,
            updater=current_user,
            virtual_db=virtual_db,
            member_user_id=member_user_id,
            new_role=role_update.role
        )
        # Format the response to match the Read schema
        return DatabaseMemberRead(
            user_id=updated_member.user.user_id,
            name=updated_member.user.name,
            email=updated_member.user.email,
            role=updated_member.role
        )
    except PermissionError as e:
        # If the service raises a PermissionError, return a 403 Forbidden.
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
    except ValueError as e:
        # If the service raises a ValueError (e.g., member not found), return a 400 Bad Request.
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    
@router.delete(
    "/{virtual_db_name}/members/{member_user_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    tags=["Collaboration"]
)
def remove_database_member(
    virtual_db_name: str,
    member_user_id: str,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user)
):
    """
    Revoke a collaborator's access to a database. Only the owner can do this.
    """
    # 1. Find the database to ensure the current user has access to it.
    virtual_db = vdb_service.get_accessible_database(db, user=current_user, virtual_name=virtual_db_name)
    if not virtual_db:
        raise HTTPException(status_code=status.HTTP_404, detail="Database not found.")
    
    # 2. Call the service to perform the deletion and handle the business logic.
    try:
        collab_service.remove_member_from_db(
            db,
            revoker=current_user,
            virtual_db=virtual_db,
            member_user_id=member_user_id
        )
        # On success, a 204 No Content response is automatically sent.
        # No need to return anything here.
        return
    except PermissionError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))