# app/api/routes/data.py
from fastapi import APIRouter, Depends, HTTPException, Path, Query, Header
from sqlalchemy import text, insert, Table, MetaData
from typing import Dict, Tuple

from app.schemas.table_schema import InsertDataRequest, UpdateDataRequest, DeleteDataRequest, StatusResponse
from app.schemas.query_schema import QueryResponse, QueryResultData
from app.schemas.data_schema import StructuredQueryRequest, InsertRequest
from app.core.security import get_current_user
from app.models.user_model import User
from app.db.session import get_db_session
from app.db.engine import get_engine_for_user_db
from app.services import virtual_database_service as vdb_service
from sqlalchemy.orm import Session

from app.services import sql_builder

router = APIRouter()

def build_safe_sql(query: StructuredQueryRequest) -> Tuple[str, Dict]:
    """
    Builds a parameterized SQL query from the structured request.
    This version quotes identifiers for safety against reserved words.
    """
    if not query.table.isidentifier():
        raise ValueError("Invalid table name")

    params = {}
    param_count = 1
    
    # Quote column names for safety
    columns = ", ".join(f'"{c}"' for c in query.select) if query.select else "*"
    # Quote table name
    sql = f'SELECT {columns} FROM "{query.table}"'

    if query.where:
        where_clauses = []
        for col, op, val in query.where:
            if not col.isidentifier(): raise ValueError(f"Invalid column name: {col}")
            # Basic validation for operator to prevent injection
            if op.upper() not in ['=', '!=', '>', '<', '>=', '<=', 'IN', 'LIKE', 'NOT LIKE', 'IS', 'IS NOT']:
                raise ValueError(f"Invalid operator: {op}")

            param_name = f"p{param_count}"
            param_count += 1
            where_clauses.append(f'"{col}" {op} :{param_name}')
            params[param_name] = val
        sql += " WHERE " + " AND ".join(where_clauses)
    
    if query.order_by:
        order_clauses = []
        for col, direction in query.order_by:
            if not col.isidentifier(): raise ValueError(f"Invalid column name: {col}")
            if direction.lower() not in ['asc', 'desc']: raise ValueError(f"Invalid order direction: {direction}")
            order_clauses.append(f'"{col}" {direction.upper()}')
        sql += " ORDER BY " + ", ".join(order_clauses)

    if query.limit is not None:
        sql += " LIMIT :limit"
        params["limit"] = query.limit
    if query.offset is not None:
        sql += " OFFSET :offset"
        params["offset"] = query.offset
        
    return sql, params


@router.post("/query", response_model=QueryResponse, tags=["Data (Fluent Builder)"])
async def execute_structured_query(
    request: StructuredQueryRequest,
    x_target_database: str = Header(..., alias="X-Target-Database"),
    db_session: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user)
):
    """
    Securely executes a structured query from the fluent builder.
    """
    virtual_db = vdb_service.get_db_by_virtual_name(db_session, owner=current_user, virtual_name=x_target_database)
    if not virtual_db:
        raise HTTPException(status_code=404, detail=f"Database '{x_target_database}' not found.")
    
    engine = get_engine_for_user_db(virtual_db.physical_name)
    
    try:
        sql_command, params = build_safe_sql(request)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    with engine.connect() as connection:
        result = connection.execute(text(sql_command), params)
        columns = [str(key) for key in result.keys()]
        data = [dict(zip(columns, row)) for row in result.fetchall()]
        
    # Correctly structure the response to match QueryResponse and QueryResultData
    query_result = QueryResultData(columns=columns, data=data)
    return QueryResponse(
        success=True,
        message="Query executed successfully.",
        result=query_result
    )

