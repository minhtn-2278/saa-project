# Feature Specification: Countdown - Prelaunch Page

**Frame ID**: `2268:35127`
**Frame Name**: `Countdown - Prelaunch page`
**Screen ID**: `8PJQswPZmU`
**File Key**: `9ypp4enmFmdK3YAFJLIu6C`
**Created**: 2026-04-17
**Status**: Draft

---

## Overview

The **Prelaunch Countdown** is a full-screen gatekeeper page displayed to every visitor of the SAA website **before the official launch date/time**. It visually announces the upcoming event and shows a live-updating countdown in days, hours, and minutes until the site goes live.

**Gatekeeper behavior**: When `now < NEXT_PUBLIC_LAUNCH_DATE`, `middleware.ts` MUST rewrite every non-exempt request to the canonical route **`/countdown`** (the prelaunch page lives at `app/(prelaunch)/countdown/page.tsx`). The URL bar remains the originally requested path (internal rewrite, not redirect). When `now >= NEXT_PUBLIC_LAUNCH_DATE`, the gate is lifted and normal routing resumes (Homepage, Login, etc. — see `.momorph/SCREENFLOW.md`).

The site-launch moment is sourced from the environment variable **`NEXT_PUBLIC_LAUNCH_DATE`** (ISO 8601 with timezone offset, e.g., `2026-05-01T09:00:00+07:00`). This is a **distinct** variable from the existing `NEXT_PUBLIC_EVENT_START_DATE` — the latter represents the kickoff of the awards event itself (used by award-flow logic), whereas `NEXT_PUBLIC_LAUNCH_DATE` governs only the website-availability gate. They may hold different values and MUST NOT be conflated. A static/system bypass exists so operators and E2E tests can still reach non-public routes if needed.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Visitor sees countdown before launch (Priority: P1)

A first-time visitor opens the SAA website before the official launch date. The server responds with a branded full-screen "event starts in…" page, showing days/hours/minutes remaining. They cannot navigate to any other page of the site. The countdown updates without a full refresh.

**Why this priority**: This is the entire purpose of the feature — ensure no visitor can access the site prior to launch, while giving them a clear, on-brand anticipatory experience. Without this, the pre-launch phase has no gate.

**Independent Test**: Set `NEXT_PUBLIC_LAUNCH_DATE` to a future ISO timestamp, then visit any route (`/`, `/login`, `/awards/x`). Verify the countdown page is rendered on every route, counters are non-negative, and the title string "Sự kiện sẽ bắt đầu sau" is visible.

**Acceptance Scenarios**:

1. **Given** `now = 2026-04-17T10:00:00+07:00` and `NEXT_PUBLIC_LAUNCH_DATE = 2026-05-01T00:00:00+07:00`, **When** the user navigates to `https://<site>/`, **Then** the middleware internally rewrites to `/countdown`, the Prelaunch page renders, and it displays `DAYS = 13`, `HOURS = 14`, `MINUTES = 00` (± 1 min tolerance). The URL bar still shows `/`.
2. **Given** the Prelaunch page is open, **When** the user navigates to `/login` or `/awards/xyz`, **Then** the middleware rewrites each request to `/countdown` and the prelaunch page is rendered again (no 404, no login form leaked, no Supabase session warm-up).
3. **Given** the Prelaunch page is rendered, **When** 60 seconds pass without the user interacting, **Then** the `MINUTES` value decrements by exactly 1 (and `HOURS`/`DAYS` cascade when applicable) without a full page reload.

---

### User Story 2 - Launch moment: gate lifts automatically (Priority: P1)

When the official launch datetime is reached, the countdown page must stop blocking routes. Any visitor who was already sitting on the countdown page sees a graceful transition into the real homepage, and anyone who arrives from then on is routed normally.

**Why this priority**: A stale countdown that persists past the launch moment breaks trust and blocks launch-day traffic. The transition MUST be automatic and robust to clock drift of a few seconds.

**Independent Test**: Set `NEXT_PUBLIC_LAUNCH_DATE` to ~90 seconds in the future, open the countdown, wait past it. Confirm the page redirects/reloads to the Homepage (`/`) within 5 seconds of crossing the boundary.

**Acceptance Scenarios**:

