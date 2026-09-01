from datetime import date, datetime
from typing import List
from sqlalchemy.orm import Session
from backend.models import Equipment, Alert, AlertType, AlertSeverity, EquipmentStatus
from backend.services.equipment_service import calculate_equipment_metrics
from backend.services.anomaly_service import detect_anomalies_for_equipment

def sync_alerts_for_equipment(equipment: Equipment, db: Session):
    """
    Synchronizes active alerts based on equipment state:
    - Overdue alerts
    - Due soon alerts
    - Under-utilization alerts
    - Explainable telemetry anomalies (chronic idle, unassigned usage, fuel siphoning, engine overload)
    """
    today = date.today()
    metrics = calculate_equipment_metrics(equipment, db)
    
    # 1. If equipment is Available, auto-resolve rental-date alerts (but keep misuse/anomaly checks active)
    if equipment.status == EquipmentStatus.AVAILABLE.value:
        db.query(Alert).filter(
            Alert.equipment_id == equipment.equipment_id,
            Alert.resolved == False,
            Alert.alert_type.in_([
                AlertType.OVERDUE_RENTAL.value,
                AlertType.RETURN_DUE_SOON.value,
                AlertType.UNDER_UTILIZED.value
            ])
        ).update({"resolved": True, "resolved_at": datetime.utcnow()})
        db.commit()
    else:
        # Check Overdue Rental
        if metrics["days_overdue"] > 0:
            existing_overdue = db.query(Alert).filter(
                Alert.equipment_id == equipment.equipment_id,
                Alert.alert_type == AlertType.OVERDUE_RENTAL.value,
                Alert.resolved == False
            ).first()
            
            msg = f"Rental overdue by {metrics['days_overdue']} day{'s' if metrics['days_overdue'] > 1 else ''}"
            expl = f"Expected return date was {equipment.expected_return_date} ({metrics['days_overdue']} days ago). Rented by customer {equipment.customer_id} at site {equipment.site_id}."
            
            if existing_overdue:
                existing_overdue.message = msg
                existing_overdue.explanation = expl
            else:
                # Resolve any previous 'Due Soon' alert if it became overdue
                db.query(Alert).filter(
                    Alert.equipment_id == equipment.equipment_id,
                    Alert.alert_type == AlertType.RETURN_DUE_SOON.value,
                    Alert.resolved == False
                ).update({"resolved": True, "resolved_at": datetime.utcnow()})
                
                db.add(Alert(
                    equipment_id=equipment.equipment_id,
                    alert_type=AlertType.OVERDUE_RENTAL.value,
                    severity=AlertSeverity.CRITICAL.value,
                    message=msg,
                    explanation=expl,
                    resolved=False
                ))
        
        # Check Return Due Soon
        elif metrics["days_remaining"] is not None and 0 <= metrics["days_remaining"] <= 2:
            existing_due_soon = db.query(Alert).filter(
                Alert.equipment_id == equipment.equipment_id,
                Alert.alert_type == AlertType.RETURN_DUE_SOON.value,
                Alert.resolved == False
            ).first()
            
            days = metrics["days_remaining"]
            msg = f"Return due in {days} day{'s' if days != 1 else ''}" if days > 0 else "Return due today"
            expl = f"Equipment is scheduled for return on {equipment.expected_return_date}. Please prepare for check-in or renewal."
            
            if existing_due_soon:
                existing_due_soon.message = msg
                existing_due_soon.explanation = expl
            else:
                db.add(Alert(
                    equipment_id=equipment.equipment_id,
                    alert_type=AlertType.RETURN_DUE_SOON.value,
                    severity=AlertSeverity.WARNING.value,
                    message=msg,
                    explanation=expl,
                    resolved=False
                ))
                
        # Check Under-utilization
        if metrics["operating_days"] > 0 and metrics["utilization_percentage"] < 30.0:
            existing_under_util = db.query(Alert).filter(
                Alert.equipment_id == equipment.equipment_id,
                Alert.alert_type == AlertType.UNDER_UTILIZED.value,
                Alert.resolved == False
            ).first()
            
            msg = f"Low equipment utilization ({metrics['utilization_percentage']}%)"
            expl = f"Average utilization over {metrics['operating_days']} operating days is {metrics['utilization_percentage']}%, which is below the 30% threshold ({metrics['engine_hours_per_day']}h engine vs {metrics['idle_hours_per_day']}h idle per day)."
            
            if existing_under_util:
                existing_under_util.message = msg
                existing_under_util.explanation = expl
            else:
                db.add(Alert(
                    equipment_id=equipment.equipment_id,
                    alert_type=AlertType.UNDER_UTILIZED.value,
                    severity=AlertSeverity.WARNING.value,
                    message=msg,
                    explanation=expl,
                    resolved=False
                ))
            
    # 2. Check Telemetry & Asset Misuse Anomalies (Evaluated for all fleet assets)
    anomalies = detect_anomalies_for_equipment(equipment, db)
    for anom in anomalies:
        existing_anom = db.query(Alert).filter(
            Alert.equipment_id == equipment.equipment_id,
            Alert.alert_type == anom["alert_type"],
            Alert.resolved == False
        ).first()
        
        if existing_anom:
            existing_anom.severity = anom["severity"]
            existing_anom.message = anom["message"]
            existing_anom.explanation = anom["explanation"]
        else:
            db.add(Alert(
                equipment_id=equipment.equipment_id,
                alert_type=anom["alert_type"],
                severity=anom["severity"],
                message=anom["message"],
                explanation=anom["explanation"],
                resolved=False
            ))
            
    db.commit()

def sync_all_alerts(db: Session):
    equipments = db.query(Equipment).all()
    for equip in equipments:
        sync_alerts_for_equipment(equip, db)
