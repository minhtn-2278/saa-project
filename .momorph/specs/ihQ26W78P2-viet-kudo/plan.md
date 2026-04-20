# Implementation Plan: Viết Kudo (Write a Kudo)

**Frame**: `ihQ26W78P2-viet-kudo`
**Date**: 2026-04-20
**Spec**: [spec.md](./spec.md) (Approved)
**Design**: [design-style.md](./design-style.md)
**API Contract**: [../../contexts/api-docs.yaml](../../contexts/api-docs.yaml)
**API Tests**: [../../contexts/BACKEND_API_TESTCASES.md](../../contexts/BACKEND_API_TESTCASES.md)
**DB Schema**: [../../contexts/database-schema.sql](../../contexts/database-schema.sql)

---

## Summary

Ship a vertically-sliced **Write-Kudo modal** accessible from the homepage Floating Action Button (already exists at [components/shared/FloatingActionButton.tsx](../../../components/shared/FloatingActionButton.tsx)), future Kudos-board CTA, and Profile "Gửi lời chúc" action. The modal is a React 19 `"use client"` island mounted once at the **dashboard layout** (`app/(dashboard)/layout.tsx`) and opened via the `?write=kudo` URL search param, so it's reachable from every dashboard route. It posts to six new Route Handlers backed by Supabase (Postgres + Storage) and refreshes the Kudos board via `router.refresh()` on success.

**Primary technical approach**: one bounded-context feature folder (`app/(dashboard)/kudos/` + `components/kudos/`) + shared Supabase infrastructure (`lib/supabase/`, `lib/auth/`, `lib/kudos/`). TDD: every FR/TR ships with a Vitest unit + a server-side integration test against a real Supabase test project; P1 flows add Playwright. Rich-text uses ProseMirror JSON stored in `jsonb`; image attachments go to a private `kudo-images` Supabase Storage bucket, served via short-lived signed URLs minted by the Route Handler.

---

## Technical Context

**Language/Framework**: TypeScript 5 (strict) / Next.js 16 (App Router) / React 19
**Primary Dependencies**: `@supabase/ssr` + `@supabase/supabase-js` (already installed), `zod` (installed), `next-intl` (installed; messages in `messages/{vi,en,ja}.json`), Tailwind 4
**New dependencies (to add)**:
| Package | Purpose | Notes |
|---|---|---|
| `@tiptap/react` + `@tiptap/pm` + `@tiptap/starter-kit` + `@tiptap/extension-link` + `@tiptap/extension-mention` + `@tiptap/suggestion` | ProseMirror editor with `@mention` support for the Textarea (D) and Toolbar (C) per TR-006 | Tiptap uses ProseMirror under the hood → emits the exact JSON shape TR-006 requires |
| `sanitize-html` (or equivalent) | Server-side sanitisation of the ProseMirror JSON before `INSERT` | Enforces allow-list of nodes/marks, strips disallowed hrefs |
| `@radix-ui/react-dialog` *(optional)* | Accessible modal primitive (focus trap, `aria-modal`, ESC handling) | Constitution allows it under "approved libraries"; add only if we don't want to hand-roll per WCAG. **Decision deferred** to task phase — see Open Questions |

**Database**: Supabase Postgres (no RLS — authorisation enforced at the API layer per spec.md rev 3 FR-016); new tables per [database-schema.sql](../../contexts/database-schema.sql): `employees`, `kudos`, `titles`, `hashtags`, `uploads`, `kudo_hashtags`, `kudo_images`, `kudo_mentions`
**Storage**: Supabase Storage, private bucket `kudo-images`
**Testing**: Vitest 2 + Testing Library + `happy-dom`/`jsdom` (already wired via [vitest.config.ts](../../../vitest.config.ts)); Playwright 1.59 ([playwright.config.ts](../../../playwright.config.ts))
**State Management**: Local React state for the form (`useReducer` for multi-field draft + sessionStorage sync); no global store needed. Server state comes from the route segment's Server Component.
**API Style**: REST via Next.js Route Handlers under `app/api/`

---

## Constitution Compliance Check

*GATE: Must pass before implementation can begin.*

| Principle | Rule | Status |
|---|---|---|
| **I. Clean Code** | Feature-based structure, kebab-case files, PascalCase components, files ≤ 300 lines | ✅ Plan scopes `components/kudos/WriteKudoModal/` with one sub-component per responsibility |
| **II. Tech Stack** | Server Components default; `"use client"` only for interactivity | ✅ Server Component shell; client islands = `WriteKudoModal`, rich-text editor, hashtag/image pickers, anonymous toggle. Initial data (titles, top hashtags) fetched in the Server Component parent per TR-001 |
| | `next/image`, `next/link` | ✅ Image thumbnails use `next/image`; `Tiêu chuẩn cộng đồng` uses `<a target="_blank">` (external target) — not `next/link` — per FR-015 |
| | Route Handlers validate all inputs | ✅ Zod validation on every endpoint (FR-016 step 1, TR-004) |
| | Tailwind utilities only | ✅ Design-style.md § Implementation Mapping uses Tailwind classes exclusively |
| | Supabase client — no raw SQL in application code | ✅ All queries go through the typed Supabase JS client (TR-009). FR-016 (rev 3) moves authorisation to the API layer; no RLS on any feature table. This is a deliberate, documented deviation from the constitution default of "RLS on every table" — rationale: the anon-key session is minted only server-side inside same-origin Route Handlers + CSRF gate, so RLS would redundantly gate the same code path. If future features expose Supabase directly to the browser (e.g. Realtime), RLS will be added then. |
| | Supabase Auth — HTTP-only cookies, PKCE | ✅ Already wired in [lib/supabase/server.ts](../../../lib/supabase/server.ts) and [app/api/auth/callback/route.ts](../../../app/api/auth/callback/route.ts) |
| | `SUPABASE_SERVICE_ROLE_KEY` never in client bundle | ✅ This feature does not use the service-role client (Module Boundaries) |
| **III. Test-First (NON-NEGOTIABLE)** | Tests written first; Red-Green-Refactor | ✅ Phase Breakdown below interleaves failing tests before implementation for every FR |
| | Unit, integration, E2E coverage | ✅ See Integration Testing Strategy § below |
| | Integration tests hit a real Supabase test project | ✅ Uses the `.env.test` Supabase URL/anon key; seeded via `supabase/snippets/` |
| **IV. Security (OWASP)** | Input validation, sanitised rich-text, no XSS, HTTP-only cookies, CSP | ✅ TR-004, TR-006, TR-007, TR-010 all folded in |
| **V. Responsive & A11y** | Mobile-first, WCAG 2.1 AA, 44 px touch targets, Core Web Vitals | ✅ design-style.md § Responsive + spec.md § Accessibility |

