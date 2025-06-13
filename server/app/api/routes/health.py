from fastapi import APIRouter
from app.schemas.table_schema import StatusResponse

router = APIRouter()

@router.get("/health", response_model=StatusResponse, tags=["Health"])
async def health_check():
    return {"message": "API is running"}