from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import Equipment, UsageLog, EquipmentStatus
from datetime import datetime
from backend.schemas import EquipmentResponse, EquipmentCreate, EquipmentUpdate, UsageLogResponse, UsageLogCreate, IgnitionControlRequest
from backend.services.equipment_service import get_equipment_with_metrics, get_all_equipment_metrics
from backend.services.alert_service import sync_alerts_for_equipment

from backend.services.rbac import require_role

router = APIRouter(prefix="/api/v1/equipment", tags=["Equipment"])

@router.get("", response_model=List[EquipmentResponse])
def list_equipment(
    search: Optional[str] = Query(None, description="Search by ID, Type, Customer, Site"),
    type: Optional[str] = Query(None, description="Filter by Equipment Type"),
    status: Optional[str] = Query(None, description="Filter by status (AVAILABLE, RENTED, OVERDUE, DUE_SOON, UNDER_UTILIZED)"),
    customer_id: Optional[str] = Query(None, description="Filter by Customer ID"),
    site_id: Optional[str] = Query(None, description="Filter by Site ID"),
    db: Session = Depends(get_db)
):
    query = db.query(Equipment)

    if type:
        query = query.filter(Equipment.equipment_type == type)
    if customer_id:
        query = query.filter(Equipment.customer_id == customer_id)
    if site_id:
        query = query.filter(Equipment.site_id == site_id)

    equipments = query.all()
    metrics_map = get_all_equipment_metrics(equipments, db)
    results = []

    for equip in equipments:
        item_data = get_equipment_with_metrics(equip, db, precalculated_metrics=metrics_map.get(equip.equipment_id))

        # Apply status filter against derived status
        if status and item_data["status"].upper() != status.upper():
            continue
            
        # Apply generic search across ID, Type, Customer, Site, Status
        if search:
            s = search.lower().strip()
            match = (
                s in equip.equipment_id.lower()
                or s in equip.equipment_type.lower()
                or (equip.customer_id and s in equip.customer_id.lower())
                or (equip.site_id and s in equip.site_id.lower())
                or s in item_data["status"].lower()
            )
            if not match:
                continue

        results.append(item_data)

    return results

@router.get("/{equipment_id}", response_model=EquipmentResponse)
def get_equipment_detail(equipment_id: str, db: Session = Depends(get_db)):
    equip = db.query(Equipment).filter(Equipment.equipment_id == equipment_id).first()
    if not equip:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Equipment '{equipment_id}' was not found in the fleet registry."
        )
    return get_equipment_with_metrics(equip, db)

@router.post("", response_model=EquipmentResponse, status_code=status.HTTP_201_CREATED, dependencies=[Depends(require_role(["ADMIN"]))])
def create_equipment(payload: EquipmentCreate, db: Session = Depends(get_db)):
    # Check duplicate ID
    existing = db.query(Equipment).filter(Equipment.equipment_id == payload.equipment_id).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Equipment with ID '{payload.equipment_id}' already exists."
        )
    
    new_equip = Equipment(
        equipment_id=payload.equipment_id.strip().upper(),
        equipment_type=payload.equipment_type,
        status=EquipmentStatus.AVAILABLE.value,
        is_active=True
    )
    db.add(new_equip)
    db.commit()
    db.refresh(new_equip)
    
    return get_equipment_with_metrics(new_equip, db)

@router.put("/{equipment_id}", response_model=EquipmentResponse, dependencies=[Depends(require_role(["ADMIN"]))])
def update_equipment(equipment_id: str, payload: EquipmentUpdate, db: Session = Depends(get_db)):
    equip = db.query(Equipment).filter(Equipment.equipment_id == equipment_id).first()
    if not equip:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Equipment '{equipment_id}' was not found in fleet registry."
        )
    
    if payload.equipment_type:
        equip.equipment_type = payload.equipment_type
    if payload.customer_id is not None:
        equip.customer_id = payload.customer_id if payload.customer_id.strip() else None
    if payload.site_id is not None:
        equip.site_id = payload.site_id if payload.site_id.strip() else None
    if payload.operator_id is not None:
        equip.operator_id = payload.operator_id if payload.operator_id.strip() else None
    if payload.rental_start_date is not None:
        equip.rental_start_date = payload.rental_start_date
    if payload.expected_return_date is not None:
        equip.expected_return_date = payload.expected_return_date
    if payload.status:
        equip.status = payload.status

    equip.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(equip)
    return get_equipment_with_metrics(equip, db)

