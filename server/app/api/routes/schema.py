from fastapi import APIRouter, Depends, HTTPException, Path, Header
from fastapi.responses import PlainTextResponse

from sqlalchemy import inspect, Table, MetaData, text
from sqlalchemy.engine import Engine
from sqlalchemy.schema import CreateTable

from app.schemas.table_schema import FullSchemaResponse, TableSchema, ColumnSchema, StatusResponse
from app.db.session import get_engine
from app.services import sql_builder
from app.core.diagram_generator import generate_schema_as_mermaid 

router = APIRouter()

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

@router.get("/mermaid", response_class=PlainTextResponse, tags=["Schema"])
async def get_schema_as_mermaid(engine: Engine = Depends(get_engine)):
    """Generates and returns a Mermaid.js ER diagram string for the current schema."""
    try:
        mermaid_string = generate_schema_as_mermaid(engine)
        return mermaid_string
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate Mermaid diagram: {str(e)}")
    
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
    
@router.get("/{table_name}", response_model=TableSchema, tags=["Schema"])
async def get_single_table_schema(
    table_name: str,
    x_target_database: str = Header(..., alias="X-Target-Database")
):
    """
    Retrieves the detailed schema for a single table.
    """
    try:
        engine = get_engine(x_target_database)
        inspector = inspect(engine)
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Database '{x_target_database}' not found or connection failed: {e}")

    if not inspector.has_table(table_name):
        raise HTTPException(status_code=404, detail=f"Table '{table_name}' not found.")

    # Get column and primary key info from SQLAlchemy Inspector
    columns_data = inspector.get_columns(table_name)
    pk_constraint = inspector.get_pk_constraint(table_name)
    primary_key_columns = pk_constraint.get('constrained_columns', [])

    # Build the list of column schemas using your Pydantic model
    column_schemas = []
    for col in columns_data:
        column_schemas.append(ColumnSchema(
            name=col['name'],
            type=str(col['type']),
            is_nullable=col['nullable'],
            is_primary_key=(col['name'] in primary_key_columns),
            default=col.get('default')
        ))

    # Get the row count
    row_count = 0
    with engine.connect() as connection:
        try:
            count_query = text(f'SELECT COUNT(1) FROM "{table_name}"')
            result = connection.execute(count_query)
            row_count = result.scalar_one()
        except Exception as e:
            # Log the error if you have a logger configured
            print(f"Could not count rows for table {table_name}: {e}")

    # Return the data structured with your existing TableSchema model
    return TableSchema(
        name=table_name,
        columns=column_schemas,
        row_count=row_count
    )

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
                columns.append(ColumnSchema(
                    name=col['name'],
                    type=str(col['type']),
                    is_nullable=col['nullable'],
                    is_primary_key=col['name'] in primary_keys,
                    default=col['default']
                ))
            
            with engine.connect() as conn:
                query = text(f'SELECT COUNT(*) FROM public."{table_name}"')
                row_count_result = conn.execute(query)
                row_count = row_count_result.scalar_one()

            response_tables.append(TableSchema(
                name=table_name,
                columns=columns,
                row_count=row_count
            ))
        return FullSchemaResponse(tables=response_tables)
    except Exception as e:
        # It's better to raise a specific 500 error here
        raise HTTPException(status_code=500, detail=f"Failed to retrieve schema: {str(e)}")
