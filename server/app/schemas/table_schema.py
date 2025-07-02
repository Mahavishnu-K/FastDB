from pydantic import BaseModel
from typing import List, Dict, Any, Optional

class StatusResponse(BaseModel):
    message: str

class ColumnDefinition(BaseModel):
    name: str
    type: str
    primary_key: Optional[bool] = False
    nullable: Optional[bool] = True
    default: Optional[str] = None

class CreateTableRequest(BaseModel):
    table_name: str
    columns: List[ColumnDefinition]

class InsertDataRequest(BaseModel):
    table_name: str
    data: List[Dict[str, Any]]

class UpdateDataRequest(BaseModel):
    table_name: str
    data: Dict[str, Any]
    conditions: Dict[str, Any]

class DeleteDataRequest(BaseModel):
    table_name: str
    conditions: Dict[str, Any]

class ColumnSchema(BaseModel):
    name: str
    type: str
    is_nullable: bool
    is_primary_key: bool
    default: Optional[Any] = None

class TableSchema(BaseModel):
    name: str
    columns: List[ColumnSchema]
    row_count: int

class FullSchemaResponse(BaseModel):
    tables: List[TableSchema]