-- =============================================================================
-- Migration: view `kudos_with_heart_count`
-- Feature: Sun* Kudos Live board, screen MaZUn5xHXZ
-- Generated: 2026-04-22
--
-- Drives `GET /api/kudos/highlight` — ranks kudos by heart count.
--
-- Why a view?
--   Supabase projects run PostgREST with `db-aggregates-enabled=false` by
--   default, so calling `count()` / `sum()` / etc. from the API returns
--   "Use of aggregate functions is not allowed". Pushing the aggregation
--   inside a view means Postgres computes `heart_count` once per query,
--   and PostgREST just SELECTs the column — no aggregate function on the
--   API surface, no project setting to toggle.
--
-- PostgREST embedding:
--   The view selects `k.*` so PostgREST inherits every FK relationship
--   from the underlying `kudos` table (author_id → employees.id,
--   recipient_id → employees.id, title_id → titles.id, plus the reverse
--   embeds from kudo_hashtags / kudo_images / kudo_mentions). Callers can
--   therefore query `.from("kudos_with_heart_count")` with the same
--   nested selects they used against `kudos`.
--
-- Idempotent: `CREATE OR REPLACE VIEW`.
-- =============================================================================

CREATE OR REPLACE VIEW kudos_with_heart_count AS
SELECT
    k.*,
    COALESCE(
        (SELECT COUNT(*) FROM kudo_hearts h WHERE h.kudo_id = k.id),
        0
    )::int AS heart_count
FROM kudos k;

-- Supabase API roles need explicit SELECT on views (tables are granted in
-- the Supabase-managed schema, but views created by migrations aren't).
GRANT SELECT ON kudos_with_heart_count TO anon, authenticated, service_role;

COMMENT ON VIEW kudos_with_heart_count IS
    'Read-only view over `kudos` adding a pre-computed `heart_count` column. Used by GET /api/kudos/highlight to ORDER BY heart_count DESC without PostgREST aggregate functions (disabled by default on Supabase). Inherits FK relationships from the underlying kudos table so nested selects work the same as `.from("kudos")`.';