1. **Given** the Prelaunch page is open with `DAYS=00 HOURS=00 MINUTES=00` and the launch datetime has passed, **When** the client-side tick evaluates `now >= NEXT_PUBLIC_LAUNCH_DATE`, **Then** the page performs a hard navigation to `/` (Homepage) within ≤ 5 seconds of passing the boundary.
2. **Given** `now >= NEXT_PUBLIC_LAUNCH_DATE`, **When** a fresh visitor requests `/`, **Then** Next.js middleware does NOT rewrite to the countdown page and serves the Homepage directly.
3. **Given** `now >= NEXT_PUBLIC_LAUNCH_DATE`, **When** a fresh visitor requests `/login`, **Then** the Login page is served (not the countdown).

---

### User Story 3 - Responsive experience on mobile & tablet (Priority: P2)

The countdown must be legible and on-brand on mobile phones (≥320 px wide), tablets, and desktop. Digit cells, gaps, and typography must scale proportionally without text wrapping, horizontal scrolling, or overlap.

**Why this priority**: A large share of the audience will share the pre-launch link on mobile. Broken mobile layouts reflect poorly on brand during the most-viewed phase. Not P1 because desktop is the Figma baseline.

**Independent Test**: Using browser devtools, emulate viewports at 360×640 (mobile), 768×1024 (tablet), 1440×900 (desktop). Verify the 3 unit blocks (DAYS/HOURS/MINUTES) fit on one row without horizontal scroll at each breakpoint, digits remain legible, and the title wraps cleanly.

**Acceptance Scenarios**:

1. **Given** viewport width = 360 px, **When** the Prelaunch page renders, **Then** all 3 unit blocks are visible on a single row and no horizontal scrollbar is present on `<body>`.
2. **Given** viewport width = 768 px, **When** the Prelaunch page renders, **Then** the padding, gap, and digit-cell size follow the Tablet values defined in `design-style.md`.
3. **Given** the user rotates from portrait to landscape, **When** the resize event fires, **Then** the layout reflows without layout shift > 0.1 (CLS target).

---

### User Story 4 - Accessible countdown announcements (Priority: P2)

Users with screen readers must understand the purpose of the page and the remaining time. Frequent value changes must not overwhelm assistive technology.

**Why this priority**: Accessibility is a constitution requirement (§V). Not P1 because the page is low-interactivity and passes basic semantics, but without this the page fails WCAG AA on assertive announcements.

**Independent Test**: Turn on VoiceOver / NVDA, load the page. Verify the page announces heading + remaining time in Vietnamese and that updates to `MINUTES` are announced politely (not every second), not every tick.

**Acceptance Scenarios**:

1. **Given** a screen reader is active, **When** the page loads, **Then** the user hears "Sự kiện sẽ bắt đầu sau" (as an H1) followed by a human-readable summary of remaining time (e.g., "Còn lại 13 ngày, 14 giờ, 0 phút").
2. **Given** a screen reader is active and `MINUTES` just decremented, **When** the value changes, **Then** the reader announces the new total politely (not interrupting) and NOT more than once per minute.
3. **Given** `prefers-reduced-motion: reduce`, **When** the digits update, **Then** the digit flip/fade animation is skipped and the value swaps instantly.

---

### User Story 5 - Operator / E2E bypass (Priority: P3)

During development, staging, or E2E automation, authorized users must be able to preview the real site even when the prelaunch gate is active.

**Why this priority**: Unblocks QA + demos without editing `.env`. P3 because it's an internal tool, not visitor-facing.

**Independent Test**: Send a request with header `x-prelaunch-bypass: <BYPASS_TOKEN>` (or cookie `prelaunch_bypass=1`) to `/` while `now < NEXT_PUBLIC_LAUNCH_DATE`. Confirm the Homepage renders instead of the Prelaunch page.

**Acceptance Scenarios**:

1. **Given** environment variable `PRELAUNCH_BYPASS_TOKEN` is set, **When** a request includes `x-prelaunch-bypass: <matching token>`, **Then** middleware skips the rewrite and the requested route renders normally.
2. **Given** a cookie `prelaunch_bypass=1` was set by an authorized admin tool, **When** the user navigates to any route, **Then** the gate is bypassed for the session.
3. **Given** an invalid or missing token, **When** the user tries to bypass, **Then** the Prelaunch page is served as for any other visitor (no info leakage).

---

### Edge Cases

