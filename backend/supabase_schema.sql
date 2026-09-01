-- ============================================================================
-- Smart Rental Tracking System — Supabase / PostgreSQL Schema
-- ============================================================================
-- Run this script in the Supabase SQL Editor to create all tables.
-- This is equivalent to what SQLAlchemy's Base.metadata.create_all() generates,
-- but expressed as explicit DDL for panel presentation and transparency.
--
-- Tables: equipment, customers, sites, operators, usage_logs, rental_records, alerts
-- ============================================================================

-- ──────────────────────────────────────────────────────────────────────────────
-- 1. CUSTOMERS — Anonymized customer accounts
-- ──────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS customers (
    id          SERIAL PRIMARY KEY,
    customer_id VARCHAR(50) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    created_at  TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customers_customer_id ON customers(customer_id);

-- ──────────────────────────────────────────────────────────────────────────────
-- 2. SITES — Anonymized construction project sites
-- ──────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sites (
    id          SERIAL PRIMARY KEY,
    site_id     VARCHAR(50) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    created_at  TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sites_site_id ON sites(site_id);

-- ──────────────────────────────────────────────────────────────────────────────
-- 3. OPERATORS — Anonymized machine operators
-- ──────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS operators (
    id          SERIAL PRIMARY KEY,
    operator_id VARCHAR(50) NOT NULL UNIQUE,
    created_at  TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_operators_operator_id ON operators(operator_id);

-- ──────────────────────────────────────────────────────────────────────────────
-- 4. EQUIPMENT — Registered fleet assets (Excavators, Cranes, Bulldozers, etc.)
-- ──────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS equipment (
    id                    SERIAL PRIMARY KEY,
    equipment_id          VARCHAR(50) NOT NULL UNIQUE,
    equipment_type        VARCHAR(50) NOT NULL,
    status                VARCHAR(30) NOT NULL DEFAULT 'AVAILABLE',
    customer_id           VARCHAR(50),
    site_id               VARCHAR(50),
    operator_id           VARCHAR(50),
    rental_start_date     DATE,
    expected_return_date  DATE,
    ignition_status       VARCHAR(10) NOT NULL DEFAULT 'OFF',
    created_at            TIMESTAMP DEFAULT NOW(),
    updated_at            TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_equipment_equipment_id ON equipment(equipment_id);

-- ──────────────────────────────────────────────────────────────────────────────
-- 5. USAGE_LOGS — Daily telemetry logs (engine hours, idle hours, fuel)
-- ──────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS usage_logs (
    id              SERIAL PRIMARY KEY,
    equipment_id    VARCHAR(50) NOT NULL REFERENCES equipment(equipment_id),
    date            DATE NOT NULL,
    engine_hours    FLOAT NOT NULL DEFAULT 0.0,
    idle_hours      FLOAT NOT NULL DEFAULT 0.0,
    fuel_usage      FLOAT DEFAULT 0.0,
    operating_days  INTEGER NOT NULL DEFAULT 1,
    site_id         VARCHAR(50),
    created_at      TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_usage_equip_date ON usage_logs(equipment_id, date);

-- ──────────────────────────────────────────────────────────────────────────────
-- 6. RENTAL_RECORDS — Rental contract history (check-in / check-out)
-- ──────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rental_records (
    id                    SERIAL PRIMARY KEY,
    equipment_id          VARCHAR(50) NOT NULL REFERENCES equipment(equipment_id),
    customer_id           VARCHAR(50) NOT NULL,
    site_id               VARCHAR(50) NOT NULL,
    operator_id           VARCHAR(50),
    check_out_date        DATE NOT NULL,
    expected_return_date  DATE NOT NULL,
    check_in_date         DATE,
    condition             VARCHAR(100) DEFAULT 'Good',
    status                VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    created_at            TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rental_equipment_id ON rental_records(equipment_id);

-- ──────────────────────────────────────────────────────────────────────────────
-- 7. ALERTS — Operational alerts & anomalies
-- ──────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS alerts (
    id              SERIAL PRIMARY KEY,
    equipment_id    VARCHAR(50) NOT NULL REFERENCES equipment(equipment_id),
    alert_type      VARCHAR(50) NOT NULL,
    severity        VARCHAR(20) NOT NULL,       -- CRITICAL, WARNING, INFO
    message         VARCHAR(255) NOT NULL,
    explanation     VARCHAR(500),               -- Why the alert triggered
    resolved        BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMP DEFAULT NOW(),
    resolved_at     TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_alerts_equipment_id ON alerts(equipment_id);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) — Showcase for Panel Demo
-- ============================================================================
-- Enable RLS on all tables (Supabase best practice for production apps)
-- By default, these policies allow all operations via the service_role key
-- which is what the backend uses.  In a multi-tenant production system,
-- you would restrict per-user JWT claims.
-- ============================================================================

ALTER TABLE equipment     ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers     ENABLE ROW LEVEL SECURITY;
ALTER TABLE sites         ENABLE ROW LEVEL SECURITY;
ALTER TABLE operators     ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_logs    ENABLE ROW LEVEL SECURITY;
ALTER TABLE rental_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts        ENABLE ROW LEVEL SECURITY;

-- Service-role bypass policy (backend server uses service_role key)
-- These allow full CRUD when connected via the backend's DATABASE_URL
CREATE POLICY "Allow service role full access" ON equipment     FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow service role full access" ON customers     FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow service role full access" ON sites         FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow service role full access" ON operators     FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow service role full access" ON usage_logs    FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow service role full access" ON rental_records FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow service role full access" ON alerts        FOR ALL USING (true) WITH CHECK (true);

-- ============================================================================
-- SAMPLE QUERY — Verify installation (run in SQL Editor after seeding)
-- ============================================================================
-- SELECT
--     e.equipment_id,
--     e.equipment_type,
--     e.status,
--     e.customer_id,
--     e.site_id,
--     COUNT(ul.id) AS total_usage_logs,
--     COALESCE(AVG(ul.engine_hours), 0) AS avg_engine_hours,
--     COALESCE(AVG(ul.idle_hours), 0)   AS avg_idle_hours
-- FROM equipment e
-- LEFT JOIN usage_logs ul ON ul.equipment_id = e.equipment_id
-- GROUP BY e.id
-- ORDER BY e.equipment_id;
