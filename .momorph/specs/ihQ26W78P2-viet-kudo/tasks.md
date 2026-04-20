# Tasks: Viết Kudo (Write a Kudo)

**Frame**: `ihQ26W78P2-viet-kudo`
**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [design-style.md](./design-style.md)
**Generated**: 2026-04-20

---

## Task Format

```
- [ ] T### [P?] [Story?] Description | file/path.ts
```

- **[P]**: Can run in parallel (different files, no dependency on an incomplete task)
- **[Story]**: Which user story this belongs to (US1, US2, US3, US4) — applies only to user-story phases (Phase 3+)
- **|**: File path created or modified by this task

**User stories** (from spec.md):
- **US1** (P1) — Send a basic Kudo to a teammate
- **US4** (P1) — Block submission and recover when data is incomplete or invalid
- **US2** (P2) — Enrich with rich-text, @mentions, images
- **US3** (P2) — Send anonymously with alias + Community Standards link + inline-create (hashtag + Danh hiệu)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: dependencies, design tokens, i18n namespace, Next.js configuration, icon components. No feature logic.

- [ ] T001 Open constitution amendment PR adding approved libraries (Tiptap bundle, sanitize-html, @axe-core/playwright; pending Radix Dialog / sonner per Q-P2 / Q-P3) | .momorph/constitution.md *(DEFERRED — governance step, needs team action)*
- [x] T002 Install Tiptap + peer packages | package.json *(installed: @tiptap/react @tiptap/pm @tiptap/starter-kit @tiptap/extension-link @tiptap/extension-mention @tiptap/suggestion @tiptap/extension-placeholder)*
- [x] T003 Install server-side sanitiser | package.json *(installed: sanitize-html + @types/sanitize-html)*
- [x] T004 [P] Install a11y test tool | package.json *(installed: @axe-core/playwright)*
- [x] T005 [P] Add Tailwind 4 `@theme` tokens for Kudo palette + Montserrat + Noto Sans JP | app/globals.css
- [x] T006 [P] Extend `images.remotePatterns` for Supabase Storage domain derived from `NEXT_PUBLIC_SUPABASE_URL` | next.config.ts
- [x] T007 [P] Add `kudos.writeKudo.*` i18n namespace (title, field labels, placeholders, `errors.*` sub-namespace, toast messages) | messages/vi.json
- [x] T008 [P] Mirror the namespace with TODO markers for translators | messages/en.json
- [x] T009 [P] Mirror the namespace with TODO markers for translators | messages/ja.json
- [ ] T010 [P] Download missing Figma icons (ic-bold, ic-italic, ic-strikethrough, ic-list-bulleted, ic-link, ic-quote, ic-mask, ic-plus, ic-close, ic-check, ic-spinner) | public/icons/kudos/ *(SKIPPED — no Figma MCP access in this env. Icons T011–T020 generated inline as SVG components per existing project pattern; ic-spinner already exists as `LoadingSpinner`)*
- [x] T011 [P] Create `BoldIcon` component | components/ui/icons/BoldIcon.tsx
- [x] T012 [P] Create `ItalicIcon` component | components/ui/icons/ItalicIcon.tsx
- [x] T013 [P] Create `StrikethroughIcon` component | components/ui/icons/StrikethroughIcon.tsx
- [x] T014 [P] Create `BulletListIcon` component | components/ui/icons/BulletListIcon.tsx
- [x] T015 [P] Create `LinkIcon` component | components/ui/icons/LinkIcon.tsx
- [x] T016 [P] Create `QuoteIcon` component | components/ui/icons/QuoteIcon.tsx
- [x] T017 [P] Create `MaskIcon` (incognito) component | components/ui/icons/MaskIcon.tsx
- [x] T018 [P] Create `PlusIcon` component | components/ui/icons/PlusIcon.tsx
- [x] T019 [P] Create `CloseIcon` component | components/ui/icons/CloseIcon.tsx
- [x] T020 [P] Create `CheckIcon` component | components/ui/icons/CheckIcon.tsx

**Checkpoint**: ✅ dependencies installed, tokens & i18n namespace in place, 10 icons created. TypeScript + lint clean on all new files. T001 deferred to governance; T010 skipped (no Figma MCP, icons implemented inline).

---

## Phase 2: Foundation (Blocking Prerequisites)

**Purpose**: database schema, RLS policies, RPC functions, shared lib helpers, test infrastructure. Every user story depends on this phase.

**⚠️ CRITICAL**: No user-story work begins until this phase is green.

### Database schema & storage

