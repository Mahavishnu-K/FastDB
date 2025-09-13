#api/routes/query.py
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import Dict, Any, Optional, List
import re

from app.schemas.query_schema import NLRequest, NLResponse, ExecuteRequest, QueryResponse, QueryCommand
from app.core.diagram_generator import generate_schema_as_mermaid
from app.core.sql_executor import execute_sql

from app.core.security import get_current_user
from app.models.user_model import User
from app.db.session import get_db_session, get_superuser_engine
from app.db.engine import get_engine_for_user_db
from app.services import virtual_database_service as vdb_service
from app.schemas.virtual_database_schema import VirtualDatabaseCreate

from app.services import history_service, template_cache_service
from app.core.nlp_engine import convert_nl_to_sql
from app.core import transaction_manager
from app.core.authorization import get_user_role_for_db, user_has_at_least_role
from app.models.database_collab_model import DBRole

from app.utils.caching_utils import deconstruct_sql, normalize_prompt_template

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
    request: QueryCommand,
    x_target_database: str = Header(..., alias="X-Target-Database"),
    x_transaction_id: Optional[str] = Header(None, alias="X-Transaction-ID"),
    db_session: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user)
):
    prompt_template = request.command
    params = request.params or {}
    
    sql_commands: List[str] = []
    execution_params: Dict[str, Any] = {}
    is_from_cache = False
    
    final_prompt = substitute_params(prompt_template, params)

    if is_likely_sql(prompt_template):
        sql_commands = [cmd.strip() for cmd in substitute_params(prompt_template, params).split(';') if cmd.strip()]
    else:
        # This is a Natural Language Query, so we check our caches first.
        if params:
            # --- TIER 1: TEMPLATE CACHE (for parameterized queries) ---
            cached_template, original_param_names = template_cache_service.find_template_in_cache(
                db_session, user=current_user, prompt_template=prompt_template
            )
            if cached_template:
                print(f"INFO: Normalized Template Cache HIT for user '{current_user.email}'.")
                is_from_cache = True
                sql_template = cached_template.sql_template
                try:
                    execution_params = {
                        f"param_{i}": params[original_name] 
                        for i, original_name in enumerate(original_param_names)
                    }
                    sql_commands = [sql_template]
                except KeyError as e:
                    raise HTTPException(status_code=400, detail=f"Cache error: Missing required parameter '{e}' in your request.")
        else:
            # --- TIER 2: HISTORY CACHE (for static, non-parameterized queries) ---
            cached_history = history_service.find_in_history(db_session, owner=current_user, command=prompt_template)
            if cached_history:
                print(f"INFO: Static History Cache HIT for user '{current_user.email}'.")
                is_from_cache = True
                sql_from_cache = cached_history.generated_sql
                sql_commands = [cmd.strip() for cmd in sql_from_cache.split(';') if cmd.strip()]
        
        if not is_from_cache:
            # --- CACHE MISS ---
            print(f"INFO: Cache MISS for user '{current_user.email}'. Routing to NLP engine.")
            virtual_db = vdb_service.get_accessible_database(db_session, user=current_user, virtual_name=x_target_database)
            if not virtual_db:
                 raise HTTPException(status_code=404, detail=f"Database '{x_target_database}' not found.")
            
            engine = get_engine_for_user_db(virtual_db.physical_name)
            schema_context = generate_schema_as_mermaid(engine)
            nl_response = await convert_nl_to_sql(x_target_database, final_prompt, schema_context)
            
            if nl_response.get("query_type") == "ERROR":
                raise HTTPException(status_code=400, detail=f"NLP Error: {nl_response.get('explanation', 'Unknown error')}")
            
            sql_from_llm = nl_response.get("sql")
            
            # Save to the template cache if it was a parameterized query
            if params:
                _, original_param_names_in_order = normalize_prompt_template(prompt_template)
                sql_template, param_map = deconstruct_sql(nl_response, params, original_param_names_in_order)
                template_cache_service.save_template_to_cache(
                    db_session, user=current_user, prompt_template=prompt_template,
                    sql_template=sql_template, param_map=param_map
                )

            if isinstance(sql_from_llm, str):
                sql_commands = [cmd.strip() for cmd in sql_from_llm.split(';') if cmd.strip()]
            elif isinstance(sql_from_llm, list):
                sql_commands = [cmd.strip() for cmd in sql_from_llm if cmd.strip()]
            
    if not sql_commands:
        raise HTTPException(status_code=400, detail="No SQL command to execute.")
            
    sql_for_display = ";\n".join(sql_commands) + ";"

    result_dict = {}

    try:
        # --- NEW LOGIC: Special handling for 'CREATE DATABASE' followed by other commands ---
        if sql_commands and sql_commands[0].strip().upper().startswith('CREATE DATABASE'):
            # 1. Isolate the CREATE DATABASE command
            create_db_command = sql_commands.pop(0) # Remove it from the list
            new_virtual_name = create_db_command.split()[2].strip(';"')
            
            # 2. Execute the CREATE DATABASE logic (same as before)
            print(f"INFO: Executing CREATE DATABASE for '{new_virtual_name}'.")
            if vdb_service.get_accessible_database(db_session, user=current_user, virtual_name=new_virtual_name):
                raise HTTPException(status_code=409, detail=f"You already have a database named '{new_virtual_name}'.")
            try:
                db_in = VirtualDatabaseCreate(virtual_name=new_virtual_name)
            except Exception as e:
                raise HTTPException(status_code=422, detail=f"Invalid database name: {e}")
            
            # This creates the physical DB and the metadata record
            new_virtual_db = vdb_service.create_virtual_database(db_session, owner=current_user, db_in=db_in)
            
            # 3. If there are more commands, execute them against the NEW database
            if sql_commands:
                print(f"INFO: Populating newly created database '{new_virtual_name}'.")
                # Get a new engine specifically for the database we just created
                engine = get_engine_for_user_db(new_virtual_db.physical_name)
                last_result_dict = {}
                with engine.connect() as connection:
                    with connection.begin(): # Transaction for all subsequent commands
                        for command in sql_commands:
                            last_result_dict = execute_sql(connection, command)
                            if not last_result_dict.get("success"):
                                raise Exception(f"Failed to populate database: {last_result_dict.get('message')}")
                
                result_dict = last_result_dict
                result_dict["message"] = f"Database '{new_virtual_name}' created and populated successfully."
            else:
                # No more commands, just report success for creation
                result_dict = {"success": True, "message": f"Database '{new_virtual_name}' created successfully."}
        
        # --- MODIFIED: Handle other admin commands (DROP, ALTER) which must be solitary ---
        elif sql_commands and any(cmd.strip().upper().startswith(('DROP DATABASE', 'ALTER DATABASE')) for cmd in sql_commands):
            if len(sql_commands) > 1:
                raise HTTPException(status_code=400, detail="Administrative commands (DROP/ALTER DATABASE) cannot be mixed with other queries.")
            
            single_command = sql_commands[0]
            upper_sql = single_command.strip().upper()

            if upper_sql.startswith('DROP DATABASE'):
                # ... (DROP DATABASE logic is unchanged)
                print("INFO: DROP DATABASE command detected. Using superuser engine.")
                virtual_name_to_drop = single_command.split()[2].strip(';"')
                db_to_drop = vdb_service.get_accessible_database(db_session, user=current_user, virtual_name=virtual_name_to_drop)
                if not db_to_drop: raise HTTPException(status_code=404, detail=f"Database '{virtual_name_to_drop}' not found.")
                if db_to_drop.user_id != current_user.user_id: raise HTTPException(status_code=403, detail="Permission denied: Only the database owner can drop a database.")
                vdb_service.delete_virtual_database(db_session, db_to_drop=db_to_drop)
                result_dict = {"success": True, "message": f"Database '{virtual_name_to_drop}' dropped successfully."}

            elif upper_sql.startswith('ALTER DATABASE'):
                # ... (ALTER DATABASE logic is unchanged)
                print("INFO: ALTER DATABASE command detected. Handling rename.")
                match = re.search(r'ALTER DATABASE\s+([\w_]+)\s+RENAME TO\s+([\w_]+);?', single_command.strip(), re.IGNORECASE)
                if not match: raise HTTPException(status_code=400, detail="Could not parse RENAME DATABASE command.")
                old_name, new_name = match.groups()
                try:
                    vdb_service.rename_virtual_database(db_session, owner=current_user, old_virtual_name=old_name, new_virtual_name=new_name)
                    result_dict = {"success": True, "message": f"Database '{old_name}' renamed to '{new_name}' successfully."}
                except (PermissionError, ValueError) as e:
                    raise HTTPException(status_code=400, detail=str(e))
        else:
            # --- STANDARD LOGIC for all other queries (SELECT, INSERT, etc.) ---
            if not sql_commands:
                 raise HTTPException(status_code=400, detail="No SQL command to execute.")

            virtual_db = vdb_service.get_accessible_database(db_session, user=current_user, virtual_name=x_target_database)
            if not virtual_db:
                raise HTTPException(status_code=404, detail=f"Database '{x_target_database}' not found for your account.")
            
            user_role = get_user_role_for_db(db_session, user=current_user, virtual_db=virtual_db)
            is_write_operation = any(
                any(cmd.strip().upper().startswith(keyword) for keyword in ['INSERT', 'UPDATE', 'DELETE', 'CREATE TABLE', 'DROP TABLE', 'ALTER TABLE', 'TRUNCATE'])
                for cmd in sql_commands
            )
            if is_write_operation and not user_has_at_least_role(user_role, DBRole.editor):
                raise HTTPException(status_code=403, detail="Permission denied: You need 'Editor' or 'Owner' role to modify this database.")

            last_result_dict = {}
            if x_transaction_id:
                connection = transaction_manager.get_transaction_connection(x_transaction_id)
                if not connection: raise HTTPException(status_code=404, detail=f"Transaction '{x_transaction_id}' not found or has expired.")
                
                if is_from_cache and params:
                    last_result_dict = execute_sql(connection, sql_commands[0], params=execution_params)
                else:
                    for command in sql_commands:
                        last_result_dict = execute_sql(connection, command)
                if not last_result_dict.get("success"): raise Exception(last_result_dict.get("message", "A command in the transaction failed."))
                result_dict = last_result_dict
            else:
                engine = get_engine_for_user_db(virtual_db.physical_name)
                with engine.connect() as connection:
                    with connection.begin():
                        if is_from_cache and params:
                            last_result_dict = execute_sql(connection, sql_commands[0], params=execution_params)
                        else:
                            for command in sql_commands:
                                last_result_dict = execute_sql(connection, command)
                        if not last_result_dict.get("success"): raise Exception(last_result_dict.get("message", "A command in the sequence failed."))
                result_dict = last_result_dict

    except Exception as e:
        if not params: history_service.log_query_history(db=db_session, owner=current_user, command=request.command, sql=sql_for_display, status="error")
        if isinstance(e, HTTPException): raise e
        raise HTTPException(status_code=400, detail=f"SQL Execution Error: {e}")

    if not result_dict.get("success") and not params:
        history_service.log_query_history(db=db_session, owner=current_user, command=final_prompt, sql=sql_for_display, status="error")
        raise HTTPException(status_code=400, detail=result_dict.get("message", "SQL execution failed."))
    
    if not params: history_service.log_query_history(db=db_session, owner=current_user, command=final_prompt, sql=sql_for_display, status="success")

    response_data = result_dict.get("data")
    final_result_data = None 
    if response_data and "columns" in response_data and "rows" in response_data:
        columns = response_data["columns"]
        rows = response_data["rows"]
        formatted_data = [dict(zip(columns, row)) for row in rows]
        final_result_data = {"columns": columns, "data": formatted_data}
    
    return QueryResponse(
        success=True, 
        message=result_dict.get("message", "Command executed successfully."),
        generated_sql=sql_for_display,
        result=final_result_data
    )

# The /nl endpoint remains unchanged and is correct
@router.post("/nl", response_model=NLResponse, tags=["Query"])
async def process_nl_query(
    request: NLRequest,
    x_target_database: str = Header(..., alias="X-Target-Database"),
    db_session: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user)
):
    """
    Converts a natural language command to SQL for a specific user's database
    without executing it. This is a secure, multi-tenant version.
    """
    virtual_db = vdb_service.get_accessible_database(db_session, user=current_user, virtual_name=x_target_database)
    if not virtual_db:
        raise HTTPException(status_code=404, detail=f"Database '{x_target_database}' not found for your account.")
    
    try:
        engine = get_engine_for_user_db(virtual_db.physical_name)
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Could not connect to database '{x_target_database}': {e}")

    schema_context = generate_schema_as_mermaid(engine)
    structured_response = await convert_nl_to_sql(x_target_database, request.command, schema_context)
    
    if structured_response.get("query_type") == "ERROR":
        raise HTTPException(status_code=400, detail=structured_response.get("explanation", "Failed to process NLP command."))
        
    return structured_response