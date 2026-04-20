# Feature Specification: Viết Kudo (Write a Kudo)

**Frame ID**: `ihQ26W78P2`
**Frame Name**: `Viết Kudo`
**File Key**: `9ypp4enmFmdK3YAFJLIu6C`
**Created**: 2026-04-20
**Status**: Approved (review resolved 2026-04-20)

---

## Overview

**Viết Kudo** is a modal dialog that lets any authenticated Sun\* staff member send a public recognition / thank-you message ("Kudo") to one teammate as part of the SAA 2025 Kudos program. The author chooses a recipient, selects an honorary title ("Danh hiệu"), writes a rich-text message (with `@mention`, bold/italic/strike, bulleted list, link, quote), tags the post with up to 5 hashtags, optionally attaches up to 5 images, and may choose to post **anonymously** (with an optional custom display alias). After submission, the Kudo is published to the Kudos board and contributes to the Award system leaderboards.

The modal opens over a dimmed page backdrop from multiple entry points (Kudos board CTA, Floating Action Button, Profile "Gửi lời chúc", Homepage).

---

## Technology Stack

Per [.momorph/constitution.md](../../constitution.md) v1.0.0:

| Layer | Choice | Notes |
|---|---|---|
| Framework | **Next.js 16** (App Router) | Server Components default; `"use client"` only where needed (toolbar toggles, mention popover, upload previews, anonymous toggle reveal) |
| UI | React 19 | — |
| Styling | **TailwindCSS 4** | All tokens in `tailwind.config.ts`; mobile-first breakpoints |
| Language | **TypeScript 5**, `strict: true` | — |
| Backend / Auth / DB / Storage | **Supabase** | Postgres DB with **RLS on every table**; **Supabase Auth** (HTTP-only cookies, PKCE) for gating; **Supabase Storage** for Kudo image attachments |
| Schema validation | **Zod** | Request body & form validation on both client and Route Handlers |
| Unit / integration tests | Vitest + Testing Library | Real Supabase test project for integration tests |
| E2E tests | Playwright | Covers P1 stories (1 & 4) end-to-end |