- **Launch date in the past**: `NEXT_PUBLIC_LAUNCH_DATE < now` → the gate MUST NOT activate; homepage is served.
- **Missing or unparseable `NEXT_PUBLIC_LAUNCH_DATE`**: fall back to gate-**open** (site is live). Log a warning server-side. Reason: fail-open is safer than bricking an already-launched site; misconfiguration should not block real users.
- **`NEXT_PUBLIC_LAUNCH_DATE` vs `NEXT_PUBLIC_EVENT_START_DATE`**: these two env vars are orthogonal. The gate MUST read only `NEXT_PUBLIC_LAUNCH_DATE`. If a developer accidentally deletes it but leaves `NEXT_PUBLIC_EVENT_START_DATE` defined, fail-open still applies (do NOT silently substitute the event-start value).
- **Clock skew**: user's device clock is wrong by hours. Since the server enforces the gate via middleware using server time, the visible countdown on client may be off but the gate decision stays correct. Client should reconcile against a `launchDate` prop sourced from server.
- **Sub-minute remaining**: when `< 1 minute` remains, `MINUTES` displays `00`. Per FR-003, the countdown is already ticking at 5 s when remaining < 2 min, so the expiry transition is caught within 5 s.
- **Very long duration (>99 days)**: digit cells show 2 digits only. If total days exceed 99, display `99` and do not overflow. This should never happen in practice but must not crash.
- **Negative remaining time**: clamp to `00/00/00`; trigger navigation to `/`.
- **Static assets & API routes**: middleware rewrite applies **only to page routes**. Static assets (`_next/*`, `favicon.ico`, `images/*`, image-extension requests — per the existing matcher at [middleware.ts:22-26](../../../middleware.ts)) and `/api/*` routes MUST pass through to existing handling (Supabase `updateSession()` + `PUBLIC_ROUTES`). See FR-006 for the authoritative rule. The prelaunch feature introduces no new API routes and does NOT block existing ones.
- **DST boundary**: launch timestamp must be stored WITH timezone. Use ISO 8601 with offset. All comparisons in UTC.
- **SSR/CSR mismatch**: The countdown values MUST be computed on the client after hydration. Server sends only the raw `launchDate` ISO string to avoid hydration mismatch warnings for a ticking value.

---

## UI/UX Requirements *(from Figma)*

> Visual specifications (colors, typography, spacing, node IDs, component states) live in [`./design-style.md`](./design-style.md). This section covers layout intent and interactions only.

### Screen Components

| Component | Description | Interactions |
|-----------|-------------|--------------|
| `BackgroundImage` (2268:35129) | Full-bleed `MM_MEDIA_BG Image` — hero visual | None |
| `CoverGradient` (2268:35130) | 18°-angled dark gradient overlay for text legibility | None |
| `CountdownSection` (2268:35131) | Centered flex container holding title + time row | None |
| `Title` (2268:35137) | Headline text: "Sự kiện sẽ bắt đầu sau" | None (static H1) |
| `TimeRow` (2268:35138) | Horizontal row of 3 unit blocks | None |
| `UnitBlock × 3` (2268:35139 / 35144 / 35149) | "1_Days", "2_Hours", "3_Minutes" — each: digit row + label | None |
| `DigitCell × 2 per unit` (Instance of componentId `186:2619`) | LED-styled 2-digit display (tens + units) | Value updates every minute |
| `UnitLabel` (2268:35143 / 35148 / 35153) | Uppercase "DAYS" / "HOURS" / "MINUTES" text | None |

### Navigation Flow

- **From**: Any incoming URL (`/`, `/login`, `/awards/*`, etc.) while gate is active.
- **To**:
  - On launch-moment crossing: client-side navigates to `/` (Homepage).
  - No other navigations originate from this page (by design — passive waiting).
- **Triggers**: System time crossing `NEXT_PUBLIC_LAUNCH_DATE`.

See `.momorph/SCREENFLOW.md` → "Pre-Launch" gateway group for the full gate topology.

### Visual Requirements

