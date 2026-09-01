from datetime import date, datetime
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func
from backend.models import Equipment, UsageLog, Alert, EquipmentStatus, RentalRecord

def calculate_equipment_metrics(equipment: Equipment, db: Session) -> dict:
    """
    Computes real-time metrics for an equipment asset:
    - Total & daily engine / idle hours
    - Utilization percentage = engine / (engine + idle) * 100
    - Days overdue / remaining
    - Active alert count
    - Computed operational status
    """
    today = date.today()
    
    # Fetch usage logs
    logs = (
        db.query(UsageLog)
        .filter(UsageLog.equipment_id == equipment.equipment_id)
        .order_by(UsageLog.date.desc())
        .all()
    )
    
    total_engine = sum(log.engine_hours for log in logs)
    total_idle = sum(log.idle_hours for log in logs)
    operating_days = len(logs)
    
    engine_per_day = round(total_engine / operating_days, 1) if operating_days > 0 else 0.0
    idle_per_day = round(total_idle / operating_days, 1) if operating_days > 0 else 0.0
    
    total_run_hours = total_engine + total_idle
    utilization_pct = (
        round((total_engine / total_run_hours) * 100.0, 1)
        if total_run_hours > 0
        else 0.0
    )
    
    # Days overdue / remaining
    days_overdue = 0
    days_remaining = None
    derived_status = equipment.status
    
    if equipment.status != EquipmentStatus.AVAILABLE.value:
        if equipment.expected_return_date:
            diff = (today - equipment.expected_return_date).days
            if diff > 0:
                days_overdue = diff
                derived_status = EquipmentStatus.OVERDUE.value
            elif 0 <= (equipment.expected_return_date - today).days <= 2:
                days_remaining = (equipment.expected_return_date - today).days
                derived_status = EquipmentStatus.DUE_SOON.value
            else:
                days_remaining = (equipment.expected_return_date - today).days
                # Check under-utilization only when meaningful runtime history exists (at least 3 operating days and > 5h logged)
                if operating_days >= 3 and (total_engine + total_idle) >= 5.0 and utilization_pct < 30.0:
                    derived_status = EquipmentStatus.UNDER_UTILIZED.value
                else:
                    derived_status = EquipmentStatus.RENTED.value
        else:
            derived_status = EquipmentStatus.RENTED.value
    else:
        derived_status = EquipmentStatus.AVAILABLE.value
    
    # Count unresolved alerts
    alert_count = (
        db.query(func.count(Alert.id))
        .filter(Alert.equipment_id == equipment.equipment_id, Alert.resolved == False)
        .scalar()
        or 0
    )
    
    return {
        "engine_hours_per_day": engine_per_day,
        "idle_hours_per_day": idle_per_day,
        "total_engine_hours": round(total_engine, 1),
        "total_idle_hours": round(total_idle, 1),
        "operating_days": operating_days,
        "utilization_percentage": utilization_pct,
        "days_overdue": days_overdue,
        "days_remaining": days_remaining,
        "active_alert_count": alert_count,
        "derived_status": derived_status,
    }

def get_equipment_with_metrics(equipment: Equipment, db: Session) -> dict:
    metrics = calculate_equipment_metrics(equipment, db)
    
    return {
        "id": equipment.id,
        "equipment_id": equipment.equipment_id,
        "equipment_type": equipment.equipment_type,
        "status": metrics["derived_status"],
        "customer_id": equipment.customer_id,
        "site_id": equipment.site_id,
        "operator_id": equipment.operator_id,
        "rental_start_date": equipment.rental_start_date,
        "expected_return_date": equipment.expected_return_date,
        "ignition_status": getattr(equipment, "ignition_status", "OFF") or "OFF",
        "created_at": equipment.created_at,
        "updated_at": equipment.updated_at,
        "engine_hours_per_day": metrics["engine_hours_per_day"],
        "idle_hours_per_day": metrics["idle_hours_per_day"],
        "total_engine_hours": metrics["total_engine_hours"],
        "total_idle_hours": metrics["total_idle_hours"],
        "operating_days": metrics["operating_days"],
        "utilization_percentage": metrics["utilization_percentage"],
        "days_overdue": metrics["days_overdue"],
        "days_remaining": metrics["days_remaining"],
        "active_alert_count": metrics["active_alert_count"],
    }