- [ ] T021 Create migration for `employees` master-data table (BIGSERIAL id, standalone) + indexes + CHECK constraints + enable `pg_trgm` extension | supabase/migrations/202604201200_employees.sql
- [ ] T022 [P] Create migration for `titles` + `hashtags` (user-generated, slug unique, CHECK name length, created_by BIGINT FK) | supabase/migrations/202604201201_titles_hashtags.sql
- [ ] T023 [P] Create migration for `uploads` (BIGSERIAL, owner_id BIGINT FK, MIME CHECK, byte_size ≤ 5 MB) | supabase/migrations/202604201202_uploads.sql
- [ ] T024 Create migration for `kudos` + join tables (`kudo_hashtags`, `kudo_images`, `kudo_mentions`) with ck_kudos_not_self + anonymous_alias CHECK constraints | supabase/migrations/202604201203_kudos.sql
- [ ] T025 Create migration for RLS policies per FR-016 (authenticated-role permissive writes; SELECT filters; `anon` denied) | supabase/migrations/202604201204_rls_policies.sql
- [ ] T026 Create migration for RPC functions `fn_create_kudo`, `fn_insert_title_if_missing`, `fn_insert_hashtag_if_missing` (used from Phases 3 & 5) | supabase/migrations/202604201205_rpc_functions.sql
- [ ] T027 Create migration for `kudo_submit_guard` dedup table + TTL sweep (FR-012) | supabase/migrations/202604201206_submit_guard.sql
- [ ] T028 Configure private `kudo-images` Storage bucket + Storage Policy (MIME whitelist, 5 MB, path prefix `{auth.uid()}/*`) | supabase/config.toml
- [ ] T029 [P] Seed script for integration tests (20 employees, 10 titles, 30 hashtags) | supabase/snippets/seed-kudos-test.sql
- [ ] T030 Run migrations + seed against local Supabase (`supabase db reset`) and the CI test project; verify with `psql \d+ kudos` | *(ops task — no file)*

### Shared library code

- [ ] T031 [P] Domain constants | lib/constants/kudos.ts
- [ ] T032 [P] Hashtag label → slug normaliser (Unicode NFC, lowercase) | lib/kudos/hashtag-slug.ts
- [ ] T033 [P] Zod schemas for `CreateKudoRequest`, `ListKudosParams`, `EmployeeSearchParams` (emit `errors.*` i18n keys per plan § Validation error i18n) | lib/validations/kudos.ts
- [ ] T034 [P] Zod schemas for `POST /api/uploads` | lib/validations/uploads.ts
- [ ] T035 Shared TypeScript types derived from Zod via `z.infer<>` | types/kudos.ts
- [ ] T036 `getCurrentEmployee(supabase)` helper — reads JWT email, looks up active `employees` row, throws `ERR_NO_EMPLOYEE_PROFILE` | lib/auth/current-employee.ts
- [ ] T037 [P] ProseMirror JSON sanitiser (allow-list: paragraph, bold, italic, strike, bullet-list, list-item, link w/ href allow-list, blockquote, mention, text; strip script/event handlers/javascript: hrefs) | lib/kudos/sanitize-body.ts
- [ ] T038 [P] `serializeKudo(row, employeesById)` — flat shape with pre-resolved `senderName`, `senderAvatarUrl`, `recipientName`, `recipientAvatarUrl` per TR-005 | lib/kudos/serialize-kudo.ts

### Test infrastructure

- [ ] T039 Test-only sign-in endpoint (NODE_ENV==='test' + X-Test-Auth secret; uses service-role admin API to mint a session cookie + seed matching employees row) | app/api/_test/sign-in/route.ts
- [ ] T040 Build-time guard that fails `next build` if NODE_ENV==='production' and the test endpoint file is present (Q-P7) | next.config.ts
- [ ] T041 Playwright auth-setup helper that calls `/api/_test/sign-in` | tests/e2e/_helpers/authSetup.ts
- [ ] T042 Vitest integration setup: `TRUNCATE kudos, kudo_hashtags, kudo_images, kudo_mentions, uploads, kudo_submit_guard RESTART IDENTITY CASCADE` + reseed in `beforeEach`; preserves employees/titles/hashtags master | tests/setup.ts

### Unit tests for shared helpers (TDD — red first)

- [ ] T043 [P] Unit tests for `hashtag-slug` (NFC normalisation, case fold, diacritics preserved, charset validation) | tests/unit/kudos/hashtag-slug.spec.ts
- [ ] T044 [P] Unit tests for `sanitize-body` (script tag, onerror=, javascript: href, external href, data: href, allowed marks preserved) | tests/unit/kudos/sanitize-body.spec.ts
- [ ] T045 [P] Unit tests for `serialize-kudo` (anonymous masking matrix: alias present / alias empty / not anonymous) | tests/unit/kudos/serialize-kudo.spec.ts
- [ ] T046 [P] Unit tests for `getCurrentEmployee` (happy path, no employees row → throws, deleted_at employee → throws) | tests/unit/auth/current-employee.spec.ts
- [ ] T047 [P] Unit test: Zod schemas ↔ api-docs.yaml drift guard via `zod-to-openapi` round-trip (Q-P1) | tests/unit/api-contract.spec.ts

**Checkpoint**: Foundation ready — schema applied, helpers green, test harness functional.

