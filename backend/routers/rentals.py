from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.schemas import CheckOutRequest, CheckInRequest, EquipmentResponse, RentalRecordResponse
from backend.services.rental_service import checkout_equipment, checkin_equipment, get_rental_history
from backend.services.equipment_service import get_equipment_with_metrics

router = APIRouter(prefix="/api/v1/rentals", tags=["Rentals"])

@router.post("/check-out", response_model=EquipmentResponse)
def handle_check_out(payload: CheckOutRequest, db: Session = Depends(get_db)):
    """
    Checks out an available equipment unit to an anonymized customer/site/operator.
    """
    equipment = checkout_equipment(payload, db)
    return get_equipment_with_metrics(equipment, db)

@router.post("/check-in", response_model=EquipmentResponse)
def handle_check_in(payload: CheckInRequest, db: Session = Depends(get_db)):
    """
    Checks in a rented/overdue equipment unit, logging condition and resetting status to AVAILABLE.
    """
    equipment = checkin_equipment(payload, db)
    return get_equipment_with_metrics(equipment, db)

@router.get("/history", response_model=List[RentalRecordResponse])
def list_rental_history(
    equipment_id: Optional[str] = Query(None, description="Filter history by equipment ID"),
    db: Session = Depends(get_db)
):
    """
    Retrieves rental transaction records.
    """
    return get_rental_history(equipment_id, db)
