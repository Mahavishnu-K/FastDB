import os
from logging.config import fileConfig

from sqlalchemy import engine_from_config
from sqlalchemy import pool

from alembic import context

# --- START: Added code to load .env ---
from dotenv import load_dotenv

# Load the .env file from the project root (where alembic.ini is)
# This assumes you run `alembic` from the `server` directory.
load_dotenv() 
# --- END: Added code ---


# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# --- START: Added code to set the URL from environment variable ---
# Get the database URL from the environment variable
db_url = os.getenv("DATABASE_URL")
if not db_url:
    raise ValueError("DATABASE_URL environment variable is not set")

# Set the sqlalchemy.url in the Alembic config object programmatically
config.set_main_option("sqlalchemy.url", db_url)
# --- END: Added code ---


# Interpret the config file for Python logging.
# This line sets up loggers basically.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)


# --- START: Model imports ---
# Import your models so autogenerate can see them
from app.db.base import Base
from app.models import QueryHistory, SavedQuery
# --- END: Model imports ---


# add your model's MetaData object here
# for 'autogenerate' support
target_metadata = Base.metadata


# ... (the rest of the file remains exactly the same) ...

def run_migrations_offline() -> None:
    # ...
    url = config.get_main_option("sqlalchemy.url") # This will now get the URL we set above
    # ...

def run_migrations_online() -> None:
    # ...
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}), # This also uses the URL we set
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    # ...

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()