---

## Phase 3: User Story 1 + User Story 4 (Priority: P1) 🎯 MVP

**Goal**: End-to-end send of a basic Kudo with inline validation. No rich text, no images, no anonymity, no inline-create.

**Independent Test**: signed-in test user opens the modal via the FAB, picks a recipient + Danh hiệu (existing only), types plain-text message, adds 1 existing hashtag, presses **Gửi** → row appears in the database → stub Kudos board shows the new row at the top. Empty-recipient / empty-body / zero-hashtag submit attempts are blocked with field-level errors; session draft restores on modal reopen.

### Backend integration tests (US1 — red first)

- [ ] T048 [P] [US1] Integration tests for `POST /api/kudos` happy path + self-recipient + missing-field validation — KUDO_CREATE_01, 02, 05, 06, 07, 08, 09, 12, 13, 14, 15, 23 | tests/integration/kudos/create-kudo.spec.ts
- [ ] T049 [P] [US1] Integration tests for `GET /api/employees/search` — EMP_SEARCH_01, 04, 06, 08, 13, 14, 18 | tests/integration/kudos/employees-search.spec.ts
- [ ] T050 [P] [US1] Integration tests for `GET /api/titles` — TITLE_LIST_01..04 | tests/integration/kudos/titles.spec.ts
- [ ] T051 [P] [US1] Integration tests for `GET /api/hashtags` — HASHTAG_LIST_01, 05, 08 | tests/integration/kudos/hashtags.spec.ts
- [ ] T052 [P] [US1] Integration tests for `GET /api/kudos` list feed — KUDO_LIST_01, 05, 09, 10 | tests/integration/kudos/list-kudos.spec.ts
- [ ] T053 [P] [US1] Integration test for FR-012 dedup: replay same payload within 2 s → 201 returns same id, second insert blocked | tests/integration/kudos/kudo-dedup.spec.ts
- [ ] T054 [P] [US1] Integration test for RLS defence — `anon` role denied INSERT on every Kudo-related table | tests/integration/kudos/rls-defense.spec.ts

### Backend implementation (US1)

- [ ] T055 [US1] `POST /api/kudos` + `GET /api/kudos` handler (calls `fn_create_kudo` RPC for create; list uses `serializeKudo`; image URLs signed server-side) | app/api/kudos/route.ts
- [ ] T056 [US1] Server-side dedup logic in POST handler: compute `sha256(author_id || recipient_id || body_plain)`, INSERT into `kudo_submit_guard` with 2-s TTL, reject on conflict | app/api/kudos/route.ts *(same file as T055)*
- [ ] T057 [P] [US1] `GET /api/employees/search` handler with `q`, `ignore_caller`, `limit` params | app/api/employees/search/route.ts
- [ ] T058 [P] [US1] `GET /api/titles` handler (active-only, sort_order) | app/api/titles/route.ts
- [ ] T059 [P] [US1] `GET /api/hashtags` handler (default top-used, `q` prefix via pg_trgm) | app/api/hashtags/route.ts

### Frontend component tests (US1 + US4 — red first)

- [ ] T060 [P] [US1] Component tests for `RecipientField` (typeahead, selection, empty-state error for US4) | tests/unit/kudos/RecipientField.spec.tsx
- [ ] T061 [P] [US1] Component tests for `TitleField` select-existing flow only (popover open/close, selection, required error) | tests/unit/kudos/TitleField.spec.tsx
- [ ] T062 [P] [US1] Component tests for `HashtagPicker` select-existing flow only (add/remove chips, 5-max hide, required error) | tests/unit/kudos/HashtagPicker.spec.tsx
- [ ] T063 [P] [US1] Component tests for `ActionBar` (Gửi disabled until valid, loading spinner, Hủy triggers confirm when dirty) | tests/unit/kudos/ActionBar.spec.tsx
- [ ] T064 [P] [US4] Component tests for `CancelConfirmDialog` (dirty gating, confirm/abort outcomes) | tests/unit/kudos/CancelConfirmDialog.spec.tsx
- [ ] T065 [P] [US1] Hook tests for `useKudoForm` reducer (field updates, isDirty, isValid derivations) | tests/unit/kudos/useKudoForm.spec.ts
- [ ] T066 [P] [US1] Hook tests for `useDraftSync` (save-on-change, restore-on-mount, stale-id purge, discard on submit/cancel) | tests/unit/kudos/useDraftSync.spec.ts
- [ ] T067 [P] [US1] Hook tests for `useEmployeeSearch` (250 ms debounce, AbortController cancellation) | tests/unit/kudos/useEmployeeSearch.spec.ts

### Frontend shared primitives (US1)

- [ ] T068 [P] [US1] `Chip` primitive (hashtag/recipient chip with ✕) | components/kudos/WriteKudoModal/parts/Chip.tsx
- [ ] T069 [P] [US1] `Combobox` primitive with WAI-ARIA combobox pattern (role="combobox", aria-expanded, aria-activedescendant, options role="option") | components/kudos/WriteKudoModal/parts/Combobox.tsx

