# Database Analysis

**Generated**: 2026-04-20 (last updated: 2026-04-21 — Live board additions)
**Source screens**:
- `ihQ26W78P2` — Viết Kudo (Write Kudo modal)
- `MaZUn5xHXZ` — Sun* Kudos — Live board (read feed, filters, likes, sidebar stats, Spotlight)

---

## Screen Analysis

### Screen: Viết Kudo (`ihQ26W78P2`)

Authenticated Sun\* staff submit a public Kudo to a single teammate, choose an honorary title ("Danh hiệu"), write a rich-text message with `@mention`, attach 1–5 hashtags and 0–5 images, and optionally post anonymously.

**Entities Identified**:
`employees` (master data — this feature adds the table), `kudos`, `titles` (Danh hiệu), `hashtags`, `kudo_hashtags`, `uploads`, `kudo_images`, `kudo_mentions`.

**Fields**:

| UI element (node) | Field | Type | Constraint |
|---|---|---|---|
| B.2 Recipient | `kudos.recipient_id` | BIGINT | FK → `employees.id`, NOT NULL, ≠ `author_id` |
| Danh hiệu (1688:10437) | `kudos.title_id` | BIGINT | FK → `titles.id`, NOT NULL. Client may submit either an existing id or a new label → server creates the title in the same transaction. |
| Anonymous alias (G.1) | `kudos.anonymous_alias` | TEXT | NULL when not anonymous; max 60 chars; only meaningful when `is_anonymous = true` |
| D Textarea | `kudos.body` | JSONB | NOT NULL (ProseMirror / sanitized rich-text JSON) |
| D Textarea (derived) | `kudos.body_plain` | TEXT | NOT NULL, generated for search |
| E Hashtag group | via `kudo_hashtags` (M:N) | — | ≥1 and ≤5 hashtags per kudo (app-level check) |
| F Image uploader | via `kudo_images` → `uploads` | — | 0–5 images per kudo (app-level check) |
| G Anonymous toggle | `kudos.is_anonymous` | BOOLEAN | NOT NULL DEFAULT false |
| author (implicit) | `kudos.author_id` | BIGINT | FK → `employees.id`, NOT NULL. Resolved by the Route Handler via `getCurrentEmployee()` before insert |
| status (moderation) | `kudos.status` | VARCHAR | CHECK IN ('published','hidden','reported') |
| @mentions | via `kudo_mentions` (M:N) | — | Active employees mentioned in body |

**Derived / supporting entities** (populated from master lists surfaced by this screen):

- **`employees`** (master data — new in this migration): `id BIGSERIAL PRIMARY KEY` (standalone — **no FK to `auth.users`**), `email`, `full_name`, `employee_code`, `department`, `job_title`, `avatar_url`, `is_admin`, `deleted_at`, timestamps. Source of truth for "who can send/receive Kudos and be mentioned". One row per Sun* staff account. Populated by HR / admin import independently of who has signed up via Supabase Auth. **Linkage to Supabase Auth is application-only**: `lib/auth/current-employee.ts` reads the JWT email and looks up the matching active `employees` row. There is no SQL helper and no schema-level FK — identity resolution lives entirely in the Route Handler layer.
- `titles` — Danh hiệu list (id, name, slug, description, icon, sort_order, created_by, deleted_at). **User-generated** — any authenticated user may insert via inline creation in the picker; admins manage / deprecate.
- `hashtags` — hashtag list with usage counter and `created_by`. **User-generated** — same pattern as titles.
- `uploads` — generic uploaded asset record (owner, mime, size, storage key in Supabase Storage bucket `kudo-images`, expires). Reused across features.

---

## Entity Mapping

| Screen | Entities | Fields | Relationships |
|---|---|---|---|
| Viết Kudo | `kudos` | author_id, recipient_id, title_id, body, is_anonymous, status | `kudos.author_id` → `employees`, `kudos.recipient_id` → `employees`, `kudos.title_id` → `titles` |
| Viết Kudo | `kudo_hashtags` (join) | kudo_id, hashtag_id | M:N `kudos` ↔ `hashtags` |
| Viết Kudo | `kudo_images` (join) | kudo_id, upload_id, position | M:N `kudos` ↔ `uploads`, ordered 0..4 |
| Viết Kudo | `kudo_mentions` (join) | kudo_id, employee_id | M:N `kudos` ↔ `employees` |
| Viết Kudo | `titles` | name, description, icon, sort_order | Referenced by `kudos.title_id` |
| Viết Kudo | `hashtags` | label, usage_count | Referenced by `kudo_hashtags.hashtag_id` |
| Viết Kudo | `uploads` | owner_id, mime, size, storage_key | Referenced by `kudo_images.upload_id` |

