# Tasks: Login

**Frame**: `GzbNeVGJHz-login`
**Prerequisites**: plan.md (required), spec.md (required), design-style.md (required)

---

## Task Format

```
- [ ] T### [P?] [Story?] Description | file/path.ts
```

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this belongs to (US1, US2, US3)
- **|**: File path affected by this task

---

## Phase 0: Asset Preparation

**Purpose**: Download and prepare all media assets from Figma

- [x] T001 Download SAA logo PNG from Figma (node `I662:14391;178:1033;178:1030`) and save to | public/images/saa-logo.png
- [x] T002 [P] Download ROOT FURTHER logo PNG from Figma (node `2939:9548`) and save to | public/images/root-further-logo.png
- [x] T003 [P] Download background image via `get_figma_image` (node `662:14388`, 2x scale), optimized with sharp (1920x1362, mozjpeg q60, 366KB) | public/images/login-bg.jpg
- [x] T004 [P] Download Google icon SVG from Figma (node `I662:14426;186:1766`) and convert to React Icon Component | components/ui/icons/GoogleIcon.tsx
- [x] T005 [P] Download VN flag SVG from Figma (node `I662:14391;186:1696;186:1821;186:1709`) and convert to React Icon Component | components/ui/icons/VNFlagIcon.tsx
- [x] T006 [P] Download chevron-down SVG from Figma (node `I662:14391;186:1696;186:1821;186:1441`) and convert to React Icon Component | components/ui/icons/ChevronDownIcon.tsx
- [x] T007 [P] Create EN flag icon component (standard UK/US flag SVG) | components/ui/icons/ENFlagIcon.tsx
- [x] T008 [P] Create JP flag icon component (standard Japan flag SVG) | components/ui/icons/JPFlagIcon.tsx
- [x] T009 [P] Create loading spinner icon component (animated SVG spinner, 24x24px, color inherits from parent) | components/ui/icons/LoadingSpinner.tsx

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization, dependencies, configuration

- [x] T010 Install dependencies: `@supabase/supabase-js`, `@supabase/ssr`, `next-intl`, `zod` | package.json
- [x] T011 Configure Tailwind custom theme tokens from design-style.md (via CSS @theme in globals.css for TailwindCSS v4) | app/globals.css
- [x] T012 Update layout: replace Geist fonts with Montserrat (700) via `next/font/google`; update metadata; add NextIntlClientProvider | app/layout.tsx
- [x] T013 Update Next.js config: add `next-intl` plugin via `createNextIntlPlugin`, add security headers (X-Frame-Options: DENY, X-Content-Type-Options: nosniff, Strict-Transport-Security, Referrer-Policy) | next.config.ts
- [x] T014 [P] Create `.env.local.example` with all required env vars | .env.local.example
- [x] T015 [P] Create auth types: `LoginState`, `AuthError`, `SupportedLocale` | types/auth.ts
- [x] T016 [P] Create constants: `ALLOWED_DOMAINS`, `SUPPORTED_LOCALES`, `DEFAULT_LOCALE`, `PUBLIC_ROUTES` | lib/utils/constants.ts

---

## Phase 2: Foundation (Blocking Prerequisites)

**Purpose**: Auth infrastructure, i18n setup, middleware

**CRITICAL**: No user story work can begin until this phase is complete

### TDD: Tests First (Phase 2)

- [x] T017 Write integration tests for OAuth callback Route Handler (5 tests pass) | tests/integration/auth-callback.test.ts
- [x] T018 [P] Write integration tests for auth middleware (5 tests pass) | tests/integration/middleware.test.ts
- [x] T019 [P] Write unit tests for email domain validation (10 tests pass) | tests/unit/auth-validation.test.ts

### Implementation (Phase 2)

