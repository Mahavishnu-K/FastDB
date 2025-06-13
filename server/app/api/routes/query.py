from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.engine import Engine, Connection
from sqlalchemy.orm import Session

from app.schemas.query_schema import NLRequest, NLResponse, ExecuteRequest, QueryResponse
from app.core.diagram_generator import generate_schema_as_mermaid
from app.core.sql_executor import execute_sql
from app.db.engine import get_engine
from app.db.session import get_db_session, get_db_connection

from app.services import history_service


# THIS IS WHERE YOU IMPORT YOUR CUSTOM NLP ENGINE
from app.core.nlp_engine import convert_nl_to_sql

router = APIRouter()

@router.post("/nl", response_model=NLResponse, tags=["Query"])
async def process_nl_query(request: NLRequest, engine: Engine = Depends(get_engine)):
    """Takes a natural language command and returns a structured SQL response."""
    schema_context = generate_schema_as_mermaid(engine)
    
    # This single call does all the work now
    structured_response = await convert_nl_to_sql(request.command, schema_context)
    
    # Check if the engine returned an error within its structure
    if structured_response["query_type"] == "ERROR":
        raise HTTPException(status_code=500, detail=structured_response["explanation"])
        
    return structured_response

@router.post("/execute", response_model=QueryResponse, tags=["Query"])
async def execute_raw_sql(
    request: ExecuteRequest,
    # We need both a connection for execution and a session for logging
    connection: Connection = Depends(get_db_connection),
    db_session: Session = Depends(get_db_session)
):
    """Executes a raw SQL query, logs it to history, and returns the result."""
    result = execute_sql(connection, request.sql)
    
    # Log the attempt to history
    history_service.log_query_history(
        db=db_session,
        command="Raw SQL Execution", # You could pass the original NL command from the frontend
        sql=request.sql,
        status="success" if result["success"] else "error"
    )

    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["message"])
        
    return QueryResponse(success=True, message=result["message"], result=result["data"])