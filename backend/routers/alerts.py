from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import Alert, Equipment
from backend.schemas import AlertResponse, AlertResolveRequest
from backend.services.alert_service import sync_all_alerts

from backend.services.rbac import require_role

router = APIRouter(prefix="/api/v1/alerts", tags=["Alerts"])

@router.get("", response_model=List[AlertResponse])
def list_alerts(
    severity: Optional[str] = Query(None, description="Filter by CRITICAL, WARNING, INFO"),
    alert_type: Optional[str] = Query(None, description="Filter by alert type"),
    resolved: Optional[bool] = Query(False, description="Filter by resolution status"),
    equipment_id: Optional[str] = Query(None, description="Filter by equipment ID"),
    db: Session = Depends(get_db)
):
    query = db.query(Alert)

    if resolved is not None:
        query = query.filter(Alert.resolved == resolved)
    if severity:
        query = query.filter(Alert.severity == severity.upper())
    if alert_type:
        query = query.filter(Alert.alert_type == alert_type)
    if equipment_id:
        query = query.filter(Alert.equipment_id == equipment_id)

    alerts = query.order_by(Alert.created_at.desc()).all()
    
    # Bulk map equipment_type to prevent N+1 queries
    equipments = db.query(Equipment.equipment_id, Equipment.equipment_type).all()
    eq_type_map = {e.equipment_id: e.equipment_type for e in equipments}

    results = []
    for a in alerts:
        results.append({
            "id": a.id,
            "equipment_id": a.equipment_id,
            "equipment_type": eq_type_map.get(a.equipment_id),
            "alert_type": a.alert_type,
            "severity": a.severity,
            "message": a.message,
            "explanation": a.explanation,
            "resolved": a.resolved,
            "created_at": a.created_at,
            "resolved_at": a.resolved_at
        })

    return results


@router.post("/{alert_id}/resolve", response_model=AlertResponse, dependencies=[Depends(require_role(["ADMIN", "MANAGER"]))])
def resolve_alert(
    alert_id: int,
    payload: AlertResolveRequest = AlertResolveRequest(resolved=True),
    db: Session = Depends(get_db)
):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Alert with ID {alert_id} was not found."
        )

    alert.resolved = payload.resolved
    alert.resolved_at = datetime.utcnow() if payload.resolved else None
    db.commit()
    db.refresh(alert)

    eq = db.query(Equipment).filter(Equipment.equipment_id == alert.equipment_id).first()
    return {
        "id": alert.id,
        "equipment_id": alert.equipment_id,
        "equipment_type": eq.equipment_type if eq else None,
        "alert_type": alert.alert_type,
        "severity": alert.severity,
        "message": alert.message,
        "explanation": alert.explanation,
        "resolved": alert.resolved,
        "created_at": alert.created_at,
        "resolved_at": alert.resolved_at
    }
