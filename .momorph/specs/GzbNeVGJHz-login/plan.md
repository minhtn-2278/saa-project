# Implementation Plan: Login

**Frame**: `GzbNeVGJHz-login`
**Date**: 2026-04-16
**Spec**: `specs/GzbNeVGJHz-login/spec.md`

---

## Summary

Implement the SAA 2025 Login screen as the application entry point using Supabase Auth with
Google OAuth (PKCE flow). The page is a Server Component with client-side interactive islands
for the Login button and Language selector. Includes i18n support for 3 locales (VN, EN, JP),
domain validation (Sun* accounts only), and responsive design from a dark cinematic Figma
design at 1440x1024px.

---

## Technical Context

**Language/Framework**: TypeScript / Next.js 16 (App Router)
**Primary Dependencies**: React 19, TailwindCSS 4, Supabase JS + SSR, next-intl, Zod
**Database**: Supabase (PostgreSQL) — Auth handled by Supabase Auth, no custom tables
**Testing**: Vitest + Testing Library (unit/integration), Playwright (E2E)
**State Management**: React local state (no global store needed for login)
**API Style**: Next.js Route Handlers + Supabase client SDK

---

## Constitution Compliance Check

*GATE: Must pass before implementation can begin*

- [x] Follows project coding conventions (Principle I: feature-based, PascalCase components, kebab-case files)
- [x] Uses approved libraries and patterns (Principle II: Next.js App Router, Server Components, Supabase Auth, TailwindCSS)
- [x] Adheres to folder structure guidelines (app/(auth)/login, components/login/, lib/supabase/)
- [x] Meets security requirements (Principle IV: PKCE flow, HTTP-only cookies, domain validation, no service key in client)
- [x] Follows testing standards (Principle III: TDD mandatory, unit + integration + E2E)
- [x] Responsive UI standards (Principle V: mobile-first, WCAG 2.1 AA, Tailwind breakpoints)

**Violations (if any)**:

| Violation | Justification | Alternative Rejected |
|-----------|---------------|---------------------|
| New libraries: `@supabase/ssr`, `next-intl`, `zod` | Required for auth, i18n, and validation per spec FR-001/FR-007/FR-011 | All are in the constitution's approved library list |

---

## Architecture Decisions

### Frontend Approach

- **Component Structure**: Feature-based under `components/login/`. Shared UI in `components/ui/`.
- **Server vs Client split**:
  - Server Component: `app/(auth)/login/page.tsx` — renders full page, checks auth session, performs redirect if authenticated.
  - Client Components (`"use client"`): `LoginButton` (handles OAuth trigger + loading/error states), `LanguageSelector` (handles dropdown toggle + locale switching).
  - Static Components: `Header`, `HeroSection`, `Footer` — rendered by server, no client JS needed.
- **Styling Strategy**: Tailwind utility classes with arbitrary values `[#hex]`. Design tokens registered in `tailwind.config.ts` as custom theme extensions.
- **Data Fetching**: Session check in Server Component via `supabase.auth.getUser()` before render. No `useEffect` for auth state.
- **Fonts**: Montserrat + Montserrat Alternates loaded via `next/font/google` in `app/layout.tsx`, replacing current Geist fonts.

### Backend Approach

- **Auth Flow (Supabase PKCE)**:
  1. Client calls `supabase.auth.signInWithOAuth({ provider: 'google' })` which redirects to Google.
  2. Google redirects back to `/api/auth/callback` with authorization code.
  3. Route Handler exchanges code for session via `supabase.auth.exchangeCodeForSession(code)`.
  4. Route Handler validates email domain (`@sun-asterisk.com`).
  5. If valid: set session cookie, redirect to Homepage SAA (`/`).
  6. If invalid domain: sign out, redirect to `/error/403`.
  7. If error: redirect to `/login?error=auth_failed`.
