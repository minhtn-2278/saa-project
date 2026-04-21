-- =============================================================================
-- Seed: Sun* Kudos Live-board additive data (feature MaZUn5xHXZ)
-- Generated: 2026-04-21
-- Plan: .momorph/specs/MaZUn5xHXZ-sun-kudos-live-board/plan.md § Phase 2 (T013)
--
-- DESIGN GOAL: ADDITIVE + IDEMPOTENT
--
--   This snippet is intended to run **alongside** the existing Viết Kudo seed
--   (`seed-kudos-test.sql`) without touching or re-creating anything it
--   already populated. Specifically:
--
--     * Does NOT TRUNCATE, DELETE, or UPDATE any Viết Kudo rows (employees,
--       titles, hashtags).
--     * Uses natural keys (`code`, `slug`, `email`, composite PKs) with
--       `WHERE NOT EXISTS` / `ON CONFLICT DO NOTHING` guards so every INSERT
--       is safely re-runnable.
--     * Backfills `employees.department_id` only on rows where it is still
--       NULL. Employees that already have `department_id` set are left alone.
--     * Creates `departments` rows whose `code` values MATCH the free-text
--       `employees.department` strings used by the Viết Kudo seed
--       ('Engineering', 'Design', ...) so the FK backfill in step 2 succeeds
--       out of the box. Also seeds the Figma dropdown codes (CEVC1, CEVC2,
--       etc.) for completeness — those will initially have 0 employees but
--       will show up in the Live-board Phòng ban dropdown.
--
-- APPLY ORDER:
--   1) `seed-kudos-test.sql`  (Viết Kudo — existing)
--   2) THIS FILE               (Live board — additive)
--
--   Running this file BEFORE the Viết Kudo seed is safe too (idempotent) but
--   the backfill will only populate `department_id` for employees that exist
--   at the time.
--
-- APPLY COMMAND:
--   `supabase db execute --file supabase/seed/seed-live-board.sql`
--   or `psql "$DATABASE_URL" -f supabase/seed/seed-live-board.sql`
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 1. departments — master data for Phòng ban filter.
--    Two groups:
--      a) Codes that match the existing Viết Kudo `employees.department` text
--         so step 2's FK backfill can resolve every seeded employee.
--      b) Figma dropdown codes (CEVC1..CEVC4, OPDC, STVC, GEU, CTO, SPD)
--         so the Live-board Phòng ban dropdown shows realistic entries even
--         against a fresh test DB.
-- -----------------------------------------------------------------------------
INSERT INTO departments (code, name, sort_order)
SELECT v.code, v.name, v.sort_order
FROM (VALUES
    -- Group (a): mirror Viết Kudo's free-text department values.
    ('Engineering', 'Engineering (legacy mapping)',  1),
    ('Design',      'Design (legacy mapping)',       2),
    ('Product',     'Product (legacy mapping)',      3),
    ('Marketing',   'Marketing (legacy mapping)',    4),
    ('HR',          'HR (legacy mapping)',           5),
    ('Finance',     'Finance (legacy mapping)',      6),
    ('Platform',    'Platform (legacy mapping)',     7),
    -- Group (b): Figma dropdown codes.
    ('CTO',         'Chief Technology Office',      10),
    ('SPD',         'Strategic Product Division',   12),
    ('CEVC1',       'Customer Experience VC 1',     20),
    ('CEVC2',       'Customer Experience VC 2',     21),
    ('CEVC3',       'Customer Experience VC 3',     22),
    ('CEVC4',       'Customer Experience VC 4',     23),
    ('FCOV',        'Finance & Corporate Ops',      30),
    ('OPDC',        'Operations Division',          40),
    ('STVC',        'Strategic Technology VC',      50),
    ('GEU',         'Global Education Unit',        60)
) AS v(code, name, sort_order)
WHERE NOT EXISTS (
    SELECT 1 FROM departments d
     WHERE d.code = v.code AND d.deleted_at IS NULL
);

