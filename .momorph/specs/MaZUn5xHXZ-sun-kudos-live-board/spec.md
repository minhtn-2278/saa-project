# Feature Specification: Sun* Kudos — Live Board

**Frame ID**: `MaZUn5xHXZ`
**Frame Name**: `Sun* Kudos - Live board`
**File Key**: `9ypp4enmFmdK3YAFJLIu6C`
**Created**: 2026-04-21
**Status**: Draft

---

## Overview

The **Sun* Kudos — Live board** is the main public feed for the SAA 2025 Kudos program. It is the single page that every signed-in employee lands on when they click "Kudos" in the top-nav, and acts as both a **read surface** (showing highlighted + all community Kudos) and a **write entry point** (opening the [Viết Kudo](../ihQ26W78P2-viet-kudo/spec.md) modal). The page is composed of four vertical blocks:

| Block | Purpose |
|---|---|
| **A — KV Kudos** | Hero banner with the program title and a pill-shaped "write Kudo" input (opens the Viết Kudo modal). |
| **B — HIGHLIGHT KUDOS** | Filterable carousel (up to 5 cards) of the top-hearted Kudos across the entire event window. |
| **B.6 / B.7 — SPOTLIGHT BOARD** | Live word-cloud canvas showing every Kudo recipient's name, with a live `{N} KUDOS` total and a streaming "just received" log. Renders in its own full-width row between B and C. |
| **C — ALL KUDOS** | Infinite-scroll feed of every Kudo published during the event. |
| **D — Right sidebar** | Personal stats panel ("Thống kê") + an always-disabled `Mở quà` placeholder CTA (Secret Box flow deferred) + `10 SUNNER NHẬN QUÀ MỚI NHẤT` leaderboard. |

