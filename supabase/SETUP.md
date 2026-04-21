# Supabase Setup — SAA 2025 Kudos

Stand up a Supabase environment that backs both shipped features of the
Kudos subsystem:

| Feature | Screen | Status |
|---|---|---|
| **Viết Kudo** (modal write path) | `ihQ26W78P2` | shipped 2026-04-20 |
| **Sun* Kudos — Live board** | `MaZUn5xHXZ` | Phase 2 shipped 2026-04-21 |

This guide covers two flows — pick whichever matches your environment:

- **Local** (your machine, via the Supabase CLI + Docker).
- **Supabase Cloud** (shared test / staging / prod projects via
  `supabase db push` or the Dashboard SQL editor).

---

## Table of contents

1. [Prerequisites](#1-prerequisites)
2. [Environment matrix](#2-environment-matrix)
3. [Local dev — CLI flow](#3-local-dev--cli-flow)
4. [Supabase Cloud — linked-project flow](#4-supabase-cloud--linked-project-flow)
5. [Supabase Cloud — Dashboard SQL editor flow (no CLI)](#5-supabase-cloud--dashboard-sql-editor-flow-no-cli)
6. [Regenerating the TypeScript types](#6-regenerating-the-typescript-types)
7. [Live-board migration notes (2026-04-21)](#7-live-board-migration-notes-2026-04-21)
8. [Verifying the setup](#8-verifying-the-setup)
9. [Troubleshooting](#9-troubleshooting)
10. [Dependencies checklist](#10-dependencies-checklist)

---

## 1. Prerequisites

```bash
# Install the Supabase CLI (needed for local dev + the `db push` flow).
brew install supabase/tap/supabase        # macOS
# or: npm install -g supabase               # cross-platform
supabase --version                        # expect 2.x

# Optional — only if you prefer raw psql over the CLI:
psql --version                            # any recent 14+/15 client works
```

Dashboard-only users can skip the CLI entirely — see
[§ 5 Dashboard SQL editor flow](#5-supabase-cloud--dashboard-sql-editor-flow-no-cli).

---

## 2. Environment matrix

| Env | Purpose | URL |
|---|---|---|
| Local | `supabase start` containers on your machine | `http://localhost:54321` |
| Test (CI) | Shared Supabase project used by Vitest integration + Playwright E2E | `https://<test-ref>.supabase.co` |
| Staging | Pre-production verification against real infra | `https://<staging-ref>.supabase.co` |
| Production | Live customer environment | `https://<prod-ref>.supabase.co` |

Create new projects at <https://supabase.com/dashboard/projects> if needed.
From **Project Settings → API** note each project's:

- Project URL (`NEXT_PUBLIC_SUPABASE_URL`)
- `anon` key (`NEXT_PUBLIC_SUPABASE_ANON_KEY`)
- `service_role` key (`SUPABASE_SERVICE_ROLE_KEY` — **never** prefix with `NEXT_PUBLIC_`, **never** commit)

---

## 3. Local dev — CLI flow

### 3.1 Start the containers

```bash
# From repo root
cd /path/to/saa-project

# Starts Postgres + Auth + Storage + Realtime.
supabase start
```

### 3.2 Apply migrations

You have two options — pick based on whether you want to wipe local data.

```bash
# Option A — clean slate (destructive — wipes local DB).
#   Recommended for fresh clones + after pulling schema-breaking changes.
supabase db reset

# Option B — non-destructive (applies only newer migrations).
#   Use when you've been working locally and want to pull in new migrations
#   without losing rows you inserted by hand.
supabase migration up
```

Both commands pick up everything under `supabase/migrations/` — including
the Phase 2 Live-board migrations (`202604210900_*` through `_902_*`).
Every migration is guarded by `IF NOT EXISTS`, so re-running is a no-op.

### 3.3 Seed test data

Two seed files live under `supabase/seed/`. They are **additive and
idempotent** — re-running them will NOT wipe anything.

```bash
DB_URL=$(supabase status -o env | awk -F= '$1=="DB_URL"{print $2}')

# Viết Kudo baseline (20 employees + 10 titles + 30 hashtags).
psql "$DB_URL" -f supabase/seed/seed-kudos-test.sql

# Live-board additions (departments + kudo_hearts + 14 sample Kudos).
#   Safe to run before OR after seed-kudos-test.sql.
psql "$DB_URL" -f supabase/seed/seed-live-board.sql
```

### 3.4 Verify

```bash
# Quick sanity check — expect 20+ active employees and a departments row.
psql "$DB_URL" -c "SELECT COUNT(*) FROM employees WHERE deleted_at IS NULL;"
psql "$DB_URL" -c "SELECT COUNT(*) FROM departments WHERE deleted_at IS NULL;"
psql "$DB_URL" -c "SELECT COUNT(*) FROM kudos WHERE deleted_at IS NULL;"
```

Full SQL verifier in [§ 8](#8-verifying-the-setup).

### 3.5 Local env file

Copy the local values into `.env.local` at the repo root:

```bash
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<from `supabase status`>
SUPABASE_SERVICE_ROLE_KEY=<from `supabase status`>

# Only needed by tests (never loaded in dev/prod):
TEST_AUTH_SECRET=<generate with: openssl rand -hex 32>
```

---

## 4. Supabase Cloud — linked-project flow

Preferred path for **test / staging / prod**. Run once per environment.

### 4.1 Link the CLI to the project

```bash
supabase link --project-ref <ref>
#   You'll be prompted for the database password — this is the "Database"
#   password from Project Settings → Database (NOT your Supabase account
#   password).
```

### 4.2 Apply migrations (non-destructive)

```bash
supabase db push
#   Computes the diff between the remote schema and your local
#   `supabase/migrations/` directory and applies only what's new. Idempotent
#   and safe to re-run.
#
#   Migrations in this repo are additive — no DROP TABLE, no DROP COLUMN
#   (the `employees.department` column is intentionally kept during the
#   Live-board transition; plan.md § T010 explains the non-destructive
#   approach). Running `db push` on an existing prod environment will NOT
#   wipe data.
```

### 4.3 Create the Storage bucket

`supabase db push` applies Postgres migrations but does NOT create Storage
buckets automatically. Run once:

```bash
supabase storage buckets create kudo-images \
    --project-ref <ref> \
    --public=false \
    --file-size-limit 5242880 \
    --allowed-mime-types "image/jpeg,image/png,image/webp"
```

### 4.4 Seed (test env only)

```bash
DB_URL="postgresql://postgres:$DB_PASSWORD@db.<ref>.supabase.co:5432/postgres"

psql "$DB_URL" -f supabase/seed/seed-kudos-test.sql
psql "$DB_URL" -f supabase/seed/seed-live-board.sql
```

**Do NOT run the seed files against staging or production.** Real
`departments` + `employees` data must come from the HR manual import
(plan.md § Q-A3). The seed files exist for local dev + CI only.

### 4.5 Enable Supabase Realtime on `kudos`

The Live-board Spotlight (B.7) subscribes to `kudos` INSERT/DELETE events.
Enable Realtime publications once per environment:

1. Dashboard → **Database → Replication**.
2. Find the `supabase_realtime` publication.
3. Toggle the `kudos` table ON.

Or via SQL:

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE kudos;
```

### 4.6 CI env vars

```
NEXT_PUBLIC_SUPABASE_URL      = https://<test-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = <test anon key>
SUPABASE_SERVICE_ROLE_KEY     = <test service-role key>   # test sign-in endpoint only
TEST_AUTH_SECRET              = <random 32-byte hex>
NODE_ENV                      = test
```

---

## 5. Supabase Cloud — Dashboard SQL editor flow (no CLI)

When the Supabase CLI isn't an option (restricted laptops, no Docker),
use the Dashboard's SQL editor. All files in `supabase/migrations/` are
self-contained and safe to paste.

Apply them **in order** (filename prefix is the timestamp):

```
supabase/migrations/202604201200_employees.sql
supabase/migrations/202604201201_titles_hashtags.sql
supabase/migrations/202604201202_uploads.sql
supabase/migrations/202604201203_kudos.sql
supabase/migrations/202604210900_departments.sql              ← Live-board (new)
supabase/migrations/202604210901_employees_department_fk.sql  ← Live-board (new)
supabase/migrations/202604210902_kudo_hearts.sql              ← Live-board (new)
```

For each file:

1. Dashboard → **SQL Editor → New query**.
2. Paste the file contents.
3. Click **Run**.
4. Confirm "Success. No rows returned." (or similar).

Each script is idempotent (`CREATE TABLE IF NOT EXISTS`, etc.) so re-running
is safe.

Then, on the **test env only**, run the seeds in the same editor:

```
supabase/seed/seed-kudos-test.sql
supabase/seed/seed-live-board.sql
```

Finally, create the Storage bucket via **Storage → New bucket**:

- Name: `kudo-images`
- Public: **off**
- File size limit: `5242880` (5 MB)
- Allowed MIME types: `image/jpeg, image/png, image/webp`

And toggle Realtime on `kudos` (Dashboard → Database → Replication).

---

## 6. Regenerating the TypeScript types

Whenever you add / modify a migration, refresh `types/supabase.ts` so the
Supabase JS client knows the new shape:

```bash
# Local DB:
supabase gen types typescript --local > types/supabase.ts

# Remote (linked) project:
supabase gen types typescript --linked > types/supabase.ts
```

Commit the regenerated file alongside the migration.

---

## 7. Live-board migration notes (2026-04-21)

The three new migrations (`202604210900_*` through `_902_*`) are
**non-destructive** by design:

| Migration | What it does | Destructive? |
|---|---|---|
| `202604210900_departments.sql` | `CREATE TABLE IF NOT EXISTS departments` + 3 indexes | ❌ No — pure additive |
| `202604210901_employees_department_fk.sql` | `ADD COLUMN department_id`, best-effort backfill from the legacy `department` text, `CREATE INDEX IF NOT EXISTS idx_employees_department_id_active` | ❌ No — the legacy `department` column is **kept**; a future migration will drop it once prod has fully cut over |
| `202604210902_kudo_hearts.sql` | `CREATE TABLE IF NOT EXISTS kudo_hearts` + `idx_kudo_hearts_employee` | ❌ No |

**What this means for you**:

- Running `supabase db push` (§ 4.2) or the Dashboard SQL editor (§ 5) on
  an environment that already has Viết Kudo employees will:
  - create `departments`, backfill `employees.department_id` from the
    legacy text column where a matching `departments.code` exists,
  - leave every other row / column untouched.
- If the backfill logs `NOTICE`s about unmatched rows, it's because some
  employees use department text that doesn't match any `departments.code`
  yet — ops should reconcile those before launch (see plan.md § Q-A3).
- **Do not** run `supabase db reset` on shared environments — it wipes
  data. Reserve it for your local DB.

---

## 8. Verifying the setup

Paste these into the SQL editor (or `psql "$DB_URL"`) after applying
migrations + seeds:

```sql
-- 1. Required extensions.
SELECT extname FROM pg_extension WHERE extname = 'pg_trgm';
-- expect 1 row

-- 2. Every feature table is present (Viết Kudo + Live board).
SELECT table_name
  FROM information_schema.tables
 WHERE table_schema = 'public'
   AND table_name IN ('employees','titles','hashtags','uploads','kudos',
                      'kudo_hashtags','kudo_images','kudo_mentions',
                      'departments','kudo_hearts');
-- expect 10 rows

-- 3. Live-board FK is in place on `employees`.
SELECT column_name, data_type
  FROM information_schema.columns
 WHERE table_name = 'employees'
   AND column_name IN ('department','department_id');
-- expect BOTH rows (legacy text + new FK — transition state).

-- 4. No RLS on this feature's tables (constitution deviation — API-layer
--    authorisation per plan.md § Constitution Compliance).
SELECT c.relname AS table, c.relrowsecurity AS rls_enabled
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
 WHERE n.nspname = 'public'
   AND c.relname IN ('employees','kudos','uploads','departments','kudo_hearts');
-- every row should show rls_enabled = f

-- 5. Storage bucket.
SELECT id, public FROM storage.buckets WHERE id = 'kudo-images';
-- expect 1 row, public = false

-- 6. Realtime publication covers `kudos` (Live-board Spotlight requires this).
SELECT pubname, tablename
  FROM pg_publication_tables
 WHERE pubname = 'supabase_realtime' AND tablename = 'kudos';
-- expect 1 row (may be empty on a fresh local DB — add with `ALTER PUBLICATION`).

-- 7. Seed sanity check (test envs only).
SELECT
  (SELECT COUNT(*) FROM employees   WHERE deleted_at IS NULL) AS employees,
  (SELECT COUNT(*) FROM departments WHERE deleted_at IS NULL) AS departments,
  (SELECT COUNT(*) FROM titles      WHERE deleted_at IS NULL) AS titles,
  (SELECT COUNT(*) FROM hashtags    WHERE deleted_at IS NULL) AS hashtags,
  (SELECT COUNT(*) FROM kudos       WHERE deleted_at IS NULL AND status='published') AS published_kudos,
  (SELECT COUNT(*) FROM kudo_hearts) AS hearts;
-- expect employees >= 20, departments >= 10, titles >= 10, hashtags >= 30,
-- published_kudos >= 12, hearts >= 25 (exact counts depend on seed order).
```

---

## 9. Troubleshooting

| Symptom | Fix |
|---|---|
| `ERROR: extension "pg_trgm" is not available` | Run `CREATE EXTENSION pg_trgm;` as superuser — Dashboard → Database → Extensions enables it in one click on Supabase Cloud. Local `supabase start` enables it automatically. |
| `relation "auth.users" does not exist` locally | You ran migrations before `supabase start` finished bootstrapping. Run `supabase stop && supabase start` and retry. |
| `relation "departments" does not exist` after `db push` | The 3 Live-board migrations failed silently because of a permission issue on the linked project. Check `supabase migration list` and re-run `supabase db push`. |
| Seed `live-seed-*` rows missing | The DO-blocks inside `seed-live-board.sql` emit `NOTICE` when referenced employees / titles are absent. Confirm `seed-kudos-test.sql` ran first, then re-run the live-board seed. |
| `Realtime` subscription never fires | Confirm the publication toggle — see `pg_publication_tables` query in § 8. Also check CSP: `connect-src` must include `wss://<ref>.supabase.co` (see `next.config.ts`). |
| Storage upload returns 403 | Confirm the bucket was created private AND the caller has a valid session cookie. Private-bucket Storage Policies are created implicitly. |
| `Cannot connect to Supabase` from Next.js | Regenerate `types/supabase.ts` (§ 6) and restart `next dev`. Next 16 caches the types module aggressively. |

---

## 10. Dependencies checklist

Tick each before the Live board goes live.

**Per environment (local + test + staging + prod)**

- [ ] All 7 migrations applied (4 Viết Kudo + 3 Live-board).
- [ ] `pg_trgm` extension enabled.
- [ ] Private `kudo-images` Storage bucket exists with 5 MB cap + JPG/PNG/WebP allow-list.
- [ ] `kudos` table added to the `supabase_realtime` publication.
- [ ] `types/supabase.ts` regenerated from the live schema.

**Local / CI only**

- [ ] `seed-kudos-test.sql` applied.
- [ ] `seed-live-board.sql` applied.

**Production only**

- [ ] HR department master list imported (plan Q-A3 — run as a one-off SQL snippet against `departments`).
- [ ] `employees.department_id` backfilled for every active employee (confirm via `SELECT COUNT(*) FROM employees WHERE department_id IS NULL AND deleted_at IS NULL;` — expect 0).
- [ ] `SUPABASE_SERVICE_ROLE_KEY` is set on the server only (no `NEXT_PUBLIC_` prefix, no commit to the repo).
- [ ] CSP `connect-src` includes the project's `wss://` origin (`next.config.ts` derives this automatically from `NEXT_PUBLIC_SUPABASE_URL`).

---

Once every box is checked, Phase 2 of the Live-board plan is done and
Phase 3 (US1 Browse MVP) can proceed.
