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
    sql_command = request.sql.strip() # Difference #1: Use original case
    is_db_admin_command = sql_command.upper().startswith('CREATE DATABASE') or \
                          sql_command.upper().startswith('DROP DATABASE')
    
    result_dict = {}

    try:
        with engine.connect() as connection:
            if is_db_admin_command:
                # Difference #2: More explicit autocommit handling
                connection.execution_options(isolation_level="AUTOCOMMIT")
                connection.execute(text(sql_command)) # Use the variable
                result_dict = {"success": True, "message": "Database command executed successfully."}
            else:
                with connection.begin() as transaction:
                    result_dict = execute_sql(connection, sql_command) # Use the variable
    except Exception as e:
        result_dict = {"success": False, "message": str(e)}

    history_service.log_query_history(
        db=db_session,
        command="Raw SQL Execution",
        sql=request.sql,
        status="success" if result_dict["success"] else "error"
    )

    if not result_dict.get("success"):
        raise HTTPException(status_code=400, detail=result_dict.get("message"))

    response_data = result_dict.get("data")
    
    # Difference #3: Added data transformation for frontend compatibility
    if response_data:
        if "columns" in response_data and "rows" in response_data and response_data["rows"] and isinstance(response_data["rows"][0], list):
             columns = response_data["columns"]
             rows = response_data["rows"]
             # This creates a list of dictionaries, which your DataTable component expects.
             response_data["data"] = [dict(zip(columns, row)) for row in rows]
    
    return QueryResponse(
        success=True, 
        message=result_dict.get("message"), 
        result=response_data
    )