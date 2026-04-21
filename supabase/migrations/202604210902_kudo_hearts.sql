-- =============================================================================
-- Migration: kudo_hearts (feature: Sun* Kudos Live board, screen MaZUn5xHXZ)
-- Generated: 2026-04-21
-- See:
--   .momorph/contexts/database-schema.sql
--   .momorph/specs/MaZUn5xHXZ-sun-kudos-live-board/plan.md § Phase 2 (T011)
--
-- Idempotent: every object is guarded by `IF NOT EXISTS`.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- kudo_hearts (US4: like / thả tim)
--   * Composite PK (kudo_id, employee_id) enforces "at most one like per user
--     per Kudo" at the database layer. No app-level dedup needed.
--   * Route Handlers enforce the "author cannot self-like" rule (TR-002):
--     `kudos.author_id <> caller.id` is checked before INSERT. A cross-table
--     CHECK would require a trigger; application-layer enforcement plus the
--     composite PK for idempotency is the project's standard pattern.
--   * `heart_count` on a card is computed as `COUNT(*)` — NOT denormalised —
--     so un-likes can't drift the counter.
--   * Bonus-day hearts is OUT OF SCOPE this release (plan Q-P4 deferred). Each
--     like = exactly 1 heart; no `bonus` column.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS kudo_hearts (
    kudo_id      BIGINT      NOT NULL REFERENCES kudos(id) ON DELETE CASCADE,
    employee_id  BIGINT      NOT NULL REFERENCES employees(id),
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (kudo_id, employee_id)
);

COMMENT ON TABLE kudo_hearts IS
    'Live-board likes (thả tim). Composite PK enforces ≤1 like per (Kudo, employee). No bonus-day column — each like = 1 heart this release.';

-- "Kudos this employee has liked" + recipient's total-hearts aggregate:
--   SELECT COUNT(*) FROM kudo_hearts WHERE employee_id = $1
CREATE INDEX IF NOT EXISTS idx_kudo_hearts_employee
    ON kudo_hearts(employee_id);
