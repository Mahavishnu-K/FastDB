# server/app/services/sql_builder.py (Corrected)
from sqlalchemy.engine import Engine

def quote(identifier: str, engine: Engine) -> str:
    """
    Safely quotes a SQL identifier (like a table or column name)
    according to the dialect of the provided database engine.
    """
    return engine.dialect.identifier_preparer.quote(identifier)

def build_insert_sql(table_name: str, data_list: list, engine: Engine):
    """Generates an INSERT SQL statement and parameters."""
    cols = data_list[0].keys()
    col_names = f"({', '.join([quote(c, engine) for c in cols])})"
    
    val_placeholders = f"({', '.join([':' + c for c in cols])})"
    
    sql = f"INSERT INTO {quote(table_name, engine)} {col_names} VALUES {val_placeholders};"
    return sql, data_list

def build_update_sql(table_name: str, data: dict, conditions: dict, engine: Engine):
    """Generates an UPDATE SQL statement and parameters."""
    set_clauses = [f"{quote(k, engine)} = :data_{k}" for k in data.keys()]
    where_clauses = [f"{quote(k, engine)} = :cond_{k}" for k in conditions.keys()]
    params = {f"data_{k}": v for k, v in data.items()}
    params.update({f"cond_{k}": v for k, v in conditions.items()})
    sql = f"UPDATE {quote(table_name, engine)} SET {', '.join(set_clauses)} WHERE {' AND '.join(where_clauses)};"
    return sql, params

def build_delete_sql(table_name: str, conditions: dict, engine: Engine):
    """Generates a DELETE SQL statement and parameters."""
    where_clauses = [f"{quote(k, engine)} = :{k}" for k in conditions.keys()]
    sql = f"DELETE FROM {quote(table_name, engine)} WHERE {' AND '.join(where_clauses)};"
    return sql, conditions