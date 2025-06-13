from fastapi import APIRouter, Depends, HTTPException, Path, Query
# Import Engine
from sqlalchemy.engine import Connection, Engine

from app.schemas.table_schema import InsertDataRequest, UpdateDataRequest, DeleteDataRequest, StatusResponse
from app.schemas.query_schema import QueryResponse

from app.services import sql_builder
from app.core.sql_executor import execute_sql
# Import get_engine
from app.db.session import get_db_connection
from app.db.engine import get_engine

router = APIRouter()

@router.get("/table/{table_name}", response_model=QueryResponse, tags=["Data"])
async def get_table_data(
    table_name: str = Path(...),
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    connection: Connection = Depends(get_db_connection),
    engine: Engine = Depends(get_engine) # CHANGED: Added engine dependency
):
    # CHANGED: Passed engine to the quote function
    safe_table_name = sql_builder.quote(table_name, engine)
    
    # CHANGED: Made SQL string more robust for PostgreSQL by specifying the public schema
    sql = f'SELECT * FROM "public".{safe_table_name} LIMIT {limit} OFFSET {offset};'
    
    result = execute_sql(connection, sql)
    if not result["success"]:
        raise HTTPException(status_code=404, detail=result["message"])
    return QueryResponse(success=True, message=result["message"], result=result["data"])

@router.post("/insert", response_model=StatusResponse, tags=["Data"])
async def insert_data(
    request: InsertDataRequest, 
    connection: Connection = Depends(get_db_connection),
    engine: Engine = Depends(get_engine) # CHANGED: Added engine dependency
):
    if not request.data:
        raise HTTPException(status_code=400, detail="No data provided for insertion.")
        
    # CHANGED: Passed engine to the builder function
    sql, params_list = sql_builder.build_insert_sql(request.table_name, request.data, engine)
    
    rows_affected = 0
    for params in params_list:
        result = execute_sql(connection, sql, params)
        if not result["success"]:
            raise HTTPException(status_code=400, detail=result["message"])
        rows_affected += result.get("rowcount", 1)
        
    return StatusResponse(message=f"Successfully inserted {rows_affected} row(s).")

@router.put("/update", response_model=StatusResponse, tags=["Data"])
async def update_data(
    request: UpdateDataRequest, 
    connection: Connection = Depends(get_db_connection),
    engine: Engine = Depends(get_engine) # CHANGED: Added engine dependency
):
    # CHANGED: Passed engine to the builder function
    sql, params = sql_builder.build_update_sql(request.table_name, request.data, request.conditions, engine)
    
    result = execute_sql(connection, sql, params)
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["message"])
    return StatusResponse(message=result["message"])

@router.delete("/delete", response_model=StatusResponse, tags=["Data"])
async def delete_data(
    request: DeleteDataRequest, 
    connection: Connection = Depends(get_db_connection),
    engine: Engine = Depends(get_engine) # CHANGED: Added engine dependency
):
    # CHANGED: Passed engine to the builder function
    sql, params = sql_builder.build_delete_sql(request.table_name, request.conditions, engine)
    
    result = execute_sql(connection, sql, params)
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["message"])
    return StatusResponse(message=result["message"])