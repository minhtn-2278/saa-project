-- =============================================================================
-- Migration: employees.department_id FK → departments (feature: Sun* Kudos
--   Live board, screen MaZUn5xHXZ)
-- Generated: 2026-04-21
-- See:
--   .momorph/contexts/database-schema.sql
--   .momorph/specs/MaZUn5xHXZ-sun-kudos-live-board/plan.md § Phase 2 (T010)
--
-- NON-DESTRUCTIVE: the legacy free-text `employees.department` column is kept
-- for this release. A follow-up migration will drop it once production has
-- fully cut over to reading `department_id`. This ordering protects against
-- backfill gaps during deploy.
--
-- Idempotent: every step is guarded so re-running is a no-op. Existing
-- employees rows retain their original `department` text untouched; the
-- backfill only SETS `department_id` for rows where it is still NULL.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Add the nullable FK column.
-- -----------------------------------------------------------------------------
ALTER TABLE employees
    ADD COLUMN IF NOT EXISTS department_id BIGINT REFERENCES departments(id);

COMMENT ON COLUMN employees.department_id IS
    'Live-board (2026-04-21): canonical reference to `departments.id`. Replaces the legacy free-text `department` column (still present during the transition; will be dropped in a later release once production has fully cut over).';

-- -----------------------------------------------------------------------------
-- 2. Best-effort backfill from the legacy text column.
--    Only touches rows where `department_id IS NULL` so re-runs are no-ops
--    and rows that were already set (e.g. by the seed snippet) are left alone.
--    Unmatched rows stay NULL — ops reconciles them before launch.
-- -----------------------------------------------------------------------------
UPDATE employees e
   SET department_id = d.id
  FROM departments d
 WHERE e.department_id IS NULL
   AND e.department IS NOT NULL
   AND d.code = e.department
   AND d.deleted_at IS NULL;

-- -----------------------------------------------------------------------------
-- 3. Replace the legacy text index with an FK-filtering one.
--    Both indexes are created `IF NOT EXISTS`; the legacy one is kept for
--    backward compatibility of any existing queries until the follow-up
--    drop migration. Drop with the column.
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_employees_department_id_active
    ON employees(department_id)
    WHERE deleted_at IS NULL;
