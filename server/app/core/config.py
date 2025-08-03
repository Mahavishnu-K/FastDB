from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    OPENAI_API_KEY: str
    OPENAI_BASE_URL: str
    OPENAI_MODEL_NAME: str
    POSTGRES_USER: str
    POSTGRES_PASSWORD: str
    POSTGRES_SERVER: str
    POSTGRES_PORT: int 
    POSTGRES_DB: str

    POSTGRES_SUPERUSER: str
    POSTGRES_SUPERUSER_PASSWORD: str
    POSTGRES_MAINTENANCE_DB: str = "postgres" 
    
    JWTSECRET_KEY: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 2880
    ALGORITHM: str = "HS256"
    
    model_config = SettingsConfigDict(env_file=".env")

settings = Settings()

print("--- SETTINGS LOADED BY Pydantic ---")
print(f"Host: {settings.POSTGRES_SERVER}")
print(f"Port: {settings.POSTGRES_PORT}")
print(f"User: {settings.POSTGRES_USER}")
print(f"DB Name: {settings.POSTGRES_DB}")
print("---------------------------------")