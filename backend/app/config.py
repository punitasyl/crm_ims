from pydantic_settings import BaseSettings
from typing import List
import os


class Settings(BaseSettings):
    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    DEBUG: bool = True
    
    # Database (SQLite for development, PostgreSQL for production)
    # Read directly from environment variable with fallback
    # Railway provides DATABASE_URL automatically for PostgreSQL services
    # Priority: DATABASE_URL > POSTGRES_URL > default SQLite
    DATABASE_URL: str = "sqlite:///./crm_ims.db"
    
    DB_HOST: str = "localhost"
    DB_PORT: int = 5432
    DB_NAME: str = "crm_ims"
    DB_USER: str = "postgres"
    DB_PASSWORD: str = "postgres"
    
    # JWT
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080  # 7 days
    
    # CORS - stored as string, converted to list via property
    CORS_ORIGINS: str = "http://localhost:3000,http://localhost:3001"
    
    @property
    def cors_origins_list(self) -> List[str]:
        """Get CORS origins as a list."""
        # Get from environment or use default
        cors_str = os.getenv("CORS_ORIGINS", self.CORS_ORIGINS)
        return [origin.strip() for origin in cors_str.split(",") if origin.strip()]
    
    class Config:
        env_file = ".env"
        case_sensitive = True
        env_file_encoding = 'utf-8'


# Create settings instance
_settings = Settings()

# Override DATABASE_URL from environment variables if they exist
# This ensures Railway's DATABASE_URL is used even if Pydantic doesn't pick it up
_db_url = (
    os.getenv("DATABASE_URL") or 
    os.getenv("POSTGRES_URL") or 
    os.getenv("PGDATABASE_URL") or
    _settings.DATABASE_URL
)

# Update the settings object
_settings.DATABASE_URL = _db_url

# Also handle PORT from environment (Railway provides this)
if os.getenv("PORT"):
    try:
        _settings.PORT = int(os.getenv("PORT"))
    except ValueError:
        pass

# Also handle CORS_ORIGINS from environment
if os.getenv("CORS_ORIGINS"):
    _settings.CORS_ORIGINS = os.getenv("CORS_ORIGINS")

settings = _settings

