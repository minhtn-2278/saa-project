-- =============================================================================
-- Migration: titles (Danh hiệu) + hashtags master lists (user-generated)
-- Generated: 2026-04-20
-- See .momorph/contexts/database-schema.sql
-- =============================================================================

-- -----------------------------------------------------------------------------
-- titles  (Danh hiệu)
--   Any authenticated user MAY insert via inline creation in the Write-Kudo
--   picker (FR-006a). UPDATE / DELETE reserved for admins.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS titles (
    id           BIGSERIAL PRIMARY KEY,
    name         VARCHAR     NOT NULL,
    slug         VARCHAR     NOT NULL,
    description  TEXT,
    icon         VARCHAR,
    sort_order   INTEGER     NOT NULL DEFAULT 0,
    created_by   BIGINT      REFERENCES employees(id),
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at   TIMESTAMPTZ,
    CONSTRAINT ck_titles_name_length
        CHECK (char_length(name) BETWEEN 2 AND 60)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_titles_slug_active
    ON titles(slug)
    WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_titles_active_sort
    ON titles(sort_order)
    WHERE deleted_at IS NULL;

-- No RLS (spec.md rev 3 FR-016) — API-layer authorisation only.

-- -----------------------------------------------------------------------------
-- hashtags  (user-generated)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS hashtags (
    id           BIGSERIAL PRIMARY KEY,
    label        VARCHAR     NOT NULL,
    slug         VARCHAR     NOT NULL,
    usage_count  BIGINT      NOT NULL DEFAULT 0,
    created_by   BIGINT      REFERENCES employees(id),
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at   TIMESTAMPTZ,
    CONSTRAINT ck_hashtags_label_length
        CHECK (char_length(label) BETWEEN 2 AND 32)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_hashtags_slug_active
    ON hashtags(slug)
    WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_hashtags_label_active
    ON hashtags(label)
    WHERE deleted_at IS NULL;

-- No RLS (spec.md rev 3 FR-016) — API-layer authorisation only.