### Frontend hooks (US1)

- [ ] T070 [P] [US1] `useKudoForm` — `useReducer` with `{recipient, title, body, hashtags, images, isAnonymous, alias}`; derives `isDirty`, `isValid` | components/kudos/WriteKudoModal/hooks/useKudoForm.ts
- [ ] T071 [P] [US1] `useDraftSync(key, state, {onStale})` — sessionStorage mirror with stale-id revalidation on restore | components/kudos/WriteKudoModal/hooks/useDraftSync.ts
- [ ] T072 [P] [US1] `useEmployeeSearch(q, {ignoreCaller})` — debounced fetch to `/api/employees/search` with `AbortController` | components/kudos/WriteKudoModal/hooks/useEmployeeSearch.ts

### Frontend field components (US1 — select-existing only)

- [ ] T073 [US1] `RecipientField` — uses `useEmployeeSearch` + `Combobox`; `ignore_caller=true` | components/kudos/WriteKudoModal/RecipientField.tsx
- [ ] T074 [US1] `TitleField` — select-existing path only (inline-create added in Phase 5 / US3); `Combobox` with server-provided titles | components/kudos/WriteKudoModal/TitleField.tsx
- [ ] T075 [US1] `HashtagPicker` — select-existing path only; chip layout; `+ Hashtag` trigger hides at 5 | components/kudos/WriteKudoModal/HashtagPicker.tsx
- [ ] T076 [US1] `ActionBar` (Hủy + Gửi) with dirty-state + submit loading | components/kudos/WriteKudoModal/ActionBar.tsx
- [ ] T077 [US4] `CancelConfirmDialog` (triggered only when `isDirty`) | components/kudos/WriteKudoModal/CancelConfirmDialog.tsx

### Modal shell + mounting (US1)

- [ ] T078 [US1] `ModalShell` — dialog, backdrop, focus trap, ESC handling, role="dialog" aria-modal aria-labelledby (decision on Radix vs hand-rolled pending Q-P2 — default to hand-rolled until resolved) | components/kudos/WriteKudoModal/ModalShell.tsx
- [ ] T079 [US1] `WriteKudoModal` top-level client island — composes all field components, wires `useKudoForm` + `useDraftSync`, `POST /api/kudos` on submit, calls `router.refresh()` + `router.replace(pathname)` on success | components/kudos/WriteKudoModal/WriteKudoModal.tsx
- [ ] T080 [US1] `WriteKudoModal.client.boundary.ts` — "use client" barrel re-export | components/kudos/WriteKudoModal/WriteKudoModal.client.boundary.ts
- [ ] T081 [US1] `WriteKudoModalMount` — dashboard-layout island that reads `?write=kudo` via `useSearchParams()` and lazy-loads the modal | components/kudos/WriteKudoModalMount.tsx
- [ ] T082 [US1] `WriteKudoCTA` — `<Link href={`${pathname}?write=kudo`}>` reusable by FAB / Kudos board / Profile | components/kudos/WriteKudoCTA.tsx
- [ ] T083 [US1] Mount `<WriteKudoModalMount />` inside the dashboard layout | app/(dashboard)/layout.tsx
- [ ] T084 [US1] Wire [FloatingActionButton](../../../components/shared/FloatingActionButton.tsx) to render the `WriteKudoCTA` behaviour | components/shared/FloatingActionButton.tsx

### Kudos board stub page (US1)

- [ ] T085 [US1] Server Component page that preloads titles + top hashtags + first page of `/api/kudos`; renders `WriteKudoCTA` + a plain list of published kudos (NOT the full board) | app/(dashboard)/kudos/page.tsx

### E2E tests (US1 + US4)

- [ ] T086 [P] [US1] E2E US1 acceptance scenarios 1–4: open from FAB → fill → submit → see on board | tests/e2e/kudos/write-basic-kudo.spec.ts
- [ ] T087 [P] [US4] E2E US4 acceptance scenarios 1–4 & 7: field-level validation errors block submit; network timeout keeps state | tests/e2e/kudos/write-kudo-validation.spec.ts
- [ ] T088 [P] [US1] E2E FR-011 draft: fill → cancel (confirm dirty) → reopen → fields restored; + reload tab → fields restored | tests/e2e/kudos/write-kudo-draft.spec.ts

**Checkpoint**: MVP complete — US1 + US4 pass end-to-end. Stop here if shipping an MVP cut. Do NOT proceed to Phase 4 until integration + E2E suites are green.

---

## Phase 4: User Story 2 — Rich-text, @mentions, images (Priority: P2)

**Goal**: Enrich the message body with Tiptap formatting (bold, italic, strike, bullet list, link, block-quote), `@mention` via server-backed popover, and 0–5 image attachments via Supabase Storage signed URLs.

