# Supabase migrations

## Live-board migrations — 2026-04-21

Three new non-destructive migrations land with the Sun* Kudos Live board
(feature `MaZUn5xHXZ-sun-kudos-live-board`):

| Order | File | Purpose |
|---|---|---|
| 1 | `202604210900_departments.sql` | Creates the `departments` master table + 3 indexes. |
| 2 | `202604210901_employees_department_fk.sql` | Adds `employees.department_id BIGINT REFERENCES departments(id)`, best-effort backfills from the legacy `department` text column, and creates `idx_employees_department_id_active`. **Does NOT drop** the legacy `department` column yet — a follow-up migration drops it once production has cut over. |
| 3 | `202604210902_kudo_hearts.sql` | Creates the `kudo_hearts` composite-PK table + `idx_kudo_hearts_employee`. |

Every statement is guarded by `IF NOT EXISTS` / no-op equivalents, so re-running is safe.

## Apply steps (local + test Supabase project)

```bash
# 1. Apply all migrations.
supabase db reset          # local dev — destroys data, NOT for shared envs
# or non-destructive:
supabase db push           # applies new migrations against the linked project

# 2. Seed (additive, idempotent — see supabase/seed/).
supabase db execute --file supabase/seed/seed-kudos-test.sql    # Viết Kudo baseline
supabase db execute --file supabase/seed/seed-live-board.sql    # Live-board additions

# 3. Regenerate the TypeScript types for the Supabase JS client.
supabase gen types typescript --linked > types/supabase.ts
```

## Notes

- The Live-board migrations **only add** columns / tables / indexes. No
  existing data is dropped. The legacy `employees.department` text column
  is preserved during the transition; a follow-up migration will drop it
  once production has confirmed every employee has `department_id` set.
- Running `supabase db push` is the preferred flow on shared (dev / staging)
  environments — `supabase db reset` wipes the DB and should only run
  locally.
- The seed files live under `supabase/seed/` (not `supabase/snippets/`) due
  to directory-ownership constraints in the repo — functionally identical,
  just a different path.