@router.patch("/{equipment_id}/deactivate", response_model=EquipmentResponse, dependencies=[Depends(require_role(["ADMIN"]))])
def deactivate_equipment(equipment_id: str, db: Session = Depends(get_db)):
    equip = db.query(Equipment).filter(Equipment.equipment_id == equipment_id).first()
    if not equip:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Equipment '{equipment_id}' was not found."
        )
    equip.is_active = False
    equip.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(equip)
    return get_equipment_with_metrics(equip, db)


@router.get("/{equipment_id}/logs", response_model=List[UsageLogResponse])
def get_equipment_usage_logs(equipment_id: str, limit: int = 30, db: Session = Depends(get_db)):
    equip = db.query(Equipment).filter(Equipment.equipment_id == equipment_id).first()
    if not equip:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Equipment '{equipment_id}' was not found."
        )

    logs = (
        db.query(UsageLog)
        .filter(UsageLog.equipment_id == equipment_id)
        .order_by(UsageLog.date.desc())
        .limit(limit)
        .all()
    )

    results = []
    for log in logs:
        tot = log.engine_hours + log.idle_hours
        u_pct = round((log.engine_hours / tot) * 100.0, 1) if tot > 0 else 0.0
        results.append({
            "id": log.id,
            "equipment_id": log.equipment_id,
            "date": log.date,
            "engine_hours": log.engine_hours,
            "idle_hours": log.idle_hours,
            "fuel_usage": log.fuel_usage,
            "operating_days": log.operating_days,
            "site_id": log.site_id,
            "utilization_percentage": u_pct,
            "created_at": log.created_at
        })
    return results

@router.post("/{equipment_id}/logs", response_model=UsageLogResponse, status_code=status.HTTP_201_CREATED)
def add_usage_log(equipment_id: str, payload: UsageLogCreate, db: Session = Depends(get_db)):
    equip = db.query(Equipment).filter(Equipment.equipment_id == equipment_id).first()
    if not equip:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Equipment '{equipment_id}' was not found."
        )

    log = UsageLog(
        equipment_id=equipment_id,
        date=payload.date,
        engine_hours=payload.engine_hours,
        idle_hours=payload.idle_hours,
        fuel_usage=payload.fuel_usage,
        operating_days=payload.operating_days,
        site_id=payload.site_id or equip.site_id
    )
    db.add(log)
    db.commit()
    db.refresh(log)

    # Sync alerts for new usage pattern
    sync_alerts_for_equipment(equip, db)

    tot = log.engine_hours + log.idle_hours
    u_pct = round((log.engine_hours / tot) * 100.0, 1) if tot > 0 else 0.0
    return {
        "id": log.id,
        "equipment_id": log.equipment_id,
        "date": log.date,
        "engine_hours": log.engine_hours,
        "idle_hours": log.idle_hours,
        "fuel_usage": log.fuel_usage,
        "operating_days": log.operating_days,
        "site_id": log.site_id,
        "utilization_percentage": u_pct,
        "created_at": log.created_at
    }

@router.post("/{equipment_id}/ignition", response_model=EquipmentResponse)
def control_ignition(equipment_id: str, payload: IgnitionControlRequest, db: Session = Depends(get_db)):
    equip = db.query(Equipment).filter(Equipment.equipment_id == equipment_id).first()
    if not equip:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Equipment '{equipment_id}' was not found in the fleet registry."
        )

    target_state = payload.state.strip().upper()
    if target_state not in ["ON", "OFF"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid ignition state. Must be 'ON' or 'OFF'."
        )

    equip.ignition_status = target_state
    equip.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(equip)

    return get_equipment_with_metrics(equip, db)
