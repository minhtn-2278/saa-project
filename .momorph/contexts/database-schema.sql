-- ==========================================
-- Database Schema — SAA 2025 Kudos
-- Generated from Figma screen: ihQ26W78P2 (Viết Kudo), MaZUn5xHXZ (Live board)
-- Generated at: 2026-04-20 (last updated: 2026-04-21 Live board additions)
-- Conventions:
--   * PostgreSQL 15+ (Supabase-managed)
--   * BIGSERIAL primary keys for application tables
--   * TIMESTAMPTZ for all timestamps
--   * Soft delete via deleted_at (no is_deleted flags)
--   * updated_at maintained by the application, not triggers
--   * Supabase Auth still owns authentication (auth.users), but employees is a
--     STANDALONE master-data table with its own BIGSERIAL id and NO schema-level
--     FK to auth.users. Linkage between an authenticated session and an
--     employee row is resolved at the APPLICATION layer (Route Handlers) —
--     `lib/auth/current-employee.ts` reads the JWT email and looks up the
--     matching employees row. Per-row identity authorization (author/recipient/
--     owner checks) is enforced in Route Handlers before any mutation.
--     RLS policies at the DB layer are intentionally limited to status / role
--     filters — they do NOT perform caller → employee_id resolution.
-- ==========================================


-- ==========================================
-- departments  (MASTER DATA — organisational units)
--   Populated by HR master-data sync. Drives the Phòng ban filter dropdown on the
--   Live board (Figma WXK5AYB_rG) and is the canonical reference for
--   employees.department_id.
--   Supports optional hierarchy via parent_id (e.g. "CEVC1 - DSV - UI/UX 1" can be
--   modelled as three rows nested by parent_id if the organisation adopts it).
--   `code` is the short identifier shown in the dropdown (CEVC2, OPDC - HRF, etc.).
-- ==========================================
CREATE TABLE departments (
    id           BIGSERIAL PRIMARY KEY,
    code         VARCHAR     NOT NULL,           -- short identifier shown in UI (e.g. 'CEVC2', 'OPDC - HRF')
    name         VARCHAR,                        -- optional long name (e.g. 'Customer Experience VC 2')
    parent_id    BIGINT      REFERENCES departments(id), -- optional hierarchy (nullable)
    sort_order   INTEGER     NOT NULL DEFAULT 0,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at   TIMESTAMPTZ,
    CONSTRAINT ck_departments_code_length
        CHECK (char_length(code) BETWEEN 1 AND 60)
);

-- Code unique among active departments
CREATE UNIQUE INDEX idx_departments_code_active
    ON departments(code)
    WHERE deleted_at IS NULL;

-- Hierarchy traversal (list children of a parent)
CREATE INDEX idx_departments_parent_active
    ON departments(parent_id)
    WHERE deleted_at IS NULL;

-- Live board dropdown query: SELECT ... WHERE deleted_at IS NULL ORDER BY sort_order, code
CREATE INDEX idx_departments_sort_active
    ON departments(sort_order, code)
    WHERE deleted_at IS NULL;