- **Middleware**: Next.js middleware refreshes session on every request and redirects unauthenticated users to `/login`.
- **Validation**: Zod schema for domain validation in the callback Route Handler.

### Spec API Endpoints — Disposition

The spec predicts 3 API endpoints. Only 1 is needed:

| Spec Endpoint | Plan Decision | Reason |
|---------------|--------------|--------|
| `POST /api/auth/login` | **Not created** | Supabase PKCE initiates client-side via `signInWithOAuth()` which handles the redirect to Google. No server endpoint needed to start the flow. |
| `GET /api/auth/callback` | **Created** (Phase 2) | Required to exchange the OAuth code for a session and validate the email domain. |
| `GET /api/auth/session` | **Not created** | Session check is performed server-side in the Login page's Server Component via `supabase.auth.getUser()` and in `middleware.ts` for route protection. A separate endpoint adds no value. |

### Integration Points

- **Supabase Auth**: Google OAuth provider (must be configured in Supabase dashboard + Google Cloud Console)
- **i18n**: `next-intl` with cookie-based locale detection. Messages in `messages/{vi,en,ja}.json`.
- **Error 403 page**: Links to screen `T3e_iS9PCL` — will be a static page at `app/(auth)/error/403/page.tsx` (stub for now).

---

## Project Structure

### Documentation (this feature)

```text
.momorph/specs/GzbNeVGJHz-login/
├── spec.md              # Feature specification (reviewed)
├── plan.md              # This file
├── design-style.md      # Design specifications (reviewed)
└── assets/              # Screenshots, diagrams
```

### Source Code (new files)

```text
app/
├── (auth)/
│   ├── login/
│   │   └── page.tsx                  # Login page (Server Component)
│   └── error/
│       └── 403/
│           └── page.tsx              # Branded 403 error page (stub)
├── api/
│   └── auth/
│       └── callback/
│           └── route.ts              # OAuth callback Route Handler
├── layout.tsx                        # MODIFIED: fonts, metadata, providers
└── globals.css                       # MODIFIED: add custom properties

components/
├── ui/
│   └── icons/
│       ├── GoogleIcon.tsx            # Google brand icon component
│       ├── ChevronDownIcon.tsx       # Dropdown chevron icon
│       ├── LoadingSpinner.tsx        # Loading spinner for button state
│       ├── VNFlagIcon.tsx            # Vietnam flag icon (SVG from Figma)
│       ├── ENFlagIcon.tsx            # UK/US flag icon for English locale
│       └── JPFlagIcon.tsx            # Japan flag icon for Japanese locale
└── login/
    ├── Header.tsx                    # Header with logo + language selector
    ├── HeroSection.tsx               # Key visual + content text
    ├── LoginButton.tsx               # "use client" — OAuth trigger + states
    ├── LanguageSelector.tsx          # "use client" — locale dropdown
    └── Footer.tsx                    # Copyright footer

lib/
├── supabase/
│   ├── client.ts                     # Browser Supabase client (anon key)
│   ├── server.ts                     # Server Supabase client (cookies)
│   └── middleware.ts                 # Session refresh helper for middleware
├── validations/
│   └── auth.ts                       # Zod schema: email domain validation
└── utils/
    └── constants.ts                  # ALLOWED_DOMAINS, LOCALES, etc.

types/
└── auth.ts                           # AuthError, LoginState types

middleware.ts                          # Auth guard + session refresh

messages/
├── vi.json                            # Vietnamese translations
├── en.json                            # English translations
└── ja.json                            # Japanese translations

i18n/
├── request.ts                         # next-intl request config
└── routing.ts                         # Locale routing config

public/
└── images/
    ├── saa-logo.png                   # SAA 2025 header logo (from Figma)
    ├── root-further-logo.png          # ROOT FURTHER key visual (from Figma)
    └── login-bg.jpg                   # Background artwork (from Figma, optimized)

tailwind.config.ts                     # MODIFIED: add custom theme tokens
next.config.ts                         # MODIFIED: add next-intl plugin + security headers
```

