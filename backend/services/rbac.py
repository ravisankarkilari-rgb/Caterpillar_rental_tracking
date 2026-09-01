from typing import List, Optional
from fastapi import Header, HTTPException, status

def require_role(allowed_roles: List[str]):
    """
    FastAPI dependency that extracts and validates the request user's role
    from the 'x-user-role' header.
    Returns HTTP 403 Forbidden if the role is unauthorized.
    """
    def role_checker(x_user_role: Optional[str] = Header("MANAGER")):
        current_role = (x_user_role or "MANAGER").strip().upper()
        if current_role not in [r.upper() for r in allowed_roles]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access Denied: Role '{current_role}' is not authorized to perform this operation. Allowed roles: {', '.join(allowed_roles)}."
            )
        return current_role
    return role_checker
