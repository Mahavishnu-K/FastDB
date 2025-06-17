from sqlalchemy.engine import Connection
from sqlalchemy import text, inspect
from sqlalchemy.exc import SQLAlchemyError, DBAPIError

def execute_sql(connection: Connection, sql: str, params: dict = None):
    """
    Executes a given SQL query with parameters and returns a structured result.
    This version has robust error handling for all exception types.
    """
    if params is None:
        params = {}

    try:
        # Execute the query using text() to handle parameters safely
        result_proxy = connection.execute(text(sql), params)
        
        # For statements that return rows (SELECT)
        if result_proxy.returns_rows:
            columns = list(result_proxy.keys())
            rows = [list(row) for row in result_proxy.fetchall()]
            data = {"columns": columns, "rows": rows}
            message = f"Query executed successfully. {len(rows)} row(s) returned."
            return {"success": True, "message": message, "data": data}
        
        # For statements that don't return rows (INSERT, UPDATE, DELETE)
        else:
            message = f"Query executed successfully. {result_proxy.rowcount} row(s) affected."
            return {"success": True, "message": message, "rowcount": result_proxy.rowcount}

    except (SQLAlchemyError, DBAPIError) as e:
        # --- THE FIX IS HERE ---
        # We now safely convert ANY exception 'e' to a string.
        # This will never crash, regardless of the exception type.
        error_message = str(e)
        
        # A common pattern is that the actual error is in the 'orig' attribute, if it exists.
        # This is a safer way to check for it.
        if hasattr(e, 'orig') and e.orig:
            # Get the specific error message from the database driver
            error_message = str(e.orig).strip()

        return {"success": False, "message": error_message}