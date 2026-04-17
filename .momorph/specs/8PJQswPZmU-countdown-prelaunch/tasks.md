# Tasks: Countdown - Prelaunch Page

**Frame**: `8PJQswPZmU-countdown-prelaunch`
**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [design-style.md](./design-style.md)
**Date**: 2026-04-17

---

## Task Format

```
- [ ] T### [P?] [Story?] Description | file/path.ts
```

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: User story label (US1, US2, US3, US4, US5); omitted for Setup / Foundation / Polish tasks
- **|**: File path affected by this task

All implementation tasks follow constitution §III (Red-Green-Refactor): failing test(s) MUST be written and confirmed to fail before the paired implementation task begins.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Add env vars, constants, theme token, and verify static assets so user-story work can proceed without blocking on config or file availability.

- [ ] T001 Add new env vars `NEXT_PUBLIC_LAUNCH_DATE` (ISO 8601 with offset, e.g. `2026-05-01T09:00:00+07:00`) and `PRELAUNCH_BYPASS_TOKEN` (server-only secret, no `NEXT_PUBLIC_` prefix); keep existing `NEXT_PUBLIC_EVENT_START_DATE` unchanged | .env
- [ ] T002 [P] Add the same two entries (with placeholder/example values) to the example env file; document the ISO 8601 + offset format in an inline comment | .env.local.example
- [ ] T003 [P] Append `--color-accent-gold: #FFEA9E` inside the existing `@theme inline` block (Tailwind v4 — reuse existing `--color-bg-primary: #00101A`; do NOT create a `tailwind.config.ts`) | app/globals.css
- [ ] T004 [P] Add prelaunch constants: `PRELAUNCH_COUNTDOWN_ROUTE = "/countdown"`, `PRELAUNCH_BYPASS_COOKIE = "prelaunch_bypass"`, `PRELAUNCH_BYPASS_HEADER = "x-prelaunch-bypass"` | lib/utils/constants.ts
- [ ] T005 [P] Verify `public/fonts/DigitalNumbers-Regular.woff` exists and add license file committed next to it (create `DigitalNumbers-LICENSE.txt` if missing) | public/fonts/DigitalNumbers-LICENSE.txt
- [ ] T006 [P] Place hero background asset at `public/images/prelaunch-bg.jpg` (production export from Figma node `2268:35129` when delivered; interim: copy from `public/images/homepage-hero-bg.jpg`) | public/images/prelaunch-bg.jpg

---

## Phase 2: Foundation (Blocking Prerequisites)

**Purpose**: Zod-validated launch-config helper + pure gate decision function + shared `<CountdownTimer>` refactor. Every user story depends on these three primitives.

**⚠️ CRITICAL**: No user story work (US1–US5) can begin until Phase 2 is complete.

### Configuration validation (TR-009, FR-011)

- [ ] T007 Write failing unit test for `launchConfigSchema` and `getLaunchConfig()`: valid ISO with offset returns `{ launchDate: Date }`; missing env returns `null` + `console.warn` called; unparseable value returns `null` + warning contains zod error (but NOT the raw env value) | tests/unit/launch-config.test.ts
- [ ] T008 Implement `launchConfigSchema = z.object({ launchDate: z.string().datetime({ offset: true }) })` and `getLaunchConfig(): { launchDate: Date } | null` (reads `process.env.NEXT_PUBLIC_LAUNCH_DATE`, parses with zod, returns null + warning on failure). MUST NOT fall back to `NEXT_PUBLIC_EVENT_START_DATE` | lib/validations/launch-config.ts

### Gate decision (FR-001, FR-004, FR-006, FR-011, FR-013, US-5)

- [ ] T009 Write failing unit test for `evaluatePrelaunchGate(request)` decision matrix: past-launch → `"pass"`; missing/invalid env → `"pass"` (fail-open); valid bypass header → `"pass"`; invalid bypass header → `"rewrite"`; missing bypass header during gate → `"rewrite"`; `prelaunch_bypass=1` cookie → `"pass"`; wrong-value cookie → `"rewrite"`; `/countdown` self-request → `"pass"`; `/api/*` during gate → `"pass"`; page path during gate → `"rewrite"` | tests/unit/prelaunch-gate.test.ts
- [ ] T010 Implement `evaluatePrelaunchGate(request: NextRequest): "rewrite" | "pass"` with branching from plan §Backend Approach (Steps 1–5). Use `crypto.timingSafeEqual`-based `safeCompare(a, b)` helper for token check. Export `secondsUntilLaunch(launchDate: Date): number` for future use | lib/utils/prelaunch-gate.ts

