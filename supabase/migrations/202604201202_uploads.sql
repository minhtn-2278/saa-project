-- =============================================================================
-- Migration: uploads metadata (image attachments for Kudos)
-- Generated: 2026-04-20
-- Binary objects live in Supabase Storage bucket `kudo-images`.
-- See .momorph/contexts/database-schema.sql
-- =============================================================================

CREATE TABLE IF NOT EXISTS uploads (
    id           BIGSERIAL PRIMARY KEY,
    owner_id     BIGINT      NOT NULL REFERENCES employees(id),
    storage_key  VARCHAR     NOT NULL,
    mime_type    VARCHAR     NOT NULL,
    byte_size    BIGINT      NOT NULL,
    width        INTEGER,
    height       INTEGER,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at   TIMESTAMPTZ,
    CONSTRAINT ck_uploads_mime_image
        CHECK (mime_type IN ('image/jpeg','image/png','image/webp')),
    CONSTRAINT ck_uploads_size
        CHECK (byte_size > 0 AND byte_size <= 5242880)  -- 5 MB per file
);

CREATE INDEX IF NOT EXISTS idx_uploads_owner_created
    ON uploads(owner_id, created_at DESC)
    WHERE deleted_at IS NULL;

-- No RLS (spec.md rev 3 FR-016) — API-layer authorisation only.
