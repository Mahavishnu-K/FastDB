# app/api/routes/data.py

from fastapi import APIRouter, Depends, HTTPException, Path, Query
from sqlalchemy.engine import Connection, Engine
from sqlalchemy import text

from app.schemas.table_schema import InsertDataRequest, UpdateDataRequest, DeleteDataRequest, StatusResponse
from app.schemas.query_schema import QueryResponse, QueryResultData
from app.services import sql_builder
from app.core.sql_executor import execute_sql
from app.db.session import get_engine, get_db_connection

router = APIRouter()

@router.get("/table/{table_name}", response_model=QueryResponse, tags=["Data"])
async def get_table_data(
    table_name: str = Path(...),
    engine: Engine = Depends(get_engine),
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0)
):
    """
    Gets data from a table and formats it as a list of dictionaries.
    """
    with engine.connect() as connection:
        table_exists_query = text(
            "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = :table)"
        )
        table_exists = connection.execute(table_exists_query, {"table": table_name}).scalar()

        if not table_exists:
            current_db = connection.execute(text("SELECT current_database()")).scalar()
            raise HTTPException(
                status_code=404,
                detail=f"Table '{table_name}' not found in database '{current_db}'"
            )

        safe_table_name = sql_builder.quote(table_name, engine)
        sql = f'SELECT * FROM public.{safe_table_name} LIMIT {limit} OFFSET {offset};'
        result_dict = execute_sql(connection, sql)

    if not result_dict.get("success"):
        raise HTTPException(status_code=400, detail=result_dict.get("message", "Query failed."))

    raw_data = result_dict.get("data")
    if raw_data and "columns" in raw_data and "rows" in raw_data:
        # --- THIS IS THE NEW LOGIC TO MATCH YOUR SCHEMA ---
        columns = raw_data["columns"]
        rows = raw_data["rows"]
        
        # Transform the list of lists into a list of dictionaries
        formatted_data = [dict(zip(columns, row)) for row in rows]
        
        # Create the Pydantic model with the correctly formatted data
        query_result_data = QueryResultData(columns=columns, data=formatted_data)
        # ------------------------------------------------
        
        return QueryResponse(success=True, message="Data retrieved successfully.", result=query_result_data)
    else:
        # Return a valid empty structure if no data
        return QueryResponse(success=True, message="Query executed, table is empty.", result=QueryResultData(columns=[], data=[]))


# The other endpoints do not return table data, so they don't need this transformation logic.
# They are correct as is.
@router.post("/insert", response_model=StatusResponse, tags=["Data"])
async def insert_data(
    request: InsertDataRequest,
    connection: Connection = Depends(get_db_connection),
    engine: Engine = Depends(get_engine)
):
    if not request.data:
        raise HTTPException(status_code=400, detail="No data provided for insertion.")
    
    with connection.begin() as transaction:
        try:
            sql, params_list = sql_builder.build_insert_sql(request.table_name, request.data, engine)
            rows_affected = 0
            for params in params_list:
                result = execute_sql(connection, sql, params)
                if not result["success"]:
                    raise Exception(result["message"])
                rows_affected += result.get("rowcount", 1)
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))
    
    return StatusResponse(message=f"Successfully inserted {rows_affected} row(s).")


@router.put("/update", response_model=StatusResponse, tags=["Data"])
async def update_data(
    request: UpdateDataRequest,
    connection: Connection = Depends(get_db_connection),
    engine: Engine = Depends(get_engine)
):
    with connection.begin() as transaction:
        try:
            sql, params = sql_builder.build_update_sql(request.table_name, request.data, request.conditions, engine)
            result = execute_sql(connection, sql, params)
            if not result["success"]:
                raise Exception(result["message"])
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))

    return StatusResponse(message=result["message"])


@router.delete("/delete", response_model=StatusResponse, tags=["Data"])
async def delete_data(
    request: DeleteDataRequest,
    connection: Connection = Depends(get_db_connection),
    engine: Engine = Depends(get_engine)
):
    with connection.begin() as transaction:
        try:
            sql, params = sql_builder.build_delete_sql(request.table_name, request.conditions, engine)
            result = execute_sql(connection, sql, params)
            if not result["success"]:
                raise Exception(result["message"])
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))

    return StatusResponse(message=result["message"])