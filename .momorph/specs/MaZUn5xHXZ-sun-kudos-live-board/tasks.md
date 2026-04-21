# Tasks: Sun* Kudos — Live Board

**Frame**: `MaZUn5xHXZ-sun-kudos-live-board`
**Prerequisites**: [spec.md](./spec.md), [plan.md](./plan.md) (rev 6), [design-style.md](./design-style.md), [api-docs.yaml](../../contexts/api-docs.yaml), [BACKEND_API_TESTCASES.md](../../contexts/BACKEND_API_TESTCASES.md), [database-schema.sql](../../contexts/database-schema.sql)

**User stories shipped this release**: US1, US2, US3, US4, US6, US7, US8. **US5 (Copy Link) deferred** per plan Q-A1.

---

## Task Format

```
- [ ] T### [P?] [Story?] Description | file/path.ts
```

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this belongs to (US1, US2, …)
- **|**: File path affected by this task

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Dependencies, constitution amendment, static assets, CSP, i18n scaffolding.

- [x] T001 Open constitution amendment PR adding `@tanstack/react-virtual`, `@use-gesture/react`, `@react-spring/web` to the Approved Libraries table; link to plan.md § Constitution Compliance | .momorph/constitution.md
- [x] T002 Install the three new dependencies: `npm install @tanstack/react-virtual @use-gesture/react @react-spring/web` | package.json
- [x] T003 [P] Export the Figma `KUDOS` wordmark SVG from node `2940:13437` and save it as a static asset | public/assets/kv-kudos-wordmark.svg
- [x] T004 [P] Download / inline new Live-board icons (chevron-left, chevron-right, heart-filled, heart-outline, link, search, pan-zoom, gift, close, arrow-right, pencil) matching the existing `components/ui/icons/` convention | components/ui/icons/
- [x] T005 [P] Extend Tailwind 4 `@theme` tokens in globals.css: `--color-page-bg` #00101A, `--color-surface-dark-1` #00070C, `--color-heart-active` #D4271D, `--color-heart-inactive` #F17676, `--color-overlay-dim` rgba(0,0,0,0.70); confirm existing Viết Kudo tokens (`--color-accent-cream`, `--color-accent-gold`, `--color-border-gold`) are reused | app/globals.css
- [x] T006 [P] Extend CSP `connect-src` in next.config.ts with `wss://<SUPABASE_REF>.supabase.co` for the Spotlight Realtime WebSocket | next.config.ts
- [x] T007 [P] Add `kudos.liveBoard.*` i18n namespace to `messages/vi.json` with all Vietnamese strings from spec + design-style (eyebrow / titles / placeholders / empty states / tooltips); mirror to `en.json` and `ja.json` with `TODO:` markers | messages/vi.json
- [x] T008 [P] Add TS types scaffolding — extend `PublicKudo`, add `LikeResponse`, `MyStatsResponse`, `SpotlightResponse`, `DepartmentListResponse` | types/kudos.ts

---

## Phase 2: Foundation (Blocking Prerequisites)

**Purpose**: Database migrations, shared helpers, skeletons, shared primitives. **⚠️ No user-story work may begin until this phase is complete.**

### Database

- [x] T009 Write migration `202604210900_departments.sql` — creates `departments` table with `code`, `name`, `parent_id` self-FK, `sort_order`, soft-delete; adds the 3 indexes listed in database-schema.sql | supabase/migrations/202604210900_departments.sql
- [x] T010 Write migration `202604210901_employees_department_fk.sql` — adds `department_id BIGINT REFERENCES departments(id)`; best-effort `UPDATE` backfill from legacy `department` text to `department_id` by matching `departments.code`; drops the legacy `department` column; replaces `idx_employees_department_active` with `idx_employees_department_id_active` | supabase/migrations/202604210901_employees_department_fk.sql
- [x] T011 Write migration `202604210902_kudo_hearts.sql` — creates `kudo_hearts` table (composite PK + `idx_kudo_hearts_employee`) | supabase/migrations/202604210902_kudo_hearts.sql
- [x] T012 Run migrations locally + on the test Supabase project: `supabase db reset`; regenerate types: `supabase gen types typescript > types/supabase.ts` | types/supabase.ts
- [x] T013 Create fresh seed snippet: 20+ employees (1 soft-deleted), 10+ titles, 30+ hashtags with varied `usage_count`, 10+ active departments (+1 soft-deleted + 1 with `parent_id`), 30+ published Kudos with hearts spread across them (≥5 kudos with hearts for HIGHLIGHT ordering; ≥1 kudo with top hearts marked `status='hidden'` for HIGHLIGHT_08), 1 anonymous Kudo, 3+ kudos in the last 24h for Spotlight | supabase/snippets/seed-kudos-test.sql

### Coordinated Viết Kudo migration ripple

- [x] T014 Update [serialize-kudo.ts](../../../lib/kudos/serialize-kudo.ts) — add `heartCount`, `heartedByMe`, `canHeart` fields to `PublicKudo`; read department via `employees.department_id → departments.code`; accept optional `{ likedSet: Set<bigint>, callerEmployeeId: bigint }` | lib/kudos/serialize-kudo.ts
- [x] T015 Update [app/api/employees/search/route.ts](../../../app/api/employees/search/route.ts) — JOIN `departments` on `department_id`, alias `departments.code AS department` so response shape is preserved for the Viết Kudo recipient dropdown | app/api/employees/search/route.ts

