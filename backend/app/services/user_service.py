from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.models.entities import User
from app.repository.user_repository import create_user, delete_user, get_user, list_users, update_user


def list_users_service(db: Session, role: str | None = None, status: str | None = None, page: int = 1, limit: int = 20):
    query = list_users(db, role, status)
    total = query.count()
    users = query.offset((page - 1) * limit).limit(limit).all()
    return {
        "items": [
            {
                "id": u.id,
                "name": u.name,
                "email": u.email,
                "role": u.role,
                "status": u.status,
            }
            for u in users
        ],
        "pagination": {
            "total": total,
            "page": page,
            "limit": limit,
            "totalPages": (total + limit - 1) // limit,
        },
    }


def create_user_service(db: Session, payload: dict):
    user = get_user(db, payload.get("id")) if payload.get("id") else None
    if user:
        raise ValueError("User already exists")
    payload = payload.copy()
    payload["password_hash"] = hash_password(payload.pop("password"))
    return create_user(db, payload)


def get_user_service(db: Session, user_id: str) -> User | None:
    return get_user(db, user_id)


def update_user_service(db: Session, actor: User, user_id: str, payload: dict) -> User:
    user = get_user(db, user_id)
    if not user:
        raise ValueError("User not found")
    if actor.id == user.id and payload.get("status") == "inactive":
        raise ValueError("Cannot deactivate yourself")
    if payload.get("password"):
        payload = payload.copy()
        payload["password_hash"] = hash_password(payload.pop("password"))
    return update_user(db, user, payload)


def delete_user_service(db: Session, actor: User, user_id: str) -> User:
    user = get_user(db, user_id)
    if not user:
        raise ValueError("User not found")
    if actor.id == user.id:
        raise ValueError("Cannot delete yourself")
    return delete_user(db, user)
