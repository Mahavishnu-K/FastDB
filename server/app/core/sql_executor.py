from sqlalchemy.engine import Connection
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
import logging

logger = logging.getLogger(__name__)

def execute_sql(connection: Connection, sql_query: str, params: dict = None):
    """
    Executes a given SQL query with optional parameters and returns the result.
    """
    try:
        with connection.begin() as transaction:
            result_proxy = connection.execute(text(sql_query), params or {})
            
            if result_proxy.returns_rows:
                columns = list(result_proxy.keys())
                data = [dict(row) for row in result_proxy.mappings()]
                message = f"Query executed successfully. {len(data)} rows returned."
                return {"success": True, "message": message, "data": {"columns": columns, "data": data}}
            else:
                message = f"Query executed successfully. {result_proxy.rowcount} rows affected."
                return {"success": True, "message": message, "data": None, "rowcount": result_proxy.rowcount}
    except SQLAlchemyError as e:
        logger.error(f"SQLAlchemyError executing query: {e}")
        # Return a user-friendly version of the error
        return {"success": False, "message": str(e.orig), "data": None}
    except Exception as e:
        logger.error(f"An unexpected error occurred: {e}")
        return {"success": False, "message": f"An unexpected error occurred: {e}", "data": None}