from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import Customer, Site, Operator
from backend.schemas import CustomerResponse, SiteResponse, OperatorResponse

router = APIRouter(prefix="/api/v1/entities", tags=["Entities"])

@router.get("/customers", response_model=List[CustomerResponse])
def get_customers(db: Session = Depends(get_db)):
    return db.query(Customer).order_by(Customer.customer_id.asc()).all()

@router.get("/sites", response_model=List[SiteResponse])
def get_sites(db: Session = Depends(get_db)):
    return db.query(Site).order_by(Site.site_id.asc()).all()

@router.get("/operators", response_model=List[OperatorResponse])
def get_operators(db: Session = Depends(get_db)):
    return db.query(Operator).order_by(Operator.operator_id.asc()).all()