**Independent Test**: on a working MVP, author a Kudo that (a) toggles Bold + Italic on selected text, (b) inserts an `@mention` of an active employee that renders as a profile link, (c) uploads 2 images that render as thumbnails with ✕ delete, (d) submits successfully and all three enrichments appear in the published payload.

### Backend — uploads (US2)

- [ ] T089 [P] [US2] Integration tests for `POST /api/uploads` — UPLOAD_01..13 | tests/integration/kudos/uploads.spec.ts
- [ ] T090 [P] [US2] Integration tests for `DELETE /api/uploads/[id]` — UPLOAD_DEL_01..06 | tests/integration/kudos/uploads-delete.spec.ts
- [ ] T091 [US2] `POST /api/uploads` handler — mint `createSignedUploadUrl`, insert `uploads` row, return `{id, uploadUrl, signedReadUrl, expiresAt}` | app/api/uploads/route.ts
- [ ] T092 [US2] `DELETE /api/uploads/[id]` handler — ownership check, blocks when attached to `kudo_images`, removes Storage object | app/api/uploads/[id]/route.ts

### Backend — extend kudos for images + mentions + rich-text (US2)

- [ ] T093 [US2] Extend `POST /api/kudos` to accept `imageIds[]`, persist `kudo_images` with `position`, resolve mentions from body → persist `kudo_mentions` | app/api/kudos/route.ts
- [ ] T094 [US2] Extend sanitiser allow-list for `link` (href must start with `/profile/` or `https://saa.sun-asterisk.com/`) and `mention` nodes (attrs.id integer, attrs.label string) | lib/kudos/sanitize-body.ts
- [ ] T095 [P] [US2] Extend integration tests for create-kudo: KUDO_CREATE_04, 11, 18, 19, 20, 21, 22 | tests/integration/kudos/create-kudo.spec.ts *(append)*
- [ ] T096 [P] [US2] Extend sanitiser unit tests: script tag, event handler, javascript: href, disallowed external href, mention attrs tampering | tests/unit/kudos/sanitize-body.spec.ts *(append)*
- [ ] T097 [P] [US2] Extend `employees-search.spec.ts` for `ignore_caller=false` — EMP_SEARCH_03, 07, 10 | tests/integration/kudos/employees-search.spec.ts *(append)*

### Frontend — rich-text editor (US2)

- [ ] T098 [P] [US2] Component tests for `ToolbarButton` (aria-pressed, click → editor.chain), one test per format | tests/unit/kudos/ToolbarButton.spec.tsx
- [ ] T099 [P] [US2] Component tests for `RichTextArea` (format toggles, placeholder, @-trigger opens popover, non-employee mention fallback leaves plain text) | tests/unit/kudos/RichTextArea.spec.tsx
- [ ] T100 [P] [US2] Component tests for `ImageUploader` (file picker, 3-parallel upload, retry on failure, 5-max hide) | tests/unit/kudos/ImageUploader.spec.tsx
- [ ] T101 [P] [US2] `ToolbarButton` primitive (icon + aria-pressed) | components/kudos/WriteKudoModal/parts/ToolbarButton.tsx
- [ ] T102 [US2] `EditorToolbar` (6 format buttons + right-aligned `CommunityStandardsLink` slot; space-between layout) | components/kudos/WriteKudoModal/EditorToolbar.tsx
- [ ] T103 [US2] `RichTextArea` with Tiptap (StarterKit without OrderedList; Bold / Italic / Strike / BulletList / Link / Blockquote / Mention / Placeholder extensions). Output via `editor.getJSON()` | components/kudos/WriteKudoModal/RichTextArea.tsx
- [ ] T104 [US2] Mention extension wired to `/api/employees/search?ignore_caller=false`; non-match fallback inserts plain `@text` (no mention node) | components/kudos/WriteKudoModal/RichTextArea.tsx *(same file, extension config)*
- [ ] T105 [P] [US2] `MentionHintRow` (static hint `Bạn có thể "@ + tên" để nhắc tới đồng nghiệp khác`) | components/kudos/WriteKudoModal/MentionHintRow.tsx

### Frontend — image uploader (US2)

- [ ] T106 [P] [US2] `ImageThumbnail` with delete overlay, upload spinner, retry affordance | components/kudos/WriteKudoModal/parts/ImageThumbnail.tsx
- [ ] T107 [US2] `ImageUploader` — grid of thumbnails + `+ Image` button, 3-concurrent signed-URL uploads, progress per-thumbnail, 5-max hide | components/kudos/WriteKudoModal/ImageUploader.tsx

### Wiring (US2)

- [ ] T108 [US2] Wire `RichTextArea`, `EditorToolbar`, `MentionHintRow`, `ImageUploader` into `WriteKudoModal`; replace the Phase-3 plain textarea | components/kudos/WriteKudoModal/WriteKudoModal.tsx
- [ ] T109 [US2] Extend `useKudoForm` reducer shape: `body` is now ProseMirror JSON; `images` is ordered `{id, uploadStatus}[]` | components/kudos/WriteKudoModal/hooks/useKudoForm.ts