- **Responsive breakpoints**: mobile (<640 px), tablet (640–1023 px), desktop (≥1024 px). Exact values per `design-style.md`.
- **Animations/Transitions**: optional 200ms fade on digit change; full page 300ms fade-in on mount. Honor `prefers-reduced-motion: reduce`.
- **Accessibility**: WCAG 2.1 AA. Title as `<h1>`; `role="timer"` + `aria-live="polite"` on time region; combined `aria-label` summarising time in Vietnamese.
- **No icons**, no interactive controls, no forms.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST rewrite every non-exempt incoming HTTP request to the canonical route `/countdown` (served by `app/(prelaunch)/countdown/page.tsx`) when the server's current UTC time is before `NEXT_PUBLIC_LAUNCH_DATE`. The rewrite MUST be an internal rewrite (not a 3xx redirect) so the URL bar preserves the original path.
- **FR-002**: System MUST compute the remaining time as `NEXT_PUBLIC_LAUNCH_DATE − now` and display the result in three units — days, hours, minutes — each as 2-digit LED-style cells.
- **FR-003**: System MUST update the displayed minutes/hours/days on the client without a full page reload. Baseline tick cadence is **at least once per minute**; it MUST accelerate to **at least once every 5 seconds** when remaining time drops below 2 minutes, so the expiry transition (FR-005) is not missed. A display that is up to 60 s stale when remaining > 2 min is acceptable (minute-precision display).
- **FR-004**: System MUST stop rendering the prelaunch page and serve normal routes once the server's current UTC time is greater than or equal to `NEXT_PUBLIC_LAUNCH_DATE`.
- **FR-005**: System MUST redirect clients already sitting on the prelaunch page to `/` within 5 seconds of `now ≥ NEXT_PUBLIC_LAUNCH_DATE`.
- **FR-006**: System MUST rewrite **only page requests** (non-`/api/*` paths) to `/countdown`. The gate logic MUST early-return for: (a) `pathname === "/countdown"` itself (prevents infinite rewrite loop), and (b) `pathname.startsWith("/api/")` (all API routes pass through to existing `updateSession()` + `PUBLIC_ROUTES` flow, unchanged). Static assets are already excluded by the existing matcher at [middleware.ts:22-26](../../../middleware.ts) — this feature reuses that matcher and does NOT duplicate its exclusion list.
- **FR-008**: System MUST allow an operator bypass via header `x-prelaunch-bypass: <PRELAUNCH_BYPASS_TOKEN>` or cookie `prelaunch_bypass=1` (set only when a matching secret has been validated by an admin flow — out of scope here).
- **FR-009**: System MUST display `00` for any unit whose remaining amount is 0 (including when the gate is within its final minute).
- **FR-010**: System MUST cap the days digit at `99` if the remaining duration exceeds 99 days (non-blocking safety).
- **FR-011**: On missing or unparseable `NEXT_PUBLIC_LAUNCH_DATE`, system MUST fail **open** (no gate) and log a server-side warning. The system MUST NOT fall back to `NEXT_PUBLIC_EVENT_START_DATE` or any other env var.
- **FR-012**: The page MUST NOT expose any server-rendered content from other routes (e.g., no headless hints, no flash of homepage) during the gated phase.
- **FR-013**: While the gate is active, the prelaunch page MUST emit `<meta name="robots" content="noindex, nofollow">` and the middleware MUST set the response header `X-Robots-Tag: noindex, nofollow` on the rewritten response so search engines do not index the placeholder. After launch, both directives are removed automatically (the prelaunch page is no longer served).

### Technical Requirements

- **TR-001 (Performance)**: Page MUST achieve Lighthouse Performance ≥ 90 on mobile. LCP ≤ 2.5s with hero image preload. CLS < 0.1.
- **TR-002 (Security)**: The bypass token MUST be compared in constant time on the server. MUST NOT be prefixed with `NEXT_PUBLIC_` (server-only secret). Never log its value. Set bypass cookie as `HttpOnly; Secure; SameSite=Lax`.
- **TR-003 (Integration)**: Gate logic lives in the existing `middleware.ts` at the project root (see [middleware.ts:1-27](../../../middleware.ts)). It MUST be inserted **before** the current `updateSession()` call and the `PUBLIC_ROUTES` check, so that gated page requests short-circuit without warming a Supabase session. Reads `NEXT_PUBLIC_LAUNCH_DATE` from `process.env` at request time (Edge runtime). Uses server clock (`Date.now()`). MUST NOT read `NEXT_PUBLIC_EVENT_START_DATE` for gate decisions. The gate returns only `rewrite` (for gated page requests) or `pass` (everything else); there is **no API-blocking branch** — API routes are pass-through. Pseudocode:
  ```ts
  export async function middleware(request: NextRequest) {
    const gateDecision = evaluatePrelaunchGate(request);       // returns "rewrite" | "pass"
    if (gateDecision === "rewrite") {
      const response = NextResponse.rewrite(new URL("/countdown", request.url));
      response.headers.set("X-Robots-Tag", "noindex, nofollow");
      return response;
    }
    // Fall through to existing Supabase session + PUBLIC_ROUTES logic, unchanged.
    const { user, supabaseResponse } = await updateSession(request);
    ...
  }
  ```