### Modified Files

| File | Changes |
|------|---------|
| `app/layout.tsx` | Replace Geist fonts with Montserrat + Montserrat Alternates; update metadata; add locale provider |
| `app/globals.css` | Add CSS custom properties for design tokens if needed |
| `app/page.tsx` | Replace default content with redirect to `/login` or Homepage SAA based on auth |
| `tailwind.config.ts` | Add custom colors, font families, spacing tokens from design-style.md |
| `next.config.ts` | Add `next-intl` plugin, security headers (CSP, X-Frame-Options, HSTS), image domains |
| `package.json` | Add new dependencies |
| `.env.local` | Add Supabase + Google OAuth env vars (template) |

### Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@supabase/supabase-js` | latest | Supabase client SDK |
| `@supabase/ssr` | latest | Server-side auth helpers (cookie-based sessions) |
| `next-intl` | latest | i18n for 3 locales (VN, EN, JP) |
| `zod` | latest | Runtime validation (email domain check) |

### Media Assets (from Figma)

| Asset | Node ID | File | Download |
|-------|---------|------|----------|
| SAA Logo | `I662:14391;178:1033;178:1030` | `public/images/saa-logo.png` | From `get_media_files` |
| ROOT FURTHER Logo | `2939:9548` | `public/images/root-further-logo.png` | From `get_media_files` |
| VN Flag | `I662:14391;186:1696;186:1821;186:1709` | SVG → `components/ui/icons/VNFlagIcon.tsx` | From `get_media_files` |
| Chevron Down | `I662:14391;186:1696;186:1821;186:1441` | SVG → `components/ui/icons/ChevronDownIcon.tsx` | From `get_media_files` |
| Google Icon | `I662:14426;186:1766` | SVG → `components/ui/icons/GoogleIcon.tsx` | From `get_media_files` |
| Background Image | `662:14389` | `public/images/login-bg.jpg` | Export from Figma (full resolution, optimized JPEG) |

---

## Implementation Strategy

### Phase 0: Asset Preparation

- Download all media assets from Figma using `get_media_files` tool.
- Optimize background image (JPEG, max 1920px wide, quality 85).
- Convert SVG icons to React Icon Components in `components/ui/icons/`.
- Place PNG images in `public/images/`.

### Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project scaffolding, dependencies, configuration

1. Install dependencies: `@supabase/supabase-js`, `@supabase/ssr`, `next-intl`, `zod`
2. Configure `tailwind.config.ts` with custom theme tokens from design-style.md:
   - Colors: `bg-primary`, `btn-login`, `btn-login-text`, `header-bg`, `footer-border`, etc.
   - Fonts: `font-montserrat`, `font-montserrat-alternates`
   - Custom spacing if needed
3. Update `app/layout.tsx`:
   - Replace Geist fonts with Montserrat + Montserrat Alternates via `next/font/google`
   - Update `<html lang>` to use dynamic locale
   - Update metadata (title: "SAA 2025", description)
4. Update `next.config.ts`:
   - Add `next-intl` plugin
   - Add security headers (CSP, X-Frame-Options, X-Content-Type-Options, HSTS)
   - Add Supabase storage domain to `images.remotePatterns` if needed
5. Create `.env.local.example` with required env vars:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (no NEXT_PUBLIC_ prefix)
6. Create `types/auth.ts` — LoginState, AuthError types
7. Create `lib/utils/constants.ts` — ALLOWED_DOMAINS, SUPPORTED_LOCALES, DEFAULT_LOCALE

### Phase 2: Foundation (Blocking Prerequisites)

**Purpose**: Auth infrastructure, i18n setup, middleware

**CRITICAL: No UI work can begin until this phase is complete**
**TDD**: Write integration tests for the callback Route Handler and middleware BEFORE implementing them. Tests MUST fail first (Red), then implement to pass (Green), then refactor.