**Violations**: *none*. The planned new dependencies (Tiptap, sanitize-html) are additive and necessary to satisfy TR-006 (ProseMirror JSON + sanitisation). Per constitution § Governance an amendment PR will be opened *alongside* the feature PR to list them under **Approved Libraries**.

| Violation | Justification | Alternative Rejected |
|---|---|---|
| Adding Tiptap (`@tiptap/*`) | TR-006 mandates ProseMirror JSON; Tiptap is the most widely-maintained React wrapper around ProseMirror | Lexical (Meta) — different data model, would have to hand-convert to ProseMirror JSON for TR-006 compliance; raw ProseMirror without a React wrapper — higher maintenance |
| Adding `sanitize-html` | Server-side sanitiser for allow-listed nodes/marks/hrefs per TR-006 | Building a bespoke walker — error-prone for a security boundary |

---

## Architecture Decisions

### Frontend

- **Component structure**: feature-scoped under `components/kudos/WriteKudoModal/`. Each Figma row (A, B, Danh-hiệu, C, D, D.1, E, F, G, G.1, H) is one sub-component, matching [design-style.md § Implementation Mapping](./design-style.md#implementation-mapping). Chips, thumbnails, and toolbar buttons live as primitives under `components/kudos/WriteKudoModal/parts/`.
- **Global modal mounting (decision)**: the modal is reachable from **multiple route segments** (homepage `/`, Kudos board `/kudos`, Profile `/profile/[id]`) via the global Floating Action Button. We mount it once at the **dashboard layout** using a URL-driven open state:
  - `app/(dashboard)/layout.tsx` (existing) hosts a `<WriteKudoModalMount />` island that reads the URL search param `?write=kudo` via `useSearchParams()` and opens the modal whenever that param is present.
  - All entry points (FAB, Kudos board CTA, Profile "Gửi lời chúc") use `<Link href={`${pathname}?write=kudo`}>` — same page, no intercepting-route machinery needed.
  - On close, the modal calls `router.replace(pathname)` to drop the query string.
  - Rationale: simpler than Next.js parallel/intercepting routes; survives browser Back/Forward; shareable "open-modal" URLs for QA; zero extra route definitions. Alternative rejected: `@modal` parallel slot — overkill for a single modal with no independent loading state.
- **Styling**: Tailwind utility classes only. Design tokens from design-style.md declared in [app/globals.css](../../../app/globals.css) via Tailwind 4's `@theme` directive (cream `#FFF8E1`, gold `#FFEA9E`, olive `#998C5F`, community-red `#E46060`, required-red `#CF1322`). **Decision**: Tailwind 4 uses the CSS-first `@theme` convention; we do not add tokens to [tailwind.config.ts](../../../tailwind.config.ts) (which remains minimal). See Open Questions Q-P6 if config vs CSS is disputed.
- **Data fetching**:
  - **Initial** (TR-001): the route-segment Server Component preloads `GET /api/titles` and `GET /api/hashtags?limit=20` (top-used) and passes them as props to `WriteKudoModal`.
  - **Typeahead**: client-side `fetch()` to `/api/employees/search` and `/api/hashtags?q=…` with 250 ms debounce + `AbortController` cancellation (TR-002).
  - **Mutations**: one `fetch('/api/kudos', { method: 'POST', ... })` call on submit; subsequent `router.refresh()` on success (FR-014).
- **Form state**: `useReducer` state with discrete fields (`recipient`, `title`, `body`, `hashtags`, `images`, `isAnonymous`, `alias`). A `useDraftSync(key, state)` hook mirrors to `sessionStorage` on every change and restores on mount (FR-011).
- **Rich-text**: Tiptap editor with extensions = `StarterKit (without OrderedList)`, `Bold`, `Italic`, `Strike`, `BulletList`, `Link` (configured `openOnClick: false`), `Blockquote`, `Mention`, `Placeholder`. Toolbar buttons call `editor.chain().focus().toggleBold().run()` etc. Output = `editor.getJSON()` → ProseMirror `doc` node (TR-006).
- **Modal accessibility**: modal uses `role="dialog" aria-modal="true"`, focus trap, ESC to close, `router.back()` or confirmation on cancel. Decision on whether to hand-roll or pull in `@radix-ui/react-dialog` deferred to the task phase (see Open Questions Q-P2).
- **Image rendering with `next/image`**: Supabase Storage signed URLs are served from `https://<project-ref>.supabase.co`. [next.config.ts](../../../next.config.ts) MUST be extended with `images.remotePatterns` to include `{ protocol: 'https', hostname: '${SUPABASE_REF}.supabase.co', pathname: '/storage/v1/**' }`. Because the hostname is environment-specific, the config reads `process.env.NEXT_PUBLIC_SUPABASE_URL` at build time and derives the hostname. Signed URLs are short-lived (≤ 1 h per TR-008) — on re-render the Route Handler re-signs, so Next's image cache invalidation aligns with the URL rotation.
- **Validation error i18n**: Zod schemas live in `lib/validations/kudos.ts` and emit **error keys** (not Vietnamese strings) — e.g. `z.string().min(1, { message: 'errors.recipient.required' })`. The React form layer resolves each key via `useTranslations('kudos.writeKudo.errors')` and renders the localised string. Rationale: keeps validation messages in one i18n namespace, avoids duplicate Vietnamese literals between Zod and UI, makes the `en.json`/`ja.json` translation pass trivial. Server-side error responses also return the key so the client can localise 422 payloads the same way.

### Backend

- **API**: Next.js Route Handlers under `app/api/` — one file per endpoint (`kudos/route.ts`, `kudos/[id]/route.ts` will be added in the edit spec, `employees/search/route.ts`, `titles/route.ts`, `hashtags/route.ts`, `uploads/route.ts`, `uploads/[id]/route.ts`). Each starts with:
  ```ts
  const supabase = await createClient();          // lib/supabase/server.ts
  const employee = await getCurrentEmployee(supabase);  // lib/auth/current-employee.ts — returns 403 if missing
  const body = ZodSchema.parse(await req.json()); // lib/validations/kudos.ts
  ```
- **Transactional create (TS chain, no RPC)**: `POST /api/kudos` runs a best-effort transactional chain in TypeScript via the Supabase JS client. No `rpc()` calls, no PL/pgSQL functions — spec.md rev 3 FR-016.
  1. **Resolve inline-created titles / hashtags** — for each `{label}` entry the client sent, `supabase.from('hashtags').upsert({ slug, label, created_by }, { onConflict: 'slug', ignoreDuplicates: true }).select('id').single()` (one round-trip per new entity; race-safe because `slug` has a partial unique index). Existing-id entries are passed through unchanged.
  2. **Insert the `kudos` row** — capture the returned `id`.
  3. **Bulk-insert `kudo_hashtags`** — a single `supabase.from('kudo_hashtags').insert([...])` with the resolved hashtag ids. On failure: `DELETE FROM kudos WHERE id = ?` (compensating rollback) and return the error.
  4. **Bulk-insert `kudo_images`** (Phase 4 when uploads ship) + **`kudo_mentions`** (also Phase 4 once the mention extension lands) — same failure compensation.
  5. **Bump `hashtags.usage_count`** — separate `UPDATE` per hashtag id. Eventually consistent; a partial failure here leaves a stale counter but the Kudo itself is valid, so we log and move on rather than roll back.
  6. **Re-read** the freshly-inserted row plus joins and pass through `serializeKudo` for the response (TR-005).
  Orphaned `kudo_hashtags` / `kudo_images` / `kudo_mentions` can't exist after a rollback because they all have `ON DELETE CASCADE` on the parent `kudos` row. An integration test (`create-kudo-rollback.spec.ts`) forces a child-insert failure and asserts no orphan rows remain.
- **Upload flow**: `POST /api/uploads` mints a signed upload URL via `supabase.storage.from('kudo-images').createSignedUploadUrl(path)`, inserts a matching `uploads` row with metadata (MIME, size, width, height), and returns `{ id, uploadUrl, signedReadUrl, expiresAt }` to the client. The client streams the file directly to Storage (TR-003).
- **Masking**: `lib/kudos/serialize-kudo.ts` takes a DB row + joined employee rows and emits `{ senderName, senderAvatarUrl, recipientName, recipientAvatarUrl, ... }` per TR-005.
- **Validation**: Zod schemas colocated in `lib/validations/kudos.ts` (create, list params) and `lib/validations/uploads.ts`.

### Integration Points

- **Existing**:
  - [lib/supabase/server.ts](../../../lib/supabase/server.ts) — reuse verbatim for the authenticated client.
  - [middleware.ts](../../../middleware.ts) — already handles session refresh; extend only if new protected routes need it.
  - [components/shared/FloatingActionButton.tsx](../../../components/shared/FloatingActionButton.tsx) — wire its click to open the new modal.
  - [components/shared/UserAvatar.tsx](../../../components/shared/UserAvatar.tsx) — reuse for recipient dropdown rows + mention popover.
  - [components/ui/icons/](../../../components/ui/icons/) — add the new icons required by design-style.md § Icon Specifications (`ic-bold`, `ic-italic`, `ic-strikethrough`, `ic-list-bulleted`, `ic-link`, `ic-quote`, `ic-mask`, `ic-plus` if not already present, `ic-close`, `ic-check`, `ic-spinner`).
  - [messages/vi.json](../../../messages/vi.json) — add the `kudos.writeKudo.*` namespace for modal strings (title, placeholders, errors). Mirror to `en.json` and `ja.json`.
- **Shared components to leverage**: `LoadingSpinner`, `UserAvatar`, `FloatingActionButton`, existing icon components.
- **API contracts**: [api-docs.yaml](../../contexts/api-docs.yaml) is authoritative. Zod schemas MUST match the YAML; plan adds a `zod-to-openapi` round-trip test to enforce drift detection.

---

## Project Structure

### Documentation (this feature)

```
.momorph/specs/ihQ26W78P2-viet-kudo/
├── spec.md               # Approved spec (do not edit without review)
├── design-style.md       # Visual specs — authoritative for CSS values
├── plan.md               # This file
├── research.md           # — not written (all research inlined here; create if tasks surface new unknowns)
├── tasks.md              # ← produced by /momorph.tasks next
└── assets/
    └── frame.png         # Figma reference screenshot
```

### Source code (new + modified)

```
app/
├── (dashboard)/
│   ├── layout.tsx                                 [MODIFIED — add <WriteKudoModalMount /> island reading ?write=kudo]
│   └── kudos/                                     [NEW route segment — MINIMAL STUB]
│       └── page.tsx                               [NEW — Kudos board stub: renders WriteKudoCTA + a placeholder list of published kudos (fetched via server-side call to GET /api/kudos). FULL board UI (cards, filters, pagination) is out of this feature's scope — tracked separately.]
└── api/
    ├── kudos/
    │   └── route.ts                               [NEW — POST (create) + GET (list)]
    ├── employees/
    │   └── search/route.ts                        [NEW — GET with ?q=&ignore_caller=]
    ├── titles/
    │   └── route.ts                               [NEW — GET]
    ├── hashtags/
    │   └── route.ts                               [NEW — GET with ?q=]
    ├── uploads/
    │   ├── route.ts                               [NEW — POST mint signed url]
    │   └── [id]/route.ts                          [NEW — DELETE]
    └── _test/
        └── sign-in/route.ts                       [NEW — TEST-ONLY, gated by NODE_ENV==='test' + X-Test-Auth secret; mints a Supabase session cookie for Playwright. See § Integration Testing → E2E authentication strategy.]

components/
└── kudos/
    ├── WriteKudoModalMount.tsx                    [NEW — dashboard-layout island: reads ?write=kudo, lazy-loads WriteKudoModal]
    ├── WriteKudoCTA.tsx                           [NEW — Link that opens the modal via ?write=kudo (reused by FAB, Kudos board, Profile)]
    └── WriteKudoModal/
        ├── WriteKudoModal.tsx                     [NEW — top-level client island]
        ├── WriteKudoModal.client.boundary.ts      [NEW — "use client" barrel]
        ├── CancelConfirmDialog.tsx                [NEW — "Huỷ Kudo? Thay đổi sẽ không được lưu." confirmation (FR-013)]
        ├── ModalShell.tsx                         [NEW — dialog, backdrop, focus trap]
        ├── RecipientField.tsx                     [NEW — B]
        ├── TitleField.tsx                         [NEW — Danh hiệu block, inline-create]
        ├── EditorToolbar.tsx                      [NEW — C + community link]
        ├── CommunityStandardsLink.tsx             [NEW — right side of toolbar row]
        ├── RichTextArea.tsx                       [NEW — D (Tiptap)]
        ├── MentionHintRow.tsx                     [NEW — D.1]
        ├── HashtagPicker.tsx                      [NEW — E, inline-create]
        ├── ImageUploader.tsx                      [NEW — F]
        ├── AnonymousCheckbox.tsx                  [NEW — G]
        ├── AnonymousAliasInput.tsx                [NEW — G.1]
        ├── ActionBar.tsx                          [NEW — H]
        ├── parts/
        │   ├── Chip.tsx                           [NEW]
        │   ├── ImageThumbnail.tsx                 [NEW]
        │   ├── Combobox.tsx                       [NEW — shared combobox primitive for Recipient / Title / Hashtag]
        │   ├── ComboboxCreateRow.tsx              [NEW — "Tạo mới: {label}" row]
        │   └── ToolbarButton.tsx                  [NEW]
        └── hooks/
            ├── useKudoForm.ts                     [NEW — useReducer]
            ├── useDraftSync.ts                    [NEW — sessionStorage]
            └── useEmployeeSearch.ts               [NEW — debounced autocomplete]

components/ui/icons/                               [NEW icons per design-style.md § Icon Specs]
├── BoldIcon.tsx
├── ItalicIcon.tsx
├── StrikethroughIcon.tsx
├── BulletListIcon.tsx
├── LinkIcon.tsx
├── QuoteIcon.tsx
├── MaskIcon.tsx
├── PlusIcon.tsx                                   (if missing)
├── CloseIcon.tsx                                  (if missing)
└── CheckIcon.tsx                                  (if missing)

lib/
├── auth/
│   └── current-employee.ts                        [NEW — getCurrentEmployee(supabase) returning the resolved row or throwing ERR_NO_EMPLOYEE_PROFILE]
├── kudos/
│   ├── serialize-kudo.ts                          [NEW — flat public shape; anonymity masking — TR-005]
│   ├── sanitize-body.ts                           [NEW — ProseMirror allow-list via sanitize-html — TR-006]
│   └── hashtag-slug.ts                            [NEW — label → slug normaliser (Unicode NFC, lowercase)]
├── validations/
│   ├── kudos.ts                                   [NEW — Zod for CreateKudoRequest, ListKudosParams, EmployeeSearchParams]
│   └── uploads.ts                                 [NEW — Zod for POST /uploads]
└── constants/
    └── kudos.ts                                   [NEW — MAX_HASHTAGS=5, MAX_IMAGES=5, MAX_ALIAS=60, MAX_BODY_CHARS=5000, ALLOWED_IMAGE_MIME, BUCKET_NAME='kudo-images']

supabase/
├── migrations/                                    [Supabase CLI migration files]
│   ├── 202604201200_employees.sql                 [NEW — tables + indexes]
│   ├── 202604201201_titles_hashtags.sql           [NEW]
│   ├── 202604201202_uploads.sql                   [NEW]
│   └── 202604201203_kudos.sql                     [NEW — kudos + join tables + CHECK constraints]
│   # (no RLS / RPC / dedup-guard migrations per spec rev 3 FR-016 — authorisation is API-only)
├── snippets/
│   └── seed-kudos-test.sql                        [NEW — seed data for integration tests: 20 employees, 10 titles, 30 hashtags]
└── config.toml                                    [MODIFIED — add kudo-images storage bucket config]

types/
└── kudos.ts                                       [NEW — TS types derived from Zod schemas via z.infer<>]

messages/{vi,en,ja}.json                           [MODIFIED — kudos.writeKudo.* i18n keys including errors namespace]

next.config.ts                                     [MODIFIED — add images.remotePatterns for Supabase Storage domain; add CSP / X-Frame-Options / HSTS per TR-010]

app/globals.css                                    [MODIFIED — add Tailwind 4 @theme tokens for the kudo palette (cream #FFF8E1, gold #FFEA9E, olive #998C5F, community-red #E46060, required-red #CF1322) + Montserrat + Noto Sans JP font imports. Tailwind 4's @theme directive supersedes the JS config; see https://tailwindcss.com/docs/theme#using-the-theme-directive]

tests/
├── unit/
│   ├── auth/
│   │   └── current-employee.spec.ts               [NEW — getCurrentEmployee happy path + ERR_NO_EMPLOYEE_PROFILE throw]
│   ├── api-contract.spec.ts                       [NEW — Zod ↔ api-docs.yaml drift guard (Q-P1)]
│   └── kudos/
│       ├── serialize-kudo.spec.ts                 [NEW]
│       ├── sanitize-body.spec.ts                  [NEW]
│       ├── hashtag-slug.spec.ts                   [NEW]
│       ├── useKudoForm.spec.ts                    [NEW]
│       ├── useDraftSync.spec.ts                   [NEW]
│       ├── RecipientField.spec.tsx                [NEW]
│       ├── HashtagPicker.spec.tsx                 [NEW]
│       ├── ImageUploader.spec.tsx                 [NEW]
│       ├── AnonymousAliasInput.spec.tsx           [NEW]
│       ├── CancelConfirmDialog.spec.tsx           [NEW — dirty-state gating + confirm/abort flow (FR-013)]
│       └── WriteKudoModal.spec.tsx                [NEW]
├── integration/
│   └── kudos/
│       ├── create-kudo.spec.ts                    [NEW — hits /api/kudos against test Supabase]
│       ├── create-kudo-rollback.spec.ts           [NEW — force a child-insert failure, assert no orphan kudos row (TS-chain compensating rollback)]
│       ├── employees-search.spec.ts               [NEW]
│       ├── titles.spec.ts                         [NEW]
│       ├── hashtags.spec.ts                       [NEW]
│       ├── uploads.spec.ts                        [NEW]
│       └── anonymity-masking.spec.ts              [NEW — SC-004 verification]
└── e2e/
    ├── _helpers/
    │   └── authSetup.ts                           [NEW — Playwright helper calling /api/_test/sign-in]
    └── kudos/
        ├── write-basic-kudo.spec.ts               [NEW — US1 P1]
        ├── write-kudo-validation.spec.ts          [NEW — US4 P1]
        ├── write-kudo-draft.spec.ts               [NEW — FR-011 draft-restore flows]
        ├── write-anonymous-kudo.spec.ts           [NEW — US3 P2]
        └── write-rich-kudo.spec.ts                [NEW — US2 P2]
```

### Dependencies to install

| Package | Version pin | Purpose |
|---|---|---|
| `@tiptap/react` | latest | React editor wrapper |
| `@tiptap/pm` | latest | ProseMirror peer |
| `@tiptap/starter-kit` | latest | Baseline marks/nodes (we'll disable OrderedList) |
| `@tiptap/extension-link` | latest | Link mark with allow-list |
| `@tiptap/extension-mention` | latest | `@mention` node |
| `@tiptap/suggestion` | latest | Mention suggestion popover |
| `@tiptap/extension-placeholder` | latest | Placeholder text |
| `sanitize-html` + `@types/sanitize-html` | latest | Server-side HTML/ProseMirror sanitiser |
| `@axe-core/playwright` | latest | Automated WCAG 2.1 AA audit in E2E tests (Phase 5 a11y gate) |
| `@radix-ui/react-dialog` *(pending Q-P2)* | latest | Accessible modal primitive — install iff Q-P2 resolves in favour of Radix |
| `sonner` *(pending Q-P3)* | latest | Toast primitive for success + timeout messages — install iff Q-P3 resolves in favour of `sonner` |

---

## Implementation Strategy

### Phase 0 — Asset preparation *(deterministic, no logic)*

- Download toolbar & field icons from Figma via MoMorph `get_media_files` into `public/icons/kudos/` when they aren't already in `components/ui/icons/`.
- Export / inline-SVG new icons listed under "Project Structure → New icons".
- Add design tokens to [app/globals.css](../../../app/globals.css) via Tailwind 4 `@theme` directive.
- Extend [next.config.ts](../../../next.config.ts) with `images.remotePatterns` for the Supabase Storage domain (from `NEXT_PUBLIC_SUPABASE_URL`).
- Add the `kudos.writeKudo.*` i18n namespace to all three message files (placeholder Vietnamese strings taken verbatim from design-style.md; `en.json` / `ja.json` get `TODO` markers for translation review).

### Phase 1 — Foundation (schema, infra, shared helpers)

- Run `supabase/migrations/202604201200*`..`202604201203*` locally via `supabase db reset` against the test project (4 schema migrations — no RLS/RPC/guard).
- Create the private `kudo-images` Storage bucket + policies (`config.toml` update).
- Seed dev employees (`supabase/snippets/seed-kudos-test.sql`).
- Write **failing** tests for `lib/kudos/serialize-kudo.ts`, `lib/kudos/sanitize-body.ts`, `lib/kudos/hashtag-slug.ts`, `lib/auth/current-employee.ts` → implement → green. Zod schemas in `lib/validations/kudos.ts` + `uploads.ts` tested in the same cycle.
- `types/kudos.ts` derived from Zod.

### Phase 2 — P1 vertical slice: User Story 1 + User Story 4

*End-to-end send of a Kudo with validation. No rich text, no images, no anonymity.*

- Backend first (TDD):
  - Integration test `tests/integration/kudos/create-kudo.spec.ts` for KUDO_CREATE_01, 02, 05, 06, 07, 08, 09, 12, 13, 14, 15, 16, 23 — **fails**.
  - Implement `POST /api/kudos` handler using the TS transactional chain described in § Backend Architecture (no RPC). Failing `create-kudo-rollback.spec.ts` → make it green by implementing the compensating `DELETE FROM kudos WHERE id=?` on any child-insert failure. FR-012 is satisfied by the client-side inflight lock alone; no server-side dedup guard.
  - Implement `GET /api/kudos` handler (list feed): paginated, masked via `lib/kudos/serialize-kudo.ts`, signs image URLs. Add tests KUDO_LIST_01, 04, 05, 09, 10 → green.
  - Integration tests for `/api/employees/search` (EMP_SEARCH_01, 04, 06, 08, 13, 14, 18) → green.
  - Integration tests for `/api/titles` (TITLE_LIST_01..04) and `/api/hashtags` (HASHTAG_LIST_01, 05, 08) → green.
- Frontend:
  - Component tests for `RecipientField`, `TitleField` (select-existing flow only), `HashtagPicker` (select-existing flow only), `ActionBar` → **fail** → implement → green.
  - Server Component route at `app/(dashboard)/kudos/page.tsx` preloads top hashtags + titles + first page of kudos via server-side call to `/api/kudos` and renders the board stub (CTA + plain list).
  - `WriteKudoModal` wires `useKudoForm` + submits to `/api/kudos`.
  - **Draft persistence (FR-011)**: implement `useDraftSync(key, state)` hook with sessionStorage serialize/restore. Hook returns `{draft, stale}`; the modal surfaces a non-blocking toast when stale entries are purged on restore. Unit tests cover: save-on-change, restore-on-mount, stale-id purge (recipient deleted), discard-on-successful-submit, discard-on-cancel-confirm.
  - **Cancel confirmation (FR-013)**: `CancelConfirmDialog` component. Triggered on Hủy / ESC / backdrop only when `useKudoForm` state has `isDirty=true`. Clicking "Xác nhận huỷ" clears the draft AND closes the modal (navigates to `pathname` without `?write=kudo`).
  - **Modal mounting (see Architecture Decisions)**: add `WriteKudoModalMount` to `app/(dashboard)/layout.tsx`; add `WriteKudoCTA` as a shared Link opening `?write=kudo`; point [FloatingActionButton](../../../components/shared/FloatingActionButton.tsx) at `WriteKudoCTA` behaviour from homepage + `/kudos`.
- E2E:
  - `tests/e2e/kudos/write-basic-kudo.spec.ts` — covers US1 acceptance scenarios 1–4.
  - `tests/e2e/kudos/write-kudo-validation.spec.ts` — covers US4 acceptance scenarios 1–4, 7.
  - `tests/e2e/kudos/write-kudo-draft.spec.ts` — covers FR-011: fill form → close modal without submit (cancel confirm) → reopen → fields restored; second flow: fill form → reload tab → fields restored.

**Exit criteria**: a signed-in test user can open the modal from the FAB on homepage OR `/kudos`, pick a recipient + title, type a plain-text message, add 1 hashtag, press Gửi, and see the row in the database + the board refresh. Dirty-cancel shows a confirmation; draft survives modal reopen within the session.

### Phase 3 — P2 #1: User Story 2 (rich-text, mentions, images)

- Backend:
  - `POST /api/uploads` (signed URL + metadata row) + integration tests UPLOAD_01..13 → green.
  - `DELETE /api/uploads/[id]` + tests UPLOAD_DEL_01..06 → green.
  - Extend `POST /api/kudos` to accept `imageIds` + mention resolution → add tests KUDO_CREATE_04, 11, 18, 19, 20, 21, 22 → green.
  - Extend sanitiser allow-list for `link` and `mention` nodes; unit tests for sanitise edge cases (script tag, javascript: href, external href).
  - `/api/employees/search?ignore_caller=false` variant tested (EMP_SEARCH_03, 07, 10).
- Frontend:
  - Install Tiptap + wire `RichTextArea`. Toolbar button tests for each format (bold, italic, strike, bullet-list, link, quote) → each uses `editor.isActive(...)` under the hood; `aria-pressed` assertion.
  - `MentionHintRow`.
  - Mention extension hooked to `/api/employees/search?ignore_caller=false` via the `suggestion` plugin → component test for popover open/close, keyboard navigation, insertion.
  - **Fallback for non-employee mention** (spec Edge Cases): when the user types `@xyz` and no suggestion matches, pressing space or Enter leaves the literal `@xyz` text in place — no mention node is inserted, and the server sanitiser does NOT convert plain `@text` to a mention on ingest. Unit test covers this: typing `@ghost` + Space → body.content contains a text node `"@ghost "`, no mention node; submitting → `kudo_mentions` is not populated for ghost.
  - `ImageUploader` + `ImageThumbnail` with parallel signed-URL uploads (3 concurrent, TR-003), progress overlay, retry on failure.
- E2E: `tests/e2e/kudos/write-rich-kudo.spec.ts` — bold + mention + 2 images.

### Phase 4 — P2 #2: User Story 3 (anonymous + community standards + inline-create)

- Backend:
  - Extend `POST /api/kudos` for `isAnonymous` + `anonymousAlias` (KUDO_CREATE_03, 19a, 19b).
  - Extend for inline-create: `titleName` + `hashtags: [{label}]` (KUDO_CREATE_04a, 04b, 16a, 17a).
  - Inline-create via `supabase.from('hashtags').upsert({slug, label}, {onConflict:'slug', ignoreDuplicates:true})` — same pattern for titles. Integration test (`concurrent-insert.spec.ts`) simulates two clients inserting the same new slug simultaneously and asserts one INSERT wins, the other reads back the same id.
  - Integration test `tests/integration/kudos/anonymity-masking.spec.ts` explicitly verifies SC-004: fetch `/api/kudos` as another user and assert `author_id` is absent and `senderName` is the alias or "Ẩn danh".
- Frontend:
  - `AnonymousCheckbox` + `AnonymousAliasInput` with the 180 ms max-height reveal transition; state reset on uncheck (FR-008a).
  - Extend `HashtagPicker` and `TitleField` with the `ComboboxCreateRow` inline-create path; unit tests for "creates new on no-match", "resolves to existing on case-insensitive match".
  - `CommunityStandardsLink` wired to open `/community-standards` in a new tab (`target="_blank" rel="noopener noreferrer"`).
- E2E: `tests/e2e/kudos/write-anonymous-kudo.spec.ts` — anonymous submit with custom alias.

### Phase 5 — Polish & launch gate

- Responsive pass (design-style.md § Responsive): Mobile bottom-sheet, Tablet centred-scroll, Desktop fixed-752. Playwright runs on 3 viewports.
- Accessibility audit:
  - Axe-core run in E2E (add `@axe-core/playwright` — already under consideration per constitution's a11y gate).
  - Manual keyboard walk: Tab cycle, ESC close, combobox patterns, mention popover keyboard nav.
  - Contrast check for the `#E46060` community link (design-style.md flags this ~4.2:1 warning).
- Security hardening (TR-010): add CSP to [next.config.ts](../../../next.config.ts) including `*.supabase.co` in `img-src` and `connect-src`; verify `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Strict-Transport-Security`.
- Toasts for success (`Đã gửi Kudo`) and error cases (timeout, validation summary) — reuse or add a lightweight toast primitive (decision deferred — see Open Questions Q-P3).
- Observability: add `console.error` + Next.js server log for `ERR_NO_EMPLOYEE_PROFILE` so ops can detect mis-seeded employees.

---

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| Tiptap + Next.js 16 RSC compatibility — Tiptap has historically needed care around SSR | Med | Med | Wrap the editor in a `"use client"` boundary; render only after `useEffect` mount; add a fallback textarea if loading fails. Prototype in Phase 3 day 1 before deeper integration |
| ProseMirror sanitiser allow-list gap → XSS | Low | **High** | Use `sanitize-html` with a closed allow-list; add explicit unit tests for `<script>`, `onerror=`, `javascript:` href, `data:` href, external-domain href; add `@axe-core` + manual security review before launch |
| **No RLS** — a future caller that bypasses the Route Handler (direct PostgREST call with a leaked session cookie) could write anything | Med | **High** | CSRF protection on every mutating Route Handler (TR-004) + same-origin check is the only guard. Document the threat model in `lib/supabase/server.ts` comment. If a direct-to-Supabase feature ships later, RLS MUST be added scoped to the tables that path touches |
| **Non-atomic TS transactional chain** — the compensating `DELETE FROM kudos` can itself fail, leaving an orphan `kudos` row with empty join tables | Low | Med | `create-kudo-rollback.spec.ts` exercises the child-insert-fails path; a second test covers compensate-fails-too (the handler still returns 500 and logs with a correlation id so ops can clean up). Consider Postgres advisory locks for v2 if incidents occur |
| `employees` master-data not seeded by launch → every user gets 403 | Med | **High** | Add a smoke test in CI that fails if the `employees` table in the preview environment has < 1 row. Add a deploy step to import from HR CSV before inviting users. Flagged in Dependencies checklist |
| Supabase Storage signed URL TTL causes broken image after page sits open | Low | Low | Regenerate signed URLs at `GET /api/kudos` time (TR-008). If the feed is stale > 1 h the images 403 — acceptable for v1 since the client auto-refetches on `router.refresh()` |
| Duplicate hashtag / title inserted under a race (no DB transaction) | Low | Low | `upsert({onConflict:'slug', ignoreDuplicates:true})` is race-safe because the partial unique index on `slug` rejects the second INSERT. Integration test `concurrent-insert.spec.ts` confirms |
| Tailwind 4 CSS-first `@theme` vs JS config confusion | Low | Low | Decision made: use `@theme` in `app/globals.css` (see Architecture Decisions § Frontend). `tailwind.config.ts` stays minimal |
| Draft in `sessionStorage` restores a deleted recipient → confusing UX | Low | Low | On restore, `GET /api/employees/search?q=<cached name>` to revalidate; drop entry + toast if not found (already in FR-011) |

### Estimated complexity

- **Frontend**: **High** — 14 client components + Tiptap + 3 comboboxes with inline-create + accessibility + responsive
- **Backend**: **Medium** — 6 Route Handlers + a TS transactional chain with compensating rollback; no DB-layer RLS / RPCs / dedup guards.
- **Testing**: **High** — 78 API test cases from BACKEND_API_TESTCASES.md, 4 E2E flows, component tests, axe-core, security tests

---

## Integration Testing Strategy

### Test scope

- ✅ **Component/Module interactions**: `WriteKudoModal` ↔ sub-components (form state propagation, draft sync, submit flow).
- ✅ **External dependencies**: Supabase Postgres (real test project), Supabase Storage (real bucket).
- ✅ **Data layer**: CRUD on `kudos`, `uploads`, master tables; TS-chain transactional-rollback correctness.
- ✅ **User workflows**: US1 & US4 (P1) end-to-end via Playwright; US2 & US3 via Playwright at P2.

### Test categories

| Category | Applicable? | Key scenarios |
|---|---|---|
| UI ↔ Logic | Yes | Form-state reducer, draft-sync, submit flow, inline-create toggles, anonymous reveal |
| Service ↔ Service | N/A | No inter-service calls — single Route-Handler layer |
| App ↔ External API | Yes | Supabase JS (DB + Storage); mention popover `fetch` |
| App ↔ Data Layer | Yes | Route Handlers ↔ Postgres tables via the authenticated Supabase client; TS-chain rollback verification |
| Cross-platform | Yes | Mobile bottom-sheet vs Desktop centred-dialog (Playwright viewports: 375×812, 768×1024, 1440×900) |

### Test environment

- **Environment type**: Local dev (+ `supabase start` for Postgres/Storage containers); CI uses a dedicated Supabase test project.
- **Test data strategy**: `supabase/snippets/seed-kudos-test.sql` factory loaded before each integration test run; Playwright tests use a `beforeEach` API call to truncate + reseed.
- **Isolation approach**:
  - **Unit-level function tests** (e.g. `lib/kudos/*.spec.ts`) that open their own Supabase client may wrap assertions in `BEGIN / ROLLBACK`.
  - **HTTP-level integration tests** cannot share a transaction with the Route Handler — the handler opens its own connection. Strategy: `beforeEach` calls a `TRUNCATE TABLE kudos, kudo_hashtags, kudo_images, kudo_mentions, uploads RESTART IDENTITY CASCADE` plus a reseed of master tables (titles, hashtags, employees) from `seed-kudos-test.sql`. The truncate set excludes the seeded master tables so employees/titles/hashtags survive.
  - **E2E tests** use per-test email aliases (e.g. `e2e-${nanoid}@sun-asterisk.com`) and the test sign-in endpoint seeds a matching `employees` row. Truncation happens once at `globalSetup` so tests can run in parallel against the same database without colliding.
- **E2E authentication strategy**: Supabase Auth's Google OAuth + OTP flows are not automatable from Playwright. For E2E we use a **test-only sign-in endpoint** `app/api/_test/sign-in/route.ts` that is:
  1. Gated by `process.env.NODE_ENV === 'test'` AND a secret header `X-Test-Auth: ${TEST_AUTH_SECRET}`.
  2. Takes `{ email }`, mints a Supabase session cookie via the service-role `admin.generateLink({ type: 'magiclink' })` + `verifyOtp` pattern, and sets the HTTP-only cookie.
  3. Seeds a matching `employees` row if missing.
  A Playwright `authSetup.ts` helper calls this before each test file. The endpoint is excluded from `npm run build` by guard + CI check. This is the one place the service-role client is used outside admin paths — scope-limited to test env only.

### Mocking strategy

| Dependency | Strategy | Rationale |
|---|---|---|
| Supabase Auth | **Real** | Auth/cookie flow is exercised end-to-end in integration + E2E; unit tests mock `getCurrentEmployee()` directly |
| Supabase Postgres | **Real** in integration + E2E; **mock** in unit | Integration tests exercise the real TS transactional chain + CHECK constraints; unit-level component tests use MSW to stub Route Handlers |
| Supabase Storage | **Real** in integration/E2E; mock upload URL in unit | Storage Policies are only verifiable against a real bucket |
| External mention/profile pages | **Stub** | Not under test |

### Test scenarios outline

1. **Happy path**
   - [ ] US1: basic Kudo submit end-to-end → appears on board
   - [ ] US2: bold + 1 mention + 2 images → posted + signed URLs visible
   - [ ] US3: anonymous submit with alias → board shows alias, DB retains `author_id`
   - [ ] Inline-create: new hashtag + new Danh hiệu in the same submit → master rows inserted
2. **Error handling**
   - [ ] Recipient empty / Message empty / Hashtag zero → inline errors, submit blocked
   - [ ] Image > 5 MB → client toast, upload aborted; server rejects if bypassed (415/413)
   - [ ] Network timeout mid-submit → modal stays, toast shown, state intact
   - [ ] Alias > 60 chars bypassed client-side → server 422
   - [ ] Session expired mid-form → 401 → refresh flow via `@supabase/ssr`
3. **Edge cases**
   - [ ] Kudo-self attempt → recipient filter + server 422
   - [ ] Duplicate hashtag (race) → `ON CONFLICT` resolves to existing id
   - [ ] Anonymous masking via serializer — confirm `author_id` never on the wire (SC-004)
   - [ ] TS-chain rollback: child-insert failure → no orphan `kudos` row + no orphan join rows

### Tooling & framework

- **Test framework**: Vitest (unit + integration), Playwright (E2E)
- **Supporting tools**: MSW for unit-level network mocks; `@axe-core/playwright` for a11y; `supabase start` locally
- **CI integration**: GitHub Actions — unit + integration blocks the PR; E2E runs on merge to main against staging

### Coverage goals

| Area | Target | Priority |
|---|---|---|
| Route Handlers (FR-016 paths) | 95 % lines, 90 % branches | High |
| Sanitiser + serializer | 100 % branches | High |
| React hooks (`useKudoForm`, `useDraftSync`) | 90 % | High |
| Client components | 80 % | Medium |
| E2E P1 flows (US1, US4) | All acceptance scenarios | High |
| E2E P2 flows (US2, US3) | Golden path + 1 edge per story | Medium |

---

## Dependencies & Prerequisites

### Required before start

- [x] `constitution.md` reviewed (v1.0.0)
- [x] `spec.md` approved (2026-04-20)
- [x] `design-style.md` approved
- [x] API contract `api-docs.yaml` frozen
- [x] DB schema `database-schema.sql` frozen
- [x] Backend test cases `BACKEND_API_TESTCASES.md` available
- [ ] Supabase project provisioned (dev + staging + production)
- [ ] `kudo-images` private bucket + Storage Policies created
- [ ] `pg_trgm` extension enabled
- [ ] Tailwind `@theme` tokens added to `app/globals.css`
- [ ] Tiptap + sanitize-html dependency PR merged (constitution amendment)

### External dependencies

- `community-standards` static page target URL (not owned by this team — follow up with content/legal)
- HR master-data source for `employees` seed (CSV, SSO, or admin-UI path — ops to confirm path)

---

## Open Questions

- **Q-P1 (schema drift)**: Do we block CI when the Zod schemas in `lib/validations/kudos.ts` drift from `api-docs.yaml`? *Recommendation*: yes — add a `zod-to-openapi` round-trip check in `tests/unit/api-contract.spec.ts`.
- **Q-P2 (Radix Dialog)**: Adopt `@radix-ui/react-dialog` for the modal shell, or hand-roll the focus trap + `aria-modal`? *Recommendation*: Radix — 3 lines vs ~80 lines of custom a11y, well-tested, already MIT. Would require a constitution amendment entry alongside Tiptap.
- **Q-P3 (toast primitive)**: Reuse an existing toast or add a new dependency (`sonner`, `react-hot-toast`)? No toast library is in the repo today. *Recommendation*: add `sonner` in the same constitution-amendment PR as Tiptap.
- **Q-P4 (Playwright in CI)**: Can the E2E suite run against ephemeral Supabase preview branches per PR (Supabase's "branching" feature), or is our test project a single shared instance? Ops input needed.
- **Q-P5 (i18n strings)**: The design copy is Vietnamese-first. Do we commit to providing `en.json` / `ja.json` translations before launch, or ship Vietnamese-only and let next-intl fall through? Product decision.
- **Q-P6 (Tailwind 4 tokens location)**: Plan commits to `@theme` in `app/globals.css`. If the team prefers keeping tokens in `tailwind.config.ts` for tooling compatibility, flag early — both work, but we want one canonical location for the entire codebase.
- **Q-P7 (Test sign-in endpoint exposure)**: The `app/api/_test/sign-in/route.ts` endpoint is gated by `NODE_ENV === 'test'` + secret header. Is that sufficient, or should we build it with a separate tsconfig include/exclude pattern so the route literally doesn't exist in production bundles? *Recommendation*: the latter — add a build-time guard that fails the build if `NODE_ENV === 'production'` and the file is present.

---

## Next Steps

After plan approval:

1. Open the **constitution amendment PR** adding Tiptap, sanitize-html, Radix Dialog, sonner (pending Q-P2 / Q-P3).
2. Run `/momorph.tasks` to break this plan into an ordered task list (expected ~70 tasks across 5 phases).
3. Run `/momorph.implement` once the task list is approved.

---

## Notes

- This feature is the **first write-path feature** in the SAA project. Every decision here — `getCurrentEmployee()`, TS-chain transactional pattern with compensating rollback, sanitiser allow-list, serializer masking — will be copy-pasted by subsequent features (Kudos Board, Edit Kudo, Profile "Kudos Received"). Treat patterns here as templates worth over-documenting.
- The spec explicitly keeps **Supabase Realtime out of scope** (FR-014). If product later wants live-updating boards, the infrastructure to add it (channel subscription, anon-key filter) is tiny — plan the hook but don't enable it here.
- The constitution's "Test-First (NON-NEGOTIABLE)" means the Phase 2 vertical slice MUST start with a failing integration test against a real Supabase test project, not a unit test with mocks. Budget 1 extra day in Phase 1 to stand up the seeded test project if it's not already wired.
- Design-style.md is authoritative for pixel values — resist the urge to "round" 56px → `w-14` vs `h-[56px]`; keep Tailwind arbitrary values where the design demands exact pixels (e.g. the 502×60 submit button).

### Revision history

- **rev 3 (2026-04-20)** — Dropped **all DB-layer authorisation and transactional machinery** to match spec.md rev 3 FR-016: no Row Level Security, no `fn_create_kudo` / `fn_insert_*` RPC functions, no `kudo_submit_guard` dedup table. `POST /api/kudos` now uses a **TypeScript transactional chain with compensating rollback** via the Supabase JS client. FR-012 server-side 2-second dedup is gone; client-side button-disable lock is sole. Phase 1 runs 4 migrations instead of 6; `rls-defense.spec.ts` and `kudo-dedup.spec.ts` removed, `create-kudo-rollback.spec.ts` added. Constitution-deviation note added — the "RLS on every table" default is intentionally relaxed because the anon-key session is minted only server-side inside same-origin Route Handlers + CSRF gate (TR-004). Plan flags a new risk: CSRF is now the sole cross-origin guard, so it MUST be enabled on every mutating handler.
- **rev 2 (2026-04-20)** — Reorganised; various tightenings from reviews.
- **rev 1 (2026-04-20)** — Initial plan.
