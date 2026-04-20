-- =============================================================================
-- Seed: Kudos feature test data (feature: Viết Kudo, screen ihQ26W78P2)
-- Generated: 2026-04-20
--
-- Populates:
--   * 20 employees (emails in the pattern <first>.<middle>.<last>@sun-asterisk.com)
--   * 10 Danh hiệu (titles)
--   * 30 hashtags
--
-- Safe to re-run: uses ON CONFLICT on unique indexes.
-- Apply with: `psql "$DATABASE_URL" -f supabase/seed/seed-kudos-test.sql`
--         or: `supabase db execute --file supabase/seed/seed-kudos-test.sql`
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- Employees — 20 fake Sun* staff records
-- -----------------------------------------------------------------------------
INSERT INTO employees (email, full_name, employee_code, department, job_title, is_admin) VALUES
    ('tran.nhat.minh-b@sun-asterisk.com',       'Trần Nhật Minh',         'SA-10001', 'Engineering',   'Senior Software Engineer',  FALSE),
    ('nguyen.thi.an@sun-asterisk.com',        'Nguyễn Thị An',          'SA-10002', 'Engineering',   'Software Engineer',         FALSE),
    ('pham.van.bach@sun-asterisk.com',        'Phạm Văn Bách',          'SA-10003', 'Engineering',   'Senior Software Engineer',  FALSE),
    ('le.minh.chau@sun-asterisk.com',         'Lê Minh Châu',           'SA-10004', 'Design',        'Product Designer',          FALSE),
    ('do.thu.huong@sun-asterisk.com',         'Đỗ Thu Hương',           'SA-10005', 'Product',       'Product Manager',           FALSE),
    ('hoang.anh.dung@sun-asterisk.com',       'Hoàng Anh Dũng',         'SA-10006', 'Engineering',   'Tech Lead',                 FALSE),
    ('vu.thi.lan@sun-asterisk.com',           'Vũ Thị Lan',             'SA-10007', 'Marketing',     'Marketing Specialist',      FALSE),
    ('bui.quang.vinh@sun-asterisk.com',       'Bùi Quang Vinh',         'SA-10008', 'Engineering',   'Backend Engineer',          FALSE),
    ('dang.thuy.linh@sun-asterisk.com',       'Đặng Thuỳ Linh',         'SA-10009', 'Design',        'UX Researcher',             FALSE),
    ('ly.hoang.nam@sun-asterisk.com',         'Lý Hoàng Nam',           'SA-10010', 'Engineering',   'Frontend Engineer',         FALSE),
    ('phan.thi.phuong@sun-asterisk.com',      'Phan Thị Phương',        'SA-10011', 'HR',            'People Operations',         FALSE),
    ('ngo.van.tu@sun-asterisk.com',           'Ngô Văn Tú',             'SA-10012', 'Engineering',   'DevOps Engineer',           FALSE),
    ('trinh.bao.han@sun-asterisk.com',        'Trịnh Bảo Hân',          'SA-10013', 'Product',       'Associate Product Manager', FALSE),
    ('duong.quoc.khanh@sun-asterisk.com',     'Dương Quốc Khánh',       'SA-10014', 'Engineering',   'QA Engineer',               FALSE),
    ('mai.thi.ngoc@sun-asterisk.com',         'Mai Thị Ngọc',           'SA-10015', 'Finance',       'Finance Analyst',           FALSE),
    ('ho.viet.anh@sun-asterisk.com',          'Hồ Việt Anh',            'SA-10016', 'Engineering',   'Staff Engineer',            FALSE),
    ('cao.minh.tuan@sun-asterisk.com',        'Cao Minh Tuấn',          'SA-10017', 'Engineering',   'iOS Engineer',              FALSE),
    ('tran.huy.tung@sun-asterisk.com',        'Trần Huy Tùng',          'SA-10018', 'Engineering',   'Android Engineer',          FALSE),
    -- Admin for seeded titles + future admin-curation paths.
    ('admin.saa@sun-asterisk.com',            'SAA Platform Admin',     'SA-19001', 'Platform',      'Admin',                     TRUE),
    -- Deactivated account, for recipient-exclusion tests.
    ('retired.user@sun-asterisk.com',         'Nguyễn Đã Nghỉ',         'SA-10099', 'Engineering',   'Retired',                   FALSE)
ON CONFLICT DO NOTHING;

-- Soft-delete the retired account (simulates deactivation).
UPDATE employees
SET deleted_at = NOW()
WHERE email = 'retired.user@sun-asterisk.com' AND deleted_at IS NULL;