1. Create `lib/supabase/client.ts` — browser Supabase client using anon key
2. Create `lib/supabase/server.ts` — server Supabase client using `@supabase/ssr` cookie helpers
3. Create `lib/supabase/middleware.ts` — session refresh helper
4. Create `middleware.ts` — Next.js middleware (combined auth + i18n):
   - Refresh Supabase auth session on every request
   - Redirect unauthenticated users to `/login` for protected routes
   - Allow `/login`, `/api/auth/callback`, `/error/403` as public routes
   - Integrate `next-intl` middleware for locale detection from cookie
   - Use `next-intl`'s `createMiddleware` chained with Supabase session refresh
     (see `next-intl` docs: "Composing other middlewares" pattern)
5. Create `lib/validations/auth.ts` — Zod schema for email domain validation
6. Create `app/api/auth/callback/route.ts` — OAuth callback Route Handler:
   - Exchange code for session
   - Validate email domain against ALLOWED_DOMAINS
   - Redirect to Homepage SAA or Error 403
7. Setup i18n:
   - Create `messages/vi.json`, `messages/en.json`, `messages/ja.json` with login page strings
   - Create `i18n/request.ts` and `i18n/routing.ts`
   - Wrap layout with `NextIntlClientProvider`

8. Update `app/page.tsx` — replace default create-next-app content with auth-based redirect:
   - If authenticated → redirect to Homepage SAA (or show placeholder until Homepage is built)
   - If not authenticated → redirect to `/login`

**Checkpoint**: Auth flow works end-to-end (manual test with Supabase + Google OAuth)

### Phase 3: User Story 1 — Google Login Authentication (P1 MVP)

**Goal**: User can log in via Google OAuth and reach Homepage SAA

**Independent Test**: Navigate to `/login`, click "LOGIN With Google", complete OAuth, verify redirect

**TDD**: Write unit tests for LoginButton states (loading, error, disabled) and integration tests for the login page redirect logic BEFORE building UI components. Tests MUST fail first.

#### UI Components (US1)

1. Create `components/ui/icons/GoogleIcon.tsx` — SVG icon component
2. Create `components/ui/icons/LoadingSpinner.tsx` — loading spinner
3. Create `components/login/LoginButton.tsx` (`"use client"`):
   - Triggers `supabase.auth.signInWithOAuth({ provider: 'google' })`
   - Manages `isLoading` and `error` state
   - Renders loading spinner when processing
   - Shows error message inline below button with `role="alert"`
   - Implements all 6 button states from design-style.md
   - Accessibility: `aria-label`, `aria-busy`, `aria-disabled`
4. Create `components/login/HeroSection.tsx`:
   - ROOT FURTHER key visual via `next/image` with `alt` text
   - Description text (i18n translated)
   - Contains `<LoginButton />`
   - Error message display area
5. Create `components/login/Header.tsx`:
   - SAA logo via `next/image`
   - Language selector placeholder (static "VN" for now — full implementation in Phase 4)
6. Create `components/login/Footer.tsx`:
   - Copyright text (i18n translated)
   - Border-top divider
7. Create `app/(auth)/login/page.tsx` (Server Component):
   - Check auth session; if valid → redirect to Homepage SAA
   - Parse `?error=` query param for error message
   - Compose: background layers + gradients + Header + HeroSection + Footer
   - Full responsive layout per design-style.md
8. Create `app/(auth)/error/403/page.tsx`:
   - Branded error page stub (Sun* accounts only message)
   - Link back to `/login`

**Checkpoint**: User Story 1 complete — login flow works, unauthorized domains redirected to 403

### Phase 4: User Story 2 — Language Selection (P2)

**Goal**: User can switch language on the Login page between VN, EN, JP

**Independent Test**: Click language selector, switch to EN, verify text updates, refresh → preserved

**TDD**: Write unit tests for LanguageSelector (open/close, keyboard nav, locale cookie update) BEFORE building the component. Tests MUST fail first.