- **TR-004 (SSR correctness)**: Initial server render of `<PrelaunchPage>` MUST NOT include any interpolated "live" countdown text. Server returns only the ISO `launchDate` string; client computes and paints `DAYS/HOURS/MINUTES` after hydration. This avoids React hydration mismatch warnings.
- **TR-005 (Font loading)**: Use `next/font` for Montserrat. Digital Numbers font MUST self-host with `font-display: swap` and `preload`. Avoid FOUC on title.
- **TR-006 (Internationalisation)**: Title string and screen-reader summary live in `/i18n/*/countdown.json` under the existing next-intl setup. Default locale "vi" is the Figma baseline.
- **TR-007 (Observability)**: Log an `info`-level structured event `prelaunch.gate.active` with `{path, remainingSeconds}` once per 5-minute window per IP to monitor traffic during the blackout.
- **TR-008 (Testability)**: Countdown component MUST accept `launchDate: string` and `now: () => Date` as props so tests can inject a fixed clock. Avoid reading `process.env` or `Date.now()` inside the render tree.
- **TR-009 (Boundary validation)**: Per constitution §II, `NEXT_PUBLIC_LAUNCH_DATE` MUST be validated with `zod` at the middleware boundary before use. Use `z.string().datetime({ offset: true })` (or `z.iso.datetime({ offset: true })` on zod v4) to require an ISO 8601 string with explicit timezone offset. On validation failure, trigger the FR-011 fail-open path and log the zod error message (without leaking the raw env value). The validator helper lives in `lib/validations/launch-config.ts`.

### Key Entities *(if feature involves data)*

- **LaunchConfig**: Ephemeral, sourced from `NEXT_PUBLIC_LAUNCH_DATE` (distinct from `NEXT_PUBLIC_EVENT_START_DATE`).
  - `launchDate: string` — ISO 8601 with timezone offset. Example: `"2026-05-01T09:00:00+07:00"`.
  - Not persisted in database. Pure env-driven.
  - **Semantic note**: `NEXT_PUBLIC_LAUNCH_DATE` marks when the website itself becomes publicly accessible. `NEXT_PUBLIC_EVENT_START_DATE` marks when the Sun Annual Awards event begins (different downstream use). Keep them separate even if values coincidentally match.
- **BypassToken** (optional, for US-5):
  - `token: string` — server secret, injected via `PRELAUNCH_BYPASS_TOKEN`.
  - No DB storage; validated via constant-time compare in middleware.

---

## API Dependencies

**None.** This feature is entirely env-var driven and requires no backend API endpoints. Existing API routes (e.g. `/api/auth/callback`) are **not affected** — the gate passes all `/api/*` requests through to existing middleware logic unchanged (see FR-006).

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: **Zero** visitors see Homepage/Login/Awards content during the pre-launch window. Verified via CDN/server logs: any 2xx HTML response whose body does NOT contain the prelaunch countdown markup (during blackout, non-bypass traffic) counts as a leak. Target: 0 leaks.
- **SC-002**: Countdown accuracy: displayed minutes value differs from true remaining minutes by ≤ 1 on 99% of page loads (measured across 100 synthetic checks at random moments).
- **SC-003**: Automatic lift at launch: ≥ 99% of clients seated on the countdown page at launch moment navigate to `/` within 5 seconds (measured via client analytics event `prelaunch.lifted`).
- **SC-004**: Lighthouse Performance ≥ 90 on 3G mobile for the `/` route while gate is active.
- **SC-005**: Zero Cumulative Layout Shift > 0.1 during the first 10 seconds.
- **SC-006**: Accessibility: axe-core automated scan on the rendered page reports zero violations of WCAG 2.1 AA rules.

---

## Out of Scope

- Seconds display (design intentionally omits it).
- "Notify me" email signup form (future enhancement).
- Social share buttons / OG image tuning (may be added to `<head>` metadata separately).
- Admin UI for setting the launch date at runtime (remains env-var-driven this phase).
- Multiple locale variants of the hero background image.
- Flip-clock animation. If desired, track as a P3 enhancement.
- Analytics consent banner; assume global banner exists elsewhere.

