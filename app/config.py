from pydantic_settings import BaseSettings
from typing import List, Optional
import os

class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "postgresql://user:password@localhost/id_verification"
    
    # JWT
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # Tesseract
    TESSERACT_CMD: str = "tesseract"
    
    # ML Settings
    MODEL_PATH: Optional[str] = None
    PYTORCH_DEVICE: str = "cpu"
    ML_AVAILABLE: bool = True
    
    # CORS
    ALLOWED_ORIGINS: List[str] = ["*"]
    
    # Admin bootstrap
    ADMIN_INIT_EMAIL: str = "admin@example.com"
    ADMIN_INIT_PASSWORD: str = "admin123"
    ADMIN_INIT_NAME: str = "System Admin"
    
    class Config:
        env_file = ".env"

settings = Settings()


