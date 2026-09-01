from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Header, status
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import User
from backend.schemas import LoginRequest, LoginResponse
import uuid

router = APIRouter(prefix="/api/v1/auth", tags=["Auth"])

ROLE_DEFINITIONS = {
    "ADMIN": {
        "role": "ADMIN",
        "display_name": "System Administrator",
        "description": "Full administrative access across fleet, check-in/out, equipment registration, users, and settings.",
        "permissions": ["view_all", "checkout", "checkin", "create_equipment", "edit_equipment", "deactivate_equipment", "manage_users", "manage_settings"]
    },
    "MANAGER": {
        "role": "MANAGER",
        "display_name": "Equipment Rental Manager",
        "description": "Manage equipment rentals, check-in/out operations, and operational alerts.",
        "permissions": ["view_all", "checkout", "checkin", "resolve_alerts"]
    },
    "VIEWER": {
        "role": "VIEWER",
        "display_name": "Read-Only Viewer / Auditor",
        "description": "Read-only access to equipment telemetry, rental status, and fleet analytics.",
        "permissions": ["view_all"]
    }
}

@router.get("/roles")
def get_available_roles():
    return list(ROLE_DEFINITIONS.values())

@router.get("/me")
def get_current_user_profile(x_user_role: Optional[str] = Header("MANAGER")):
    role_key = (x_user_role or "MANAGER").upper()
    role_data = ROLE_DEFINITIONS.get(role_key, ROLE_DEFINITIONS["MANAGER"])
    return {
        "user_id": f"USR_{role_key}",
        "role": role_data["role"],
        "display_name": role_data["display_name"],
        "description": role_data["description"],
        "permissions": role_data["permissions"]
    }

from backend.schemas import LoginRequest, LoginResponse, ChangePasswordRequest
from backend.services.auth_service import verify_password, hash_password

@router.post("/login", response_model=LoginResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    identifier = payload.email.strip().lower()
    user = db.query(User).filter(
        (User.email.ilike(identifier)) | (User.username.ilike(identifier)) | (User.user_id.ilike(identifier))
    ).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials. User account not found."
        )

    # Verify database password
    if not user.password_hash or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email/username or password."
        )

    if user.status == "DISABLED":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your user account has been disabled by a Caterpillar System Administrator."
        )

    # Return valid authentication response with actual database role
    token = f"cat_token_{uuid.uuid4().hex[:12]}"
    return {
        "access_token": token,
        "token_type": "bearer",
        "user_id": user.user_id,
        "username": user.username,
        "email": user.email,
        "role": user.role,
        "status": user.status,
    }

@router.post("/change-password")
def change_password(
    payload: ChangePasswordRequest,
    x_user_email: Optional[str] = Header(None),
    x_user_role: Optional[str] = Header("ADMIN"),
    db: Session = Depends(get_db)
):
    user = None
    if x_user_email:
        user = db.query(User).filter(User.email.ilike(x_user_email.strip())).first()

    if not user:
        role_key = (x_user_role or "ADMIN").upper()
        user = db.query(User).filter(User.role == role_key).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Account record not found."
        )

    if not user.password_hash or not verify_password(payload.current_password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect."
        )

    if len(payload.new_password.strip()) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be at least 6 characters long."
        )

    user.password_hash = hash_password(payload.new_password.strip())
    db.commit()
    return {"message": "Password changed successfully."}