-- Hierarchy demo row (plan Q-P5 flat display but schema supports it).
INSERT INTO departments (code, name, parent_id, sort_order)
SELECT 'CEVC1 - DSV', 'CEVC1 — Digital Services', p.id, 21
  FROM departments p
 WHERE p.code = 'CEVC1' AND p.deleted_at IS NULL
   AND NOT EXISTS (
       SELECT 1 FROM departments c
        WHERE c.code = 'CEVC1 - DSV' AND c.deleted_at IS NULL
   );

-- Soft-deleted row (exclusion tests — DEPT_LIST_02).
INSERT INTO departments (code, name, sort_order, deleted_at)
SELECT 'LEGACY-OLD', 'Legacy unit — do not show', 999, NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM departments d WHERE d.code = 'LEGACY-OLD' AND d.deleted_at IS NOT NULL
);

-- -----------------------------------------------------------------------------
-- 2. Backfill employees.department_id from the legacy `department` text.
--    Only touches rows where `department_id IS NULL` so running this twice is
--    a no-op, and employees that were set manually retain their values.
-- -----------------------------------------------------------------------------
UPDATE employees e
   SET department_id = d.id
  FROM departments d
 WHERE e.department_id IS NULL
   AND e.department IS NOT NULL
   AND d.code = e.department
   AND d.deleted_at IS NULL;

-- -----------------------------------------------------------------------------
-- 3. Kudos — 12 published + 1 hidden (top hearts, HIGHLIGHT_08 exclusion) +
--            1 anonymous. References the existing 20 Viết Kudo employees via
--            email natural key, so it's safe regardless of their `id` values.
--    Idempotency guard: natural key = (author_id, recipient_id, body_plain).
-- -----------------------------------------------------------------------------
DO $$
DECLARE
    kudo_spec      RECORD;
    author_id_v    BIGINT;
    recipient_id_v BIGINT;
    title_id_v     BIGINT;
    new_kudo_id    BIGINT;