-- ==========================================
-- employees  (MASTER DATA — every Sun* staff account)
--   Populated by HR / admin import independently of Supabase Auth sign-ups.
--   One row per staff member. Primary key is BIGSERIAL.
--   Source of truth for "who can send/receive Kudos and be mentioned".
--   The link to Supabase Auth happens at query time: the application reads the
--   email claim from the JWT and looks up the matching active employees row.
--   Admin roles are marked with is_admin (used by RLS for UPDATE/DELETE on
--   titles, hashtags, and moderation tables).
-- ==========================================
CREATE TABLE employees (
    id              BIGSERIAL PRIMARY KEY,
    email           VARCHAR     NOT NULL,                 -- used to match the authenticated user's JWT email
    full_name       VARCHAR     NOT NULL,
    employee_code   VARCHAR,                              -- Sun* employee code (optional)
    department_id   BIGINT      REFERENCES departments(id), -- Phòng ban FK (Live board filter + org views). Nullable until HR sync populates.
    job_title       VARCHAR,
    avatar_url      VARCHAR,                              -- Supabase Storage signed-URL target or external URL
    is_admin        BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at      TIMESTAMPTZ,                          -- NULL = active
    CONSTRAINT ck_employees_full_name_length
        CHECK (char_length(full_name) BETWEEN 1 AND 120),
    CONSTRAINT ck_employees_email_format
        CHECK (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$')
);
-- Live board addition (2026-04-21): replaced the legacy `department VARCHAR` free-text
-- column with a proper `department_id BIGINT REFERENCES departments(id)` foreign key.
-- Rationale: the Phòng ban filter dropdown on the Live board (screenId MaZUn5xHXZ)
-- requires a stable, enumerated list of departments — free-text cannot support the
-- dropdown or safe joins. HR master-data sync is responsible for setting this FK.

-- Note: there is intentionally no current_employee_id() SQL helper. Identity
-- resolution (JWT email → employees.id) happens in the Next.js Route Handler
-- layer via lib/auth/current-employee.ts. See spec.md § FR-016 for how
-- authorization is split between the application and RLS.

-- Email must be unique among active employees
CREATE UNIQUE INDEX idx_employees_email_active
    ON employees(lower(email))
    WHERE deleted_at IS NULL;

-- Employee code unique among active employees (when set)
CREATE UNIQUE INDEX idx_employees_code_active
    ON employees(employee_code)
    WHERE deleted_at IS NULL AND employee_code IS NOT NULL;

-- Autocomplete / search-by-name: trigram index for case-insensitive + diacritic-tolerant prefix
-- Requires the pg_trgm extension (Supabase has it available, needs CREATE EXTENSION pg_trgm;)
CREATE INDEX idx_employees_full_name_trgm
    ON employees USING GIN (lower(full_name) gin_trgm_ops)
    WHERE deleted_at IS NULL;

CREATE INDEX idx_employees_department_id_active
    ON employees(department_id)
    WHERE deleted_at IS NULL;

-- Admin-role lookups
CREATE INDEX idx_employees_admin
    ON employees(is_admin)
    WHERE is_admin = TRUE AND deleted_at IS NULL;


-- ==========================================
-- titles  (Danh hiệu — honorary titles)
--   User-generated list of honours a user may pick when writing a Kudo.
--   Any authenticated user MAY insert via inline creation in the picker.
--   UPDATE / DELETE is restricted to admin role (enforced by RLS).
-- ==========================================
CREATE TABLE titles (
    id           BIGSERIAL PRIMARY KEY,
    name         VARCHAR     NOT NULL,
    slug         VARCHAR     NOT NULL,       -- normalized lowercase, used for dedupe
    description  TEXT,
    icon         VARCHAR,                    -- icon name or storage key
    sort_order   INTEGER     NOT NULL DEFAULT 0,
    created_by   BIGINT      REFERENCES employees(id),
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at   TIMESTAMPTZ,
    CONSTRAINT ck_titles_name_length
        CHECK (char_length(name) BETWEEN 2 AND 60)
);

CREATE UNIQUE INDEX idx_titles_slug_active
    ON titles(slug)
    WHERE deleted_at IS NULL;

CREATE INDEX idx_titles_active_sort
    ON titles(sort_order)
    WHERE deleted_at IS NULL;


-- ==========================================
-- hashtags  (user-generated hashtag list)
--   Any authenticated user MAY insert via inline creation in the picker.
--   UPDATE / DELETE is restricted to admin role (enforced by RLS).
-- ==========================================
CREATE TABLE hashtags (
    id           BIGSERIAL PRIMARY KEY,
    label        VARCHAR     NOT NULL,       -- display label without leading '#'
    slug         VARCHAR     NOT NULL,       -- normalized lowercase for lookup
    usage_count  BIGINT      NOT NULL DEFAULT 0,
    created_by   BIGINT      REFERENCES employees(id),
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at   TIMESTAMPTZ,
    CONSTRAINT ck_hashtags_label_length
        CHECK (char_length(label) BETWEEN 2 AND 32)
);
-- Live board (2026-04-21): all active hashtags are shown in the filter dropdown —
-- no distinction between program-curated and user-generated. Ordering is by
-- `usage_count DESC, label ASC` at query time.

CREATE UNIQUE INDEX idx_hashtags_slug_active
    ON hashtags(slug)
    WHERE deleted_at IS NULL;

CREATE INDEX idx_hashtags_label_active
    ON hashtags(label)
    WHERE deleted_at IS NULL;

-- Live-board Hashtag filter dropdown query: ORDER BY usage_count DESC, label ASC
CREATE INDEX idx_hashtags_usage_count_active
    ON hashtags(usage_count DESC)
    WHERE deleted_at IS NULL;


-- ==========================================
-- uploads  (generic uploaded asset; reused across features)
--   Binary files live in object storage (storage_key references the object).
--   The DB stores metadata only.
-- ==========================================
CREATE TABLE uploads (
    id           BIGSERIAL PRIMARY KEY,
    owner_id     BIGINT      NOT NULL REFERENCES employees(id),
    storage_key  VARCHAR     NOT NULL,       -- object storage key (e.g. s3://.../uuid.jpg)
    mime_type    VARCHAR     NOT NULL,
    byte_size    BIGINT      NOT NULL,
    width        INTEGER,                    -- nullable for non-image types
    height       INTEGER,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at   TIMESTAMPTZ,
    CONSTRAINT ck_uploads_mime_image
        CHECK (mime_type IN ('image/jpeg','image/png','image/webp')),
    CONSTRAINT ck_uploads_size
        CHECK (byte_size > 0 AND byte_size <= 5242880)  -- 5 MB per file
);

CREATE INDEX idx_uploads_owner_created
    ON uploads(owner_id, created_at DESC)
    WHERE deleted_at IS NULL;


-- ==========================================
-- kudos  (the Kudo post itself)
-- ==========================================
CREATE TABLE kudos (
    id               BIGSERIAL PRIMARY KEY,
    author_id        BIGINT      NOT NULL REFERENCES employees(id),
    recipient_id     BIGINT      NOT NULL REFERENCES employees(id),
    title_id         BIGINT      NOT NULL REFERENCES titles(id),
    body             JSONB       NOT NULL,      -- ProseMirror / sanitized rich-text JSON
    body_plain       TEXT        NOT NULL,      -- stripped text for search & previews
    is_anonymous     BOOLEAN     NOT NULL DEFAULT FALSE,
    anonymous_alias  TEXT,                     -- optional display name when is_anonymous; NULL → "Ẩn danh"
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

-- Public board feed (status='published', newest first)
CREATE INDEX idx_kudos_status_created
    ON kudos(status, created_at DESC)
    WHERE deleted_at IS NULL;

-- "My sent Kudos" on profile
CREATE INDEX idx_kudos_author_created
    ON kudos(author_id, created_at DESC)
    WHERE deleted_at IS NULL;

-- "Received Kudos" on profile + leaderboards
CREATE INDEX idx_kudos_recipient_created
    ON kudos(recipient_id, created_at DESC)
    WHERE deleted_at IS NULL;

-- Filter board by Danh hiệu
CREATE INDEX idx_kudos_title
    ON kudos(title_id)
    WHERE deleted_at IS NULL;


-- ==========================================
-- kudo_hashtags  (M:N kudos ↔ hashtags)
--   Range 1..5 per kudo enforced by application, not DB.
-- ==========================================
CREATE TABLE kudo_hashtags (
    kudo_id     BIGINT      NOT NULL REFERENCES kudos(id) ON DELETE CASCADE,
    hashtag_id  BIGINT      NOT NULL REFERENCES hashtags(id),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (kudo_id, hashtag_id)
);

-- Filter board by hashtag (reverse direction of the PK)
CREATE INDEX idx_kudo_hashtags_hashtag_kudo
    ON kudo_hashtags(hashtag_id, kudo_id);


-- ==========================================
-- kudo_images  (M:N kudos ↔ uploads, ordered)
--   Range 0..5 per kudo enforced by application.
-- ==========================================
CREATE TABLE kudo_images (
    kudo_id    BIGINT      NOT NULL REFERENCES kudos(id) ON DELETE CASCADE,
    upload_id  BIGINT      NOT NULL REFERENCES uploads(id),
    position   SMALLINT    NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (kudo_id, upload_id),
    CONSTRAINT ck_kudo_images_position
        CHECK (position BETWEEN 0 AND 4)
);

-- Unique ordering per kudo
CREATE UNIQUE INDEX idx_kudo_images_kudo_position
    ON kudo_images(kudo_id, position);


-- ==========================================
-- kudo_mentions  (M:N kudos ↔ employees via @mention)
--   Mirror of mentions extracted from kudos.body at submit time.
-- ==========================================
CREATE TABLE kudo_mentions (
    kudo_id      BIGINT      NOT NULL REFERENCES kudos(id) ON DELETE CASCADE,
    employee_id  BIGINT      NOT NULL REFERENCES employees(id),
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (kudo_id, employee_id)
);

-- "Kudos that mention me"
CREATE INDEX idx_kudo_mentions_employee_kudo
    ON kudo_mentions(employee_id, kudo_id);


-- ==========================================
-- kudo_hearts  (Live board: like / thả tim)
--   One row per (kudo, employee) pair. Composite primary key enforces the
--   "at most one like per user per kudo" rule at the database layer.
--   Route Handlers additionally enforce "author cannot self-like" (kudos.author_id
--   <> employee_id) — NOT a DB CHECK because checking across tables would require
--   a trigger; application enforcement + the idempotent upsert pattern is preferred.
--   The card's visible heart_count is computed via COUNT(*) with a dedicated index
--   (not denormalised on the kudos row) so un-likes can't drift the counter.
--   Bonus-day hearts is OUT OF SCOPE this release — each like is exactly 1 heart.
-- ==========================================
CREATE TABLE kudo_hearts (
    kudo_id      BIGINT      NOT NULL REFERENCES kudos(id) ON DELETE CASCADE,
    employee_id  BIGINT      NOT NULL REFERENCES employees(id),
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (kudo_id, employee_id)
);

-- Per-Kudo heart count + "has current user liked" query:
--   SELECT count(*) FROM kudo_hearts WHERE kudo_id = $1;
-- The PK (kudo_id, employee_id) covers the count.

-- Highlight carousel + recipient's received-hearts aggregate:
--   SELECT employee_id, count(*) FROM kudo_hearts GROUP BY employee_id;
-- Uses this index:
CREATE INDEX idx_kudo_hearts_employee
    ON kudo_hearts(employee_id);


-- ==========================================
-- NOTE: `secret_boxes` table is intentionally NOT created this release.
-- Reason: the Secret Box / "Mở quà" feature is deferred. The Live board sidebar
-- keeps the D.1.6 / D.1.7 rows for layout parity but renders `0` / `—` for both
-- counts, and the D.3 "10 SUNNER NHẬN QUÀ MỚI NHẤT" list renders its empty state
-- (`Chưa có dữ liệu`). When the feature is scheduled, re-introduce the table as
-- documented in DATABASE_ANALYSIS.md § "Deferred schema".
-- ==========================================
