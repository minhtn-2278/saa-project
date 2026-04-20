# Database Analysis

**Generated**: 2026-04-20
**Source screens**:
- `ihQ26W78P2` — Viết Kudo (Write Kudo modal)

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
- Inline title / hashtag creation is handled by a transactional Postgres function (`fn_insert_title_if_missing`, `fn_insert_hashtag_if_missing`) using `INSERT ... ON CONFLICT (slug) DO NOTHING RETURNING id` → fallback `SELECT`. This avoids dupes under concurrent submission.
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
| `employees (is_admin)` partial | Admin-role lookups for RLS |
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

## Out of Scope (for this screen)

- Comments, reactions, notifications — separate screens own those tables.
- Moderation workflow fields beyond a simple `status` enum.
- Kudo editing / revision history (handled on `Man Sua bai viet` screen).
- Draft persistence — lives in client `sessionStorage`, not the DB.
