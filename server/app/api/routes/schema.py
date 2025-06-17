from fastapi import APIRouter, Depends, HTTPException, Path
from fastapi.responses import PlainTextResponse
from sqlalchemy import inspect, Table, MetaData, text
from sqlalchemy.engine import Engine
from sqlalchemy.schema import CreateTable

from app.schemas.table_schema import FullSchemaResponse, TableSchema, TableColumnInfo, StatusResponse
from app.db.session import get_engine
from app.services import sql_builder

router = APIRouter()

@router.get("/", response_model=FullSchemaResponse, tags=["Schema"])
async def get_database_schema(engine: Engine = Depends(get_engine)):
    """Returns the full database schema."""
    try:
        inspector = inspect(engine)
        response_tables = []
        # Be explicit with the "public" schema for PostgreSQL
        table_names = inspector.get_table_names(schema="public")
        
        for table_name in table_names:
            columns = []
            pk_constraint = inspector.get_pk_constraint(table_name, schema="public")
            primary_keys = pk_constraint.get('constrained_columns', [])
            
            for col in inspector.get_columns(table_name, schema="public"):
                columns.append(TableColumnInfo(
                    name=col['name'],
                    type=str(col['type']),
                    nullable=col['nullable'],
                    primary_key=col['name'] in primary_keys,
                    default=col['default']
                ))
            
            # --- START: THE FIX IS HERE ---
            with engine.connect() as conn:
                # The quote function is not needed here as we are not using a service.
                # We can safely construct the query and wrap it in text().
                # For PostgreSQL, table names are case-sensitive inside quotes.
                query = text(f'SELECT COUNT(*) FROM public."{table_name}"')
                row_count_result = conn.execute(query)
                row_count = row_count_result.scalar_one()
            # --- END: THE FIX IS HERE ---

            response_tables.append(TableSchema(
                name=table_name,
                columns=columns,
                row_count=row_count
            ))
        return FullSchemaResponse(tables=response_tables)
    except Exception as e:
        # It's better to raise a specific 500 error here
        raise HTTPException(status_code=500, detail=f"Failed to retrieve schema: {str(e)}")

@router.delete("/table/{table_name}", response_model=StatusResponse, tags=["Schema"])
async def delete_table(
    table_name: str = Path(...), 
    engine: Engine = Depends(get_engine)
):
    """Deletes an existing table."""
    from app.core.sql_executor import execute_sql
    # Pass the engine to the quote function to make it dialect-aware
    safe_table_name = sql_builder.quote(table_name, engine)
    sql = f"DROP TABLE {safe_table_name};"
    with engine.connect() as connection:
        result = execute_sql(connection, sql)
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["message"])
    return StatusResponse(message=f"Table '{table_name}' deleted successfully.")

# ADDED: The database-agnostic export endpoint
@router.get("/export", response_class=PlainTextResponse, tags=["Schema"])
async def export_schema_as_sql(engine: Engine = Depends(get_engine)):
    """
    Generates and returns a full SQL script to recreate the schema
    in a database-agnostic way.
    """
    inspector = inspect(engine)
    if not inspector:
        return "-- Database not connected."

    script = ""
    for table_name in inspector.get_table_names(schema="public"):
        try:
            # Get the table metadata object using the inspector
            table_metadata = Table(table_name, MetaData(), autoload_with=engine, schema="public")
            # Generate the CREATE TABLE statement for the specific dialect (PostgreSQL)
            create_statement = str(CreateTable(table_metadata).compile(engine))
            script += f"{create_statement.strip()};\n\n"
        except Exception as e:
            script += f"-- Could not generate CREATE statement for table '{table_name}': {e}\n\n"
    
    return script if script else "-- No tables found to export."