`employees` is assumed to exist from the auth/login feature (screen `GzbNeVGJHz-login`); this analysis does **not** redefine it.

---

## Data Flow

1. **On modal open**:
   - `GET /api/titles` → list active `titles` for Danh hiệu select.
   - `GET /api/hashtags?q=` → search `hashtags` for tag picker.
   - `GET /api/employees/search?q=` → autocomplete for recipient (filters out self & `deleted_at IS NOT NULL`).
2. **While typing `@mention`**:
   - `GET /api/employees/search?q=...&ignore_caller=false` → suggestion list (caller may appear).
3. **On image add**:
   - `POST /api/uploads` (multipart) → inserts row in `uploads`, returns `upload_id` and signed URL. Files live in object storage, not the DB.
4. **On submit (`POST /api/kudos`)** — single transaction:
   1. Insert row into `kudos` with `author_id`, `recipient_id`, `title_id`, `body`, `body_plain`, `is_anonymous`, `status='published'`.
   2. Bulk insert into `kudo_hashtags` (1..5 rows). Increment `hashtags.usage_count` atomically.
   3. Bulk insert into `kudo_images` with `position`.
   4. Parse mentions from `body` → bulk insert `kudo_mentions`.
5. **On Kudos board refresh**:
   - `GET /api/kudos` reads `kudos` joined with `employees` (author, recipient), `titles`, `kudo_hashtags→hashtags`, `kudo_images→uploads`. When `is_anonymous=true`, author fields are masked at the API layer — the DB still stores `author_id` for moderation and audit.

---

## Constraints & Business Rules

- `kudos.author_id <> kudos.recipient_id` — CHECK constraint (cannot Kudo yourself).
- `kudos.anonymous_alias` — CHECK `char_length BETWEEN 1 AND 60` when non-null; CHECK it is NULL unless `is_anonymous = TRUE`.
- Hashtag count per kudo (1–5) and image count per kudo (0–5) — enforced in application + API validation layer (no DB trigger).
- Anonymity is a **presentation** flag; the real `author_id` is never nullable. Masking is applied in the application layer by `lib/kudos/serialize-kudo.ts` — the API returns flat `senderName` / `senderAvatarUrl` / `recipientName` / `recipientAvatarUrl`, never a raw `author` object.
- Inline title / hashtag creation is handled at the API layer (`POST /api/kudos` Route Handler) via `supabase.from(...).upsert({slug, label}, {onConflict: 'slug', ignoreDuplicates: true})`. The partial unique index on `slug WHERE deleted_at IS NULL` makes this race-safe without a Postgres function.
- `uploads` rows older than their `expires_at` without being linked to any content (orphaned) are garbage-collected by a scheduled job (outside DB).
- Soft-delete everywhere via `deleted_at TIMESTAMPTZ` (no `is_deleted` booleans).
- `updated_at` is maintained by the application (no triggers).

---

## Index Strategy

| Index | Purpose |
|---|---|
| `employees (id)` PRIMARY KEY (BIGSERIAL) | Standard PK (auto-indexed) |
| `employees (lower(email))` UNIQUE partial | Email uniqueness among active staff |
| `employees (employee_code)` UNIQUE partial | Employee-code uniqueness among active staff |
| `employees (lower(full_name) gin_trgm_ops)` GIN | Autocomplete / `@mention` typeahead (diacritic-tolerant, case-insensitive) |
| `employees (department)` | Recipient filter / org-chart views |
| `employees (is_admin)` partial | Admin-role lookups in Route Handlers (no RLS — spec rev 3 FR-016) |
| `kudos (author_id, created_at DESC)` | "My Kudos" list on profile |
| `kudos (recipient_id, created_at DESC)` | "Received Kudos" on profile + award leaderboards |
| `kudos (status, created_at DESC)` | Public board feed (status='published') |
| `kudos (title_id)` | Filter board by Danh hiệu |
| `kudo_hashtags (hashtag_id, kudo_id)` | Filter board by hashtag |
| `kudo_mentions (employee_id, kudo_id)` | "Kudos that mention me" |
| `kudo_images (kudo_id, position)` | Ordered gallery load |
| `titles (deleted_at, sort_order)` | Active title select |
| `hashtags (deleted_at, label)` | Hashtag search UX |
| `uploads (owner_id, created_at DESC)` | User asset listing + GC |

