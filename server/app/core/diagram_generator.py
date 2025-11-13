from sqlalchemy import inspect
from sqlalchemy.engine import Engine
import logging
import re

logger = logging.getLogger(__name__)

def sanitize_identifier(name: str) -> str:
    """
    Convert SQL identifiers into Mermaid-safe identifiers:
    - Replace spaces/dashes and special chars with underscores
    - Remove quotes
    - Prefix with '_' if it starts with a number
    """
    safe = re.sub(r'[^a-zA-Z0-9_]', '_', name)
    if safe[0].isdigit():
        safe = f'_{safe}'
    return safe

def generate_schema_as_mermaid(engine: Engine) -> str:
    """
    Generates an accurate Mermaid.js ER diagram string from the schema,
    including:
    - Table columns
    - Primary keys (PK)
    - Foreign keys (FK, including composite FKs)
    - Original names preserved as labels
    """
    try:
        inspector = inspect(engine)
        table_names = inspector.get_table_names()

        if not table_names:
            return "erDiagram\n    %% No tables found in the database. %%"

        mermaid_string = "erDiagram\n"
        
        # Define all entities (tables + columns)
        for table_name in table_names:
            safe_table = sanitize_identifier(table_name)
            mermaid_string += f"\n    {safe_table} {{\n"

            # Collect primary keys
            pk_constraint = inspector.get_pk_constraint(table_name)
            primary_keys = pk_constraint.get("constrained_columns", [])

            # Collect foreign keys once per table
            foreign_keys = inspector.get_foreign_keys(table_name)
            fk_columns = {
                fk["constrained_columns"][0]
                for fk in foreign_keys
                if fk["constrained_columns"]
            }

            for col in inspector.get_columns(table_name):
                safe_col = sanitize_identifier(col["name"])
                col_type = str(col["type"]).split("(")[0] or "UNKNOWN"
                
                # Handle modifiers - only one per column!
                if col["name"] in primary_keys and col["name"] in fk_columns:
                    # If column is both PK and FK, prioritize PK
                    mermaid_string += f"        {col_type} {safe_col} PK\n"
                elif col["name"] in primary_keys:
                    mermaid_string += f"        {col_type} {safe_col} PK\n"
                elif col["name"] in fk_columns:
                    mermaid_string += f"        {col_type} {safe_col} FK\n"
                else:
                    mermaid_string += f"        {col_type} {safe_col}\n"

            mermaid_string += "    }\n"

        mermaid_string += "\n"  # extra line after all entities

        # --- Define relationships ---
        for table_name in table_names:
            foreign_keys = inspector.get_foreign_keys(table_name)
            for fk in foreign_keys:
                if not fk["constrained_columns"] or not fk["referred_columns"]:
                    continue  # skip malformed FK

                from_table = sanitize_identifier(table_name)
                to_table = sanitize_identifier(fk["referred_table"])
                from_column = fk["constrained_columns"][0]
                to_column = fk["referred_columns"][0]

                mermaid_string += (
                    f'    {to_table} ||--o{{ {from_table} : "{from_column} to {to_column}"\n'
                )

        return mermaid_string

    except Exception as e:
        logger.error(f"Failed to generate Mermaid diagram: {e}")
        return f'erDiagram\n    ERROR["Failed to generate diagram: {str(e)}"]'