# Implementation Plan: Sun* Kudos — Live Board

**Frame**: `MaZUn5xHXZ-sun-kudos-live-board`
**Date**: 2026-04-21
**Spec**: [spec.md](./spec.md)
**Design**: [design-style.md](./design-style.md)
**API Contract**: [../../contexts/api-docs.yaml](../../contexts/api-docs.yaml)
**API Tests**: [../../contexts/BACKEND_API_TESTCASES.md](../../contexts/BACKEND_API_TESTCASES.md)
**DB Schema**: [../../contexts/database-schema.sql](../../contexts/database-schema.sql)
**Builds on**: [Viết Kudo plan](../ihQ26W78P2-viet-kudo/plan.md) (shipped 2026-04-20) — reuses `lib/supabase/*`, `lib/auth/current-employee.ts`, `lib/kudos/{serialize-kudo,sanitize-body,hashtag-slug,api-responses}`, `POST /api/kudos`, and the `WriteKudoModal` island.

---

## Summary

Replace the Kudos route's placeholder stub at [app/(dashboard)/kudos/page.tsx](../../../app/(dashboard)/kudos/page.tsx) with the full pixel-accurate **Live board**: 4-row layout (A KV banner → B HIGHLIGHT KUDOS → B.6/B.7 SPOTLIGHT → C ALL KUDOS + D sidebar), filterable by hashtag + department, likeable, cursor-paginated, and partially realtime (Spotlight only). Ship 6 new Route Handlers (`GET /kudos/highlight`, `POST|DELETE /kudos/{id}/like`, `GET /departments`, `GET /me/stats`, `GET /spotlight`), extend `GET /kudos` with cursor + `departmentId`, and add 3 DB migrations (`departments`, `employees.department_id` FK, `kudo_hearts`).

**Primary technical approach**: the existing feature folders stay intact — we add `components/kudos/LiveBoard/` (one sub-component per Figma block) and `app/api/kudos/highlight|[id]/like`, `app/api/departments|me/stats|spotlight`. Realtime is scoped to the Spotlight island only and uses the Supabase JS client's Realtime channel on the `kudos` table. TDD: every FR ships with the BACKEND_API_TESTCASES.md row(s) red-first; P1 stories (US1 Browse, US2 Filter, US4 Like, US7 Write-entry) gain Playwright. The `Mở quà` CTA, `D.3` list, `Xem chi tiết`, and `Copy Link` buttons all render in their deferred / always-disabled states — no `secret_boxes` table, no `/kudos/[id]` detail page, and no clipboard handler this release. The `KUDOS` wordmark in the banner is a Figma-exported SVG at `public/assets/kv-kudos-wordmark.svg`.

---

## Technical Context

**Language/Framework**: TypeScript 5 (strict) / Next.js 16 (App Router) / React 19
**Primary Dependencies** *(already installed by Viết Kudo)*: `@supabase/ssr` + `@supabase/supabase-js`, `zod`, `next-intl`, Tailwind 4, `sanitize-html`, Tiptap (used by WriteKudoModal; not needed on the board itself), **`sonner ^2.0.7`** (toast — reuse directly), **`@axe-core/playwright ^4.11.2`** (E2E a11y gate — reuse directly), **`@playwright/test ^1.59.1`** (E2E runner — already in use).

**New dependencies (to add)**:

| Package | Purpose | Notes |
|---|---|---|
| `@tanstack/react-virtual` | Virtualise the ALL KUDOS infinite-scroll feed (C.2) — keeps DOM node count bounded as users scroll past hundreds of Kudos | Constitution amendment: 1 entry alongside Tiptap/sanitize-html/radix/sonner |
| `@use-gesture/react` + `@react-spring/web` *(optional, see Q-P2)* | Pan / pinch-zoom on the Spotlight canvas (B.7). Hand-rolling is feasible but gestures + inertia = many edge-cases | Deferred — decision in task phase |

No new DB library; Supabase Realtime ships with `@supabase/supabase-js`.

**Database**: Supabase Postgres. New migrations:
- `departments` (master data, HR-synced)
- `employees.department_id` FK + drop legacy `department VARCHAR`
- `kudo_hearts` (composite PK `(kudo_id, employee_id)`)

**Storage**: no new buckets. KUDOS wordmark ships in `public/assets/` as a static asset.

**Testing**: existing Vitest + Testing Library + Playwright pipelines. New integration tests against the real Supabase test project for every handler.

**State Management**: page-local — no global store. Filter state + current carousel index live in a `useReducer` that lifts to the page-level client island (`LiveBoardClient.tsx`); heart optimistic state lives on each `KudoPost` component; Spotlight realtime buffer lives inside `SpotlightBoard.tsx`. URL search params (`?hashtagId=...&departmentId=...`) mirror the filter state so filters survive refresh + deep-link.

**API Style**: REST via Route Handlers + one Supabase Realtime channel subscription (`kudos` INSERT/DELETE) scoped to the Spotlight island only.

---

## Constitution Compliance Check

*GATE: Must pass before implementation begins.*

| Principle | Rule | Status |
|---|---|---|
| **I. Clean Code** | Feature-based structure, kebab-case files, PascalCase components, files ≤ 300 lines | ✅ One sub-component per Figma block under `components/kudos/LiveBoard/` + per-endpoint Route Handlers |
| **II. Tech Stack** | Server Component by default, `"use client"` only where interactive | ✅ Server Component shell fetches initial feed + highlight + departments + hashtags + me/stats in parallel; client islands = `HighlightCarousel`, `FilterBar`, `HeartsButton`, `SpotlightBoard`, `KudoFeed` (virtualised + cursor) |
| | `next/image`, `next/link` | ✅ KV wordmark served via `next/image` from `public/assets/kv-kudos-wordmark.svg`; all avatars/attachments via `next/image`; avatar/name click navigation via `next/link` |
| | Route Handlers validate all inputs with Zod | ✅ `lib/validations/live-board.ts` adds schemas for cursor, departmentId, like params |
| | Tailwind utilities only | ✅ Design-style.md § Implementation Mapping uses Tailwind classes exclusively |
| | Authenticated Supabase client; no service-role in this feature | ✅ All 6 new handlers use `createClient()` + `getCurrentEmployee()` — self-like enforcement is an application check before `INSERT` into `kudo_hearts` |
| **III. Test-First (NON-NEGOTIABLE)** | Red-Green-Refactor; failing tests before impl | ✅ Phase Breakdown interleaves BACKEND_API_TESTCASES.md rows (HIGHLIGHT_*, LIKE_POST_*, LIKE_DEL_*, DEPT_LIST_*, STATS_*, SPOTLIGHT_*) as red before each handler |
| | Integration tests hit real Supabase test project | ✅ Same strategy as Viết Kudo (truncate + reseed in `beforeEach`) |
| **IV. Security (OWASP)** | Input validation, no XSS, HTTP-only cookies, CSP | ✅ Heart / like endpoints are tiny and id-bound; the existing CSP (Viết Kudo) covers the new Supabase Realtime WebSocket — need to add `wss://<ref>.supabase.co` to `connect-src`. Server-enforced self-like rule = "author cannot self-like" (TR-002). |
| **V. Responsive & A11y** | Mobile-first, WCAG 2.1 AA, 44 px touch targets, Core Web Vitals | ✅ Design-style.md § Responsive specifies breakpoints; axe-core E2E gate |

**Violations**: *none* that aren't already approved by the Viết Kudo constitution amendment. Adding `@tanstack/react-virtual` requires a 1-line amendment to the Approved Libraries table — justification below.

| New library | Justification | Alternative rejected |
|---|---|---|
| `@tanstack/react-virtual` | ALL KUDOS feed is cursor-paginated and can grow to hundreds of items in-session. Without virtualisation, every image card (680 × 749 px with up to 5 thumbnails) stays mounted and LCP/CLS regress after ~50 cards | Hand-rolled windowing — reinvents proven logic; intersection-only infinite scroll without windowing — still mounts every card |
| `@use-gesture/react` + `@react-spring/web` *(pending Q-P2)* | Pan/pinch on B.7 Spotlight. Hand-rolling gestures + inertia is ~200 LOC and touchy on Safari | Pure-CSS zoom — no inertia, no pinch; hand-rolled pointer handlers — significantly more code, more edge cases |
| `@axe-core/playwright` | Automated WCAG 2.1 AA gate in E2E per constitution § Responsive & A11y | Manual axe browser extension — not reproducible in CI |

---

## Out-of-scope boundaries (explicit)

The plan does NOT create these, even though they are visible in the design or referenced by the spec:

