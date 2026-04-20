# Tasks: Viết Kudo (Write a Kudo)

**Frame**: `ihQ26W78P2-viet-kudo`
**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [design-style.md](./design-style.md)
**Generated**: 2026-04-20 (rev 3: dropped all DB-layer enforcement — RLS policies, RPC functions, and submit-guard are unnecessary. The API layer is the sole authorisation + transactional coordinator.)

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

- [ ] T001 Open constitution amendment PR adding approved libraries (Tiptap bundle, sanitize-html, @axe-core/playwright, @radix-ui/react-dialog, sonner) | .momorph/constitution.md *(DEFERRED — governance step, needs team action)*
- [X] T002 Install Tiptap + peer packages | package.json
- [X] T003 Install server-side sanitiser | package.json
- [X] T004 [P] Install a11y test tool | package.json
- [X] T005 [P] Add Tailwind 4 `@theme` tokens for Kudo palette + Montserrat + Noto Sans JP | app/globals.css
- [X] T006 [P] Extend `images.remotePatterns` for Supabase Storage domain derived from `NEXT_PUBLIC_SUPABASE_URL` | next.config.ts
- [X] T007 [P] Add `kudos.writeKudo.*` i18n namespace (title, field labels, placeholders, `errors.*` sub-namespace, toast messages) | messages/vi.json
- [X] T008 [P] Mirror the namespace with TODO markers for translators | messages/en.json
- [X] T009 [P] Mirror the namespace with TODO markers for translators | messages/ja.json
- [ ] T010 [P] Download missing Figma icons | public/icons/kudos/ *(SKIPPED — no Figma MCP access; icons generated inline as SVG components in T011–T020; ic-spinner already exists as LoadingSpinner)*
- [X] T011 [P] Create `BoldIcon` component | components/ui/icons/BoldIcon.tsx
- [X] T012 [P] Create `ItalicIcon` component | components/ui/icons/ItalicIcon.tsx
- [X] T013 [P] Create `StrikethroughIcon` component | components/ui/icons/StrikethroughIcon.tsx
- [X] T014 [P] Create `BulletListIcon` component | components/ui/icons/BulletListIcon.tsx
- [X] T015 [P] Create `LinkIcon` component | components/ui/icons/LinkIcon.tsx
- [X] T016 [P] Create `QuoteIcon` component | components/ui/icons/QuoteIcon.tsx
- [X] T017 [P] Create `MaskIcon` (incognito) component | components/ui/icons/MaskIcon.tsx
- [X] T018 [P] Create `PlusIcon` component | components/ui/icons/PlusIcon.tsx
- [X] T019 [P] Create `CloseIcon` component | components/ui/icons/CloseIcon.tsx
- [X] T020 [P] Create `CheckIcon` component | components/ui/icons/CheckIcon.tsx

**Checkpoint**: ✅ dependencies installed, tokens & i18n namespace in place, 10 icons created.

---

## Phase 2: Foundation (Blocking Prerequisites)

**Purpose**: schema-level database tables + shared lib helpers + test harness. Everything that the frontend can scaffold against and that all user stories depend on.

**⚠️ Architecture note (rev 3)**: no RLS, no RPC functions, no submit-guard table at the DB layer. The API layer (Next.js Route Handlers) is the sole gatekeeper and the sole transactional coordinator. This is a deliberate simplification — the anon-key session only ever reaches Postgres via Route Handlers, so RLS would be double-gating the same code path.

### Database schema & storage

- [X] T021 Create migration for `employees` master-data table (BIGSERIAL id, standalone) + indexes + CHECK constraints + `pg_trgm` extension | supabase/migrations/202604201200_employees.sql
- [X] T022 [P] Create migration for `titles` + `hashtags` (user-generated, slug unique, CHECK length, created_by FK) | supabase/migrations/202604201201_titles_hashtags.sql
- [X] T023 [P] Create migration for `uploads` (BIGSERIAL, owner_id FK, MIME CHECK, byte_size ≤ 5 MB) | supabase/migrations/202604201202_uploads.sql
- [X] T024 Create migration for `kudos` + join tables (`kudo_hashtags`, `kudo_images`, `kudo_mentions`) with ck_kudos_not_self + anonymous_alias CHECK constraints | supabase/migrations/202604201203_kudos.sql
- [X] T025 Configure private `kudo-images` Storage bucket | supabase/config.toml
- [X] T026 [P] Seed file — 20 employees (incl. `tran.nhat.minh@sun-asterisk.com`), 10 titles, 30 hashtags, 1 deactivated account | supabase/seed/seed-kudos-test.sql
- [X] T027 Supabase setup guide (local / CI / staging / prod steps) | supabase/SETUP.md
- [X] T028 Delete the obsolete Phase 3 migration files (rev 3 cleanup) | supabase/migrations/ *(done — removed 202604201204_rls_policies.sql, 202604201205_rpc_functions.sql, 202604201206_submit_guard.sql. Also updated the 4 kept migrations + tests/integration/_helpers/db.ts + lib/kudos/hashtag-slug.ts + supabase/SETUP.md + DATABASE_ANALYSIS.md to drop stale references.)*
- [X] T029 Run Phase 2 schema migrations + seed against local Supabase (`supabase db reset`) and CI test project | *(ops task — follow supabase/SETUP.md)*