1. Create `components/ui/icons/ChevronDownIcon.tsx` — SVG icon
2. Create `components/ui/icons/VNFlagIcon.tsx` — VN flag icon (SVG from Figma)
3. Create `components/ui/icons/ENFlagIcon.tsx` and `components/ui/icons/JPFlagIcon.tsx` — flag icons for EN/JP locales (SVG icon components, use standard country flag SVGs)
4. Create `components/login/LanguageSelector.tsx` (`"use client"`):
   - Dropdown with 3 options: VN, EN, JP
   - Click-outside close, Escape key close
   - `aria-expanded`, `aria-label` for accessibility
   - Chevron rotation on open
   - Updates locale cookie and triggers page refresh
   - Keyboard navigation within dropdown
5. Update `components/login/Header.tsx` — replace placeholder with `<LanguageSelector />`
6. Populate `messages/vi.json`, `en.json`, `ja.json` with all translatable strings:
   - Hero content text
   - Login button text
   - Footer copyright
   - Error messages

**Checkpoint**: User Stories 1 & 2 complete — login + language switching works

### Phase 5: User Story 3 — Responsive Design (P3) + Polish

**Goal**: Login page renders correctly on mobile, tablet, and desktop

**Independent Test**: Resize to 360px, 768px, 1440px — all content visible, no horizontal scroll

1. Apply responsive Tailwind classes per design-style.md Responsive Specifications:
   - Mobile (default): reduced padding, scaled key visual, full-width button
   - Tablet (`sm:`/`md:`): medium padding, scaled key visual
   - Desktop (`lg:`/`xl:`): full Figma specs
2. Add `prefers-reduced-motion` media query support:
   - Disable page-load fade animation
   - Disable button hover transitions
3. Verify WCAG 2.1 AA:
   - Tab order: Language selector → Login button
   - Focus rings visible on all interactive elements
   - Screen reader: alt text, aria-labels, role="alert"
   - Color contrast (already verified: 18.06:1)
4. Performance optimization:
   - Background image: `next/image` with `priority`, responsive `sizes` prop
   - Fonts preloaded via `next/font/google`
   - Verify LCP < 2.5s
5. Security headers in `next.config.ts` (if not done in Phase 1)
6. `<noscript>` fallback message

**Checkpoint**: All user stories complete, responsive, accessible, performant

---

## Integration Testing Strategy

### Test Scope

- [x] **Component interactions**: LoginButton state management, LanguageSelector dropdown behavior
- [x] **External dependencies**: Supabase Auth OAuth flow, Google OAuth provider
- [x] **Data layer**: Session cookie read/write, locale cookie persistence
- [x] **User workflows**: Full login flow, language switch flow, auth redirect flow

### Test Categories

| Category | Applicable? | Key Scenarios |
|----------|-------------|---------------|
| UI ↔ Logic | Yes | LoginButton loading/error states, LanguageSelector open/close |
| App ↔ External API | Yes | Supabase Auth signInWithOAuth, exchangeCodeForSession |
| App ↔ Data Layer | Yes | Session cookie set/read, locale cookie set/read |
| Cross-platform | Yes | Mobile/Tablet/Desktop responsive rendering |

### Test Environment

- **Environment type**: Local dev + Supabase test project (isolated)
- **Test data strategy**: Mock Supabase responses for unit tests; real Supabase test project for integration
- **Isolation approach**: Fresh Supabase client per test, cookie cleanup between tests

### Mocking Strategy

| Dependency Type | Strategy | Rationale |
|-----------------|----------|-----------|
| Supabase Auth client | Mock (unit), Real (integration) | Unit tests need deterministic behavior; integration tests verify real flow |
| Google OAuth redirect | Mock | Cannot automate Google consent UI in tests |
| Next.js router | Mock | Use `next/navigation` mock for redirect assertions |
| Cookies | Mock (unit), Real (E2E) | Test cookie behavior in E2E via browser |

