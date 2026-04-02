from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.core.config import config


class Base(DeclarativeBase):
    pass


def _normalize_database_url(url: str) -> str:
    """Supabase and many hosts require SSL; append sslmode if missing."""
    if url.startswith("postgresql") and "sslmode=" not in url:
        sep = "&" if "?" in url else "?"
        return f"{url}{sep}sslmode=require"
    return url


def _create_engine():
    url = _normalize_database_url(config.DATABASE_URL)
    if url.startswith("sqlite"):
        return create_engine(url, connect_args={"check_same_thread": False})
    return create_engine(url, pool_pre_ping=True)


engine = _create_engine()
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