| Referenced by | Item | Why out of scope | How this plan handles it |
|---|---|---|---|
| Spec FR-014 + Navigation Flow + design-style.md | **Profile preview popover (Figma `721:5827`)** | Listed in spec Out of Scope — component owned by the Profile feature | Plan wires only the **trigger** (hover/click on avatar + name) to dispatch a `profile:preview:open` event and a `<Link>` to `/profile/{employeeId}`; the popover component itself is consumed from the Profile feature once it ships. In the interim the hover is a no-op and click navigates. |
| Spec Navigation Flow + Spec US5 + FR-007 + TR-004 | **Kudo detail page `/kudos/[id]` + "Xem chi tiết" button + "Copy Link" button** | **Resolved Q-A1**: product chose to temporarily disable both buttons this release. No detail page created, no clipboard handler wired. | `HighlightCard.tsx` renders `<button disabled>Xem chi tiết</button>` (styling = design-style.md's disabled state: reduced opacity, `cursor: not-allowed`, no click handler, no hover transition). `KudoPost.tsx` card click is a no-op (`onClick` absent). `<CopyLinkButton>` **always** renders disabled (never attaches a click handler, shows the dimmed variant, no toast plumbing). **US5 moves to Out-of-Scope for this release.** US4 AS#1 still holds (heart works); US4 AS#5 / FR-007 / US5 AS#1-2 all defer. Component files stay in the project structure as thin disabled shells so the future "enable both" patch is a 1-line flag flip. |
| Spec US6 FR-008 / FR-009 | **Secret Box open flow + D.3 population** | Feature deferred per spec Out of Scope | `OpenSecretBoxButton` always disabled; `RecentReceiversList` always empty state; `/api/me/stats` hard-codes box counts to 0; `secret_boxes` table not migrated |
| Spec FR-006 (reserved) | **Bonus-day hearts** | Feature deferred per spec Out of Scope | Each like = 1 heart; no `bonus_days` table; no `bonus` column on `kudo_hearts` |
| Spec § Visual Requirements → Mobile | **Shared `<AppFooter />`** | Owned by the dashboard layout — **already mounted** at `app/(dashboard)/layout.tsx` (imports `@/components/shared/AppFooter`) | No action needed |

---

## Architecture Decisions

### Frontend

- **Component structure**: one `components/kudos/LiveBoard/` folder, one file per Figma block. Sub-folders for `HighlightCarousel/`, `SpotlightBoard/`, `KudoPost/`, and `parts/` (shared primitives — `AnchoredSingleSelect`, `HeartsButton`, `CopyLinkButton`, `SectionHeader`, `EmptyState`, `AvatarStack`, `HoaThiTooltip`). Each file aligns 1:1 with an entry in [design-style.md § Implementation Mapping](./design-style.md#implementation-mapping).
- **Page composition** — `app/(dashboard)/kudos/page.tsx` stays a **Server Component** with **streamed Suspense boundaries** so each block resolves independently (edge case: "each block MUST show its own skeleton"):
  - Top-level: 2 boundaries only (`<LiveBoardHeader>` — the filters live here with blocking data / `<LiveBoardBody>` — everything below). Inside `<LiveBoardBody>`:
    - `<Suspense fallback={<HighlightCarouselSkeleton />}>` → server-awaits `GET /api/kudos/highlight` (3 faded card placeholders).
    - `<Suspense fallback={<SpotlightSkeleton />}>` → server-awaits `GET /api/spotlight` (canvas shape with pulsing border).
    - `<Suspense fallback={<KudoFeedSkeleton count={3} />}>` → server-awaits `GET /api/kudos?limit=10` (3 cream card placeholders).
    - `<Suspense fallback={<SidebarSkeleton />}>` → server-awaits `GET /api/me/stats` (static rows with shimmer).
  - **Blocking** pre-fetch for the header: `GET /api/hashtags?limit=10&sort=usage` (top 10 most-used — Q-A2 resolution) + `GET /api/departments` (small, always-cached, needed for filter triggers to render immediately). Uses `Promise.all` at the page level.
  - All slow fetches stream in via Suspense — the page's LCP is the KV banner (Phase 2 target SC-006 ≤ 2.5 s p75).
  - One client island `<LiveBoardClient>` owns the filter reducer + re-fetches on filter change. Initial props: `{ initialFeed, initialHighlight, initialSpotlight, hashtags, departments, meStats }`.
  - Why one big island instead of per-block: the filter state controls both the Highlight carousel **and** the feed, so they must share state. Splitting would require a context provider anyway. One island keeps data flow flat.
- **Filter state → URL mirror**: `?hashtagId=<id>&departmentId=<id>` managed via `useRouter().replace()` without reload — survives refresh and deep-link. Initial Server Component reads the URL params for the first render (TR-001: no hydration flash).
- **Cursor-based feed (US1, US2, FR-003)**: `useKudoFeed({ hashtagId, departmentId })` hook built on `IntersectionObserver` + `fetch` — keeps one page of 10 items at a time in state, stores all pages in a `useRef` list, advances via `meta.nextCursor`. Wrapped in `@tanstack/react-virtual` with 900 px estimated row height.
- **Highlight carousel (US3, FR-002)**: transform-based 3-up slider. State = `{ slides: Kudo[5], index: 0..N-1 }`. Next/prev buttons update index; center card is the only `pointer-events: auto` node; neighbours `opacity: 0.5; scale: 0.92; pointer-events: none;`. Filter change → replace `slides` and reset `index=0` in a single reducer action. No external carousel library.
- **Heart button (US4, FR-005, FR-006 reserved, SC-003)**: optimistic UI. `HeartsButton` maintains local `{count, hearted}` state initialised from props; click → optimistically toggles → `fetch('/api/kudos/{id}/like', { method: POST|DELETE })`. On 2xx, sets the server-reported `{heartCount, heartedByMe}` (idempotent reconciliation). On non-2xx, rolls back + toast "Không thể thả tim. Vui lòng thử lại.". Disabled when `canHeart === false` (server-computed = author check).
- **Copy link (US5, FR-007) — DEFERRED (Q-A1)**: `<CopyLinkButton>` renders but is **always disabled** this release (no click handler, dimmed styling per design-style.md disabled state). When the `/kudos/[id]` detail page ships in a future release, a 1-line change re-enables clicks to run `navigator.clipboard.writeText(origin + '/kudos/' + id)` + toast. The sonner toast primitive stays wired for the heart-error path only.
- **Dropdown components (US2)**: one shared `AnchoredSingleSelect<T>` primitive in `components/kudos/LiveBoard/parts/`. Props: `{ items, value, onChange, triggerLabel, width }`. Used by both Hashtag and Department filter triggers. Panel is rendered via React portal with **manually-positioned absolute placement** — same hand-rolled pattern used by [`components/kudos/WriteKudoModal/HashtagPicker.tsx`](../../../components/kudos/WriteKudoModal/HashtagPicker.tsx) (captures the trigger's `getBoundingClientRect()` on open, positions the panel below, listens for `resize`/`scroll` to reposition). **No `floating-ui` or `@radix-ui/react-popover` dependency** — neither is installed, and the Viết Kudo mention popover demonstrates the hand-rolled pattern is viable. Keyboard nav (arrow keys, Enter, Esc), `role="listbox"` + `aria-selected`. Extract the position-sync logic into a shared `useAnchoredPosition` hook to avoid duplication between this and the Viết Kudo pickers (refactor-worthy; make the shared hook the single source of truth).
- **Spotlight (US8, TR-005, FR-010)** — the only island with its own realtime channel:
  - On mount, reads the initial `SpotlightResponse` from props (from the Server Component's `/api/spotlight`).
  - Subscribes to Supabase Realtime channel `public:kudos` filtering `event IN (INSERT, DELETE)`. **Realtime updates only**: (a) the `B.7.1` total count label (debounced to ≤ 1 tick / 500 ms per spec edge case), and (b) the "recent-receivers log" inside the canvas. **Canvas nodes are NOT modified between 5-min polls** — the top-20/24h aggregate is too expensive to recompute client-side, and drifting nodes mid-session would be jarring.
  - 5-min polling timer (`setInterval(5 * 60 * 1000)`) re-fetches `GET /api/spotlight`. If `layoutVersion` changes → smooth redraw: existing `employee_id`s transition to new x/y with a 500 ms ease-out; members that dropped out of the top-20 fade out (opacity 1→0, 300 ms); new members fade in. Else discard.
  - Pan/zoom via `@use-gesture/react` + `@react-spring/web` (Q-P2 resolved: install). Search input highlights matching nodes via CSS class toggle.
  - Node click → `<Link href="/profile/{employeeId}">`. Hover tooltip: `{name} — {kudosCount} Kudos nhận trong 24h qua`.
  - Empty state: when the last-24h query returns zero rows (nobody received a Kudo recently), the canvas renders "Chưa có Kudos nào trong 24 giờ qua — hãy là người mở màn!" centered, with the total `N KUDOS` label still visible above (showing the event-wide count).
- **Sidebar (US6)** — `StatsSidebar` is sticky (`self-start` + `position: sticky`) inside C's 2-column row. **Sticky top offset must clear the fixed app header**: the dashboard layout ([app/(dashboard)/layout.tsx](../../../app/(dashboard)/layout.tsx)) applies `pt-16 lg:pt-20` to `<main>` (64 px header, 80 px at `lg`+). Set `top: theme(spacing.20) + 24px` at `lg+`, `top: theme(spacing.16) + 24px` below — i.e. classes `top-[88px] lg:top-[104px]`. D.1.8 `Mở quà` is rendered via `<OpenSecretBoxButton disabled />` which always passes `disabled` — no open flow wired. D.3 always renders its empty state this release.
- **Mobile sidebar → bottom sheet** (design-style.md § Responsive / Mobile) — below 768 px, the sidebar collapses into a bottom-sheet triggered by a floating "Thống kê" button. Components: `<MobileStatsBottomSheet>` (wraps the same `StatsPanel` + empty `RecentReceiversList`) and `<MobileStatsTrigger>` (fixed-position pill at bottom-right, visible only on `md:hidden`). Dismiss via backdrop click, Esc, or drag-down gesture.
- **FR-011 wiring (hashtag chip → filter)** — both `HashtagChip` (used by B.4.3 and C.3.7) and the filter triggers call the same reducer action `{ type: 'setHashtag', id }`. A chip click inside a card dispatches via React context (`LiveBoardFilterContext` provided by `LiveBoardClient`), so it reaches the reducer without prop drilling through every card. Context value = `{ state, dispatch }`; only the dispatch is passed down (state is read on the filter bar alone). Unit test: rendering a card inside a mock context and clicking a chip must dispatch the correct action.
- **Hover-preview trigger (FR-014)** — every avatar + name on Highlight / Feed / sidebar rows mounts a shared `<ProfileHoverTarget employeeId={…}>` wrapper that:
  1. Wraps children in `<Link href="/profile/{employeeId}" prefetch={false}>` for the click path.
  2. On `mouseenter` (200 ms hover-intent delay), dispatches a `window` custom event `profile:preview:open` with `{ employeeId, anchorRect }`.
  3. On `mouseleave`, dispatches `profile:preview:close`.
  The popover component itself is consumed from the Profile feature (spec Out of Scope — `721:5827`). Until it ships, the events are no-ops and the hover is inert; clicks still navigate. Documented in Risk table.
- **Styling**: Tailwind utility classes + the `@theme` tokens declared by Viết Kudo (`--color-accent-cream`, `--color-border-gold`, etc.). Add new tokens to [app/globals.css](../../../app/globals.css) for the Live board specific colours the Viết Kudo plan didn't need (`--color-surface-dark-1` #00070C, `--color-heart-active` #D4271D, `--color-heart-inactive` #F17676, `--color-overlay-dim`, `--color-page-bg` #00101A).
- **Asset**: the stylised `KUDOS` wordmark (A-block) is an SVG exported from Figma node `2940:13437`. Developer task: export via MoMorph `get_media_files` or manually in Figma → save to `public/assets/kv-kudos-wordmark.svg` → import via `next/image`. The title "Hệ thống ghi nhận lời cảm ơn" stays as rendered text (Montserrat 36/700).

### Backend

- **Route Handlers** — one file per endpoint, same skeleton as Viết Kudo:
  ```ts
  const supabase = await createClient();          // lib/supabase/server.ts
  const employee = await getCurrentEmployee(supabase);  // throws ERR_NO_EMPLOYEE_PROFILE → 403
  const params = ZodSchema.parse(...);
  ```
- **CSRF (mutating handlers)** — **current posture**: Viết Kudo's `POST /api/kudos` has no explicit CSRF gate; it relies on Next.js's default same-origin `fetch` + the Supabase auth cookie's `SameSite=Lax`. This is documented (Viết Kudo plan rev 3 "RLS is off, CSRF is the sole cross-origin guard"), but no `requireCsrf(req)` helper was actually shipped. **Decision for this plan**: follow the same posture for Phase 2/3/4 to stay consistent; open a **security follow-up task** (outside this spec) to introduce a dedicated `lib/auth/csrf.ts` that validates the `Origin`/`Sec-Fetch-Site` headers on every mutating handler (retrofits Viết Kudo's `POST /api/kudos` and this feature's `POST|DELETE /api/kudos/[id]/like` at the same time). Logged as Risk `CSRF-hardening-deferred`. Do **not** write test cases that assume the helper exists.
- **`GET /api/kudos/highlight`**: one query — `SELECT k.*, COUNT(h.*) AS heart_count FROM kudos k LEFT JOIN kudo_hearts h ON h.kudo_id=k.id WHERE k.status='published' AND k.deleted_at IS NULL [AND filter] GROUP BY k.id ORDER BY heart_count DESC, k.created_at ASC LIMIT 5`. Resolves the caller's `heartedByMe` + `canHeart` via a second compact query `SELECT kudo_id FROM kudo_hearts WHERE kudo_id = ANY($1) AND employee_id = $2` — O(1) set for membership check. Serialised via `lib/kudos/serialize-kudo.ts` (extended to include heart fields).
- **`GET /api/kudos` (extended)**: add `cursor` + `departmentId` to the existing Zod schema and query builder. When `cursor` is present → append `AND k.created_at < $cursor` and populate `meta.nextCursor` (the `created_at` of the 11th item if a page has 10, or `null`). When `departmentId` present → `JOIN employees r ON r.id=k.recipient_id AND r.department_id = $dept`. Heart fields resolved the same way as `highlight`.
- **`POST /api/kudos/{id}/like`**:
  1. Load the Kudo with `SELECT id, author_id, status, deleted_at FROM kudos WHERE id=$1`. 404 if missing / soft-deleted / hidden.
  2. If `kudo.author_id === caller.id` → `403 SELF_LIKE_FORBIDDEN`.
  3. `INSERT INTO kudo_hearts (kudo_id, employee_id) VALUES ($1, $2) ON CONFLICT DO NOTHING` — idempotent.
  4. Read back `COUNT(*)` for the Kudo → return `{ data: { kudoId, heartCount, heartedByMe: true } }`.
- **`DELETE /api/kudos/{id}/like`**: 404-on-missing Kudo same as POST; `DELETE FROM kudo_hearts WHERE kudo_id=$1 AND employee_id=$2` (idempotent — 0-row delete returns 200 with current state).
- **`GET /api/departments`**: `SELECT id, code, name, parent_id, sort_order FROM departments WHERE deleted_at IS NULL ORDER BY sort_order, code`. Cached via `unstable_cache({ revalidate: 300, tags: ['departments'] })` (master data, rarely changes — per Q-A3, rows are manually imported, no automated sync).
- **`GET /api/hashtags` (extended for Live board)**: already ships with `?q=&limit=20` offset pagination (Viết Kudo). Live board passes `?limit=10&sort=usage` — add `sort` to the Zod schema: `sort: z.enum(['usage','recent']).default('recent')`. When `sort=usage` → `ORDER BY usage_count DESC, label ASC`; caller omits `q`. No-scroll: the dropdown shows these 10 items only (Q-A2 resolution — dropping the 100-item cap and scroll-overflow).
- **`GET /api/me/stats`**: parallel aggregates —
  - `kudosReceived` = `COUNT(*) FROM kudos WHERE recipient_id=me AND status='published' AND deleted_at IS NULL`
  - `kudosSent` = same but `author_id=me`
  - `heartsReceived` = `COUNT(*) FROM kudo_hearts h JOIN kudos k ON k.id=h.kudo_id WHERE k.recipient_id=me AND k.status='published' AND k.deleted_at IS NULL`
  - `boxesOpened: 0`, `boxesUnopened: 0` (hard-coded — `secret_boxes` deferred)
  - Three queries in a single `Promise.all`; no DB view this release (per the "computed aggregates" decision in DATABASE_ANALYSIS.md). Revisit if p95 > 300 ms.
- **`GET /api/spotlight`** (the only non-trivial handler — **reshaped per Q-P6**):
  - Wrapped in `unstable_cache({ revalidate: 300, tags: ['spotlight'] })` — the 5-min cache.
  - **Node source — top 20 recipients by kudos received in the rolling last 24 hours**:
    ```sql
    SELECT e.id, e.full_name, e.avatar_url,
           COUNT(k.id)       AS kudos_count,
           MAX(k.created_at) AS last_received_at
    FROM employees e
    JOIN kudos k ON k.recipient_id = e.id
    WHERE k.status = 'published'
      AND k.deleted_at IS NULL
      AND k.created_at >= NOW() - INTERVAL '1 day'
      AND e.deleted_at IS NULL
    GROUP BY e.id, e.full_name, e.avatar_url
    ORDER BY kudos_count DESC, last_received_at DESC, e.id ASC
    LIMIT 20
    ```
    Tie-breaker: `last_received_at DESC` then `e.id ASC` for determinism.
  - `total` = `COUNT(*) FROM kudos WHERE status='published' AND deleted_at IS NULL` — **event-wide** total (not 24h), displayed in B.7.1.
  - Layout: deterministic seeded force-directed pack in `lib/spotlight/layout.ts`. Seed = event-day ISO date + the rounded 5-minute bucket (`floor(Date.now() / 300_000)`) so layout is stable within each cache window but recomputes each refresh. Node **identity** = `employee_id` (stable across redraws — SPOTLIGHT_07); node **position** may shift as the 24h window rolls.
  - Node payload: `{ id: employee_id, name, avatarUrl, kudosCount, lastReceivedAt, x, y }`. No `kudoId` — click navigates to profile (see UX below), not to a single Kudo.
  - **Node click UX** (consistent with Q-A1 "Xem chi tiết" deferral): clicking a node navigates to `/profile/{employeeId}` via the existing `<Link>` path. Hover shows a tooltip with `{name} — {kudosCount} Kudos nhận trong 24h qua`. No link to a specific Kudo (the detail page is deferred).
  - `layoutVersion` = `${eventDayIso}:${bucket5min}` — changes every 5 minutes; clients detect it to decide whether to redraw.
  - Emit `Cache-Control: public, max-age=300, s-maxage=300` + `ETag: hash(layoutVersion)`. Handle `If-None-Match` for 304. Public caching is intentional per Q-P8 — response is identical across users.
- **Realtime subscription (client-only)**: inside `SpotlightBoard.tsx`, `supabase.channel('live-kudos').on('postgres_changes', { event: '*', schema: 'public', table: 'kudos' }, handler).subscribe()`. Handler updates local `total` + appends to recent-receiver log. Unsubscribes on unmount. No server-side realtime code.

### Data layer

- **Serializer extension** — `lib/kudos/serialize-kudo.ts` adds three fields to the `PublicKudo` type:
  ```ts
  heartCount: number;
  heartedByMe: boolean;
  canHeart: boolean;  // false ⇔ caller is author
  ```
  Takes an extra optional `{ likedSet: Set<number>, callerEmployeeId: number }` parameter. When absent (e.g. from server-to-server calls without a user context) → `heartedByMe: false, canHeart: true` defaults.
- **Zod** — `lib/validations/live-board.ts`:
  - `ListKudosParams` extended: `cursor: z.string().datetime().optional()`, `departmentId: z.coerce.number().int().positive().optional()`.
  - `LikeParams`: just `{ id: z.coerce.number().int().positive() }`.
  - `SpotlightResponse` export for the handler's return shape.
- **Supabase client** — extend the existing `Database` type generated by `supabase gen types typescript` (re-run after the new migrations).

### Integration points

- **Existing (reused as-is)**:
  - [lib/supabase/server.ts](../../../lib/supabase/server.ts), [lib/supabase/client.ts](../../../lib/supabase/client.ts)
  - [lib/auth/current-employee.ts](../../../lib/auth/current-employee.ts)
  - [lib/kudos/serialize-kudo.ts](../../../lib/kudos/serialize-kudo.ts) — **extended** with heart fields
  - [lib/kudos/api-responses.ts](../../../lib/kudos/api-responses.ts) — shared JSON helpers
  - [components/kudos/WriteKudoCTA.tsx](../../../components/kudos/WriteKudoCTA.tsx) — wired to the A.1 pill click
  - [components/kudos/WriteKudoModalMount.tsx](../../../components/kudos/WriteKudoModalMount.tsx) — already mounted at the dashboard layout; the A.1 pill opens the modal via `?write=kudo` search param
  - [components/shared/UserAvatar.tsx](../../../components/shared/UserAvatar.tsx) — reused for sender/recipient avatars on every card
  - [components/ui/icons/](../../../components/ui/icons/) — add the Live-board-specific icons (chevron-left/right/down, pencil, heart, link, search, pan-zoom, gift, close, arrow-right)
  - [messages/{vi,en,ja}.json](../../../messages/) — extend with `kudos.liveBoard.*`
- **Modified**:
  - [app/(dashboard)/kudos/page.tsx](../../../app/(dashboard)/kudos/page.tsx) — replace stub with full Live-board composition
  - [app/api/kudos/route.ts](../../../app/api/kudos/route.ts) — extend `GET` with `cursor` + `departmentId` + heart fields; `POST` path untouched
  - [next.config.ts](../../../next.config.ts) — CSP `connect-src` add `wss://<SUPABASE_REF>.supabase.co` for Realtime WebSocket

---

## Project Structure

### Documentation (this feature)

```
.momorph/specs/MaZUn5xHXZ-sun-kudos-live-board/
├── spec.md
├── design-style.md
├── plan.md             # this file
├── tasks.md            # ← generated by /momorph.tasks next
└── assets/
    ├── frame-live-board.png
    ├── dropdown-hashtag.png
    └── dropdown-phong-ban.png
```

### Source code (new + modified)

```
app/
├── (dashboard)/
│   └── kudos/
│       └── page.tsx                                  [MODIFIED — replace stub with parallel fetch + <LiveBoardClient />]
└── api/
    ├── kudos/
    │   ├── route.ts                                  [MODIFIED — GET extended with cursor + departmentId + heart fields]
    │   ├── highlight/
    │   │   └── route.ts                              [NEW — GET top-5]
    │   └── [id]/
    │       └── like/
    │           └── route.ts                          [NEW — POST + DELETE (single file, two handlers)]
    ├── departments/
    │   └── route.ts                                  [NEW — GET (cached 5 min)]
    ├── me/
    │   └── stats/
    │       └── route.ts                              [NEW — GET]
    ├── spotlight/
    │   └── route.ts                                  [NEW — GET (cached 5 min, ETag-aware)]
    └── _test/
        └── revalidate/
            └── route.ts                              [NEW — TEST-ONLY, same gate as /_test/sign-in (NODE_ENV==='test' + X-Test-Auth). POST body `{tags: string[]}` → calls `revalidateTag` for each. Used by integration tests to clear `unstable_cache` between runs.]

components/kudos/
├── LiveBoard/
│   ├── LiveBoardClient.tsx                           [NEW — top-level client island with filter reducer + URL mirror]
│   ├── KvBanner.tsx                                  [NEW — A: title text + KUDOS SVG + A.1 pill (reuses WriteKudoCTA)]
│   ├── SectionHeader.tsx                             [NEW — shared: eyebrow + big gold title (used by B.1, B.6, C.1)]
│   ├── FilterBar.tsx                                 [NEW — B.1.1 + B.1.2 + active-chip × close]
│   ├── HighlightCarousel/
│   │   ├── HighlightCarousel.tsx                     [NEW — B.2: slider + B.5 nav]
│   │   ├── HighlightCard.tsx                         [NEW — B.3: 528×auto cream card with 3-line clamp]
│   │   └── SlidePagination.tsx                       [NEW — B.5.2 chip]
│   ├── SpotlightBoard/
│   │   ├── SpotlightBoard.tsx                        [NEW — B.7: canvas + controls + realtime sub]
│   │   ├── SpotlightCanvas.tsx                       [NEW — pure render given {nodes}]
│   │   ├── SpotlightSearch.tsx                       [NEW — B.7.3 input]
│   │   ├── SpotlightPanZoom.tsx                      [NEW — B.7.2 gesture layer]
│   │   └── RecentReceiverLog.tsx                     [NEW — animated inside-canvas stream]
│   ├── KudoFeed/
│   │   ├── KudoFeed.tsx                              [NEW — C.2: cursor-paginated virtualised list]
│   │   └── KudoPost.tsx                              [NEW — C.3: 680×749 card]
│   ├── Sidebar/
│   │   ├── StatsSidebar.tsx                          [NEW — D container, sticky — desktop]
│   │   ├── StatsPanel.tsx                            [NEW — D.1 + divider]
│   │   ├── OpenSecretBoxButton.tsx                   [NEW — D.1.8, always disabled this release]
│   │   ├── RecentReceiversList.tsx                   [NEW — D.3, always empty state this release]
│   │   ├── MobileStatsBottomSheet.tsx                [NEW — mobile: same panels inside a bottom sheet]
│   │   └── MobileStatsTrigger.tsx                    [NEW — mobile: fixed floating pill to open the sheet]
│   ├── skeletons/
│   │   ├── HighlightCarouselSkeleton.tsx             [NEW — 3 faded card placeholders]
│   │   ├── SpotlightSkeleton.tsx                     [NEW — canvas shape with pulsing border]
│   │   ├── KudoFeedSkeleton.tsx                      [NEW — N cream-card placeholders (props.count)]
│   │   └── SidebarSkeleton.tsx                       [NEW — static stat rows with shimmer]
│   └── parts/
│       ├── AnchoredSingleSelect.tsx                  [NEW — shared dropdown chrome (Hashtag + Phòng ban)]
│       ├── HeartsButton.tsx                          [NEW — C.4.1 / B.4.4 heart subcomponent with optimistic UI]
│       ├── CopyLinkButton.tsx                        [NEW — shared primitive with toast on success/fail]
│       ├── HashtagChip.tsx                           [NEW — B.4.3 / C.3.7; click = filter apply]
│       ├── AttachmentGrid.tsx                        [NEW — C.3.6; up to 5 × 80px; click = lightbox]
│       ├── HoaThiTooltip.tsx                         [NEW — FR-015: 1/2/3 star thresholds tooltip]
│       ├── ProfileHoverTarget.tsx                    [NEW — FR-014 wrapper: Link + hover-intent + custom event dispatch]
│       ├── EmptyState.tsx                            [NEW — "Hiện tại chưa có Kudos nào." / "Chưa có dữ liệu"]
│       └── Toast.tsx                                 [REUSE — sonner already in package.json (^2.0.7)]
└── LiveBoard.barrel.ts                               [NEW — "use client" barrel for LiveBoardClient only]

lib/
├── kudos/
│   └── serialize-kudo.ts                             [MODIFIED — add heartCount / heartedByMe / canHeart to PublicKudo + helper that accepts {likedSet, callerEmployeeId}]
├── spotlight/
│   ├── layout.ts                                     [NEW — pure deterministic packer; pure function, 100% branch coverage]
│   └── realtime-channel.ts                           [NEW — thin wrapper around supabase.channel('live-kudos')]
├── hooks/
│   └── use-anchored-position.ts                      [NEW — shared hook: captures trigger rect + reposition on resize/scroll. Used by AnchoredSingleSelect now and retrofittable to Viết Kudo's HashtagPicker / RichTextArea mention popover later]
└── validations/
    └── live-board.ts                                 [NEW — Zod for ListKudosParams extension, LikeParams, Spotlight response]

supabase/
├── migrations/
│   ├── 202604210900_departments.sql                  [NEW — table + indexes]
│   ├── 202604210901_employees_department_fk.sql     [NEW — add department_id FK, drop legacy `department` VARCHAR]
│   └── 202604210902_kudo_hearts.sql                  [NEW — composite PK + idx_kudo_hearts_employee]
└── snippets/
    └── seed-kudos-test.sql                           [NEW — directory exists but is empty; this plan creates the file (see Phase 1 for the seed contents)]

types/
└── kudos.ts                                          [MODIFIED — extend PublicKudo + add LikeResponse, MyStatsResponse, SpotlightResponse, DepartmentListResponse]

next.config.ts                                        [MODIFIED — extend CSP connect-src with wss:// for Realtime]

app/globals.css                                       [MODIFIED — add Live-board-specific tokens (page-bg #00101A, heart-active #D4271D, heart-inactive #F17676, surface-dark-1 #00070C, overlay-dim)]

messages/{vi,en,ja}.json                              [MODIFIED — add kudos.liveBoard.* namespace; en/ja marked TODO per Viết Kudo convention]

public/assets/
├── kv-kudos-wordmark.svg                             [NEW — exported from Figma node 2940:13437]
└── kv-kudos-bg.svg                                   [NEW — decorative banner bg if any, optional]

tests/
├── unit/
│   └── kudos/
│       ├── serialize-kudo.spec.ts                    [MODIFIED — cover heart field resolution]
│       ├── spotlight-layout.spec.ts                  [NEW — deterministic layout, same seed → same x/y]
│       ├── HeartsButton.spec.tsx                     [NEW — optimistic toggle, rollback on 403/500]
│       ├── HighlightCarousel.spec.tsx                [NEW — disabled ends, pagination reset on filter]
│       ├── AnchoredSingleSelect.spec.tsx             [NEW — keyboard nav, toggle-off, outside-click close]
│       ├── KudoFeed.spec.tsx                         [NEW — cursor advance, sentinel intersection]
│       └── FilterBar.spec.tsx                        [NEW — chip-click applies filter to parent]
├── integration/
│   └── kudos/
│       ├── live-board-feed.spec.ts                   [NEW — cursor + departmentId combos (KUDO_LIST_11..20)]
│       ├── kudos-highlight.spec.ts                   [NEW — HIGHLIGHT_01..12]
│       ├── kudos-like.spec.ts                        [NEW — LIKE_POST_01..11 + LIKE_DEL_01..07]
│       ├── departments.spec.ts                       [NEW — DEPT_LIST_01..05]
│       ├── me-stats.spec.ts                          [NEW — STATS_01..07]
│       └── spotlight.spec.ts                         [NEW — SPOTLIGHT_01..11 incl. ETag/304, cache TTL]
└── e2e/
    └── kudos/
        ├── live-board-browse.spec.ts                 [NEW — US1 P1: banner renders, carousel 1/5, feed 10 cards]
        ├── live-board-filter.spec.ts                 [NEW — US2 P1: pick hashtag → both blocks refetch; toggle-off; combined with Phòng ban]
        ├── live-board-like.spec.ts                   [NEW — US4 P1: optimistic like + un-like + self-like disabled]
        ├── live-board-write-entry.spec.ts            [NEW — US7 P1: click A.1 → modal opens; submit → card prepended + stats increments]
        ├── live-board-carousel.spec.ts               [NEW — US3 P2: arrows, disabled ends, pagination reset on filter]
        └── live-board-spotlight-realtime.spec.ts     [NEW — US8 P2: two browsers, B publishes, A's B.7.1 increments within 2s]
```

### Dependencies to install

| Package | Version pin | Purpose |
|---|---|---|
| `@tanstack/react-virtual` | latest | Feed virtualisation (C.2) |
| `@use-gesture/react` *(pending Q-P2)* | latest | Pan/zoom on the Spotlight canvas |
| `@react-spring/web` *(pending Q-P2)* | latest | Inertia + redraw animation on layout refresh |

*Already installed from Viết Kudo* (no amendment needed): `sonner ^2.0.7`, `@axe-core/playwright ^4.11.2`, `@playwright/test ^1.59.1`.

---

## Implementation Strategy

### Phase 0 — Asset preparation *(deterministic, no logic)*

- Export the `KUDOS` wordmark SVG from Figma node `2940:13437` → `public/assets/kv-kudos-wordmark.svg`. Verify with a quick `<Image>` render at the target 1152×160 banner size.
- Export any decorative banner background if present (same path convention).
- Download new icons via MoMorph `get_media_files` into `components/ui/icons/` (chevron-left, chevron-right, heart-filled, heart-outline, link, search, pan-zoom, gift, close, arrow-right, pencil). Create missing ones as inline SVG React components matching the existing icon convention.
- Extend [app/globals.css](../../../app/globals.css) with the new Live-board `@theme` tokens listed in § Architecture Decisions → Styling.
- Extend [next.config.ts](../../../next.config.ts) CSP `connect-src` with `wss://${SUPABASE_REF}.supabase.co` (Realtime WebSocket).
- Add `kudos.liveBoard.*` keys to `messages/vi.json`; mirror `en.json`/`ja.json` with `TODO:` markers per the Viết Kudo convention.

### Phase 1 — Foundation (schema + shared infra)

- Write migrations `202604210900*`..`202604210902*`:
  - `departments` table + indexes.
  - `employees.department_id` FK; drop legacy `department VARCHAR`. **Breaking for Viết Kudo** — the migration must land together with a coordinated PR that updates the following read sites **before** the drop:
    1. `lib/kudos/serialize-kudo.ts` — the employee-summary shape (`senderDepartment`, `recipientDepartment`) reads `department_id → departments.code` via the new FK join.
    2. `GET /api/employees/search` — select + return `departments.code AS department` (join added to the existing query); response shape preserved for backwards compatibility.
    3. The Viết Kudo `RecipientField` dropdown row currently displays the free-text `department` — no UI change needed as long as the API response key stays the same string.
    4. Seeds in `supabase/snippets/seed-kudos-test.sql` updated to populate `department_id` instead of `department`.
    5. Migration step backfills `department_id` from the existing `department` text (best-effort match on `departments.code`; unmatched rows set NULL + `RAISE NOTICE` each row). Admin task to reconcile before drop of the `department` column.
  - `kudo_hearts` composite-PK table + `idx_kudo_hearts_employee`.
- Re-run `supabase gen types typescript` → update `types/supabase.ts` (auto-generated).
- **Create** `supabase/snippets/seed-kudos-test.sql` — the directory exists but is empty (Viết Kudo's plan listed this file but it was never committed). This feature creates it fresh with: ≥ 20 employees (reuse whatever `.env.test` Supabase needs), ≥ 10 titles, ≥ 30 hashtags, ≥ 10 active departments (+1 soft-deleted + 1 with `parent_id`), 30+ published kudos with hearts spread across them (≥ 5 kudos with hearts for HIGHLIGHT ordering), 1 hidden kudo with the top heart count (HIGHLIGHT_08 exclusion), 1 anonymous kudo (masking tests), 1 deleted employee (exclusion). Single idempotent SQL snippet: `TRUNCATE … CASCADE; INSERT ON CONFLICT DO NOTHING …`.
- Write **failing** tests for `lib/spotlight/layout.ts` (deterministic seeded packing) → implement → green.
- Extend [serialize-kudo.ts](../../../lib/kudos/serialize-kudo.ts) with heart fields → update its unit test — **fail** → green. Extend `PublicKudo` in [types/kudos.ts](../../../types/kudos.ts).
- Add `lib/validations/live-board.ts` (cursor, departmentId, LikeParams, Spotlight). Unit-test the schemas.

### Phase 2 — P1 vertical slice: US1 (Browse feed) + US7 (Write entry)

*Minimum viable Live board: banner + plain feed + open-Viết-Kudo CTA. No filters, no highlights, no sidebar yet.*

- Backend (TDD):
  - Red: `tests/integration/kudos/live-board-feed.spec.ts` rows KUDO_LIST_11 (cursor), 12 (exhausted), 14 (invalid cursor), 19 (heart fields present), 20 (canHeart false on own).
  - Green: extend `GET /api/kudos` — new Zod, new SQL branch for `cursor`, heart-field resolution via the compact `likedSet` query, `meta.nextCursor` in response.
- Frontend:
  - Red: `KudoFeed.spec.tsx`, `KudoPost.spec.tsx` (render + heart fields + copy-link).
  - Green: replace the stub `app/(dashboard)/kudos/page.tsx` with a parallel `Promise.all` → `<LiveBoardClient initialFeed initialHighlight=[] hashtags=[] departments=[] meStats spotlight />`; initial render only mounts `KvBanner` + `KudoFeed`, other blocks render null while the rest of the slices are built.
  - Wire the A.1 pill to `WriteKudoCTA` → opens `?write=kudo` (the Mount island already watches for it).
- E2E: `live-board-browse.spec.ts` (US1 AS#1, 3, 4, 5) + `live-board-write-entry.spec.ts` (US7 AS#1, 2).

**Exit criteria**: signed-in user lands on `/kudos`, sees the banner + feed of 10 newest kudos; scroll appends next page; click A.1 pill opens the Viết Kudo modal; submit prepends a new card.

### Phase 3 — P1 #2: US2 (Filter) + US4 (Like) + US6 (Stats sidebar)

- Backend:
  - Red: HIGHLIGHT_01..12, LIKE_POST_01..11, LIKE_DEL_01..07, DEPT_LIST_01..05, STATS_01..07.
  - Green: `GET /api/kudos/highlight`, `POST|DELETE /api/kudos/[id]/like`, `GET /api/departments` (5-min cache), `GET /api/me/stats`.
  - Extend `GET /api/kudos` with `departmentId` filter branch → KUDO_LIST_15..18.
- Frontend:
  - Red: `FilterBar.spec.tsx`, `AnchoredSingleSelect.spec.tsx`, `HeartsButton.spec.tsx`, `HighlightCarousel.spec.tsx`.
  - Green: `FilterBar`, `AnchoredSingleSelect`, `HighlightCarousel` + `HighlightCard`, `HeartsButton` with optimistic toggle + rollback. `StatsSidebar` + `StatsPanel` + `OpenSecretBoxButton` (disabled) + `RecentReceiversList` (empty state).
  - URL-sync filter state via `useRouter().replace()`.
- E2E: `live-board-filter.spec.ts` (US2 AS#1..7), `live-board-like.spec.ts` (US4 AS#1..4 + self-like disabled).

**Exit criteria**: filters reset the Highlight carousel and feed; toggle-off restores; like/un-like is optimistic + server-reconciled + 403 on self-like; stats panel shows live counts with box rows at `0`.

### Phase 4 — P2: US3 (Carousel nav) + US8 (Spotlight + realtime)

*(US5 Copy Link is deferred — see Q-A1 resolution. `CopyLinkButton` is rendered as a permanently-disabled shell in Phase 2 when `KudoPost`/`HighlightCard` are built; no additional work this phase.)*

- Backend:
  - Red: SPOTLIGHT_01..11 — cold cache, warm cache, ETag/304, TTL refresh, anonymous masking on nodes, hidden exclusion, 500-row cap.
  - Green: `GET /api/spotlight` wrapped in `unstable_cache`; `lib/spotlight/layout.ts` integration.
- Frontend:
  - Red: `SpotlightBoard.spec.tsx` (realtime debounce, reconnect indicator), `CopyLinkButton.spec.tsx` (renders **disabled** state only — assertion: `cursor-not-allowed`, `aria-disabled`, no click handler).
  - Green: `SpotlightBoard` + `SpotlightCanvas` + `SpotlightSearch` + `SpotlightPanZoom` + `RecentReceiverLog`; carousel arrows + pagination logic (US3). `CopyLinkButton` is the 10-line disabled shell.
- E2E: `live-board-carousel.spec.ts` (US3), `live-board-spotlight-realtime.spec.ts` (US8 AS#4 two-browser flow using Playwright's `browser.newContext()`). **No E2E for US5** this release.

### Phase 5 — Polish & launch gate

- Responsive pass (design-style.md § Responsive): Mobile 1-col + bottom-sheet stats, Tablet sidebar-accordion, Desktop 2-col sticky. Playwright runs on 3 viewports.
- Accessibility: axe-core E2E run; keyboard walk for carousel arrows, dropdowns (Tab/Arrows/Esc), heart button (`aria-pressed`), copy-link (`aria-label`). Contrast check for gold text on dark.
- Security: verify CSP `connect-src` includes `wss://` for Realtime; audit the like handler for enumeration (leaks existence of hidden Kudos? → currently yes via 404 vs 401 — decision Q-P3: unify to 404 for "not accessible" regardless).
- Observability: `console.error` with correlation ids on spotlight cache miss + realtime reconnect failures.
- Performance: verify Core Web Vitals on Lighthouse mobile-3G emulation: LCP ≤ 2.5 s (SC-006), CLS < 0.1, heart click → red ≤ 150 ms (SC-003), filter refetch p75 ≤ 600 ms (SC-005), spotlight live latency ≤ 2 s (SC-007).
- Final constitution-compliance self-check before PR.

---

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| Spotlight layout non-deterministic across pods | Med | **High** | `lib/spotlight/layout.ts` is a **pure function** seeded by `event-day + 5-min bucket`. Unit test asserts same seed → same `x/y`. Never use `Math.random()` without an injected seed |
| Realtime channel storms during launch (e.g. 100 Kudos/min) | Med | Med | Client debounces the B.7.1 counter tick to 500 ms; canvas nodes don't react to realtime at all (only 5-min poll). Server-side relies on Supabase Realtime's rate shielding. Load-test the `kudos` INSERT subscription before launch |
| Spotlight 24h window rollover (Q-P6) — quiet period produces an empty canvas | Med | Low | Client renders the "Chưa có Kudos nào trong 24 giờ qua — hãy là người mở màn!" empty state while keeping the B.7.1 event-wide total visible. Non-issue during the active event window; flag for ops if it happens after the event ends |
| Spotlight top-20 cap excludes long-tail recipients who got a Kudo >24h ago | Low | Low | Intentional per Q-P6 — Spotlight is a "who's hot in the last day" snapshot, not an all-time hall of fame. Users who want older recipients can open Viết Kudo's recipient search. Flag for product review after launch metrics |
| Self-like enforcement leak | Low | **High** | Server-side check is **authoritative**; client's `canHeart` flag is UX only (TR-002). LIKE_POST_03 + Scenario 10 explicitly cover the bypass attempt. Audit: no path writes `kudo_hearts` without the `author_id !== caller.id` check |
| `employees.department` → `department_id` migration leaves unmatched rows | Med | Med | Migration backfills best-effort; unmatched rows log + keep `NULL`. Admin task to reconcile before launch. Filter query treats `NULL department_id` as "no department" — not a crash |
| Cursor feed duplicates on concurrent INSERT | Low | Low | Cursor = `created_at`; ties broken by ordering `created_at DESC, id DESC` with `(created_at, id)` as the tuple cursor. Add `id` tie-breaker to Zod + SQL in Phase 2 (small addition) |
| Optimistic heart count drifts under network flakiness | Low | Med | The POST/DELETE responses carry server-reported `heartCount`; client **overwrites** optimistic state with server truth on 2xx. Rollback on non-2xx. Integration test `kudos-like.spec.ts` LIKE_POST_10 simulates a race |
| Spotlight `unstable_cache` + cross-user cache pollution | Low | Med | Response contains no user-specific data (no `heartedByMe`), so cache is truly shared. The only user-specific fields on any response (like `heartedByMe` on `/kudos/highlight` and `/kudos`) are NOT cached at the Next layer. |
| `@tanstack/react-virtual` + Tailwind arbitrary-height mismatch | Low | Low | Feed estimated height 900 px; `measure()` callback on mount for exact. If mis-estimation causes jitter, switch to dynamic-height mode (library supports both) |
| Deferred Secret Box UI-data mismatch if feature ships mid-release | Med | Low | `OpenSecretBoxButton` already accepts `disabled` prop; `RecentReceiversList` already accepts `items` prop; when `secret_boxes` lands, only two components change (plus endpoint wiring). Low coupling kept intentional |
| **Profile preview popover not shipped** — hover targets dispatch events nobody listens for | Low | Low | Acceptable UX regression — hover is a no-op, click still navigates to `/profile/{id}`. Remove when the Profile feature's popover consumer lands (1-line change in `<AppShell>` to mount the listener) |
| **Top-10 hashtag filter may miss long-tail interesting tags** (Q-A2 resolution — filter caps at top 10 by `usage_count`) | Low | Low | A user who wants to filter by a rarely-used tag must open Viết Kudo to see the full list, or click the chip on an existing card (FR-011 wire still works — any chip click applies that tag even if it's not in the top 10). Acceptable for launch per product decision |
| **FR-011 hashtag-chip chain of dispatch** — a chip buried inside a virtualised card must still reach the reducer | Low | Low | Use React Context (`LiveBoardFilterContext`) provided at `LiveBoardClient` root; the context passes only `dispatch` (not `state`) to avoid re-renders. Unit test covers virtualised-card → chip → dispatch path |
| **CSRF hardening is deferred** — Viết Kudo's "no RLS" posture made CSRF the sole cross-origin guard, but `lib/auth/csrf.ts` was never shipped. Adding `/kudos/[id]/like` extends the attack surface (two more mutating endpoints, both id-bound) | Med | Med | Short-term: rely on `SameSite=Lax` + Next.js same-origin default (current state — same as `POST /api/kudos`). Mid-term: open a dedicated security task to ship `lib/auth/csrf.ts` that validates `Origin` / `Sec-Fetch-Site` on ALL mutating handlers (retrofits Viết Kudo too). Does NOT block this feature's launch but tracked as a tech-debt item |
| **Sticky sidebar overlaps fixed header if `top` offset is wrong** | Low | Low | Dashboard layout applies `pt-16 lg:pt-20` to `<main>`; sidebar uses `top-[88px] lg:top-[104px]` (header height + 24 px gutter). Playwright responsive test asserts the sidebar's top is visible below the header at 1440 × 900 |

### Estimated complexity

- **Frontend**: **High** — 20+ client components, realtime channel island, virtualised feed, pan/zoom canvas, optimistic hearts with rollback, URL-synced filter reducer.
- **Backend**: **Medium** — 6 handlers + 1 extended handler; 3 migrations; 1 deterministic layout utility.
- **Testing**: **High** — 63 new API test rows, 7 new integration files, 6 Playwright flows (including a two-browser realtime scenario), axe-core.

---

## Integration Testing Strategy

### Test scope

- ✅ **Component interactions**: `LiveBoardClient` ↔ (`HighlightCarousel` + `FilterBar` + `KudoFeed` + `Sidebar`) via the shared filter reducer.
- ✅ **External dependencies**: Supabase Postgres (real test project), Supabase Realtime (real channel), Next.js `unstable_cache` (mockable in unit, real in integration).
- ✅ **Data layer**: like / un-like idempotency, cursor pagination correctness, 5-min cache semantics, Realtime INSERT handler.
- ✅ **User workflows**: US1+US7 (browse + write), US2+US4+US6 (filter + like + stats) via Playwright at P1; US3+US8 (carousel + spotlight realtime) at P2. US5 (Copy Link) deferred per Q-A1 — no E2E coverage.

### Test categories

| Category | Applicable? | Key scenarios |
|---|---|---|
| UI ↔ Logic | Yes | Filter reducer, optimistic heart, carousel reset on filter, URL-sync |
| App ↔ External API | Yes | Realtime subscription mount/unmount, reconnection handshake |
| App ↔ Data Layer | Yes | Composite-PK constraint on `kudo_hearts`, 404 on hidden Kudo, cache TTL |
| Cross-platform | Yes | 3 Playwright viewports (375/768/1440), two-browser Scenario 11 for realtime |

### Test environment

- Reuse the Viết Kudo test project + `supabase start` locally.
- `beforeEach` truncates `kudos`, `kudo_hearts`, `kudo_hashtags`, `kudo_images`, `kudo_mentions`, `uploads` (reseeded from `seed-kudos-test.sql`); `departments`, `employees`, `titles`, `hashtags` survive.
- **E2E authentication**: reuse the **already-shipped** `/api/_test/sign-in` test-only Route Handler (confirmed present at `app/api/_test/sign-in/`). Playwright's `authSetup.ts` helper (from Viết Kudo) is reused verbatim — no new test-auth plumbing.
- **Realtime in E2E**: Playwright's `browser.newContext()` opens a second isolated session; one tab publishes, the other asserts the B.7.1 count increments. Realtime latency ≤ 2 s — use `page.waitForFunction(() => counter.textContent === '389', { timeout: 5000 })`.
- **`unstable_cache` in integration**: Next's cache leaks across tests unless we `revalidateTag` between runs. `beforeEach` fires `revalidateTag('spotlight')` + `revalidateTag('departments')` via a test-only Route Handler. Add a new `app/api/_test/revalidate/route.ts` gated the same way as `/api/_test/sign-in` (`NODE_ENV==='test'` + `X-Test-Auth` secret header).

### Mocking strategy

| Dependency | Strategy | Rationale |
|---|---|---|
| Supabase Postgres | **Real** in integration + E2E; mock in unit | CHECK constraints + composite PK semantics only verifiable against real Postgres |
| Supabase Realtime | **Real** in E2E; mocked (`vi.fn()` channel) in `SpotlightBoard.spec.tsx` | WebSocket handshake is stateful; only E2E exercises the full dance |
| `unstable_cache` | **Real** in integration (with tag-revalidate hook); bypassed in unit | Cache correctness is half the test |
| External links (`/profile/{id}`) | Stub | Not under test this feature |

### Test scenarios outline

1. **Happy path**
   - [ ] US1: `/kudos` renders banner + feed; infinite scroll loads page 2
   - [ ] US2: Pick Hashtag → both blocks refetch → Pick Department → AND-filtered
   - [ ] US4: Like kudo → red heart + count+1; un-like; author's own kudo heart disabled
   - [ ] US7: Click A.1 pill → modal opens → submit → new card prepended
   - [ ] US8: Two browsers; B publishes → A increments within 2 s
2. **Error handling**
   - [ ] Like a hidden Kudo → 404 + soft-remove on client
   - [ ] Network timeout on like → optimistic rollback + toast
   - [ ] Realtime disconnect → "Reconnecting…" indicator → reconcile on reconnect
   - [ ] ~~Copy Link fails (permissions) → error toast~~ — US5 deferred (Q-A1); button disabled, no error path
3. **Edge cases**
   - [ ] Self-like bypass attempt → 403 `SELF_LIKE_FORBIDDEN`; no DB row
   - [ ] Filter yields zero → Highlight hidden + feed empty state
   - [ ] Spotlight cache hits within 5 min → identical `layoutVersion`
   - [ ] Cursor ties at same `created_at` → `id` tie-breaker orders deterministically
   - [ ] Carousel pagination resets on filter change

### Tooling & framework

- Vitest (unit + integration), Playwright 1.59 (E2E, 3 viewports, multi-context for realtime), `@axe-core/playwright` for a11y.

### Coverage goals

| Area | Target | Priority |
|---|---|---|
| Route Handlers (6 new + extended) | 95 % lines, 90 % branches | High |
| `lib/spotlight/layout.ts` | 100 % branches (pure) | High |
| Serializer heart-field path | 100 % branches | High |
| React hooks (`useKudoFeed`, filter reducer) | 90 % | High |
| Client components | 80 % | Medium |
| E2E P1 flows (US1, US2, US4, US7) | All acceptance scenarios | High |
| E2E P2 flows (US3, US8) | Golden path + 1 edge | Medium |

---

## Dependencies & Prerequisites

### Required before start

- [x] `constitution.md` reviewed (v1.0.0)
- [x] `spec.md` approved (2026-04-21, review rounds 2-3 complete)
- [x] `design-style.md` approved
- [x] API contract `api-docs.yaml` extended (2026-04-21)
- [x] DB schema `database-schema.sql` updated (2026-04-21 — departments + kudo_hearts)
- [x] Backend test cases extended (2026-04-21 — 63 new rows)
- [x] Viết Kudo foundation shipped (`lib/kudos/*`, `lib/auth/*`, `lib/supabase/*`, `POST /api/kudos`, `WriteKudoModal`)
- [ ] Supabase Realtime enabled on the `kudos` table (check-box in Supabase dashboard)
- [ ] HR department master-data import into the `departments` table (see Backfill note)
- [ ] `pg_trgm` already enabled (from Viết Kudo)
- [ ] Constitution amendment PR adding `@tanstack/react-virtual` + pending Q-P2 (gesture libs)

### External dependencies

- **Departments import (manual — Q-A3 resolution)**: before launch, ops runs a manual INSERT against `departments` with all organisational codes. No CSV ingestion pipeline, no admin UI, no scheduled job. The spec's Figma snapshot (~49 codes) is a reference, not the canonical source — ops uses the current HR list. Owner: ops / HR liaison. Blocker gate before launch but not before development.
- KUDOS wordmark SVG export — blocked on designer / export permission. If blocked, a temporary PNG fallback at the same path will render (plan task: revisit before launch).

---

## Open Questions

### Scope decisions — RESOLVED 2026-04-21

- **~~Q-A1~~ Kudo detail page / Copy Link / Xem chi tiết** → **Resolved**: product chose option (b) — temporarily disable both buttons this release. No detail page created. `<CopyLinkButton>` and `<HighlightCard>`'s "Xem chi tiết" button render as permanently-disabled shells. US5 moved to Out of Scope. A future release adds `/kudos/[id]/page.tsx` + flips the disabled flag. Applied throughout the plan.
- **~~Q-A2~~ Hashtag filter dropdown size** → **Resolved**: cap at **top 10** by `usage_count DESC`. `GET /api/hashtags?limit=10&sort=usage` (new `sort=usage` param). No scroll, no in-dropdown search needed. Users can still filter by any tag they see on a card (FR-011 chip click works outside the top 10).
- **~~Q-A3~~ Departments import cadence** → **Resolved**: manual one-off import, no sync automation, no admin UI this release. Ops fills `departments` directly via SQL or Supabase dashboard before launch. No scheduled job, no HR CSV integration. Simplifies Phase 1 — no sync code to ship.

### Implementation trade-offs — RESOLVED 2026-04-21

All 8 Q-P items are resolved; summary of the final decisions baked into the plan:

- **~~Q-P1~~ Cursor tie-breaker** → composite `(created_at, id)` tuple encoded as an opaque string (prevents duplicate/missing rows on exact-timestamp ties during burst inserts). Zod validates; handler decodes before SQL.
- **~~Q-P2~~ Pan/zoom library** → install `@use-gesture/react` + `@react-spring/web`. Constitution-amendment PR covers them alongside `@tanstack/react-virtual`.
- **~~Q-P3~~ 404 on hidden/deleted Kudo like** → unified to **404 NOT_FOUND** for missing / soft-deleted / `status='hidden'` Kudos. Hidden and deleted are indistinguishable to non-admins.
- **~~Q-P4~~ Realtime on `kudo_hearts`** → **out of scope** this release. Feed and carousel refresh on filter/navigation only; live heart counts deferred to v2.
- **~~Q-P5~~ Departments hierarchy in dropdown** → flat this release; `parent_id` present in schema but unused by the UI. Figma mock shows flat; grouping deferred.
- **~~Q-P6~~ Spotlight aggregation** → **top 20 recipients by `kudos_count DESC` in the rolling last 24 hours** (not most-recent 500, not all-time). `total` in B.7.1 remains event-wide. Canvas redraws only on 5-min poll; realtime updates only total + recent-receiver log. Scope change applied in the Backend section above.
- **~~Q-P7~~ Realtime channel payload audit** → **skipped** per product: accept the current payload shape (full `kudos` row). Feed is public, `body` is already sanitised at `POST /api/kudos` time, and the spec keeps the feed/likes out of realtime scope so sensitive columns aren't surfaced more than they already are. No further hardening this release.
- **~~Q-P8~~ Edge CDN caching of `/api/spotlight`** → **public caching is fine** (response is identical across users — the data is a company-wide board, not personalised). `Cache-Control: public, max-age=300, s-maxage=300` is kept as-is.

---

## Next Steps

After plan approval:

1. Open the constitution amendment PR adding `@tanstack/react-virtual` (and the gesture libs if Q-P2 approves).
2. Run `/momorph.tasks` to break this plan into an ordered task list (expected ~50 tasks across 5 phases).
3. Run `/momorph.implement` once the task list is approved. Phase 0 + Phase 1 (migrations + SVG + serializer extension) unblock parallel work across phases 2-4.

---

## Notes

- **Viết Kudo patterns are load-bearing here**. Re-read [the Viết Kudo plan](../ihQ26W78P2-viet-kudo/plan.md) before touching `lib/kudos/*` — especially `serialize-kudo.ts` (anonymity masking is already correct; we only add heart fields on top).
- The **Live board is the first feature to use Supabase Realtime** in the project. Treat `lib/spotlight/realtime-channel.ts` as a template worth over-documenting — subsequent features will copy it.
- **URL-driven filter state** is a deliberate choice — it makes QA repro trivial (paste URL → same filtered view), supports browser Back/Forward, and makes filter-share links natural.
- **Deferred features keep their UI scaffolding**. When `secret_boxes` ships, only two components need wiring (`OpenSecretBoxButton`, `RecentReceiversList`) plus the server counts in `/me/stats`. No major refactor required.
- Design-style.md is authoritative for pixel values — resist rounding. The 528-wide Highlight card, 680-wide Kudo Post card, 422-wide sidebar, and 1157×548 Spotlight canvas are fixed at the 1440 desktop design.

### Revision history

- **rev 6 (2026-04-21, fifth review pass — implementation trade-offs resolved)** — Applied all 8 Q-P decisions.
  **Q-P6 is a real scope change**: Spotlight is now **top 20 recipients by `kudos_count` in the rolling last 24 hours** (not most-recent 500 event-wide). Rewrote the `/api/spotlight` SQL (aggregate + 24h window + 20-row LIMIT), reshaped `SpotlightNode` (drops `kudoId` + `receivedAt`, adds `kudosCount` + `lastReceivedAt`, node id = `employee_id`), re-scoped the `total` field (event-wide, not 24h), changed node click → `/profile/{id}` (no Kudo detail page per Q-A1), added a "quiet-window empty state", clarified realtime now touches only the total label + recent-receiver log (canvas redraws only on 5-min poll). Updated api-docs.yaml schemas + Spotlight endpoint description. Updated BACKEND_API_TESTCASES SPOTLIGHT_01..11 and added SPOTLIGHT_09a/b, 12, 13, 14 (window rollover, deleted-employee exclusion, public-cache sharing).
  **Other Q-P items**: Q-P1 composite cursor, Q-P2 install gesture libs, Q-P3 unified 404, Q-P4 no heart realtime, Q-P5 flat dropdown, Q-P7 skip channel payload audit, Q-P8 keep public edge cache — all locked into the plan. Risks updated: 500-row-cap risk removed, two new risks added (quiet-window empty canvas, top-20 long-tail exclusion).
- **rev 5 (2026-04-21, fourth review pass — scope resolutions)** — Applied product decisions on Q-A1 / Q-A2 / Q-A3. Q-A1: "Xem chi tiết" + "Copy Link" buttons are **permanently disabled** this release; US5 moved to Out of Scope; `/kudos/[id]` detail page not built; related risks removed. Q-A2: Hashtag filter dropdown caps at **top 10 by `usage_count DESC`** via new `GET /api/hashtags?limit=10&sort=usage` param; removed the "hashtag scale" risk; added a tiny trade-off risk (long-tail tags only reachable via chip click). Q-A3: `departments` rows are **manually imported** by ops — no HR sync automation, no admin UI; External-dependencies section updated. Phase 4 renamed to drop US5. Updated Out-of-scope table, Summary, test scenarios, and project-structure notes consistently.
- **rev 4 (2026-04-21, third review pass)** — Corrected dep status: `@axe-core/playwright ^4.11.2` and `@playwright/test ^1.59.1` are **already installed** — removed from "new deps to add" table. Noted `supabase/snippets/` exists but is empty — Phase 1 now explicitly creates `seed-kudos-test.sql` fresh (Viết Kudo's plan listed the file but it never shipped). Confirmed `/api/_test/sign-in` is already present → E2E auth helper is reused verbatim. Added `app/api/_test/revalidate/route.ts` as a NEW test-only handler to clear `unstable_cache` between integration tests (same secret-gated pattern as sign-in).
- **rev 3 (2026-04-21, second review pass)** — Corrected 3 incorrect assumptions discovered by codebase verification: (1) `lib/auth/csrf.ts` / `requireCsrf()` helper does NOT exist — Viết Kudo ships without it; revised the Backend CSRF note to document the current `SameSite=Lax` + same-origin posture and flagged a security follow-up task. (2) `floating-ui` is NOT installed — replaced with the hand-rolled popover pattern already in use by `WriteKudoModal/HashtagPicker.tsx`; extracted to a shared `useAnchoredPosition` hook. (3) The dashboard layout applies `pt-16 lg:pt-20` to `<main>` for the fixed `AppHeader` — sidebar sticky offset corrected to `top-[88px] lg:top-[104px]`. Confirmed `AppFooter` is already mounted by the layout (no action needed). Added `lib/hooks/use-anchored-position.ts` to the new-files list and two new risks (CSRF-hardening-deferred, sticky-sidebar-overlaps-header).
- **rev 2 (2026-04-21, review pass)** — Added explicit out-of-scope table (profile preview popover, Kudo detail page, Secret Box, bonus-day, app footer). Replaced blocking `Promise.all` with streamed Suspense boundaries + 4 skeleton components for the "independent-skeletons" edge case. Expanded the `employees.department → department_id` migration ripple to list 5 coordinated changes. Added `ProfileHoverTarget` for FR-014, `MobileStatsBottomSheet` + trigger for mobile responsive. Added CSRF gate note to backend handlers. Added 4 new risks (Kudo detail page 404, hashtag-filter scale, popover-not-shipped, chip dispatch through virtualised cards) and 3 new open questions (Q-A1 detail page, Q-A2 dropdown scale, Q-A3 HR sync cadence). Dependency table now reflects `sonner` already installed + adds `@axe-core/playwright`.
- **rev 1 (2026-04-21)** — Initial plan for the Live board, built on the shipped Viết Kudo foundation. Covers 8 user stories, 6 new Route Handlers, 3 DB migrations, ~20 new components, and realtime scope limited to Spotlight only.