### E2E (US2)

- [ ] T110 [P] [US2] E2E: bold text + 1 mention + 2 images → submit → assert board card renders all three | tests/e2e/kudos/write-rich-kudo.spec.ts

**Checkpoint**: Rich-text + images + mentions ship. US1, US4, US2 all green.

---

## Phase 5: User Story 3 — Anonymous + alias + Community Standards + inline-create (Priority: P2)

**Goal**: Toggle anonymous submit with optional custom alias (G.1), open Community Standards page in a new tab, and support inline-creation of new hashtags and Danh hiệu in their respective pickers.

**Independent Test**: (a) Tick "Gửi ẩn danh" → alias input reveals → submit with alias `Thỏ 7 màu` → board card shows sender = `Thỏ 7 màu`, no author avatar, while the DB retains `author_id` (verified via `anonymity-masking.spec.ts`). (b) Type a hashtag label that doesn't exist, press Enter → chip created → submit → new row inserted into `hashtags`. (c) Same for Danh hiệu. (d) Click `Tiêu chuẩn cộng đồng` → new tab opens, modal state preserved.

### Backend — inline-create + anonymity (US3)

- [ ] T111 [P] [US3] Integration tests for inline-create — KUDO_CREATE_04a, 04b, 16a, 17a | tests/integration/kudos/create-kudo.spec.ts *(append)*
- [ ] T112 [P] [US3] Integration tests for anonymous submit + alias — KUDO_CREATE_03, 19a, 19b | tests/integration/kudos/create-kudo.spec.ts *(append)*
- [ ] T113 [P] [US3] Integration test for SC-004 anonymity masking — fetch `/api/kudos` as a different user, assert `author_id` absent + `senderName` equals alias or `"Ẩn danh"` | tests/integration/kudos/anonymity-masking.spec.ts
- [ ] T114 [P] [US3] Integration test for concurrent-create race on `titles`/`hashtags` (two clients insert same new slug simultaneously → one INSERT wins, other SELECT falls back) | tests/integration/kudos/concurrent-insert.spec.ts
- [ ] T115 [US3] Extend `POST /api/kudos` to accept `titleName` and `hashtags: {label}[]`; call `fn_insert_title_if_missing` / `fn_insert_hashtag_if_missing`; block if both `titleId` and `titleName` provided | app/api/kudos/route.ts
- [ ] T116 [US3] Extend `POST /api/kudos` to accept `isAnonymous` + `anonymousAlias` (trim, length check, persist) | app/api/kudos/route.ts *(same file as T115)*

### Frontend — anonymity (US3)

- [ ] T117 [P] [US3] Component tests for `AnonymousCheckbox` (toggle reveals G.1, uncheck clears alias) | tests/unit/kudos/AnonymousCheckbox.spec.tsx
- [ ] T118 [P] [US3] Component tests for `AnonymousAliasInput` (max 60 chars, prefix `ic-mask`, counter turns red over 60) | tests/unit/kudos/AnonymousAliasInput.spec.tsx
- [ ] T119 [P] [US3] `AnonymousCheckbox` | components/kudos/WriteKudoModal/AnonymousCheckbox.tsx
- [ ] T120 [US3] `AnonymousAliasInput` with `ic-mask` prefix + character counter + 180 ms max-height reveal transition | components/kudos/WriteKudoModal/AnonymousAliasInput.tsx
- [ ] T121 [US3] Extend `WriteKudoModal` to render `AnonymousCheckbox` + conditional `AnonymousAliasInput`; clear alias on uncheck | components/kudos/WriteKudoModal/WriteKudoModal.tsx

### Frontend — inline-create (US3)

- [ ] T122 [P] [US3] Component test for `ComboboxCreateRow` (appears on no-match, disabled with helper on invalid label) | tests/unit/kudos/ComboboxCreateRow.spec.tsx
- [ ] T123 [P] [US3] `ComboboxCreateRow` primitive (sticky last option `Tạo mới: "{label}"`) | components/kudos/WriteKudoModal/parts/ComboboxCreateRow.tsx
- [ ] T124 [US3] Extend `HashtagPicker` with inline-create path: popover shows `ComboboxCreateRow` when typed label has no match + passes charset/length validation | components/kudos/WriteKudoModal/HashtagPicker.tsx
- [ ] T125 [US3] Extend `TitleField` with inline-create path (same pattern; 2–60 chars) | components/kudos/WriteKudoModal/TitleField.tsx

### Frontend — Community Standards link (US3)

