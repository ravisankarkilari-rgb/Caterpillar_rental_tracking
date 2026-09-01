import os
import pytest
from datetime import date, timedelta
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from backend.database import Base, get_db
from backend.main import app
from backend.models import Equipment, EquipmentStatus, Customer, Site, Operator, UsageLog, Alert
from backend.services.seed_data import seed_database

# Use in-memory SQLite with StaticPool so all connections share the same memory database
SQLALCHEMY_TEST_DATABASE_URL = "sqlite:///:memory:"

test_engine = create_engine(
    SQLALCHEMY_TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(scope="module", autouse=True)
def setup_test_db():
    Base.metadata.create_all(bind=test_engine)
    db = TestingSessionLocal()
    seed_database(db)
    db.close()
    yield
    Base.metadata.drop_all(bind=test_engine)

@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c

def test_health_check(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_list_equipment(client):
    response = client.get("/api/v1/equipment")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 25
    assert any(e["equipment_id"] == "EXQ1001" for e in data)

def test_search_equipment(client):
    response = client.get("/api/v1/equipment?search=EXQ1003")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["equipment_id"] == "EXQ1003"
    assert data[0]["status"] == "OVERDUE"

def test_dashboard_summary(client):
    response = client.get("/api/v1/analytics/dashboard-summary")
    assert response.status_code == 200
    data = response.json()
    assert data["total_equipment"] >= 25
    assert data["rented"] > 0
    assert data["available"] > 0
    assert data["overdue"] > 0
    assert "fleet_utilization_rate" in data

def test_checkout_and_checkin_flow(client):
    # 1. Verify EXQ1004 is AVAILABLE
    res = client.get("/api/v1/equipment/EXQ1004")
    assert res.status_code == 200
    assert res.json()["status"] == "AVAILABLE"

    # 2. Check out EXQ1004
    today = date.today()
    return_date = today + timedelta(days=7)
    checkout_payload = {
        "equipment_id": "EXQ1004",
        "customer_id": "CUST001",
        "site_id": "SITE003",
        "operator_id": "OP101",
        "rental_start_date": str(today),
        "expected_return_date": str(return_date)
    }
    co_res = client.post("/api/v1/rentals/check-out", json=checkout_payload)
    assert co_res.status_code == 200
    assert co_res.json()["status"] == "RENTED"
    assert co_res.json()["customer_id"] == "CUST001"

    # 3. Trying to check out again should fail (validation check)
    co_fail = client.post("/api/v1/rentals/check-out", json=checkout_payload)
    assert co_fail.status_code == 400
    assert "currently RENTED" in co_fail.json()["detail"]

    # 4. Check in EXQ1004
    checkin_payload = {
        "equipment_id": "EXQ1004",
        "return_date": str(today),
        "condition": "Good"
    }
    ci_res = client.post("/api/v1/rentals/check-in", json=checkin_payload)
    assert ci_res.status_code == 200
    assert ci_res.json()["status"] == "AVAILABLE"
    assert ci_res.json()["customer_id"] is None

    # 5. Trying to check in an already available machine should fail
    ci_fail = client.post("/api/v1/rentals/check-in", json=checkin_payload)
    assert ci_fail.status_code == 400

def test_alerts_listing_and_resolution(client):
    # Fetch alerts
    response = client.get("/api/v1/alerts")
    assert response.status_code == 200
    alerts = response.json()
    assert len(alerts) > 0
    
    # Check that overdue alert exists with explanation
    overdue_alert = next((a for a in alerts if a["alert_type"] == "Overdue Rental"), None)
    assert overdue_alert is not None
    assert overdue_alert["severity"] == "CRITICAL"
    assert "Expected return date was" in overdue_alert["explanation"]
    
    # Resolve the alert
    res_alert = client.post(f"/api/v1/alerts/{overdue_alert['id']}/resolve")
    assert res_alert.status_code == 200
    assert res_alert.json()["resolved"] is True

def test_demand_forecasting(client):
    response = client.get("/api/v1/analytics/demand-forecast")
    assert response.status_code == 200
    data = response.json()
    assert "forecast_items" in data
    assert len(data["forecast_items"]) >= 5
    excavator_forecast = next((item for item in data["forecast_items"] if item["equipment_type"] == "Excavator"), None)
    assert excavator_forecast is not None
    assert excavator_forecast["predicted_next_period_demand"] > 0
    assert "moving average" in excavator_forecast["explanation"].lower()

def test_remote_ignition_control(client):
    # Test turning ignition OFF on EXQ1001
    off_res = client.post("/api/v1/equipment/EXQ1001/ignition", json={"state": "OFF", "reason": "End of shift lockout"})
    assert off_res.status_code == 200
    assert off_res.json()["ignition_status"] == "OFF"

    # Test turning ignition ON on EXQ1001
    on_res = client.post("/api/v1/equipment/EXQ1001/ignition", json={"state": "ON", "reason": "Operator shift start"})
    assert on_res.status_code == 200
    assert on_res.json()["ignition_status"] == "ON"

    # Test invalid state
    inv_res = client.post("/api/v1/equipment/EXQ1001/ignition", json={"state": "STANDBY"})
    assert inv_res.status_code == 400

def test_fleet_telemetry_per_type(client):
    response = client.get("/api/v1/analytics/fleet-metrics")
    assert response.status_code == 200
    data = response.json()
    assert "by_type_trend" in data
    assert "type_telemetry" in data
    assert "multi_type_comparison" in data
    
    # Check per-type telemetry summary for Excavator
    assert "Excavator" in data["type_telemetry"]
    exc_telem = data["type_telemetry"]["Excavator"]
    assert "total_engine_hours" in exc_telem
    assert "total_idle_hours" in exc_telem
    assert "telemetry_utilization" in exc_telem

    # Check per-type trend data
    assert "Excavator" in data["by_type_trend"]
    assert len(data["by_type_trend"]["Excavator"]) > 0

def test_rbac_manager_forbidden_admin_endpoints(client):
    # Manager trying to add equipment -> 403
    res_add = client.post("/api/v1/equipment", json={"equipment_id": "EXQ9999", "equipment_type": "Loader"}, headers={"x-user-role": "MANAGER"})
    assert res_add.status_code == 403

    # Manager trying to update equipment -> 403
    res_put = client.put("/api/v1/equipment/EXQ1001", json={"equipment_type": "Crane"}, headers={"x-user-role": "MANAGER"})
    assert res_put.status_code == 403

    # Manager trying to deactivate equipment -> 403
    res_deact = client.patch("/api/v1/equipment/EXQ1001/deactivate", headers={"x-user-role": "MANAGER"})
    assert res_deact.status_code == 403

    # Manager trying to view users -> 403
    res_users = client.get("/api/v1/users", headers={"x-user-role": "MANAGER"})
    assert res_users.status_code == 403

    # Manager trying to view settings -> 403
    res_set = client.get("/api/v1/settings", headers={"x-user-role": "MANAGER"})
    assert res_set.status_code == 403

def test_rbac_viewer_forbidden_operations(client):
    # Viewer trying to check out -> 403
    today = date.today()
    res_co = client.post("/api/v1/rentals/check-out", json={
        "equipment_id": "EXQ1004",
        "customer_id": "CUST001",
        "site_id": "SITE001",
        "expected_return_date": str(today + timedelta(days=5))
    }, headers={"x-user-role": "VIEWER"})
    assert res_co.status_code == 403

    # Viewer trying to resolve alert -> 403
    res_res = client.post("/api/v1/alerts/1/resolve", json={"resolved": True}, headers={"x-user-role": "VIEWER"})
    assert res_res.status_code == 403

def test_rbac_admin_full_access(client):
    # Admin can list users
    res_users = client.get("/api/v1/users", headers={"x-user-role": "ADMIN"})
    assert res_users.status_code == 200
    assert len(res_users.json()) > 0

    # Admin can list settings
    res_set = client.get("/api/v1/settings", headers={"x-user-role": "ADMIN"})
    assert res_set.status_code == 200
    assert len(res_set.json()) > 0

def test_database_authentication_success(client):
    # Valid email & password
    res = client.post("/api/v1/auth/login", json={
        "email": "admin@caterpillar.com",
        "password": "password123"
    })
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["role"] == "ADMIN"
    assert data["email"] == "admin@caterpillar.com"

def test_database_authentication_invalid_password(client):
    # Wrong password -> 401 Unauthorized
    res = client.post("/api/v1/auth/login", json={
        "email": "admin@caterpillar.com",
        "password": "wrong_password_999"
    })
    assert res.status_code == 401
    assert "Invalid email/username or password" in res.json()["detail"]

def test_database_authentication_unknown_user(client):
    # Unknown user -> 401 Unauthorized
    res = client.post("/api/v1/auth/login", json={
        "email": "nonexistent_user@caterpillar.com",
        "password": "password123"
    })
    assert res.status_code == 401

def test_database_authentication_disabled_user(client):
    # Disable manager user account
    client.patch("/api/v1/users/USR_MGR01/status?status_value=DISABLED", headers={"x-user-role": "ADMIN"})

    # Attempt login with disabled account -> 403 Forbidden
    res = client.post("/api/v1/auth/login", json={
        "email": "manager@caterpillar.com",
        "password": "password123"
    })
    assert res.status_code == 403
    assert "disabled" in res.json()["detail"].lower()

    # Re-enable user account for rest of test suite
    client.patch("/api/v1/users/USR_MGR01/status?status_value=ACTIVE", headers={"x-user-role": "ADMIN"})



