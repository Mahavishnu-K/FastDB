from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import Dict, Any, Optional

from app.schemas.query_schema import NLRequest, NLResponse, ExecuteRequest, QueryResponse, QueryCommand
from app.core.diagram_generator import generate_schema_as_mermaid
from app.core.sql_executor import execute_sql

from app.core.security import get_current_user
from app.models.user_model import User
from app.db.session import get_db_session, get_superuser_engine
from app.db.engine import get_engine_for_user_db
from app.services import virtual_database_service as vdb_service
from app.schemas.virtual_database_schema import VirtualDatabaseCreate

from app.services import history_service
from app.core.nlp_engine import convert_nl_to_sql
from app.core import transaction_manager

router = APIRouter()

STOP_WORDS = {
    'a', 'an', 'the', 'all', 'any', 'both', 'each', 'every', 'few', 'more',
    'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same',
    'another', 'that', 'this', 'these', 'those', 'my', 'your', 'his', 'her', 'its',
    'our', 'their',
    'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them',
    'myself', 'yourself', 'himself', 'herself', 'itself', 'ourselves', 'yourselves', 'themselves',
    'is', 'are', 'was', 'were', 'be', 'being', 'been', 'have', 'has', 'had',
    'do', 'does', 'did', 'can', 'will', 'would', 'should', 'could', 'may', 'might', 'must',
    'show', 'give', 'tell', 'find', 'get', 'list', 'make', 'add', 'remove', 'change',
    'calculate', 'display', 'generate', 'fetch', 'retrieve', 'count',
    'of', 'at', 'by', 'for', 'with', 'about', 'against', 'between', 'into', 'through',
    'during', 'before', 'after', 'above', 'below', 'to', 'from', 'up', 'down', 'in',
    'out', 'on', 'off', 'over', 'under', 'again', 'further', 'then', 'once', 'here',
    'there',
    'and', 'but', 'if', 'or', 'because', 'as', 'until', 'while', 'so', 'than', 'that',
    'when', 'where', 'why', 'how', 'too', 'very', 'just', 'also', 'really', 'please',
    'kindly', 'quickly', 'slowly',
    'who', 'what', 'which'
}

SQL_KEYWORDS = {
    'SELECT', 'INSERT', 'UPDATE', 'DELETE', 'MERGE', 'CALL', 'EXPLAIN', 'PLAN', 'WITH',
    'CREATE', 'DROP', 'ALTER', 'TRUNCATE', 'RENAME', 'COMMENT',
    'GRANT', 'REVOKE',
    'COMMIT', 'ROLLBACK', 'SAVEPOINT', 'SET', 'TRANSACTION',
    'FROM', 'WHERE', 'GROUP', 'BY', 'HAVING', 'ORDER', 'LIMIT', 'OFFSET', 'AS', 'ON',
    'JOIN', 'INNER', 'LEFT', 'RIGHT', 'FULL', 'OUTER', 'CROSS',
    'UNION', 'ALL', 'DISTINCT', 'VALUES', 'INTO', 'SET',
    'TABLE', 'VIEW', 'INDEX', 'DATABASE', 'SCHEMA', 'PROCEDURE', 'FUNCTION',
    'TRIGGER', 'SEQUENCE', 'TYPE', 'DOMAIN', 'USER', 'ROLE',
    'COUNT', 'SUM', 'AVG', 'MIN', 'MAX', 'CAST', 'CONVERT'
}

def is_likely_sql(command: str, threshold: float = 0.5) -> bool:
    """
    A more robust heuristic to guess if a command is direct SQL.
    Returns True if it's more likely to be SQL than natural language.
    """
    command = command.strip()
    if not command:
        return False

    first_word = command.split()[0].upper()
    if first_word not in SQL_KEYWORDS:
        return False
    words = [word.lower().strip(';,()') for word in command.split()]
    if not words:
        return False
        
    stop_word_count = sum(1 for word in words if word in STOP_WORDS)
    word_count = len(words)
    
    stop_word_ratio = stop_word_count / word_count
    if command.endswith(';'):
        return True
    if not command.endswith(';'):
        return False
    if stop_word_ratio > 0.25:
        return False

    return True

