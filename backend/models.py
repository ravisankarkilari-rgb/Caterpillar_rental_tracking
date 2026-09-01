import enum
from datetime import datetime, date
from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    Date,
    DateTime,
    Boolean,
    ForeignKey,
    Enum as SAEnum,
    Index
)
from sqlalchemy.orm import relationship
from backend.database import Base

class EquipmentType(str, enum.Enum):
    EXCAVATOR = "Excavator"
    CRANE = "Crane"
    BULLDOZER = "Bulldozer"
    GRADER = "Grader"
    LOADER = "Loader"

class EquipmentStatus(str, enum.Enum):
    AVAILABLE = "AVAILABLE"
    RENTED = "RENTED"
    DUE_SOON = "DUE_SOON"
    OVERDUE = "OVERDUE"
    UNDER_UTILIZED = "UNDER_UTILIZED"

class AlertSeverity(str, enum.Enum):
    CRITICAL = "CRITICAL"  # Red (Overdue, Severe Anomaly)
    WARNING = "WARNING"    # Orange / Yellow (Under-utilized, High Idle, Due Soon)
    INFO = "INFO"          # Blue (Notices, Routine Check)

class AlertType(str, enum.Enum):
    OVERDUE_RENTAL = "Overdue Rental"
    RETURN_DUE_SOON = "Return Due Soon"
    UNDER_UTILIZED = "Under-utilized Equipment"
    UNUSUAL_USAGE = "Unusual Usage"
    HIGH_IDLE_TIME = "High Idle Time"
    ABNORMAL_FUEL = "Abnormal Fuel Usage"
    UNASSIGNED_USAGE = "Unassigned Asset Usage"
    CHRONIC_IDLE = "Chronic Idle Misuse"
    AFTER_HOURS_USAGE = "After-Hours Usage"
    ENGINE_OVERLOAD = "Continuous Engine Overload"

class Equipment(Base):
    __tablename__ = "equipment"

    id = Column(Integer, primary_key=True, index=True)
    equipment_id = Column(String(50), unique=True, index=True, nullable=False)
    equipment_type = Column(String(50), nullable=False)
    status = Column(String(30), default=EquipmentStatus.AVAILABLE.value, nullable=False)
    
    # Anonymized tracking fields
    customer_id = Column(String(50), nullable=True)
    site_id = Column(String(50), nullable=True)
    operator_id = Column(String(50), nullable=True)
    
    rental_start_date = Column(Date, nullable=True)
    expected_return_date = Column(Date, nullable=True)
    ignition_status = Column(String(10), default="OFF", nullable=False)  # "ON" or "OFF"
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    usage_logs = relationship("UsageLog", back_populates="equipment", cascade="all, delete-orphan")
    rental_records = relationship("RentalRecord", back_populates="equipment", cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="equipment", cascade="all, delete-orphan")

class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(String(50), unique=True, index=True, nullable=False)
    display_name = Column(String(100), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class Site(Base):
    __tablename__ = "sites"

    id = Column(Integer, primary_key=True, index=True)
    site_id = Column(String(50), unique=True, index=True, nullable=False)
    display_name = Column(String(100), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class Operator(Base):
    __tablename__ = "operators"

    id = Column(Integer, primary_key=True, index=True)
    operator_id = Column(String(50), unique=True, index=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class UsageLog(Base):
    __tablename__ = "usage_logs"

    id = Column(Integer, primary_key=True, index=True)
    equipment_id = Column(String(50), ForeignKey("equipment.equipment_id"), index=True, nullable=False)
    date = Column(Date, nullable=False)
    engine_hours = Column(Float, default=0.0, nullable=False)
    idle_hours = Column(Float, default=0.0, nullable=False)
    fuel_usage = Column(Float, default=0.0, nullable=True)  # in Litres / Gallons
    operating_days = Column(Integer, default=1, nullable=False)
    site_id = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    equipment = relationship("Equipment", back_populates="usage_logs")

    __table_args__ = (
        Index("idx_usage_equip_date", "equipment_id", "date"),
    )

class RentalRecord(Base):
    __tablename__ = "rental_records"

    id = Column(Integer, primary_key=True, index=True)
    equipment_id = Column(String(50), ForeignKey("equipment.equipment_id"), index=True, nullable=False)
    customer_id = Column(String(50), nullable=False)
    site_id = Column(String(50), nullable=False)
    operator_id = Column(String(50), nullable=True)
    check_out_date = Column(Date, nullable=False)
    expected_return_date = Column(Date, nullable=False)
    check_in_date = Column(Date, nullable=True)
    condition = Column(String(100), default="Good", nullable=True)
    status = Column(String(30), default="ACTIVE", nullable=False)  # ACTIVE, COMPLETED, OVERDUE
    created_at = Column(DateTime, default=datetime.utcnow)

    equipment = relationship("Equipment", back_populates="rental_records")

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    equipment_id = Column(String(50), ForeignKey("equipment.equipment_id"), index=True, nullable=False)
    alert_type = Column(String(50), nullable=False)
    severity = Column(String(20), nullable=False)  # CRITICAL, WARNING, INFO
    message = Column(String(255), nullable=False)
    explanation = Column(String(500), nullable=True)  # Why the alert triggered
    resolved = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)

    equipment = relationship("Equipment", back_populates="alerts")
