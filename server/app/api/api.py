from fastapi import APIRouter, Depends
from .routes import query, schema, data, history, database, transaction
from app.core.security import get_api_key

api_router = APIRouter(dependencies=[Depends(get_api_key)])

api_router.include_router(query.router, prefix="/query")
api_router.include_router(schema.router, prefix="/schema")
api_router.include_router(data.router, prefix="/data")
api_router.include_router(history.router, prefix="/history")
api_router.include_router(database.router, prefix="/databases")

api_router.include_router(transaction.router, prefix="/transaction", tags=["Transaction"])