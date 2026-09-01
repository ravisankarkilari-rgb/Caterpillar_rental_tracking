# 🗄️ Supabase + PostgreSQL Setup Guide

This guide walks you through connecting the **Smart Rental Tracking System** to a **Supabase-hosted PostgreSQL** database — so you can confidently demonstrate a real cloud database to a panel.

---

## Table of Contents

1. [Create a Supabase Project](#1-create-a-supabase-project)
2. [Get Your Connection String](#2-get-your-connection-string)
3. [Configure Your .env File](#3-configure-your-env-file)
4. [Run the Application](#4-run-the-application)
5. [Verify in Supabase Dashboard](#5-verify-in-supabase-dashboard)
6. [What to Show the Panel](#6-what-to-show-the-panel)
7. [Panel Q&A Talking Points](#7-panel-qa-talking-points)

---

## 1. Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and sign up / log in (GitHub SSO works).
2. Click **"New Project"**.
3. Fill in:
   - **Project Name**: `caterpillar-rental-tracking`
   - **Database Password**: Choose a strong password (you'll need this later)
   - **Region**: Pick the closest region to you (e.g. `ap-south-1` for India)
4. Click **"Create new project"** — wait ~2 minutes for provisioning.

---

## 2. Get Your Connection String

1. In the Supabase Dashboard, go to **Project Settings** (gear icon, bottom-left).
2. Click **Database** in the left sidebar.
3. Scroll to **"Connection string"** section.
4. Select the **URI** tab.
5. Copy the connection string. It looks like:

```
postgresql://postgres.[PROJECT_REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
```

> ⚠️ **Replace `[YOUR-PASSWORD]`** with the database password you set in Step 1.

---

## 3. Configure Your .env File

Open the `.env` file in the project root and update:

```env
# Comment out SQLite:
# DATABASE_URL=sqlite:///./rental_system.db

# Uncomment and paste your Supabase connection string:
DATABASE_URL=postgresql://postgres.abcdefghijklmnop:MySecurePassword123@aws-0-ap-south-1.pooler.supabase.com:6543/postgres
```

---

## 4. Run the Application

```bash
# Install python-dotenv (if not already installed)
pip install -r backend/requirements.txt

# Start the backend — it will auto-create tables and seed data in Supabase
uvicorn backend.main:app --reload --port 8000
```

On first startup, the backend will:
1. Connect to your Supabase PostgreSQL database
2. Create all 7 tables via SQLAlchemy ORM
3. Seed 25 equipment, 6 customers, 8 sites, 15 operators, 350 usage logs, and alerts

```bash
# Start the frontend
cd frontend
npm run dev
```

---

## 5. Verify in Supabase Dashboard

After the backend starts successfully, go to the **Supabase Dashboard**:

### Table Editor
- Navigate to **Table Editor** in the left sidebar
- You should see all 7 tables: `equipment`, `customers`, `sites`, `operators`, `usage_logs`, `rental_records`, `alerts`
- Click any table to browse rows

### SQL Editor
- Navigate to **SQL Editor** and run:
```sql
-- Count all records
SELECT 'equipment' as table_name, COUNT(*) as rows FROM equipment
UNION ALL SELECT 'customers', COUNT(*) FROM customers
UNION ALL SELECT 'sites', COUNT(*) FROM sites
UNION ALL SELECT 'operators', COUNT(*) FROM operators
UNION ALL SELECT 'usage_logs', COUNT(*) FROM usage_logs
UNION ALL SELECT 'rental_records', COUNT(*) FROM rental_records
UNION ALL SELECT 'alerts', COUNT(*) FROM alerts;
```

Expected output:
| table_name     | rows |
|:---------------|-----:|
| equipment      |   25 |
| customers      |    6 |
| sites          |    8 |
| operators      |   15 |
| usage_logs     | ~350 |
| rental_records |  ~18 |
| alerts         | ~15+ |

### Schema Visualizer (ER Diagram)
- Navigate to **Database** → **Schema Visualizer**
- This shows an auto-generated ER diagram with relationships between tables

---

## 6. What to Show the Panel

| Panel Asks | You Demonstrate |
|:---|:---|
| _"What database are you using?"_ | Open Supabase Dashboard — show it's PostgreSQL 15 hosted on AWS |
| _"Show me the schema"_ | Open **Table Editor** — click through each table showing columns, types, constraints |
| _"Show me the ER diagram"_ | Open **Database → Schema Visualizer** — show the auto-generated relationship diagram |
| _"Show me the data"_ | Browse rows in **Table Editor** — show equipment fleet, usage logs, rental records |
| _"Run a query"_ | Open **SQL Editor** — run the counts query above, or the join query from `supabase_schema.sql` |
| _"How do you connect?"_ | Show `database.py` — dotenv loads the connection string, SQLAlchemy connects with pooling |
| _"Is it secure?"_ | Show **RLS policies** in Database → Policies tab; show anonymized IDs in data |
| _"Show me the API"_ | Open `http://localhost:8000/docs` — Swagger UI; call `/api/v1/db-info` |
| _"How is data seeded?"_ | Show `seed_data.py` — 25 equipment across 5 types with realistic telemetry patterns |

---

## 7. Panel Q&A Talking Points

### "Why Supabase?"
> "We chose Supabase because it provides a managed PostgreSQL database with built-in Row Level Security, real-time capabilities, and a visual dashboard — all on a generous free tier. For a production deployment, Supabase scales to handle enterprise workloads with connection pooling via Supavisor and automatic backups."

### "Why PostgreSQL over other databases?"
> "PostgreSQL is the industry standard for relational data with complex queries. Our system needs JOINs across equipment, rentals, usage logs, and alerts — PostgreSQL handles this with superior query optimization. SQLAlchemy ORM gives us database-agnostic code that runs on both SQLite (dev) and PostgreSQL (production) without changes."

### "How do you handle database migrations?"
> "SQLAlchemy's `Base.metadata.create_all()` handles schema creation. For production, we would integrate Alembic for versioned migrations, allowing safe schema evolution without data loss."

### "What about security?"
> "Three layers: (1) Network — Supabase enforces SSL/TLS on all connections. (2) Row Level Security — RLS policies control data access at the database level. (3) Application — Our API uses role-based access control (Admin/Manager/Viewer) and all data uses anonymized IDs — zero PII is stored."

### "How does the app switch between SQLite and PostgreSQL?"
> "One environment variable: `DATABASE_URL`. If it points to SQLite, the app uses a local file. If it points to PostgreSQL, it connects with connection pooling. The ORM code is identical — no code changes needed. This is demonstrated in `database.py`."

---

## Switching Back to SQLite

To switch back to local SQLite development, update `.env`:

```env
DATABASE_URL=sqlite:///./rental_system.db
# DATABASE_URL=postgresql://...  (comment out)
```

Restart the backend — it will use the local `rental_system.db` file.

---

## Troubleshooting

| Issue | Solution |
|:---|:---|
| `psycopg2` import error | Run `pip install psycopg2-binary` |
| Connection refused | Check your Supabase project is active (free tier pauses after 7 days of inactivity) |
| `password authentication failed` | Verify the password in your connection string matches your Supabase database password |
| Tables not created | Check backend logs for SQLAlchemy errors; ensure the connection string is correct |
| `SSL connection required` | Add `?sslmode=require` to the end of your DATABASE_URL |