---

## Dependencies

- [x] Constitution document exists (`.momorph/constitution.md`) — Tailwind, Next.js App Router, TypeScript strict, Supabase all in scope.
- [x] API specifications — N/A. This feature requires no backend APIs.
- [x] Database design completed — no DB changes needed for this feature.
- [x] Screen flow documented (`.momorph/SCREENFLOW.md`) — Pre-Launch gateway was added in the same screenflow pass.
- [ ] `.env` and `.env.local.example` MUST add a new `NEXT_PUBLIC_LAUNCH_DATE` entry (ISO 8601 with tz offset, e.g. `2026-05-01T09:00:00+07:00`). Keep the existing `NEXT_PUBLIC_EVENT_START_DATE` unchanged — do not delete or reuse it.
- [ ] `/public/fonts/DigitalNumbers-Regular.woff2` (or `.ttf`) asset delivered + license verified.
- [ ] `/public/images/prelaunch-bg.jpg` — production hero asset exported from Figma node 2268:35129.
- [ ] i18n keys added to `/i18n/vi/countdown.json` (and `/i18n/en/countdown.json` if EN launch is in scope).

---

## Notes

- **Env variable naming**: Introduce a **new** env var `NEXT_PUBLIC_LAUNCH_DATE` dedicated to the website prelaunch gate. Do NOT reuse `NEXT_PUBLIC_EVENT_START_DATE` — that variable represents the event kickoff (award-flow logic) and is a semantically different concern. The two may hold different values. Document the required ISO 8601 + timezone format for `NEXT_PUBLIC_LAUNCH_DATE` in `.env.local.example` alongside (not replacing) the existing `NEXT_PUBLIC_EVENT_START_DATE` entry.
- **Middleware placement**: `middleware.ts` already exists at project root (confirmed [middleware.ts:1-27](../../../middleware.ts)). The current implementation invokes `updateSession()` then checks `PUBLIC_ROUTES`. The prelaunch gate logic MUST be added **above** the `updateSession()` call so it short-circuits before any Supabase calls (performance + no accidental session warmup during blackout). Reuse the existing `config.matcher` — do NOT duplicate the static-asset exclusion list.
- **Feature directory placement**: Per constitution §I (feature-based structure under `app/`), place the route at `app/(prelaunch)/countdown/page.tsx` with supporting components in `components/prelaunch/` (e.g., `CountdownTimer.tsx`, `DigitCell.tsx`, `UnitBlock.tsx`). The `(prelaunch)` route group keeps the URL as `/countdown` and isolates the feature's layout from authenticated shells.
- **Date/time library**: Use **native `Date` / `Date.now()`** for countdown math. Do NOT add `date-fns`, `luxon`, `dayjs`, or `moment` just for this feature — the arithmetic is `Math.max(0, launchMs - nowMs)` plus three integer divisions. The repo should stay lean until a second consumer justifies the dependency.
- **Hero image preload**: In `app/(prelaunch)/countdown/page.tsx`, add `export const metadata` with an `other` block that injects `<link rel="preload" as="image" fetchpriority="high" href="/images/prelaunch-bg.jpg">`. Combined with `next/image` `priority` on the same element, this guarantees LCP on the hero asset.
- **Hydration**: Because the countdown changes every minute, pass `launchDate` (ISO string) from server and compute remaining time entirely client-side inside a `"use client"` component. Server renders **`--` placeholder glyphs** for the 6 digit cells (same font, font-size, and cell dimensions as live digits). Because the server output is deterministic and does not attempt to interpolate a ticking value, there is **no hydration mismatch** — do NOT use `suppressHydrationWarning`. This fully satisfies TR-004.
- **E2E access during gate**: Playwright tests in `/tests/` already authenticate via fixtures; add a setup step that attaches the `prelaunch_bypass` cookie so existing suites continue to run during any CI window where `NEXT_PUBLIC_LAUNCH_DATE` is still in the future.
- **Design fidelity caveats**: Figma uses a placeholder `lightgray` for the background image. Final visual will only match spec once the production hero asset lands.
- **Timezone assumption**: Event is Vietnam-based (GMT+7). All countdown math happens in UTC; only presentation layer cares about locale.
