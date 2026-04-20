-- =============================================================================
-- Migration: employees master-data table (feature: Viết Kudo, screen ihQ26W78P2)
-- Generated: 2026-04-20
-- See:
--   .momorph/contexts/database-schema.sql
--   .momorph/specs/ihQ26W78P2-viet-kudo/plan.md § Phase 2
-- =============================================================================

-- Required by the full-name autocomplete index below.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- -----------------------------------------------------------------------------
-- employees  (master data — every Sun* staff account)
--   * Standalone BIGSERIAL pk. No FK to auth.users.
--   * Populated by HR / admin ingest, independent of Supabase Auth signups.
--   * Link to the authenticated session is resolved at the application layer
--     (lib/auth/current-employee.ts) using the JWT email claim.
--   * Soft delete via deleted_at; updated_at maintained by the application.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS employees (
    id              BIGSERIAL PRIMARY KEY,
    email           VARCHAR     NOT NULL,
    full_name       VARCHAR     NOT NULL,
    employee_code   VARCHAR,
    department      VARCHAR,
    job_title       VARCHAR,
    avatar_url      VARCHAR,
    is_admin        BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at      TIMESTAMPTZ,
    CONSTRAINT ck_employees_full_name_length
        CHECK (char_length(full_name) BETWEEN 1 AND 120),
    CONSTRAINT ck_employees_email_format
        CHECK (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$')
);

COMMENT ON TABLE employees IS
    'Master-data table for Sun* staff. Linked to auth.users at query time via JWT email claim; no schema-level FK.';

-- Email must be unique among active employees.
CREATE UNIQUE INDEX IF NOT EXISTS idx_employees_email_active
    ON employees(lower(email))
    WHERE deleted_at IS NULL;

-- Employee code unique among active employees (when set).
CREATE UNIQUE INDEX IF NOT EXISTS idx_employees_code_active
    ON employees(employee_code)
    WHERE deleted_at IS NULL AND employee_code IS NOT NULL;

-- Diacritic-tolerant, case-insensitive autocomplete for recipient / mention search.
CREATE INDEX IF NOT EXISTS idx_employees_full_name_trgm
    ON employees USING GIN (lower(full_name) gin_trgm_ops)
    WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_employees_department_active
    ON employees(department)
    WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_employees_admin
    ON employees(is_admin)
    WHERE is_admin = TRUE AND deleted_at IS NULL;

-- No RLS on this table (spec.md rev 3 FR-016): authorisation is enforced at
-- the API layer in every Route Handler via getCurrentEmployee() + explicit
-- identity checks. Direct browser access to PostgREST is prevented by
-- CSRF + same-origin (TR-004).
