# app/api/routes/schema.py
from fastapi import APIRouter, Depends, HTTPException, Path, Header
from fastapi.responses import PlainTextResponse
from sqlalchemy import inspect, Table, MetaData, text
from sqlalchemy.schema import CreateTable

# --- Important Imports for Multi-Tenancy ---
from sqlalchemy.orm import Session
from app.core.security import get_current_user
from app.models.user_model import User
from app.db.session import get_db_session
from app.db.engine import get_engine_for_user_db
from app.services import virtual_database_service as vdb_service

# --- Schema and other Imports ---
from app.schemas.table_schema import FullSchemaResponse, TableSchema, ColumnSchema, StatusResponse
from app.core.sql_executor import execute_sql 
from app.core.diagram_generator import generate_schema_as_mermaid 

from app.core.authorization import get_user_role_for_db, user_has_at_least_role
from app.models.database_collab_model import DBRole

router = APIRouter()

def _get_full_schema_details(inspector, engine):
    """Helper function to avoid duplicating schema inspection logic."""
    response_tables = []
    table_names = inspector.get_table_names(schema="public")
    
    for table_name in table_names:
        # --- THIS IS THE CORRECTED LOGIC ---
        columns_data = inspector.get_columns(table_name, schema="public")
        pk_constraint = inspector.get_pk_constraint(table_name, schema="public")
        primary_key_columns = pk_constraint.get('constrained_columns', [])
        foreign_keys = inspector.get_foreign_keys(table_name, schema="public")
        indexes = inspector.get_indexes(table_name, schema="public")
        unique_constraints = inspector.get_unique_constraints(table_name, schema="public")

        column_schemas = []
        for col in columns_data:
            is_pk = col['name'] in primary_key_columns
            
            fk_info = next((fk for fk in foreign_keys if col['name'] in fk['constrained_columns']), None)
            fk_display = f"{fk_info['referred_table']}({fk_info['referred_columns'][0]})" if fk_info else None
            is_unique = any(col['name'] in u['column_names'] for u in unique_constraints)
            has_index = any(col['name'] in i['column_names'] for i in indexes)

            column_schemas.append(ColumnSchema(
                name=col['name'],
                type=str(col['type']),
                is_nullable=col['nullable'],
                is_primary_key=is_pk,
                is_unique=is_unique or is_pk,
                has_index=has_index or is_pk,
                foreign_key=fk_display,
                default=col.get('default')
            ))
        
        with engine.connect() as conn:
            row_count = conn.execute(text(f'SELECT COUNT(1) FROM public."{table_name}"')).scalar_one_or_none() or 0

        response_tables.append(TableSchema(name=table_name, columns=column_schemas, row_count=row_count))
    return response_tables

@router.get("/", response_model=FullSchemaResponse, tags=["Schema"])
async def get_database_schema(
    x_target_database: str = Header(..., alias="X-Target-Database"),
    db_session: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user)
):
    """Securely returns the full schema for the user's target database."""
    virtual_db = vdb_service.get_accessible_database(db_session, user=current_user, virtual_name=x_target_database)
    if not virtual_db:
        raise HTTPException(status_code=404, detail=f"Database '{x_target_database}' not found for your account.")
    
    engine = get_engine_for_user_db(virtual_db.physical_name)
    inspector = inspect(engine)

    try:
        tables = _get_full_schema_details(inspector, engine)
        return FullSchemaResponse(tables=tables)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve schema: {str(e)}")

