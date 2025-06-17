from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.schemas.query_schema import NLRequest, NLResponse, ExecuteRequest, QueryResponse
from app.core.diagram_generator import generate_schema_as_mermaid
from app.core.sql_executor import execute_sql
# We only need get_engine and get_db_session for this file now.
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

# --- START: THE FINAL, SIMPLIFIED, AND CORRECTED EXECUTE FUNCTION ---
@router.post("/execute", response_model=QueryResponse, tags=["Query"])
async def execute_raw_sql(
    request: ExecuteRequest,
    # SIMPLIFIED: We ONLY depend on the engine and the session for logging.
    engine: Engine = Depends(get_engine),
    db_session: Session = Depends(get_db_session)
):
    """
    Executes a raw SQL query. All connection and transaction logic is handled
    explicitly within this function to ensure correctness.
    """
    sql_command = request.sql.strip().upper()
    is_db_admin_command = sql_command.startswith('CREATE DATABASE') or sql_command.startswith('DROP DATABASE')

    result = {}

    try:
        if is_db_admin_command:
            # DB admin commands need a special autocommit connection.
            with engine.connect().execution_options(isolation_level="AUTOCOMMIT") as connection:
                connection.execute(text(request.sql))
            result = {"success": True, "message": "Admin command executed successfully."}
        else:
            # For ALL OTHER commands (CREATE/DROP TABLE, INSERT, SELECT, etc.),
            # we create a connection and run it inside an explicit transaction.
            with engine.connect() as connection:
                with connection.begin() as transaction:
                    # Pass the connection to our existing helper
                    result = execute_sql(connection, request.sql)
                    # The 'with' block automatically commits here if no error was raised.
    except Exception as e:
        # If anything goes wrong, we build a failure response.
        result = {"success": False, "message": str(e)}


    # Logging remains the same
    history_service.log_query_history(
        db=db_session,
        command="Raw SQL Execution",
        sql=request.sql,
        status="success" if result["success"] else "error"
    )

    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("message"))

    response_data = result.get("data")
    return QueryResponse(success=True, message=result.get("message"), result=response_data)
# --- END: THE FINAL, SIMPLIFIED, AND CORRECTED EXECUTE FUNCTION ---