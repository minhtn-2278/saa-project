# Implementation Plan: Countdown - Prelaunch Page

**Frame**: `8PJQswPZmU-countdown-prelaunch`
**Date**: 2026-04-17
**Spec**: [`spec.md`](./spec.md)
**Design Style**: [`design-style.md`](./design-style.md)

---

## Summary

Ship a **middleware-enforced prelaunch gate** that rewrites every non-exempt request to `/countdown` while `now < NEXT_PUBLIC_LAUNCH_DATE`, rendering a full-bleed dark-navy page with a three-unit LED countdown (DAYS / HOURS / MINUTES).

Technical approach:

- **Gate**: Add a `evaluatePrelaunchGate()` helper at the top of the existing [`middleware.ts`](../../../middleware.ts), above `updateSession()`, with zod-validated env var parsing and constant-time bypass-token check.
- **UI**: Refactor the existing `components/homepage/CountdownTimer.tsx` into a shared `components/shared/CountdownTimer.tsx` that accepts `targetDate` + size variants (`sm` for homepage, `lg` for prelaunch). New `app/(prelaunch)/countdown/page.tsx` composes it with a full-page layout matching the Figma spec.
- **Hydration**: Server renders `--` digit placeholders with the real `launchDate` ISO passed as prop; client hydrates and ticks every 60 s (or 5 s when `< 2 min` remains). No `suppressHydrationWarning` needed.
- **Auto-lift**: When the tick evaluates `now ≥ launchDate`, the client issues `window.location.assign("/")` so the middleware reroutes cleanly.

No new dependencies. All capabilities (next-intl, zod, Tailwind 4, next/font local Digital Numbers) are already present.

---

## Technical Context

| Concern                        | Choice                                                                                                                                                                                                                                                                                                                            |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Language/Framework**   | TypeScript 5 / Next.js 16 (App Router, Edge middleware)                                                                                                                                                                                                                                                                           |
| **Primary Dependencies** | React 19, TailwindCSS 4, next-intl 4, zod 4                                                                                                                                                                                                                                                                                       |
| **Database**             | N/A (pure env-driven)                                                                                                                                                                                                                                                                                                             |
| **Testing**              | Vitest + @testing-library/react (unit), Vitest (integration), Playwright (E2E)                                                                                                                                                                                                                                                    |
| **State Management**     | Local component state (`useState`/`useEffect`). No global store needed.                                                                                                                                                                                                                                                       |
| **API Style**            | **None.** This feature requires no backend API endpoints.                                                                                                                                                                                                                                                                       |
| **Styling**              | Tailwind utilities +**Tailwind v4** `@theme inline` block in [app/globals.css](../../../app/globals.css). `--color-bg-primary: #00101A` is already defined there; we reuse it. Add `--color-accent-gold: #FFEA9E` (same value as existing `--color-btn-login`, but a distinct semantic alias for the LED cell border). |
| **i18n**                 | next-intl with cookie-based locale; messages in `messages/{vi,en,ja}.json` (nested namespaces)                                                                                                                                                                                                                                  |
| **Fonts**                | Already loaded:`localFont({src: "../public/fonts/DigitalNumbers-Regular.woff"})` → `--font-digital-numbers` CSS var (see [app/layout.tsx:15-20](../../../app/layout.tsx))                                                                                                                                                       |

---

## Constitution Compliance Check

*GATE: Must pass before implementation can begin*

- [X] **I. Clean Code**: Feature lives under `app/(prelaunch)/`; existing `CountdownTimer` is refactored (not duplicated) to satisfy DRY. All new files stay under 300 lines.
- [X] **II. Tech Stack**:
  - Next.js App Router route group `(prelaunch)` + Server Component page shell + `"use client"` for the ticking timer only.
  - `next/image` with `priority` for hero background.
  - TypeScript `strict: true`, no `any`.
  - zod validates `NEXT_PUBLIC_LAUNCH_DATE` at the middleware boundary (boundary validation per §II).
  - Tailwind v4 utilities only; new token `--color-accent-gold` added to the existing `@theme inline` block in [app/globals.css](../../../app/globals.css) (no `tailwind.config.ts` exists in this project).
  - No Supabase changes (no DB involvement).
- [X] **III. Test-First**: Red-Green-Refactor. Tests for gate decision, digit math, and E2E rewrite behavior written before implementation.
- [X] **IV. Security**:
  - Bypass token compared via constant-time equality; never logged.
  - `X-Robots-Tag: noindex, nofollow` set on rewritten responses.
  - Cookie `prelaunch_bypass` is `HttpOnly; Secure; SameSite=Lax`.
  - No user input → no XSS/injection surface; `dangerouslySetInnerHTML` not used.
