from typing import List
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import SystemSetting
from backend.schemas import SystemSettingResponse, SystemSettingUpdate
from backend.services.rbac import require_role

router = APIRouter(prefix="/api/v1/settings", tags=["Settings"], dependencies=[Depends(require_role(["ADMIN"]))])

@router.get("", response_model=List[SystemSettingResponse])
def list_settings(db: Session = Depends(get_db)):
    return db.query(SystemSetting).order_by(SystemSetting.id.asc()).all()

@router.put("/{key}", response_model=SystemSettingResponse)
def update_setting(key: str, payload: SystemSettingUpdate, db: Session = Depends(get_db)):
    setting = db.query(SystemSetting).filter(SystemSetting.key == key).first()
    if not setting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"System setting '{key}' was not found."
        )

    setting.value = payload.value.strip()
    setting.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(setting)
    return setting
