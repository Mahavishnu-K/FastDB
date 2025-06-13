from fastapi import APIRouter
from .routes import health, query, schema, data, history 

api_router = APIRouter()

api_router.include_router(health.router) # No prefix needed for a single /health route
api_router.include_router(query.router, prefix="/query")
api_router.include_router(schema.router, prefix="/schema")
api_router.include_router(data.router, prefix="/data")
api_router.include_router(history.router, prefix="/history")