# app/api/routes/collaboration.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.db.session import get_db_session
from app.models.user_model import User
from app.core.security import get_current_user
from app.schemas.collaboration_schema import DatabaseMemberCreate, DatabaseMemberRead
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
    virtual_db = vdb_service.get_accessible_database(db, owner=current_user, virtual_name=virtual_db_name)
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