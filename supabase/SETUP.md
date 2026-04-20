# Supabase Setup — Kudos feature

Target: stand up **local dev** + **CI test** + **staging** + **production** Supabase projects so the Write-Kudo feature (`screenId: ihQ26W78P2`) can run end-to-end.

Applies to plan tasks **T028 (Storage bucket) + T030 (apply migrations)**.

---

## 1. Prerequisites

```bash
# Install the Supabase CLI if you don't have it yet.
brew install supabase/tap/supabase        # macOS
# or: npm install -g supabase               # cross-platform
supabase --version                        # expect 2.x
```

You'll need **4 Supabase projects** (or at minimum 3 — local + test + prod, merging staging with prod until the user base grows):

| Env | Purpose | URL env var |
|---|---|---|
| Local | `supabase start` containers on your machine | `http://localhost:54321` |
| Test (CI) | Shared Supabase project used by Vitest integration + Playwright E2E | `https://<test-ref>.supabase.co` |
| Staging | Pre-production verification against real infra | `https://<staging-ref>.supabase.co` |
| Production | Live | `https://<prod-ref>.supabase.co` |

Create new projects at <https://supabase.com/dashboard/projects> if they don't exist yet. Note down each project's `anon` key and `service_role` key from **Project Settings → API**.

---

## 2. Local dev

```bash
# From repo root
cd /path/to/saa-project

# Start local Supabase containers (Postgres + Auth + Storage + Realtime)
supabase start

# Apply migrations + seed
supabase db reset                              # wipes local DB and replays every migration
psql "$(supabase status -o env | awk -F= '$1==\"DB_URL\"{print $2}')" \
     -f supabase/seed/seed-kudos-test.sql      # loads 20 employees + 10 titles + 30 hashtags

# Verify
psql "$(supabase status -o env | awk -F= '$1==\"DB_URL\"{print $2}')" \
     -c 'SELECT COUNT(*) FROM employees;'      # expect 20 (19 active, 1 soft-deleted)
```

The `supabase/config.toml` already includes the private `kudo-images` bucket (see `[storage.buckets.kudo-images]`). `supabase start` will create it automatically.

### Local env

Copy the local values into `.env.local` at the repo root:

```bash
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<from `supabase status`>
SUPABASE_SERVICE_ROLE_KEY=<from `supabase status`>

# Only needed by tests (never loaded in dev/prod):
TEST_AUTH_SECRET=<generate with: openssl rand -hex 32>
```

---

## 3. CI test project

One-time provisioning:

```bash
# Link the CLI to the test project (you'll be prompted for the project ref + db password)
supabase link --project-ref <test-ref>

# Push every migration under supabase/migrations
supabase db push

# Seed baseline data
psql "postgresql://postgres:$DB_PASSWORD@db.<test-ref>.supabase.co:5432/postgres" \
     -f supabase/seed/seed-kudos-test.sql
```

### Storage bucket (remote)

`supabase db push` applies Postgres migrations but does NOT create Storage buckets automatically. Run once:

```bash
supabase storage buckets create kudo-images \
    --project-ref <test-ref> \
    --public=false \
    --file-size-limit 5242880 \
    --allowed-mime-types "image/jpeg,image/png,image/webp"
```

### CI env vars (GitHub Actions, etc.)

```
NEXT_PUBLIC_SUPABASE_URL      = https://<test-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = <test anon key>
SUPABASE_SERVICE_ROLE_KEY     = <test service-role key>    # used ONLY by the test sign-in endpoint
TEST_AUTH_SECRET              = <random 32-byte hex>
NODE_ENV                      = test
```

---

## 4. Staging & production

Same as CI, but replace `<test-ref>` with the staging / prod refs. **Do NOT run the seed file in production** — master-data must come from the HR master list (see § Dependencies in plan.md). For now the seed file is a developer convenience, not a production asset.

CI should run `supabase db push` on merge to `main` against staging, and a manually gated deploy step against prod.

---

## 5. Applying migrations in order

If you prefer to apply each migration one at a time (useful when debugging):

```bash
DB_URL=postgresql://postgres:$DB_PASSWORD@db.<ref>.supabase.co:5432/postgres

psql "$DB_URL" -f supabase/migrations/202604201200_employees.sql
psql "$DB_URL" -f supabase/migrations/202604201201_titles_hashtags.sql
psql "$DB_URL" -f supabase/migrations/202604201202_uploads.sql
psql "$DB_URL" -f supabase/migrations/202604201203_kudos.sql
psql "$DB_URL" -f supabase/seed/seed-kudos-test.sql      # test envs only

# Note: spec.md rev 3 FR-016 removed RLS policies, RPC functions, and the
# kudo_submit_guard dedup table. Authorisation is handled entirely at the API
# layer (lib/auth/current-employee.ts + Route Handlers). Four migrations total.
```

The migrations are idempotent (`CREATE TABLE IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS`, `CREATE OR REPLACE FUNCTION`) and safe to re-run.

---

## 6. Verifying the setup

```sql
-- 1. extensions
SELECT extname FROM pg_extension WHERE extname = 'pg_trgm';                -- expect 1 row

-- 2. tables
SELECT table_name FROM information_schema.tables
 WHERE table_schema = 'public'
   AND table_name IN ('employees','titles','hashtags','uploads','kudos',
                      'kudo_hashtags','kudo_images','kudo_mentions');
-- expect 8 rows

-- 3. No RLS on this feature's tables (spec.md rev 3 FR-016 — API-layer enforcement)
SELECT c.relname AS table, c.relrowsecurity AS rls_enabled
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
 WHERE n.nspname = 'public' AND c.relname IN ('employees','kudos','uploads');
-- every row should show rls_enabled = f

-- 4. Bucket exists (run against Storage API or inspect the Dashboard)
SELECT id, name, public FROM storage.buckets WHERE id = 'kudo-images';
-- expect 1 row with public = false
```

---

## 7. Troubleshooting

| Symptom | Fix |
|---|---|
| `ERROR: extension "pg_trgm" is not available` | Run `CREATE EXTENSION pg_trgm;` as superuser (Supabase CLI does this automatically; managed projects allow it via the Dashboard → Database → Extensions). |
| `permission denied for table kudos` from the app | Check that the user's session JWT carries the `authenticated` role and the default `authenticated` grant is present. `SELECT has_table_privilege('authenticated', 'public.kudos', 'SELECT');` should return `t`. (There are no RLS policies — spec rev 3 FR-016.) |
| `relation "auth.users" does not exist` when running migrations locally | You ran migrations before `supabase start` finished bootstrapping. Run `supabase stop && supabase start` and retry. |
| Storage upload returns 403 | Confirm the bucket was created private AND the caller has a valid session cookie. Bucket-level Storage Policies are created implicitly when the bucket is private. |

---

## 8. Dependencies checklist (plan.md § Dependencies)

- [ ] `supabase/config.toml` updated with `[storage.buckets.kudo-images]` — **done in this PR**
- [ ] All 7 migration files applied (local, test, staging)
- [ ] Seed file applied (local + test only)
- [ ] `pg_trgm` extension enabled
- [ ] Private `kudo-images` bucket created on each remote project
- [ ] `.env.local` / CI secrets populated with the 3 Supabase keys + `TEST_AUTH_SECRET`
- [ ] `SUPABASE_SERVICE_ROLE_KEY` NEVER prefixed with `NEXT_PUBLIC_` and NEVER committed to the repo

Once every box here is checked, tasks **T028** and **T030** in `.momorph/specs/ihQ26W78P2-viet-kudo/tasks.md` can be ticked off.
