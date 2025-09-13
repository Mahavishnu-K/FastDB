# app/services/template_cache_service.py
import hashlib
from sqlalchemy.orm import Session
from typing import List, Tuple

from app.models.query_template_model import QueryTemplate
from app.models.user_model import User
from app.utils.caching_utils import normalize_prompt_template

def _create_template_id(user: User, normalized_prompt: str) -> str:
    """Creates a consistent, hash-based ID for a template."""
    return hashlib.sha256(f"{user.user_id}:{normalized_prompt}".encode()).hexdigest()

def find_template_in_cache(db: Session, *, user: User, prompt_template: str) -> Tuple[QueryTemplate | None, List[str]]:
    """
    Finds a query template using a normalized version of the prompt.
    Returns the template object and the list of original parameter names from the prompt.
    """
    normalized_prompt, original_param_names = normalize_prompt_template(prompt_template)
    template_id = _create_template_id(user, normalized_prompt)
    template = db.query(QueryTemplate).filter_by(id=template_id).first()
    return template, original_param_names

def save_template_to_cache(
    db: Session,
    *,
    user: User,
    prompt_template: str,
    sql_template: str,
    param_map: List[str]
) -> QueryTemplate:
    """Saves a new template to the cache."""
    normalized_prompt, _ = normalize_prompt_template(prompt_template)
    template_id = _create_template_id(user, normalized_prompt)
    
    new_template = QueryTemplate(
        id=template_id,
        user_id=user.user_id,
        normalized_prompt=normalized_prompt,
        sql_template=sql_template,
        original_param_map=param_map
    )
    db.add(new_template)
    db.commit()
    db.refresh(new_template)
    return new_template