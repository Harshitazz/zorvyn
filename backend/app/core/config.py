import os
from functools import lru_cache
from dotenv import load_dotenv

load_dotenv()


class Config:
    """Application configuration loaded from environment variables."""

    APP_NAME = os.getenv("APP_NAME", "Finance Backend")
    ENV = os.getenv("ENV", "development")
    DEBUG = ENV == "development"
    
    # JWT
    JWT_SECRET = os.getenv("JWT_SECRET", "change_this_in_production")
    JWT_EXPIRES_MINUTES = int(os.getenv("JWT_EXPIRES_MINUTES", "10080"))  # 7 days
    
    # Database
    DATABASE_URL = os.getenv(
        "DATABASE_URL",
        "sqlite:///./data/finance.db"
    )
    
    # CORS
    CORS_ORIGINS = [
        origin.strip()
        for origin in os.getenv("CORS_ORIGINS", "http://localhost:3001").split(",")
        if origin.strip()
    ]
    
    # Rate limiting
    RATE_LIMIT_MAX = int(os.getenv("RATE_LIMIT_MAX", "100"))
    RATE_LIMIT_WINDOW_SECONDS = int(os.getenv("RATE_LIMIT_WINDOW_SECONDS", "900"))
    
    # Cache
    REDIS_URL = os.getenv("REDIS_URL", None)
    CACHE_TTL_DASHBOARD = int(os.getenv("CACHE_TTL_DASHBOARD", "60"))
    CACHE_TTL_TRENDS = int(os.getenv("CACHE_TTL_TRENDS", "120"))

    @classmethod
    def validate(cls):
        """Validate critical configuration on startup."""
        if cls.JWT_SECRET == "change_this_in_production" and cls.ENV == "production":
            raise ValueError("JWT_SECRET must be configured for production")
        if not cls.DATABASE_URL:
            raise ValueError("DATABASE_URL is required")


config = Config()
config.validate()
