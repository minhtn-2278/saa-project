<!--
SYNC IMPACT REPORT
==================
Version Change: N/A → 1.0.0 (initial creation)
Modified Principles: N/A (new document)

Added Sections:
  - I. Clean Code & Source Organization
  - II. Tech Stack Discipline (Next.js, TypeScript, TailwindCSS, Supabase)
  - III. Test-First Development (NON-NEGOTIABLE)
  - IV. Security First (OWASP)
  - V. Responsive UI Standards
  - Tech Stack & Architecture Standards
  - Development Workflow
  - Governance

Removed Sections: N/A (new document)

Templates Reviewed:
  ✅ .momorph/templates/plan-template.md — Constitution Compliance Check aligns with all 5 principles
  ✅ .momorph/templates/spec-template.md — TR-002 (security) and responsive requirements align
  ✅ .momorph/templates/tasks-template.md — Security hardening, accessibility, and TDD order align

Deferred TODOs:
  - TODO(PROJECT_NAME_EXPANSION): "SAA" acronym expansion is unknown — using package.json name as-is.
    Resolve by updating the title once the full project name is confirmed.
-->

# SAA Project Constitution

## Core Principles

### I. Clean Code & Source Organization

All code MUST be clean, concise, and well-organized:

- **Feature-based structure**: Group files by feature under `app/` (Next.js App Router).
  Each feature owns its components, hooks, services, and types.
- **Naming conventions**: Components → PascalCase. Functions/hooks → camelCase.
  Files → kebab-case (except React components).
- **Single Responsibility**: Each module, component, and function MUST have one clear purpose.
  Files exceeding 300 lines MUST be split.
- **No dead code**: Remove unused imports, variables, and commented-out blocks before committing.
- **DRY**: Extract shared logic into reusable hooks, utilities, or components.
  Duplication across 3+ locations MUST be refactored.

**Rationale**: Readability and maintainability are long-term productivity multipliers.
Messy code compounds technical debt exponentially.

### II. Tech Stack Discipline

All development MUST adhere to best practices of the approved tech stack:

**Next.js (App Router)**:
- Use Server Components by default; add `"use client"` only when browser APIs or
  interactivity explicitly require it.
- Initial data fetching MUST happen in Server Components or Route Handlers —
  never use `useEffect` for first-load data.
- Use `next/image` for all images and `next/link` for all internal navigation.
- Route Handlers in `app/api/` MUST validate all inputs before processing.

**TypeScript**:
- `strict: true` is mandatory. No `any` type without an explicit justification comment.
- Complex type definitions belong in dedicated `types/` files, not inlined in component props.
- Use `zod` (or equivalent) for runtime validation at all system boundaries
  (API input, form data, external responses).

**TailwindCSS**:
- Use Tailwind utility classes exclusively — no inline styles, no CSS-in-JS.
- Custom design tokens MUST be defined in `tailwind.config.ts`.
- Responsive variants MUST use Tailwind's mobile-first breakpoint system
  (`sm:`, `md:`, `lg:`, `xl:`).

**Supabase**:
- All database access MUST go through the Supabase client — never raw SQL in application code.
- Row Level Security (RLS) MUST be enabled on every table storing user data.
- Use Supabase Auth for all authentication — custom auth implementations are forbidden.
- The service-role client MUST only be instantiated in Server Components or Route Handlers.
  It MUST never be exposed to the client bundle.
