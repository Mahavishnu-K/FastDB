# server/app/services/virtual_database_service.py
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List

from app.models.virtual_database_model import VirtualDatabase
from app.models.user_model import User
from app.schemas.virtual_database_schema import VirtualDatabaseCreate
from app.db.session import get_superuser_engine
from app.utils.gen_physical_name import generate_physical_name

def get_db_by_virtual_name(db: Session, *, owner: User, virtual_name: str) -> VirtualDatabase | None:
    """Checks if a user already has a database with a given virtual name."""
    return db.query(VirtualDatabase).filter(
        VirtualDatabase.user_id == owner.user_id,
        VirtualDatabase.virtual_name == virtual_name
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

def get_all_dbs_for_user(db: Session, *, owner: User) -> List[VirtualDatabase]:
    return db.query(VirtualDatabase).filter(VirtualDatabase.user_id == owner.user_id).all()