-- =============================================================================
-- Migration: departments master-data table (feature: Sun* Kudos Live board,
--   screen MaZUn5xHXZ)
-- Generated: 2026-04-21
-- See:
--   .momorph/contexts/database-schema.sql
--   .momorph/specs/MaZUn5xHXZ-sun-kudos-live-board/plan.md § Phase 2 (T009)
--
-- Idempotent: every object is guarded by `IF NOT EXISTS` so running the
-- migration twice is a no-op. No existing rows are touched.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- departments (master data — organisational units)
--   * Populated by HR / ops via a manual import before launch (plan Q-A3).
--   * Drives the Phòng ban filter dropdown on the Live board (Figma WXK5AYB_rG)
--     and the canonical FK target for employees.department_id.
--   * `parent_id` is a self-FK to support optional hierarchy (e.g.
--     "CEVC1 - DSV - UI/UX 1") — not used by the filter UI this release
--     (plan Q-P5 resolved: flat list).
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS departments (
    id           BIGSERIAL   PRIMARY KEY,
    code         VARCHAR     NOT NULL,
    name         VARCHAR,
    parent_id    BIGINT      REFERENCES departments(id),
    sort_order   INTEGER     NOT NULL DEFAULT 0,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at   TIMESTAMPTZ,
    CONSTRAINT ck_departments_code_length
        CHECK (char_length(code) BETWEEN 1 AND 60)
);

COMMENT ON TABLE departments IS
    'Master-data table for Sun* organisational units. Manually imported by ops (plan Q-A3). Drives Phòng ban filter + employees.department_id FK.';

-- Code unique among active rows.
CREATE UNIQUE INDEX IF NOT EXISTS idx_departments_code_active
    ON departments(code)
    WHERE deleted_at IS NULL;

-- Hierarchy traversal (list children of a parent).
CREATE INDEX IF NOT EXISTS idx_departments_parent_active
    ON departments(parent_id)
    WHERE deleted_at IS NULL;

-- Live-board dropdown: ORDER BY sort_order, code.
CREATE INDEX IF NOT EXISTS idx_departments_sort_active
    ON departments(sort_order, code)
    WHERE deleted_at IS NULL;