### Shared library code

- [x] T016 [P] Create Zod schemas for Live-board params: extend `ListKudosParams` with `cursor` (composite tuple encoded as opaque string) + `departmentId`; new `LikeParams` + `HighlightParams` + `HashtagsListParams` (adds `sort`); export types via `z.infer<>` | lib/validations/live-board.ts
- [x] T017 [P] Create cursor codec utility — `encodeCursor({createdAt, id})` + `decodeCursor(str) → {createdAt, id}` (Q-P1 composite tuple) | lib/kudos/cursor.ts
- [x] T018 [P] Create `lib/spotlight/layout.ts` — pure deterministic force-directed packer seeded by `${eventDayIso}:${bucket5min}`; input `{id, name, kudosCount, lastReceivedAt}[]` → output nodes with `x, y ∈ [0, 1]`; export `computeSpotlightLayout(input, seed)` | lib/spotlight/layout.ts
- [x] T019 [P] Create `lib/spotlight/realtime-channel.ts` — thin wrapper `subscribeKudoEvents(supabase, {onInsert, onDelete}) → unsubscribe()` around `supabase.channel('live-kudos').on('postgres_changes', ...)` | lib/spotlight/realtime-channel.ts
- [x] T020 [P] Create shared hook `useAnchoredPosition(ref, open) → { top, left, width }` — captures trigger `getBoundingClientRect()` on open, listens to `resize` + `scroll` to reposition. Matches the pattern already in Viết Kudo's HashtagPicker | lib/hooks/use-anchored-position.ts
- [x] T021 [P] Unit-test the pure utilities — `cursor.spec.ts` (roundtrip), `spotlight-layout.spec.ts` (same seed → same x/y, identity stability across seeds) | tests/unit/kudos/{cursor,spotlight-layout}.spec.ts

### Test-only routes + Suspense skeletons

- [x] T022 [P] Create test-only revalidate handler (same `NODE_ENV==='test'` + `X-Test-Auth` gate as `/_test/sign-in`) — POST `{tags: string[]}` → calls `revalidateTag` for each | app/api/_test/revalidate/route.ts
- [x] T023 [P] Create 4 Suspense skeletons: `HighlightCarouselSkeleton` (3 faded card placeholders), `SpotlightSkeleton` (canvas shape with pulsing gold border), `KudoFeedSkeleton` (props.count cream card placeholders), `SidebarSkeleton` (static rows with shimmer) | components/kudos/LiveBoard/skeletons/

### Shared parts primitives

- [x] T024 [P] Create `SectionHeader` — shared eyebrow + display title (57/700 gold with glow) for B.1 / B.6 / C.1 | components/kudos/LiveBoard/SectionHeader.tsx
- [x] T025 [P] Create `EmptyState` — reusable centered text block for "Hiện tại chưa có Kudos nào." / "Chưa có dữ liệu" / "Chưa có Kudos nào trong 24 giờ qua — hãy là người mở màn!" | components/kudos/LiveBoard/parts/EmptyState.tsx
- [x] T026 [P] Create `ProfileHoverTarget` — wraps children in `<Link href="/profile/{id}" prefetch={false}>` + dispatches `profile:preview:open/close` window events on hover-intent (200 ms) | components/kudos/LiveBoard/parts/ProfileHoverTarget.tsx
- [x] T027 [P] Create `HoaThiTooltip` — FR-015: hover the stars shows "1 hoa thị: nhận 10 Kudos…" / 2 = 20 / 3 = 50 | components/kudos/LiveBoard/parts/HoaThiTooltip.tsx
- [x] T028 [P] Create `AnchoredSingleSelect<T>` — shared dropdown chrome using `useAnchoredPosition`; props `{ items, value, onChange, triggerLabel, width, align? }`; `role="listbox"`, Arrow/Enter/Esc keyboard nav, outside-click close, toggle-off on re-select | components/kudos/LiveBoard/parts/AnchoredSingleSelect.tsx
- [x] T029 [P] Unit-test `AnchoredSingleSelect` — keyboard nav, outside click, toggle-off, portal positioning | tests/unit/kudos/AnchoredSingleSelect.spec.tsx

### LiveBoardClient scaffolding

- [x] T030 Create the filter-state reducer + context: `LiveBoardFilterContext` + types `FilterState = {hashtagId, departmentId, carouselIndex}` + actions (`setHashtag`, `setDepartment`, `resetCarouselIndex`, `nextSlide`, `prevSlide`); URL sync via `useRouter().replace()` | components/kudos/LiveBoard/filter-reducer.ts
- [x] T031 Unit-test the filter reducer — every action + URL serialization round-trip | tests/unit/kudos/filter-reducer.spec.ts

**Checkpoint**: Foundation ready — user stories can start. T014 + T015 land **before** T009–T013 can be deployed to the shared test project.

---

## Phase 3: User Story 1 — Browse the live Kudos feed (Priority: P1) 🎯 MVP

**Goal**: Signed-in user lands on `/kudos`, sees the KV banner + A.1 pill + ALL KUDOS infinite-scroll feed of newest Kudos (10 per page).