### Test Scenarios Outline

1. **Happy Path**
   - [x] Login button triggers `signInWithOAuth` with correct params
   - [x] OAuth callback exchanges code and sets session cookie
   - [x] Callback validates Sun* email domain and redirects to Homepage SAA
   - [x] Authenticated user visiting `/login` is redirected to Homepage SAA
   - [x] Language switch updates locale cookie and UI text

2. **Error Handling**
   - [x] OAuth cancellation shows inline error, button returns to default
   - [x] Non-Sun* domain → redirect to Error 403 page
   - [x] Invalid callback code → redirect to `/login?error=auth_failed`
   - [x] Expired session → redirect to `/login`

3. **Edge Cases**
   - [x] Double-click prevention (button disabled during loading)
   - [x] Language dropdown close on click-outside, Escape key
   - [x] Background image fallback color (#00101A) when image fails to load
   - [x] `prefers-reduced-motion` disables animations

### Coverage Goals

| Area | Target | Priority |
|------|--------|----------|
| Auth flow (login, callback, domain check) | 90%+ | High |
| UI components (states, interactions) | 80%+ | High |
| i18n (locale switch, persistence) | 80%+ | Medium |
| Responsive layout | E2E visual | Medium |
| Accessibility | axe-core audit | High |

---

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Supabase project not configured (OAuth provider, redirect URLs) | Medium | High | Document exact setup steps; fail fast with clear error messages in callback |
| Google Cloud Console OAuth credentials not ready | Medium | High | Create setup guide; can develop UI independently with mock auth |
| Background image too large (slow LCP) | Low | Medium | Optimize JPEG to ≤200KB; use `next/image` with priority + responsive sizes |
| `next-intl` config conflicts with App Router | Low | Medium | Follow official Next.js 16 + next-intl docs; test early in Phase 1 |
| PKCE flow cookie handling across environments | Low | High | Test in both dev and staging; ensure `sameSite` + `secure` cookie flags correct |

### Estimated Complexity

- **Frontend**: Medium (responsive layout, icon components, 2 client islands, gradients)
- **Backend**: Low-Medium (1 Route Handler, middleware, Supabase client setup)
- **Testing**: Medium (auth mocking, E2E OAuth flow)

---

## Dependencies & Prerequisites

### Required Before Start

- [x] `constitution.md` reviewed and understood
- [x] `spec.md` approved by stakeholders
- [ ] Supabase project created with Google OAuth provider enabled
- [ ] Google Cloud Console OAuth client ID/secret configured
- [ ] Supabase redirect URL set to `{app-url}/api/auth/callback`
- [ ] `.env.local` populated with Supabase credentials

### External Dependencies

- Supabase Auth service (Google OAuth provider)
- Google Cloud Console (OAuth 2.0 client credentials)
- Figma media assets (downloaded via MoMorph MCP tools)

---

## Next Steps

After plan approval:

1. **Run** `/momorph.tasks` to generate task breakdown
2. **Review** tasks.md for parallelization opportunities
3. **Begin** implementation following task order (Phase 0 → 1 → 2 → 3 → 4 → 5)

---

## Notes

- The Login page has no form inputs — authentication is entirely via Google OAuth redirect.
  This simplifies testing (no form validation) but requires careful handling of the OAuth
  redirect flow and cookie management.
- The `app/page.tsx` (root route) will need to be updated later as part of the Homepage SAA
  feature. For now, it should redirect to `/login` or the homepage based on auth state.
- The Header and Footer components created here will likely be reused across the application.
  Design them with reuse in mind but don't over-abstract yet — the constitution says YAGNI.
- The Error 403 page is a stub in this plan. Its full implementation depends on the Error
  screens spec (`T3e_iS9PCL`), but the stub ensures the domain validation flow works end-to-end.
- Font loading: Replacing Geist with Montserrat affects the entire app. This is intentional
  per the design system, but should be communicated to the team.
