# app/api/routes/data.py

from fastapi import APIRouter, Depends, HTTPException, Path, Query, Header
from sqlalchemy.engine import Connection, Engine
from sqlalchemy import text, insert, Table, MetaData
from typing import Dict, Tuple

from app.schemas.table_schema import InsertDataRequest, UpdateDataRequest, DeleteDataRequest, StatusResponse
from app.schemas.query_schema import QueryResponse, QueryResultData
from app.schemas.data_schema import StructuredQueryRequest, InsertRequest

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


def build_safe_sql(query: StructuredQueryRequest) -> Tuple[str, Dict]:
    """
    Builds a parameterized SQL query from the structured request
    to prevent SQL injection.
    """
    # WARNING: This is a simplified builder. A real-world one would need
    # more robust validation (e.g., checking for valid column names).
    
    if not query.table.isalnum(): # Basic sanitization
        raise ValueError("Invalid table name")

    params = {}
    param_count = 1

    # SELECT clause
    columns = ", ".join(query.select) if query.select else "*"
    sql = f"SELECT {columns} FROM {query.table}"

    # WHERE clause
    if query.where:
        where_clauses = []
        for col, op, val in query.where:
            if not col.isalnum(): raise ValueError("Invalid column name")
            
            param_name = f"p{param_count}"
            param_count += 1
            
            where_clauses.append(f"{col} {op} :{param_name}")
            params[param_name] = val
        sql += " WHERE " + " AND ".join(where_clauses)
    
    # ORDER BY clause
    if query.order_by:
        order_clauses = [f"{col} {direction}" for col, direction in query.order_by]
        sql += " ORDER BY " + ", ".join(order_clauses)

    # LIMIT and OFFSET
    if query.limit is not None:
        sql += " LIMIT :limit"
        params["limit"] = query.limit
    if query.offset is not None:
        sql += " OFFSET :offset"
        params["offset"] = query.offset
        
    return sql, params


@router.post("/query", tags=["Data"])
async def execute_structured_query(
    request: StructuredQueryRequest,
    x_target_database: str = Header(..., alias="X-Target-Database")
):
    engine = get_engine(x_target_database)
    sql_command, params = build_safe_sql(request)
    
    with engine.connect() as connection:
        result = connection.execute(text(sql_command), params)
        columns = result.keys()
        data = [dict(zip(columns, row)) for row in result.fetchall()]
        
    return {"data": data}

@router.post("/{table_name}/insert", tags=["Data"])
async def insert_data(
    table_name: str,
    request: InsertRequest,
    x_target_database: str = Header(..., alias="X-Target-Database")
):
    """
    Inserts one or more rows into a specified table.
    This uses an efficient bulk insert method.
    """
    if not table_name.isalnum():
        raise HTTPException(status_code=400, detail="Invalid table name.")
    if not request.data:
        return {"message": "No data provided to insert.", "rows_affected": 0}

    engine = get_engine(x_target_database)

    if not request.data[0]:
        raise HTTPException(status_code=400, detail="Cannot insert empty row data.")
    columns = request.data[0].keys()
    
    column_str = ", ".join(f'"{col}"' for col in columns)
    
    param_str = ", ".join(f":{col}" for col in columns)
    
    sql = f"INSERT INTO {table_name} ({column_str}) VALUES ({param_str})"
    
    try:
         with engine.connect() as connection:
            with connection.begin():
                result = connection.execute(text(sql), request.data)
            
            return {
                "message": f"Successfully inserted {result.rowcount} row(s) into '{table_name}'.",
                "rows_affected": result.rowcount
            }
    except Exception as e:
        # Catch errors like missing columns, constraint violations, etc.
        raise HTTPException(status_code=400, detail=f"Failed to insert data: {e}")