def substitute_params(prompt: str, params: Dict[str, Any]) -> str:
    
    if not params:
        return prompt
    
    for key, value in params.items():
        escaped_value = f'"{str(value)}"' 
        prompt = prompt.replace(f'{{{key}}}', escaped_value)
    return prompt

@router.post("/", response_model=QueryResponse, tags=["SDK"])
async def run_nlp_command(
    request: QueryCommand, # Use the simple QueryCommand schema
    x_target_database: str = Header(..., alias="X-Target-Database"),
    x_transaction_id: Optional[str] = Header(None, alias="X-Transaction-ID"),
    db_session: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user)
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

    if is_likely_sql(final_prompt):
        sql_to_execute = final_prompt
    else:
        # For NLP, we need to connect to the target DB to get its schema for context
        virtual_db = vdb_service.get_accessible_database(db_session, user=current_user, virtual_name=x_target_database)
        if not virtual_db and x_target_database != "postgres": # Allow NLP context from postgres db
             raise HTTPException(status_code=404, detail=f"Database '{x_target_database}' not found.")
        
        # Connect to the user's DB to get schema for the LLM
        engine = get_engine_for_user_db(virtual_db.physical_name if virtual_db else "postgres")
        schema_context = generate_schema_as_mermaid(engine)
        nl_response = await convert_nl_to_sql(final_prompt, schema_context)
        
        if nl_response.get("query_type") == "ERROR":
            error_msg = nl_response.get("explanation", "Unknown error from NLP engine.")
            raise HTTPException(status_code=400, detail=f"NLP Error: {error_msg}")
        
        sql_to_execute = nl_response.get("sql")
    
    # --- NEW: SPECIAL HANDLING FOR ADMIN COMMANDS ---
    upper_sql = sql_to_execute.strip().upper()
    result_dict = {}

    try:
        if upper_sql.startswith('CREATE DATABASE'):
            # This is an admin command. Use the superuser engine.
            print("INFO: CREATE DATABASE command detected. Using superuser engine.")
            new_virtual_name = sql_to_execute.split()[2].strip(';"')
            
            if vdb_service.get_accessible_database(db_session, user=current_user, virtual_name=new_virtual_name):
                raise HTTPException(status_code=409, detail=f"You already have a database named '{new_virtual_name}'.")

            # 2. Create a validated Pydantic model instance.
            #    This will raise a 422 error if the name is invalid (e.g., "my-db!").
            try:
                db_in = VirtualDatabaseCreate(virtual_name=new_virtual_name)
            except Exception as e:
                raise HTTPException(status_code=422, detail=f"Invalid database name: {e}")

            # 3. Call the service with the validated Pydantic object.
            vdb_service.create_virtual_database(db_session, owner=current_user, db_in=db_in)
            result_dict = {"success": True, "message": f"Database '{new_virtual_name}' created successfully."}

        elif upper_sql.startswith('DROP DATABASE'):
            # This is an admin command. Use the superuser engine.
            print("INFO: DROP DATABASE command detected. Using superuser engine.")
            virtual_name_to_drop = sql_to_execute.split()[2].strip(';"')
            
            # Look up the physical name to drop it
            db_to_drop = vdb_service.get_accessible_database(db_session, user=current_user, virtual_name=virtual_name_to_drop)
            if not db_to_drop:
                raise HTTPException(status_code=404, detail=f"Database '{virtual_name_to_drop}' not found for your account.")
            
            # Use the service to delete the physical DB and metadata (we'll create this service)
            vdb_service.delete_virtual_database(db_session, db_to_drop=db_to_drop)
            result_dict = {"success": True, "message": f"Database '{virtual_name_to_drop}' dropped successfully."}

        else:
            # --- STANDARD LOGIC FOR ALL OTHER QUERIES (SELECT, INSERT, etc.) ---
            # Look up the physical DB name for the target of the query
            virtual_db = vdb_service.get_accessible_database(db_session, user=current_user, virtual_name=x_target_database)
            if not virtual_db:
                raise HTTPException(status_code=404, detail=f"Database '{x_target_database}' not found for your account.")
            
            if x_transaction_id:
                # --- TRANSACTIONAL PATH ---
                print(f"DEBUG: Executing in transaction {x_transaction_id}")
                connection = transaction_manager.get_transaction_connection(x_transaction_id)
                if not connection:
                    raise HTTPException(status_code=404, detail=f"Transaction '{x_transaction_id}' not found or has expired.")
                
                result_dict = execute_sql(connection, sql_to_execute)
            else:
                # --- AUTO-COMMIT PATH ---
                print("DEBUG: Executing in auto-commit mode (no transaction ID)")
                engine = get_engine_for_user_db(virtual_db.physical_name)
                with engine.connect() as connection:
                    with connection.begin(): # This handles BEGIN/COMMIT/ROLLBACK for a single statement
                        result_dict = execute_sql(connection, sql_to_execute)

    except Exception as e:
        # Log the failed query
        history_service.log_query_history(
            db=db_session, owner=current_user, command=request.command, sql=sql_to_execute, status="error"
        )
        raise HTTPException(status_code=400, detail=f"SQL Execution Error: {e}")

    # --- Step 3: Log success and format the response ---
    history_service.log_query_history(
        db=db_session, owner=current_user, command=final_prompt, sql=sql_to_execute, status="success"
    )

    # Transform data for frontend/SDK compatibility if necessary
    response_data = result_dict.get("data")
    final_result_data = None # Start with a clean slate

    if response_data and "columns" in response_data and "rows" in response_data:
        # This check is robust. It works even if `rows` is an empty list.
        columns = response_data["columns"]
        rows = response_data["rows"]
        
        # This transformation always works, producing `[]` if `rows` is empty.
        formatted_data = [dict(zip(columns, row)) for row in rows]
        
        # This creates a NEW dictionary that PERFECTLY matches your QueryResultData schema.
        final_result_data = {"columns": columns, "data": formatted_data}
    
    # This response must match your SDK's QueryResponse model
    return QueryResponse(
        success=True, 
        message=result_dict.get("message", "Command executed successfully."),
        generated_sql=sql_to_execute, 
        result=final_result_data
    )

