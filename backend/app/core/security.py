from datetime import datetime, timedelta, timezone

from jose import jwt
from passlib.context import CryptContext

from app.core.config import config

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Policy model is intentionally small and extensible.
# - dashboard:read gives base read access to dashboard endpoints.
# - dashboard:trends grants analytic trend access (optional granular control).
# - records:read, records:write, users:manage remain for admin and analyst roles.
PERMISSIONS = {
    "viewer": {"dashboard:read"},
    "analyst": {"dashboard:read", "dashboard:trends", "records:read", "records:trends"},
    "admin": {
        "dashboard:read",
        "dashboard:trends",
        "records:read",
        "records:trends",
        "records:write",
        "users:manage",
    },
}


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    return pwd_context.verify(password, password_hash)


def create_token(user_id: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=config.JWT_EXPIRES_MINUTES)
    payload = {"sub": user_id, "exp": expire}
    return jwt.encode(payload, config.JWT_SECRET, algorithm="HS256")