@router.get("/export", response_class=PlainTextResponse, tags=["Schema"])
async def export_schema_as_sql(
    x_target_database: str = Header(..., alias="X-Target-Database"),
    db_session: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user)
):
    """Securely generates a full SQL script for the user's target database."""
    virtual_db = vdb_service.get_accessible_database(db_session, user=current_user, virtual_name=x_target_database)
    if not virtual_db:
        raise HTTPException(status_code=404, detail=f"Database '{x_target_database}' not found.")
    
    engine = get_engine_for_user_db(virtual_db.physical_name)
    inspector = inspect(engine)
    script = ""
    for table_name in inspector.get_table_names(schema="public"):
        try:
            table_metadata = Table(table_name, MetaData(), autoload_with=engine, schema="public")
            create_statement = str(CreateTable(table_metadata).compile(engine))
            script += f"{create_statement.strip()};\n\n"
        except Exception as e:
            script += f"-- Could not generate CREATE statement for table '{table_name}': {e}\n\n"
    return script if script else "-- No tables found to export."


@router.get("/mermaid", response_class=PlainTextResponse, tags=["Schema"])
async def get_schema_as_mermaid(
    x_target_database: str = Header(..., alias="X-Target-Database"),
    db_session: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user)
):
    """Securely generates a Mermaid.js diagram for the user's target database."""
    virtual_db = vdb_service.get_accessible_database(db_session, user=current_user, virtual_name=x_target_database)
    if not virtual_db:
        raise HTTPException(status_code=404, detail=f"Database '{x_target_database}' not found.")
    
    engine = get_engine_for_user_db(virtual_db.physical_name)
    try:
        mermaid_string = generate_schema_as_mermaid(engine)
        return mermaid_string
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate Mermaid diagram: {str(e)}")
    
@router.get("/{table_name}", response_model=TableSchema, tags=["Schema"])
async def get_single_table_schema(
    table_name: str,
    x_target_database: str = Header(..., alias="X-Target-Database"),
    db_session: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user)
):
    """Securely retrieves the detailed schema for a single table."""
    virtual_db = vdb_service.get_accessible_database(db_session, user=current_user, virtual_name=x_target_database)
    if not virtual_db:
        raise HTTPException(status_code=404, detail=f"Database '{x_target_database}' not found for your account.")
    
    engine = get_engine_for_user_db(virtual_db.physical_name)
    inspector = inspect(engine)
    
    if not inspector.has_table(table_name):
        raise HTTPException(status_code=404, detail=f"Table '{table_name}' not found in database '{x_target_database}'.")

    try:
        # We can reuse the helper and just find the table we need
        all_tables = _get_full_schema_details(inspector, engine)
        target_table = next((t for t in all_tables if t.name == table_name), None)
        if not target_table:
             raise HTTPException(status_code=404, detail=f"Table '{table_name}' could not be processed.")
        return target_table
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve schema for table '{table_name}': {str(e)}")


@router.delete("/table/{table_name}", response_model=StatusResponse, tags=["Schema"])
async def delete_table(
    table_name: str = Path(...),
    x_target_database: str = Header(..., alias="X-Target-Database"),
    db_session: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user)
):
    """Securely deletes a table from the user's target database."""
    if not table_name.isidentifier():
        raise HTTPException(status_code=400, detail="Invalid table name.")

    virtual_db = vdb_service.get_accessible_database(db_session, user=current_user, virtual_name=x_target_database)
    if not virtual_db:
        raise HTTPException(status_code=404, detail=f"Database '{x_target_database}' not found.")
    
    user_role = get_user_role_for_db(db_session, user=current_user, virtual_db=virtual_db)
    if not user_has_at_least_role(user_role, DBRole.editor):
        raise HTTPException(status_code=403, detail="Permission denied: 'Editor' role required.")
    
    engine = get_engine_for_user_db(virtual_db.physical_name)
    
    # The `DROP TABLE` command should be handled by the main query endpoint for consistency,
    # but if you need a dedicated endpoint, this is how you'd do it.
    # We will use the main query endpoint's logic for safety.
    sql = f'DROP TABLE "{table_name}";'
    try:
        with engine.connect() as connection:
            with connection.begin():
                result = execute_sql(connection, sql)
        if not result["success"]:
            raise HTTPException(status_code=400, detail=result["message"])
        return StatusResponse(message=f"Table '{table_name}' deleted successfully.")
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))