**Module boundaries** (per constitution § Folder Structure):
- Client: `app/(dashboard)/kudos/_components/WriteKudoModal/...` + the sub-components in [design-style.md § Implementation Mapping](./design-style.md#implementation-mapping).
- Server: `app/api/kudos/route.ts`, `app/api/employees/search/route.ts`, etc. (see § API Dependencies below).
- Supabase clients: imported from `lib/supabase/client.ts` (browser) and `lib/supabase/server.ts` (route handlers + Server Components). The **service-role** client is reserved for privileged admin paths outside this feature; **this feature does not use the service-role client** — all reads and writes go through the authenticated user's Supabase client and rely on RLS + application-layer masking in `lib/kudos/serialize-kudo.ts`.
- Auth-to-employee resolution: `lib/auth/current-employee.ts` exposes `getCurrentEmployee()` which reads the Supabase session, extracts the email claim, and returns the matching active `employees` row (or throws `ERR_NO_EMPLOYEE_PROFILE` when there is no match — the Route Handler then returns 403). This mapping is **application-only** — no equivalent SQL helper exists at the DB layer.
- Zod schemas: `lib/validations/kudos.ts`, `lib/validations/uploads.ts`.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Send a basic Kudo to a teammate (Priority: P1)

As an authenticated Sun\* staff member, I want to quickly write a thank-you message to a specific teammate, tag it with an honorary title and hashtag, and publish it so my colleague sees the recognition on the Kudos board.

**Why this priority**: This is the core loop the SAA 2025 Kudos program depends on — without it there is no user-generated content and the award leaderboards cannot operate. It must ship first.

**Independent Test**: With only this story implemented, a signed-in user can open the modal from the Kudos board, fill all required fields (recipient, title, message, ≥1 hashtag), press **Gửi**, and see the new Kudo appear on the board.

**Acceptance Scenarios**:

1. **Given** I am signed in and on the Kudos board, **When** I click the "Viết Kudo" CTA, **Then** the modal opens centered with an empty form, the title "Gửi lời cám ơn và ghi nhận đến đồng đội" visible, and focus placed on the Recipient search input.
2. **Given** the modal is open, **When** I type ≥1 character in the Recipient search, **Then** an autocomplete dropdown shows matching active employees (name + avatar + department), and choosing one fills the field.
3. **Given** I have selected a recipient and a Danh hiệu, entered non-empty message text, and added at least 1 hashtag, **When** all required fields pass validation, **Then** the **Gửi** button becomes enabled.
4. **Given** valid input, **When** I click **Gửi**, **Then** the button shows a loading spinner, the API call succeeds, the modal closes, a toast "Đã gửi Kudo" appears, and the new Kudo is visible at the top of the Kudos board.
5. **Given** I click **Hủy** (or the ESC key, or the backdrop), **When** there are unsaved changes, **Then** a confirmation prompt asks "Huỷ Kudo? Thay đổi sẽ không được lưu." before closing.

---

### User Story 2 — Enrich the Kudo with rich-text, @mentions and images (Priority: P2)

As an author, I want to format my message (bold, italic, strikethrough, bulleted list, link, quote), `@mention` other colleagues inside the body, and attach up to 5 images so my Kudo is expressive and acknowledges everyone involved.

**Why this priority**: Rich formatting and mentions significantly increase engagement and allow recognition of group efforts, but the program is still usable with plain text only.

**Independent Test**: From an already-working basic form, verify that each toolbar button toggles its format on the selected text, that typing `@` opens a user suggestion popover, and that uploading an image yields a deletable thumbnail within the 80×80 grid — with no regression to Story 1.

**Acceptance Scenarios**:

1. **Given** focus is inside the message textarea, **When** I select text and click **B**, **Then** that text renders in **bold** and the **B** button shows its "on" state.
2. **Given** focus is inside the textarea, **When** I type `@min`, **Then** a suggestion dropdown appears with employees whose name matches; selecting one inserts a mention chip that renders as a link in the published Kudo.
3. **Given** I click the link icon, **When** I submit a URL in the link dialog, **Then** the selected text becomes a clickable link in preview and final output.
4. **Given** I click **+ Image**, **When** I pick a JPG/PNG/WebP ≤ 5 MB, **Then** a 80×80 thumbnail appears with an `✕` delete control; after 5 thumbnails the **+ Image** button is hidden.
5. **Given** an image upload fails, **When** the server returns an error, **Then** the thumbnail shows a red border and a retry icon; clicking retry re-submits the file.

---

### User Story 3 — Send anonymously with an optional alias, and stay within community standards (Priority: P2)

As an author who wants to praise someone without revealing my identity, I want to toggle "Gửi lời cám ơn và ghi nhận ẩn danh" so the published Kudo hides my name. If I want, I should also be able to enter an optional custom display name ("alias") that appears instead of "Ẩn danh". I also need a visible link to community standards so I know what is acceptable content.

**Why this priority**: Anonymity is a program policy requirement for sensitive recognition; it must ship near-launch but is not blocking the basic flow.

**Independent Test**: Toggle anonymous on → alias input appears → submit with alias → verify the published Kudo shows sender = the alias (or "Ẩn danh" if alias is empty), while the backend still records the real author for moderation. Independently, the `Tiêu chuẩn cộng đồng` link opens the community-standards page in a new tab.

**Acceptance Scenarios**:

1. **Given** I tick the anonymous checkbox, **When** the checkbox becomes checked, **Then** an inline `Tên ẩn danh` text input appears below the toggle (see design-style.md § G.1) with placeholder `Nhập tên hiển thị khi gửi ẩn danh`.
2. **Given** anonymous is checked and I leave the alias empty, **When** I submit, **Then** the Kudo card on the board shows sender = `Ẩn danh` (localised default) and no avatar of the author.
3. **Given** anonymous is checked and I type `Thỏ 7 màu` into the alias, **When** I submit, **Then** the Kudo card shows sender = `Thỏ 7 màu` and no avatar.
4. **Given** I check, then uncheck, the anonymous checkbox, **When** the toggle flips back to unchecked, **Then** the alias input hides and its value is discarded (no stale alias on next submit).
5. **Given** the anonymous checkbox is unchecked at submit, **When** I submit, **Then** the Kudo shows my real name and avatar normally.
6. **Given** the modal is open, **When** I click `Tiêu chuẩn cộng đồng` (top-right of the toolbar row — not below the textarea), **Then** a new browser tab opens to the community-standards page (modal state is preserved).

---

### User Story 4 — Block submission and recover when data is incomplete or invalid (Priority: P1)

As an author, when I miss a required field or exceed a limit, the system must stop me from submitting, clearly show which field needs attention, and let me fix it without losing my other inputs.

**Why this priority**: Without validation, the API can be flooded with bad data and users get confused. This is a launch-blocker paired with Story 1.

**Independent Test**: Submit the form with each required field empty in turn, verify each shows a specific error message, the **Gửi** button stays disabled, and navigating away after fix preserves existing input.

**Acceptance Scenarios**:

1. **Given** Recipient is empty, **When** I attempt to submit, **Then** the field shows a red border and message `Vui lòng chọn người nhận`; **Gửi** remains disabled.
2. **Given** Danh hiệu is empty, **When** I attempt to submit, **Then** the field shows `Vui lòng chọn danh hiệu`.
3. **Given** message textarea is empty or whitespace-only, **When** I attempt to submit, **Then** textarea border turns red with message `Vui lòng nhập lời cám ơn`.
4. **Given** Hashtag group is empty, **When** I attempt to submit, **Then** the group shows `Chọn ít nhất 1 hashtag`.
5. **Given** I have 5 hashtags, **When** I open the hashtag picker, **Then** the `+ Hashtag` trigger is hidden and the hint reads "Tối đa 5".
6. **Given** I upload a 6th image, **When** already at 5, **Then** the `+ Image` button is hidden (no error toast needed, hint `Tối đa 5` is shown).
7. **Given** my network drops mid-submit, **When** the API times out, **Then** the modal stays open with data intact, the submit button returns to its idle state, and a toast `Gửi thất bại, vui lòng thử lại` appears.

---

### Edge Cases

- User attempts to send a Kudo to **themselves** → recipient search filters out the current user; if somehow selected, server returns 422 and UI shows `Không thể gửi Kudo cho chính mình`.
- User selects a **deactivated** employee → recipient select disables deactivated users and shows them greyed-out with `(đã nghỉ)` tag.
- Very long message (> 5000 chars) → textarea soft-blocks further input, helper text `Tối đa 5000 ký tự`.
- `@mention` for a user not in the employee directory → chip not created; plain `@text` is preserved. Notifications are NOT sent in v1.
- Image larger than 5 MB or unsupported format → toast `Ảnh không hợp lệ (JPG/PNG/WebP ≤ 5MB)`, upload aborted.
- Multiple rapid **Gửi** clicks → button debounced; only one POST fires.
- **Creating a duplicate hashtag** — the user types a label that matches an existing active hashtag's slug (case-insensitive) → the picker MUST resolve to the existing hashtag (not insert a duplicate). A race between two users creating the same new hashtag simultaneously is handled server-side via an `INSERT ... ON CONFLICT (slug) DO NOTHING RETURNING id`, falling back to a `SELECT`.
- **Creating a duplicate Danh hiệu** — same case-insensitive match → resolve to existing title. Server-side `ON CONFLICT` on the partial unique index.
- **Hashtag label out of allowed charset** — contains spaces, `#`, or special characters → inline error `Hashtag chỉ gồm chữ, số và dấu gạch dưới, tối đa 32 ký tự`.
- **Danh hiệu label too short (< 2)** or too long (> 60) → inline error `Danh hiệu dài từ 2 đến 60 ký tự`.
- **Anonymous alias with only whitespace** → treated as empty after server-side trim → fallback to "Ẩn danh".
- **Anonymous alias > 60 chars (client bypassed)** → server rejects with 422 and `anonymousAlias: ["Tối đa 60 ký tự"]`.
- Browser tab reload while modal open → draft of (recipient id, title id or pending-new-title-label, body JSON, hashtag ids or pending-new-labels, image upload ids, `isAnonymous`, alias) persisted in `sessionStorage` and restored on reopen within the same session.
- Modal opened while **not signed in** → redirect to `/login` with a `returnTo` param back to the referring screen (Kudos board / homepage / FAB click).

---

## UI/UX Requirements *(from Figma)*

### Screen Components

| Component | Description | Interactions |
|-----------|-------------|--------------|
| Modal Title (A) | Heading "Gửi lời cám ơn và ghi nhận đến đồng đội" | Static |
| Recipient Search (B) | Autocomplete select for teammates | Type → filter suggestions; click → select |
| Danh hiệu Select | Honorary title picker (from preset list) | Click → open list; click option → select |
| Toolbar (C) | 6 format buttons: Bold, Italic, Strikethrough, Bulleted list, Link, Quote | Click → toggle active format on selection/new input |
| Textarea (D) | Rich-text message body with `@mention` | Type text; `@` opens mention popover; toolbar applies formats |
| `Tiêu chuẩn cộng đồng` link | Red link at **top-right of toolbar row (C)**, aligned with format buttons | Click → new tab to community standards |
| Hint (D.1) | Hint `Bạn có thể "@ + tên" để nhắc tới đồng nghiệp khác` below textarea | Static |
| Hashtag Picker (E) | Chip-based tag selector (max 5) | Click `+` → open list / typeahead; click chip `✕` → remove |
| Image Uploader (F) | Grid of thumbnails + add button (max 5) | Click `+` → file picker; click `✕` → remove |
| Anonymous Toggle (G) | Checkbox "Gửi lời cám ơn và ghi nhận ẩn danh" | Click → toggle; checked hides author identity on publish AND reveals G.1 |
| Anonymous Alias Input (G.1) | Text input that appears only when G is checked (conditional) | Type custom display name; empty → falls back to "Ẩn danh" |
| Cancel button (H.1) | Secondary button "Hủy" | Click → close modal (confirm if dirty) |
| Submit button (H.2) | Primary button "Gửi" | Click → validate → POST → close modal on success |

Detailed visual specs (colors, typography, spacing, node IDs, component states) live in **[design-style.md](./design-style.md)** — UI implementation must read that file.

### Navigation Flow

- **From**: Kudos board "Viết Kudo" CTA, Floating Action Button (global), Profile page "Gửi lời chúc" action, Homepage SAA
- **To (success)**: Kudos board with new Kudo highlighted at top
- **To (cancel)**: Back to originating screen, modal closed
- **To (side)**: `Tiêu chuẩn cộng đồng` → new tab (does not close modal)
- **To (error sub-screen)**: Inline validation errors remain in modal (see frame `Viet KUDO - Loi chua dien du`)
- **To (auth)**: `/login` if session expires mid-form, with `returnTo` back to modal-open state

### Visual Requirements

- Responsive breakpoints: Mobile (< 768px bottom-sheet), Tablet (<1024px scrollable 752px), Desktop (fixed 752×1012 modal) — see design-style.md § Responsive. Uses Tailwind mobile-first modifiers `sm:`, `md:`, `lg:`, `xl:` (constitution § V).
- Animations: Modal opens fade + 180ms ease-out scale; toolbar buttons and submit button use 150ms background transitions; G.1 alias input uses `max-height` transition on reveal.
- **Accessibility (WCAG 2.1 AA — constitution § V)**:
  - Modal container has `role="dialog"`, `aria-modal="true"`, and `aria-labelledby` pointing to the title element.
  - All form controls have programmatic labels (via `<label for>` or `aria-labelledby`).
  - Required fields announce `aria-required="true"` and errors use `aria-invalid="true"` + `aria-describedby` → error message id.
  - Modal traps focus (first focusable = Recipient input; `Tab`/`Shift+Tab` cycles within modal), returns focus to the triggering element on close, closes on `Esc`.
  - Toolbar buttons expose `aria-pressed` for toggle state and use `role="group"` with `aria-label="Định dạng văn bản"`.
  - Recipient / Danh hiệu / Hashtag dropdowns follow the WAI-ARIA combobox pattern: `role="combobox"`, `aria-expanded`, `aria-controls`, `aria-activedescendant`; options use `role="option"`.
  - Mention popover inside the textarea is keyboard navigable (`↑` / `↓` / `Enter` / `Esc`).
  - Hashtag / image chips are removable via keyboard: chip has `role="listitem"`, close button has `aria-label="Xoá hashtag {label}"`.
  - `Tiêu chuẩn cộng đồng` link has `rel="noopener noreferrer"` when opening a new tab and an accessible name indicating the new-tab behaviour (`aria-label="Mở tiêu chuẩn cộng đồng trong tab mới"`).
  - Color contrast verified in design-style.md; `#E46060` link underlines on hover / focus to meet AA on the cream background.
  - Touch targets ≥ 44×44 px on mobile viewports (applies to toolbar buttons, chip close, thumbnail delete).
  - Live region: form-level error summary announces via `role="status"` (polite) when submit is blocked.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST restrict the modal to authenticated users; unauthenticated opens redirect to `/login?returnTo=<origin>`. Authentication MUST use Supabase Auth sessions (HTTP-only cookies, PKCE).
- **FR-002**: System MUST allow the author to search and select **exactly one** active recipient from the employee directory; the author themselves and deactivated users MUST be excluded from results.
- **FR-003**: System MUST allow the author to select **exactly one** Danh hiệu (required field) — either from the existing master list or by creating a new one inline (see FR-006a).
- **FR-004**: System MUST support a rich-text message body with Bold, Italic, Strikethrough, **Bulleted (unordered) List**, Link, and Block-quote formatting.
- **FR-005**: System MUST support `@mention` of active employees inside the message body — typing `@` opens a suggestion popover and selecting a user inserts a mention chip. Mentions render as profile links in the published Kudo (`/profile/{employeeId}`). **Scope note**: no notification / email / push is sent to the mentioned user in this release — rendering and linkage only.
- **FR-006**: System MUST allow 1–5 hashtags per Kudo (required, min 1, max 5). The hashtag picker MUST support **both**:
  - selecting an existing hashtag via typeahead against the master list, AND
  - **creating a new hashtag inline** by typing a label that has no match and confirming (Enter or click `Tạo "...")`.
  Newly created hashtags MUST be inserted into the `hashtags` table in the same transaction as the Kudo and start at `usage_count = 1`. Label MUST be 2–32 characters; allowed charset: Vietnamese unicode letters, digits, and underscore (`_`); NO spaces, NO `#` prefix, NO other punctuation. The `slug` (used for dedupe) is derived server-side: lowercase, Unicode NFC-normalised, diacritics preserved.
- **FR-006a**: System MUST allow the author to select **one** Danh hiệu and MUST support **creating a new Danh hiệu inline** when no match is found in the master list (same pattern as hashtags). New Danh hiệu name MUST be 2–60 characters, trimmed, unique per active row (case-insensitive). Inserted in the same transaction as the Kudo with `sort_order = MAX(sort_order) + 1`.
- **FR-007**: System MUST allow 0–5 image attachments (JPG, PNG, WebP; each ≤ 5 MB; total ≤ 25 MB). Images MUST be stored in a **Supabase Storage** bucket named `kudo-images`, with the row in `uploads` only holding the storage key, metadata, and owner.
- **FR-008**: System MUST provide an "Anonymous" toggle; when ON, the published Kudo MUST display sender as the user-provided alias (from G.1) or `Ẩn danh` if alias is empty, while Supabase MUST retain the real `author_id` for moderation/audit.
- **FR-008a**: Toggling G **on** MUST reveal the alias input (G.1); toggling G **off** MUST hide G.1 and clear any alias value so it cannot leak into the submitted payload.
- **FR-008b**: Alias is **optional** when G is on (empty → fallback to "Ẩn danh"); MUST be trimmed server-side, **max 60 characters** (Unicode-aware; surrogate pairs count as 1), and subject to the same sanitisation as the Kudo body (strip control characters, HTML tags, leading/trailing whitespace). Exceeding 60 characters MUST block submit with inline error `Tối đa 60 ký tự`.
- **FR-009**: System MUST disable the **Gửi** button until Recipient, Danh hiệu, Message, and at least 1 Hashtag are all valid.
- **FR-010**: System MUST display inline field-level errors (red border + message) on attempted submit with invalid data; errors MUST clear as the user corrects them.
- **FR-011**: System MUST persist a draft to `sessionStorage` while the modal is open and restore it if the modal is reopened within the same session. The draft MUST capture: Recipient id; Danh hiệu as `{id}` or `{pendingLabel}` (for inline-create in progress); body ProseMirror JSON; hashtags as an ordered array of `{id}` or `{pendingLabel}`; image upload ids; `isAnonymous`; and `anonymousAlias`. On restore, if any referenced id (recipient, title, hashtag, upload) is no longer active the client MUST remove that entry and surface a non-blocking toast.
- **FR-012**: System MUST debounce submit to prevent duplicate POSTs (single inflight request). The server-side Route Handler MUST also reject duplicate submissions within a 2-second window per `(author_id, recipient_id, body_hash)`.
- **FR-013**: System MUST show a "Huỷ Kudo?" confirmation when the user cancels with unsaved changes.
- **FR-014**: On successful submit, the system MUST close the modal, show a success toast, and call `router.refresh()` so the Next.js Server Component re-fetches the Kudos board and the new item appears at the top. **Supabase Realtime is out of scope** for v1 — full-page refresh is the sole update mechanism.
- **FR-015**: The `Tiêu chuẩn cộng đồng` link MUST sit in the **toolbar row (C)**, right-aligned, and open the community-standards page in a new browser tab without disturbing the modal's state.
- **FR-016**: Authorization is split between the **application layer** (Route Handlers) and **RLS at the database layer**. There is NO SQL helper resolving JWT email to an `employees.id` — per-row identity checks live in Route Handlers only.

  **Application layer (Route Handlers — primary enforcement)**: every Route Handler under `app/api/kudos/`, `app/api/uploads/`, `app/api/titles/`, `app/api/hashtags/`, and `app/api/employees/` MUST:
    1. Call `getCurrentEmployee()` from `lib/auth/current-employee.ts` to resolve the authenticated user → active `employees` row. If the lookup fails, respond `403 { code: "NO_EMPLOYEE_PROFILE" }`.
    2. Enforce identity rules explicitly before any mutation:
       - `POST /api/kudos`: set `author_id = caller.id`; reject `recipient_id = caller.id` with 422.
       - `POST /api/uploads`: set `owner_id = caller.id`.
       - `DELETE /api/uploads/[id]`: require `owner_id = caller.id` and no `kudo_images` reference.
       - Admin-only operations (update / delete `titles`, `hashtags`, `kudos`; soft-delete `employees`): require `caller.is_admin = true`.
    3. Perform all writes using the user's Supabase client (anon key + session cookie). The **service-role** client is NOT used by this feature.

  **Database layer (RLS — table-level gate)**. Every table has `ENABLE ROW LEVEL SECURITY`. Because identity-to-employee resolution is not available in SQL, RLS policies do NOT attempt per-row ownership checks — they grant table-level access to the `authenticated` role and let Route Handlers enforce the real identity logic. A client attempting direct table access without a valid session (i.e. with the `anon` role) is always denied.
    - `kudos`:
      - SELECT policy (`authenticated`): `USING (deleted_at IS NULL AND status = 'published')`.
      - INSERT / UPDATE / DELETE policy (`authenticated`): `WITH CHECK (true)` — permissive at the DB layer; the Route Handler sets `author_id = caller.id` and blocks anything it shouldn't allow. Rationale: the anon-key session cannot call PostgREST directly because the Next.js app is the only client that ever mints this session server-side, and same-origin CSRF protection (TR-004) blocks cross-origin usage.
    - `kudo_hashtags`, `kudo_images`, `kudo_mentions`: same INSERT-permissive policy for `authenticated` (Route Handlers create rows only after inserting the parent `kudos` row within the same transaction); SELECT on these tables goes through `GET /api/kudos`, never direct.
    - `uploads`: SELECT restricted to Route Handlers (the client never reads `uploads` directly — it receives signed URLs in the Kudo payload). INSERT / DELETE: permissive for `authenticated`; the Route Handler sets `owner_id = caller.id` and prevents deletion of attached uploads.
    - `titles`, `hashtags`: SELECT for `authenticated` on `deleted_at IS NULL`. INSERT permissive for `authenticated` (supports inline creation in FR-006 / FR-006a). UPDATE / DELETE: denied for `authenticated` (reserved for an admin role added later).
    - `employees`: SELECT for `authenticated` on `deleted_at IS NULL`. INSERT / UPDATE / DELETE: denied for `authenticated` (reserved for admin ingest pipelines).
  The `anon` role (unauthenticated) is denied on every table. RLS therefore gates "must be signed in" but trusts Route Handlers for fine-grained ownership.
- **FR-017**: **No submission rate limit** is enforced in this release. If abuse patterns emerge post-launch we will revisit; no throttling logic is required for v1.

### Technical Requirements

- **TR-001**: Modal open-to-interactive time MUST be ≤ 300 ms on Desktop and ≤ 500 ms on Mobile (3G throttled). Initial data (titles list, top hashtags, current user) MUST be fetched in a Server Component parent of the modal — never via `useEffect` on first load (constitution § II).
- **TR-002**: Recipient autocomplete MUST debounce at 250 ms and cancel in-flight requests on new keystrokes.
- **TR-003**: Image uploads MUST be parallelisable (up to 3 concurrent), show progress per thumbnail, and stream directly to Supabase Storage using a signed upload URL minted by `POST /api/uploads`.
- **TR-004**: Submit Route Handler MUST validate every field with Zod, enforce RLS via the authenticated Supabase client, and reject JSON payloads > 512 KB (images are referenced by upload id, never inlined). CSRF protection MUST verify same-origin for Server Actions and Route Handlers.
- **TR-005**: Anonymity MUST be enforced **server-side at the application layer** (Route Handlers). The `GET /api/kudos` handler MUST resolve and return a flat, pre-computed pair:
  - `senderName`: `anonymous_alias` if present, else `"Ẩn danh"` when `is_anonymous = true`; otherwise the author's `employees.full_name`.
  - `senderAvatarUrl`: `null` when `is_anonymous = true`; otherwise the author's `avatar_url`.
  - `recipientName`: `employees.full_name` of the recipient.
  - `recipientAvatarUrl`: the recipient's `avatar_url`.
  The response MUST NOT include a raw `author` object — only these resolved strings. `author_id` MUST NEVER appear in any client-visible response. Masking logic lives in `lib/kudos/serialize-kudo.ts`.
- **TR-006**: All rich-text is stored as **ProseMirror JSON** in a `jsonb` column. The server MUST sanitise via a deterministic schema (allow-list) and strip `<script>`, event handlers, `javascript:` URLs, and non-internal link hrefs that don't match `https://saa.sun-asterisk.com/*` or `/profile/*`. The derived `body_plain` MUST be computed server-side for search.
- **TR-007**: Mention links MUST render with `rel="noopener noreferrer"` and only point at internal profile URLs (`/profile/{employeeId}`).
- **TR-008**: Image URLs MUST be served by **Supabase Storage signed URLs** with a TTL ≤ 1 hour. The `GET /api/kudos` handler MUST generate fresh signed URLs per response; the DB `uploads` table MUST NOT store signed URLs.
- **TR-009**: All Supabase queries MUST go through the typed Supabase JS client — no raw SQL in application code (constitution § II). The service-role key MUST only be instantiated in `lib/supabase/server.ts` and never imported from a client-marked file.
- **TR-010**: Security headers (`Content-Security-Policy` with `img-src` including the Supabase Storage domain, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Strict-Transport-Security`) MUST be configured in `next.config.ts`.
- **TR-011**: Supabase Storage bucket `kudo-images` MUST be **private**. Authorised reads happen only via signed URLs. The bucket MUST have size quotas enforced by Supabase Storage Policies (≤ 5 MB per object, MIME type in `{image/jpeg, image/png, image/webp}`).

### Key Entities *(if feature involves data)*

See [.momorph/contexts/DATABASE_ANALYSIS.md](../../contexts/DATABASE_ANALYSIS.md) and [database-schema.sql](../../contexts/database-schema.sql) for full Supabase schema.

- **Kudo**: `id BIGSERIAL`, `author_id BIGINT` (always retained, never null), `recipient_id BIGINT`, `title_id BIGINT` (Danh hiệu), `body` (jsonb ProseMirror), `body_plain`, `is_anonymous`, `anonymous_alias` (nullable text, max 60 — CHECK `alias IS NULL OR is_anonymous = TRUE`), `status ∈ {published, hidden, reported}`, timestamps.
- **Employee** (`employees` **master-data table**, added by this feature; one row per Sun* staff account): `id BIGSERIAL PRIMARY KEY` — **standalone, no FK to `auth.users`**. Columns: `id`, `email`, `full_name`, `employee_code`, `department`, `job_title`, `avatar_url`, `is_admin`, `deleted_at`, timestamps. Seeded by HR / admin import (CSV, SSO sync, or future admin UI), independent of Supabase Auth sign-ups.

> **Linking to Supabase Auth**: done at the **application layer only**. `lib/auth/current-employee.ts` exposes `getCurrentEmployee()` which reads the Supabase session, extracts the email claim from the JWT, and looks up the matching active `employees` row (`WHERE lower(email) = lower(?) AND deleted_at IS NULL`). Route Handlers call this at the top of every request and respond `403 { code: "NO_EMPLOYEE_PROFILE" }` when the lookup is empty. There is **no SQL helper** for this resolution and no FK between `employees` and `auth.users` — the lookup lives only in TypeScript.
- **Title / Danh hiệu**: `id`, `name`, `slug`, `description`, `icon`, `sort_order`, `created_by`, `deleted_at`.
- **Hashtag**: `id`, `label`, `slug`, `usage_count`, `created_by`, `deleted_at`.
- **Upload**: `id`, `owner_id`, `storage_key` (path inside `kudo-images` bucket), `mime_type`, `byte_size`, `width`, `height`, `deleted_at`.
- Join tables: `kudo_hashtags`, `kudo_images` (ordered via `position`), `kudo_mentions`.

---

## API Dependencies

All endpoints are implemented as **Next.js Route Handlers** under `app/api/` (App Router). The authenticated Supabase client is obtained via `lib/supabase/server.ts` and relies on the session cookie set by Supabase Auth. Contract defined in [.momorph/contexts/api-docs.yaml](../../contexts/api-docs.yaml).

| Route Handler | Method | Purpose | Supabase resource | Status |
|---|---|---|---|---|
| `/api/employees/search` | GET | Employee autocomplete — serves **both** the Recipient picker and the `@mention` popover, differentiated by the `ignore_caller` query param (`true` for recipient, `false` for mention). Soft-deleted accounts always excluded. | `employees` table | New |
| `/api/titles` | GET | List Danh hiệu options | `titles` table | New |
| `/api/hashtags` | GET | List & search hashtags | `hashtags` table | New |
| `/api/uploads` | POST | Mint signed upload URL for Supabase Storage, insert metadata row | Storage bucket `kudo-images` + `uploads` table | New |
| `/api/uploads/[id]` | DELETE | Remove unattached upload and its storage object | `uploads` + Storage | New |
| `/api/kudos` | POST | Transactional create: `kudos` + `kudo_hashtags` + `kudo_images` + `kudo_mentions`; usage-count bump on hashtags | All Kudo tables | New |
| `/api/kudos` | GET | Paginated board feed (server masks anonymous authors, mints signed image URLs) | `kudos` + joins | New |
| `/community-standards` | GET (page) | Target of `Tiêu chuẩn cộng đồng` link (static Next.js page) | — | New / verify |

**`GET /api/employees/search` contract:**
- Query params: `q` (required, min 1 char, trimmed), `ignore_caller` (optional boolean, default `true`), `limit` (optional, 1–100, default 20).
- Caller (recipient field) uses `ignore_caller=true` — hides the authenticated user.
- Caller (`@mention` popover) uses `ignore_caller=false` — caller may appear.
- Matching: case-insensitive, diacritic-tolerant prefix on `full_name` via pg_trgm, plus exact-substring match on `email`.

*(Tests for each route live in [.momorph/contexts/BACKEND_API_TESTCASES.md](../../contexts/BACKEND_API_TESTCASES.md). Authentication endpoints `/auth/login` etc. are owned by the Login feature spec.)*

### Where Supabase is used directly from the client

- **None** for write paths — all writes go through the Route Handlers above so RLS and sanitisation run server-side.
- **Supabase Realtime is NOT used in v1.** After a successful submit, the client calls `router.refresh()` and the server re-fetches the Kudos board.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: ≥ 70 % of authenticated Sun\* staff submit at least one Kudo during SAA 2025 event window.
- **SC-002**: Median modal-open → submit time ≤ 90 seconds across all successful submissions (usability proxy).
- **SC-003**: Client-side validation error rate on **Gửi** click stays ≤ 15 % — i.e. ≥ 85 % of first submit attempts succeed, indicating clear form affordances.
- **SC-004**: Anonymous submissions MUST NOT leak author identity on the public Kudo endpoint — 0 incidents in security review.
- **SC-005**: P95 submit latency ≤ 1.2 s (excluding image upload).

---

## Out of Scope

- Editing or deleting a Kudo after submit (handled in `Man Sua bai viet` — separate spec).
- **Self-moderation** / author-initiated hide before admin review.
- Commenting / reacting on Kudos (separate board-level feature).
- Moderation dashboard / hiding reported Kudos.
- Drafting multiple Kudos in parallel.
- Scheduling a Kudo to publish later.
- AI-assisted message suggestions.
- **Notifications** — no email / push / in-app notification is sent to recipient or mentioned users in v1. `@mention` is a rendering feature only.
- **Supabase Realtime** updates to the board feed — v1 relies on `router.refresh()` on submit.
- **Submission rate limiting** — not enforced in v1 (revisit post-launch if abuse is observed).
- Admin UI for curating / merging / renaming hashtags and Danh hiệu (will be added once the user-generated lists grow).

---

## Dependencies

- [x] Constitution document exists (`.momorph/constitution.md` v1.0.0)
- [x] API specifications available ([.momorph/contexts/api-docs.yaml](../../contexts/api-docs.yaml))
- [x] Database design completed ([.momorph/contexts/database-schema.sql](../../contexts/database-schema.sql)) — `kudos`, `titles`, `hashtags`, `uploads`, `kudo_hashtags`, `kudo_images`, `kudo_mentions` tables
- [x] Screen flow documented ([.momorph/SCREENFLOW.md](../../SCREENFLOW.md)) — Viết Kudo entry and transitions refreshed on 2026-04-20
- [ ] **Supabase project provisioned** (dev + staging + production); envs set per constitution (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`)
- [ ] **Supabase Storage bucket `kudo-images` created** as private, with Storage Policy: MIME ∈ `{image/jpeg, image/png, image/webp}`, size ≤ 5 MB/object, path prefix `{auth.uid()}/*`
- [ ] **RLS policies** written and applied (FR-016); migration reviewed
- [ ] Migration run applying `database-schema.sql` (includes the new `employees` master-data table, `kudos.anonymous_alias`, `titles.slug` + `created_by`, `hashtags.created_by`, CHECK constraints)
- [ ] `pg_trgm` extension enabled (used by the `employees` name autocomplete index)
- [ ] Postgres helper functions `fn_insert_title_if_missing` / `fn_insert_hashtag_if_missing` deployed (used by `POST /api/kudos` transaction)
- [ ] `employees` master-data seeded (HR / admin import or SSO sync) — an authenticated `auth.users` without a matching active `employees` row gets `403 { code: "NO_EMPLOYEE_PROFILE" }` from every Route Handler
- [ ] Community-standards page published at target URL
- [ ] Supabase Auth callback route ready at `/auth/callback` (PKCE flow)

---

## Notes

- The Figma frame exposes a **Danh hiệu** (title) field that is *not* enumerated in `list_design_items` but is clearly visible in `list_frame_styles` (nodes `1688:10436` / `1688:10437` / `1688:10447`). Spec treats it as a first-class required field; verify with design before implementation.
- The **`Tiêu chuẩn cộng đồng` link** is positioned at the **top-right of the toolbar row (C)**, not below the textarea. Earlier version of this spec incorrectly combined it with the `@mention` hint into a single "D.1" row — corrected in 2026-04-20 review.
- The **anonymous alias input (G.1)** is a conditional text field, revealed only when the anonymous checkbox is checked (per design-item G description and frontend test IDs 43/44). It was missing from the initial spec — added in 2026-04-20 review. Schema impact: new `kudos.anonymous_alias TEXT` column.
- Toolbar rendering uses a shared-border tile pattern — first button has `border-radius: 8px 0 0 0` and the textarea below has `0 0 8px 8px` so the editor reads as one continuous card.
- Anonymity is **presentation-only** on the client; Supabase is the source of truth and must audit who authored each Kudo regardless of `is_anonymous`. Masking happens in the Route Handler (`lib/kudos/serialize-kudo.ts`) — the API response is the single boundary that the client ever sees, and it contains only `senderName` / `senderAvatarUrl` / `recipientName` / `recipientAvatarUrl` (never `author_id`). Because every client-facing fetch goes through a Route Handler (no direct `supabase.from('kudos').select('author_id')` from the browser), RLS does not need to attempt column-level masking; it only gates row visibility by `status`.
- Draft persistence scope is intentionally `sessionStorage`, not `localStorage`, to avoid cross-device leaks.
- Related frames to cross-reference during implementation: `Viet KUDO - Loi chua dien du` (validation-error sub-state), `Man Sua bai viet` (edit flow), `Kudos Board` (destination).

### Resolved Questions *(2026-04-20 review round 2)*

All previously open questions were answered by product / engineering. Resolutions are already folded into the FRs, TRs, and design above; this list is kept for traceability.

| # | Question | Resolution |
|---|---|---|
| Q1–Q2 | `anonymous_alias` scope & length | **In-scope feature**, optional, **max 60 chars** (FR-008b) |
| Q3 | Multi-recipient | **One recipient only**. `@mention` is supported for acknowledgement, but **notification is out of scope** in v1 (FR-005) |
| Q4 | Danh hiệu / hashtag curation | **User-generated**, inline creation in the picker (FR-006, FR-006a). Admins still manage deprecation via RLS |
| Q5 | Rate limiting | **No rate limit** in v1 (FR-017 rewritten) |
| Q6 | Self-moderation (author hide) | **Out of scope** (Out of Scope section) |
| Q7 | Realtime board updates | **No Realtime**; `router.refresh()` on submit (FR-014) |
| Q8 | Toolbar C.4 | **Bulleted (unordered) list** — not ordered (FR-004, design-style §C, icon `ic-list-bulleted`) |
| Q9 | Mobile layout | Confirmed **bottom-sheet** below 768px (design-style § Responsive) |
| Q10 | G.1 alias icon | **Dedicated icon** `ic-mask` as prefix (design-style § G.1) |
| Q11 | Rich-text format | **ProseMirror JSON** (TR-006) |
| Q12 | Image hosting | **Supabase Storage** signed URLs, TTL 1 h (FR-007, TR-008, TR-011) |
| Q13 | Anonymous masking | **Application-layer** masking in Route Handler; API response is flat with pre-resolved `senderName` / `senderAvatarUrl` / `recipientName` / `recipientAvatarUrl` (TR-005, api-docs.yaml `Kudo` schema) |