- [X] **V. Responsive UI**:
  - Mobile-first Tailwind (`sm:`, `md:`, `lg:` variants).
  - `role="timer"` + `aria-live="polite"` + Vietnamese `aria-label` summary on the time region.
  - Title rendered as `<h1>`.
  - `prefers-reduced-motion: reduce` honored.
  - LCP target ≤ 2.5 s via `next/image priority` + `fetchpriority="high"` preload.

**Violations**: None.

---

## Architecture Decisions

### Frontend Approach

- **Component Structure**: Feature-based under `app/(prelaunch)/`; reusable `CountdownTimer` promoted to `components/shared/`.
- **Styling Strategy**: Tailwind v4 utilities only. Add `--color-accent-gold: #FFEA9E` to the existing `@theme inline` block in `app/globals.css` (project is Tailwind v4 — there is **no `tailwind.config.ts`** to edit). Reuse existing `--color-bg-primary: #00101A` for the page background. Digit-cell gradient is a Tailwind `bg-[linear-gradient(...)]` arbitrary value (not an inline `style` attribute) per constitution §II.
- **Data Fetching**: None. `launchDate` is injected into the client component as a prop, sourced from `process.env.NEXT_PUBLIC_LAUNCH_DATE` in the Server Component page.
- **Hydration Strategy**: Server renders `--` placeholder digits. Client computes and paints on mount. Confirms TR-004 (no mismatch).
- **Tick Strategy**: `setInterval` at 60 000 ms baseline, 5 000 ms when remaining < 2 min. `clearInterval` + hard navigate on `remaining ≤ 0`.
- **Reduced-motion**: `useReducedMotion` helper reads `matchMedia("(prefers-reduced-motion: reduce)")`; when true, digit-change fade transition is disabled via Tailwind `motion-safe:` / `motion-reduce:` variants.

### Backend Approach

- **Middleware (Edge runtime)**: Inject `evaluatePrelaunchGate(request)` at the top of [`middleware.ts`](../../../middleware.ts). Returns one of two outcomes (per spec FR-006 — no API-blocking branch):
  - `"rewrite"` → `NextResponse.rewrite(new URL("/countdown", request.url))` with `X-Robots-Tag: noindex, nofollow` header.
  - `"pass"` → fall through to existing `updateSession()` + `PUBLIC_ROUTES` flow, unchanged.
- **Branching in gate** (simplified — API routes always pass through):
  1. If gate not active (`now ≥ launchDate` or env missing/invalid) → `pass`.
  2. If bypass cookie/header valid → `pass`.
  3. If `pathname === "/countdown"` (self-loop guard) → `pass`.
  4. If `pathname.startsWith("/api/")` → `pass` (existing middleware handles auth callback etc.).
  5. Otherwise → `rewrite`.
- **Validation** (spec TR-009): `lib/validations/launch-config.ts` exports `launchConfigSchema = z.object({ launchDate: z.string().datetime({ offset: true }) })` and `getLaunchConfig()` returns `{ launchDate: Date } | null` (null → fail-open per FR-011, log zod error without raw value).
- **No API routes created, modified, or blocked** by this feature.

### Integration Points

- **Existing `middleware.ts`** — gate is the FIRST check; existing `updateSession()` + `PUBLIC_ROUTES` logic is untouched.
- **Existing `CountdownTimer`** in `components/homepage/` is refactored (moved, signature changed). Homepage consumer is updated in the same commit.
- **`app/layout.tsx`** already wires the `--font-digital-numbers` CSS variable; no changes needed there.
- **`messages/{vi,en,ja}.json`** — add new `prelaunch` namespace. Reuse `homepage.countdown.{days,hours,minutes}` labels (same words).
- **`lib/utils/constants.ts`** — add `PRELAUNCH_COUNTDOWN_ROUTE`, `PRELAUNCH_BYPASS_COOKIE`, and `PRELAUNCH_BYPASS_HEADER` constants. (No `PRELAUNCH_EXEMPT_API_PATHS` — under the no-API posture, all `/api/*` paths pass through uniformly; no allowlist needed.)

---

## Project Structure

### Documentation (this feature)

```text
.momorph/specs/8PJQswPZmU-countdown-prelaunch/
├── spec.md          # Feature spec (done)
├── design-style.md  # Visual spec (done)
├── plan.md          # This file
├── tasks.md         # Next: /momorph.tasks
└── assets/
    └── frame.png    # Figma reference (done)
```

### Source Code (affected areas)

