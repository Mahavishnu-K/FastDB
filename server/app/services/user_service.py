# server/app/services/user_service.py
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.models.user_model import User
from app.schemas.user import UserCreate

from app.utils.hashing import get_password_hash
from app.utils.gen_apikey import generate_api_key

from app.models.virtual_database_model import VirtualDatabase
from app.db.session import get_superuser_engine
from app.services.virtual_database_service import generate_physical_name

def get_user_by_email(db: Session, email: str) -> User | None:
    return db.query(User).filter(User.email == email).first()

def create_user(db: Session, user: UserCreate) -> User:
    hashed_password = get_password_hash(user.password)

    db_user = User(
        email=user.email,
        name=user.name,
        password_hash=hashed_password,
        api_key=generate_api_key()
    )
    db.add(db_user)

    db.flush() 

    # --- NEW LOGIC: PROVISION THE DEFAULT DATABASE ---
    try:
        # 2. Define the name for their first database
        default_virtual_name = "fastdb"
        physical_name = generate_physical_name(db_user.user_id, default_virtual_name)

        # 3. Create the physical database using the superuser engine
        superuser_engine = get_superuser_engine()
        with superuser_engine.connect().execution_options(isolation_level="AUTOCOMMIT") as conn:
            conn.execute(text(f'CREATE DATABASE "{physical_name}"'))
            print(f"Successfully created physical database: {physical_name} for user {db_user.email}")

        # 4. Create the virtual database metadata record
        default_db = VirtualDatabase(
            user_id=db_user.user_id,
            virtual_name=default_virtual_name,
            physical_name=physical_name
        )
        db.add(default_db)

        # 5. Commit everything together
        db.commit()

    except Exception as e:
        # If anything fails during database creation, roll back the user creation
        print(f"ERROR: Failed to provision default database for user {user.email}. Rolling back user creation.")
        db.rollback()
        # Re-raise the exception so the API endpoint can return a 500 error
        raise e

    db.refresh(db_user)
    return db_user

def get_user_by_api_key(db: Session, api_key: str) -> User | None:
    return db.query(User).filter(User.api_key == api_key).first()