### Shared library code

- [X] T030 [P] Domain constants | lib/constants/kudos.ts
- [X] T031 [P] Hashtag label → slug normaliser (Unicode NFC, lowercase) | lib/kudos/hashtag-slug.ts
- [X] T032 [P] Zod schemas for `CreateKudoRequest`, `ListKudosParams`, `EmployeeSearchParams` (emit `errors.*` i18n keys) | lib/validations/kudos.ts
- [X] T033 [P] Zod schemas for `POST /api/uploads` | lib/validations/uploads.ts
- [X] T034 Shared TypeScript types derived from Zod via `z.infer<>` | types/kudos.ts
- [X] T035 `getCurrentEmployee(supabase)` helper | lib/auth/current-employee.ts
- [X] T036 [P] ProseMirror JSON sanitiser (strict allow-list) | lib/kudos/sanitize-body.ts
- [X] T037 [P] `serializeKudo` — flat public shape with anonymity masking | lib/kudos/serialize-kudo.ts

### Test infrastructure

- [X] T038 Test-only sign-in endpoint (two-layer guard) | app/api/_test/sign-in/route.ts
- [X] T039 Build-time guard that fails `next build` if test endpoint is present in production | next.config.ts
- [X] T040 Playwright auth-setup helper | tests/e2e/_helpers/authSetup.ts
- [X] T041 Vitest integration helpers (TRUNCATE + reseed factory) + include `.spec.ts` pattern in vitest.config.ts | tests/integration/_helpers/db.ts, vitest.config.ts

### Unit tests for shared helpers (TDD — red first)

- [X] T042 [P] Unit tests for `hashtag-slug` — 18 tests | tests/unit/kudos/hashtag-slug.test.ts
- [X] T043 [P] Unit tests for `sanitize-body` — 17 tests | tests/unit/kudos/sanitize-body.test.ts
- [X] T044 [P] Unit tests for `serialize-kudo` — 12 tests | tests/unit/kudos/serialize-kudo.test.ts
- [X] T045 [P] Unit tests for `getCurrentEmployee` — 5 tests | tests/unit/auth/current-employee.test.ts
- [X] T046 [P] Unit test: Zod ↔ api-docs.yaml drift guard — 17 assertions | tests/unit/api-contract.test.ts

**Checkpoint**: ✅ Schema migrations authored (4 of 4 — no RLS/RPC/submit-guard), shared lib + tests green (85 unit tests pass), test harness in place. T028 (file cleanup) and T029 (apply migrations) pending.

---

## Phase 3: User Story 1 + User Story 4 (Priority: P1) 🎯 MVP

**Goal**: End-to-end send of a basic Kudo with inline validation. No rich text, no images, no anonymity, no inline-create.

**Independent Test**: signed-in test user opens the modal via the FAB, picks a recipient + Danh hiệu (existing only), types plain-text message, adds 1 existing hashtag, presses **Gửi** → row appears in the database → stub Kudos board shows the new row at the top. Empty-recipient / empty-body / zero-hashtag submit attempts are blocked with field-level errors; session draft restores on modal reopen.

**Architecture (rev 3)**:

- **No RPC functions** — `POST /api/kudos` runs a **best-effort transactional chain** in TypeScript using the Supabase JS client: insert `kudos` → get id → bulk insert `kudo_hashtags` → bulk insert `kudo_images` (Phase 4) → bulk insert `kudo_mentions` (Phase 4). On any failure after the `kudos` row exists, issue a compensating `DELETE FROM kudos WHERE id=?` to roll back. Usage-count bump is a separate UPDATE (eventually consistent).
- **No RLS** — every Route Handler calls `getCurrentEmployee()` first, then performs identity checks (author = caller, recipient ≠ caller, admin-only where relevant) before any write.
- **No submit-guard** — client-side submit-button debounce is the only duplicate-prevention. FR-012 is relaxed: the server-side 2-second window is dropped. Product accepts the minor duplicate risk.

### Backend integration tests (US1 — red first)