```text
# NEW files
app/(prelaunch)/
├── layout.tsx                          # Minimal layout: <html><body> only, no auth shell
└── countdown/
    └── page.tsx                        # Server Component: reads env, renders <PrelaunchCountdown launchDate={...}/>

components/prelaunch/
└── PrelaunchCountdown.tsx              # Server Component — composition shell (Image + gradient + CountdownTimer). Only CountdownTimer is "use client".

lib/validations/
└── launch-config.ts                    # zod schema + getLaunchConfig() helper

lib/utils/
└── prelaunch-gate.ts                   # evaluatePrelaunchGate(request) pure function + secondsUntilLaunch()

tests/unit/
├── prelaunch-gate.test.ts              # Gate decision matrix (pass/rewrite/bypass — no API block)
├── launch-config.test.ts               # zod schema + getLaunchConfig fail-open behavior
└── prelaunch-countdown.test.tsx        # Digit rendering, role=timer, reduced-motion

tests/integration/
└── middleware-prelaunch.test.ts        # Middleware end-to-end via NextRequest fixtures

tests/e2e/
├── prelaunch.spec.ts                   # Full flow: gate active → rewrite → auto-lift on expiry
└── fixtures/
    └── bypass-cookie.ts                # Fixture adding prelaunch_bypass cookie so homepage/auth E2E tests don't hit the gate
playwright.prelaunch.config.ts          # NEW Playwright config — boots `npm run dev` with NEXT_PUBLIC_LAUNCH_DATE=<future>; runs only prelaunch.spec.ts

# MODIFIED files
middleware.ts                           # Insert evaluatePrelaunchGate() call at top
components/homepage/CountdownTimer.tsx  # DELETED (moved)
components/shared/CountdownTimer.tsx    # NEW location, prop-based targetDate + size variants
components/homepage/HeroBanner.tsx      # [verified consumer at HeroBanner.tsx:2] Change import from "./CountdownTimer" to "@/components/shared/CountdownTimer"; pass targetDate={process.env.NEXT_PUBLIC_EVENT_START_DATE ?? ""} (homepage continues to use the event-start var, NOT the new launch-date var)
tests/unit/countdown-timer.test.tsx     # Update import path + add size-variant tests
lib/utils/constants.ts                  # Add prelaunch constants
messages/vi.json                        # Add prelaunch.title + sr summary
messages/en.json                        # Add prelaunch.title + sr summary
messages/ja.json                        # Add prelaunch.title + sr summary
app/globals.css                         # Add --color-accent-gold: #FFEA9E inside existing @theme inline block (Tailwind v4 — no tailwind.config.ts in this project)
.env.local.example                      # Add NEXT_PUBLIC_LAUNCH_DATE, PRELAUNCH_BYPASS_TOKEN
.env                                    # Add NEXT_PUBLIC_LAUNCH_DATE (dev value: future date)
```

### Dependencies

**None to add.** Everything required (zod, next-intl, Tailwind 4, next/font, Vitest, Playwright, Testing Library) is already in [package.json](../../../package.json).

---

## Implementation Strategy

### Phase 0: Asset Preparation

- [ ] **Background image**: Export production hero asset from Figma node `2268:35129`. Save to `public/images/prelaunch-bg.jpg` ( `.jpg` or `.webp`, dimensions ≥ 1920×1080). Interim fallback: copy existing `public/images/homepage-hero-bg.jpg`.
- [ ] **Digital Numbers font**: Already present at `public/fonts/DigitalNumbers-Regular.woff`. Verify license file is committed next to it (`public/fonts/DigitalNumbers-LICENSE.txt`) — create if missing.
- [ ] **No other assets required** (no icons, no illustrations).

### Phase 1: Foundation (tests-first)

1. Write `tests/unit/launch-config.test.ts` — zod schema: valid ISO with offset ✓, missing var → `null`, unparseable → `null` + warning logged.
2. Write `tests/unit/prelaunch-gate.test.ts` — matrix: past-launch → `pass`; missing/invalid env → `pass` (fail-open); bypass cookie → `pass`; bypass header → `pass`; `/countdown` self-request → `pass`; `/api/*` during gate → `pass` (pass-through, not blocked); page path during gate → `rewrite`.
3. Implement `lib/validations/launch-config.ts` (zod) and `lib/utils/prelaunch-gate.ts`.
4. Add constants to `lib/utils/constants.ts`.
5. Run tests; all green.

### Phase 2: Shared component refactor (DRY the existing CountdownTimer)

