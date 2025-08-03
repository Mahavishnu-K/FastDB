# alembic/env.py
import os
from logging.config import fileConfig

from sqlalchemy import engine_from_config
from sqlalchemy import pool

from alembic import context

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# Interpret the config file for Python logging.
# This line sets up loggers basically.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# --- START: LOAD .env AND BUILD DATABASE_URL FROM COMPONENTS ---
# This section makes Alembic work with your .env file without any other changes.
from dotenv import load_dotenv

# Load environment variables from the .env file in the project root
load_dotenv()

# Read the database connection components from environment variables
db_user = os.getenv("POSTGRES_USER")
db_password = os.getenv("POSTGRES_PASSWORD")
db_host = os.getenv("POSTGRES_SERVER")
db_port = os.getenv("POSTGRES_PORT")
db_name = os.getenv("POSTGRES_DB")

# Validate that all necessary components are present
if not all([db_user, db_password, db_host, db_port, db_name]):
    raise ValueError("One or more POSTGRES_* environment variables are not set")

# Construct the full database URL string
# This MUST match the format your application uses.
# Alembic specifically targets the main application database (for history, etc.).
db_url = f"postgresql+psycopg2://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}"

# Set the sqlalchemy.url in the Alembic config object programmatically
# This overrides the value in alembic.ini
config.set_main_option("sqlalchemy.url", db_url)
# --- END: LOAD .env AND BUILD DATABASE_URL FROM COMPONENTS ---


# --- START: Model imports for 'autogenerate' support ---
# Import your models' Base so autogenerate can detect changes
from app.db.base import Base
# Import all of your models here
from app.models.history_model import QueryHistory
from app.models.saved_query_model import SavedQuery
from app.models.user_model import User
from app.models.virtual_database_model import VirtualDatabase

# Set the target_metadata to your Base's metadata
target_metadata = Base.metadata
# --- END: Model imports ---


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode.

    This configures the context with just a URL
    and not an Engine, though an Engine is acceptable
    here as well.  By skipping the Engine creation
    we don't even need a DBAPI to be available.

    Calls to context.execute() here emit the given string to the
    script output.

    """
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode.

    In this scenario we need to create an Engine
    and associate a connection with the context.

    """
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection, target_metadata=target_metadata
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()