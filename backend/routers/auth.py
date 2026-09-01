from fastapi import APIRouter, Header
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter(prefix="/api/v1/auth", tags=["Auth"])

class RoleInfo(BaseModel):
    role: str
    display_name: str
    description: str
    permissions: List[str]

ROLE_DEFINITIONS = {
    "ADMIN": {
        "role": "ADMIN",
        "display_name": "System Administrator",
        "description": "Full access to equipment, check-in/out, fleet registry creation, alerts resolution, and analytics.",
        "permissions": ["view_all", "checkout", "checkin", "create_equipment", "resolve_alerts", "export_data"]
    },
    "MANAGER": {
        "role": "MANAGER",
        "display_name": "Equipment Rental Manager",
        "description": "Can manage rental fleet, execute check-in/check-out, resolve operational alerts, and view analytics.",
        "permissions": ["view_all", "checkout", "checkin", "resolve_alerts"]
    },
    "VIEWER": {
        "role": "VIEWER",
        "display_name": "Read-Only Viewer / Auditor",
        "description": "Can monitor equipment status, alerts, and analytics in read-only mode.",
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
