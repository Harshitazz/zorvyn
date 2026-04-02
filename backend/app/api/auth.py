from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.security import create_token, hash_password, verify_password
from app.db.database import get_db
from app.models.entities import User
from app.schemas.auth import LoginInput, RegisterInput

router = APIRouter(prefix="/api/auth", tags=["auth"])

VALID_ROLES = {"admin", "analyst", "viewer"}


@router.post("/register")
def register(payload: RegisterInput, db: Session = Depends(get_db)):
    if payload.role not in VALID_ROLES:
        raise HTTPException(status_code=422, detail="Invalid role")
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(status_code=409, detail="Email already registered")
    user = User(
        name=payload.name,
        email=payload.email,
        password_hash=hash_password(payload.password),
        role=payload.role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"success": True, "message": "User registered", "data": {"id": user.id, "email": user.email}}


@router.post("/login")
def login(payload: LoginInput, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    if user.status != "active":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is inactive")
    token = create_token(user.id)
    return {
        "success": True,
        "message": "Login successful",
        "data": {"token": token, "user": {"id": user.id, "email": user.email, "role": user.role}},
    }


@router.get("/me")
def me(user: User = Depends(get_current_user)):
    return {
        "success": True,
        "message": "Current user fetched",
        "data": {"id": user.id, "name": user.name, "email": user.email, "role": user.role, "status": user.status},
    }