### Shared `<CountdownTimer>` refactor (TR-008, FR-002, FR-003, FR-009, FR-010, TR-004)

- [ ] T011 Write failing unit test `tests/unit/prelaunch-countdown.test.tsx` with cases: renders 3 unit blocks at `size="lg"` (77×123 cells) vs `size="sm"` (existing homepage sizes); **FR-009** zero-valued unit displays `00`; **FR-010** >99 days clamps to `99`; **FR-003 cadence** re-renders within 60 s when remaining > 2 min and within 5 s when remaining < 2 min (uses injected `clock` prop); **TR-004** server-rendered HTML snapshot shows `--` glyphs in all 6 digit cells; **TR-004** no React hydration warning (`console.error` spy) | tests/unit/prelaunch-countdown.test.tsx
- [ ] T012 Extract `components/shared/CountdownTimer.tsx` with `CountdownTimerProps = { targetDate: string; size?: "sm" | "lg"; title?: string; tickIntervalMs?: number; clock?: () => Date; onExpire?: () => void }`. Defaults: `size="sm"`, `tickIntervalMs=60_000`, `clock=() => new Date()`. Auto-drops interval to 5 s when remaining < 2 min. Do NOT read `Date.now()` or `process.env` inside render (TR-008). Server renders `--` placeholders. `size="lg"` uses Figma tokens (77×123 cells, 73.728 px Digital Numbers glyph, Montserrat 700 36 px labels) | components/shared/CountdownTimer.tsx
- [ ] T013 Delete the old file so the symbol resolves only from the shared location | components/homepage/CountdownTimer.tsx
- [ ] T014 Update the only existing consumer at line 2: change import to `@/components/shared/CountdownTimer`; explicitly pass `targetDate={process.env.NEXT_PUBLIC_EVENT_START_DATE ?? ""}` (homepage keeps the event-kickoff var, NOT the new launch-date var) | components/homepage/HeroBanner.tsx
- [ ] T015 Update import path to `@/components/shared/CountdownTimer`; add a `size="lg"` rendering assertion (digit cell dimensions, Montserrat label); keep existing homepage-cadence tests green | tests/unit/countdown-timer.test.tsx

**Checkpoint**: Gate helper + validated launch config + shared countdown timer are all green. Homepage smoke test passes. User-story work can now begin.

---

## Phase 3: User Story 1 — Visitor sees countdown before launch (Priority: P1) 🎯 MVP

**Goal**: When `now < NEXT_PUBLIC_LAUNCH_DATE`, every page route (`/`, `/login`, `/awards/*`, …) is internally rewritten to `/countdown` and displays the LED countdown; URL bar preserves the original path; tick updates without full reload. Auth callback and other `/api/*` routes continue to work.

**Independent Test**: Set `NEXT_PUBLIC_LAUNCH_DATE` to a future ISO, visit `/`, `/login`, and `/awards/xyz`; each serves the countdown page (same HTML) with `X-Robots-Tag: noindex, nofollow`. Wait 60 s → `MINUTES` decrements by 1.

### Tests (US1)

- [ ] T016 [P] [US1] Write failing integration test `middleware-prelaunch.test.ts` with NextRequest fixtures: `/login` + future launch date → rewrite response + `X-Robots-Tag` header (FR-001, FR-013); `/login` + past launch date → pass-through (FR-004); `/api/auth/callback` + future launch date → pass-through unchanged (FR-006 no-API scope); `/countdown` + future launch date → pass-through (self-loop guard); **FR-012** rewritten body MUST NOT contain Login-page markup | tests/integration/middleware-prelaunch.test.ts
- [ ] T017 [P] [US1] Write failing E2E happy-path test `prelaunch.spec.ts`: with future `NEXT_PUBLIC_LAUNCH_DATE`, navigate to `/`, `/login`, `/awards/xyz` → each renders `<h1>` with "Sự kiện sẽ bắt đầu sau"; URL bar preserves original path; DAYS/HOURS/MINUTES match a ±1-minute window | tests/e2e/prelaunch.spec.ts

### Frontend (US1)