1. Write failing test `tests/unit/prelaunch-countdown.test.tsx` with the following cases:
   - Renders 3 unit blocks + LED digits in `size="lg"` (77×123 px cells) vs `size="sm"` (existing homepage sizes).
   - **FR-009**: when `targetDate - now` yields 0 in any unit, that unit displays `00` (not blank, not `0`).
   - **FR-010**: when `targetDate - now` exceeds 99 days, the days cells clamp to `99` (verifies no cell-overflow when the duration is unreasonably large).
   - **FR-003 cadence**: with an injected `clock` ticking a fake time, the component re-renders within 60 s when `remaining > 2 min` and within 5 s when `remaining < 2 min`. Use Vitest `vi.useFakeTimers()` + `clock` prop to assert cadence.
   - **TR-004 hydration**: initial server-output HTML renders `--` glyphs in every digit cell (snapshot test of server-rendered markup). Client hydration replaces them with real digits without any React hydration warning (`console.error` spy assertion).
2. Extract `components/shared/CountdownTimer.tsx`:
   - Props:
     ```ts
     type CountdownTimerProps = {
       targetDate: string;                      // ISO 8601 with tz offset
       size?: "sm" | "lg";                      // default "sm" (homepage look)
       title?: string;                          // rendered above the time row as <h1> when size="lg"
       tickIntervalMs?: number;                 // default 60_000; auto-drops to 5_000 when remaining < 2 min
       clock?: () => Date;                      // TR-008 testability: default () => new Date()
       onExpire?: () => void;                   // fired once when remaining crosses ≤ 0
     };
     ```
   - Default `size="sm"` preserves existing homepage behavior.
   - `size="lg"` applies the Figma design (77×123 cells, 73.728 px digits, Montserrat 36 px labels).
   - **Do NOT read `Date.now()` or `process.env` inside render** — use the injected `clock` prop (TR-008). This lets Vitest tests swap in a fake clock without `vi.useFakeTimers()`.