BEGIN
    FOR kudo_spec IN
        SELECT * FROM (VALUES
            -- (seed_marker, author_email, recipient_email, title_slug, body_text, hashtag_slugs, status, hours_ago)
            ('live-seed-01', 'tran.nhat.minh-b@sun-asterisk.com',  'nguyen.thi.an@sun-asterisk.com',     'nguoi-truyen-dong-luc', 'Cảm ơn bạn An đã nhận ca đêm hôm qua, bạn là ngôi sao hậu trường!',            ARRAY['teamwork','cam_on'],             'published',   2),
            ('live-seed-02', 'pham.van.bach@sun-asterisk.com',     'le.minh.chau@sun-asterisk.com',      'nguoi-sang-tao-nhat',    'Thiết kế hệ thống cậu vẽ trong 30 phút vượt xa mong đợi của team.',           ARRAY['sang_tao','design_thinking'],    'published',   4),
            ('live-seed-03', 'do.thu.huong@sun-asterisk.com',      'hoang.anh.dung@sun-asterisk.com',    'dong-doi-dang-tin-cay',  'Cảm ơn Dũng đã cover release buổi demo khi mình bị kẹt meeting.',             ARRAY['teamwork','ghi_nhan'],           'published',   8),
            ('live-seed-04', 'vu.thi.lan@sun-asterisk.com',        'bui.quang.vinh@sun-asterisk.com',    'ngoi-sao-cua-team',      'Tinh thần ship fast của bạn đã kéo toàn bộ sprint về đúng deadline.',         ARRAY['shipit','above_and_beyond'],     'published',  12),
            ('live-seed-05', 'dang.thuy.linh@sun-asterisk.com',    'ly.hoang.nam@sun-asterisk.com',      'nguoi-cham-chi-nhat',    'On-call tuần rồi của bạn là một màn trình diễn của sự kiên trì.',             ARRAY['oncall_hero','cam_on'],          'published',  16),
            ('live-seed-06', 'phan.thi.phuong@sun-asterisk.com',   'ngo.van.tu@sun-asterisk.com',        'nguoi-code-sach',        'Review PR của bạn luôn là một lớp học ngắn gọn và tử tế.',                    ARRAY['code_review','quality'],         'published',  20),
            ('live-seed-07', 'trinh.bao.han@sun-asterisk.com',     'duong.quoc.khanh@sun-asterisk.com',  'nguoi-thay-tam-huyet',   'Buổi 1:1 với bạn giúp mình gỡ được vướng mắc tuần này.',                      ARRAY['mentor','growth_mindset'],       'published',  22),
            ('live-seed-08', 'mai.thi.ngoc@sun-asterisk.com',      'ho.viet.anh@sun-asterisk.com',       'chuyen-gia-giai-quyet',  'Số liệu quarterly bạn dò lại đã cứu cả báo cáo.',                             ARRAY['quality','problem_solving'],     'published',  26),
            ('live-seed-09', 'cao.minh.tuan@sun-asterisk.com',     'tran.huy.tung@sun-asterisk.com',     'nguoi-vui-tinh-nhat',    'Stand-up thứ Hai không có bạn thì team thiếu hẳn một tràng cười.',            ARRAY['positivity','sunner'],           'published',  30),
            ('live-seed-10', 'tran.nhat.minh-b@sun-asterisk.com',  'pham.van.bach@sun-asterisk.com',     'dong-doi-dang-tin-cay',  'Cảm ơn Bách đã đứng ra chủ trì hotfix lúc 2h sáng.',                          ARRAY['oncall_hero','teamwork'],        'published',   3),
            ('live-seed-11', 'nguyen.thi.an@sun-asterisk.com',     'le.minh.chau@sun-asterisk.com',      'nguoi-sang-tao-nhat',    'Prototype Figma của bạn đã giúp cả nhóm hiểu yêu cầu chỉ sau 15 phút.',      ARRAY['design_thinking','innovation'],  'published',   6),
            ('live-seed-12', 'le.minh.chau@sun-asterisk.com',      'dang.thuy.linh@sun-asterisk.com',    'nguoi-lang-nghe-tot',    'Insight người dùng của bạn sắc như dao, cảm ơn bạn!',                         ARRAY['ux_research','customer_love'],   'published',  10),
            -- Hidden kudo — top heart count; HIGHLIGHT_08 exclusion test.
            ('live-seed-hidden-1', 'tran.nhat.minh-b@sun-asterisk.com', 'hoang.anh.dung@sun-asterisk.com', 'nguoi-truyen-dong-luc', '(Hidden by admin — should never appear in public feeds.)',                    ARRAY['kudos','cam_on','teamwork'],     'hidden',     10),
            -- Anonymous kudo — masking test.
            ('live-seed-anon-1', 'tran.nhat.minh-b@sun-asterisk.com', 'trinh.bao.han@sun-asterisk.com',   'ngoi-sao-cua-team',      'Một lời cảm ơn ẩn danh — bạn đã cứu mình khỏi một deadline khó.',             ARRAY['ghi_nhan','cam_on'],             'published',  23)
        ) AS t(seed_marker, author_email, recipient_email, title_slug, body_text, hashtag_slugs, status, hours_ago)
    LOOP
        SELECT id INTO author_id_v    FROM employees WHERE lower(email) = lower(kudo_spec.author_email)    AND deleted_at IS NULL;
        SELECT id INTO recipient_id_v FROM employees WHERE lower(email) = lower(kudo_spec.recipient_email) AND deleted_at IS NULL;
        SELECT id INTO title_id_v     FROM titles    WHERE slug = kudo_spec.title_slug                     AND deleted_at IS NULL;

        IF author_id_v IS NULL OR recipient_id_v IS NULL OR title_id_v IS NULL THEN
            RAISE NOTICE 'Skipping % — missing author/recipient/title (author=%, recipient=%, title=%)',
                kudo_spec.seed_marker, kudo_spec.author_email, kudo_spec.recipient_email, kudo_spec.title_slug;
            CONTINUE;
        END IF;

        -- Idempotency guard: (author_id, recipient_id, body_plain) is unique
        -- enough for seed purposes.
        IF EXISTS (
            SELECT 1 FROM kudos
             WHERE author_id    = author_id_v
               AND recipient_id = recipient_id_v
               AND body_plain   = kudo_spec.body_text
               AND deleted_at IS NULL
        ) THEN
            CONTINUE;
        END IF;

        INSERT INTO kudos (
            author_id, recipient_id, title_id,
            body, body_plain,
            is_anonymous, anonymous_alias,
            status,
            created_at, updated_at
        )
        VALUES (
            author_id_v, recipient_id_v, title_id_v,
            jsonb_build_object(
                'type', 'doc',
                'content', jsonb_build_array(
                    jsonb_build_object(
                        'type', 'paragraph',
                        'content', jsonb_build_array(
                            jsonb_build_object('type', 'text', 'text', kudo_spec.body_text)
                        )
                    )
                )
            ),
            kudo_spec.body_text,
            (kudo_spec.seed_marker = 'live-seed-anon-1'),
            CASE WHEN kudo_spec.seed_marker = 'live-seed-anon-1' THEN 'Thỏ bảy màu' ELSE NULL END,
            kudo_spec.status,
            NOW() - (kudo_spec.hours_ago * INTERVAL '1 hour'),
            NOW() - (kudo_spec.hours_ago * INTERVAL '1 hour')
        )
        RETURNING id INTO new_kudo_id;

        -- Attach hashtags (composite PK makes this idempotent).
        INSERT INTO kudo_hashtags (kudo_id, hashtag_id)
        SELECT new_kudo_id, h.id
          FROM hashtags h
         WHERE h.slug = ANY(kudo_spec.hashtag_slugs)
           AND h.deleted_at IS NULL
        ON CONFLICT DO NOTHING;
    END LOOP;