- [ ] T018 [US1] Add `prelaunch` namespace with keys `title` and `srSummary` (placeholder args `{days}`, `{hours}`, `{minutes}`) to all three locale files. Vietnamese: `title` = "Sự kiện sẽ bắt đầu sau", `srSummary` = "Còn lại {days} ngày, {hours} giờ, {minutes} phút". English: "Event starts in" / "{days} days, {hours} hours, {minutes} minutes remaining". Japanese: "イベント開始まで" / "残り {days}日 {hours}時間 {minutes}分". Maintain key-set parity (checked by existing `tests/unit/i18n-key-parity.test.ts`) | messages/vi.json, messages/en.json, messages/ja.json
- [ ] T019 [P] [US1] Create minimal route-group layout: `<html lang={locale}><body>{children}</body></html>`. No `<AppHeader>` / `<AppFooter>`. Inherits globals from root `app/layout.tsx` (font CSS vars, globals.css) | app/(prelaunch)/layout.tsx
- [ ] T020 [P] [US1] Create Server Component `PrelaunchCountdown` — composition shell only (no `"use client"` directive). Renders: `<div className="relative min-h-screen w-full overflow-hidden bg-[color:var(--color-bg-primary)]">` wrapping (a) `<Image fill priority sizes="100vw" src="/images/prelaunch-bg.jpg" alt="" className="object-cover" />`, (b) cover gradient `<div aria-hidden className="absolute inset-0 pointer-events-none bg-[linear-gradient(18deg,#00101A_15.48%,rgba(0,18,29,0.46)_52.13%,rgba(0,19,32,0)_63.41%)]" />`, and (c) `<CountdownTimer size="lg" title={title} targetDate={launchDate} tickIntervalMs={60_000} />` (the only `"use client"` island) | components/prelaunch/PrelaunchCountdown.tsx
- [ ] T021 [US1] Create Server Component page. Body: call `getLaunchConfig()`; if `null` OR `new Date() >= config.launchDate`, `redirect("/")`. Export `export const dynamic = "force-dynamic"`. Export `metadata` including `robots: { index: false, follow: false }` and an `other` block injecting `<link rel="preload" as="image" fetchpriority="high" href="/images/prelaunch-bg.jpg">`. Render `<PrelaunchCountdown launchDate={config.launchDate.toISOString()} title={t('prelaunch.title')} />` | app/(prelaunch)/countdown/page.tsx

### Middleware integration (US1)

- [ ] T022 [US1] Insert `evaluatePrelaunchGate(request)` call at the very top of `middleware(request)` (above `updateSession()`). When result is `"rewrite"`, return `NextResponse.rewrite(new URL("/countdown", request.url))` with `X-Robots-Tag: noindex, nofollow` header; otherwise fall through to existing Supabase session + `PUBLIC_ROUTES` flow unchanged. Do NOT modify `config.matcher` | middleware.ts

**Checkpoint**: US-1 independently testable. MVP is shippable at this point.

---

## Phase 4: User Story 2 — Launch moment: gate lifts automatically (Priority: P1)

**Goal**: When `now ≥ NEXT_PUBLIC_LAUNCH_DATE`, the middleware no longer rewrites; clients seated on the countdown auto-navigate to `/` within 5 s; fresh visitors get normal routes.

**Independent Test**: Set `NEXT_PUBLIC_LAUNCH_DATE` to ~90 s in the future; open the page; wait 95 s → window navigates to `/` and Homepage renders.

### Tests (US2)

- [ ] T023 [P] [US2] Write failing E2E auto-lift test inside the existing prelaunch suite: set `NEXT_PUBLIC_LAUNCH_DATE = Date.now() + 90_000`, open `/`, wait 95 s, assert `page.url()` ends with `/` and the Homepage hero renders (not the countdown). Also assert middleware no longer injects `X-Robots-Tag` after crossing the boundary | tests/e2e/prelaunch.spec.ts

### Implementation (US2)

- [ ] T024 [US2] In the shared `<CountdownTimer>`, wire `onExpire` to `window.location.assign("/")` when `remaining <= 0` — hard navigation so middleware re-evaluates on the server. Guard with `useRef` so it fires exactly once. Client clamps `00/00/00` during the transition (spec Edge Case) | components/shared/CountdownTimer.tsx
- [ ] T025 [US2] In `app/(prelaunch)/countdown/page.tsx`, ensure the defensive `redirect("/")` (already added in T021) also fires when the gate server-side sees `now ≥ launchDate` — covers bookmarked/direct `/countdown` hits after launch | app/(prelaunch)/countdown/page.tsx

**Checkpoint**: US-1 + US-2 together form the shippable P1 slice.

---

## Phase 5: User Story 3 — Responsive experience (Priority: P2)

