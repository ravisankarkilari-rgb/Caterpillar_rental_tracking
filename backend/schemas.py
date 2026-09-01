from datetime import date as dt_date, datetime as dt_datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, ConfigDict

# ==================== Equipment Schemas ====================
class EquipmentBase(BaseModel):
    equipment_id: str = Field(..., description="Unique equipment ID (e.g. EXQ1001)")
    equipment_type: str = Field(..., description="Type of equipment (Excavator, Crane, Bulldozer, Grader, Loader)")

class EquipmentCreate(EquipmentBase):
    pass

class EquipmentUpdate(BaseModel):
    equipment_type: Optional[str] = None
    customer_id: Optional[str] = None
    site_id: Optional[str] = None
    operator_id: Optional[str] = None
    rental_start_date: Optional[dt_date] = None
    expected_return_date: Optional[dt_date] = None
    status: Optional[str] = None

class EquipmentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    equipment_id: str
    equipment_type: str
    status: str
    customer_id: Optional[str] = None
    site_id: Optional[str] = None
    operator_id: Optional[str] = None
    rental_start_date: Optional[dt_date] = None
    expected_return_date: Optional[dt_date] = None
    ignition_status: str = "OFF"
    created_at: dt_datetime
    updated_at: dt_datetime

    # Calculated properties on response
    engine_hours_per_day: float = 0.0
    idle_hours_per_day: float = 0.0
    total_engine_hours: float = 0.0
    total_idle_hours: float = 0.0
    operating_days: int = 0
    utilization_percentage: float = 0.0
    days_overdue: int = 0
    days_remaining: Optional[int] = None
    active_alert_count: int = 0

class IgnitionControlRequest(BaseModel):
    state: str = Field(..., description="Target ignition state: 'ON' or 'OFF'")
    reason: Optional[str] = Field(None, description="Optional managerial reason for ignition command")

# ==================== Rental Schemas ====================
class CheckOutRequest(BaseModel):
    equipment_id: str = Field(..., description="Equipment ID to check out")
    customer_id: str = Field(..., description="Anonymized Customer ID (e.g. CUST001)")
    site_id: str = Field(..., description="Anonymized Site ID (e.g. SITE003)")
    operator_id: Optional[str] = Field(None, description="Anonymized Operator ID (e.g. OP101)")
    rental_start_date: dt_date = Field(default_factory=dt_date.today)
    expected_return_date: dt_date = Field(..., description="Expected return date")

class CheckInRequest(BaseModel):
    equipment_id: str = Field(..., description="Equipment ID to check in")
    return_date: dt_date = Field(default_factory=dt_date.today)
    condition: str = Field("Good", description="Condition of equipment upon check-in")

class RentalRecordResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    equipment_id: str
    customer_id: str
    site_id: str
    operator_id: Optional[str] = None
    check_out_date: dt_date
    expected_return_date: dt_date
    check_in_date: Optional[dt_date] = None
    condition: Optional[str] = None
    status: str
    created_at: dt_datetime

# ==================== Usage Logs Schemas ====================
class UsageLogCreate(BaseModel):
    equipment_id: str
    date: dt_date = Field(default_factory=dt_date.today)
    engine_hours: float = Field(..., ge=0.0, le=24.0)
    idle_hours: float = Field(..., ge=0.0, le=24.0)
    fuel_usage: Optional[float] = Field(0.0, ge=0.0)
    operating_days: int = Field(1, ge=1)
    site_id: Optional[str] = None

class UsageLogResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    equipment_id: str
    date: dt_date
    engine_hours: float
    idle_hours: float
    fuel_usage: Optional[float] = 0.0
    operating_days: int
    site_id: Optional[str] = None
    utilization_percentage: float = 0.0
    created_at: dt_datetime

# ==================== Alert Schemas ====================
class AlertResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    equipment_id: str
    equipment_type: Optional[str] = None
    alert_type: str
    severity: str
    message: str
    explanation: Optional[str] = None
    resolved: bool
    created_at: dt_datetime
    resolved_at: Optional[dt_datetime] = None

class AlertResolveRequest(BaseModel):
    resolved: bool = True

# ==================== Entities Schemas ====================
class CustomerResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    customer_id: str
    display_name: str

class SiteResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    site_id: str
    display_name: str

class OperatorResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    operator_id: str

# ==================== Analytics & Dashboard Schemas ====================
class DashboardSummaryResponse(BaseModel):
    total_equipment: int
    rented: int
    available: int
    overdue: int
    under_utilized: int
    due_soon: int
    active_alerts: int
    fleet_utilization_rate: float
    avg_engine_hours: float
    avg_idle_hours: float

class DemandForecastItem(BaseModel):
    equipment_type: str
    current_active_demand: int
    historical_avg_demand: float
    predicted_next_period_demand: int
    trend_percentage: float
    confidence_level: str
    explanation: str

class DemandForecastResponse(BaseModel):
    forecast_period: str
    historical_months: List[str]
    forecast_items: List[DemandForecastItem]

class FleetMetricsResponse(BaseModel):
    by_type: Dict[str, Any]
    by_status: Dict[str, int]
    utilization_distribution: Dict[str, int]
    recent_usage_trend: List[Dict[str, Any]]
    by_type_trend: Optional[Dict[str, List[Dict[str, Any]]]] = {}
    type_telemetry: Optional[Dict[str, Dict[str, Any]]] = {}
    multi_type_comparison: Optional[List[Dict[str, Any]]] = []