- [x] T020 Create browser Supabase client using `createBrowserClient` from `@supabase/ssr` | lib/supabase/client.ts
- [x] T021 [P] Create server Supabase client using `createServerClient` from `@supabase/ssr` with cookie helpers | lib/supabase/server.ts
- [x] T022 [P] Create middleware Supabase helper with `request`/`response` cookie handling for session refresh | lib/supabase/middleware.ts
- [x] T023 Create Zod schema `emailDomainSchema` that validates email domain against `ALLOWED_DOMAINS` | lib/validations/auth.ts
- [x] T024 Create Next.js middleware: Supabase session refresh + redirect unauthenticated to `/login` for non-public routes | middleware.ts
- [x] T025 Create OAuth callback Route Handler: exchange code, validate domain, redirect to `/` or `/error/403` | app/api/auth/callback/route.ts
- [x] T026 Create i18n request config: read locale from cookie, fallback to `DEFAULT_LOCALE` | i18n/request.ts
- [ ] T027 [P] Create i18n routing config | i18n/routing.ts — SKIPPED: not needed for cookie-based locale detection with next-intl
- [x] T028 [P] Create Vietnamese translation file | messages/vi.json
- [x] T029 [P] Create English translation file | messages/en.json
- [x] T030 [P] Create Japanese translation file | messages/ja.json
- [x] T031 Update layout with `NextIntlClientProvider` | app/layout.tsx (done in T012)
- [x] T032 Update root page: auth check + redirect | app/page.tsx

**Checkpoint**: Auth flow works end-to-end — middleware protects routes, callback validates domain, i18n loads locale from cookie

---

## Phase 3: User Story 1 - Google Login Authentication (Priority: P1) MVP

**Goal**: User can log in via Google OAuth and reach Homepage SAA

**Independent Test**: Navigate to `/login`, click "LOGIN With Google", complete OAuth, verify redirect to Homepage SAA. Test with non-Sun* account → verify redirect to 403.

### TDD: Tests First (US1)

- [x] T033 [US1] Write unit tests for LoginButton (8 tests pass) | tests/unit/login-button.test.tsx
- [x] T034 [P] [US1] Integration test for Login page covered in T033 (error URL param test) + T017 (callback redirect) | tests/unit/login-button.test.tsx

### Implementation (US1)

- [x] T035 [P] [US1] Create LoginButton component (`"use client"`) with OAuth trigger, 6 button states, error display, aria attributes | components/login/LoginButton.tsx
- [x] T036 [P] [US1] Create HeroSection component with ROOT FURTHER logo, i18n description, LoginButton | components/login/HeroSection.tsx
- [x] T037 [P] [US1] Create Header component with SAA logo, responsive layout | components/login/Header.tsx
- [x] T038 [P] [US1] Create Footer component with i18n copyright text, border-top divider | components/login/Footer.tsx
- [x] T039 [US1] Create Login page (Server Component) with auth redirect, background layers, gradients, noscript fallback | app/(auth)/login/page.tsx
- [x] T040 [US1] Create Error 403 page stub with i18n text and back-to-login link | app/(auth)/error/403/page.tsx

**Checkpoint**: User Story 1 complete and independently testable — login flow works, unauthorized domains redirected to 403

---

## Phase 4: User Story 2 - Language Selection (Priority: P2)

**Goal**: User can switch language between VN, EN, JP on the Login page

**Independent Test**: Click language selector → dropdown opens with 3 options → select EN → UI text updates to English → refresh page → English preserved

### TDD: Tests First (US2)

- [x] T041 [US2] Write unit tests for LanguageSelector (11 tests pass) | tests/unit/language-selector.test.tsx

### Implementation (US2)

- [x] T042 [P] [US2] Create LanguageSelector component with dropdown, keyboard nav, cookie-based locale switching, aria attributes | components/login/LanguageSelector.tsx
- [x] T043 [US2] Update Header: replace static placeholder with `<LanguageSelector />` | components/login/Header.tsx
- [x] T044 [US2] Populate vi.json with complete translations | messages/vi.json (done in T028)
- [x] T045 [P] [US2] Populate en.json with English translations | messages/en.json (done in T029)
- [x] T046 [P] [US2] Populate ja.json with Japanese translations | messages/ja.json (done in T030)

**Checkpoint**: User Stories 1 & 2 complete — login + language switching works, locale persists across refresh

---

## Phase 5: User Story 3 - Responsive Design + Polish (Priority: P3)

**Goal**: Login page renders correctly on all viewports, meets WCAG 2.1 AA, LCP < 2.5s

**Independent Test**: Resize to 360px (mobile), 768px (tablet), 1440px (desktop) — all content visible, no horizontal scroll, button reachable, text readable

### TDD: Tests First (US3)