**Independent Test**: Sign in, open `/kudos` → KV banner renders with the KUDOS SVG; the feed loads 10 cream-background Kudo cards; scrolling to the bottom appends the next 10. Empty database → `Hiện tại chưa có Kudos nào.`

### Backend (US1) — extend GET /api/kudos

- [x] T032 [US1] Write failing integration tests for cursor + heart fields: KUDO_LIST_11 (cursor pagination), 12 (exhausted — `nextCursor:null`), 13 (cursor wins over page), 14 (invalid cursor → 422), 19 (heart fields present), 20 (`canHeart:false` on own) | tests/integration/kudos/live-board-feed.spec.ts
- [x] T033 [US1] Extend `listKudosParamsSchema` in live-board.ts — add `cursor` (decoded via `decodeCursor`), `departmentId`, `sort` already present | lib/validations/live-board.ts
- [x] T034 [US1] Extend `GET` in app/api/kudos/route.ts — add cursor branch (`WHERE (k.created_at, k.id) < decoded` using tuple comparison), `departmentId` branch (`JOIN employees r ON r.id=k.recipient_id AND r.department_id=$`), heart-field resolution via compact `SELECT kudo_id FROM kudo_hearts WHERE kudo_id = ANY($) AND employee_id = $`; populate `meta.nextCursor` when cursor mode | app/api/kudos/route.ts
- [x] T035 [US1] Run the failing tests → green | tests/integration/kudos/live-board-feed.spec.ts

### Frontend (US1) — primary components