- [ ] T126 [P] [US3] Component test for `CommunityStandardsLink` (opens new tab, modal state unchanged) | tests/unit/kudos/CommunityStandardsLink.spec.tsx
- [ ] T127 [US3] `CommunityStandardsLink` rendered right-aligned inside `EditorToolbar`; `target="_blank" rel="noopener noreferrer"` | components/kudos/WriteKudoModal/CommunityStandardsLink.tsx

### E2E (US3)

- [ ] T128 [P] [US3] E2E: anonymous submit with custom alias → board shows alias, no avatar | tests/e2e/kudos/write-anonymous-kudo.spec.ts
- [ ] T129 [P] [US3] E2E: create new hashtag inline + new Danh hiệu inline in the same submit → master rows inserted | tests/e2e/kudos/write-kudo-inline-create.spec.ts

**Checkpoint**: All user stories (US1, US4, US2, US3) complete.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: responsive, accessibility, security headers, observability, toasts. Refinements that span stories.

### Responsive

- [ ] T130 [P] Responsive audit on Mobile (< 768 px bottom-sheet): modal width 100vw, bottom radius 16/16/0/0, padding 24, field rows stack column, toolbar horizontally scrollable, Gửi full-width | components/kudos/WriteKudoModal/ModalShell.tsx
- [ ] T131 [P] Responsive audit on Tablet (768–1023 px): modal width min(752, 92vw), scrollable | components/kudos/WriteKudoModal/ModalShell.tsx
- [ ] T132 [P] Responsive audit on Desktop (≥ 1024 px): exact 752 × 1012 modal, centred | components/kudos/WriteKudoModal/ModalShell.tsx
- [ ] T133 Configure Playwright projects for 3 viewports (375×812, 768×1024, 1440×900) and re-run US1/US2/US3 E2E matrix | playwright.config.ts

### Accessibility

- [ ] T134 [P] Integrate `@axe-core/playwright` helper; add axe scan to every E2E spec | tests/e2e/_helpers/a11y.ts
- [ ] T135 Manual keyboard-walk checklist documented + executed: Tab cycle, ESC close, combobox pattern (aria-expanded / aria-activedescendant / role="option"), mention popover (↑ / ↓ / Enter / Esc), chip keyboard removal, Submit focus-return on close | .momorph/specs/ihQ26W78P2-viet-kudo/a11y-checklist.md
- [ ] T136 [P] Verify contrast of `#E46060` link on `#FFF8E1` surface — underline on hover + focus to meet WCAG AA | components/kudos/WriteKudoModal/CommunityStandardsLink.tsx
- [ ] T137 [P] Add `role="status"` live region for form-level error summary on blocked submit | components/kudos/WriteKudoModal/WriteKudoModal.tsx

### Security hardening (TR-010)