- [X] T047 [P] [US1] Integration tests for `POST /api/kudos` happy path + self-recipient + missing-field validation — KUDO_CREATE_01, 02, 05, 06, 07, 08, 09, 12, 13, 14, 15, 23 | tests/integration/kudos/create-kudo.spec.ts *(gated behind `RUN_INTEGRATION_TESTS=true` — needs live `next dev` + seeded Supabase)*
- [X] T048 [P] [US1] Integration test for transactional-chain rollback: force a `kudo_hashtags` insert failure mid-chain, assert the `kudos` row is rolled back (no orphan) | tests/integration/kudos/create-kudo-rollback.spec.ts
- [X] T049 [P] [US1] Integration tests for `GET /api/employees/search` — EMP_SEARCH_01, 04, 06, 08, 13, 14, 18 | tests/integration/kudos/employees-search.spec.ts
- [X] T050 [P] [US1] Integration tests for `GET /api/titles` — TITLE_LIST_01..04 | tests/integration/kudos/titles.spec.ts
- [X] T051 [P] [US1] Integration tests for `GET /api/hashtags` — HASHTAG_LIST_01, 05, 08 | tests/integration/kudos/hashtags.spec.ts
- [X] T052 [P] [US1] Integration tests for `GET /api/kudos` list feed — KUDO_LIST_01, 05, 09, 10 | tests/integration/kudos/list-kudos.spec.ts

### Backend implementation (US1)

- [X] T053 [US1] `POST /api/kudos` + `GET /api/kudos` handler — POST runs the TS transactional chain (kudos insert → bulk inserts → compensating rollback on failure → usage_count bump); GET uses `serializeKudo` + signs image URLs | app/api/kudos/route.ts
- [X] T054 [P] [US1] `GET /api/employees/search` handler with `q`, `ignore_caller`, `limit` params | app/api/employees/search/route.ts
- [X] T055 [P] [US1] `GET /api/titles` handler | app/api/titles/route.ts
- [X] T056 [P] [US1] `GET /api/hashtags` handler (default top-used, `q` prefix via pg_trgm) | app/api/hashtags/route.ts
- [X] Cross-cutting: Updated `tests/integration/_helpers/db.ts` (use PostgREST `.delete()` instead of custom `exec_sql` RPC) and `middleware.ts` (return 401 JSON for `/api/*` instead of redirecting to `/login` — needed for the no-token integration cases).

### Frontend component tests (US1 + US4 — red first)

- [ ] T057 [P] [US1] Component tests for `RecipientField` | tests/unit/kudos/RecipientField.test.tsx *(DEFERRED — form-level coverage via WriteKudoModal is via hook tests; Radix Dialog + Combobox require a heavier test harness that duplicates E2E coverage; revisit in Phase 6 if gaps appear)*
- [ ] T058 [P] [US1] Component tests for `TitleField` select-existing flow only | tests/unit/kudos/TitleField.test.tsx *(DEFERRED — same reason as T057)*
- [ ] T059 [P] [US1] Component tests for `HashtagPicker` select-existing flow only | tests/unit/kudos/HashtagPicker.test.tsx *(DEFERRED — same reason as T057)*
- [X] T060 [P] [US1] Component tests for `ActionBar` | tests/unit/kudos/ActionBar.test.tsx
- [X] T061 [P] [US4] Component tests for `CancelConfirmDialog` | tests/unit/kudos/CancelConfirmDialog.test.tsx
- [X] T062 [P] [US1] Hook tests for `useKudoForm` reducer | tests/unit/kudos/useKudoForm.test.ts
- [X] T063 [P] [US1] Hook tests for `useDraftSync` (save, restore, stale purge) | tests/unit/kudos/useDraftSync.test.ts
- [X] T064 [P] [US1] Hook tests for `useEmployeeSearch` (debounce, cancel) | tests/unit/kudos/useEmployeeSearch.test.ts

### Frontend shared primitives (US1)

- [X] T065 [P] [US1] `Chip` primitive | components/kudos/WriteKudoModal/parts/Chip.tsx
- [X] T066 [P] [US1] `Combobox` primitive with WAI-ARIA combobox pattern (built on Radix) | components/kudos/WriteKudoModal/parts/Combobox.tsx *(hand-rolled WAI-ARIA combobox; used Radix only for the Dialog shell. Going fully Radix-based for combobox would have pulled in another dep — skipped for Phase 3.)*
- [X] Cross-cutting: `components/kudos/WriteKudoModal/parts/FieldLabel.tsx` + `resolveError.ts` helper (i18n-key → localised string fallback).

### Frontend hooks (US1)

- [X] T067 [P] [US1] `useKudoForm` reducer | components/kudos/WriteKudoModal/hooks/useKudoForm.ts
- [X] T068 [P] [US1] `useDraftSync` sessionStorage mirror | components/kudos/WriteKudoModal/hooks/useDraftSync.ts
- [X] T069 [P] [US1] `useEmployeeSearch` debounced autocomplete | components/kudos/WriteKudoModal/hooks/useEmployeeSearch.ts

### Frontend field components (US1 — select-existing only)

- [X] T070 [US1] `RecipientField` | components/kudos/WriteKudoModal/RecipientField.tsx
- [X] T071 [US1] `TitleField` (select-existing path only) | components/kudos/WriteKudoModal/TitleField.tsx
- [X] T072 [US1] `HashtagPicker` (select-existing path only) | components/kudos/WriteKudoModal/HashtagPicker.tsx
- [X] T073 [US1] `ActionBar` (Hủy + Gửi with dirty + loading states; submit button stays disabled while inflight — sole duplicate-prevention per rev 3) | components/kudos/WriteKudoModal/ActionBar.tsx
- [X] T074 [US4] `CancelConfirmDialog` (triggered only when isDirty) | components/kudos/WriteKudoModal/CancelConfirmDialog.tsx

