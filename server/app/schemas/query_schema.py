from pydantic import BaseModel, ConfigDict
from typing import List, Dict, Any, Optional, Union

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
    model_config = ConfigDict(arbitrary_types_allowed=True)
    columns: List[str]
    data: List[Dict[str, Any]]

class QueryResultMetadata(BaseModel):
    rows_affected: int

class QueryResponse(BaseModel):
    success: bool
    message: str
    generated_sql: Optional[str] = None
    result: Optional[Union[QueryResultData, QueryResultMetadata, Dict[str, Any]]] = None

class QueryCommand(BaseModel):
    command: str
    params: Optional[Dict[str, Any]] = None