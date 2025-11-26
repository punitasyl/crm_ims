from pydantic_settings import BaseSettings
from typing import List
import os


class Settings(BaseSettings):
    # Server
    HOST: str = "0.0.0.0"
    PORT: int = int(os.getenv("PORT", "8000"))  # Use PORT from environment for deployment
    DEBUG: bool = True
    
    # Database (SQLite for development)
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


settings = Settings()

