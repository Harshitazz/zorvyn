from typing import Any, Optional

from sqlalchemy.orm import Session

from app.models.entities import User


def _base_query(db: Session):
    return db.query(User)


def list_users(db: Session, role: str | None = None, status: str | None = None):
    query = _base_query(db)
    if role:
        query = query.filter(User.role == role)
    if status:
        query = query.filter(User.status == status)
    return query


def get_user(db: Session, user_id: str) -> Optional[User]:
    return _base_query(db).filter(User.id == user_id).first()


def create_user(db: Session, user_data: dict[str, Any]) -> User:
    user = User(**user_data)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def update_user(db: Session, user: User, updates: dict[str, Any]) -> User:
    for k, v in updates.items():
        if v is not None:
            setattr(user, k, v)
    db.commit()
    db.refresh(user)
    return user


def delete_user(db: Session, user: User) -> User:
    db.delete(user)
    db.commit()
    return user