**Goal**: 3 unit blocks fit on a single row without horizontal scroll at 360 px, 768 px, and 1440 px viewports. Cell sizes follow design-style.md breakpoints (mobile 48×76, tablet 64×102, desktop 77×123). CLS < 0.1.

**Independent Test**: Playwright renders the page at three viewports; no horizontal scrollbar on `<body>`; visual regression screenshots match baselines.

### Tests (US3)

- [ ] T026 [P] [US3] Add visual regression spec using `toHaveScreenshot()` at 360×640, 768×1024, 1440×900 viewports; assert no horizontal scrollbar on `<body>` at 360 px; assert `hero-bg.jpg` is loaded via `<img>` element (proxy for `next/image priority`) | tests/e2e/prelaunch.spec.ts

### Implementation (US3)

- [ ] T027 [US3] Apply Tailwind responsive classes to digit cells and typography per `design-style.md` breakpoints. Mobile: `w-12 h-[76px] text-[44px]`; tablet: `sm:w-16 sm:h-[102px] sm:text-[60px]`; desktop: `lg:w-[77px] lg:h-[123px] lg:text-[73.728px]`. Title: `text-xl sm:text-3xl lg:text-4xl` (20/28→28/36→36/48). Gap between units: `gap-4 sm:gap-8 lg:gap-[60px]`. Page padding: `px-4 py-6 sm:px-8 sm:py-12 lg:px-36 lg:py-24`. Labels scale with the same ratios | components/shared/CountdownTimer.tsx
- [ ] T028 [US3] Ensure `PrelaunchCountdown` shell doesn't introduce horizontal overflow: the `relative min-h-screen w-full overflow-hidden` parent already prevents body-level scroll; verify via the new E2E test | components/prelaunch/PrelaunchCountdown.tsx

**Checkpoint**: US-1, US-2, US-3 complete.

---

## Phase 6: User Story 4 — Accessible countdown announcements (Priority: P2)

**Goal**: Screen readers announce title as H1 and remaining time politely (≤ 1 announcement per minute even when ticking at 5 s). Digit animations honor `prefers-reduced-motion: reduce`. axe-core scan reports zero WCAG 2.1 AA violations.

**Independent Test**: Run axe-core scan on the rendered page → zero AA violations. Toggle `prefers-reduced-motion: reduce` in Playwright → digit fade transition disabled (assert via computed style).

### Tests (US4)

- [ ] T029 [P] [US4] Add an axe-core scan step to the existing prelaunch E2E test using `@axe-core/playwright`; assert zero violations with `disableRules: []` (all WCAG 2.1 AA rules enabled). Second test case: emulate `prefers-reduced-motion: reduce` via `page.emulateMedia({ reducedMotion: "reduce" })`, assert digit-cell computed `transition-property === "none"` | tests/e2e/prelaunch.spec.ts

### Implementation (US4)

- [ ] T030 [US4] In `<CountdownTimer>` (`size="lg"` mode), add `role="timer"` and `aria-live="polite"` on the time region; set a dynamic `aria-label` from `t('prelaunch.srSummary', { days, hours, minutes })`. Throttle `aria-label` updates to once per minute (maintain a ref of the last announced minute-value; only update when it changes). On `size="sm"` mode, preserve existing homepage aria behavior to avoid regression | components/shared/CountdownTimer.tsx
- [ ] T031 [US4] Apply `motion-safe:transition-opacity motion-safe:duration-200 motion-reduce:transition-none` on the digit glyph element so the fade animation skips when the user prefers reduced motion. No JS-side `matchMedia` needed — Tailwind's `motion-reduce:` variant handles it | components/shared/CountdownTimer.tsx

**Checkpoint**: US-1 through US-4 complete.

---

## Phase 7: User Story 5 — Operator / E2E bypass (Priority: P3)

**Goal**: Valid `x-prelaunch-bypass: <PRELAUNCH_BYPASS_TOKEN>` header OR pre-set `prelaunch_bypass=1` cookie short-circuits the gate. Invalid/missing credentials behave as a normal visitor.

**Scope**: Bypass **recognition** only. Admin endpoint to issue the cookie is a follow-up ticket; operators set the cookie via devtools and Playwright sets it via `context.addCookies`.

**Independent Test**: Start server with `PRELAUNCH_BYPASS_TOKEN=secret` and future launch date; `curl -H "x-prelaunch-bypass: secret" /` → Homepage HTML. With `x-prelaunch-bypass: wrong` → Countdown HTML.

### Tests (US5)