- [x] T036 [P] [US1] Create `KvBanner` — title text (Montserrat 36/700) + `<Image src="/assets/kv-kudos-wordmark.svg">` + A.1 pill (reuse existing [WriteKudoCTA](../../../components/kudos/WriteKudoCTA.tsx)); 1152 × 160 layout per design-style | components/kudos/LiveBoard/KvBanner.tsx
- [x] T037 [P] [US1] Create `HashtagChip` — displays `#Label`, click dispatches `{type:'setHashtag', id}` via `LiveBoardFilterContext` | components/kudos/LiveBoard/parts/HashtagChip.tsx
- [x] T038 [P] [US1] Create `AttachmentGrid` — up to 5 × 80 px square thumbnails via `next/image`, click → lightbox (reuse Viết Kudo's lightbox if any, else inline `<dialog>`) | components/kudos/LiveBoard/parts/AttachmentGrid.tsx
- [x] T039 [P] [US1] Create `CopyLinkButton` — always-disabled shell this release; renders `Copy Link` text link in dimmed styling, `aria-disabled="true"`, no click handler (per plan Q-A1) | components/kudos/LiveBoard/parts/CopyLinkButton.tsx
- [x] T040 [US1] Create `HeartsButton` skeleton for rendering only — count + heart icon + disabled-when-`canHeart=false` styling; **interactive like/un-like added in Phase 6 (US4)** | components/kudos/LiveBoard/parts/HeartsButton.tsx
- [x] T041 [US1] Create `KudoPost` — C.3 card (680 px cream, radius 24, padding 40) wiring: `C.3.1` sender (`ProfileHoverTarget`) → `C.3.2` sent icon → `C.3.3` recipient (`ProfileHoverTarget`) → `C.3.4` time → `C.3.5` content 5-line-clamp → `C.3.6` AttachmentGrid → `C.3.7` HashtagChip list → `C.4` action bar with HeartsButton + CopyLinkButton + disabled `Xem chi tiết` button | components/kudos/LiveBoard/KudoFeed/KudoPost.tsx
- [x] T042 [US1] Create `KudoFeed` — virtualised cursor-paginated list using `@tanstack/react-virtual`; `useKudoFeed({ hashtagId, departmentId })` hook built on `IntersectionObserver` + `fetch('/api/kudos?cursor=…&limit=10')`; empty state via `EmptyState` | components/kudos/LiveBoard/KudoFeed/KudoFeed.tsx
- [x] T043 [US1] Create `useKudoFeed` hook — manages `{pages, nextCursor, isLoading, isEnd}`; exposes `loadMore()` called by the sentinel | components/kudos/LiveBoard/KudoFeed/use-kudo-feed.ts
- [x] T044 [US1] Create `LiveBoardClient` — top-level client island wrapping the filter reducer + provider; initial phase mounts only `KvBanner` + `SectionHeader(C.1)` + `<KudoFeed>`; other blocks added in later phases | components/kudos/LiveBoard/LiveBoardClient.tsx
- [x] T045 [US1] Replace the stub [app/(dashboard)/kudos/page.tsx](../../../app/(dashboard)/kudos/page.tsx) — Server Component with blocking `Promise.all` for `GET /api/hashtags?limit=10&sort=usage` + `GET /api/departments` + 4 streaming `<Suspense>` boundaries; passes initial data to `<LiveBoardClient>` | app/(dashboard)/kudos/page.tsx

### Tests (US1)

- [x] T046 [P] [US1] Unit-test `KudoPost` — renders sender/recipient/time/content/hashtags/attachments; `canHeart=false` disables heart button | tests/unit/kudos/KudoPost.spec.tsx
- [x] T047 [P] [US1] Unit-test `KudoFeed` + `useKudoFeed` — cursor advance, sentinel intersection loads next page, empty state, error toast | tests/unit/kudos/KudoFeed.spec.tsx
- [x] T048 [US1] E2E — `live-board-browse.spec.ts` covering US1 AS#1, #3, #4, #5 (banner + feed renders, scroll appends, empty state) | tests/e2e/kudos/live-board-browse.spec.ts

**Checkpoint**: Browse feed works end-to-end; cards render but most interactive buttons still disabled/placeholder.

---

## Phase 4: User Story 7 — Write a new Kudo from the board (Priority: P1)

**Goal**: Click the A.1 pill → Viết Kudo modal opens (already-shipped `WriteKudoModal`); submit → new Kudo prepends to the feed.

**Independent Test**: Click A.1 → modal opens with empty form. Submit a valid Kudo → modal closes, feed's first card is the new Kudo, sidebar's `Số Kudos bạn đã gửi` increments by 1 (optimistic).

### Frontend (US7)

- [x] T049 [US7] Verify [WriteKudoCTA](../../../components/kudos/WriteKudoCTA.tsx) + [WriteKudoModalMount](../../../components/kudos/WriteKudoModalMount.tsx) are already mounted in the dashboard layout; no new code — just confirm the A.1 pill click triggers the `?write=kudo` URL param flow | components/kudos/WriteKudoCTA.tsx
- [x] T050 [US7] Add optimistic-prepend on modal submit — after `POST /api/kudos` returns 201, dispatch `{type:'prependKudo', kudo}` to `LiveBoardClient` via a window event `kudo:created` (or shared zustand if added); feed reducer handles it | components/kudos/LiveBoard/LiveBoardClient.tsx

### Tests (US7)

- [x] T051 [US7] E2E — `live-board-write-entry.spec.ts` covering US7 AS#1 (pill opens modal) and AS#2 (submitted Kudo visible at top of feed) | tests/e2e/kudos/live-board-write-entry.spec.ts

**Checkpoint**: MVP complete — users can browse + create Kudos end-to-end.

---

## Phase 5: User Story 2 — Filter by Hashtag / Department (Priority: P1)

**Goal**: Filter bar (B.1.1 + B.1.2) + Highlight carousel (basic render) + all hashtag-chip clicks apply filters to BOTH blocks.

**Independent Test**: Click Hashtag dropdown → pick tag → both HIGHLIGHT cards and ALL KUDOS feed re-fetch with that filter. Pick Department → AND-combined. Click same tag again → filter clears.

### Backend (US2)

- [ ] T052 [US2] Write failing tests for `GET /api/kudos/highlight` (HIGHLIGHT_01..12) — top-5 ordering, tie-break, filters, hidden exclusion, anonymous masking, heart fields | tests/integration/kudos/kudos-highlight.spec.ts
- [ ] T053 [US2] Create `app/api/kudos/highlight/route.ts` — one query grouping by kudo with `COUNT(h.*)`, LIMIT 5; resolves caller's heart set; serialises via `serializeKudo`; applies `hashtagId` + `departmentId` filters | app/api/kudos/highlight/route.ts
- [ ] T054 [US2] Run HIGHLIGHT tests → green | tests/integration/kudos/kudos-highlight.spec.ts
- [ ] T055 [US2] Write failing tests for `GET /api/departments` (DEPT_LIST_01..05) — sort order, soft-delete exclusion, hierarchy, empty list, auth | tests/integration/kudos/departments.spec.ts
- [ ] T056 [US2] Create `app/api/departments/route.ts` — `SELECT ... ORDER BY sort_order, code` wrapped in `unstable_cache({revalidate:300, tags:['departments']})` | app/api/departments/route.ts
- [ ] T057 [US2] Run DEPT tests → green | tests/integration/kudos/departments.spec.ts
- [ ] T058 [US2] Extend [app/api/hashtags/route.ts](../../../app/api/hashtags/route.ts) — add `sort: 'usage' | 'recent'` Zod param; when `sort='usage'` → `ORDER BY usage_count DESC, label ASC`; integration test asserts `?limit=10&sort=usage` returns top-10 in the right order | app/api/hashtags/route.ts
- [ ] T059 [US2] Extend `GET /api/kudos` with `departmentId` branch — already added in T034; integration tests KUDO_LIST_15..18 (positive, AND-combined with hashtagId, empty result, non-existent dept) | tests/integration/kudos/live-board-feed.spec.ts

### Frontend (US2)

- [ ] T060 [P] [US2] Create `HighlightCard` — B.3 style (528 × auto, 4 px gold border, radius 16, cream bg, 3-line content clamp); reuses HashtagChip + HeartsButton + disabled CopyLinkButton + disabled `Xem chi tiết` button | components/kudos/LiveBoard/HighlightCarousel/HighlightCard.tsx
- [ ] T061 [US2] Create `HighlightCarousel` — initial version: renders the 5 cards in a row; exactly one centered active (scale 1, opacity 1), neighbours `opacity: 0.5; scale: 0.92; pointer-events: none`; slides only rendered within ±1 of the index. **Nav arrows added in Phase 8 (US3)** | components/kudos/LiveBoard/HighlightCarousel/HighlightCarousel.tsx
- [ ] T062 [US2] Create `FilterBar` — two `<AnchoredSingleSelect>` triggers (Hashtag + Phòng ban) + applied-chip `×` to clear; dispatches `setHashtag` / `setDepartment` actions; syncs to URL | components/kudos/LiveBoard/FilterBar.tsx
- [ ] T063 [US2] Wire `LiveBoardClient` filter reducer — on any `setHashtag`/`setDepartment` action: call `useRouter().replace(…)`, reset `carouselIndex=0`, trigger refetch of both `GET /kudos/highlight?…` and the `useKudoFeed` hook. Empty filter result → hide carousel, feed shows empty state | components/kudos/LiveBoard/LiveBoardClient.tsx
- [ ] T064 [US2] Mount `SectionHeader(B.1)` + `FilterBar` + `HighlightCarousel` into `LiveBoardClient`; add `HashtagChip` click wiring so cards also apply filter | components/kudos/LiveBoard/LiveBoardClient.tsx

### Tests (US2)

- [ ] T065 [P] [US2] Unit-test `FilterBar` — trigger opens dropdown, selection dispatches correct action, toggle-off clears filter, applied-chip × works | tests/unit/kudos/FilterBar.spec.tsx
- [ ] T066 [P] [US2] Unit-test `HighlightCard` — renders title/sender/time/3-line-clamp/chips/heart/disabled-copy | tests/unit/kudos/HighlightCard.spec.tsx
- [ ] T067 [US2] E2E — `live-board-filter.spec.ts` covering US2 AS#1..7 (dropdown open, selection refetches both blocks, toggle-off, Phòng ban dropdown, combined AND empty, chip-click inside card, Esc closes) | tests/e2e/kudos/live-board-filter.spec.ts

**Checkpoint**: Filter + Highlight carousel render + behave correctly on filter change.

---

## Phase 6: User Story 4 — Like (thả tim) a Kudo (Priority: P1)

**Goal**: Click heart on any card → red + count+1 optimistic; server reconciles; un-like toggles back. Author's own card: heart disabled.

**Independent Test**: On a Kudo I did not author, click grey heart → turns red, count increments; click again → reverts. On own Kudo: heart button is disabled.

### Backend (US4)

- [ ] T068 [US4] Write failing tests for `POST /api/kudos/[id]/like` (LIKE_POST_01..11) — first like, idempotent re-like, self-like 403, not-found 404, hidden-kudo 404 (Q-P3 unified), soft-deleted 404, invalid id, auth, race, count accuracy | tests/integration/kudos/kudos-like.spec.ts
- [ ] T069 [US4] Write failing tests for `DELETE /api/kudos/[id]/like` (LIKE_DEL_01..07) — un-like, idempotent no-op, not-found, soft-deleted, auth, count never goes below 0, like→un-like loop | tests/integration/kudos/kudos-like.spec.ts
- [ ] T070 [US4] Create `app/api/kudos/[id]/like/route.ts` exporting both `POST` and `DELETE` handlers — checks `kudos.author_id !== caller.id` (403 SELF_LIKE_FORBIDDEN), 404 for missing/hidden/deleted, `INSERT ON CONFLICT DO NOTHING` / `DELETE` accordingly, returns `{data:{kudoId, heartCount, heartedByMe}}` | app/api/kudos/[id]/like/route.ts
- [ ] T071 [US4] Run LIKE_POST + LIKE_DEL tests → green | tests/integration/kudos/kudos-like.spec.ts

### Frontend (US4)

- [ ] T072 [US4] Extend `HeartsButton` with optimistic logic — local `{count, hearted}` state; click → optimistically toggle → `fetch('POST'|'DELETE' /api/kudos/{id}/like)`; on 2xx set state from `{heartCount, heartedByMe}`; on non-2xx rollback + `toast.error('Không thể thả tim. Vui lòng thử lại.')`; disabled when `canHeart===false` | components/kudos/LiveBoard/parts/HeartsButton.tsx

### Tests (US4)

- [ ] T073 [P] [US4] Unit-test `HeartsButton` — optimistic toggle, rollback on 403/500, disabled on `canHeart=false`, scale animation triggered | tests/unit/kudos/HeartsButton.spec.tsx
- [ ] T074 [US4] E2E — `live-board-like.spec.ts` covering US4 AS#1..4 + self-like disabled + 404-on-hidden soft-remove | tests/e2e/kudos/live-board-like.spec.ts

**Checkpoint**: Heart interactions work across both Highlight and Feed cards.

---

## Phase 7: User Story 6 — Sidebar stats + recent-receivers (Priority: P2)

**Goal**: Right-column sidebar shows 5 stat rows (3 live + 2 hard-zero), a permanently-disabled `Mở quà` button, and an always-empty D.3 list. Mobile: collapses to a bottom-sheet triggered by a floating pill.

**Independent Test**: Open `/kudos` as a signed-in user with Kudos activity → sidebar shows correct counts; `Mở quà` is disabled with `cursor:not-allowed`; D.3 shows `Chưa có dữ liệu`. Shrink to mobile viewport → sidebar disappears, "Thống kê" floating button appears, tap it → bottom-sheet opens.

### Backend (US6)

- [ ] T075 [US6] Write failing tests for `GET /api/me/stats` (STATS_01..07) — live activity, empty caller, anonymous Kudos counted for sender, deleted Kudos excluded, hidden excluded from `heartsReceived`, box counts = 0, auth | tests/integration/kudos/me-stats.spec.ts
- [ ] T076 [US6] Create `app/api/me/stats/route.ts` — 3 parallel queries (`kudosReceived`, `kudosSent`, `heartsReceived`), hard-coded `boxesOpened: 0, boxesUnopened: 0`; returns `MyStatsResponse` | app/api/me/stats/route.ts
- [ ] T077 [US6] Run STATS tests → green | tests/integration/kudos/me-stats.spec.ts

### Frontend (US6) — desktop sidebar

- [ ] T078 [P] [US6] Create `StatsPanel` — 5 stat rows + divider at position 3; reads from `MyStatsResponse`; static Secret Box rows show `0`. Sticky variant (desktop) uses `top-[88px] lg:top-[104px]` per plan § Sidebar | components/kudos/LiveBoard/Sidebar/StatsPanel.tsx
- [ ] T079 [P] [US6] Create `OpenSecretBoxButton` — always-disabled: `disabled` prop hard-wired to `true`; styling from design-style.md § D.1.8 disabled variant (`bg-[#2E3940] text-[#999] cursor-not-allowed`) | components/kudos/LiveBoard/Sidebar/OpenSecretBoxButton.tsx
- [ ] T080 [P] [US6] Create `RecentReceiversList` — always-empty state this release: `<EmptyState>Chưa có dữ liệu</EmptyState>` inside the D.3 container shell (title + frame only) | components/kudos/LiveBoard/Sidebar/RecentReceiversList.tsx
- [ ] T081 [US6] Create `StatsSidebar` — 422 px wide, `self-start sticky top-[88px] lg:top-[104px]`, renders `StatsPanel` + `OpenSecretBoxButton` + `RecentReceiversList` | components/kudos/LiveBoard/Sidebar/StatsSidebar.tsx

### Frontend (US6) — mobile bottom-sheet

- [ ] T082 [P] [US6] Create `MobileStatsBottomSheet` — wraps the same panels in a `<dialog>`-based bottom sheet; dismiss on backdrop / Esc / drag-down | components/kudos/LiveBoard/Sidebar/MobileStatsBottomSheet.tsx
- [ ] T083 [P] [US6] Create `MobileStatsTrigger` — fixed `bottom-4 right-4 md:hidden` pill with gift icon + "Thống kê" label; opens the bottom sheet | components/kudos/LiveBoard/Sidebar/MobileStatsTrigger.tsx
- [ ] T084 [US6] Mount sidebar into `LiveBoardClient` — 2-col grid for C + D on `lg+`, single-col below with mobile pair | components/kudos/LiveBoard/LiveBoardClient.tsx

### Tests (US6)

- [ ] T085 [P] [US6] Unit-test `StatsPanel` + `OpenSecretBoxButton` — rows render correct values, disabled button has `aria-disabled` + `cursor-not-allowed`, no `onClick` handler attached | tests/unit/kudos/StatsPanel.spec.tsx
- [ ] T086 [US6] E2E — assert 5 stat rows + disabled Mở quà + empty D.3 + mobile bottom-sheet opens on click (add to `live-board-browse.spec.ts` as a second `describe` block) | tests/e2e/kudos/live-board-browse.spec.ts

**Checkpoint**: Sidebar renders with correct values on desktop; mobile bottom-sheet opens correctly.

---

## Phase 8: User Story 3 — Navigate the Highlight carousel (Priority: P2)

**Goal**: Left / right arrows + pagination chip `n/N` on the Highlight carousel; ends disabled correctly; reset on filter change.

**Independent Test**: With ≥ 2 highlight Kudos, click right arrow → next card slides to center, chip updates `1/N → 2/N`. At index 0, left arrow is disabled. At index N-1, right arrow is disabled. Change filter → index resets to 0.

### Frontend (US3)

- [ ] T087 [US3] Extend `HighlightCarousel` from Phase 5: add `B.5.1` + `B.5.3` chevron arrow buttons (48×48 round, bg `rgba(255,234,158,0.10)`, border gold); wire to reducer actions `prevSlide` / `nextSlide`; `aria-disabled` + icon 30% opacity at ends | components/kudos/LiveBoard/HighlightCarousel/HighlightCarousel.tsx
- [ ] T088 [US3] Create `SlidePagination` — B.5.2 chip rendering `{current+1}/{total}` at `--text-h3` with `--color-text-secondary` | components/kudos/LiveBoard/HighlightCarousel/SlidePagination.tsx
- [ ] T089 [US3] Verify filter change still resets `carouselIndex=0` (already in reducer per T063) + the slide animation is 300 ms ease-out per design-style | components/kudos/LiveBoard/filter-reducer.ts

### Tests (US3)

- [ ] T090 [P] [US3] Unit-test `HighlightCarousel` — arrow disables at ends, pagination text correct, click advances index, filter change resets | tests/unit/kudos/HighlightCarousel.spec.tsx
- [ ] T091 [US3] E2E — `live-board-carousel.spec.ts` covering US3 AS#1..5 (disabled at ends, arrow advances, fewer than 5 cards pagination, filter reset) | tests/e2e/kudos/live-board-carousel.spec.ts

**Checkpoint**: Carousel navigation complete.

---

## Phase 9: User Story 8 — Spotlight board with live updates (Priority: P2)

**Goal**: Render B.7 canvas with top-20 recipients of the last 24h + live `{N} KUDOS` total + animated recent-receivers log inside the canvas. New Kudos from other users appear in ≤ 2 s on the count label + log (not on the canvas — canvas redraws every 5 min).

**Independent Test**: Open `/kudos` in Browser A. From Browser B, publish a new Kudo. In A within 2 s: the `N KUDOS` label in B.7 increments by 1; the "người vừa nhận Kudo" log inside the canvas appends the new recipient's name.

### Backend (US8)

- [ ] T092 [US8] Write failing tests for `GET /api/spotlight` (SPOTLIGHT_01..14) — cold cache, warm cache, ETag/304, 5-min bucket rollover, quiet window empty, anonymous recipient shows real name, node identity stable, hidden excluded, top-20 boundary, fewer-than-20, all-tied ordering, deleted-employee exclusion, window rollover, public edge cache | tests/integration/kudos/spotlight.spec.ts
- [ ] T093 [US8] Create `app/api/spotlight/route.ts` — executes the top-20/24h aggregate query + event-wide `total` count; pipes through `lib/spotlight/layout.ts` (seeded `${eventDayIso}:${bucket5min}`); wraps in `unstable_cache({revalidate:300, tags:['spotlight']})`; emits `Cache-Control: public, max-age=300, s-maxage=300` + `ETag` hash; handles `If-None-Match` → 304 | app/api/spotlight/route.ts
- [ ] T094 [US8] Run SPOTLIGHT tests → green (integration tests `beforeEach` call `/_test/revalidate` with `['spotlight']` to clear cache between runs) | tests/integration/kudos/spotlight.spec.ts

### Frontend (US8)

- [ ] T095 [P] [US8] Create `SpotlightCanvas` — pure-render component given `{nodes, hoveredId, highlightQuery}`; absolute-positioned name nodes with CSS `transform: translate(x%, y%)`, 500 ms ease-out transition on redraw; optional avatar thumbnail + name label; tooltip on hover | components/kudos/LiveBoard/SpotlightBoard/SpotlightCanvas.tsx
- [ ] T096 [P] [US8] Create `SpotlightSearch` — B.7.3 input (max 100 chars); dispatches `highlightQuery` state to parent; Enter recentres canvas on first match | components/kudos/LiveBoard/SpotlightBoard/SpotlightSearch.tsx
- [ ] T097 [P] [US8] Create `SpotlightPanZoom` — wrapper using `@use-gesture/react` + `@react-spring/web` for pan drag + pinch zoom + toggle mode via B.7.2 icon button | components/kudos/LiveBoard/SpotlightBoard/SpotlightPanZoom.tsx
- [ ] T098 [P] [US8] Create `RecentReceiverLog` — animated vertical list inside canvas (280 × 160 with top-fade mask); accepts events from parent; entry fade-in 300 ms + shift older rows down | components/kudos/LiveBoard/SpotlightBoard/RecentReceiverLog.tsx
- [ ] T099 [US8] Create `SpotlightBoard` — top-level island: reads initial `SpotlightResponse` props; subscribes via `subscribeKudoEvents(supabase, …)` (debounced 500 ms for total, immediate append for log); 5-min `setInterval` re-fetches `/api/spotlight` with current ETag; on `layoutVersion` change animates redraw; renders B.6 header + B.7.1 total label + search + pan-zoom + canvas + log | components/kudos/LiveBoard/SpotlightBoard/SpotlightBoard.tsx
- [ ] T100 [US8] Mount `SectionHeader(B.6) + SpotlightBoard` into `LiveBoardClient` between Highlight row and ALL KUDOS row | components/kudos/LiveBoard/LiveBoardClient.tsx

### Tests (US8)

- [ ] T101 [P] [US8] Unit-test `SpotlightBoard` with mocked realtime channel — debounced total updates, reconnect indicator, quiet-window empty state, layoutVersion-change animation | tests/unit/kudos/SpotlightBoard.spec.tsx
- [ ] T102 [US8] E2E — `live-board-spotlight-realtime.spec.ts` (two-browser flow via `browser.newContext()` — A subscribes, B publishes, A's count increments within 2 s + log appends) | tests/e2e/kudos/live-board-spotlight-realtime.spec.ts

**Checkpoint**: Full Live board is feature-complete; all 7 active user stories ship.

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: Accessibility, responsive pass, performance, security.

- [ ] T103 [P] Responsive pass — run Playwright on 3 viewports (375, 768, 1440); adjust KvBanner width-scaling, HighlightCarousel 1-up on mobile, SpotlightBoard height scaling, FilterBar stack vertically on mobile | components/kudos/LiveBoard/
- [ ] T104 [P] Accessibility audit — run `@axe-core/playwright` on `/kudos` at each viewport; assert 0 serious violations. Manual keyboard walk: Tab through everything, Arrows in dropdowns/carousel, Esc closes dropdowns | tests/e2e/kudos/live-board-a11y.spec.ts
- [ ] T105 [P] Performance verification — Lighthouse mobile-3G run: LCP ≤ 2.5 s (SC-006), CLS < 0.1, heart click → red ≤ 150 ms (SC-003), filter refetch p75 ≤ 600 ms (SC-005), Spotlight live latency ≤ 2 s (SC-007) | tests/e2e/kudos/live-board-perf.spec.ts
- [ ] T106 [P] Security audit — verify CSP `connect-src` includes `wss://` for Supabase Realtime; confirm the `kudo_hearts` write path always checks `author_id !== caller.id` server-side (LIKE_POST_03 regression test); audit Spotlight Realtime channel payload for PII (per Q-P7 resolution: no action needed, just confirm) | next.config.ts
- [ ] T107 [P] Observability — add `console.error` with correlation ids on Spotlight cache miss + Realtime reconnect failures; wire to the existing Next.js server log | components/kudos/LiveBoard/SpotlightBoard/SpotlightBoard.tsx
- [ ] T108 [P] Dead-code scan — verify no unused imports, all skeleton components are actually mounted, test files cover every exported function | components/kudos/LiveBoard/
- [ ] T109 Backfill manual department import runbook — ops document with the exact `INSERT` template + the full list of codes from HR (Q-A3 resolution) | ops/runbooks/departments-import.md
- [ ] T110 File follow-up security task (separate ticket) — ship `lib/auth/csrf.ts` that validates `Origin` / `Sec-Fetch-Site` on ALL mutating handlers (retrofits Viết Kudo's `POST /api/kudos` + this feature's `POST|DELETE /api/kudos/[id]/like`) | ops/backlog/csrf-hardening.md

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately.
- **Phase 2 (Foundation)**: Depends on Phase 1. **Blocks all user stories.** T014 + T015 must land before T009–T013 are applied to the shared test project (the recipient-dropdown read-site update keeps Viết Kudo green across the migration).
- **Phase 3 (US1)**: Depends on Phase 2 complete. This is the MVP.
- **Phase 4 (US7)**: Depends on Phase 3 (needs `LiveBoardClient` shell + `KvBanner`).
- **Phase 5 (US2)**: Depends on Phase 3 (needs `KudoFeed`); adds `HighlightCarousel` basic + `FilterBar`.
- **Phase 6 (US4)**: Depends on Phase 3 + 5 (needs `KudoPost` + `HighlightCard` mounted so hearts have homes).
- **Phase 7 (US6)**: Depends on Phase 2 only — parallelizable with Phase 5 + 6 once Phase 3 ships.
- **Phase 8 (US3)**: Depends on Phase 5 (extends `HighlightCarousel`).
- **Phase 9 (US8)**: Depends on Phase 2 only — parallelizable with Phases 5–8 once Phase 3 ships.
- **Phase 10 (Polish)**: Depends on all active stories complete.

### Within Each User Story

- Failing integration tests first (TDD — constitution § III NON-NEGOTIABLE).
- Route Handlers before frontend components.
- Shared primitives (Phase 2) before story-specific components.
- Component tests before the E2E for that story.

### Parallel Opportunities

- **Within Phase 1**: T003–T008 are all `[P]` (6 parallel tasks).
- **Within Phase 2**: T016–T031 have many `[P]` branches — Zod schemas, layout util, realtime wrapper, `useAnchoredPosition`, every skeleton, every shared primitive. Only T014/T015 (Viết Kudo ripple) need coordination with T010.
- **Across stories after Phase 3**: US2 (Phase 5), US6 (Phase 7), US8 (Phase 9) can run in parallel by different contributors. US4 (Phase 6) waits for US2's cards to host the hearts. US3 (Phase 8) waits for US2's carousel.
- **Within each story**: Tests `[P]` run in parallel with component development once the handler is green.

---

## Implementation Strategy

### MVP First (recommended)

1. Complete Phase 1 + Phase 2.
2. Complete Phase 3 (US1 Browse).
3. Complete Phase 4 (US7 Write entry — tiny; together with US1 this is the MVP).
4. **STOP and VALIDATE**: Sign in → `/kudos` → browse feed → submit Kudo → card appears. Deploy to staging.
5. Gather feedback, then continue.

### Incremental delivery (after MVP)

6. Phase 5 (US2 Filter) → test → deploy.
7. Phase 6 (US4 Like) → test → deploy.
8. Phase 7 (US6 Sidebar) → test → deploy — parallelizable with 5/6.
9. Phase 8 (US3 Carousel) → test → deploy — runs after 5.
10. Phase 9 (US8 Spotlight) → test → deploy — parallelizable with 5/6/7.
11. Phase 10 (Polish) → final launch gate.

### Pre-launch blocker gates

- [ ] Manual `departments` import (ops-owned task — T109).
- [ ] `KUDOS` wordmark SVG exported (designer task — T003).
- [ ] Supabase Realtime enabled on the `kudos` table (Supabase dashboard toggle).
- [ ] All Phase 10 audits green.

---

## Notes

- Commit after each task or logical group; tag commits with `[T###]`.
- Mark tasks complete as you go: `- [x] T###`.
- Failing tests go **first** per constitution § III. If an integration test can't fail for structural reasons, at least write it before the impl and assert it was RED in the PR description.
- If a task reveals spec drift, **stop and update spec.md** (and re-run `/momorph.reviewspecify`) rather than silently reinterpret.
- US5 (Copy Link) and the Secret Box / Bonus-day / Kudo detail features stay deferred. Their components render as disabled shells so re-enabling is a flag flip in a future release.