3. Delete `components/homepage/CountdownTimer.tsx`. Update the only consumer [HeroBanner.tsx:2](../../../components/homepage/HeroBanner.tsx#L2) to import from `@/components/shared/CountdownTimer` and explicitly pass `targetDate={process.env.NEXT_PUBLIC_EVENT_START_DATE ?? ""}` — the homepage MUST continue reading `NEXT_PUBLIC_EVENT_START_DATE` (the event-kickoff var), NOT the new `NEXT_PUBLIC_LAUNCH_DATE` (the site-gate var). These are two distinct env vars (see spec Overview).
4. Update `tests/unit/countdown-timer.test.tsx` import path; add a `size="lg"` rendering test.
5. Run homepage smoke test: the existing homepage still renders correctly with small cells.

### Phase 3: US-1 — Visitor sees countdown before launch (P1)

1. Write failing integration test `tests/integration/middleware-prelaunch.test.ts` with the following cases:
   - Request to `/login` with future `NEXT_PUBLIC_LAUNCH_DATE` → receives a rewrite response with `X-Robots-Tag: noindex, nofollow` header (FR-001, FR-013).
   - Request to `/login` with past `NEXT_PUBLIC_LAUNCH_DATE` → passes through to existing auth middleware (FR-004, US-2 Accept 2–3).
   - Request to `/api/auth/callback` with future `NEXT_PUBLIC_LAUNCH_DATE` → **passes through unchanged** (FR-006: no-API scope; confirms gate does not break auth callback).
   - Request to `/countdown` with future `NEXT_PUBLIC_LAUNCH_DATE` → passes through (self-loop guard; FR-006).
   - **FR-012 (no content leak)**: the rewritten response body for `/login` MUST NOT contain any Login-page content (e.g. the string "Đăng nhập" / login button markup). Assert response HTML contains only prelaunch markup.
2. Insert `evaluatePrelaunchGate()` at the top of `middleware.ts`.
3. Create `app/(prelaunch)/layout.tsx` — minimal layout: `<html lang={locale}><body>{children}</body></html>`, **no `<AppHeader>`/`<AppFooter>`**. Inherits root `app/layout.tsx` globals.
4. Create `app/(prelaunch)/countdown/page.tsx` — **Server Component**:
   - Reads `process.env.NEXT_PUBLIC_LAUNCH_DATE` via `getLaunchConfig()`.
   - **Defensive server-side check**: if `getLaunchConfig()` returns `null` OR `new Date() >= config.launchDate`, `redirect("/")` — this protects against bookmarked/direct hits to `/countdown` after launch (middleware might be passing the request through in that state).
   - Exports `export const dynamic = "force-dynamic"` so the date comparison is not cached.
   - Exports `metadata` including `robots: { index: false, follow: false }` and an `other` block injecting `<link rel="preload" as="image" fetchpriority="high" href="/images/prelaunch-bg.jpg">`.
   - Renders `<PrelaunchCountdown launchDate={config.launchDate.toISOString()} title={t('prelaunch.title')} />`.
5. Create `components/prelaunch/PrelaunchCountdown.tsx` — **Server Component** (no `"use client"`). It's a pure composition shell:
   - `<div className="relative min-h-screen w-full overflow-hidden bg-[color:var(--color-bg-primary)]">`
   - `<Image fill priority sizes="100vw" src="/images/prelaunch-bg.jpg" alt="" className="object-cover" />` — empty `alt` because decorative; `sizes="100vw"` per constitution §V.
   - Cover gradient `<div aria-hidden className="absolute inset-0 pointer-events-none bg-[linear-gradient(18deg,#00101A_15.48%,rgba(0,18,29,0.46)_52.13%,rgba(0,19,32,0)_63.41%)]" />`.
   - `<CountdownTimer size="lg" title={title} targetDate={launchDate} tickIntervalMs={60_000} />` — **this is the only `"use client"` island** on the page.
6. Add i18n keys to all three locale files (preserving parity so `tests/unit/i18n-key-parity.test.ts` stays green):
   - `messages/vi.json`: `prelaunch.title` = "Sự kiện sẽ bắt đầu sau", `prelaunch.srSummary` = "Còn lại {days} ngày, {hours} giờ, {minutes} phút"
   - `messages/en.json`: `prelaunch.title` = "Event starts in", `prelaunch.srSummary` = "{days} days, {hours} hours, {minutes} minutes remaining"
   - `messages/ja.json`: `prelaunch.title` = "イベント開始まで", `prelaunch.srSummary` = "残り {days}日 {hours}時間 {minutes}分"
7. Verify `tests/unit/i18n-key-parity.test.ts` still passes (all three locales have identical key sets).
8. Run integration + E2E tests.

### Phase 4: US-2 — Launch moment auto-lift (P1)

1. Write E2E test `tests/e2e/prelaunch.spec.ts`: set `NEXT_PUBLIC_LAUNCH_DATE` to `Date.now() + 90s`, open the page, wait 95 s, assert redirect to `/`.
2. Add `onExpire` callback to `<CountdownTimer>`: when `remaining <= 0`, call `window.location.assign("/")` (hard navigation so middleware re-evaluates).
3. Verify the middleware no longer rewrites after expiry (already handled by `evaluatePrelaunchGate` returning `pass`).

### Phase 5: US-3 — Responsive (P2)

1. Visual regression via Playwright `toHaveScreenshot()` at 360 × 640, 768 × 1024, 1440 × 900.
2. Apply Tailwind responsive classes per design-style.md breakpoints (mobile 48×76 cell, tablet 64×102, desktop 77×123).
3. Verify no horizontal scroll on smallest viewport.

### Phase 6: US-4 — Accessibility (P2)

1. Add `role="timer"`, `aria-live="polite"`, and dynamic `aria-label="Còn lại X ngày Y giờ Z phút"` on the time region.
2. Throttle `aria-label` updates to once per minute even when ticking at 5 s to avoid screen-reader floods.
3. Implement `motion-reduce:transition-none` on digit fades.
4. Run axe-core in the E2E test; assert zero WCAG AA violations.

### Phase 7: US-5 — Bypass (P3)

**Scope decision** (resolving US-5 "admin tool TBD" gap): this feature implements **bypass recognition only** — the gate accepts a valid `x-prelaunch-bypass: <token>` header or a pre-set `prelaunch_bypass=1` cookie. **Setting the cookie is out of scope** for this feature. Operators set it via browser devtools; Playwright sets it via `context.addCookies([...])`. A dedicated admin endpoint to issue the cookie (e.g. `/api/admin/prelaunch-bypass`) is a **follow-up ticket**.

1. Write unit test for bypass header recognition:
   - Valid token (matching `PRELAUNCH_BYPASS_TOKEN`) → gate returns `"pass"` (US-5 Accept 1).
   - **Invalid token** (wrong value) → gate returns `"rewrite"` (gate remains active) (US-5 Accept 3).
   - **Missing token** (no header present) → gate returns `"rewrite"` (US-5 Accept 3).
   - Token comparison uses `crypto.timingSafeEqual` wrapped in a length-tolerant helper (`safeCompare(a, b)`) to avoid early-return on length mismatch.
2. Write unit test for `prelaunch_bypass=1` cookie recognition:
   - Cookie present with value `"1"` → gate returns `"pass"` (US-5 Accept 2).
   - Cookie absent or with a different value → gate returns `"rewrite"`.
   - Rationale: cookie is a pure presence flag (cannot be forged to match a secret); trust originates from whoever set it.
3. Add both checks inside `evaluatePrelaunchGate`: a valid header OR cookie short-circuits to `"pass"`.
4. Document operator bypass procedure in the Notes section of this plan.
5. Add `tests/e2e/prelaunch.spec.ts` variants:
   - Set bypass cookie via `context.addCookies([...])` → homepage renders normally (US-5 Accept 2).
   - Send bypass header on request → homepage renders normally (US-5 Accept 1).
   - Send invalid bypass header → countdown page renders (US-5 Accept 3).

### Phase 8: Polish

- [ ] Verify Lighthouse Performance ≥ 90 (mobile, 3G) on a deployed preview (SC-004).
- [ ] **CLS < 0.1 verification** (SC-005): All digit cells have fixed `h-[123px] w-[77px]` (desktop) / responsive fixed sizes at each breakpoint. The `--` placeholder glyph uses the same font + font-size as live digits, so hydration swap causes no layout shift. Hero `<Image>` uses `fill` inside a `relative` full-screen parent with fixed dimensions — no shift on load. Verify with Chrome DevTools → Performance → "Layout shifts" panel on slow 3G.
- [ ] Confirm `X-Robots-Tag: noindex, nofollow` header via `curl -I http://localhost:3000/` while gate is active (FR-013).
- [ ] Confirm `<meta name="robots" content="noindex, nofollow">` in rendered HTML (FR-013).
- [ ] Cross-browser check: Chrome, Safari, Firefox, mobile Safari.
- [ ] **Observability stub** (TR-007): inside `evaluatePrelaunchGate`, call `console.info(JSON.stringify({ event: "prelaunch.gate.active", path, remainingSeconds }))` once per IP per 5-min window (use an in-memory Map keyed by IP → last-logged-at). Mark with `// TODO(logger): migrate to project structured logger once chosen.` This satisfies TR-007 today without blocking on the logger decision.

---

## Testing Strategy

| Type          | Focus                                                                   | Tooling                         | Target                                        |
| ------------- | ----------------------------------------------------------------------- | ------------------------------- | --------------------------------------------- |
| Unit          | `evaluatePrelaunchGate()` decision matrix, zod schema, countdown math | Vitest                          | 100% of gate branches                         |
| Unit          | `<CountdownTimer>` rendering (both sizes), reduced-motion behavior    | Vitest + @testing-library/react | 90% statements                                |
| Integration   | Middleware rewrite + `X-Robots-Tag` header + API pass-through behavior  | Vitest (NextRequest fixtures)   | Every FR-001, FR-006, FR-013 asserted |
| E2E           | US-1 (gate active), US-2 (auto-lift), US-5 (bypass cookie)              | Playwright                      | All P1 scenarios from spec                    |
| Accessibility | axe-core scan in E2E                                                    | @axe-core/playwright            | Zero WCAG 2.1 AA violations                   |

**Test data strategy**:

- **Vitest (unit/integration)**: `vi.stubEnv("NEXT_PUBLIC_LAUNCH_DATE", "<iso>")` per test; clock injected via `CountdownTimer`'s `clock` prop (TR-008) — no `vi.useFakeTimers()` needed for the component.
- **Playwright (E2E)**: the current `playwright.config.ts` uses `webServer.command: "npm run dev"` with no env override. Add a `webServer.env` property in a separate Playwright config for prelaunch E2E, e.g. `webServer: { command: "npm run dev", env: { NEXT_PUBLIC_LAUNCH_DATE: "<future ISO>" }, ... }`. Alternative: spawn a second `npm run dev` on a non-default port inside the test setup with the env var, then point `baseURL` at it. **Decision**: add a dedicated `playwright.prelaunch.config.ts` that boots a server with the gate active; leave the main config unchanged so existing homepage tests don't regress.
- **Bypass cookie for existing suites**: add a Playwright fixture that sets `prelaunch_bypass=1` cookie in `context` before each test. This lets all other E2E tests (homepage, auth) continue to run even if CI runs with a future `NEXT_PUBLIC_LAUNCH_DATE`.

---

## Integration Testing Strategy

### Test Scope

- [X] **Component interactions**: `<CountdownTimer>` renders correctly at both `size="sm"` and `size="lg"` without regressions on homepage.
- [X] **External dependencies**: None (no API calls).
- [X] **Data layer**: Not applicable.
- [X] **User workflows**: Incoming request → middleware gate → rewrite → countdown renders → tick → auto-lift.

### Test Categories

| Category            | Applicable? | Key Scenarios                                                   |
| ------------------- | ----------- | --------------------------------------------------------------- |
| UI ↔ Logic         | Yes         | Countdown math, reduced-motion, auto-lift navigation            |
| Service ↔ Service  | No          | No internal services                                            |
| App ↔ External API | No          | No external calls                                               |
| App ↔ Data Layer   | No          | Pure env-driven                                                 |
| Cross-platform      | Yes         | Responsive behavior at 3 breakpoints; Chrome + Safari + Firefox |

### Test Environment

- **Type**: Local Vitest + Playwright on `next dev` + CI on ephemeral Next.js build.
- **Test data strategy**: env-var injection per test (launchDate in future vs past).
- **Isolation**: Each Playwright test resets cookies; middleware is stateless so no cross-test leakage.

### Mocking Strategy

| Dependency             | Strategy                                                         | Rationale                      |
| ---------------------- | ---------------------------------------------------------------- | ------------------------------ |
| `Date.now()` / clock | Real in integration; **`clock` prop injection** (TR-008) in unit — `vi.useFakeTimers()` only when asserting `setInterval` cadence (FR-003) | Deterministic tick behavior; decouples render from real clock |
| `process.env`        | `vi.stubEnv` in unit; real in Playwright (with overrides)      | Exercise the same parsing code |
| Supabase               | N/A for prelaunch gate (short-circuits before `updateSession`) | Gate must NOT warm session     |

### Test Scenarios Outline

1. **Happy Path**

   - [ ] Gate active, anon user requests `/` → rewritten to `/countdown`, LED renders correct delta.
   - [ ] Launch moment crosses while page open → client navigates to `/` within 5 s.
   - [ ] Operator with bypass cookie requests `/` during gate → homepage renders.
2. **Error Handling**

   - [ ] Missing `NEXT_PUBLIC_LAUNCH_DATE` → fail-open, warning logged.
   - [ ] Invalid value (`"not-a-date"`) → fail-open, warning logged.
   - [ ] Launch date in past → gate inert, normal routing.
3. **Edge Cases**

   - [ ] Remaining > 99 days → digit cells clamp to `99`.
   - [ ] Remaining < 1 minute → 5 s polling kicks in, expiry detected within 5 s.
   - [ ] `prefers-reduced-motion: reduce` → digit fade animation disabled.
   - [ ] API request `/api/auth/callback` during gate → passes through unchanged (not rewritten, not blocked).

### Coverage Goals

| Area                      | Target         | Priority |
| ------------------------- | -------------- | -------- |
| Gate decision logic       | 100% branches  | High     |
| Countdown math + clamp    | 100% branches  | High     |
| E2E P1 flows (US-1, US-2) | 100% scenarios | High     |
| Responsive screenshots    | 3 breakpoints  | Medium   |

---

## Risk Assessment

| Risk                                                                        | Probability | Impact | Mitigation                                                                                                                                                                                       |
| --------------------------------------------------------------------------- | ----------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Refactor of existing `CountdownTimer` breaks homepage                     | Medium      | High   | Keep `size="sm"` as default, preserve existing Tailwind classes, run homepage smoke test before merging. Commit refactor + homepage consumer update in one atomic change.                      |
| Env var validation at Edge runtime rejected by Next.js                      | Low         | Medium | zod works in Edge (no Node APIs). Unit-test the validator in Vitest with Edge-compatible imports only.                                                                                           |
| Hero background asset not delivered in time                                 | Medium      | Low    | Use `public/images/homepage-hero-bg.jpg` as interim fallback; swap on delivery.                                                                                                                |
| Digital Numbers font swap flicker (FOUT) during load                        | Low         | Low    | Font is `display: "swap"` today. Cells are `77×123` — a one-frame FOUT is acceptable. Revisit with `display: "block"` only if QA flags it.                                               |
| Middleware running on `/countdown` itself causes rewrite loop             | Medium      | High   | Explicit early-return for `pathname === "/countdown"` in gate logic (FR-006). Integration test covers this.                                                                                    |
| Clock skew: client clock drifts → visible countdown wrong but gate correct | Low         | Low    | Documented as accepted risk in spec Edge Cases; server gate decision is authoritative.                                                                                                          |
| Launch-moment race: client ticks before server gate lifts                   | Low         | Medium | Auto-lift does `window.location.assign("/")` (hard nav) → server re-evaluates. If server still thinks we're pre-launch due to clock skew, user sees countdown again — acceptable for ≤ 5 s. |
| ~~API routes blocked with 503 breaks `/api/auth/callback`~~                | —           | —      | **Resolved.** Spec no longer blocks API routes during the gate; all `/api/*` requests pass through to existing handling. Not a risk for this feature.                                        |

### Estimated Complexity

- **Frontend**: Medium — refactor + new route group + responsive + a11y.
- **Backend**: Low — ~40 lines of middleware logic + zod schema.
- **Testing**: Medium — matrix of gate decisions + E2E with time injection.
- **Total**: ~1.5 engineer-days including refactor and tests.

---

## Dependencies & Prerequisites

### Required Before Start

- [x] `constitution.md` reviewed.
- [x] `spec.md` complete and consistent — round-3 fixes merged: stale Edge Case bullet replaced with pointer to FR-006; FR-007 removed (no-API scope); TR-004 + Notes hydration wording aligned on `--` placeholder strategy; TR-009 zod validation added.
- [x] `design-style.md` complete.
- [x] `.momorph/contexts/BACKEND_API_TESTCASES.md` — N/A for this feature (no backend API work).
- [ ] Spec TR-006 i18n path still references `/i18n/*/countdown.json` — real project uses `messages/{locale}.json`. Correct in a follow-up spec-patch PR; plan already proceeds with the correct path.

### External Dependencies

- **Hero background image** exported from Figma (designer delivery).
- **Launch date value** for `.env` (product-owner decision — may differ from `NEXT_PUBLIC_EVENT_START_DATE`).
- **`PRELAUNCH_BYPASS_TOKEN`** value for staging/CI (ops/DevOps).

---

## Next Steps

After plan approval:

1. Run `/momorph.tasks` to generate the task breakdown from this plan.
2. Begin implementation phase-by-phase, Red-Green-Refactor per task.
3. In a separate follow-up PR: patch spec TR-006 to reference `messages/{locale}.json` instead of `/i18n/*/countdown.json`. Non-blocking.

---

## Notes

### Discrepancies between spec and actual codebase (status)

- **Spec TR-006 i18n path** ⏳ **Not yet patched in spec**: Spec still says `/i18n/*/countdown.json`. Actual project uses flat `messages/{locale}.json` with nested namespaces. Plan proceeds with the correct path (`messages/{vi,en,ja}.json` + `prelaunch` namespace). File a follow-up spec-patch PR; non-blocking.
- **Spec FR-003 update cadence** ✅ **Resolved**: Spec FR-003 now specifies the hybrid cadence (60 s baseline, 5 s when remaining < 2 min). Plan and spec agree.
- **Spec Notes "suppressHydrationWarning"** ✅ **Resolved**: Spec Notes now explicitly say "do NOT use `suppressHydrationWarning`" and align with TR-004 via the `--` placeholder strategy.

### Operator bypass procedure

1. Set `PRELAUNCH_BYPASS_TOKEN=<rotated-secret>` in the environment (server-only, no `NEXT_PUBLIC_` prefix).
2. **One-shot request**: `curl -H "x-prelaunch-bypass: $TOKEN" https://<site>/`.
3. **Persistent session — browser**: open DevTools → Application → Cookies → add `prelaunch_bypass=1` (HttpOnly unset since dev tools can't toggle it; acceptable for manual ops use). Refresh.
4. **Persistent session — Playwright**: `context.addCookies([{ name: "prelaunch_bypass", value: "1", domain: "localhost", path: "/" }])` in the test fixture. Applied to all E2E tests except the prelaunch gate tests themselves.
5. **Admin-issued cookie (follow-up ticket)**: a dedicated `/api/admin/prelaunch-bypass` endpoint that validates the token server-side and issues `Set-Cookie: prelaunch_bypass=1; HttpOnly; Secure; SameSite=Lax; Max-Age=3600` is **out of scope for this feature** — filed as a separate ticket.

### Deferred / follow-up

- ~~`/api/health` and `/api/event/status` endpoints~~ — **removed from scope**. Spec no longer references any backend API; this feature is pure env-driven.
- `/api/admin/prelaunch-bypass` admin cookie-issuing endpoint (US-5 full implementation) — out of scope; this feature implements bypass recognition only.
- CSP header from constitution §IV not currently in `next.config.ts`. Cross-feature concern; handle in a platform-hardening ticket.
- Observability event `prelaunch.gate.active` (TR-007): **interim** `console.info(JSON.stringify(...))` stub implemented in Phase 8 with rate limiting. Migrate to a structured logger in a follow-up ticket when the project-wide logger is chosen.
- ~~Spec round-3 fixes~~ — **merged**. Spec is now consistent: no-API scope applied, hydration wording unified, TR-009 (zod validation) added.