- Environment variables MUST follow: `NEXT_PUBLIC_SUPABASE_URL`,
  `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.
  The service role key MUST NOT carry the `NEXT_PUBLIC_` prefix.

**Rationale**: Consistency with framework idioms prevents subtle bugs, improves performance,
and lets the team reason about code predictably.

### III. Test-First Development (NON-NEGOTIABLE)

TDD is mandatory for all feature work:

- Tests MUST be written and confirmed to **fail** before implementation begins.
- Enforce the Red-Green-Refactor cycle strictly: failing test → minimal passing code → refactor.
- **Unit tests**: Cover all business logic, custom hooks, and utility functions.
- **Integration tests**: Cover all API routes, Supabase interactions, and critical user flows.
- **E2E tests (Playwright)**: Cover all P1 user stories end-to-end.
- Test coverage MUST NOT decrease below the baseline established at feature start.
- Mocking Supabase is permitted in unit tests; integration tests MUST use a real
  Supabase test project (isolated from production).

**Rationale**: Tests written after implementation verify existing behavior rather than
design intended behavior. TDD produces cleaner APIs and catches regressions early.

### IV. Security First (OWASP)

All code MUST comply with OWASP secure coding practices:

- **Injection prevention**: Validate and sanitize all user inputs. Use parameterized queries
  exclusively (the Supabase client handles this — never concatenate user input into queries).
- **Authentication**: Use Supabase Auth exclusively. Session tokens MUST be stored in
  HTTP-only cookies (not `localStorage`). Implement PKCE flow for OAuth.
- **Authorization**: Every Route Handler and Server Component MUST verify the authenticated
  user's permissions before returning data. RLS is the last line of defense —
  application-level checks are also required.
- **Sensitive data**: No secrets, API keys, or PII in client-side code, logs, or error
  messages. All secrets MUST be stored as environment variables.
- **XSS prevention**: Never use `dangerouslySetInnerHTML` without explicit sanitization.
  User-generated content MUST be escaped before rendering.
- **CSRF protection**: Server Actions and Route Handlers MUST validate request origin.
- **Security headers**: Configure `Content-Security-Policy`, `X-Frame-Options`,
  `X-Content-Type-Options`, and `Strict-Transport-Security` in `next.config.ts`.
- **Dependency security**: Run `npm audit` before each release. Critical/high vulnerabilities
  MUST be resolved before deployment.

**Rationale**: Security vulnerabilities found post-deployment are vastly more expensive than
those caught at development time. Security is a design requirement, not an afterthought.

### V. Responsive UI Standards

All UI MUST follow responsive web design principles:

- **Mobile-first**: Implement for mobile viewport first, then progressively enhance
  for larger screens.
- **Breakpoints**: Use Tailwind's standard breakpoints consistently
  (`sm: 640px`, `md: 768px`, `lg: 1024px`, `xl: 1280px`).
- **Accessibility (WCAG 2.1 AA)**: All interactive elements MUST have appropriate ARIA
  labels. Color contrast MUST meet AA ratio (4.5:1 normal text, 3:1 large text).
  Full keyboard navigation MUST be functional.
- **Touch targets**: Interactive elements MUST be at least 44×44px on mobile viewports.
- **Core Web Vitals**: MUST meet "Good" thresholds (LCP < 2.5s, FID < 100ms, CLS < 0.1).
  Use `next/image` with the `sizes` prop for responsive images.
- **Platform consistency**: Follow standard browser UX patterns for web.
  Mobile-native gestures (swipe-to-delete, pull-to-refresh) MUST NOT be used
  unless explicitly specified in the design.

**Rationale**: Users access the application across diverse devices and abilities.
Responsive, accessible design is a quality requirement, not a nice-to-have.

## Tech Stack & Architecture Standards

### Approved Libraries

| Category | Library | Version |
|----------|---------|---------|
| Framework | Next.js | 16.x |
| UI | React | 19.x |
| Styling | TailwindCSS | 4.x |
| Language | TypeScript | 5.x |
| Backend / Auth / DB | Supabase JS | latest |
| Schema validation | Zod | latest |
| Unit / integration tests | Vitest + Testing Library | latest |
| E2E tests | Playwright + @axe-core/playwright | latest |
| Rich text editor | Tiptap (@tiptap/react + extensions) | 3.x |
| HTML sanitisation | sanitize-html | 2.x |
| Modal / dialog primitive | @radix-ui/react-dialog | 1.x |
| Toast primitive | sonner | 2.x |
| Feed virtualisation *(Live board)* | @tanstack/react-virtual | latest |
| Gesture (pan / pinch-zoom) *(Live board Spotlight)* | @use-gesture/react | latest |
| Animation / spring *(Live board Spotlight)* | @react-spring/web | latest |

Adding a library not in this table requires a constitution amendment (PR + approval)
before it may be merged.

**Amendment history**:

- 2026-04-20 — Added Tiptap, sanitize-html, @radix-ui/react-dialog, sonner, @axe-core/playwright for the Viết Kudo feature (plan `ihQ26W78P2-viet-kudo`).
- 2026-04-21 — Added `@tanstack/react-virtual`, `@use-gesture/react`, `@react-spring/web` for the Sun* Kudos Live Board feature (plan `MaZUn5xHXZ-sun-kudos-live-board`). Justification: virtualised infinite-scroll feed (plan § T001/Constitution Compliance) and touch-device gesture support on the Spotlight canvas (plan § Q-P2 resolved "install"). Alternatives considered and rejected in the plan's Constitution Compliance table.

### Folder Structure

```
app/
├── (auth)/           # Auth-related routes (login, signup, password reset)
├── (dashboard)/      # Protected application routes
├── api/              # Route Handlers
├── globals.css
└── layout.tsx

