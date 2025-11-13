from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .api.api import api_router
from .api.routes.auth import auth_router
from .api.routes import health 

from fastapi import Request
from fastapi.responses import JSONResponse

from datetime import date
from decimal import Decimal

custom_json_encoders = {
    Decimal: lambda v: float(v),
    date: lambda v: v.isoformat(),
}

app = FastAPI(
    title="FastDB - Natural Language Database Manager",
    json_encoders=custom_json_encoders,
    description="An API for converting natural language to SQL and managing a database.",
    version="1.0.0"
)

# Configure CORS for your React frontend
origins = [
    "http://localhost",
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:5173", # Default for Vite
    "http://localhost:5174", 
    "http://localhost:5175", 
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*", "X-Target-Database"],
    expose_headers=["*"],
)

@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    # Print the full traceback to your console
    import traceback
    traceback.print_exc()
    
    return JSONResponse(
        status_code=500,
        content={"message": f"An unexpected error occurred: {exc}"},
    )

# Include the main API router
app.include_router(api_router, prefix="/api")
app.include_router(auth_router, prefix="/auth", tags=["Authentication"])

app.include_router(health.router) 

@app.get("/", tags=["Root"])
async def read_root():
    return {"message": "Welcome to the FastDB API."}