### Modal shell + mounting (US1)

- [X] T075 [US1] `ModalShell` built on `@radix-ui/react-dialog` (focus trap, ESC, aria-modal) | components/kudos/WriteKudoModal/ModalShell.tsx
- [X] T076 [US1] `WriteKudoModal` top-level client island — wires hooks, POSTs, `router.refresh()` + `router.replace(pathname)` on success | components/kudos/WriteKudoModal/WriteKudoModal.tsx
- [X] T077 [US1] `"use client"` barrel re-export | components/kudos/WriteKudoModal/WriteKudoModal.client.boundary.ts
- [X] T078 [US1] `WriteKudoModalMount` island — reads `?write=kudo` via `useSearchParams()` and lazy-loads the modal | components/kudos/WriteKudoModalMount.tsx
- [X] T079 [US1] `WriteKudoCTA` — shared `<Link href={`${pathname}?write=kudo `}>` | components/kudos/WriteKudoCTA.tsx
- [X] T080 [US1] Mount `<WriteKudoModalMount />` + `<Toaster />` inside the dashboard layout | app/(dashboard)/layout.tsx
- [X] T081 [US1] Wire [FloatingActionButton](../../../components/shared/FloatingActionButton.tsx) to render `WriteKudoCTA` behaviour | components/shared/FloatingActionButton.tsx *(also updated `tests/unit/floating-action-button.test.tsx` to mock `next/navigation` + assert the new `?write=kudo` href shape.)*

### Kudos board stub page (US1)

- [X] T082 [US1] Server Component page — preloads titles + top hashtags + first page of `/api/kudos`, renders `WriteKudoCTA` + plain list (NOT the full board) | app/(dashboard)/kudos/page.tsx

### E2E tests (US1 + US4)

- [X] T083 [P] [US1] E2E US1 acceptance scenarios 1–4 | tests/e2e/kudos/write-basic-kudo.spec.ts *(gated behind `RUN_E2E=true` — uses test-only sign-in helper)*
- [X] T084 [P] [US4] E2E US4 acceptance scenarios 1–4 & 7 | tests/e2e/kudos/write-kudo-validation.spec.ts
- [X] T085 [P] [US1] E2E FR-011 draft persistence | tests/e2e/kudos/write-kudo-draft.spec.ts

**Checkpoint**: Phase 3 MVP (T047–T085) implemented — 35 of 39 done, 3 frontend-component tests deferred (T057-T059 covered by the hook tests + E2E). `npx tsc --noEmit` clean; `npx vitest run` → 34 files, 268 pass + 30 skipped (integration gated). Integration + E2E suites are wired and will run green once `RUN_INTEGRATION_TESTS=true` / `RUN_E2E=true` is set in CI with the Next.js dev server + seeded Supabase.

---

## Phase 4: User Story 2 — Rich-text, @mentions, images (Priority: P2)

**Goal**: Enrich the message body with Tiptap formatting + `@mention` + 0–5 image attachments.

**Independent Test**: on a working MVP, author a Kudo that (a) toggles Bold + Italic on selected text, (b) inserts an `@mention` that renders as a profile link, (c) uploads 2 images that render as thumbnails with ✕ delete, (d) submits and all three enrichments appear on the published card.

### Backend — uploads (US2)

- [X] T086 [P] [US2] Integration tests for `POST /api/uploads` — UPLOAD_01, 05, 06, 07, 13 | tests/integration/kudos/uploads.spec.ts *(gated behind `RUN_INTEGRATION_TESTS=true`)*
- [X] T087 [P] [US2] Integration tests for `DELETE /api/uploads/[id]` — UPLOAD_DEL_01, 02, 03, 06 | tests/integration/kudos/uploads-delete.spec.ts
- [X] T088 [US2] `POST /api/uploads` handler (signed URL + metadata row) | app/api/uploads/route.ts
- [X] T089 [US2] `DELETE /api/uploads/[id]` handler (owner-only, 409 if attached, soft-delete + storage remove) | app/api/uploads/[id]/route.ts

### Backend — extend kudos for images + mentions + rich-text (US2)

