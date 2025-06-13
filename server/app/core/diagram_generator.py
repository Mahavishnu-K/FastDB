from sqlalchemy import inspect
from sqlalchemy.engine import Engine
import logging

logger = logging.getLogger(__name__)

def generate_schema_as_mermaid(engine: Engine) -> str:
    """
    Generates an accurate Mermaid.js ER diagram string from the schema,
    including table columns, primary keys, and foreign key relationships.
    """
    try:
        inspector = inspect(engine)
        table_names = inspector.get_table_names()

        if not table_names:
            return "erDiagram\n    %% No tables found in the database. %%"

        mermaid_string = "erDiagram\n"
        
        # First, define all entities (tables and their columns)
        for table_name in table_names:
            mermaid_string += f'    {table_name} {{\n'
            pk_constraint = inspector.get_pk_constraint(table_name)
            primary_keys = pk_constraint.get('constrained_columns', [])
            
            for col in inspector.get_columns(table_name):
                pk_str = " PK" if col["name"] in primary_keys else ""
                fk_str = " FK" if any(fk['constrained_columns'][0] == col['name'] for fk in inspector.get_foreign_keys(table_name)) else ""
                
                # Use a generic type for simplicity in the diagram
                col_type = str(col['type']).split('(')[0]
                mermaid_string += f'        {col_type} {col["name"]}{pk_str}{fk_str}\n'
            mermaid_string += '    }\n\n'
        
        # Second, define all relationships based on actual foreign keys
        for table_name in table_names:
            foreign_keys = inspector.get_foreign_keys(table_name)
            for fk in foreign_keys:
                # Get the source and target tables and columns
                from_table = table_name
                to_table = fk['referred_table']
                from_column = fk['constrained_columns'][0]
                to_column = fk['referred_columns'][0]

                # Mermaid relationship syntax: Table1 ||--o{ Table2 : "label"
                # This denotes a one-to-many relationship.
                mermaid_string += f'    {to_table} ||--o{{ {from_table} : "{from_column} to {to_column}"\n'

        return mermaid_string
        
    except Exception as e:
        logger.error(f"Failed to generate Mermaid diagram: {e}")
        return f"erDiagram\n    ERROR[\"Failed to generate diagram: {str(e)}\"]"