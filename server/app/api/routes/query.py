from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.schemas.query_schema import NLRequest, NLResponse, ExecuteRequest, QueryResponse
from app.core.diagram_generator import generate_schema_as_mermaid
from app.core.sql_executor import execute_sql

from app.db.session import get_engine, get_db_session

from app.services import history_service
from app.core.nlp_engine import convert_nl_to_sql

router = APIRouter()

# The /nl endpoint is correct and does not need changes.
@router.post("/nl", response_model=NLResponse, tags=["Query"])
async def process_nl_query(request: NLRequest, engine: Engine = Depends(get_engine)):
    schema_context = generate_schema_as_mermaid(engine)
    structured_response = await convert_nl_to_sql(request.command, schema_context)
    if structured_response["query_type"] == "ERROR":
        raise HTTPException(status_code=500, detail=structured_response["explanation"])
    return structured_response

@router.post("/execute", response_model=QueryResponse, tags=["Query"])
async def execute_raw_sql(
    request: ExecuteRequest,
    engine: Engine = Depends(get_engine),
    db_session: Session = Depends(get_db_session)
):
    """
    Executes a raw SQL query, combining robust admin command handling with
    frontend-compatible data formatting.
    """
    sql_command = request.sql.strip()
    upper_sql = sql_command.upper()
    
    result_dict = {}

    try:
        # This is the robust logic for handling different command types
        if upper_sql.startswith('DROP DATABASE'):
            # --- SPECIAL DROP DATABASE LOGIC ---
            db_to_drop = sql_command.split()[2].strip(';')

            with engine.connect().execution_options(isolation_level="AUTOCOMMIT") as conn:
                # Terminate all connections to the target database BEFORE dropping it
                terminate_query = text(f"""
                    SELECT pg_terminate_backend(pid)
                    FROM pg_stat_activity
                    WHERE datname = '{db_to_drop}' AND pid <> pg_backend_pid();
                """)
                conn.execute(terminate_query)
                
                # Now, execute the DROP DATABASE command
                conn.execute(text(sql_command))
            
            result_dict = {"success": True, "message": f"Database '{db_to_drop}' dropped successfully."}

        elif upper_sql.startswith('CREATE DATABASE'):
            # --- SPECIAL CREATE DATABASE LOGIC ---
            with engine.connect().execution_options(isolation_level="AUTOCOMMIT") as conn:
                conn.execute(text(sql_command))
            result_dict = {"success": True, "message": "Database created successfully."}

        else:
            # --- STANDARD LOGIC FOR ALL OTHER QUERIES (SELECT, INSERT, CREATE TABLE, etc.) ---
            with engine.connect() as connection:
                with connection.begin() as transaction:
                    result_dict = execute_sql(connection, sql_command)

    except Exception as e:
        result_dict = {"success": False, "message": str(e)}

    # --- Logging and Response (No changes needed here) ---
    history_service.log_query_history(
        db=db_session,
        command="Raw SQL Execution",
        sql=request.sql,
        status="success" if result_dict.get("success") else "error"
    )

    if not result_dict.get("success"):
        raise HTTPException(status_code=400, detail=result_dict.get("message"))

    # --- THIS IS THE CRUCIAL DATA TRANSFORMATION LOGIC FROM YOUR VERSION ---
    response_data = result_dict.get("data")
    if response_data:
        # Check if the data is in the [columns, rows] format and needs conversion
        if "columns" in response_data and "rows" in response_data and response_data["rows"] and isinstance(response_data["rows"][0], list):
             columns = response_data["columns"]
             rows = response_data["rows"]
             # Transform into a list of dictionaries for the frontend DataTable
             response_data["data"] = [dict(zip(columns, row)) for row in rows]
    
    return QueryResponse(
        success=True, 
        message=result_dict.get("message"), 
        result=response_data
    )