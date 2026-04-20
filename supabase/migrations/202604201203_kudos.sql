-- =============================================================================
-- Migration: kudos + join tables (kudo_hashtags, kudo_images, kudo_mentions)
-- Generated: 2026-04-20
-- See .momorph/contexts/database-schema.sql
-- =============================================================================

-- -----------------------------------------------------------------------------
-- kudos
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS kudos (
    id               BIGSERIAL PRIMARY KEY,
    author_id        BIGINT      NOT NULL REFERENCES employees(id),
    recipient_id     BIGINT      NOT NULL REFERENCES employees(id),
    title_id         BIGINT      NOT NULL REFERENCES titles(id),
    body             JSONB       NOT NULL,
    body_plain       TEXT        NOT NULL,
    is_anonymous     BOOLEAN     NOT NULL DEFAULT FALSE,
    anonymous_alias  TEXT,
    status           VARCHAR     NOT NULL DEFAULT 'published',
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at       TIMESTAMPTZ,
    CONSTRAINT ck_kudos_not_self
        CHECK (author_id <> recipient_id),
    CONSTRAINT ck_kudos_status
        CHECK (status IN ('published','hidden','reported')),
    CONSTRAINT ck_kudos_anonymous_alias_length
        CHECK (anonymous_alias IS NULL OR char_length(anonymous_alias) BETWEEN 1 AND 60),
    CONSTRAINT ck_kudos_alias_only_when_anonymous
        CHECK (anonymous_alias IS NULL OR is_anonymous = TRUE)
);

CREATE INDEX IF NOT EXISTS idx_kudos_status_created
    ON kudos(status, created_at DESC)
    WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_kudos_author_created
    ON kudos(author_id, created_at DESC)
    WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_kudos_recipient_created
    ON kudos(recipient_id, created_at DESC)
    WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_kudos_title
    ON kudos(title_id)
    WHERE deleted_at IS NULL;

-- -----------------------------------------------------------------------------
-- kudo_hashtags  (M:N, 1..5 per kudo enforced in app)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS kudo_hashtags (
    kudo_id     BIGINT      NOT NULL REFERENCES kudos(id) ON DELETE CASCADE,
    hashtag_id  BIGINT      NOT NULL REFERENCES hashtags(id),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (kudo_id, hashtag_id)
);

CREATE INDEX IF NOT EXISTS idx_kudo_hashtags_hashtag_kudo
    ON kudo_hashtags(hashtag_id, kudo_id);

-- -----------------------------------------------------------------------------
-- kudo_images  (M:N, ordered, 0..5 per kudo)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS kudo_images (
    kudo_id    BIGINT      NOT NULL REFERENCES kudos(id) ON DELETE CASCADE,
    upload_id  BIGINT      NOT NULL REFERENCES uploads(id),
    position   SMALLINT    NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (kudo_id, upload_id),
    CONSTRAINT ck_kudo_images_position
        CHECK (position BETWEEN 0 AND 4)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_kudo_images_kudo_position
    ON kudo_images(kudo_id, position);

-- -----------------------------------------------------------------------------
-- kudo_mentions  (M:N, extracted from body at submit time; no notifications in v1)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS kudo_mentions (
    kudo_id      BIGINT      NOT NULL REFERENCES kudos(id) ON DELETE CASCADE,
    employee_id  BIGINT      NOT NULL REFERENCES employees(id),
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (kudo_id, employee_id)
);

CREATE INDEX IF NOT EXISTS idx_kudo_mentions_employee_kudo
    ON kudo_mentions(employee_id, kudo_id);
