# 🏗️ Smart Rental Tracking System | Caterpillar

A production-quality, privacy-first equipment fleet management and telemetry monitoring web application built for heavy machinery rental providers (e.g. Caterpillar) renting equipment to civil engineering and mining contractors.

---

## 1. Project Overview

The **Smart Rental Tracking System** provides equipment managers with a centralized, uncluttered interface to manage machine assignments, monitor daily engine vs. idle hours, detect overdue rentals, identify under-utilized assets, diagnose explainable telemetry anomalies, and forecast future machinery demand.

### Core UX Principle
$$\text{OVERVIEW} \longrightarrow \text{ALERT} \longrightarrow \text{DETAILS} \longrightarrow \text{ACTION}$$

A manager opens the dashboard, instantly spots critical operational bottlenecks (e.g. an overdue machine or low utilization), clicks to inspect the underlying telemetry, and takes decisive action (e.g. 1-click check-in or customer outreach) without navigating confusing menus.

---

## 2. Business Scenario

```
Caterpillar (Rental Provider)
      │
      ▼  Rents machinery (Excavators, Cranes, Bulldozers, Graders, Loaders)
Customer (e.g. CUST001 - Alpha Infrastructure)
      │
      ▼  Assigned to Job Site
Site (e.g. SITE003 - Metro Tunnel Project)
      │
      ▼  Operated by
Operator (e.g. OP101)
```

The rental manager needs to instantly answer:
1. What equipment is in our fleet?
2. Which machines are currently rented vs available in depot?
3. Where is each machine located and which customer has it?
4. Which machines are overdue or due for return soon?
5. Which machines are under-utilized (high idle, low productive engine hours)?
6. Are any anomalies occurring (sudden drop in runtime, abnormal fuel draw)?
7. What equipment will be required in the upcoming period?

---

## 3. Key Features

- **Level 1–4 Hierarchical Dashboard**:
  - Top summary cards: Total (25), Rented (18), Available (7), Overdue (2), Under-utilized (4).
  - High-priority exception banner with direct jump to affected machines.
  - Fast, responsive equipment status table with multi-field search and filters.
- **Equipment Fleet Management**:
  - Full catalog across Excavators, Cranes, Bulldozers, Graders, and Loaders.
  - Real-time telemetry: Engine hours/day, Idle hours/day, Total runtime, Utilization percentage.
  - Printable & scannable QR code generator for every machine asset.
- **Fast Check-in / Check-out**:
  - Instant Check-out: Assign equipment to customer, site, and operator with return deadline.
  - Instant Check-in: Return equipment to Available status and log physical condition.
  - Strict validation: Prevents checking out already rented assets or checking in available assets.
- **Hardware-Free QR / RFID Simulation**:
  - Simulated scanner modal with click-to-scan test tags (`EXQ1001`, `EXQ1003`, `EXQ1004`, `EXQ1007`) and manual ID lookup.
  - Real-time QR code generation via SVG.
- **Under-Utilization Detection**:
  - Configurable thresholds: $<30\%$ (Under-utilized), $30\%-70\%$ (Moderate), $>70\%$ (Well-utilized).
  - Flags non-productive machinery sitting idle on customer sites.
- **Overdue Rental Detection**:
  - Automatic comparison of expected return date vs. current date.
  - Flags "Return Due Soon" ($\le 2$ days) and "Overdue" (with exact days overdue).
- **Explainable Anomaly Detection**:
  - Transparent rule-based telemetry analysis explaining *why* alerts trigger (e.g., extreme idle ratio, sudden engine drop, high fuel draw during low runtime).
- **Demand Forecasting**:
  - 3-period rolling weighted moving-average demand forecasting by equipment category.
  - Transparent business explanations for inventory planning.
- **Privacy-First Data Architecture**:
  - Zero PII collected or displayed. 100% anonymized IDs (`CUST001`, `SITE003`, `OP101`, `EXQ1001`).
- **Role-Based Access Control**:
  - `ADMIN`: Full access (create assets, check-in/out, resolve alerts, analytics).
  - `MANAGER`: Rental management, check-in/out, resolve alerts, view analytics.
  - `VIEWER`: Read-only telemetry and analytics inspection.

---

## 4. Architecture & UX Flow

