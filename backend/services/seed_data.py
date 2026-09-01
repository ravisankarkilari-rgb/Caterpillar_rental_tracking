from datetime import date, timedelta
from sqlalchemy.orm import Session
from backend.models import Equipment, Customer, Site, Operator, UsageLog, RentalRecord, EquipmentStatus, User, SystemSetting
from backend.services.alert_service import sync_all_alerts

from backend.services.auth_service import hash_password

def seed_database(db: Session):
    """
    Populates database with realistic, privacy-compliant enterprise equipment data and user accounts.
    """
    default_pass_hash = hash_password("password123")

    # 0. Seed Users & System Settings if empty
    if db.query(User).count() == 0:
        demo_users = [
            User(user_id="USR_ADMIN01", username="admin", email="admin@caterpillar.com", password_hash=default_pass_hash, role="ADMIN", status="ACTIVE"),
            User(user_id="USR_MGR01", username="manager", email="manager@caterpillar.com", password_hash=default_pass_hash, role="MANAGER", status="ACTIVE"),
            User(user_id="USR_VIEW01", username="viewer", email="viewer@caterpillar.com", password_hash=default_pass_hash, role="VIEWER", status="ACTIVE"),
            User(user_id="USR_MGR02", username="operations", email="ops@caterpillar.com", password_hash=default_pass_hash, role="MANAGER", status="ACTIVE"),
        ]
        db.add_all(demo_users)
    else:
        # Ensure any existing users in DB without password_hash get populated
        existing_users = db.query(User).filter((User.password_hash == None) | (User.password_hash == "")).all()
        for u in existing_users:
            u.password_hash = default_pass_hash

    if db.query(SystemSetting).count() == 0:
        demo_settings = [
            SystemSetting(key="system_name", value="Smart Rental Tracking System", description="Enterprise fleet application title"),
            SystemSetting(key="max_idle_threshold_pct", value="30.0", description="Threshold percentage for under-utilization alerts"),
            SystemSetting(key="overdue_grace_period_days", value="0", description="Days grace period before marking rental overdue"),
            SystemSetting(key="require_operator_assignment", value="true", description="Enforce operator assignment during check-out"),
            SystemSetting(key="telemetry_sync_frequency_minutes", value="15", description="Interval for telematics data sync"),
        ]
        db.add_all(demo_settings)

    db.commit()

    # Check if equipment fleet already seeded
    if db.query(Equipment).count() > 0:
        return


    today = date.today()

    # 1. Customers (Anonymized + Enterprise Project Account)
    customers = [
        Customer(customer_id="CUST001", display_name="CUST001 (Alpha Infrastructure)"),
        Customer(customer_id="CUST002", display_name="CUST002 (Summit Heavy Civil)"),
        Customer(customer_id="CUST003", display_name="CUST003 (Vanguard Mining Group)"),
        Customer(customer_id="CUST004", display_name="CUST004 (Crestline Earthworks)"),
        Customer(customer_id="CUST005", display_name="CUST005 (Metro Rail Joint Venture)"),
        Customer(customer_id="CUST006", display_name="CUST006 (Pinnacle Energy Works)"),
    ]
    db.add_all(customers)

    # 2. Sites (Anonymized + Site descriptor)
    sites = [
        Site(site_id="SITE001", display_name="SITE001 (North Expressway Ext)"),
        Site(site_id="SITE002", display_name="SITE002 (Valley Hydro Dam Project)"),
        Site(site_id="SITE003", display_name="SITE003 (Metro Tunnel Shaft 4)"),
        Site(site_id="SITE004", display_name="SITE004 (Harbor Deepwater Terminal)"),
        Site(site_id="SITE005", display_name="SITE005 (East Quarry Open Pit)"),
        Site(site_id="SITE006", display_name="SITE006 (Skyline Tower Complex)"),
        Site(site_id="SITE007", display_name="SITE007 (Logistics Park Sector B)"),
        Site(site_id="SITE008", display_name="SITE008 (Desert Solar Farm 500MW)"),
    ]
    db.add_all(sites)

    # 3. Operators (Anonymized IDs)
    operators = [
        Operator(operator_id=f"OP10{i}") for i in range(1, 16)
    ]
    db.add_all(operators)

    # 4. Equipment Fleet (25 units across 5 types)
    fleet_specs = [
        # (equipment_id, type, status, customer_id, site_id, op_id, start_delta_days, return_delta_days)
        ("EXQ1001", "Excavator", "RENTED", "CUST001", "SITE003", "OP101", -14, 1),    # Due in 1 day
        ("EXQ1002", "Crane", "RENTED", "CUST002", "SITE004", "OP102", -20, 15),     # Active
        ("EXQ1003", "Bulldozer", "RENTED", "CUST001", "SITE002", "OP103", -25, -4),  # Overdue by 4 days
        ("EXQ1004", "Grader", "AVAILABLE", None, None, None, None, None),            # Available
        ("EXQ1005", "Loader", "RENTED", "CUST003", "SITE005", "OP104", -10, 20),     # Active
        ("EXQ1006", "Excavator", "RENTED", "CUST004", "SITE001", "OP105", -12, 18),   # Active
        ("EXQ1007", "Excavator", "RENTED", "CUST005", "SITE006", "OP106", -15, 10),   # Under-utilized (2h engine, 10h idle)
        ("EXQ1008", "Crane", "AVAILABLE", None, None, None, None, None),              # Available
        ("EXQ1009", "Bulldozer", "RENTED", "CUST002", "SITE007", "OP107", -30, -2),  # Overdue by 2 days
        ("EXQ1010", "Grader", "RENTED", "CUST006", "SITE008", "OP108", -8, 22),      # Active
        ("EXQ1011", "Loader", "AVAILABLE", None, None, None, None, None),             # Available
        ("EXQ1012", "Excavator", "RENTED", "CUST003", "SITE005", "OP109", -5, 25),    # Active
        ("EXQ1013", "Crane", "RENTED", "CUST001", "SITE003", "OP110", -18, 2),       # Due in 2 days
        ("EXQ1014", "Bulldozer", "AVAILABLE", None, None, None, None, None),          # Available
        ("EXQ1015", "Grader", "RENTED", "CUST004", "SITE001", "OP111", -7, 14),      # Active
        ("EXQ1016", "Loader", "RENTED", "CUST005", "SITE006", "OP112", -16, 12),     # Active
        ("EXQ1017", "Excavator", "RENTED", "CUST002", "SITE004", "OP113", -22, 8),   # Under-utilized (1.5h engine, 8.5h idle)
        ("EXQ1018", "Crane", "AVAILABLE", None, None, None, None, None),              # Available
        ("EXQ1019", "Bulldozer", "RENTED", "CUST006", "SITE008", "OP114", -9, 21),   # Active
        ("EXQ1020", "Grader", "AVAILABLE", None, None, None, None, None),             # Available
        ("EXQ1021", "Loader", "RENTED", "CUST001", "SITE002", "OP115", -11, 19),     # Active
        ("EXQ1022", "Excavator", "AVAILABLE", None, None, None, None, None),          # Available
        ("EXQ1023", "Crane", "RENTED", "CUST003", "SITE005", "OP101", -14, 16),      # Active
        ("EXQ1024", "Bulldozer", "RENTED", "CUST004", "SITE007", "OP102", -19, 11),  # Active
        ("EXQ1025", "Loader", "RENTED", "CUST005", "SITE006", "OP103", -6, 24),      # Active
    ]

    equipment_objs = []
    for item in fleet_specs:
        eq_id, eq_type, init_status, cust, site, op, s_delta, r_delta = item
        
        s_date = today + timedelta(days=s_delta) if s_delta is not None else None
        r_date = today + timedelta(days=r_delta) if r_delta is not None else None
        
        equip = Equipment(
            equipment_id=eq_id,
            equipment_type=eq_type,
            status=init_status,
            customer_id=cust,
            site_id=site,
            operator_id=op,
            rental_start_date=s_date,
            expected_return_date=r_date,
            ignition_status="ON" if init_status != "AVAILABLE" else "OFF",
        )
        equipment_objs.append(equip)
        db.add(equip)
        
        # If rented, also create active rental record
        if init_status != "AVAILABLE" and cust and site:
            rec = RentalRecord(
                equipment_id=eq_id,
                customer_id=cust,
                site_id=site,
                operator_id=op,
                check_out_date=s_date,
                expected_return_date=r_date,
                status="ACTIVE"
            )
            db.add(rec)

    db.commit()

    # 5. Usage Logs (14 daily logs per equipment to establish patterns and anomalies)
    for equip in equipment_objs:
        for d in range(13, -1, -1):
            log_date = today - timedelta(days=d)
            
            # Tailor usage based on equipment profile
            if equip.equipment_id in ["EXQ1007", "EXQ1017"]:
                # Chronic High Idle / Under-utilized machine
                engine = 1.8 if d != 0 else 1.2
                idle = 9.5 if d != 0 else 10.5
                fuel = 18.0
            elif equip.equipment_id == "EXQ1008" and d == 0:
                # Anomaly: Unassigned machine logged usage while AVAILABLE
                engine = 3.5
                idle = 2.0
                fuel = 24.0
            elif equip.equipment_id == "EXQ1005" and d == 0:
                # Anomaly: Abnormal fuel usage spike
                engine = 1.5
                idle = 3.0
                fuel = 75.0  # Spike
            elif equip.equipment_id == "EXQ1024" and d in [0, 1, 2]:
                # Anomaly: Continuous engine overload
                engine = 14.5
                idle = 1.0
                fuel = 65.0
            elif equip.status == "AVAILABLE":
                # Parked in depot / zero active hours
                engine = 0.0
                idle = 0.0
                fuel = 0.0
            else:
                # Normal productive operation
                engine = 7.0 + (d % 3) * 0.5
                idle = 1.8 + (d % 2) * 0.4
                fuel = 38.0 + (d % 4) * 2.0

            log = UsageLog(
                equipment_id=equip.equipment_id,
                date=log_date,
                engine_hours=round(engine, 1),
                idle_hours=round(idle, 1),
                fuel_usage=round(fuel, 1),
                operating_days=1,
                site_id=equip.site_id
            )
            db.add(log)

    db.commit()

    # 6. Synchronize initial alerts for all equipment
    sync_all_alerts(db)