END
$$;

-- -----------------------------------------------------------------------------
-- 4. kudo_hearts — spread across the newest kudos so HIGHLIGHT ordering has
--    real signal. The hidden kudo gets the TOP heart count so HIGHLIGHT_08
--    exclusion is observably correct. `ON CONFLICT DO NOTHING` on the
--    composite PK (kudo_id, employee_id) keeps this idempotent.
-- -----------------------------------------------------------------------------
DO $$
DECLARE
    k           RECORD;
    liker_email TEXT;
    kudo_id_v   BIGINT;
    liker_id_v  BIGINT;
BEGIN
    FOR k IN
        SELECT * FROM (VALUES
            ('live-seed-01',       ARRAY['pham.van.bach@sun-asterisk.com','le.minh.chau@sun-asterisk.com','do.thu.huong@sun-asterisk.com','hoang.anh.dung@sun-asterisk.com','vu.thi.lan@sun-asterisk.com','bui.quang.vinh@sun-asterisk.com']),
            ('live-seed-02',       ARRAY['tran.nhat.minh-b@sun-asterisk.com','nguyen.thi.an@sun-asterisk.com','ho.viet.anh@sun-asterisk.com','cao.minh.tuan@sun-asterisk.com','tran.huy.tung@sun-asterisk.com','phan.thi.phuong@sun-asterisk.com','ngo.van.tu@sun-asterisk.com']),
            ('live-seed-03',       ARRAY['tran.nhat.minh-b@sun-asterisk.com','nguyen.thi.an@sun-asterisk.com','pham.van.bach@sun-asterisk.com','le.minh.chau@sun-asterisk.com','mai.thi.ngoc@sun-asterisk.com']),
            ('live-seed-04',       ARRAY['tran.nhat.minh-b@sun-asterisk.com','nguyen.thi.an@sun-asterisk.com','pham.van.bach@sun-asterisk.com','dang.thuy.linh@sun-asterisk.com']),
            ('live-seed-05',       ARRAY['tran.nhat.minh-b@sun-asterisk.com','le.minh.chau@sun-asterisk.com','ly.hoang.nam@sun-asterisk.com']),
            -- Hidden kudo takes the TOP count (8) — proves the HIGHLIGHT query
            -- excludes it correctly (SPOTLIGHT and HIGHLIGHT tests).
            ('live-seed-hidden-1', ARRAY['tran.nhat.minh-b@sun-asterisk.com','nguyen.thi.an@sun-asterisk.com','pham.van.bach@sun-asterisk.com','le.minh.chau@sun-asterisk.com','do.thu.huong@sun-asterisk.com','hoang.anh.dung@sun-asterisk.com','vu.thi.lan@sun-asterisk.com','bui.quang.vinh@sun-asterisk.com'])
        ) AS v(seed_marker, liker_emails)
    LOOP
        -- Resolve kudo_id by body_plain prefix (deterministic given step 3).
        SELECT k2.id INTO kudo_id_v
          FROM kudos k2
         WHERE k2.deleted_at IS NULL
           AND (
                (k.seed_marker = 'live-seed-01'       AND k2.body_plain LIKE 'Cảm ơn bạn An đã nhận ca đêm hôm qua%')
             OR (k.seed_marker = 'live-seed-02'       AND k2.body_plain LIKE 'Thiết kế hệ thống cậu vẽ trong 30 phút%')
             OR (k.seed_marker = 'live-seed-03'       AND k2.body_plain LIKE 'Cảm ơn Dũng đã cover release%')
             OR (k.seed_marker = 'live-seed-04'       AND k2.body_plain LIKE 'Tinh thần ship fast của bạn%')
             OR (k.seed_marker = 'live-seed-05'       AND k2.body_plain LIKE 'On-call tuần rồi của bạn%')
             OR (k.seed_marker = 'live-seed-hidden-1' AND k2.body_plain LIKE '(Hidden by admin%')
           )
         LIMIT 1;

        IF kudo_id_v IS NULL THEN
            RAISE NOTICE 'Skipping hearts for % — kudo not found', k.seed_marker;
            CONTINUE;
        END IF;

        FOREACH liker_email IN ARRAY k.liker_emails LOOP
            SELECT id INTO liker_id_v FROM employees WHERE lower(email) = lower(liker_email) AND deleted_at IS NULL;
            IF liker_id_v IS NULL THEN
                CONTINUE;
            END IF;

            INSERT INTO kudo_hearts (kudo_id, employee_id)
            VALUES (kudo_id_v, liker_id_v)
            ON CONFLICT (kudo_id, employee_id) DO NOTHING;
        END LOOP;
    END LOOP;
END
$$;

COMMIT;

-- =============================================================================
-- Verification queries (run manually to inspect):
--
-- -- Departments dropdown list:
-- SELECT id, code, name, parent_id, sort_order FROM departments WHERE deleted_at IS NULL ORDER BY sort_order, code;
--
-- -- Employees keyed by FK:
-- SELECT e.full_name, e.department AS legacy, d.code AS fk FROM employees e
--   LEFT JOIN departments d ON d.id = e.department_id
--  WHERE e.deleted_at IS NULL ORDER BY e.full_name;
--
-- -- Kudos with heart count (confirms ordering):
-- SELECT k.id, e_a.full_name AS sender, e_r.full_name AS recipient, k.status, k.is_anonymous,
--        (SELECT COUNT(*) FROM kudo_hearts h WHERE h.kudo_id = k.id) AS hearts
--   FROM kudos k
--   JOIN employees e_a ON e_a.id = k.author_id
--   JOIN employees e_r ON e_r.id = k.recipient_id
--  WHERE k.deleted_at IS NULL
--  ORDER BY hearts DESC, k.created_at DESC;
-- =============================================================================