- [ ] T047 [US3] Write E2E tests with Playwright: test login page renders on mobile/tablet/desktop viewports without horizontal scroll; test Login button is clickable and reachable on all viewports; test background image has fallback bg color (#00101A); test `<noscript>` message is present; test axe-core accessibility audit passes | tests/e2e/login-responsive.spec.ts

### Implementation (US3)

- [x] T048 [P] [US3] Responsive classes on Header: mobile/tablet/desktop breakpoints verified | components/login/Header.tsx
- [x] T049 [P] [US3] Responsive classes on HeroSection: fixed mobile mt-16 for h-16 header, progressive gap scaling | components/login/HeroSection.tsx
- [x] T050 [P] [US3] Responsive classes on Footer: mobile/tablet/desktop breakpoints verified | components/login/Footer.tsx
- [x] T051 [US3] `motion-safe:` prefix on all transitions in LoginButton, LanguageSelector, HeroSection | components/login/LoginButton.tsx, components/login/LanguageSelector.tsx
- [x] T052 [US3] `<noscript>` fallback message added | app/(auth)/login/page.tsx
- [x] T053 [US3] Performance: `priority` + `sizes="100vw"` on bg image, `display: 'swap'` on fonts, `max-w-[1440px] mx-auto` container | app/(auth)/login/page.tsx

**Checkpoint**: All user stories complete — responsive, accessible, performant

---

## Phase N: Polish & Cross-Cutting Concerns

**Purpose**: Final refinements affecting multiple stories

- [ ] T054 [P] Run axe-core accessibility audit on login page, fix any WCAG 2.1 AA violations | app/(auth)/login/page.tsx — NEEDS: running dev server + Playwright
- [ ] T055 [P] Run Lighthouse performance audit, verify LCP < 2.5s on simulated 3G | app/(auth)/login/page.tsx — NEEDS: running dev server
- [x] T056 [P] Verify all interactive elements have visible focus rings (2px solid #FFEA9E, outline-offset 2px) | components/login/LoginButton.tsx, components/login/LanguageSelector.tsx
- [x] T057 [P] Verify tab order: LanguageSelector (header) → LoginButton (hero) — natural DOM order correct | app/(auth)/login/page.tsx
- [x] T058 Code cleanup: zero `any` types, zero unused imports, all files < 300 lines (max: 170 lines) | all files
- [x] T059 Verify `npm audit` — 0 vulnerabilities found | package.json

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 0 (Assets)**: No dependencies — can start immediately
- **Phase 1 (Setup)**: Depends on Phase 0 for icon components, otherwise independent
- **Phase 2 (Foundation)**: Depends on Phase 1 (deps, config, types) — BLOCKS all user stories
- **Phase 3 (US1)**: Depends on Phase 2 completion (auth infra must exist)
- **Phase 4 (US2)**: Depends on Phase 3 (Header component must exist to update)
- **Phase 5 (US3)**: Depends on Phase 4 (all components must exist to add responsive classes)
- **Phase N (Polish)**: Depends on Phase 5 completion

### Within Each User Story

- Tests MUST be written and FAIL before implementation (TDD)
- Icon components before feature components that use them
- Lib/utility files before components that import them
- Individual components before the page that composes them
- Story complete before moving to next priority

### Parallel Opportunities

**Phase 0**: T001-T009 all parallel (independent assets)
**Phase 1**: T014, T015, T016 parallel (no interdependencies)
**Phase 2**: T017, T018, T019 parallel (independent test files); T020, T021, T022 parallel (independent Supabase clients); T028, T029, T030 parallel (independent message files)
**Phase 3**: T033, T034 parallel (tests); T035, T036, T037, T038 parallel (independent components)
**Phase 4**: T045, T046 parallel (translation files)
**Phase 5**: T048, T049, T050 parallel (independent responsive updates)
**Phase N**: T054, T055, T056, T057 all parallel

---

## Implementation Strategy

### MVP First (Recommended)

1. Complete Phase 0 + 1 + 2
2. Complete Phase 3 (User Story 1 only)
3. **STOP and VALIDATE**: Login flow works end-to-end with Google OAuth
4. Deploy if ready — users can log in

### Incremental Delivery

1. Phase 0 + 1 + 2 (Setup + Foundation)
2. Phase 3 (US1: Login) → Test → Deploy
3. Phase 4 (US2: Language) → Test → Deploy
4. Phase 5 (US3: Responsive + Polish) → Test → Deploy

---

## Notes

- Commit after each task or logical group
- Run tests before moving to next phase
- Update spec.md if requirements change during implementation
- Mark tasks complete as you go: `[x]`
- All icon components MUST be React components (not SVG files or img tags) per design-style.md notes
- Translation files (vi/en/ja.json) use the same key structure — create vi.json first as the source of truth
- The Error 403 page (T040) is a stub — full implementation depends on a future spec for screen `T3e_iS9PCL`