Two dropdown filters in the HIGHLIGHT KUDOS header (**Hashtag** — Figma `JWpsISMAaM` and **Phòng ban** — Figma `WXK5AYB_rG`) filter **both** the Highlight carousel and the ALL KUDOS feed simultaneously. The dropdowns are components of this screen and their visual specs live in [design-style.md § Dropdowns](./design-style.md#dropdowns).

---

## Technology Stack

Per [.momorph/constitution.md](../../constitution.md) v1.0.0:

| Layer | Choice | Notes |
|---|---|---|
| Framework | **Next.js 16** (App Router) | Server Component for initial data; `"use client"` on Highlight carousel, filter dropdowns, heart toggle, Spotlight canvas, Secret Box CTA. |
| UI | React 19 | — |
| Styling | **TailwindCSS 4** | All tokens in `tailwind.config.ts`; mobile-first breakpoints. |
| Language | **TypeScript 5**, `strict: true` | — |
| Backend / Auth / DB / Storage | **Supabase** | Postgres reads via authenticated Supabase client + route-handler authorization; Supabase Auth for gating. |
| Schema validation | **Zod** | Request body & query validation on every Route Handler. |
| Unit / integration tests | Vitest + Testing Library | Real Supabase test project. |
| E2E tests | Playwright | Covers P1 stories (1 & 2) end-to-end. |

**Module boundaries**:
- Client: `app/(dashboard)/kudos/page.tsx` (server) + `app/(dashboard)/kudos/_components/{KvBanner,HighlightCarousel,HighlightCard,HashtagFilter,DepartmentFilter,SpotlightBoard,KudoPost,KudoFeed,StatsSidebar,RecentReceiversList}/...`.
- Server: `app/api/kudos/route.ts` (feed + highlight), `app/api/kudos/[id]/like/route.ts`, `app/api/hashtags/route.ts`, `app/api/departments/route.ts`, `app/api/me/stats/route.ts`, `app/api/secret-box/recent/route.ts`, `app/api/spotlight/route.ts`.
- Supabase clients: `lib/supabase/server.ts` (route handlers + Server Component) and `lib/supabase/client.ts` (carousel, like, filter changes). **No service-role client is used on this page** — all reads and like-writes go through the authenticated user's session.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Browse the live Kudos feed (Priority: P1)

As a signed-in Sun\* employee, I want to land on the Kudos board and immediately see the program banner, the top-loved Highlight Kudos, and the full All Kudos feed so I can catch up on who is being recognized right now.

**Why this priority**: The feed is the entire reason the page exists; without P1 there is no "live board" and nothing else (filters, likes, sidebar) has anything to operate on.

**Independent Test**: Sign in, open `/kudos`, scroll — verify the KV banner renders, the Highlight carousel shows the first highlight card centered with `1/5` pagination, and the All Kudos feed below loads page 1 (default 10 cards) with no filter applied.

**Acceptance Scenarios**:

1. **Given** I am signed in and open `/kudos`, **When** the page renders, **Then** I see Block A (hero banner with title "Hệ thống ghi nhận lời cảm ơn" and the SAA 2025 KUDOS logo) and the "Hôm nay, bạn muốn gửi lời cảm ơn và ghi nhận đến ai?" pill input (A.1) at the top.
2. **Given** the page has rendered, **When** the HIGHLIGHT KUDOS block (B) is in view, **Then** up to 5 cards are loaded (top-hearted across the entire event window, desc by `heart_count`), exactly **one card is focused at the center**, its two neighbours are rendered faded on either side, and the pagination chip reads `1/5` (or `1/N` if the event has fewer than 5 Kudos total).
3. **Given** no filter is active, **When** I scroll past HIGHLIGHT KUDOS into ALL KUDOS (C), **Then** the first 10 Kudos load ordered newest-first, each card showing sender + arrow-icon + recipient + timestamp + content (truncated ≤ 5 lines) + up-to-5 hashtags + attached image thumbnails + heart count + "Copy Link".
4. **Given** I reach the end of the loaded feed, **When** the sentinel scrolls into view, **Then** the next page (10 more) is appended silently (infinite scroll); a loading spinner is shown while fetching.
5. **Given** the feed returns zero Kudos, **When** rendering ALL KUDOS, **Then** the empty state shows the text `Hiện tại chưa có Kudos nào.` centered in the feed area.

---

### User Story 2 — Filter Kudos by Hashtag or Department (Priority: P1)

As a viewer, I want to narrow both the Highlight carousel and the All Kudos feed by a single hashtag or a single department so I can quickly see recognition for a theme or a team.

**Why this priority**: The two filter buttons sit in the main header and drive the primary discovery loop of the board — they are always visible and the page is broken without them.

**Independent Test**: On `/kudos`, click the **Hashtag** button → dropdown opens with the 13 program hashtags → click `#Truyền cảm hứng`. Verify both the Highlight carousel and the All Kudos feed refetch and show only Kudos carrying that hashtag, the Highlight pagination resets to `1/5` (or `1/N` if fewer than 5), and the Hashtag button displays an active state with the chosen tag's label.

**Acceptance Scenarios**:

1. **Given** the page is rendered, **When** I click the **Hashtag** button (B.1.1), **Then** the Hashtag dropdown (Figma `JWpsISMAaM`) opens directly below the button showing all 13 program hashtags (see §Dropdown — Hashtag filter below).
2. **Given** the Hashtag dropdown is open, **When** I click any hashtag item, **Then** the dropdown closes, the button shows the chosen tag as its active label, and both Block B (Highlight carousel) and Block C (All Kudos feed) refetch with `?hashtag=<id>` applied.
3. **Given** a hashtag is already selected, **When** I click the **Hashtag** button and pick the same active item again, **Then** the filter clears (toggle-off) and both blocks refetch without the filter.
4. **Given** I click the **Phòng ban** button (B.1.2), **Then** the Phòng ban dropdown (Figma `WXK5AYB_rG`) opens and lets me filter by a single department; the list is server-queried and internally scrollable (see §Dropdown — Phòng ban below).
5. **Given** both a hashtag and a department are active, **When** the filtered result set is empty, **Then** the Highlight carousel hides and the ALL KUDOS area shows `Hiện tại chưa có Kudos nào.`.
6. **Given** I click a hashtag chip **inside** a Kudo card (B.4.3 or C.3.7), **Then** the page applies that hashtag to the Hashtag filter and refetches both blocks, same as picking it from the dropdown.
7. **Given** a dropdown is open, **When** I click outside it or press `Esc`, **Then** the dropdown closes without changing the current filter.

---

### User Story 3 — Navigate the Highlight carousel (Priority: P2)

As a viewer, I want to page through the top-loved Highlight Kudos using the arrows and the `n/5` chip so I can read each one closely without leaving the page.

**Why this priority**: The carousel is the visual centrepiece above the feed, but the same cards are ultimately reachable in the All Kudos feed, so it is not strictly a launch blocker.

**Independent Test**: On a page with ≥ 2 highlight Kudos, click the right arrow → the next card slides to center, the pagination chip updates (`1/5` → `2/5`), and the previous card is now faded. At the last card, the right arrow is disabled.

**Acceptance Scenarios**:

1. **Given** I am on slide `1/5`, **When** I click the left arrow (B.5.1), **Then** the button is disabled and no navigation occurs.
2. **Given** I am on slide `1/5`, **When** I click the right arrow (B.5.3), **Then** the carousel animates one card forward, the center card changes, and the pagination chip shows `2/5`.
3. **Given** I am on slide `5/5`, **When** I click the right arrow, **Then** the button is disabled.
4. **Given** fewer than 5 Highlight Kudos exist (e.g. 3), **When** the carousel renders, **Then** it paginates `1/3`, `2/3`, `3/3`; both arrows disable at the correct ends.
5. **Given** a filter change refetches the highlight list, **When** the new list arrives, **Then** the current slide resets to card 1 and the pagination resets to `1/N`.

---

### User Story 4 — Like (thả tim) a Kudo (Priority: P1)

As a viewer, I want to tap the heart icon on any Kudo card (Highlight or All Kudos) to express appreciation. The count increments, the heart turns red, and I can tap again to un-like.

**Why this priority**: Likes drive the HIGHLIGHT KUDOS ordering and the program leaderboards — the feature is meaningless without them.

**Independent Test**: On any Kudo I did not author, click the grey heart → heart turns red, count increments by 1, button shows pressed state. Click again → heart turns grey, count decrements by 1. On a Kudo I authored, the heart button is disabled.

**Acceptance Scenarios**:

1. **Given** I am viewing a Kudo whose sender ≠ me and I have not liked it, **When** I click the heart (C.4.1 / B.4.4 heart subcomponent), **Then** the icon colour turns **red**, the count label increments by 1, and `POST /api/kudos/{id}/like` is sent.
2. **Given** I have already liked a Kudo, **When** I click the heart again, **Then** the icon reverts to grey, count decrements by 1, and `DELETE /api/kudos/{id}/like` is sent.
3. **Given** the server rejects a like (non-2xx), **When** the error arrives, **Then** the optimistic UI rolls back and a toast "Không thể thả tim. Vui lòng thử lại." is shown.
4. **Given** I am the author of the Kudo (sender_id = current user), **When** the card renders, **Then** the heart button is disabled (pointer-events none, faded).

---

### User Story 5 — Copy a Kudo share link (Priority: P2)

As a viewer, I want to copy a direct link to any Kudo card so I can share it in Slack/email with colleagues.

**Why this priority**: Shareability boosts reach and is explicitly shown on every card, but the feed works without it.

**Independent Test**: Click "Copy Link" on any card → a toast appears, and pasting from clipboard yields the canonical `/kudos/{id}` URL.

**Acceptance Scenarios**:

1. **Given** any Kudo card, **When** I click **Copy Link** (C.4.2 / B.4.4 copy subcomponent), **Then** `window.location.origin + '/kudos/{id}'` is written to the clipboard and a toast `Link copied — ready to share!` is shown for ~2s.
2. **Given** the Clipboard API fails (browser or perms), **When** the promise rejects, **Then** the toast instead reads `Không thể sao chép link.`.

---

### User Story 6 — View my personal stats in the sidebar (Priority: P2)

As an authenticated user, I want the right sidebar to summarize my activity (`Số Kudos bạn nhận được`, `Số Kudos bạn đã gửi`, `Số tim bạn nhận được`, `Số Secret Box bạn đã mở`, `Số Secret Box chưa mở`) and to see a leaderboard of the 10 most recent gift-receivers so I can follow the program's momentum.

**Why this priority**: Personal metrics are motivating and anchor the page's identity, but the board itself is functional without them. The `Mở quà` CTA is rendered in its placeholder disabled state only — the actual Secret Box open flow is deferred to a future release.

**Independent Test**: Open `/kudos` while signed in → the sidebar `D.1` panel shows five stat rows with my real counts and a permanently-disabled `Mở quà` button. The leaderboard `D.3` below lists the 10 most recent gift-receivers.

**Acceptance Scenarios**:

1. **Given** the page has rendered, **When** the sidebar is visible, **Then** `D.1.2`..`D.1.7` display the labels `Số Kudos bạn nhận được:`, `Số Kudos bạn đã gửi:`, `Số tim bạn nhận được:`, `Số Secret Box bạn đã mở:`, `Số Secret Box chưa mở:`. The three Kudos-derived rows show the server-provided values; the two Secret Box rows display **`0`** this release (the `secret_boxes` table is deferred — see Out of Scope).
2. **Given** the sidebar renders in this release, **When** the `Mở quà` button (D.1.8) is displayed, **Then** it is **always disabled** (the Secret Box open flow is deferred; no click action, no tooltip about "cần có Secret Box"). Cursor is `not-allowed`, styling uses the disabled tokens in design-style.md.
3. **Given** the page has rendered and the Secret Box feature is deferred, **When** `D.3` renders, **Then** it shows the empty state `Chưa có dữ liệu` (no data source exists this release). When the feature ships, D.3 will list the 10 most recent gift-receivers (avatar + name + gift description) with click → profile / hover → preview.

---

### User Story 7 — Write a new Kudo directly from the board (Priority: P1)

As an author, I want a prominent "Hôm nay, bạn muốn gửi lời cảm ơn và ghi nhận đến ai?" input pill right under the banner so I can open the Viết Kudo modal without hunting for the FAB.

**Why this priority**: This is the single most-used action on the page during the event and determines whether the feed grows at all. It ships with the feed.

**Independent Test**: Click the A.1 pill → the [Viết Kudo](../ihQ26W78P2-viet-kudo/spec.md) modal opens centered over a dimmed backdrop; sending a Kudo closes the modal and the new Kudo appears at the top of the All Kudos feed.

**Acceptance Scenarios**:

1. **Given** I am signed in and the page is rendered, **When** I click anywhere on the A.1 pill input, **Then** the Viết Kudo modal opens (state fresh — no stale alias from prior opens).
2. **Given** I have just submitted a Kudo via the modal, **When** the modal closes, **Then** the All Kudos feed prepends the new Kudo and my `Số Kudos bạn đã gửi` value in the sidebar increments by 1 (optimistic; reconciled on next `/api/me/stats` refresh).

---

### User Story 8 — Explore the Spotlight board with live updates (Priority: P2)

As a viewer, I want the B.7 Spotlight canvas to show the name of every Kudo recipient as an interactive word-cloud/diagram so I can pan/zoom, hover a name for a tooltip, and click to open that Kudo. The total `{N} KUDOS` count and the animated "người mới nhận được Kudo" log inside the Spotlight MUST update live so the board feels alive during the event.

**Why this priority**: The Spotlight is the public "during-event" visual and its realtime pulse is the reason this screen is called a **Live** board. Without live total + live receivers it becomes a stale picture.

**Independent Test**: Open `/kudos` in browser A and `/kudos` in browser B (different user). From B, send a new Kudo. In A, within ~2 seconds: (1) the `N KUDOS` label increments by 1 (B.7.1), (2) the recent-receiver log inside the Spotlight appends the new recipient's name, (3) the new name eventually appears on the canvas after the next 5-minute layout refresh (or immediately as a floating node appended to the current layout — see TR-005).

**Acceptance Scenarios**:

1. **Given** B.7 has rendered, **When** I type in the search input (B.7.3, max 100 chars), **Then** matching nodes are highlighted and off-match nodes dimmed; pressing Enter recentres the canvas on the first match.
2. **Given** the Spotlight has no data, **When** B.7 renders, **Then** an empty state is shown ("Chưa có dữ liệu cho Spotlight.") and pan/zoom/search are disabled.
3. **Given** the Spotlight is still loading, **When** B.7 renders, **Then** a skeleton/loading overlay covers the canvas area.
4. **Given** the Spotlight is live and another user publishes a new Kudo, **When** the realtime event fires, **Then** `N KUDOS` (B.7.1) increments by 1 within ~2 s and the recent-receiver log inside the Spotlight appends a new row animated in.
5. **Given** the Spotlight layout cache is older than 5 minutes, **When** the client polls `/api/spotlight`, **Then** the canvas redraws with the new deterministic layout (existing names may reposition; name identity preserved across redraws).
6. **Given** the Supabase Realtime channel disconnects, **When** reconnection attempts are in progress, **Then** a subtle "Reconnecting…" indicator appears near B.7.1; on reconnect the client reconciles the count with a one-shot `GET /api/spotlight` before resuming live updates.

---

### Edge Cases

- **Filter + empty result**: When both filters yield zero Kudos, the Highlight carousel disappears entirely (not just empty) and the ALL KUDOS empty state is shown.
- **Slow network**: Highlight and All Kudos may resolve at different times; each block MUST show its own skeleton independently.
- **Long Kudo content**: Highlight card B.3 truncates content to 3 lines with `…`; feed card C.3 truncates to 5 lines with `…`.
- **>5 hashtags on a card**: Only the first 5 render on a single line; the overflow is indicated with `…`.
- **Very long department/hashtag lists**: The dropdowns scroll internally; see dropdown specs for exact scroll height.
- **Kudo deleted by admin while I'm scrolling**: the next like/copy on that card returns 404; show toast and soft-remove the card on the client.
- **Spotlight layout refresh mid-interaction**: if a 5-minute layout refresh arrives while the user is panning/zooming, defer the redraw until the next idle frame to avoid jank — cancel the pending redraw entirely if another refresh arrives within 2 s.
- **Realtime channel rate-limit / storm**: during a burst of Kudos (e.g. program launch), batch INSERTs client-side and debounce the B.7.1 counter update to ≤ 1 tick / 500 ms.

---

## UI/UX Requirements *(from Figma)*

### Screen Components

| Node ID | Component | Description | Interactions |
|---|---|---|---|
| `2940:13437` | **A — KV Kudos** | Hero banner (title + logo); section height 160 px, width 1152 px | Readonly |
| `2940:13449` | **A.1 — Button ghi nhận** | Pill input (738 × 72, radius 68) with pencil icon and placeholder `Hôm nay, bạn muốn gửi lời cảm ơn và ghi nhận đến ai?` | Click → open Viết Kudo modal |
| `2940:13452` | **B.1 — header** | `Sun* Annual Awards 2025` eyebrow + `HIGHLIGHT KUDOS` title + 2 filter buttons | Readonly text; filter buttons interactive |
| `2940:13459` | **B.1.1 — Button Hashtag** | Dropdown trigger `Hashtag` (icon + text) | Click → opens hashtag dropdown; shows active-tag label when filter applied |
| `2940:13460` | **B.1.2 — Button Phòng ban** | Dropdown trigger `Phòng ban` (icon + text) | Click → opens department dropdown |
| `2940:13461` | **B.2 — HIGHLIGHT KUDOS carousel** | Up to 5 total cards; 3 visible at a time (L-faded, center prominent, R-faded) | Arrows nav; heart; Copy Link; "Xem chi tiết"; click card → detail |
| `2940:13465` | **B.3 — Highlight Card** | 528 px wide yellow card (radius 16, 4 px border `#FFEA9E`) with sender arrow recipient + time + content(3 lines) + hashtags + action bar | See US4/US5; B.4.3 click → hashtag filter |
| `2940:13471` | **B.5 — slide nav** | Left arrow + `n/5` chip + right arrow (28/36 Montserrat bold) | Arrow click → prev/next; ends disabled |
| `2940:13476` | **B.6 — Spotlight header** | `Sun* Annual Awards 2025` eyebrow + `SPOTLIGHT BOARD` display title (57/700, gold, glow) — full-width, above the B.7 canvas | Readonly |
| `2940:14174` | **B.7 — Spotlight** | 1157 × 548 canvas with `388 KUDOS` label, search input (B.7.3), pan/zoom toggle (B.7.2) | Hover → tooltip; click node → open Kudo; pan/zoom; search |
| `2940:14221` | **C.1 — All Kudos header** | `Sun* Annual Awards 2025` eyebrow + `ALL KUDOS` display title (57/700, gold, glow) — sits at the top of the ALL KUDOS row, **above the 2-column C+D split** | Readonly |
| `2940:13475` | **C — All Kudos block** | 2-column row: left = infinite-scroll feed (C.2), right = sidebar (D). This is the **only** 2-column section on the page. | Scroll; card clicks → detail |
| `2940:13482` | **C.2 — Kudos feed** | Vertical list of C.3 Kudo Post cards, ordered newest-first | Infinite scroll; card click → detail |
| `3127:21871` | **C.3 — Kudo Post card** | 680 × 749 cream card (radius 24) with sender / icon sent / recipient, time, content(5 lines), images grid, hashtags, action bar | See US4/US5; image click → full-size viewer; hashtag click → filter |
| `2940:13488` | **D — Right sidebar** | 422 px column: stats panel + 10 SUNNER list | Click avatar/name → profile; scroll independent |
| `2940:13489` | **D.1 — Stats panel** | 5 stat rows (`Số Kudos bạn nhận được`, `Số Kudos bạn đã gửi`, `Số tim bạn nhận được`, `Số Secret Box bạn đã mở`, `Số Secret Box chưa mở`) split by a divider, followed by the `Mở quà` button (disabled) | See US6 |
| `2940:13497` | **D.1.8 — Mở quà** | Placeholder CTA rendered in permanent disabled state this release; enabled styling/handler deferred. Does NOT open `1466:7676` in this version. | Disabled (no click, no tooltip) |
| `2940:13510` | **D.3 — 10 SUNNER NHẬN QUÀ MỚI NHẤT** | Vertical list of 10 receivers (avatar + name + gift description) | Click avatar/name → profile; hover → preview |

Full component dimensions, CSS, state matrix, and layout tree: see [design-style.md](./design-style.md).

---

### Dropdown — Hashtag filter (Figma `JWpsISMAaM`)

Triggered by B.1.1. Presents the 13 SAA 2025 program hashtags; single-select, toggle-off on re-click, applied to the whole page.

**Items (in Figma order)**:

| # | Label | Slug (predicted) |
|---|---|---|
| 1 | Toàn diện | `toan-dien` |
| 2 | Giỏi chuyên môn | `gioi-chuyen-mon` |
| 3 | Hiệu suất cao | `hieu-suat-cao` |
| 4 | Truyền cảm hứng | `truyen-cam-hung` |
| 5 | Cống hiến | `cong-hien` |
| 6 | Aim High | `aim-high` |
| 7 | Be Agile | `be-agile` |
| 8 | Wasshoi | `wasshoi` |
| 9 | Hướng mục tiêu | `huong-muc-tieu` |
| 10 | Hướng khách hàng | `huong-khach-hang` |
| 11 | Chuẩn quy trình | `chuan-quy-trinh` |
| 12 | Giải pháp sáng tạo | `giai-phap-sang-tao` |
| 13 | Quản lý xuất sắc | `quan-ly-xuat-sac` |

**Behavior**:
- Anchored below the Hashtag trigger button; panel width 215 px, max-height 348 px, vertical scroll when overflow.
- Exactly one item may be selected; the selected item has a gold-tinted background and glow text-shadow (see design-style.md).
- Clicking the currently-selected item clears the filter (toggle-off).
- Clicking outside the panel or pressing `Esc` closes without mutating state.
- On selection, emit `filter:hashtag:change` → parent refetches B.2 + C.2 with `?hashtag={id}`.

**Visual spec**: [design-style.md § Dropdown — Hashtag filter](./design-style.md#dropdown--hashtag-filter).

---

### Dropdown — Phòng ban (Figma `WXK5AYB_rG`)

Triggered by B.1.2. Presents all departments from the DB; single-select, toggle-off on re-click. The currently-shown Figma mock includes ~49 department codes:

```
CTO, SPD, FCOV, CEVC1, CEVC2, STVC - R&D, CEVC2 - CySS, FCOV - LRM, CEVC2 - System,
OPDC - HRF, CEVC1 - DSV - UI/UX 1, CEVC1 - DSV, CEVEC, OPDC - HRD - C&C, STVC,
FCOV - F&A, CEVC1 - DSV - UI/UX 2, CEVC1 - AIE, OPDC - HRF - C&B, FCOV - GA, FCOV - ISO,
STVC - EE, GEU - HUST, CEVEC - SAPD, OPDC - HRF - OD, CEVEC - GSD, GEU - TM,
STVC - R&D - DTR, STVC - R&D - DPS, CEVC3, STVC - R&D - AIR, CEVC4, PAO, GEU, GEU - DUT,
OPDC - HRD - L&D, OPDC - HRD - TI, OPDC - HRF - TA, GEU - UET, STVC - R&D - SDX,
OPDC - HRD - HRBP, PAO - PEC, IAV, STVC - Infra, CPV - CGP, GEU - UIT, OPDC - HRD,
BDV, CPV, PAO - PAO
```

The **real** list at runtime comes from `GET /api/departments` and MUST reflect the live `departments` table, not this static snapshot.

**Behavior**:
- Anchored below the Phòng ban trigger button; panel width 289 px (fits longest `OPDC - HRD - HRBP` etc.), max-height 348 px, vertical scroll when overflow.
- Exactly one department may be selected at a time; selected item uses the same gold-tint + glow as the hashtag selected state.
- Clicking the currently-selected item clears the filter (toggle-off).
- Parent hashtag filter (if any) is preserved across a department change and vice versa.
- On selection, emit `filter:department:change` → parent refetches B.2 + C.2 with `?departmentId={id}`.

**Visual spec**: [design-style.md § Dropdown — Phòng ban](./design-style.md#dropdown--phòng-ban).

### Navigation Flow

- **Previous screen** → Any page via top-nav `Kudos` tab.
- **On-screen transitions**:
  - `A.1` → Viết Kudo modal (`ihQ26W78P2`).
  - `B.1.1` → Hashtag dropdown (Figma `JWpsISMAaM`, linked-frame `1002:13013`) — see §Dropdown — Hashtag filter below.
  - `B.1.2` → Phòng ban dropdown (Figma `WXK5AYB_rG`, linked-frame `721:5684`) — see §Dropdown — Phòng ban below.
  - `D.1.8` → _(deferred)_ Once Secret Box open flow ships, this will open the `1466:7676` dialog. This release renders `D.1.8` as disabled and no transition occurs.
  - Any card click / `Xem chi tiết` → Kudo detail page `/kudos/{id}`.
  - Any avatar/name click → `/profile/{employee_id}`; hover → in-page preview popover.

### Visual Requirements

- **Page layout (desktop)** — the page stacks 4 full-width rows, and **only the ALL KUDOS row is split into 2 columns**:
  1. `A` KV Kudos (full-width, 1152 px inner).
  2. `B` HIGHLIGHT KUDOS — header + carousel + slide nav (full-width).
  3. `B.6` Spotlight header + `B.7` Spotlight canvas (full-width, canvas 1157 × 548).
  4. `C.1` ALL KUDOS header (full-width) followed by a 2-column row: `C.2` feed (680 px) + `D` sidebar (422 px), gap 32 px. Sidebar D is `position: sticky; top: 24px` **inside the C container** — it does **not** float alongside B / B.7.
- **Responsive breakpoints** — desktop-first design at 1440 px wide.
  - **Desktop (≥ 1024 px)**: layout as above; outer page gutters 144 px at 1440, scaled below.
  - **Tablet (768–1023 px)**: C becomes single column; sidebar D collapses into an accordion that sits **above** the feed; Highlight carousel scales to 100% width with peek.
  - **Mobile (< 768 px)**: 1-col everywhere; Highlight carousel one card per viewport with swipe; sidebar becomes a bottom sheet triggered by a floating "Thống kê" button; filter buttons stack vertically.
- **Animations**:
  - Carousel: `transform: translateX(...)`, 300 ms ease-out.
  - Heart: scale 1 → 1.15 → 1 in 200 ms on activate; colour transition 150 ms.
  - Dropdowns: opacity 0→1 + translateY(-4 px) in 150 ms.
- **Accessibility**: WCAG AA. All buttons must be reachable by keyboard (Tab), arrow buttons announce `aria-disabled` at ends, dropdowns are `role="listbox"`, hearts expose `aria-pressed`, and every image must have a meaningful `alt` (recipient name for avatars, user-provided description or filename for attachments).

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST render the KV banner (A) with title `Hệ thống ghi nhận lời cảm ơn` and an open-modal pill input (A.1) for every signed-in user.
- **FR-002**: System MUST display the HIGHLIGHT KUDOS carousel (B.2) showing up to 5 cards ranked by descending `heart_count` across the **entire event window**, with exactly one card focused at the center and the two adjacent cards rendered faded.
- **FR-003**: System MUST render the ALL KUDOS feed (C) with infinite scroll, 10 cards per page, ordered by `created_at` DESC.
- **FR-004**: Users MUST be able to filter both B and C by exactly one Hashtag and exactly one Department at a time, combined via AND.
- **FR-005**: Users MUST be able to like/un-like any Kudo that they did not author; own-Kudos hearts MUST be disabled.
- **FR-006**: _(Reserved)_ Bonus-day hearts is out of scope for this release — every like credits the recipient with exactly 1 heart.
- **FR-007**: Users MUST be able to copy `origin + /kudos/{id}` via the card's Copy Link action and see a toast confirmation.
- **FR-008**: System MUST render the personal stats panel (D.1) with 5 metric rows and a `Mở quà` CTA. The three Kudos-derived rows (`nhận được`, `đã gửi`, `Số tim`) show live values; the two Secret Box rows display `0` this release. The `Mở quà` CTA MUST be rendered in its **permanent disabled state** (feature deferred — see Out of Scope).
- **FR-009**: System MUST render the `10 SUNNER NHẬN QUÀ MỚI NHẤT` list container (D.3) in its empty state `Chưa có dữ liệu` this release. When the Secret Box feature ships, D.3 will list up to 10 most recent gift-receivers.
- **FR-010**: System MUST render the B.7 Spotlight board with total KUDOS count, search, pan/zoom toggle, and node-click → Kudo detail.
- **FR-011**: Any hashtag chip clicked inside a card (B.4.3 / C.3.7) MUST apply that hashtag to the top filter bar and refetch B + C.
- **FR-012**: Carousel pagination MUST reset to `1/N` on any filter change.
- **FR-013**: When the filter result is empty, B.2 MUST be hidden and C MUST show `Hiện tại chưa có Kudos nào.`.
- **FR-014**: Clicking avatar or name in any card MUST navigate to `/profile/{employee_id}`; hovering MUST open the profile preview popover (`721:5827`).
- **FR-015**: Hovering the "number of stars" (hoa thị) next to a name MUST show the explanatory tooltip: `1 hoa thị: nhận 10 Kudos…`, `2 hoa thị: nhận 20 Kudos…`, `3 hoa thị: nhận 50 Kudos…`.

### Technical Requirements

- **TR-001** (Performance): Initial LCP on `/kudos` ≤ 2.5 s on 4G Fast; All Kudos page size = 10; images served via `next/image` with blur placeholder; highlight card images preloaded.
- **TR-002** (Security): Every route handler that mutates state (like, un-like) MUST verify `session.user.id` maps to an active `employees` row and enforce the "author cannot self-like" rule server-side (the client disable is UX only).
- **TR-003** (Integration): All DB reads go through the authenticated Supabase client — no service-role client on this page.
- **TR-004** (SEO/shareability): `/kudos/{id}` routes (copy-link targets) MUST emit OG tags with the Kudo's content preview and recipient's name for Slack unfurls.
- **TR-005** (Real-time freshness — scoped to B.7 Spotlight only): The Spotlight board MUST update live without a page reload:
  - **Total count** (B.7.1 `388 KUDOS` label) MUST reflect the current `COUNT(*)` of published Kudos — via Supabase Realtime subscription on the `kudos` table (INSERT / DELETE).
  - **Recent-receivers log** inside the Spotlight (the animated list of users who just received a Kudo, per Figma) MUST append new entries live when a new Kudo is published.
  - **Node layout** (x/y of every recipient name on the canvas) is computed **server-side and cached**; the cache refreshes **every 5 minutes**. Clients poll `GET /api/spotlight` every 5 minutes (aligned to a shared cache key) to pick up the new layout — live INSERTs append onto the existing layout between refreshes.
  - The B (HIGHLIGHT) carousel, C (ALL KUDOS) feed, D (sidebar stats / recent gift-receivers) are **not** realtime this release — they refresh on filter change, route navigation, or manual reload. Optimistic UI on like/un-like remains mandatory.
- **TR-006** (Asset): The stylised `KUDOS` wordmark in the KV banner (A) MUST be shipped as an exported SVG from Figma (see design-style.md § A — KV Kudos), not rendered as text. The title "Hệ thống ghi nhận lời cảm ơn" is rendered as Montserrat 36 / 700 text.

### Key Entities *(feature involves data)*

- **Kudo** — `id`, `sender_id`, `recipient_id`, `anonymous_sender_id (nullable)`, `anonymous_alias (nullable)`, `honorific_title` (Danh hiệu), `content` (rich text / markdown), `hashtags` (many-to-many with `hashtags`), `attachments` (many with `kudo_images`), `created_at`, `heart_count` (aggregate).
- **Hashtag** — `id`, `name`, `slug`. 13 static values for SAA 2025 (see Hashtag dropdown spec).
- **Department** — `id`, `code` (e.g. `CEVC2`), `parent_id`. ~50 values (see Department dropdown spec).
- **KudoHeart** — composite PK (`kudo_id`, `user_id`), `created_at`. Drives `heart_count` aggregate and recipient's `total_hearts`. (Bonus-day hearts out of scope — no `bonus` column this release.)
- **Employee** — `id`, `email`, `full_name`, `department_id`, `avatar_url`, `total_hearts`, `kudos_received_count`, `kudos_sent_count`, `secret_boxes_total`, `secret_boxes_opened`.
- **SecretBox** _(deferred — no DB table this release)_ — placeholder for a future table `{ id, owner_id, gift_name, granted_at, opened_at (nullable) }`. Sidebar stats for "đã mở / chưa mở" render `0` and the D.3 list shows its empty state until the feature ships. See `DATABASE_ANALYSIS.md § Deferred schema`.

---

## API Dependencies

| Endpoint | Method | Purpose | Status |
|---|---|---|---|
| `/api/kudos/highlight` | GET | Top-5 Kudos by heart count; accepts `?hashtag=<id>&departmentId=<id>` | New |
| `/api/kudos` | GET | All Kudos feed; accepts `?hashtag=<id>&departmentId=<id>&cursor=<created_at>&limit=10` | New |
| `/api/kudos/{id}/like` | POST | Like a Kudo (auth required; server enforces the "author cannot self-like" rule and records exactly 1 heart) | New |
| `/api/kudos/{id}/like` | DELETE | Un-like (removes the caller's heart from the Kudo) | New |
| `/api/hashtags` | GET | 13 hashtags for the dropdown | New |
| `/api/departments` | GET | Department list (alphabetic) for the dropdown | New |
| `/api/me/stats` | GET | `{ received, sent, hearts_received, boxes_opened, boxes_unopened }` | New |
| `/api/secret-box/recent` | _(deferred)_ | Not implemented this release — D.3 renders its empty state. Endpoint ships with the Secret Box feature. | Deferred |
| `/api/spotlight` | GET | `{ total, nodes: [{ id, name, received_at, kudo_id, x, y }], layout_version, cached_at }` — layout computed server-side; response cached for **5 minutes** keyed by event-day | New |
| Supabase Realtime channel `kudos:insert` | SUBSCRIBE | Live total increment + recent-receiver log append inside B.7 Spotlight (NOT used for B / C / D feeds) | New |
| `/api/hashtags/{id}/stats` | GET (optional) | Per-hashtag counts for filter UI badges | Optional (P3) |

All endpoints MUST validate auth, reject unauthenticated requests with `401`, and validate inputs with Zod.

---

## Success Criteria *(mandatory)*

- **SC-001**: 90% of signed-in employees open `/kudos` at least once during the event window.
- **SC-002**: Median time-to-first-Kudo after landing on the board is ≤ 30 seconds (A.1 click → modal submit).
- **SC-003**: Heart action latency (click → red heart visible) ≤ 150 ms (optimistic).
- **SC-004**: Zero self-like events recorded in `kudo_hearts` (server-side enforcement).
- **SC-005**: Filter change → both blocks refetched ≤ 600 ms p75 on 4G.
- **SC-006**: `/kudos` LCP ≤ 2.5 s p75.
- **SC-007**: Spotlight live-update latency (new Kudo published → B.7.1 count bumps + receiver log row appears in a remote viewer) ≤ 2 s p75.
- **SC-008**: Spotlight layout cache TTL = 5 min; cache hit rate ≥ 95% measured over the event window.

---

## Out of Scope

- Comment threads on Kudos (only hearts + copy link on this page).
- Multi-select filter (only one hashtag + one department at a time).
- Editing or deleting a Kudo from this page (admin-only, separate surface).
- Export / download of the feed (not in this program).
- **Bonus-day hearts** — deferred. Every like credits exactly 1 heart this release (no `bonus_days` table, no double-counting).
- **Secret Box open flow** — deferred. The `Mở quà` button (D.1.8) is rendered permanently disabled; no dialog, no API call.
- **Shared site footer** — rendered by the project-wide layout (not this screen's concern). Height and content live in the shared `<AppFooter />` component.
- **Live updates on B / C / D** — only the Spotlight (B.7) is realtime this release. Heart counts in feed cards, the ALL KUDOS feed, and sidebar stats refresh only on reload / navigation / filter change.
- Profile preview popover content specifications (covered by `721:5827` separately).

---

## Dependencies

- [x] Constitution document exists (`.momorph/constitution.md`)
- [ ] API specifications available (`.momorph/API.yml`) — endpoints above to be documented
- [ ] Database design completed (`.momorph/contexts/database-schema.sql`) — `kudos`, `kudo_hearts`, `hashtags`, `departments`. `secret_boxes` is deferred (see DATABASE_ANALYSIS.md § Deferred schema).
- [x] Screen flow documented (`.momorph/SCREENFLOW.md`)
- [x] Linked specs: [Viết Kudo](../ihQ26W78P2-viet-kudo/spec.md) (modal opened by A.1); the Hashtag (`JWpsISMAaM`) and Phòng ban (`WXK5AYB_rG`) dropdowns are **components of this screen** — documented inline above and in design-style.md, not as separate specs.

---

## Notes

- Author/self-like disable is UX *and* server-enforced; never rely on the client flag alone.
- The B.7 Spotlight node layout (x/y) is deterministic — compute server-side (or via a worker) and cache per event-day so layout is stable across viewers and sessions.
- Carousel uses transform-based sliding, not `scrollLeft`, so pagination state is JS-owned (prevents browser back-forward scroll restoration glitches).
- Constitution note: Tailwind tokens MUST be defined in `tailwind.config.ts`; do not hardcode the Figma hex in component classNames beyond a one-off hero gradient.
