-- ============================================================
-- Migration: 001_init_schema.sql
-- Predictive Maintenance — Full Schema
-- Compatible with Supabase (PostgreSQL 15+)
-- ============================================================

-- Enable required extensions (Supabase has these pre-installed)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- 1. USERS
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(100) NOT NULL,
    email       VARCHAR(100) UNIQUE NOT NULL,
    password    VARCHAR(255) NOT NULL,               -- bcrypt hashed
    role        VARCHAR(20) NOT NULL CHECK (role IN ('SUPERVISOR', 'OPERATOR')),
    phone       VARCHAR(20),
    is_active   BOOLEAN DEFAULT true NOT NULL,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- ============================================================
-- 2. MACHINES (5 virtual machines)
-- ============================================================
CREATE TABLE IF NOT EXISTS machines (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(100) NOT NULL,               -- "Mesin Pasteurisasi #1"
    code        VARCHAR(50) UNIQUE NOT NULL,          -- "PST-001"
    type        VARCHAR(50) NOT NULL,                 -- "PASTEURISASI", "FILLING", etc.
    location    VARCHAR(100),
    status      VARCHAR(20) DEFAULT 'ACTIVE' NOT NULL
                CHECK (status IN ('ACTIVE', 'INACTIVE', 'MAINTENANCE')),
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- ============================================================
-- 3. SENSOR READINGS (from simulator)
-- ============================================================
CREATE TABLE IF NOT EXISTS sensor_readings (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    machine_id  UUID NOT NULL REFERENCES machines(id) ON DELETE CASCADE,
    temperature DECIMAL(6,2),                        -- °C
    vibration   DECIMAL(6,2),                        -- Hz
    pressure    DECIMAL(6,2),                        -- Bar
    rpm         INTEGER,
    efficiency  DECIMAL(5,2),                        -- %
    is_anomaly  BOOLEAN DEFAULT false NOT NULL,
    read_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- ============================================================
-- 4. INCIDENTS (auto-generated from simulator anomalies)
-- ============================================================
CREATE TABLE IF NOT EXISTS incidents (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    machine_id       UUID NOT NULL REFERENCES machines(id),
    reading_id       UUID REFERENCES sensor_readings(id),
    title            VARCHAR(200) NOT NULL,
    description      TEXT,
    severity         VARCHAR(20) NOT NULL
                     CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    status           VARCHAR(20) DEFAULT 'OPEN' NOT NULL
                     CHECK (status IN ('OPEN', 'IN_PROGRESS', 'RESOLVED')),
    risk_score       INTEGER DEFAULT 0 NOT NULL CHECK (risk_score BETWEEN 0 AND 100),
    acknowledged_by  UUID REFERENCES users(id),
    acknowledged_at  TIMESTAMP WITH TIME ZONE,
    resolved_by      UUID REFERENCES users(id),
    resolved_at      TIMESTAMP WITH TIME ZONE,
    deleted_at       TIMESTAMP WITH TIME ZONE,       -- soft delete
    created_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- ============================================================
-- 5. AUDIT LOGS
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incident_id UUID REFERENCES incidents(id),
    user_id     UUID REFERENCES users(id),
    action      VARCHAR(50) NOT NULL,
    -- e.g.: INCIDENT_CREATED, STATUS_UPDATED, INCIDENT_RESOLVED, INCIDENT_DELETED
    old_value   TEXT,
    new_value   TEXT,
    ip_address  VARCHAR(45),
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- ============================================================
-- 6. PUSH SUBSCRIPTIONS (PWA + Expo)
-- ============================================================
CREATE TABLE IF NOT EXISTS push_subscriptions (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    -- PWA Web Push (Supervisor)
    endpoint    TEXT,
    p256dh      TEXT,
    auth_key    TEXT,
    -- Expo Push (Operator)
    expo_token  TEXT,
    device_type VARCHAR(20) CHECK (device_type IN ('WEB', 'MOBILE')),
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    -- One subscription per user per device type (enables UPSERT)
    UNIQUE (user_id, device_type)
);

-- ============================================================
-- INDEXES — optimized for common query patterns
-- ============================================================

-- sensor_readings: time-series per machine
CREATE INDEX IF NOT EXISTS idx_sensor_readings_machine_read_at
    ON sensor_readings (machine_id, read_at DESC);

-- sensor_readings: anomaly filter
CREATE INDEX IF NOT EXISTS idx_sensor_readings_anomaly
    ON sensor_readings (machine_id, is_anomaly) WHERE is_anomaly = true;

-- incidents: dashboard queries (active, by severity)
CREATE INDEX IF NOT EXISTS idx_incidents_status_severity
    ON incidents (status, severity) WHERE deleted_at IS NULL;

-- incidents: per machine
CREATE INDEX IF NOT EXISTS idx_incidents_machine_id
    ON incidents (machine_id) WHERE deleted_at IS NULL;

-- incidents: soft delete filter
CREATE INDEX IF NOT EXISTS idx_incidents_deleted_at
    ON incidents (deleted_at) WHERE deleted_at IS NULL;

-- audit_logs: per incident
CREATE INDEX IF NOT EXISTS idx_audit_logs_incident_id
    ON audit_logs (incident_id, created_at DESC);

-- audit_logs: per user activity
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id
    ON audit_logs (user_id, created_at DESC);

-- push_subscriptions: per user
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id
    ON push_subscriptions (user_id);

-- users: email lookup (for login)
CREATE INDEX IF NOT EXISTS idx_users_email
    ON users (email) WHERE is_active = true;

-- ============================================================
-- UPDATED_AT TRIGGER FUNCTION
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER trg_incidents_updated_at
    BEFORE UPDATE ON incidents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
