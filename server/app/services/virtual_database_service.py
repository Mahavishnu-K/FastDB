# server/app/services/virtual_database_service.py
from sqlalchemy.orm import Session
from sqlalchemy import text, or_
from typing import List

from app.models.virtual_database_model import VirtualDatabase
from app.models.user_model import User
from app.schemas.virtual_database_schema import VirtualDatabaseCreate
from app.db.session import get_superuser_engine
from app.utils.gen_physical_name import generate_physical_name
from app.models.database_collab_model import DatabaseMember

def get_accessible_database(db: Session, *, user: User, virtual_name: str) -> VirtualDatabase | None:
    """
    Finds a virtual database by name that a user has access to,
    either as the direct owner or as a collaborator.
    """
    return db.query(VirtualDatabase).filter(
        VirtualDatabase.virtual_name == virtual_name,
        or_(
            # Condition 1: The user is the direct owner of the database.
            VirtualDatabase.user_id == user.user_id,
            
            # Condition 2: The user is listed as a member in the collaboration table.
            VirtualDatabase.id.in_(
                db.query(DatabaseMember.database_id).filter(DatabaseMember.user_id == user.user_id)
            )
        )
    ).first()

def create_virtual_database(db: Session, *, owner: User, db_in: VirtualDatabaseCreate) -> VirtualDatabase:
    """The main function to create a virtual and physical database."""
    
    # 1. Generate the unique physical name
    physical_name = generate_physical_name(owner.user_id, db_in.virtual_name)
    
    # 2. Use the superuser engine to create the actual PostgreSQL database
    engine = get_superuser_engine()
    with engine.connect().execution_options(isolation_level="AUTOCOMMIT") as conn:
        # Use quotes to handle potential reserved keywords
        conn.execute(text(f'CREATE DATABASE "{physical_name}"'))
        
    # 3. Create the record in our metadata table
    db_obj = VirtualDatabase(
        user_id=owner.user_id,
        virtual_name=db_in.virtual_name,
        physical_name=physical_name
    )
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def delete_virtual_database(db: Session, *, db_to_drop: VirtualDatabase):
    """
    Deletes a physical database and its corresponding metadata record.
    """
    physical_name = db_to_drop.physical_name
    
    # 1. Use the superuser engine to drop the actual PostgreSQL database
    engine = get_superuser_engine()
    with engine.connect().execution_options(isolation_level="AUTOCOMMIT") as conn:
        # First, terminate any active connections to the database
        terminate_query = text(f"""
            SELECT pg_terminate_backend(pid) FROM pg_stat_activity
            WHERE datname = '{physical_name}' AND pid <> pg_backend_pid();
        """)
        conn.execute(terminate_query)
        
        # Now, drop the database
        conn.execute(text(f'DROP DATABASE "{physical_name}"'))
        
    # 2. Delete the record from our metadata table
    db.delete(db_to_drop)
    db.commit()
    return

def get_all_dbs_for_user(db: Session, *, user: User) -> List[VirtualDatabase]:
    owned_dbs = db.query(VirtualDatabase).filter(VirtualDatabase.user_id == user.user_id)
    
    # Query for DBs the user is a member of
    member_dbs = db.query(VirtualDatabase).join(DatabaseMember).filter(DatabaseMember.user_id == user.user_id)
    
    # Combine, remove duplicates, and return
    all_dbs = owned_dbs.union(member_dbs).all()
    return all_dbs

def get_collaborated_dbs_for_user(db: Session, *, user: User) -> List[VirtualDatabase]:
    """
    Returns a list of all virtual databases that the given user is a collaborator on
    (i.e., they are a member but not the direct owner).
    """
    return db.query(VirtualDatabase).join(DatabaseMember).filter(
        DatabaseMember.user_id == user.user_id,
        VirtualDatabase.user_id != user.user_id 
    ).all()

def get_owned_and_shared_dbs(db: Session, *, user: User) -> List[VirtualDatabase]:
    """
    Returns a list of all virtual databases that the given user owns
    AND has shared with at least one other collaborator.
    """
    return db.query(VirtualDatabase).join(DatabaseMember).filter(
        # Condition 1: The user must be the owner of the database
        VirtualDatabase.user_id == user.user_id
    ).distinct().all()

def rename_virtual_database(db: Session, *, owner: User, old_virtual_name: str, new_virtual_name: str) -> VirtualDatabase:
    """
    Renames a user's virtual database. This involves renaming the physical
    database and updating the metadata record.
    """
    db_to_rename = get_accessible_database(db, user=owner, virtual_name=old_virtual_name)
    if not db_to_rename:
        raise ValueError(f"Database '{old_virtual_name}' not found for your account.")

    if db_to_rename.user_id != owner.user_id:
        raise PermissionError("Only the database owner can rename a database.")

    if get_accessible_database(db, user=owner, virtual_name=new_virtual_name):
        raise ValueError(f"You already have a database named '{new_virtual_name}'.")
    
    old_physical_name = db_to_rename.physical_name
    new_physical_name = generate_physical_name(owner.user_id, new_virtual_name)
    
    engine = get_superuser_engine()
    with engine.connect().execution_options(isolation_level="AUTOCOMMIT") as conn:
        print(f"Terminating any active connections to '{old_physical_name}'...")    
        terminate_query = text(f"""
            SELECT pg_terminate_backend(pid) FROM pg_stat_activity
            WHERE datname = '{old_physical_name}' AND pid <> pg_backend_pid();
        """)
        conn.execute(terminate_query)
        print("Connections terminated.")
        print(f"Renaming physical database from '{old_physical_name}' to '{new_physical_name}'...")
        conn.execute(text(f'ALTER DATABASE "{old_physical_name}" RENAME TO "{new_physical_name}";'))
        
    db_to_rename.virtual_name = new_virtual_name
    db_to_rename.physical_name = new_physical_name
    
    db.commit()
    db.refresh(db_to_rename)
    return db_to_rename