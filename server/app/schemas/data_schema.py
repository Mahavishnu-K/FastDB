# server/app/schemas/data_schema.py
from pydantic import BaseModel
from typing import List, Dict, Any, Optional, Tuple

class StructuredQueryRequest(BaseModel):
    table: str
    select: Optional[List[str]] = None
    where: Optional[List[Tuple[str, str, Any]]] = None
    order_by: Optional[List[Tuple[str, str]]] = None
    limit: Optional[int] = None
    offset: Optional[int] = 0

class InsertRequest(BaseModel):
    data: List[Dict[str, Any]]