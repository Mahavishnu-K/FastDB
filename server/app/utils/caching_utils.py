# app/core/utils.py
import re
from typing import Tuple, List, Dict, Any

def normalize_prompt_template(prompt: str) -> Tuple[str, List[str]]:
    """
    Normalizes a prompt by replacing named placeholders like {name} with
    generic ones like {param_0}, and returns the original names in order.
    """
    original_param_names = re.findall(r"\{(\w+)\}", prompt)
    
    normalized_prompt = prompt
    for i, name in enumerate(original_param_names):
        normalized_prompt = normalized_prompt.replace(f"{{{name}}}", f"{{param_{i}}}")
        
    return normalized_prompt, original_param_names

def deconstruct_sql(
    llm_response: Dict[str, Any], 
    original_params: Dict[str, Any],
    original_param_names_in_order: List[str]
) -> Tuple[str, List[str]]:
    """
    Deconstructs a generated SQL query into a named-parameter template.
    Returns the SQL template and the original parameter map (for storage).
    """
    sql = llm_response.get('sql', '')
    
    # Create a mapping from the literal value back to its generic placeholder name
    placeholder_to_value_map = {
        f":param_{i}": original_params.get(key)
        for i, key in enumerate(original_param_names_in_order)
        if original_params.get(key) is not None
    }

    sql_template = sql
    sorted_items = sorted(
        placeholder_to_value_map.items(),
        key=lambda item: len(str(item[1])),
        reverse=True
    )

    for placeholder, value in sorted_items:
        str_value = str(value)
        escaped_value = re.escape(str_value)

        # Regex with named groups for clarity
        pattern = re.compile(
            # LIKE/ILIKE pattern with wildcards
            f"'(?P<leading>[%_]*){escaped_value}(?P<trailing>[%_]*)'|"
            # Exact quoted string
            f"'(?P<quoted>{escaped_value})'|"
            # Standalone numeric/boolean/word
            f"\\b(?P<bare>{escaped_value})\\b"
        )

        def replacer(match):
            if match.group("leading") is not None or match.group("trailing") is not None:
                leading = match.group("leading") or ""
                trailing = match.group("trailing") or ""
                return f"'{leading}' || {placeholder} || '{trailing}'"
            elif match.group("quoted") is not None:
                return placeholder
            elif match.group("bare") is not None:
                return placeholder
            return match.group(0)  # fallback, shouldn't hit

        sql_template = pattern.sub(replacer, sql_template)
    
    return sql_template, original_param_names_in_order