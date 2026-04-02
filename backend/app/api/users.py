from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.api.deps import require_permission
from app.db.database import get_db
from app.models.entities import User
from app.schemas.users import UserCreateInput, UserUpdateInput
from app.services.user_service import (
    create_user_service,
    delete_user_service,
    get_user_service,
    list_users_service,
    update_user_service,
)

router = APIRouter(prefix="/api/users", tags=["users"])


@router.get("")
def list_users(
    role: str | None = None,
    status: str | None = None,
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
    _user: User = Depends(require_permission("users:manage")),
):
    payload = list_users_service(db, role, status, page, limit)
    return {"success": True, "message": "Users fetched", "data": payload}


@router.post("")
def create_user(
    payload: UserCreateInput,
    db: Session = Depends(get_db),
    _user: User = Depends(require_permission("users:manage")),
):
    try:
        user = create_user_service(db, payload.model_dump())
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc))
    return {"success": True, "message": "User created", "data": {"id": user.id}}


@router.patch("/{user_id}")
def update_user(
    user_id: str,
    payload: UserUpdateInput,
    db: Session = Depends(get_db),
    actor: User = Depends(require_permission("users:manage")),
):
    try:
        updated = update_user_service(db, actor, user_id, payload.model_dump(exclude_unset=True))
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    return {"success": True, "message": "User updated", "data": {"id": updated.id}}


@router.delete("/{user_id}")
def delete_user(
    user_id: str,
    db: Session = Depends(get_db),
    actor: User = Depends(require_permission("users:manage")),
):
    try:
        deleted = delete_user_service(db, actor, user_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    return {"success": True, "message": "User deleted", "data": {"id": deleted.id}}


@router.get("/{user_id}")
def get_user(
    user_id: str,
    db: Session = Depends(get_db),
    _user: User = Depends(require_permission("users:manage")),
):
    user = get_user_service(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {
        "success": True,
        "message": "User fetched",
        "data": {"id": user.id, "name": user.name, "email": user.email, "role": user.role, "status": user.status},
    }