-- -----------------------------------------------------------------------------
-- Titles (Danh hiệu) — 10 admin-seeded baselines
-- Users can still inline-create more via FR-006a.
-- -----------------------------------------------------------------------------
INSERT INTO titles (slug, name, description, sort_order, created_by)
SELECT v.slug, v.name, v.description, v.sort_order, e.id
FROM employees e,
     (VALUES
        ('nguoi-truyen-dong-luc',      'Người truyền động lực cho tôi',  'Đồng nghiệp luôn tạo năng lượng tích cực và cổ vũ cả team.',  10),
        ('chuyen-gia-giai-quyet',      'Chuyên gia giải quyết vấn đề',    'Người tháo gỡ mọi bài toán khó bằng sự kiên nhẫn và sáng tạo.', 20),
        ('nguoi-thay-tam-huyet',       'Người thầy tâm huyết',            'Luôn sẵn sàng mentoring, chia sẻ kiến thức cho đồng đội.',      30),
        ('dong-doi-dang-tin-cay',      'Đồng đội đáng tin cậy',           'Giao việc gì cũng hoàn thành vượt kỳ vọng.',                   40),
        ('nguoi-lang-nghe-tot',        'Người lắng nghe tốt nhất',        'Luôn có mặt khi đồng đội cần chia sẻ.',                        50),
        ('nguoi-code-sach',            'Người viết code sạch nhất',       'Review PR của bạn ấy luôn là một bài học.',                    60),
        ('nguoi-sang-tao-nhat',        'Người sáng tạo nhất',             'Luôn mang đến những ý tưởng đột phá.',                         70),
        ('ngoi-sao-cua-team',          'Ngôi sao của team',               'Cống hiến thầm lặng mà không thể thiếu.',                      80),
        ('nguoi-cham-chi-nhat',        'Người chăm chỉ nhất',             'Làm việc với 200% năng lượng, truyền cảm hứng cho mọi người.', 90),
        ('nguoi-vui-tinh-nhat',        'Người vui tính nhất team',        'Tiếng cười của team gắn liền với bạn ấy.',                    100)
     ) AS v(slug, name, description, sort_order)
WHERE e.email = 'admin.saa@sun-asterisk.com'
ON CONFLICT DO NOTHING;

-- -----------------------------------------------------------------------------
-- Hashtags — 30 admin-seeded baselines
-- -----------------------------------------------------------------------------
INSERT INTO hashtags (slug, label, usage_count, created_by)
SELECT v.slug, v.label, v.usage_count, e.id
FROM employees e,
     (VALUES
        ('teamwork',            'teamwork',           45),
        ('leadership',          'leadership',         32),
        ('cam_on',              'cam_on',             87),
        ('ghi_nhan',            'ghi_nhan',           61),
        ('sang_tao',            'sang_tao',           28),
        ('mentor',              'mentor',             19),
        ('code_review',         'code_review',        22),
        ('ux_research',         'ux_research',        14),
        ('product_launch',      'product_launch',     11),
        ('bug_bash',            'bug_bash',           17),
        ('oncall_hero',         'oncall_hero',        25),
        ('documentation',       'documentation',      13),
        ('onboarding',          'onboarding',         18),
        ('collaboration',       'collaboration',      40),
        ('problem_solving',     'problem_solving',    33),
        ('data_insight',        'data_insight',        9),
        ('design_thinking',     'design_thinking',    12),
        ('customer_love',       'customer_love',      20),
        ('innovation',          'innovation',         24),
        ('quality',             'quality',            30),
        ('shipit',              'shipit',             38),
        ('above_and_beyond',    'above_and_beyond',   42),
        ('positivity',          'positivity',         29),
        ('growth_mindset',      'growth_mindset',     16),
        ('retro_win',           'retro_win',           7),
        ('saa_2025',            'saa_2025',           55),
        ('root_further',        'root_further',       48),
        ('sunner',              'sunner',             70),
        ('kudos',               'kudos',              92),
        ('phat_trien',          'phat_trien',         36)
     ) AS v(slug, label, usage_count)
WHERE e.email = 'admin.saa@sun-asterisk.com'
ON CONFLICT DO NOTHING;

COMMIT;

-- -----------------------------------------------------------------------------
-- Summary counts (run manually to verify):
--   SELECT COUNT(*) FROM employees WHERE deleted_at IS NULL;      -- expect 19
--   SELECT COUNT(*) FROM employees WHERE deleted_at IS NOT NULL;  -- expect 1
--   SELECT COUNT(*) FROM titles;     -- expect 10
--   SELECT COUNT(*) FROM hashtags;   -- expect 30
-- -----------------------------------------------------------------------------
