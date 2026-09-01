from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.schemas import DashboardSummaryResponse, FleetMetricsResponse, DemandForecastResponse
from backend.services.analytics_service import get_dashboard_summary, get_fleet_metrics, get_demand_forecast
from backend.services.alert_service import sync_all_alerts

router = APIRouter(prefix="/api/v1/analytics", tags=["Analytics"])

@router.get("/dashboard-summary", response_model=DashboardSummaryResponse)
def get_summary(db: Session = Depends(get_db)):
    sync_all_alerts(db)
    return get_dashboard_summary(db)

@router.get("/fleet-metrics", response_model=FleetMetricsResponse)
def get_metrics(db: Session = Depends(get_db)):
    return get_fleet_metrics(db)

@router.get("/demand-forecast", response_model=DemandForecastResponse)
def get_forecast(db: Session = Depends(get_db)):
    return get_demand_forecast(db)