- [ ] T032 [P] [US5] Extend `prelaunch-gate.test.ts` with bypass cases: valid token (matching `PRELAUNCH_BYPASS_TOKEN`) → `"pass"` (US-5 Accept 1); invalid token → `"rewrite"` (US-5 Accept 3); missing header → `"rewrite"`; `prelaunch_bypass=1` cookie present → `"pass"` (US-5 Accept 2); cookie with different value → `"rewrite"`; token comparison uses `safeCompare` helper and does NOT early-return on length mismatch | tests/unit/prelaunch-gate.test.ts
- [ ] T033 [P] [US5] Add E2E scenarios to the existing prelaunch suite: (a) set `prelaunch_bypass=1` cookie via `context.addCookies` → requesting `/` renders Homepage (US-5 Accept 2); (b) send `x-prelaunch-bypass: $TOKEN` header → Homepage (US-5 Accept 1); (c) send `x-prelaunch-bypass: wrong` → Countdown rendered (US-5 Accept 3) | tests/e2e/prelaunch.spec.ts

### Implementation (US5)

- [ ] T034 [P] [US5] Create a reusable Playwright fixture that calls `context.addCookies([{ name: "prelaunch_bypass", value: "1", domain: "localhost", path: "/" }])` before each test. Apply this fixture to all non-prelaunch E2E suites (homepage, auth) so they continue to work even if CI sets a future `NEXT_PUBLIC_LAUNCH_DATE` | tests/e2e/fixtures/bypass-cookie.ts
- [ ] T035 [US5] Create dedicated Playwright config that boots `npm run dev` with `env: { NEXT_PUBLIC_LAUNCH_DATE: "<future ISO>" }` and restricts `testMatch` to `tests/e2e/prelaunch.spec.ts` only. Leave the main `playwright.config.ts` untouched so existing homepage/auth tests don't regress. Add an `npm` script to run it (e.g. `"test:e2e:prelaunch": "playwright test --config=playwright.prelaunch.config.ts"`) | playwright.prelaunch.config.ts, package.json
- [ ] T036 [US5] Add bypass logic inside `evaluatePrelaunchGate`: read `request.headers.get(PRELAUNCH_BYPASS_HEADER)` and `request.cookies.get(PRELAUNCH_BYPASS_COOKIE)?.value`. If header matches `process.env.PRELAUNCH_BYPASS_TOKEN` (via `safeCompare`) OR cookie value equals `"1"`, return `"pass"`. Never log the header value | lib/utils/prelaunch-gate.ts

**Checkpoint**: All user stories (US-1 through US-5) complete.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Verify SCs, add observability stub, and harden the deployed build.

- [ ] T037 [P] Add observability stub per TR-007. Inside `evaluatePrelaunchGate`, before returning `"rewrite"`, emit `console.info(JSON.stringify({ event: "prelaunch.gate.active", path, remainingSeconds }))` — rate-limited to once per IP per 5-minute window using an in-memory `Map<string, number>` keyed by `request.ip ?? "unknown"`. Mark with `// TODO(logger): migrate to project structured logger once chosen` | lib/utils/prelaunch-gate.ts
- [ ] T038 [P] Verify Lighthouse Performance ≥ 90 on mobile (3G throttle) against a deployed preview of `/` while gate is active; attach report to PR. LCP ≤ 2.5 s confirms the preload + `next/image priority` combo works (SC-004) | (verification only — no file change)
- [ ] T039 [P] Verify CLS < 0.1 on slow 3G using Chrome DevTools → Performance → Layout Shifts panel. Sanity-check: `--` placeholder glyphs MUST use identical font + font-size + cell dimensions as live digits; hero `<Image>` MUST be inside a fixed-dim `relative` parent (SC-005) | (verification only — no file change)
- [ ] T040 [P] Verify FR-013 HTTP + HTML directives: `curl -I http://localhost:3000/` while gate is active shows `X-Robots-Tag: noindex, nofollow`; page HTML contains `<meta name="robots" content="noindex, nofollow">` | (verification only — no file change)
- [ ] T041 [P] Cross-browser smoke test: Chrome, Safari, Firefox desktop + mobile Safari on iOS simulator. Verify LED rendering, auto-lift behavior, and backdrop-filter support (fallback acceptable on Firefox < 103 per caniuse) | (verification only — no file change)
- [ ] T042 Run full test suite and i18n parity check: `npm run lint`, `tsc --noEmit`, `vitest run`, `playwright test`, `playwright test --config=playwright.prelaunch.config.ts`. All must be green. Confirm `tests/unit/i18n-key-parity.test.ts` still passes after the `prelaunch` namespace addition | (verification only — no file change)

