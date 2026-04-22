# Departments — Manual Import Runbook

**Task**: T109 (Live Board Phase 10, plan Q-A3).
**Owner**: Ops team + HR data provider.
**When to run**: once, before the Live Board ships; repeat only if HR publishes a
new canonical list of department codes.

The `departments` table is the source of truth for the `Phòng ban` filter (B.1.2)
and the recipient-join happy path (`employees.department_id → departments.id`).
The application does **not** auto-create departments — every row must be inserted
manually from the HR-provided master list, so that `sort_order` and the
`parent_id` hierarchy stay meaningful.

---

## 1. Inputs required from HR

HR must provide, in a CSV or spreadsheet:

| Column        | Required | Notes                                                                 |
| ------------- | -------- | --------------------------------------------------------------------- |
| `code`        | yes      | Short opaque code (e.g. `ENG`, `ENG-FE`). Must be unique.             |
| `name`        | yes      | Display name (Vietnamese).                                            |
| `parent_code` | no       | If set, must reference another row in the same file.                  |
| `sort_order`  | no       | Integer. Lower = earlier in the dropdown. Defaults to `100`.          |

Convention: use the `code` that appears on the old free-text `employees.department`
column whenever possible, so the backfill in migration
`202604210901_employees_department_fk.sql` resolves cleanly.

---

## 2. Loading the rows into Postgres

For each row, issue the INSERT below via the Supabase SQL editor (or `psql`
against the staging project first, then prod).

```sql
-- Template — one INSERT per row. Run inside a transaction.
BEGIN;

-- Parent rows first (those with no parent_code):
INSERT INTO departments (code, name, sort_order)
VALUES
  ('ENG',   'Khối Kỹ thuật',   10),
  ('BIZ',   'Khối Kinh doanh', 20),
  ('OPS',   'Vận hành',        30);

-- Then child rows, resolving parent_id by code:
INSERT INTO departments (code, name, parent_id, sort_order)
SELECT 'ENG-FE', 'Phòng Front-end', id, 11
FROM departments WHERE code = 'ENG';

INSERT INTO departments (code, name, parent_id, sort_order)
SELECT 'ENG-BE', 'Phòng Back-end',  id, 12
FROM departments WHERE code = 'ENG';

COMMIT;
```

### Verification queries

```sql
-- 1. Row count matches HR file
SELECT COUNT(*) FROM departments WHERE deleted_at IS NULL;

-- 2. Every child's parent_id resolves
SELECT c.code, c.parent_id
FROM departments c
LEFT JOIN departments p ON p.id = c.parent_id
WHERE c.parent_id IS NOT NULL AND p.id IS NULL;  -- must return 0 rows

-- 3. Sort ordering preview (matches the dropdown order)
SELECT code, name, sort_order
FROM departments
WHERE deleted_at IS NULL
ORDER BY sort_order, code;
```

---

## 3. Wiring the employee backfill

Migration `202604210901_employees_department_fk.sql` already runs a best-effort
backfill (`UPDATE employees SET department_id = d.id FROM departments d WHERE …`).
After departments are loaded, spot-check:

```sql
-- Employees still missing a department_id after migration
SELECT id, full_name
FROM employees
WHERE department_id IS NULL AND deleted_at IS NULL
LIMIT 50;
```

If the count is non-zero, escalate to HR — the department on their legacy record
is unknown to the new canonical list.

---

## 4. Rollback / soft-delete

Do **not** `DELETE FROM departments` — `employees.department_id` carries an FK.
To retire a department, set `deleted_at`:

```sql
UPDATE departments
SET deleted_at = NOW()
WHERE code = 'OLD-DEPT';
```

The `GET /api/departments` handler excludes soft-deleted rows; the affected
employees keep their `department_id` pointer for audit but stop appearing in the
filter.

---

## 5. Release gate

- [ ] HR CSV received and signed off.
- [ ] INSERTs applied to staging; verification queries return the expected counts.
- [ ] Backfill check returns 0 employees missing a department.
- [ ] Same INSERTs re-run against production during the Live Board release window.
- [ ] After deploy, hit `/api/departments` and confirm the response matches the
      sort order expected.
