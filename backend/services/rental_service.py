from datetime import date, datetime
from typing import Optional, List
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from backend.models import Equipment, RentalRecord, EquipmentStatus, Alert
from backend.schemas import CheckOutRequest, CheckInRequest
from backend.services.alert_service import sync_alerts_for_equipment

def checkout_equipment(request: CheckOutRequest, db: Session) -> Equipment:
    # 1. Check equipment existence
    equipment = db.query(Equipment).filter(Equipment.equipment_id == request.equipment_id).first()
    if not equipment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Equipment '{request.equipment_id}' was not found in the fleet registry."
        )

    # 2. Check if already rented
    if equipment.status != EquipmentStatus.AVAILABLE.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Equipment '{request.equipment_id}' is currently {equipment.status}. It must be checked in before it can be rented again."
        )

    # 3. Validate dates
    if request.expected_return_date < request.rental_start_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Expected return date cannot be prior to the rental start date."
        )

    # 4. Create active rental record
    rental_record = RentalRecord(
        equipment_id=request.equipment_id,
        customer_id=request.customer_id,
        site_id=request.site_id,
        operator_id=request.operator_id,
        check_out_date=request.rental_start_date,
        expected_return_date=request.expected_return_date,
        status="ACTIVE"
    )
    db.add(rental_record)

    # 5. Update equipment state
    equipment.status = EquipmentStatus.RENTED.value
    equipment.customer_id = request.customer_id
    equipment.site_id = request.site_id
    equipment.operator_id = request.operator_id
    equipment.rental_start_date = request.rental_start_date
    equipment.expected_return_date = request.expected_return_date
    equipment.ignition_status = "ON"
    equipment.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(equipment)

    # 6. Re-evaluate alerts
    sync_alerts_for_equipment(equipment, db)

    return equipment

def checkin_equipment(request: CheckInRequest, db: Session) -> Equipment:
    # 1. Check equipment existence
    equipment = db.query(Equipment).filter(Equipment.equipment_id == request.equipment_id).first()
    if not equipment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Equipment '{request.equipment_id}' was not found in the fleet registry."
        )

    # 2. Check if currently rented
    if equipment.status == EquipmentStatus.AVAILABLE.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Equipment '{request.equipment_id}' is already marked as AVAILABLE. It cannot be checked in."
        )

    # 3. Complete the active rental record
    active_rental = (
        db.query(RentalRecord)
        .filter(
            RentalRecord.equipment_id == request.equipment_id,
            RentalRecord.status == "ACTIVE"
        )
        .order_by(RentalRecord.id.desc())
        .first()
    )
    
    if active_rental:
        active_rental.check_in_date = request.return_date
        active_rental.condition = request.condition
        active_rental.status = "COMPLETED"

    # 4. Reset equipment state to AVAILABLE
    equipment.status = EquipmentStatus.AVAILABLE.value
    equipment.customer_id = None
    equipment.site_id = None
    equipment.operator_id = None
    equipment.rental_start_date = None
    equipment.expected_return_date = None
    equipment.ignition_status = "OFF"
    equipment.updated_at = datetime.utcnow()

    # 5. Auto-resolve all open alerts for this equipment
    db.query(Alert).filter(
        Alert.equipment_id == equipment.equipment_id,
        Alert.resolved == False
    ).update({"resolved": True, "resolved_at": datetime.utcnow()})

    db.commit()
    db.refresh(equipment)

    return equipment

def get_rental_history(equipment_id: Optional[str], db: Session) -> List[RentalRecord]:
    query = db.query(RentalRecord)
    if equipment_id:
        query = query.filter(RentalRecord.equipment_id == equipment_id)
    return query.order_by(RentalRecord.created_at.desc()).all()
