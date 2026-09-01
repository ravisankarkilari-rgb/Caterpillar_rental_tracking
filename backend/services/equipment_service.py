from datetime import date, datetime
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func
from backend.models import Equipment, UsageLog, Alert, EquipmentStatus, RentalRecord

def get_all_equipment_metrics(equipments: List[Equipment], db: Session) -> dict:
    """
    Computes real-time metrics for a list of equipment assets in 2 bulk SQL queries
    instead of per-equipment queries (prevents N+1 query overhead on cloud DBs like Supabase).
    Returns a dict mapping equipment_id -> metrics dict.
    """
    if not equipments:
        return {}

    today = date.today()
    equip_ids = [e.equipment_id for e in equipments]

    # Bulk query 1: Usage log aggregates grouped by equipment_id
    usage_stats = (
        db.query(
            UsageLog.equipment_id,
            func.sum(UsageLog.engine_hours).label("total_engine"),
            func.sum(UsageLog.idle_hours).label("total_idle"),
            func.count(UsageLog.id).label("operating_days"),
        )
        .filter(UsageLog.equipment_id.in_(equip_ids))
        .group_by(UsageLog.equipment_id)
        .all()
    )
    usage_map = {row.equipment_id: row for row in usage_stats}

    # Bulk query 2: Active alert counts grouped by equipment_id
    alert_stats = (
        db.query(
            Alert.equipment_id,
            func.count(Alert.id).label("active_alert_count"),
        )
        .filter(Alert.equipment_id.in_(equip_ids), Alert.resolved == False)
        .group_by(Alert.equipment_id)
        .all()
    )
    alert_map = {row.equipment_id: row.active_alert_count for row in alert_stats}

    metrics_by_id = {}
    for equip in equipments:
        u_stat = usage_map.get(equip.equipment_id)
        total_engine = float(u_stat.total_engine) if u_stat and u_stat.total_engine else 0.0
        total_idle = float(u_stat.total_idle) if u_stat and u_stat.total_idle else 0.0
        operating_days = int(u_stat.operating_days) if u_stat and u_stat.operating_days else 0

        engine_per_day = round(total_engine / operating_days, 1) if operating_days > 0 else 0.0
        idle_per_day = round(total_idle / operating_days, 1) if operating_days > 0 else 0.0

        total_run_hours = total_engine + total_idle
        utilization_pct = (
            round((total_engine / total_run_hours) * 100.0, 1)
            if total_run_hours > 0
            else 0.0
        )

        days_overdue = 0
        days_remaining = None
        derived_status = equip.status

        if equip.status != EquipmentStatus.AVAILABLE.value:
            if equip.expected_return_date:
                diff = (today - equip.expected_return_date).days
                if diff > 0:
                    days_overdue = diff
                    derived_status = EquipmentStatus.OVERDUE.value
                elif 0 <= (equip.expected_return_date - today).days <= 2:
                    days_remaining = (equip.expected_return_date - today).days
                    derived_status = EquipmentStatus.DUE_SOON.value
                else:
                    days_remaining = (equip.expected_return_date - today).days
                    if operating_days >= 3 and (total_engine + total_idle) >= 5.0 and utilization_pct < 30.0:
                        derived_status = EquipmentStatus.UNDER_UTILIZED.value
                    else:
                        derived_status = EquipmentStatus.RENTED.value
            else:
                derived_status = EquipmentStatus.RENTED.value
        else:
            derived_status = EquipmentStatus.AVAILABLE.value

        alert_count = alert_map.get(equip.equipment_id, 0)

        metrics_by_id[equip.equipment_id] = {
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

    return metrics_by_id

def calculate_equipment_metrics(equipment: Equipment, db: Session) -> dict:
    res = get_all_equipment_metrics([equipment], db)
    return res.get(equipment.equipment_id, {})

def get_equipment_with_metrics(equipment: Equipment, db: Session, precalculated_metrics: dict = None) -> dict:
    metrics = precalculated_metrics if precalculated_metrics else calculate_equipment_metrics(equipment, db)

    return {
        "id": equipment.id,
        "equipment_id": equipment.equipment_id,
        "equipment_type": equipment.equipment_type,
        "status": metrics.get("derived_status", equipment.status),
        "customer_id": equipment.customer_id,
        "site_id": equipment.site_id,
        "operator_id": equipment.operator_id,
        "rental_start_date": equipment.rental_start_date,
        "expected_return_date": equipment.expected_return_date,
        "ignition_status": getattr(equipment, "ignition_status", "OFF") or "OFF",
        "is_active": getattr(equipment, "is_active", True) if getattr(equipment, "is_active", True) is not None else True,
        "created_at": equipment.created_at,
        "updated_at": equipment.updated_at,
        "engine_hours_per_day": metrics.get("engine_hours_per_day", 0.0),
        "idle_hours_per_day": metrics.get("idle_hours_per_day", 0.0),
        "total_engine_hours": metrics.get("total_engine_hours", 0.0),
        "total_idle_hours": metrics.get("total_idle_hours", 0.0),
        "operating_days": metrics.get("operating_days", 0),
        "utilization_percentage": metrics.get("utilization_percentage", 0.0),
        "days_overdue": metrics.get("days_overdue", 0),
        "days_remaining": metrics.get("days_remaining", None),
        "active_alert_count": metrics.get("active_alert_count", 0),
    }