Primary keys, foreign keys, and unique constraints are indexed implicitly.

---

---

## Screen Analysis

### Screen: Sun* Kudos — Live board (`MaZUn5xHXZ`)

The public feed for the SAA 2025 Kudos programme. Read-heavy: shows a HIGHLIGHT carousel (top-5 hearted Kudos), an ALL KUDOS infinite-scroll feed, a live SPOTLIGHT board, and a right sidebar with personal stats + recent gift-receivers. Interactive actions are **filter** (by hashtag or department), **like/un-like**, **copy-link**, **open Viết Kudo modal**. Realtime scope = Spotlight only.

**Entities Identified (new this screen)**: `departments`, `kudo_hearts`; plus one schema change to `employees` (see below). The `hashtags` table is reused unchanged.

**Entities reused from Viết Kudo**: `kudos`, `employees`, `hashtags`, `kudo_hashtags`, `kudo_images`, `uploads`.

**Deferred (no DB change this release)**: the `secret_boxes` table is intentionally omitted — the Mở quà / Secret Box feature is not in scope this release. See "Deferred schema" at the bottom of this section for the recommended shape when the feature is scheduled.

#### Schema changes

| Change | Table | Why |
|---|---|---|
| **Replace** `employees.department VARCHAR` with `department_id BIGINT REFERENCES departments(id)` | `employees` | The Phòng ban filter dropdown (Figma `WXK5AYB_rG`) requires a stable enumerated list; free-text cannot support safe joins or the "filter kudos where recipient belongs to department X" query. |

#### New tables

**`departments`** (master data, populated by HR sync)

| UI element (node) | Field | Type | Constraint |
|---|---|---|---|
| Phòng ban dropdown items (`WXK5AYB_rG`) | `code` | VARCHAR | NOT NULL, 1..60 chars. Unique among active rows. |
| Phòng ban dropdown items | `name` | VARCHAR | Long name (optional) |
| Hierarchy (e.g. `CEVC1 - DSV - UI/UX 1`) | `parent_id` | BIGINT | Self-FK, nullable. 3 levels at most today. |
| Dropdown ordering | `sort_order` | INTEGER | NOT NULL DEFAULT 0 |
| Soft-delete | `deleted_at` | TIMESTAMPTZ | NULL = active |

Queries:
- `GET /api/departments` → `SELECT id, code, name FROM departments WHERE deleted_at IS NULL ORDER BY sort_order, code`.
- Filter Kudos: `WHERE recipient.department_id = $1`.

**`kudo_hearts`** (Live board like/un-like; US4, FR-005)

| UI element (node) | Field | Type | Constraint |
|---|---|---|---|
| Heart icon on every card (C.4.1 / B.4.4) | `kudo_id` | BIGINT | FK → `kudos.id`, `ON DELETE CASCADE`, part of composite PK |
| Current user | `employee_id` | BIGINT | FK → `employees.id`, part of composite PK (enforces "≤1 like per user per kudo") |
| When liked | `created_at` | TIMESTAMPTZ | NOT NULL DEFAULT NOW() |

Business rules:
- **Composite PK (kudo_id, employee_id)** = DB-level "at most one like per user per kudo".
- **No self-like**: enforced in the Route Handler (`kudos.author_id <> session.employee_id`) — not a DB CHECK because it would require a trigger / function.
- Un-like = `DELETE FROM kudo_hearts WHERE kudo_id=$1 AND employee_id=$2`.
- `heart_count` on the card is computed `COUNT(*)` — not denormalised on `kudos` — so un-likes can't drift the counter.
- **Bonus-day hearts out of scope** this release — each like = 1 heart.

**Deferred schema — `secret_boxes`** _(NOT created this release)_

When the Secret Box feature is scheduled, create the table with this shape:

```sql
CREATE TABLE secret_boxes (
    id           BIGSERIAL PRIMARY KEY,
    owner_id     BIGINT      NOT NULL REFERENCES employees(id),
    gift_name    VARCHAR     NOT NULL,
    granted_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    opened_at    TIMESTAMPTZ,               -- NULL = unopened
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at   TIMESTAMPTZ,
    CONSTRAINT ck_secret_boxes_gift_name_length
        CHECK (char_length(gift_name) BETWEEN 1 AND 120),
    CONSTRAINT ck_secret_boxes_opened_after_granted
        CHECK (opened_at IS NULL OR opened_at >= granted_at)
);
CREATE INDEX idx_secret_boxes_owner_opened
    ON secret_boxes(owner_id, opened_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_secret_boxes_opened_desc
    ON secret_boxes(opened_at DESC) WHERE opened_at IS NOT NULL AND deleted_at IS NULL;
```

