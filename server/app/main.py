from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .api.api import api_router

app = FastAPI(
    title="FastDB - Natural Language Database Manager",
    description="An API for converting natural language to SQL and managing a database.",
    version="1.0.0"
)

# Configure CORS for your React frontend
origins = [
    "http://localhost:3000",
    "http://localhost:5173", # Default for Vite
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include the main API router
app.include_router(api_router, prefix="/api")

@app.get("/", tags=["Root"])
async def read_root():
    return {"message": "Welcome to the FastDB API. Go to /docs for documentation."}