```
┌─────────────────────────────────────────────────────────────┐
│             Frontend (React 18 + Vite + Tailwind)           │
│                                                             │
│  [Dashboard]   [Equipment]   [Check-in/Out]   [Alerts]   [Analytics]
│       │             │              │             │            │
│       └─────────────┴───────┬──────┴─────────────┴────────────┘
│                             │ REST API (/api/v1)
└─────────────────────────────┼───────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                 Backend (Python 3.10+ FastAPI)              │
│                                                             │
│  • Equipment Service (Dynamic Status & Utilization Engine)  │
│  • Rental Service (Atomic Check-in/out & Validation)        │
│  • Anomaly & Alert Engine (Rule-based Explainability)       │
│  • Demand Forecasting (Weighted Moving Average Model)       │
└─────────────────────────────┬───────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  Database (SQLite local dev  ⇄  Supabase PostgreSQL prod)  │
│                                                             │
│  • equipment   • customers   • sites   • operators          │
│  • usage_logs  • rental_records        • alerts             │
│                                                             │
│  🔒 Row Level Security (RLS) • Connection Pooling           │
│  📊 Supabase Dashboard: Table Editor, SQL Editor, ER Viz    │
└─────────────────────────────────────────────────────────────┘
```

---

## 5. Technology Stack

- **Frontend**:
  - React 18, Vite, TypeScript
  - Tailwind CSS (Caterpillar Industrial theme: Gold `#F59E0B` on Deep Slate `#0F172A`)
  - Lucide React Icons
  - Recharts (Lightweight responsive analytics charts)
  - `qrcode.react` (SVG QR generation)
  - Axios (API communication with friendly error parsing)
- **Backend**:
  - Python 3.10+
  - FastAPI (High performance asynchronous REST API)
  - SQLAlchemy 2.0 (ORM with SQLite and PostgreSQL support)
  - Pydantic v2 (Strict request/response validation)
  - Uvicorn (ASGI server)
  - Pytest & HTTPX (Automated test suite)
- **Database**:
  - **Development**: SQLite (zero-config local file `rental_system.db`)
  - **Production**: Supabase (Managed PostgreSQL 15 on AWS)
  - Connection pooling via SQLAlchemy (pool_size=5, max_overflow=10, pool_pre_ping)
  - Row Level Security (RLS) policies for enterprise-grade access control
  - `python-dotenv` for environment-based database switching

---

## 6. Database Schema

| Table | Primary Key | Key Fields | Description |
| :--- | :--- | :--- | :--- |
| `equipment` | `id` (int) | `equipment_id` (str, unique), `equipment_type`, `status`, `customer_id`, `site_id`, `operator_id`, `rental_start_date`, `expected_return_date` | Registered fleet assets |
| `customers` | `id` (int) | `customer_id` (str, unique), `display_name` | Anonymized customer accounts |
| `sites` | `id` (int) | `site_id` (str, unique), `display_name` | Anonymized construction project sites |
| `operators` | `id` (int) | `operator_id` (str, unique) | Anonymized machine operators |
| `usage_logs` | `id` (int) | `equipment_id`, `date`, `engine_hours`, `idle_hours`, `fuel_usage`, `operating_days` | Daily telemetry logs |
| `rental_records`| `id` (int) | `equipment_id`, `customer_id`, `site_id`, `check_out_date`, `expected_return_date`, `check_in_date`, `condition`, `status` | Rental contract history |
| `alerts` | `id` (int) | `equipment_id`, `alert_type`, `severity`, `message`, `explanation`, `resolved` | Operational alerts & anomalies |

---

## 7. Installation & Quick Start

### Prerequisites
- Python 3.10 or higher
- Node.js 18+ and npm

### 1. Clone & Setup Backend
```bash
# Navigate to workspace
cd Caterpillar

# Install Python requirements
pip install -r backend/requirements.txt
```

### 2. Setup Frontend
```bash
# Navigate to frontend directory
cd frontend

# Install npm packages
npm install
```

---

## 8. Environment Variables

Create `.env` file in the root directory (or use default `.env.example`):
```env
# Local Development (default)
DATABASE_URL=sqlite:///./rental_system.db

# Production — Supabase PostgreSQL (uncomment and fill in your credentials)
# DATABASE_URL=postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres

PORT=8000
HOST=127.0.0.1
VITE_API_URL=http://localhost:8000/api/v1
```

> 💡 See [SUPABASE_SETUP.md](SUPABASE_SETUP.md) for complete Supabase configuration instructions.

---

## 8.1. Supabase Cloud Database Setup

To connect to a **Supabase-hosted PostgreSQL** database (recommended for panel demos):