components/
├── ui/               # Primitive, stateless UI components
└── [feature]/        # Feature-scoped shared components

lib/
├── supabase/         # Supabase client factories (server.ts, client.ts)
├── validations/      # Zod schemas
└── utils/            # Pure utility functions

types/                # Global TypeScript type definitions
hooks/                # Shared custom React hooks
```

### Data Flow Rules

- Client components MUST NOT use the service-role Supabase client.
- Server-side data fetching MUST be performed in Server Components or Route Handlers.
- Shared state MUST use React Context or Zustand — Redux requires explicit justification
  (scale) before use.

## Development Workflow

### Quality Gates (all MUST pass before merge)

1. **TypeScript**: `tsc --noEmit` exits with zero errors.
2. **Lint**: `eslint` exits with zero errors (warnings allowed with justification).
3. **Tests**: All unit and integration tests pass (`vitest run`).
4. **E2E**: Playwright tests for affected P1 flows pass on staging.
5. **Constitution check**: PR description MUST include the compliance checklist
   from `plan-template.md`.
6. **Security**: `npm audit` introduces no new critical or high vulnerabilities.

### Code Review Requirements

- Every PR MUST be reviewed by at least one other team member before merge.
- Reviewers MUST verify constitution compliance, not only functional correctness.
- Automated security scanning MUST be part of the CI/CD pipeline.

### Branching Strategy

- `main`: Production-ready code only. Protected — direct pushes are forbidden.
- Feature branches: `feature/<ticket-id>-<short-description>`.
- Hotfix branches: `hotfix/<ticket-id>-<description>`.

## Governance

This constitution supersedes all other project guidelines, README instructions, and verbal
agreements. When conflicts arise, this document is authoritative.

**Amendment procedure**:
1. Open a PR updating this file with a version bump and justification comment.
2. Amendment requires approval from at least 2 team members.
3. MAJOR version bumps require team consensus and a migration plan document.
4. All dependent templates under `.momorph/templates/` MUST be updated in the same PR.

**Versioning policy**:
- MAJOR: Principle removal, redefinition, or backward-incompatible governance change.
- MINOR: New principle, new section, or materially expanded guidance.
- PATCH: Clarifications, wording improvements, typo fixes.

**Compliance review**:
- Constitution compliance is checked during code review for every PR.
- A full constitution audit MUST be conducted at the start of each project milestone.
- Violations discovered during review MUST be resolved before merge — deferred compliance
  is not permitted.

**Guidance files**: Use `.momorph/guidelines/` for extended how-to documentation and
runtime development guidance.

**Version**: 1.0.0 | **Ratified**: 2026-04-15 | **Last Amended**: 2026-04-15
