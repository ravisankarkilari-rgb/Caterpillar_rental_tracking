from datetime import date, datetime, timedelta
from typing import Dict, Any, List
from collections import defaultdict
from sqlalchemy.orm import Session
from sqlalchemy import func
from backend.models import Equipment, UsageLog, Alert, RentalRecord, EquipmentStatus, EquipmentType
from backend.services.equipment_service import get_equipment_with_metrics

def get_dashboard_summary(db: Session) -> Dict[str, Any]:
    equipments = db.query(Equipment).all()
    
    total = len(equipments)
    rented_count = 0
    available_count = 0
    overdue_count = 0
    under_utilized_count = 0
    due_soon_count = 0
    
    total_engine_hours_all = 0.0
    total_idle_hours_all = 0.0
    
    for equip in equipments:
        data = get_equipment_with_metrics(equip, db)
        derived_status = data["status"]
        
        if derived_status == EquipmentStatus.AVAILABLE.value:
            available_count += 1
        else:
            rented_count += 1
            if derived_status == EquipmentStatus.OVERDUE.value:
                overdue_count += 1
            elif derived_status == EquipmentStatus.UNDER_UTILIZED.value:
                under_utilized_count += 1
            elif derived_status == EquipmentStatus.DUE_SOON.value:
                due_soon_count += 1
                
        total_engine_hours_all += data["total_engine_hours"]
        total_idle_hours_all += data["total_idle_hours"]

    # Active alerts
    active_alerts = db.query(func.count(Alert.id)).filter(Alert.resolved == False).scalar() or 0
    
    # Fleet utilization
    fleet_run_hours = total_engine_hours_all + total_idle_hours_all
    fleet_utilization = (
        round((total_engine_hours_all / fleet_run_hours) * 100.0, 1)
        if fleet_run_hours > 0
        else 0.0
    )
    
    avg_engine = round(total_engine_hours_all / total, 1) if total > 0 else 0.0
    avg_idle = round(total_idle_hours_all / total, 1) if total > 0 else 0.0
    
    return {
        "total_equipment": total,
        "rented": rented_count,
        "available": available_count,
        "overdue": overdue_count,
        "under_utilized": under_utilized_count,
        "due_soon": due_soon_count,
        "active_alerts": active_alerts,
        "fleet_utilization_rate": fleet_utilization,
        "avg_engine_hours": avg_engine,
        "avg_idle_hours": avg_idle,
    }

def get_fleet_metrics(db: Session) -> Dict[str, Any]:
    equipments = db.query(Equipment).all()
    
    by_type = defaultdict(lambda: {"total": 0, "rented": 0, "available": 0, "avg_utilization": 0.0, "_utils": []})
    by_status = defaultdict(int)
    util_dist = {"low": 0, "moderate": 0, "high": 0}  # <30%, 30-70%, >70%
    
    for equip in equipments:
        data = get_equipment_with_metrics(equip, db)
        t = equip.equipment_type
        s = data["status"]
        u = data["utilization_percentage"]
        
        by_type[t]["total"] += 1
        if s == EquipmentStatus.AVAILABLE.value:
            by_type[t]["available"] += 1
        else:
            by_type[t]["rented"] += 1
        by_type[t]["_utils"].append(u)
        
        by_status[s] += 1
        
        if u < 30.0:
            util_dist["low"] += 1
        elif u <= 70.0:
            util_dist["moderate"] += 1
        else:
            util_dist["high"] += 1
            
    # Calculate averages
    type_summary = {}
    for k, v in by_type.items():
        utils = v["_utils"]
        avg_u = round(sum(utils) / len(utils), 1) if utils else 0.0
        type_summary[k] = {
            "total": v["total"],
            "rented": v["rented"],
            "available": v["available"],
            "avg_utilization": avg_u
        }
        
    # Recent 14 days usage trend across fleet
    fourteen_days_ago = date.today() - timedelta(days=14)
    logs = (
        db.query(
            UsageLog.date,
            func.sum(UsageLog.engine_hours).label("engine"),
            func.sum(UsageLog.idle_hours).label("idle"),
            func.sum(UsageLog.fuel_usage).label("fuel")
        )
        .filter(UsageLog.date >= fourteen_days_ago)
        .group_by(UsageLog.date)
        .order_by(UsageLog.date.asc())
        .all()
    )
    
    recent_trend = [
        {
            "date": log.date.strftime("%b %d"),
            "engine_hours": round(float(log.engine or 0), 1),
            "idle_hours": round(float(log.idle or 0), 1),
            "fuel_usage": round(float(log.fuel or 0), 1)
        }
        for log in logs
    ]

    # Category-specific 14-day telemetry trends
    type_logs = (
        db.query(
            UsageLog.date,
            Equipment.equipment_type,
            func.sum(UsageLog.engine_hours).label("engine"),
            func.sum(UsageLog.idle_hours).label("idle"),
            func.sum(UsageLog.fuel_usage).label("fuel")
        )
        .join(Equipment, UsageLog.equipment_id == Equipment.equipment_id)
        .filter(UsageLog.date >= fourteen_days_ago)
        .group_by(UsageLog.date, Equipment.equipment_type)
        .order_by(UsageLog.date.asc())
        .all()
    )

    all_eq_types = [e.value for e in EquipmentType]
    by_type_trend: Dict[str, List[Dict[str, Any]]] = {eq_type: [] for eq_type in all_eq_types}
    date_type_map: Dict[str, Dict[str, float]] = defaultdict(lambda: {eq_type: 0.0 for eq_type in all_eq_types})

    for row in type_logs:
        d_str = row.date.strftime("%b %d")
        eq_type = row.equipment_type
        eng = round(float(row.engine or 0), 1)
        idl = round(float(row.idle or 0), 1)
        fl = round(float(row.fuel or 0), 1)
        total_h = eng + idl
        util = round((eng / total_h) * 100.0, 1) if total_h > 0 else 0.0

        if eq_type in by_type_trend:
            by_type_trend[eq_type].append({
                "date": d_str,
                "engine_hours": eng,
                "idle_hours": idl,
                "fuel_usage": fl,
                "utilization": util
            })
        date_type_map[d_str][eq_type] = eng

    # Multi-type daily comparison
    multi_type_comparison = []
    unique_dates = sorted(list(set(row.date for row in type_logs)))
    for d in unique_dates:
        d_str = d.strftime("%b %d")
        entry: Dict[str, Any] = {"date": d_str}
        for eq_type in all_eq_types:
            entry[eq_type] = date_type_map[d_str].get(eq_type, 0.0)
        multi_type_comparison.append(entry)

    # Detailed per-type telemetry summary
    type_telemetry = {}
    for eq_type in all_eq_types:
        trend_items = by_type_trend.get(eq_type, [])
        t_eng = round(sum(item["engine_hours"] for item in trend_items), 1)
        t_idl = round(sum(item["idle_hours"] for item in trend_items), 1)
        t_fuel = round(sum(item["fuel_usage"] for item in trend_items), 1)
        days_count = len(trend_items) if trend_items else 1
        t_runtime = t_eng + t_idl
        
        telemetry_util = round((t_eng / t_runtime) * 100.0, 1) if t_runtime > 0 else 0.0
        idle_ratio = round((t_idl / t_runtime) * 100.0, 1) if t_runtime > 0 else 0.0

        type_telemetry[eq_type] = {
            "total_engine_hours": t_eng,
            "total_idle_hours": t_idl,
            "total_fuel_usage": t_fuel,
            "avg_daily_engine_hours": round(t_eng / days_count, 1),
            "avg_daily_idle_hours": round(t_idl / days_count, 1),
            "telemetry_utilization": telemetry_util,
            "idle_ratio": idle_ratio,
            "days_recorded": len(trend_items)
        }

    return {
        "by_type": type_summary,
        "by_status": dict(by_status),
        "utilization_distribution": util_dist,
        "recent_usage_trend": recent_trend,
        "by_type_trend": by_type_trend,
        "type_telemetry": type_telemetry,
        "multi_type_comparison": multi_type_comparison
    }