1. Create a free project at [supabase.com](https://supabase.com)
2. Copy your **Database Connection String** (Project Settings → Database → URI)
3. Update `.env` with your connection string
4. Restart the backend — tables and seed data are created automatically

For detailed instructions, talking points, and panel Q&A preparation, see:
📄 **[SUPABASE_SETUP.md](SUPABASE_SETUP.md)**

---

## 9. How to Run

### Method A: One-Click Startup (Windows)
Double-click `run_demo.bat` or run in PowerShell:
```powershell
.\run_demo.bat
```

### Method B: Manual Startup

**Terminal 1 (Backend FastAPI Server):**
```bash
uvicorn backend.main:app --reload --port 8000
```
- API Docs: `http://127.0.0.1:8000/docs`
- Health Check: `http://127.0.0.1:8000/api/health`

**Terminal 2 (Frontend React App):**
```bash
cd frontend
npm run dev
```
- Web Application: `http://localhost:5173`

---

## 10. Sample Login / Persona Switcher

No complicated login forms required. The top navigation bar includes an instant **Persona Switcher**:
- **ADMIN**: Fleet Administrator (Full control).
- **MANAGER**: Rental Operations Manager (Check-in/out, Alert resolution).
- **VIEWER**: Read-only Auditor / Customer representative.

---

## 11. Complete Demo Workflow

Follow this step-by-step scenario to evaluate all system features:

1. **Open Dashboard** (`http://localhost:5173`):
   - Review Level 1 Summary Cards: Total: 25, Rented: 18, Available: 7, Overdue: 2, Under-utilized: 4.
2. **Notice Critical Alert Banner**:
   - The red banner highlights overdue machine `EXQ1003` (Bulldozer).
3. **Inspect Machine**:
   - Click **Inspect EXQ1003** to slide out the Equipment Drawer.
   - Observe the 14-day telemetry chart showing engine hours vs idle hours.
4. **Perform Check-in**:
   - Click the green **Check In Equipment** button inside the drawer.
   - The app navigates to the Check-in page with `EXQ1003` pre-selected.
   - Select condition: `Good` and click `[ CHECK IN EQUIPMENT ]`.
5. **Observe Automatic Synchronization**:
   - Status transitions from `OVERDUE` to `AVAILABLE`.
   - The Overdue alert automatically resolves.
   - Dashboard KPI for Overdue drops to 1, and Available increases to 8.
6. **Perform Check-out**:
   - Switch to the **Check-Out** tab.
   - Select available grader `EXQ1004`.
   - Assign to Customer `CUST001 (Alpha Infrastructure)` at Site `SITE003`.
   - Click `[ CHECK OUT EQUIPMENT ]`. Status changes to `RENTED`.
7. **Simulate QR / RFID Tag Scan**:
   - Click the **Scan Tag / ID** button in the header.
   - Click any sample chip (e.g. `EXQ1007` - Under-utilized Excavator) to simulate instant tag reading.
   - The drawer opens displaying its high idle time telemetry (10h idle vs 2h engine).
8. **Explore Explainable Alerts**:
   - Navigate to **Alerts** page.
   - Review transparent root-cause analysis (e.g. "On 2026-08-31, machine idled for 9.5 hours...").
9. **Explore Demand Forecasting & Analytics**:
   - Navigate to **Analytics** page.
   - Review moving-average demand predictions for Excavators, Cranes, Bulldozers, Graders, and Loaders.

---

## 12. Privacy-First Approach & Data Minimization

In compliance with strict enterprise privacy principles:
- **Zero PII**: No personal names, phone numbers, email addresses, or sensitive customer details are stored.
- **Anonymized IDs**: All entities use structured identifiers:
  - Customers: `CUST001`, `CUST002`, `CUST003`
  - Sites: `SITE001`, `SITE002`, `SITE003`
  - Operators: `OP101`, `OP102`, `OP103`
  - Equipment: `EXQ1001`, `EXQ1002`, `EXQ1003`
- **Data Minimization**: Only telematics metrics necessary for machinery upkeep and rental billing are recorded.

---

## 13. Automated Tests

Run the complete backend pytest suite:
```bash
python -m pytest backend/tests/test_api.py -v
```
All tests validate equipment lifecycle, status transitions, check-out/check-in validations, alert resolutions, and demand forecast calculations.

---

## 14. Future Improvements

- IoT CAN bus edge telemetry ingestion via MQTT / WebSocket streaming.
- Automated geofencing perimeter alerts when machinery departs assigned `SITE_ID`.
- Preventive maintenance service scheduling based on cumulative engine hours.