Until then, the Live board sidebar:
- `D.1.6` / `D.1.7` stat rows render **`0`** (hard-coded / absent endpoint).
- `D.3` list renders its empty state (`Chưa có dữ liệu`).
- `D.1.8` `Mở quà` button renders permanently disabled per spec US6.

#### Query matrix for the Live board

| Feature | Query |
|---|---|
| HIGHLIGHT KUDOS carousel (top-5, FR-002) | `SELECT k.*, COUNT(h.*) AS heart_count FROM kudos k LEFT JOIN kudo_hearts h ON h.kudo_id=k.id WHERE k.status='published' AND k.deleted_at IS NULL [AND filter] GROUP BY k.id ORDER BY heart_count DESC, k.created_at ASC LIMIT 5` |
| ALL KUDOS feed (FR-003, 10 per page) | `SELECT ... FROM kudos k WHERE k.status='published' AND k.deleted_at IS NULL [AND filter] ORDER BY k.created_at DESC LIMIT 10 [OFFSET cursor]` |
| Filter by hashtag (FR-004) | `JOIN kudo_hashtags kh ON kh.kudo_id=k.id WHERE kh.hashtag_id = $1` |
| Filter by department (FR-004) | `JOIN employees r ON r.id=k.recipient_id WHERE r.department_id = $1` |
| Like a Kudo (FR-005) | `INSERT INTO kudo_hearts (kudo_id, employee_id) VALUES ($1, $2) ON CONFLICT DO NOTHING` |
| Un-like a Kudo | `DELETE FROM kudo_hearts WHERE kudo_id=$1 AND employee_id=$2` |
| "Has current user liked this Kudo" | `EXISTS (SELECT 1 FROM kudo_hearts WHERE kudo_id=$1 AND employee_id=$2)` |
| Sidebar stats (FR-008) | `GET /api/me/stats` aggregates from `kudos` + `kudo_hearts` only; Secret Box counts hard-coded to `0` until the deferred `secret_boxes` table ships |
| Spotlight total (B.7.1) | `SELECT COUNT(*) FROM kudos WHERE status='published' AND deleted_at IS NULL` |
| Spotlight node layout | Cached via Next.js `unstable_cache` with 5-min revalidation; no DB table |
| Hoa thị rule (FR-015: 10/20/50 Kudos) | `SELECT COUNT(*) FROM kudos WHERE recipient_id=$1 AND status='published' AND deleted_at IS NULL` — bucketed in the application layer to 1/2/3 stars |

#### What is NOT new in the DB for this screen

- **Spotlight layout cache** — lives in the Next.js server cache (`unstable_cache` with 5-min revalidation tag), **not** a DB table. Keeps Postgres schema clean; the cache is intrinsically server-side and per-cluster.
- **`total_hearts`, `kudos_received_count`, `kudos_sent_count`** in the spec's Key Entities — computed aggregates (Postgres views or on-demand `COUNT`s on the `/api/me/stats` handler). Not denormalised columns, to avoid sync bugs. Can be promoted to cached columns later if p95 latency becomes an issue.
- **Bonus-day hearts** — deferred. No `bonus_days` table, no `bonus` column on `kudo_hearts`.

### Entity Mapping — Live board

| Screen | Entities | Fields | Relationships |
|---|---|---|---|
| Sun* Kudos Live board | `departments` (new) | code, name, parent_id, sort_order | `employees.department_id` → `departments.id` |
| Sun* Kudos Live board | `kudo_hearts` (new) | kudo_id, employee_id, created_at | M:N `kudos` ↔ `employees`; composite PK |
| Sun* Kudos Live board | `employees` (modified) | − `department`, + `department_id` FK | `employees.department_id` → `departments.id` |

---

## Out of Scope (for this screen)

- Comments, reactions, notifications — separate screens own those tables.
- Moderation workflow fields beyond a simple `status` enum.
- Kudo editing / revision history (handled on `Man Sua bai viet` screen).
- Draft persistence — lives in client `sessionStorage`, not the DB.
- **Secret Box open flow** (Live board D.1.8) — deferred; no write path yet.
- **Bonus-day hearts** (Live board) — deferred; no `bonus_days` table, no `bonus` column.
- **Spotlight layout cache** — lives in Next.js server cache, not the DB.