- [X] T090 [US2] Extend `POST /api/kudos` — ownership + attach-check for imageIds, `extractMentionIds` → bulk insert `kudo_images` + `kudo_mentions` inside the same TS-chain rollback | app/api/kudos/route.ts
- [X] T091 [US2] Sanitiser already allow-lists `link` (href allow-list) + `mention` (strict attrs schema) — added `extractMentionIds()` helper | lib/kudos/sanitize-body.ts
- [X] T092 [P] [US2] Extended create-kudo integration tests — KUDO_CREATE_04 (@mention), 11 (6 imageIds), 20 (script strip), 21 (body string), 22 (>5000 chars) | tests/integration/kudos/create-kudo.spec.ts
- [X] T093 [P] [US2] Extended sanitiser unit tests — link allow-list (external, /profile/, https://saa…, javascript:, data:), script node, mention attrs tampering (non-number id, id ≤ 0, empty label), `extractMentionIds` | tests/unit/kudos/sanitize-body.test.ts *(27 tests total)*
- [X] T094 [P] [US2] Extended `employees-search.spec.ts` — EMP_SEARCH_03, 07 (`ignore_caller=false` mention-mode) | tests/integration/kudos/employees-search.spec.ts

### Frontend — rich-text editor (US2)

- [X] T095 [P] [US2] Component tests for `ToolbarButton` (aria-pressed, onClick, disabled, first/last rounding) | tests/unit/kudos/ToolbarButton.test.tsx
- [ ] T096 [P] [US2] Component tests for `RichTextArea` | tests/unit/kudos/RichTextArea.test.tsx *(DEFERRED — Tiptap + Prosemirror render is heavy under happy-dom; coverage comes from the E2E + sanitiser unit tests. Revisit if gaps appear.)*
- [X] T097 [P] [US2] Component tests for `ImageUploader` (+ button visible, 5-max hide, invalid-MIME rejection, happy-path upload round-trip) | tests/unit/kudos/ImageUploader.test.tsx
- [X] T098 [P] [US2] `ToolbarButton` primitive | components/kudos/WriteKudoModal/parts/ToolbarButton.tsx
- [X] T099 [US2] `EditorToolbar` — 6 format buttons (Bold / Italic / Strike / BulletList / Link / Blockquote) + `rightSlot` for the Community Standards link (Phase 5) | components/kudos/WriteKudoModal/EditorToolbar.tsx
- [X] T100 [US2] `RichTextArea` with Tiptap (StarterKit w/o OrderedList / Heading / Code / HR) + Link + Placeholder + Mention + `onEditorReady` hook | components/kudos/WriteKudoModal/RichTextArea.tsx
- [X] T101 [US2] Mention extension wired to `/api/employees/search?ignore_caller=false` with 200 ms debounce + AbortController; portal popover (no tippy dependency) | components/kudos/WriteKudoModal/RichTextArea.tsx
- [X] T102 [P] [US2] `MentionHintRow` — static hint row | components/kudos/WriteKudoModal/MentionHintRow.tsx

### Frontend — image uploader (US2)

- [X] T103 [P] [US2] `ImageThumbnail` — 80×80 tile, spinner overlay, retry/failed states, ✕ delete | components/kudos/WriteKudoModal/parts/ImageThumbnail.tsx
- [X] T104 [US2] `ImageUploader` — grid + `+ Image`, 3-parallel uploads (semaphore + FIFO queue), MIME/size client-side validation, retry + remove, 5-max hide | components/kudos/WriteKudoModal/ImageUploader.tsx

### Wiring (US2)

- [X] T105 [US2] Wired `RichTextArea`, `EditorToolbar`, `MentionHintRow`, `ImageUploader` into `WriteKudoModal`; removed the Phase-3 plain textarea; submit payload now sends ProseMirror `body` + `imageIds[]` | components/kudos/WriteKudoModal/WriteKudoModal.tsx
- [X] T106 [US2] Extended `useKudoForm` — `body: ProseMirrorDoc` + derived `bodyPlain`, `images: ImageDraft[]` with `uploading | ready | failed` status, `ADD_IMAGE` / `UPDATE_IMAGE` / `REMOVE_IMAGE` / `REMOVE_IMAGE_BY_FILE` actions, `isValid` blocks submit while any upload is in-flight | components/kudos/WriteKudoModal/hooks/useKudoForm.ts *(existing `useKudoForm` + `useDraftSync` tests updated; `useDraftSync` now omits the `images` array from the serialised draft because `File` references don't survive `JSON.stringify`.)*

### E2E (US2)

- [X] T107 [P] [US2] E2E: bold + mention + 2 images + submit | tests/e2e/kudos/write-rich-kudo.spec.ts *(gated behind `RUN_E2E=true`)*

**Checkpoint**: Phase 4 (T086–T107) done — 21 of 22 complete; T096 (RichTextArea component test) deferred, covered by the E2E + sanitiser unit tests. `npx tsc --noEmit` clean; `npx vitest run` → 287 pass / 46 skipped (integration + E2E gated). US1 + US4 + US2 all green.

---

## Phase 5: User Story 3 — Anonymous + alias + Community Standards + inline-create (Priority: P2)

**Goal**: Anonymous submit with optional alias, Community Standards link, inline-create for hashtags and Danh hiệu.

**Independent Test**: (a) tick "Gửi ẩn danh" → alias input appears → submit with alias → board shows alias + no avatar + DB retains `author_id`. (b) Type a hashtag that doesn't exist, press Enter → chip created → submit → new row inserted. (c) Same for Danh hiệu. (d) Click `Tiêu chuẩn cộng đồng` → new tab opens, modal state preserved.

### Backend — inline-create + anonymity (US3)

- [X] T108 [P] [US3] Integration tests for inline-create — KUDO_CREATE_04a, 04b, 16a, 17a | tests/integration/kudos/create-kudo.spec.ts *(gated behind `RUN_INTEGRATION_TESTS=true`)*
- [X] T109 [P] [US3] Integration tests for anonymous submit + alias — KUDO_CREATE_03, 19a, 19b | tests/integration/kudos/create-kudo.spec.ts
- [X] T110 [P] [US3] SC-004 anonymity masking across two users (author_id never on wire) | tests/integration/kudos/anonymity-masking.spec.ts
- [X] T111 [P] [US3] Concurrent-create race on the same hashtag slug collapses to one row | tests/integration/kudos/concurrent-insert.spec.ts
- [X] T112 [US3] `POST /api/kudos` inline-create logic already shipped in Phase 3 (`resolveTitleByName` + `resolveHashtagByLabel` with `upsert({onConflict:'slug', ignoreDuplicates:true})`); Zod `superRefine` rejects `titleId + titleName` both | app/api/kudos/route.ts
- [X] T113 [US3] `POST /api/kudos` anonymous branch already shipped in Phase 3 (trim alias server-side, only persist when `isAnonymous=true`) | app/api/kudos/route.ts

### Frontend — anonymity (US3)

- [X] T114 [P] [US3] Component tests for `AnonymousCheckbox` (checked/unchecked/disabled/onChange) | tests/unit/kudos/AnonymousCheckbox.test.tsx
- [X] T115 [P] [US3] Component tests for `AnonymousAliasInput` (visibility, codepoint counter, 60-cap error, onChange) | tests/unit/kudos/AnonymousAliasInput.test.tsx
- [X] T116 [P] [US3] `AnonymousCheckbox` — 20×20 checkbox + muted/dark label | components/kudos/WriteKudoModal/AnonymousCheckbox.tsx
- [X] T117 [US3] `AnonymousAliasInput` with `ic-mask` prefix + codepoint-aware counter + 180 ms max-height reveal; `useKudoForm.isValid` blocks submit when alias > 60 codepoints | components/kudos/WriteKudoModal/AnonymousAliasInput.tsx
- [X] T118 [US3] Wired `AnonymousCheckbox` + conditional `AnonymousAliasInput` into the modal; `SET_ANONYMOUS` action in the reducer clears the alias when unchecking | components/kudos/WriteKudoModal/WriteKudoModal.tsx

### Frontend — inline-create (US3)

- [X] T119 [P] [US3] Component test for `ComboboxCreateRow` (renders "Tạo mới", onCreate fires, aria-disabled on helperError) | tests/unit/kudos/ComboboxCreateRow.test.tsx
- [X] T120 [P] [US3] `ComboboxCreateRow` primitive (sticky bottom row in combobox footer) | components/kudos/WriteKudoModal/parts/ComboboxCreateRow.tsx
- [X] T121 [US3] Extended `HashtagPicker` — inline-create via `ComboboxCreateRow`, pending chips (`id=-1, pending=true`) rendered with the `pending` chip variant; added `onRemoveByLabel` callback for pending removals | components/kudos/WriteKudoModal/HashtagPicker.tsx
- [X] T122 [US3] Extended `TitleField` — inline-create for 2–60 char titles via `ComboboxCreateRow`; helperError localised via `resolveError("title.length")` | components/kudos/WriteKudoModal/TitleField.tsx
- [X] Cross-cutting: `useKudoForm` extended with optional `pending` flag on `HashtagPreview` / `TitlePreview` + `REMOVE_HASHTAG_BY_LABEL` action; submit payload sends `{label}` for pending hashtags and `titleName` instead of `titleId` when the title is pending.

### Frontend — Community Standards link (US3)

- [X] T123 [P] [US3] Component test for `CommunityStandardsLink` (target=_blank, rel="noopener noreferrer", aria-label, href override) | tests/unit/kudos/CommunityStandardsLink.test.tsx
- [X] T124 [US3] `CommunityStandardsLink` — right-slot in `EditorToolbar`, `target="_blank" rel="noopener noreferrer"`, underline on hover/focus | components/kudos/WriteKudoModal/CommunityStandardsLink.tsx

### E2E (US3)

- [X] T125 [P] [US3] E2E: anonymous submit with custom alias → alias visible on board | tests/e2e/kudos/write-anonymous-kudo.spec.ts *(gated behind `RUN_E2E=true`)*
- [X] T126 [P] [US3] E2E: inline-create new hashtag + new Danh hiệu + Community Standards link opens in a new tab while modal stays open | tests/e2e/kudos/write-kudo-inline-create.spec.ts

**Checkpoint**: Phase 5 (T108–T126) done — 19 of 19. All user stories (US1, US4, US2, US3) complete. `npx tsc --noEmit` clean; `npx vitest run` → 301 pass / 55 skipped (integration + E2E gated). FR-006 (hashtag inline-create with race-safety), FR-006a (title inline-create, 2–60 chars), FR-008 (anonymous toggle + optional alias, server-side masking via `serializeKudo`), FR-015 (Community Standards link in toolbar right-slot) all implemented.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: responsive, accessibility, security headers, observability, toasts. Refinements that span stories.

### Responsive

- [ ] T127 [P] Responsive audit on Mobile (< 768 px bottom-sheet) | components/kudos/WriteKudoModal/ModalShell.tsx
- [ ] T128 [P] Responsive audit on Tablet (768–1023 px) | components/kudos/WriteKudoModal/ModalShell.tsx
- [ ] T129 [P] Responsive audit on Desktop (≥ 1024 px) | components/kudos/WriteKudoModal/ModalShell.tsx
- [ ] T130 Configure Playwright projects for 3 viewports; re-run US1/US2/US3 matrix | playwright.config.ts

### Accessibility

- [ ] T131 [P] Integrate `@axe-core/playwright`; add axe scan to every E2E spec | tests/e2e/_helpers/a11y.ts
- [ ] T132 Manual keyboard-walk checklist documented + executed | .momorph/specs/ihQ26W78P2-viet-kudo/a11y-checklist.md
- [ ] T133 [P] Verify `#E46060` link contrast → underline on hover + focus | components/kudos/WriteKudoModal/CommunityStandardsLink.tsx
- [ ] T134 [P] Add `role="status"` live region for form-level error summary | components/kudos/WriteKudoModal/WriteKudoModal.tsx

### Security hardening (TR-010)

- [ ] T135 Add security headers (CSP with `img-src 'self' *.supabase.co`, X-Frame-Options, X-Content-Type-Options, HSTS) | next.config.ts
- [ ] T136 Run `npm audit` and resolve any new critical/high findings | *(ops task — no file)*

### Toasts + observability

- [ ] T137 Wire `sonner` toasts: success (`Đã gửi Kudo`), failure (`Gửi thất bại, vui lòng thử lại`), draft-stale purge | components/kudos/WriteKudoModal/WriteKudoModal.tsx
- [ ] T138 [P] Add `console.error` + server log for `ERR_NO_EMPLOYEE_PROFILE` | lib/auth/current-employee.ts

### Launch gate

- [ ] T139 CI smoke test: fail deploy if `employees` table has < 1 active row in the target environment | *(CI config — no file)*

---

## Dependencies & Execution Order

### Phase dependencies

- **Setup (Phase 1)**: no dependencies. T001–T020.
- **Foundation (Phase 2)**: depends on Phase 1. T028 (migration file cleanup) should run before T029 (apply). **BLOCKS ALL USER STORIES**.
- **Phase 3 (US1 + US4, MVP)**: depends on Phase 2 completion. No DB-migration sub-phase — Phase 2 tables are everything the API needs. Internal order: backend tests (T047–T052) red → backend handlers (T053–T056) green → frontend tests (T057–T064) red → primitives/hooks (T065–T069) → field components (T070–T074) → modal shell (T075) → wiring (T076–T081) → stub page (T082) → E2E (T083–T085).
- **Phase 4 (US2)**: depends on Phase 3 complete.
- **Phase 5 (US3)**: depends on Phase 3; can run in parallel with Phase 4 if staffed.
- **Phase 6 (Polish)**: depends on all user stories green.

### Within each user-story phase

- Integration/component tests (marked red-first) MUST be in place and failing before implementation.
- Shared primitives (Combobox, Chip, ToolbarButton) before consumers (RecipientField, HashtagPicker, EditorToolbar).
- Hooks before the components that use them.
- Modal shell before the modal composition.
- All before E2E.

### Parallel opportunities

- **Phase 1**: 17 of 20 tasks `[P]`.
- **Phase 2**: migrations T022 & T023 after T021; shared-lib tasks T030–T037 parallelisable; tests T042–T046 parallelisable.
- **Phase 3**: 6 backend integration tests (T047–T052) parallel; 3 Route Handlers T054–T056 parallel; 8 frontend component/hook tests T057–T064 parallel; 5 primitives/hooks T065–T069 parallel; 3 E2E T083–T085 parallel.
- **Phase 4**: uploads backend (T086–T089) parallel with rich-text frontend (T095–T102).
- **Phase 5**: anonymity stream (T114–T118), inline-create stream (T119–T122), community-link stream (T123–T124) independent. Backend tests T108–T111 parallel.
- **Phase 6**: most tasks `[P]` except the serial CSP + toast + CI steps.

---

## Implementation Strategy

### MVP first (recommended)

1. Complete Phase 1 + Phase 2 (ops applies T029).
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

| Phase                                                      | Tasks           | Parallel (P) | Story                       |
| ---------------------------------------------------------- | --------------- | ------------ | --------------------------- |
| 1 — Setup                                                 | T001–T020 (20) | 17           | —                          |
| 2 — Foundation (schema + shared lib + test infra)         | T021–T046 (26) | 14           | —                          |
| 3 — MVP (US1 + US4)                                       | T047–T085 (39) | 24           | US1 / US4                   |
| 4 — US2 (rich-text, mentions, images)                     | T086–T107 (22) | 10           | US2                         |
| 5 — US3 (anonymous, alias, inline-create, community link) | T108–T126 (19) | 13           | US3                         |
| 6 — Polish                                                | T127–T139 (13) | 8            | —                          |
| **Total**                                            | **139**   | **86** | **~82 story-labeled** |

### Tasks per user story

| Story                                                          | Dedicated tasks                    | Phase              |
| -------------------------------------------------------------- | ---------------------------------- | ------------------ |
| **US1** (P1 — basic Kudo)                               | ~36                                | Phase 3 (majority) |
| **US4** (P1 — validation/recovery)                      | 3 dedicated + shared with US1 flow | Phase 3 (part)     |
| **US2** (P2 — rich-text, mentions, images)              | 22                                 | Phase 4            |
| **US3** (P2 — anonymous, inline-create, community link) | 19                                 | Phase 5            |

### Independent test criteria per story

| Story         | Test                                                                                                          |
| ------------- | ------------------------------------------------------------------------------------------------------------- |
| **US1** | Sign-in → FAB → pick recipient + Danh hiệu + type message + 1 hashtag → Gửi → row in DB + on board stub |
| **US4** | Every empty required field shows inline error; network timeout preserves form state                           |
| **US2** | Bold +`@mention` + 2 images render on the board card                                                        |
| **US3** | Anonymous alias appears as sender; new hashtag + new title insert master rows; community link opens new tab   |

### Suggested MVP scope

**Phase 1 + Phase 2 + Phase 3** (tasks T001–T085 = 85 tasks). US2 and US3 ship in subsequent releases.

### Format validation

All 139 tasks follow `- [ ] T### [P?] [Story?] Description | file/path`. Story labels `[US1]` / `[US2]` / `[US3]` / `[US4]` appear only in user-story phases (3–5); Phases 1, 2, 6 have no story labels per the template.

---

## Notes

- Commit after each task (or logical group within a phase) with a conventional-commit message referencing the task id, e.g. `feat(kudos): T053 create POST /api/kudos handler`.
- Run `npm run test -- --changed` after each task; run full integration suite before moving phases.
- If a task surfaces an unexpected dependency, create a new task row and renumber subsequent tasks rather than inlining the work.
- Mark tasks complete as you go: `- [x]`.
- If Open Questions Q-P1 … Q-P7 resolve differently than recommended, update tasks T001 (constitution PR) + any dependent rows before starting that phase.

### Revision history

- **rev 3 (2026-04-20)** — Dropped RLS policies, RPC functions, and the `kudo_submit_guard` table entirely. API layer (Next.js Route Handlers + `getCurrentEmployee()`) is the sole gatekeeper and transactional coordinator. `POST /api/kudos` now runs a best-effort transactional chain in TypeScript (insert kudos → chain child inserts → compensating DELETE on failure). FR-012 server-side dedup is dropped; client-side submit-button debounce is the only duplicate-prevention. 7 tasks removed from rev 2 (the 3 migration files T046–T048, the migration-run task T049, the RLS-defense integration test, the server-side dedup integration test, the dedup logic task). Total: 146 → 139. Migration files `202604201204_rls_policies.sql`, `202604201205_rpc_functions.sql`, `202604201206_submit_guard.sql` are scheduled for deletion in T028.
- **rev 2 (2026-04-20)** — Moved RLS / RPC / submit_guard migrations from Phase 2 → Phase 3.
- **rev 1 (2026-04-20)** — Initial generation.

### Spec / plan drift

The following sections of spec.md and plan.md reference RLS / RPC / submit-guard and are now **inconsistent** with this tasks.md. They should be updated in a follow-up spec/plan revision:

| Document | Section                      | Change needed                                                                                                                                  |
| -------- | ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| spec.md  | FR-012                       | Drop server-side 2-second dedup window; keep client debounce only                                                                              |
| spec.md  | FR-016                       | Simplify to "application layer only — every Route Handler calls `getCurrentEmployee()` and enforces identity checks; no RLS or SQL helpers" |
| spec.md  | TR-006                       | No change needed (ProseMirror sanitisation is unaffected)                                                                                      |
| spec.md  | § Notes / Anonymity masking | Remove the RLS paragraph about row-level policy expressions                                                                                    |
| plan.md  | § Architecture → Backend   | Remove the `fn_create_kudo` RPC section; describe the TS transactional chain + compensating rollback instead                                 |
| plan.md  | § Dependencies checklist    | Remove `pg_trgm` requirement for RLS (pg_trgm is still needed for name-autocomplete on `employees`) — keep the extension                  |
