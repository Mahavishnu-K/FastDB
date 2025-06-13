from pydantic import BaseModel
from typing import List, Dict, Any, Optional

class NLRequest(BaseModel):
    command: str

class ExtractedValues(BaseModel):
    text_values: List[str]
    numeric_values: List[float]
    date_values: List[str]
    conditions: List[str]

# This schema matches the rich JSON output from nlp_engine
class NLResponse(BaseModel):
    sql: str
    query_type: str
    complexity: str
    tables_referenced: List[str]
    explanation: str
    extracted_values: ExtractedValues

class ExecuteRequest(BaseModel):
    sql: str

class QueryResultData(BaseModel):
    columns: List[str]
    data: List[Dict[str, Any]]

class QueryResponse(BaseModel):
    success: bool
    message: str
    result: Optional[QueryResultData] = None