- [ ] T138 Add security headers (`Content-Security-Policy` with `img-src 'self' *.supabase.co`, `connect-src 'self' *.supabase.co`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`) | next.config.ts
- [ ] T139 Run `npm audit` and resolve any new critical/high findings introduced by Tiptap / sanitize-html / new deps | *(ops task — no file)*

### Toasts + observability

- [ ] T140 Decide on toast primitive per Q-P3 (default recommendation: `sonner`) and wire `Đã gửi Kudo` success + `Gửi thất bại, vui lòng thử lại` error + draft-stale purge toast | components/kudos/WriteKudoModal/WriteKudoModal.tsx
- [ ] T141 [P] Add `console.error` + server log for `ERR_NO_EMPLOYEE_PROFILE` so ops can detect mis-seeded employees | lib/auth/current-employee.ts

### Launch gate

- [ ] T142 CI smoke test: fail the deploy if `employees` table in the target environment has < 1 active row | *(CI config — no file)*
- [ ] T143 Final constitution compliance review — re-run the compliance table in plan.md, confirm every principle still ✅; attach to release PR | .momorph/specs/ihQ26W78P2-viet-kudo/plan.md
- [ ] T144 Post-launch review plan for FR-016 RLS permissiveness (admin-role admin paths → tighten UPDATE/DELETE) | *(follow-up ticket — no file)*

---

## Dependencies & Execution Order

### Phase dependencies

- **Setup (Phase 1)**: no dependencies — can start immediately. Tasks T001–T020.
- **Foundation (Phase 2)**: depends on Phase 1 T005 (tokens) + T007–T009 (i18n); DB tasks (T021–T030) depend only on ops access to Supabase; shared-lib tasks (T031–T038) depend on T033 (Zod schemas) and T035 (types) being drafted.
  - Test infra (T039–T047) depends on T036 (`getCurrentEmployee`) for the sign-in endpoint and on migrations being applied (T030).
  - **BLOCKS ALL USER STORIES**.
- **Phase 3 (US1 + US4, MVP)**: depends on Phase 2 completion. Internal order: backend tests (T048–T054) red → backend handlers (T055–T059) green → frontend tests (T060–T067) red → primitives/hooks (T068–T072) → field components (T073–T077) → modal shell (T078) → wiring (T079–T084) → stub page (T085) → E2E (T086–T088).
- **Phase 4 (US2)**: depends on Phase 3 complete (extends the form and API). Internal order: uploads tests → handlers → kudos extension tests → kudos extension → frontend tests → components → wiring → E2E.
- **Phase 5 (US3)**: depends on Phase 3; can run in parallel with Phase 4 if staffed (different frontend components, additive API changes). Anonymity-masking test (T113) can land anytime after Phase 3 because the serializer already supports it.
- **Phase 6 (Polish)**: depends on all user stories green.

### Within each user-story phase

- Integration/component tests (marked red-first) MUST be in place and failing before implementation.
- Shared primitives (Combobox, Chip, ToolbarButton) before consumers (RecipientField, HashtagPicker, EditorToolbar).
- Hooks before the components that use them.
- Modal shell before the modal composition.
- All before E2E.

### Parallel opportunities

- **Phase 1**: T004–T020 are all `[P]` — ~17 concurrent tasks.
- **Phase 2**: migrations T022 & T023 after T021; shared-lib tasks T031–T038 parallelisable after types land (T035); tests T043–T047 parallelisable.
- **Phase 3 parallelism**:
  - Backend tests (T048–T054): all `[P]` — run in parallel.
  - Backend handlers: T057–T059 parallel once the Supabase client helper is in place; T055–T056 share `app/api/kudos/route.ts` so they're sequential on that file.
  - Frontend component tests (T060–T067): all `[P]`.
  - Primitives + hooks (T068–T072): all `[P]`.
  - E2E (T086–T088): all `[P]`.
- **Phase 4**: uploads backend (T089–T092) parallel with rich-text frontend work (T098–T105) once the sanitiser allow-list is extended.
- **Phase 5**: anonymity stream (T117–T121) parallel with inline-create stream (T122–T125) parallel with Community link (T126–T127). Backend tests (T111–T114) parallel with each other.
- **Phase 6**: nearly all tasks `[P]` except header + toast config.

---

## Implementation Strategy

### MVP first (recommended)

1. Complete Phase 1 + Phase 2.
2. Complete Phase 3 (US1 + US4). Stop — demo/validate with product.
3. Deploy MVP to staging behind a feature flag if the `employees` seed isn't production-ready yet.

### Incremental delivery

1. **Sprint 1** — Phase 1 + Phase 2 (setup + foundation).
2. **Sprint 2** — Phase 3 (MVP: US1 + US4) → deploy to staging.
3. **Sprint 3** — Phase 4 (US2) → deploy to staging.
4. **Sprint 4** — Phase 5 (US3) → deploy to staging.
5. **Sprint 5** — Phase 6 (polish + a11y + security) → production release.

Phases 4 and 5 can overlap if staffing allows (different component streams, additive API changes).

---

## Summary

| Phase | Tasks | Parallel (P) | Story |
|---|---|---|---|
| 1 — Setup | T001–T020 (20) | 17 | — |
| 2 — Foundation | T021–T047 (27) | 14 | — |
| 3 — MVP (US1 + US4) | T048–T088 (41) | 24 | US1 / US4 |
| 4 — US2 (rich-text, mentions, images) | T089–T110 (22) | 10 | US2 |
| 5 — US3 (anonymous, alias, inline-create, community link) | T111–T129 (19) | 12 | US3 |
| 6 — Polish | T130–T144 (15) | 11 | — |
| **Total** | **144** | **88** | **82 story-labeled** |

**Independent test criteria per story**:

| Story | Test |
|---|---|
| **US1 (P1)** | Sign-in → FAB → pick recipient + Danh hiệu + type message + 1 hashtag → Gửi → row in DB + on board stub |
| **US4 (P1)** | Every required-field empty state shows inline error; network timeout preserves form state |
| **US2 (P2)** | Bold formatting + `@mention` + 2 images all render on the board card |
| **US3 (P2)** | Anonymous submit with alias → board shows alias; inline-create new hashtag + new title persists rows; community link opens new tab |

**Suggested MVP scope**: Phase 1 + Phase 2 + Phase 3 (ends at T088). US2 and US3 ship in subsequent releases.

**Format validation**: All 144 tasks follow `- [ ] T### [P?] [Story?] Description | file/path`. Story labels appear only in Phases 3–5 (user-story phases). Phase 1, 2, and 6 tasks intentionally have no story label per the template.

---

## Notes

- Commit after each task (or logical group within a phase) with a conventional-commit message referencing the task id, e.g. `feat(kudos): T055 create POST /api/kudos handler`.
- Run `npm run test -- --changed` after each task; run full integration suite before moving phases.
- If a task surfaces an unexpected dependency (e.g. a missing shared component), create a new task row and renumber subsequent tasks rather than inlining the work.
- Mark tasks complete as you go: `- [x]`.
- If Open Questions Q-P1 … Q-P7 resolve differently than recommended, update tasks T001 (constitution PR) + any dependent rows before starting that phase.