@router.post("/{table_name}/insert", response_model=QueryResponse, tags=["Data (Fluent Builder)"])
async def insert_data_into_table(
    request: InsertRequest, 
    table_name: str = Path(...),
    x_target_database: str = Header(..., alias="X-Target-Database"),
    db_session: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user)
):
    """
    Securely inserts one or more rows into a specified table.
    """
    if not table_name.isidentifier():
        raise HTTPException(status_code=400, detail="Invalid table name.")
    if not request.data:
        return QueryResponse(success=True, message="No data provided to insert.", result={"rows_affected": 0})

    virtual_db = vdb_service.get_db_by_virtual_name(db_session, owner=current_user, virtual_name=x_target_database)
    if not virtual_db:
        raise HTTPException(status_code=404, detail=f"Database '{x_target_database}' not found.")
    
    engine = get_engine_for_user_db(virtual_db.physical_name)
    
    # Use SQLAlchemy Core for safe, efficient bulk inserts
    from sqlalchemy import table, column
    
    try:
        # Dynamically create a table object based on the first data row
        columns = [column(c) for c in request.data[0].keys()]
        target_table = table(table_name, *columns)
        
        with engine.connect() as connection:
            with connection.begin():
                result = connection.execute(target_table.insert(), request.data)
            
            # The response now perfectly matches the QueryResponse schema
            return QueryResponse(
                success=True,
                message=f"Successfully inserted {result.rowcount} row(s) into '{table_name}'.",
                result={"rows_affected": result.rowcount}
            )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to insert data: {e}")
    
@router.get("/table/{table_name}", response_model=QueryResponse, tags=["Data (Client App)"])
async def get_table_data(
    table_name: str = Path(...),
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    x_target_database: str = Header(..., alias="X-Target-Database"),
    db_session: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user)
):
    """
    Securely gets paginated data from a specific table for the authenticated user.
    """
    if not table_name.isidentifier():
        raise HTTPException(status_code=400, detail="Invalid table name.")

    virtual_db = vdb_service.get_db_by_virtual_name(db_session, owner=current_user, virtual_name=x_target_database)
    if not virtual_db:
        raise HTTPException(status_code=404, detail=f"Database '{x_target_database}' not found.")
    
    engine = get_engine_for_user_db(virtual_db.physical_name)
    
    with engine.connect() as connection:
        # Check for table existence
        inspector = connection.connection.connection.cursor().connection.info.backend_interface.get_inspector(connection)
        if not inspector.has_table(table_name):
             raise HTTPException(status_code=404, detail=f"Table '{table_name}' not found.")

        # Safely build and execute the query
        safe_table_name = f'"{table_name}"' # Simple quoting for identifiers
        sql = text(f'SELECT * FROM {safe_table_name} LIMIT :limit OFFSET :offset')
        result = connection.execute(sql, {"limit": limit, "offset": offset})
        
        columns = [str(key) for key in result.keys()]
        data = [dict(zip(columns, row)) for row in result.fetchall()]
        
    query_result = QueryResultData(columns=columns, data=data)
    return QueryResponse(success=True, message="Data retrieved successfully.", result=query_result)

@router.put("/update", response_model=StatusResponse, tags=["Data (Client App)"])
async def update_data(
    request: UpdateDataRequest,
    x_target_database: str = Header(..., alias="X-Target-Database"),
    db_session: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user)
):
    """Securely updates data in a table based on conditions."""
    virtual_db = vdb_service.get_db_by_virtual_name(db_session, owner=current_user, virtual_name=x_target_database)
    if not virtual_db:
        raise HTTPException(status_code=404, detail=f"Database '{x_target_database}' not found.")
    
    engine = get_engine_for_user_db(virtual_db.physical_name)
    
    try:
        sql, params = sql_builder.build_update_sql(request.table_name, request.data, request.conditions, engine)
        with engine.connect() as connection:
            with connection.begin():
                result = connection.execute(text(sql), params)
        message = f"Successfully updated {result.rowcount} row(s)."
        if result.rowcount == 0:
            message = "Query executed, but no rows matched the conditions."
        return StatusResponse(message=message)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/delete", response_model=StatusResponse, tags=["Data (Client App)"])
async def delete_data(
    request: DeleteDataRequest,
    x_target_database: str = Header(..., alias="X-Target-Database"),
    db_session: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user)
):
    """Securely deletes data from a table based on conditions."""
    virtual_db = vdb_service.get_db_by_virtual_name(db_session, owner=current_user, virtual_name=x_target_database)
    if not virtual_db:
        raise HTTPException(status_code=404, detail=f"Database '{x_target_database}' not found.")
    
    engine = get_engine_for_user_db(virtual_db.physical_name)
    
    try:
        sql, params = sql_builder.build_delete_sql(request.table_name, request.conditions, engine)
        with engine.connect() as connection:
            with connection.begin():
                result = connection.execute(text(sql), params)
        message = f"Successfully deleted {result.rowcount} row(s)."
        if result.rowcount == 0:
            message = "Query executed, but no rows matched the conditions."
        return StatusResponse(message=message)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))