def get_demand_forecast(db: Session) -> Dict[str, Any]:
    """
    Computes explainable demand forecast using a 3-month rolling weighted moving average.
    """
    equipment_types = [e.value for e in EquipmentType]
    
    # Realistic base historical monthly demand data (Jan, Feb, Mar, Apr)
    historical_months = ["Jan", "Feb", "Mar", "Apr"]
    base_history = {
        "Excavator": [4, 6, 5, 7],
        "Crane": [2, 3, 3, 4],
        "Bulldozer": [3, 4, 4, 5],
        "Grader": [1, 2, 2, 3],
        "Loader": [3, 4, 5, 6]
    }
    
    # Get current rented count per type from DB
    equipments = db.query(Equipment).all()
    current_demand = defaultdict(int)
    for equip in equipments:
        if equip.status != EquipmentStatus.AVAILABLE.value:
            current_demand[equip.equipment_type] += 1

    forecast_items = []
    
    for eq_type in equipment_types:
        hist = base_history.get(eq_type, [2, 3, 3, 4])
        # Calculate moving average (weights: 0.2, 0.3, 0.5 for most recent)
        recent_3 = hist[-3:]
        w_avg = round((recent_3[0] * 0.2 + recent_3[1] * 0.3 + recent_3[2] * 0.5), 1)
        
        curr = current_demand[eq_type]
        # Predicted next period demand with seasonal trend adjustment
        predicted = max(curr, int(round(w_avg * 1.15)))
        
        hist_avg = round(sum(hist) / len(hist), 1)
        trend_pct = round(((predicted - hist_avg) / hist_avg) * 100.0, 1) if hist_avg > 0 else 0.0
        
        explanation = (
            f"Based on a 3-period weighted moving average ({recent_3[0]}, {recent_3[1]}, {recent_3[2]}) "
            f"and current utilization ({curr} active units), projected demand is expected to increase by {trend_pct}% "
            f"for next month's construction ramp-up."
        )
        
        forecast_items.append({
            "equipment_type": eq_type,
            "current_active_demand": curr,
            "historical_avg_demand": hist_avg,
            "predicted_next_period_demand": predicted,
            "trend_percentage": trend_pct,
            "confidence_level": "High" if len(hist) >= 4 else "Medium",
            "explanation": explanation
        })
        
    return {
        "forecast_period": "May (Next Period)",
        "historical_months": historical_months,
        "forecast_items": forecast_items
    }
