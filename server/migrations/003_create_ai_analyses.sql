-- Migration: 003_create_ai_analyses.sql

CREATE TABLE IF NOT EXISTS ai_analyses (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    machine_id              UUID NOT NULL REFERENCES machines(id) ON DELETE CASCADE,
    risk_level              VARCHAR(20)  NOT NULL CHECK (risk_level IN ('LOW','MEDIUM','HIGH','CRITICAL')),
    risk_score              INTEGER      NOT NULL CHECK (risk_score BETWEEN 0 AND 100),
    health_percentage       INTEGER      NOT NULL CHECK (health_percentage BETWEEN 0 AND 100),
    trend                   VARCHAR(20)  NOT NULL CHECK (trend IN ('STABLE','INCREASING','DECREASING','SPIKE')),
    prediction              TEXT         NOT NULL,
    recommendation          TEXT         NOT NULL,
    estimated_failure_hours INTEGER,     
    urgent                  BOOLEAN      NOT NULL DEFAULT false,
    analyzed_at             TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_analyses_machine_id      ON ai_analyses (machine_id);
CREATE INDEX IF NOT EXISTS idx_ai_analyses_analyzed_at     ON ai_analyses (analyzed_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_analyses_machine_latest  ON ai_analyses (machine_id, analyzed_at DESC);
