from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import User
from backend.schemas import UserResponse, UserCreate, UserUpdate
from backend.services.rbac import require_role

router = APIRouter(prefix="/api/v1/users", tags=["Users"], dependencies=[Depends(require_role(["ADMIN"]))])

@router.get("", response_model=List[UserResponse])
def list_users(db: Session = Depends(get_db)):
    return db.query(User).order_by(User.id.asc()).all()

from backend.services.auth_service import hash_password

@router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(payload: UserCreate, db: Session = Depends(get_db)):
    uid = payload.user_id.strip().upper()
    existing = db.query(User).filter((User.user_id == uid) | (User.username == payload.username) | (User.email == payload.email)).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"User with ID '{uid}', username '{payload.username}', or email '{payload.email}' already exists."
        )

    raw_password = payload.password or "password123"
    new_user = User(
        user_id=uid,
        username=payload.username.strip(),
        email=payload.email.strip().lower(),
        password_hash=hash_password(raw_password),
        role=payload.role.strip().upper(),
        status="ACTIVE"
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.put("/{user_id}", response_model=UserResponse)
def update_user(user_id: str, payload: UserUpdate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID '{user_id}' was not found."
        )

    if payload.role:
        user.role = payload.role.strip().upper()
    if payload.status:
        user.status = payload.status.strip().upper()

    user.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(user)
    return user

from backend.schemas import UserResponse, UserCreate, UserUpdate, ResetPasswordRequest

@router.patch("/{user_id}/status", response_model=UserResponse)
def toggle_user_status(user_id: str, status_value: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID '{user_id}' was not found."
        )

    user.status = status_value.strip().upper()
    user.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(user)
    return user

@router.post("/{user_id}/reset-password")
def admin_reset_user_password(user_id: str, payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID '{user_id}' was not found."
        )

    if len(payload.new_password.strip()) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 6 characters long."
        )

    user.password_hash = hash_password(payload.new_password.strip())
    user.updated_at = datetime.utcnow()
    db.commit()
    return {"message": f"Password for user '{user.username}' reset successfully."}

