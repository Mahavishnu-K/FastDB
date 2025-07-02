from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import Dict, Any, Optional

from app.schemas.query_schema import NLRequest, NLResponse, ExecuteRequest, QueryResponse, QueryCommand
from app.core.diagram_generator import generate_schema_as_mermaid
from app.core.sql_executor import execute_sql

from app.db.session import get_engine, get_db_session

from app.services import history_service
from app.core.nlp_engine import convert_nl_to_sql
from app.core import transaction_manager
import sqlparse

router = APIRouter()


def is_valid_sql(command: str) -> bool:
    """
    Uses the sqlparse library to determine if a string is a single,
    valid SQL statement.
    """
    try:
        parsed = sqlparse.parse(command)
        if len(parsed) != 1:
            return False
        statement = parsed[0]
        if not statement.tokens:
            return False
        if statement.get_type() == 'UNKNOWN':
            return False
        return True
    except Exception:
        return False

def substitute_params(prompt: str, params: Dict[str, Any]) -> str:
    
    if not params:
        return prompt
    
    for key, value in params.items():
        escaped_value = f'"{str(value)}"' 
        prompt = prompt.replace(f'{{{key}}}', escaped_value)
    return prompt

@router.post("/", response_model=QueryResponse, tags=["SDK"]) # Mounted at /api/query
async def run_nlp_command(
    request: QueryCommand, # Use the simple QueryCommand schema
    x_target_database: str = Header(..., alias="X-Target-Database"),
    x_transaction_id: Optional[str] = Header(None, alias="X-Transaction-ID"),
    db_session: Session = Depends(get_db_session)
):
    """
    The all-in-one endpoint for the SDK.
    1. Takes a natural language command.
    2. Converts it to SQL.
    3. Executes the SQL.
    4. Returns the result.
    """
    final_prompt = substitute_params(request.command, request.params)
    sql_to_execute = ""

    try:
        engine = get_engine(x_target_database)
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Database '{x_target_database}' not found or connection failed: {e}")

    # === THE ONLY CHANGE IS THIS IF CONDITION ===
    if is_valid_sql(final_prompt):
        # --- SQL BYPASS PATH ---
        print(f"INFO: Valid SQL detected. Bypassing NLP engine.")
        sql_to_execute = final_prompt
    else:
        # --- Step 1: Convert NL to SQL (logic from your /nl endpoint) ---
        try:
            schema_context = generate_schema_as_mermaid(engine)
            nl_response = await convert_nl_to_sql(final_prompt, schema_context)
            
            if nl_response["query_type"] == "ERROR":
                raise HTTPException(status_code=400, detail=f"NLP Error: {nl_response['explanation']}")
            
            sql_to_execute = nl_response["sql"]
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error during NLP to SQL conversion: {e}")

   # --- Step 2: Execute the generated SQL with transaction awareness ---
    result_dict = {}
    connection = None
    is_transactional = bool(x_transaction_id)

    try:
        if is_transactional:
            # --- TRANSACTIONAL PATH ---
            connection = transaction_manager.get_transaction_connection(x_transaction_id)
            if not connection:
                raise HTTPException(status_code=404, detail=f"Transaction '{x_transaction_id}' not found or has expired.")
            
            
            result_dict = execute_sql(connection, sql_to_execute)
        else:
            # --- AUTO-COMMIT PATH (for single queries) ---
            with engine.connect() as conn:
                with conn.begin(): # This context manager handles BEGIN/COMMIT/ROLLBACK
                    result_dict = execute_sql(conn, sql_to_execute)

    except Exception as e:
        # Log the failed query
        history_service.log_query_history(
            db=db_session, command=request.command, sql=sql_to_execute, status="error"
        )
        raise HTTPException(status_code=400, detail=f"SQL Execution Error: {e}")

    # --- Step 3: Log success and format the response ---
    history_service.log_query_history(
        db=db_session, command=final_prompt, sql=sql_to_execute, status="success"
    )

    # Transform data for frontend/SDK compatibility if necessary
    response_data = result_dict.get("data")
    if response_data:
        if "columns" in response_data and "rows" in response_data and response_data["rows"] and isinstance(response_data["rows"][0], list):
             columns = response_data["columns"]
             rows = response_data["rows"]
             response_data["data"] = [dict(zip(columns, row)) for row in rows]
    
    # This response must match your SDK's QueryResponse model
    return QueryResponse(
        success=True, 
        message=result_dict.get("message", "Command executed successfully."),
        generated_sql=sql_to_execute, 
        result=response_data
    )

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