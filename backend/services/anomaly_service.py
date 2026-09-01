from datetime import date
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from backend.models import Equipment, UsageLog, AlertType, AlertSeverity, EquipmentStatus

def detect_anomalies_for_equipment(equipment: Equipment, db: Session) -> List[Dict[str, Any]]:
    """
    Advanced, explainable anomaly & asset misuse detection engine.
    Analyzes historical telemetry patterns to detect:
    1. Unassigned / Ghost Asset Operation (running while available in depot)
    2. Chronic Long Idle Hours Misuse (high idle-to-engine ratio over multi-day history)
    3. Abnormal Fuel Consumption / Potential Siphoning
    4. Continuous Engine Overload / Heavy Duty Abuse
    5. Sudden Deviation / Usage Drop vs Historical Moving Average
    """
    anomalies = []
    
    logs = (
        db.query(UsageLog)
        .filter(UsageLog.equipment_id == equipment.equipment_id)
        .order_by(UsageLog.date.desc())
        .limit(14)
        .all()
    )
    
    # =========================================================================
    # 1. UNASSIGNED ASSET USAGE MISUSE (Ghost Usage / Unauthorized Run)
    # =========================================================================
    # If equipment is unassigned (customer_id is None or status AVAILABLE) but telemetry logs show active runtime or fuel burn
    if equipment.customer_id is None or equipment.status == EquipmentStatus.AVAILABLE.value:
        recent_log = logs[0] if logs else None
        if recent_log and (recent_log.engine_hours > 0.3 or (recent_log.fuel_usage and recent_log.fuel_usage > 5.0)):
            anomalies.append({
                "alert_type": AlertType.UNASSIGNED_USAGE.value,
                "severity": AlertSeverity.CRITICAL.value,
                "message": f"Unauthorized telemetry logged for unassigned machine ({recent_log.engine_hours}h engine, {recent_log.fuel_usage or 0:.1f}L fuel)",
                "explanation": (
                    f"Equipment '{equipment.equipment_id}' is currently registered as UNASSIGNED / AVAILABLE in the yard depot, "
                    f"but telemetry on {recent_log.date} recorded {recent_log.engine_hours}h engine operation and "
                    f"{recent_log.fuel_usage or 0:.1f}L fuel burn at site '{recent_log.site_id or 'Depot Yard'}'. "
                    f"Potential undocumented deployment or unauthorized yard movement."
                ),
            })
    
    if not logs:
        return anomalies
    
    recent_log = logs[0]
    total_engine_hist = sum(l.engine_hours for l in logs)
    total_idle_hist = sum(l.idle_hours for l in logs)
    total_hours_hist = total_engine_hist + total_idle_hist
    
    # =========================================================================
    # 2. CHRONIC LONG IDLE HOURS MISUSE (Historical Telemetry Analysis)
    # =========================================================================
    if total_hours_hist > 15.0 and len(logs) >= 3:
        historical_idle_ratio = (total_idle_hist / total_hours_hist) * 100.0
        avg_idle_per_day = total_idle_hist / len(logs)
        avg_engine_per_day = total_engine_hist / len(logs)
        
        # If over 65% of total logged hours across history was non-productive idle
        if historical_idle_ratio >= 65.0 and avg_idle_per_day >= 5.0:
            anomalies.append({
                "alert_type": AlertType.CHRONIC_IDLE.value,
                "severity": AlertSeverity.WARNING.value,
                "message": f"Chronic high idle ratio ({historical_idle_ratio:.1f}% idle over {len(logs)} days)",
                "explanation": (
                    f"Across the last {len(logs)} operating days, {historical_idle_ratio:.1f}% of machine runtime was spent idling "
                    f"(avg {avg_idle_per_day:.1f}h idle/day vs only {avg_engine_per_day:.1f}h engine work). "
                    f"Prolonged idling results in excessive diesel waste, unbilled engine wear, and exhaust DPF soot clogging."
                ),
            })
    # Single-day acute idle surge
    elif recent_log.idle_hours >= 8.0 and recent_log.engine_hours <= 1.5:
        anomalies.append({
            "alert_type": AlertType.HIGH_IDLE_TIME.value,
            "severity": AlertSeverity.WARNING.value,
            "message": f"Severe single-day idle spike ({recent_log.idle_hours}h idle, {recent_log.engine_hours}h engine)",
            "explanation": (
                f"On {recent_log.date}, the machine idled for {recent_log.idle_hours} hours with only {recent_log.engine_hours} hours "
                f"of productive engine work. Immediate site operator check recommended."
            ),
        })

    # =========================================================================
    # 3. ABNORMAL FUEL USAGE / POTENTIAL SIPHONING
    # =========================================================================
    if recent_log.fuel_usage:
        # Calculate historical fuel burn per engine hour if multiple logs exist
        historical_fuel_logs = [l for l in logs[1:] if l.fuel_usage and l.engine_hours > 0.5]
        if historical_fuel_logs:
            avg_fuel_per_hour = sum(l.fuel_usage / l.engine_hours for l in historical_fuel_logs) / len(historical_fuel_logs)
            recent_fuel_per_hour = recent_log.fuel_usage / max(recent_log.engine_hours, 0.5)
            
            if recent_fuel_per_hour > (avg_fuel_per_hour * 2.5) and recent_log.fuel_usage >= 40.0:
                anomalies.append({
                    "alert_type": AlertType.ABNORMAL_FUEL.value,
                    "severity": AlertSeverity.CRITICAL.value,
                    "message": f"Abnormal fuel consumption spike ({recent_log.fuel_usage:.1f} L vs {avg_fuel_per_hour:.1f} L/hr baseline)",
                    "explanation": (
                        f"Logged fuel consumption of {recent_log.fuel_usage:.1f} L on {recent_log.date} exceeds historical baseline "
                        f"({avg_fuel_per_hour:.1f} L/hr) by {recent_fuel_per_hour / avg_fuel_per_hour:.1f}x. "
                        f"Potential fuel line leak, auxiliary power drain, or unauthorized fuel extraction."
                    ),
                })
        elif recent_log.fuel_usage > 60.0 and recent_log.engine_hours <= 2.0:
            anomalies.append({
                "alert_type": AlertType.ABNORMAL_FUEL.value,
                "severity": AlertSeverity.CRITICAL.value,
                "message": f"Abnormal fuel consumption detected ({recent_log.fuel_usage:.1f} L)",
                "explanation": (
                    f"Fuel consumption of {recent_log.fuel_usage:.1f} L was logged on {recent_log.date} despite low engine runtime "
                    f"({recent_log.engine_hours} hrs). Potential fuel siphon or auxiliary power draw."
                ),
            })

    # =========================================================================
    # 4. CONTINUOUS ENGINE OVERLOAD (Heavy Duty Abuse)
    # =========================================================================
    if len(logs) >= 3:
        consecutive_heavy_days = 0
        for l in logs[:3]:
            if l.engine_hours >= 13.0:
                consecutive_heavy_days += 1
        
        if consecutive_heavy_days >= 2:
            anomalies.append({
                "alert_type": AlertType.ENGINE_OVERLOAD.value,
                "severity": AlertSeverity.WARNING.value,
                "message": f"Continuous high-load duty cycle ({recent_log.engine_hours:.1f}h/day continuous)",
                "explanation": (
                    f"Machine operated for {consecutive_heavy_days} consecutive days with over 13.0 engine hours per day "
                    f"(latest: {recent_log.engine_hours:.1f} hrs on {recent_log.date}). "
                    f"High thermal stress detected; schedule preventive inspection for hydraulic fluids and filters."
                ),
            })

    # =========================================================================
    # 5. SUDDEN PRODUCTIVITY DROP VS HISTORICAL MOVING AVERAGE
    # =========================================================================
    if len(logs) >= 4:
        historical_engine_avg = sum(l.engine_hours for l in logs[1:]) / (len(logs) - 1)
        if historical_engine_avg >= 5.5 and recent_log.engine_hours <= 1.0 and recent_log.idle_hours >= 5.0:
            anomalies.append({
                "alert_type": AlertType.UNUSUAL_USAGE.value,
                "severity": AlertSeverity.WARNING.value,
                "message": "Sudden drop in productive engine usage",
                "explanation": (
                    f"Historical baseline is {historical_engine_avg:.1f} engine hours/day, but the latest record registered "
                    f"only {recent_log.engine_hours} engine hours with {recent_log.idle_hours} idle hours. "
                    f"Verify potential job-site delays or operator bottlenecks."
                ),
            })

    return anomalies