# The /nl endpoint is correct and does not need changes.
@router.post("/nl", response_model=NLResponse, tags=["Query"])
async def process_nl_query(
    request: NLRequest,
    # --- ADD THE CORRECT DEPENDENCIES ---
    x_target_database: str = Header(..., alias="X-Target-Database"),
    db_session: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user)
):
    """
    Converts a natural language command to SQL for a specific user's database
    without executing it. This is a secure, multi-tenant version.
    """
    # 1. Look up the user's virtual database to find the physical name.
    virtual_db = vdb_service.get_accessible_database(
        db_session, 
        user=current_user, 
        virtual_name=x_target_database
    )
    if not virtual_db:
        raise HTTPException(
            status_code=404, 
            detail=f"Database '{x_target_database}' not found for your account."
        )
    
    # 2. Get the engine for the user's specific physical database.
    try:
        engine = get_engine_for_user_db(virtual_db.physical_name)
    except Exception as e:
        raise HTTPException(
            status_code=503, 
            detail=f"Could not connect to database '{x_target_database}': {e}"
        )

    # 3. The rest of the logic is the same, but now it uses the correct, secure engine.
    schema_context = generate_schema_as_mermaid(engine)
    structured_response = await convert_nl_to_sql(request.command, schema_context)
    
    if structured_response.get("query_type") == "ERROR":
        # It's better to use a 400 Bad Request for user errors
        raise HTTPException(
            status_code=400, 
            detail=structured_response.get("explanation", "Failed to process NLP command.")
        )
        
    return structured_response