**Checkpoint**: Feature is ship-ready; all SCs (SC-001 through SC-006) verified.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 Setup** (T001–T006): independent tasks, all parallelizable; no dependency on other phases.
- **Phase 2 Foundation** (T007–T015): depends on Phase 1. Within Phase 2, tests come before implementation (T007→T008, T009→T010, T011→T012). T013 (delete old file), T014 (update HeroBanner), T015 (update existing test) are sequenced after T012 (new shared component exists). **Blocks all user stories.**
- **Phase 3 US-1** (T016–T022): depends on Phase 2 complete.
- **Phase 4 US-2** (T023–T025): depends on US-1 (reuses middleware + page) but extends the `<CountdownTimer>` via its `onExpire` prop.
- **Phase 5 US-3** (T026–T028): depends on US-1 (the page must exist); largely orthogonal to US-2.
- **Phase 6 US-4** (T029–T031): depends on US-1; can run in parallel with US-3.
- **Phase 7 US-5** (T032–T036): depends on Phase 2 (gate helper exists) but does not need Phases 3–6 complete; can start right after Phase 2.
- **Phase 8 Polish** (T037–T042): depends on all desired user stories complete.

### Within Each User Story

- Tests MUST be written and confirmed to fail before the paired implementation task begins (constitution §III).
- Foundation refactor (T012) MUST precede all user-story work.
- `messages/*.json` changes (T018) MUST precede the page/component work that reads them (T020, T021, T030).
- Middleware wiring (T022) depends on the gate helper (T010).

### Parallel Opportunities

- **Phase 1**: T002, T003, T004, T005, T006 all parallel (different files). T001 sequences before T002 only if the dev wants to verify `.env` first; they can also be parallel.
- **Phase 2**: T007 ∥ T009 ∥ T011 (different test files). Implementation tasks T008, T010, T012 then run sequentially against their tests. T014 is sequential after T012+T013.
- **Phase 3**: T016 ∥ T017 (different test files). T019 ∥ T020 are parallel (different files). T018, T021, T022 sequential after their prerequisites.
- **Phase 7**: T032 ∥ T033 ∥ T034 all parallel. T036 is the only implementation-touching-gate-helper task in this phase.
- **Phase 8**: T037, T038, T039, T040, T041 all parallel (verifications against different concerns). T042 runs last.
- Different user-story phases can proceed in parallel by different team members once Phase 2 is complete.

---

## Implementation Strategy

### MVP First (Recommended)

1. Complete Phase 1 (Setup) + Phase 2 (Foundation).
2. Complete Phase 3 (US-1) + Phase 4 (US-2) — together these form the shippable P1 slice.
3. **STOP and VALIDATE**: Set `NEXT_PUBLIC_LAUNCH_DATE` to ~90 s in the future on a staging preview; confirm gate → countdown → auto-lift flow end-to-end.
4. Deploy MVP if ready.

### Incremental Delivery (Recommended for staged rollout)

1. MVP = Phase 1 + 2 + 3 + 4 (US-1 + US-2). Ship.
2. Add Phase 5 (US-3 Responsive) → Test → Ship.
3. Add Phase 6 (US-4 A11y) → Test → Ship.
4. Add Phase 7 (US-5 Bypass) → Test → Ship.
5. Phase 8 Polish before final launch-readiness sign-off.

### Parallelized Delivery (If multiple engineers)

- After Phase 2 completes, split the team: one engineer takes US-1 + US-2 (the MVP slice); another takes US-5 (Bypass, independent); a third takes US-3 + US-4 (sequential, touch `<CountdownTimer>`).

---

## Notes

- Commit after each task (or tight logical group like T007+T008 if the test-then-impl pair is trivial).
- Mark tasks complete as you go: `- [x] T###`.
- For any task that ends up touching > 300 lines in a single file, split the file per constitution §I.
- The outstanding spec round-3 follow-up (TR-006 i18n path: `/i18n/*/countdown.json` vs real `messages/{locale}.json`) is a **documentation-only** patch; this task list already uses the correct paths and does not block on the spec correction.
- Hero background asset (T006): if production export is not delivered by Phase 3 start, the interim `homepage-hero-bg.jpg` copy is acceptable; swap in the final asset before launch.
- `/api/admin/prelaunch-bypass` endpoint (admin-issued cookie flow) is filed as a separate ticket — not included here per plan scope decision.
