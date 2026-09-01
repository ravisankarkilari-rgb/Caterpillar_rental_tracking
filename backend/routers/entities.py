from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import Customer, Site, Operator
from backend.schemas import (
    CustomerResponse, CustomerCreate,
    SiteResponse, SiteCreate,
    OperatorResponse, OperatorCreate
)
from backend.services.rbac import require_role

router = APIRouter(prefix="/api/v1/entities", tags=["Entities"])

# --- CUSTOMERS ---
@router.get("/customers", response_model=List[CustomerResponse])
def get_customers(db: Session = Depends(get_db)):
    return db.query(Customer).order_by(Customer.customer_id.asc()).all()

@router.post("/customers", response_model=CustomerResponse, status_code=status.HTTP_201_CREATED, dependencies=[Depends(require_role(["ADMIN"]))])
def create_customer(payload: CustomerCreate, db: Session = Depends(get_db)):
    cid = payload.customer_id.strip().upper()
    existing = db.query(Customer).filter(Customer.customer_id == cid).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Customer '{cid}' already exists."
        )
    cust = Customer(customer_id=cid, display_name=payload.display_name.strip())
    db.add(cust)
    db.commit()
    db.refresh(cust)
    return cust

@router.delete("/customers/{customer_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(require_role(["ADMIN"]))])
def delete_customer(customer_id: str, db: Session = Depends(get_db)):
    cust = db.query(Customer).filter(Customer.customer_id == customer_id).first()
    if not cust:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found.")
    db.delete(cust)
    db.commit()
    return None

# --- SITES ---
@router.get("/sites", response_model=List[SiteResponse])
def get_sites(db: Session = Depends(get_db)):
    return db.query(Site).order_by(Site.site_id.asc()).all()

@router.post("/sites", response_model=SiteResponse, status_code=status.HTTP_201_CREATED, dependencies=[Depends(require_role(["ADMIN"]))])
def create_site(payload: SiteCreate, db: Session = Depends(get_db)):
    sid = payload.site_id.strip().upper()
    existing = db.query(Site).filter(Site.site_id == sid).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Site '{sid}' already exists."
        )
    s = Site(site_id=sid, display_name=payload.display_name.strip())
    db.add(s)
    db.commit()
    db.refresh(s)
    return s

@router.delete("/sites/{site_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(require_role(["ADMIN"]))])
def delete_site(site_id: str, db: Session = Depends(get_db)):
    s = db.query(Site).filter(Site.site_id == site_id).first()
    if not s:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Site not found.")
    db.delete(s)
    db.commit()
    return None

# --- OPERATORS ---
@router.get("/operators", response_model=List[OperatorResponse])
def get_operators(db: Session = Depends(get_db)):
    return db.query(Operator).order_by(Operator.operator_id.asc()).all()

@router.post("/operators", response_model=OperatorResponse, status_code=status.HTTP_201_CREATED, dependencies=[Depends(require_role(["ADMIN"]))])
def create_operator(payload: OperatorCreate, db: Session = Depends(get_db)):
    op_id = payload.operator_id.strip().upper()
    existing = db.query(Operator).filter(Operator.operator_id == op_id).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Operator '{op_id}' already exists."
        )
    op = Operator(operator_id=op_id)
    db.add(op)
    db.commit()
    db.refresh(op)
    return op

@router.delete("/operators/{operator_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(require_role(["ADMIN"]))])
def delete_operator(operator_id: str, db: Session = Depends(get_db)):
    op = db.query(Operator).filter(Operator.operator_id == operator_id).first()
    if not op:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Operator not found.")
    db.delete(op)
    db.commit()
    return None
