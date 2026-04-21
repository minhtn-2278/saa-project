# Design Style: Sun* Kudos — Live Board

**Frame ID**: `MaZUn5xHXZ`
**Frame Name**: `Sun* Kudos - Live board`
**Figma Link**: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/MaZUn5xHXZ
**Frame Image**: https://momorph.ai/api/images/9ypp4enmFmdK3YAFJLIu6C/2940:13431/7c1bdfe017f253ebc155a2c8d0cd949c.png
**Extracted At**: 2026-04-21

This document covers the Live board and its two in-page dropdowns:
- **Dropdown — Hashtag filter** (Figma `JWpsISMAaM`, linked-frame `1002:13013`, panel image `https://momorph.ai/api/images/9ypp4enmFmdK3YAFJLIu6C/721:5580/288a43bf333b986c83f6bf8e7d4bfc9d.png`).
- **Dropdown — Phòng ban** (Figma `WXK5AYB_rG`, linked-frame `721:5684`, panel image `https://momorph.ai/api/images/9ypp4enmFmdK3YAFJLIu6C/721:5684/e16a7a42afaa2c9adf5fb3b0231dca16.png`).

---

## Design Tokens

### Colors

| Token Name | Hex / rgba | Opacity | Usage |
|------------|-----------|---------|-------|
| `--color-page-bg` | #00101A | 100% | Full-page background behind all blocks |
| `--color-surface-dark-1` | #00070C | 100% | Dropdown panel surface, deep containers |
| `--color-surface-muted` | #2E3940 | 100% | Secondary surface on dark backgrounds |
| `--color-border-gold` | #998C5F | 100% | Every bordered card/dropdown/button (1 px) |
| `--color-accent-gold` | #FFEA9E | 100% | Highlight card border (B.3), gold glow seed |
| `--color-accent-gold-glow` | #FAE287 | 100% | Text-shadow glow on selected dropdown items |
| `--color-accent-cream` | #FFF8E1 | 100% | Highlight card body (B.3), Kudo Post card body (C.3) |
| `--color-button-soft` | rgba(255, 234, 158, 0.10) | 10% | Default state of Hashtag / Phòng ban trigger buttons; dropdown selected-row background |
| `--color-button-soft-hover` | rgba(255, 234, 158, 0.40) | 40% | Hover state of the same triggers |
| `--color-heart-active` | #D4271D | 100% | Active heart icon (liked) |
| `--color-heart-inactive` | #F17676 | 100% | Heart icon idle (grey/pink-faded variant in some states) |
| `--color-text-primary` | #FFFFFF | 100% | Primary text on dark backgrounds |
| `--color-text-secondary` | #999999 | 100% | Page numbers, placeholder, dim text (B.5.2) |
| `--color-text-tertiary` | #EEEEEE | 100% | Faded text on dark |
| `--color-text-on-cream` | #00101A | 100% | Text inside Highlight / Kudo Post cards |
| `--color-overlay-dim` | rgba(0, 0, 0, 0.70) | 70% | Faded non-centre carousel cards |
| `--color-shadow-ink` | rgba(0, 0, 0, 0.25) | 25% | Drop shadow seed |

### Typography

| Token Name | Font Family | Size | Weight | Line Height | Letter Spacing | Usage |
|------------|-------------|------|--------|-------------|----------------|-------|
| `--text-display` | Montserrat | 57px | 700 | 64px | 0 | HIGHLIGHT / ALL KUDOS display titles |
| `--text-h1` | Montserrat | 36px | 700 | 44px | 0 | KV banner title |
| `--text-h2` | Montserrat | 32px | 700 | 40px | 0 | Section headings ("388 KUDOS") |
| `--text-h3` | Montserrat | 28px | 700 | 36px | 0 | Pagination `2/5`, D.1 stats values |
| `--text-h4` | Montserrat | 24px | 700 | 32px | 0 | Card sender/recipient name |
| `--text-h5` | Montserrat | 22px | 700 | 28px | 0 | Button primary labels ("Mở quà") |
| `--text-body` | Montserrat | 20px | 700 | 32px | 0 | Stat row labels in D.1 |
| `--text-body-md` | Montserrat | 16px | 700 | 24px | 0.5px | Card body text, hashtag chips, dropdown items |
| `--text-body-sm` | Montserrat | 14px | 700 | 20px | 0 | Time labels, department names in card |

### Spacing

| Token Name | Value | Usage |
|------------|-------|-------|
| `--spacing-xs` | 4px | Tight gaps (icon→text inside chip) |
| `--spacing-sm` | 6px | Dropdown panel inner padding |
| `--spacing-md` | 8px | Gap between filter button icon + label |
| `--spacing-lg` | 16px | Dropdown item padding; card inner gap |
| `--spacing-xl` | 24px | Card inner padding, sidebar gap |
| `--spacing-2xl` | 40px | Between HIGHLIGHT / ALL KUDOS sections; inside C card top/side |

### Border & Radius

| Token Name | Value | Usage |
|------------|-------|-------|
| `--radius-xs` | 4px | Dropdown item corners, filter button corners |
| `--radius-sm` | 8px | Dropdown panel corners |
| `--radius-md` | 12px | — |
| `--radius-lg` | 16px | Highlight card (B.3) |
| `--radius-xl` | 24px | Kudo Post card (C.3) |
| `--radius-spotlight` | 47.14px | Spotlight canvas container (B.7) |
| `--radius-pill` | 68px | KV pill input (A.1) |
| `--radius-full` | 9999px | Circular avatars, arrow buttons, heart pill |
| `--border-width` | 1px | Default border |
| `--border-width-strong` | 4px | Highlight card border |

### Shadows / Glows

| Token Name | Value | Usage |
|------------|-------|-------|
| `--shadow-card` | 0 4px 4px rgba(0,0,0,0.25) | Card drop shadow |
| `--glow-gold-lg` | 0 0 6px #FAE287 | Text glow on selected dropdown item; hero title emphasis |
| `--glow-gold-sm` | 0 0 1.3px #FFFFFF | Subtle inner glow on spotlight nodes |

---

## Layout Specifications

### Page Container

| Property | Value | Notes |
|----------|-------|-------|
| width | 1440px | Design reference width |
| background | `--color-page-bg` (#00101A) | Dark body |
| padding-x | 144px | Outer gutter at 1440 → inner canvas 1152 px |
| padding-y | 48px | Top + bottom breathing room |

### Row Layout (desktop)

The page is a **vertical stack of 4 rows**. Only the last row (ALL KUDOS) splits into 2 columns:

| Row | Scope | Width | Contents |
|---|---|---|---|
| 1 | Full-width | 1152 px inner | A (KV banner + A.1 pill) |
| 2 | Full-width | 1152 px inner | B (header + carousel + slide nav) |
| 3 | Full-width | 1152 px inner | B.6 (Spotlight header) + B.7 (canvas 1157 × 548) |
| 4 | Full-width header + 2-col body | 1152 px inner | C.1 (ALL KUDOS header) above; below it `C.2 feed (680 px)` + gap 32 + `D sidebar (422 px)` |

- `D` is **sticky inside C**: `position: sticky; top: 24px` within the C container — it never visually floats alongside B or B.7.
- Row gap between rows 1→4: 40 px (`--spacing-2xl`).
- Outer page gutter at the 1440 reference: 144 px each side → inner canvas 1152 px (note B.7 overflows slightly to 1157 px which is the Figma canvas boundary).

### Layout Structure (ASCII)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  <body bg: #00101A>                                                          │
│                                                                              │
│  ── Row 1: A — KV Kudos (FULL WIDTH) ──────────────────────────────────────  │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │  "Hệ thống ghi nhận lời cảm ơn"   [ SAA 2025 KUDOS logo ]              │  │
│  │  ┌──────────────────────────────────────────────────────────────────┐  │  │
│  │  │  A.1 Pill (738 × 72, r: 68): [✎] "Hôm nay, bạn muốn gửi..."     │  │  │
│  │  └──────────────────────────────────────────────────────────────────┘  │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  ── Row 2: B — HIGHLIGHT KUDOS (FULL WIDTH) ───────────────────────────────  │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │  "Sun* Annual Awards 2025"                                             │  │
│  │  "HIGHLIGHT KUDOS"   [ Hashtag ▾ ]  [ Phòng ban ▾ ]                    │  │
│  │                                                                        │  │
│  │   ┌─ B.2 Carousel (3 visible cards, center focused) ───────────────┐   │  │
│  │   │  [◄]   ░B.3 faded░   █B.3 CENTER█   ░B.3 faded░   [►]          │   │  │
│  │   └──────────────────────────────────────────────────────────────────┘ │  │
│  │                                       2 / 5                            │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  ── Row 3: B.6 + B.7 — SPOTLIGHT BOARD (FULL WIDTH) ───────────────────────  │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │  "Sun* Annual Awards 2025"                                             │  │
│  │  "SPOTLIGHT BOARD"                                                     │  │
│  │  ┌──────────────────────────────────────────────────────────────────┐  │  │
│  │  │  B.7 canvas (1157 × 548, radius 47.14)                           │  │  │
│  │  │    B.7.1 "388 KUDOS"     B.7.3 [ 🔍 Tìm kiếm ]   B.7.2 [⊕]       │  │  │
│  │  │    < interactive word-cloud nodes >                              │  │  │
│  │  └──────────────────────────────────────────────────────────────────┘  │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  ── Row 4: C.1 + (C.2 feed | D sidebar) ──────────────────────────────────  │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │  "Sun* Annual Awards 2025"                                             │  │
│  │  "ALL KUDOS"                                                           │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────┐  ┌────────────────────────────┐   │
│  │  C.2 feed (w: 680, flex-col, gap:24) │  │  D sidebar (w: 422,        │   │
│  │  ┌─────────────────────────────────┐ │  │     sticky top: 24)        │   │
│  │  │ C.3 Kudo Post (680 × 749, r:24) │ │  │  ┌──────────────────────┐  │   │
│  │  │ [avatar] Sender → [avatar] Rec. │ │  │  │ D.1 Stats panel      │  │   │
│  │  │ 10:00 - 10/30/2025              │ │  │  │  D.1.2 Kudos nhận    │  │   │
│  │  │ <content max 5 lines…>          │ │  │  │  D.1.3 Kudos gửi     │  │   │
│  │  │ [img][img][img][img][img]       │ │  │  │  D.1.4 Số tim        │  │   │
│  │  │ #Dedicated #Inspring ...        │ │  │  │  ── D.1.5 divider ── │  │   │
│  │  │ [ ♥ 10 ]        [ Copy Link ]   │ │  │  │  D.1.6 Box đã mở     │  │   │
│  │  └─────────────────────────────────┘ │  │  │  D.1.7 Box chưa mở   │  │   │
│  │  ┌─────────────────────────────────┐ │  │  │  [ D.1.8 Mở quà ]    │  │   │
│  │  │ C.5 Kudo Post ...               │ │  │  └──────────────────────┘  │   │
│  │  └─────────────────────────────────┘ │  │  ┌──────────────────────┐  │   │
│  │  ...                                  │  │  │ D.3 10 SUNNER NHẬN..│  │   │
│  │  (infinite scroll)                    │  │  │   D.3.2..D.3.6+     │  │   │
│  └───────────────────────────────────────┘  │  │   avatar · name ·   │  │   │
│                                              │  │   gift description  │  │   │
│                                              │  └──────────────────────┘  │   │
│                                              └────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## Component Style Details

### A — KV Kudos (`2940:13437`)

| Property | Value |
|---|---|
| width / height | 1152 × 160 px |
| padding | 0 |
| display | flex column, gap 10, align-start |
| border-radius | 0 |
| background | none (sits on page bg) |

**Text vs. asset split**:
- Title `Hệ thống ghi nhận lời cảm ơn` — rendered as **text**: Montserrat 36 / 700 / 44, color `#FFFFFF`.
- `KUDOS` stylised wordmark below the title — rendered as an **exported SVG from Figma** (node `2940:13437` → export the `KUDOS` logo group as `public/assets/kv-kudos-wordmark.svg`). MUST NOT be rendered as web font text (the glyphs are custom with gold-gradient + shadow treatment). The SVG is color-locked to its export; use `next/image` or `<svg>` inline import depending on whether any interactivity is needed (none required here — prefer `next/image`).
- Decorative background graphic (if present in Figma) — same treatment: export as a single SVG / PNG asset, reference via `next/image`.

### A.1 — Pill input "Button ghi nhận" (`2940:13449`)

| Property | Value | CSS |
|---|---|---|
| width | 738px (fill on ≥1280; 100% on mobile) | `w-[738px] max-w-full` |
| height | 72px | `h-[72px]` |
| padding | 24px 16px | `px-4 py-6` |
| background | rgba(255,234,158,0.10) | `bg-[rgba(255,234,158,0.10)]` |
| border | 1px solid #998C5F | `border border-[var(--color-border-gold)]` |
| border-radius | 68px | `rounded-[68px]` |
| gap | 8px | `gap-2` |
| cursor | pointer | `cursor-pointer` |
| typography | Montserrat 16 / 700 / 24, `--color-text-secondary` (placeholder colour) | — |

**States**:

| State | Change |
|---|---|
| Hover | background → rgba(255,234,158,0.18); glow `--glow-gold-sm` on border |
| Active/pressed | background → rgba(255,234,158,0.25) |
| Focus | outline: 2px solid `--color-accent-gold`, outline-offset: 2px |

### B.1 — header (`2940:13452`)

`display: flex; flex-direction: column; gap: 16px; align-items: flex-start;`

- **Eyebrow** `Sun* Annual Awards 2025` — `--text-h4`, `color: --color-text-tertiary`.
- **Title** `HIGHLIGHT KUDOS` — `--text-display` (57/700/64), `color: --color-accent-gold`, text-shadow `--glow-gold-lg`.
- **Filter row** — `display: flex; gap: 16px;` containing B.1.1 + B.1.2 buttons.

### B.1.1 / B.1.2 — Filter buttons (`2940:13459`, `2940:13460`)

| Property | Value | CSS |
|---|---|---|
| min-width | 160px / 180px (Phòng ban is wider) | `min-w-[160px]` |
| height | 56px | `h-14` |
| padding | 16px | `p-4` |
| background | rgba(255,234,158,0.10) | `bg-[rgba(255,234,158,0.10)]` |
| border | 1px solid #998C5F | `border border-[var(--color-border-gold)]` |
| border-radius | 4px | `rounded-[4px]` |
| gap | 8px | `gap-2` |
| typography | Montserrat 16 / 700 / 24 / 0.5px, `--color-text-primary` | `text-white` |
| trailing icon | chevron-down 16×16 | — |

**States**:

| State | Change |
|---|---|
| Default | bg rgba(255,234,158,0.10), white text |
| Hover | bg rgba(255,234,158,0.40) |
| Active (dropdown open) | bg rgba(255,234,158,0.10), text-shadow `--glow-gold-sm`, chevron rotated 180° |
| Filter-applied | label replaced with the selected value; a small `×` appears after the label to quickly clear (14×14 icon) |
| Focus | outline: 2px solid #FFEA9E |

### B.2 — HIGHLIGHT carousel (`2940:13461`)

- Content: the **5 top-hearted Kudos across the entire event window** (not rolling). Ranking = `ORDER BY heart_count DESC, created_at ASC`, limit 5.
- Display: horizontal flex; gap 16 px; overflow hidden; JS-controlled `translateX`.
- **Exactly one card is focused at the center** at any time (`transform: scale(1)`, opacity 1); the two neighbour cards (left + right) are rendered faded (`opacity: 0.5; transform: scale(0.92); pointer-events: none;`) so only the centered card is fully interactive. Cards beyond ±1 of the focused index are not rendered at all (off-screen).
- Sliding: 300 ms ease-out on next/prev. On any filter change, reset to index 0 before the refetch completes (skeleton the three visible slots).

### B.3 — Highlight Card (`2940:13465`)

| Property | Value |
|---|---|
| width | 528px |
| padding | 24px 24px 16px 24px |
| background | #FFF8E1 (`--color-accent-cream`) |
| border | 4px solid #FFEA9E (`--color-accent-gold`) |
| border-radius | 16px |
| display | flex column, gap 16 |
| box-shadow | `--shadow-card` |
| text-color | `--color-text-on-cream` |

Content regions (top → bottom):
1. Sender row: avatar 56 (B.3.1) + info (B.3.2) → `→` icon (B.3.4) → avatar 56 (B.3.5) + info (B.3.6).
2. B.4 inner: time (B.4.1) `HH:mm - MM/DD/YYYY`, `--text-body-sm`, `--color-text-secondary`.
3. B.4.2 content — `--text-body-md`, 3-line clamp (`line-clamp-3` + trailing `…`).
4. B.4.3 hashtags — horizontal wrap, single line, 5-max visible, else `…`.
5. B.4.4 action bar — `display: flex; justify-content: space-between;` with Hearts (L) + Copy Link + Xem chi tiết (R).

### B.5 — slide nav (`2940:13471`)

Row: `← | 2/5 | →` with 16 px gaps, centered below carousel.

- Arrow buttons (B.5.1, B.5.3): 48×48, `border-radius: 100px`, `border: 1px solid --color-border-gold`, bg `rgba(255,234,158,0.10)`; disabled state bg rgba(255,255,255,0.00) with 30% white icon.
- Page chip B.5.2: `--text-h3`, color `--color-text-secondary`.

### B.6 — Spotlight header (`2940:13476`)

Full-width section header above the B.7 canvas.

`display: flex; flex-direction: column; gap: 8px; align-items: flex-start; margin-bottom: 24px;`

- **Eyebrow** `Sun* Annual Awards 2025` — `--text-h4`, `color: --color-text-tertiary`.
- **Title** `SPOTLIGHT BOARD` — `--text-display` (57 / 700 / 64), `color: --color-accent-gold`, text-shadow `--glow-gold-lg`.

### B.7 — Spotlight (`2940:14174`)

| Property | Value |
|---|---|
| width / height | 1157 × 548 |
| background | radial-gradient center `rgba(9,36,50,0.50)` → `#00101A` edge |
| border | 1px solid `--color-border-gold` |
| border-radius | 47.14px |
| overflow | hidden; canvas absolute inside |

Inner controls (absolute, top-right area):
- B.7.1 `{N} KUDOS` label — `--text-h2`, `color: --color-accent-gold`, text-shadow `--glow-gold-lg`. **Live-updates** via Supabase Realtime subscription to `kudos` INSERT/DELETE events; debounced ≤ 1 tick / 500 ms during bursts.
- B.7.3 search input — 280 × 40 px, bg `rgba(255,234,158,0.10)`, border `--color-border-gold`, radius 24 px; placeholder "Tìm kiếm"; trailing magnifier icon.
- B.7.2 pan/zoom icon — 40 × 40 circle button, same border as search; tooltip "Pan/Zoom".

**Recent-receiver log (inside Spotlight)** — an animated vertical list of the most recent Kudo recipients (name + `received-at` relative time, e.g. `vừa xong`, `2 phút trước`). Styling:
- container: absolute bottom-left inside B.7, width 280, max-height 160, overflow-y hidden with a top-fade gradient mask; items reflow top-down.
- row: 40 px tall, `display: flex; align-items: center; gap: 8px;` — avatar 32 px + name (`--text-body-md`, `#FFFFFF`) + received-at (`--text-body-sm`, `--color-text-secondary`).
- entry animation: new row fades in from opacity 0 + translateY(+8), 300 ms ease-out; older rows shift down; rows beyond 4 visible are clipped by the fade mask.
- empty state: hide the entire log panel.

**Data layout & caching**: Node positions `x, y` are computed server-side and cached in a single blob keyed by event-day; TTL **5 minutes**. Clients `GET /api/spotlight` on mount + on a 5-minute interval; between polls, INSERTs from the realtime channel append new nodes at a random stable position on the outer ring (they will snap to their final position on the next 5-min refresh).

**Loading / empty / error states**:
- Loading (first fetch): show a Spotlight-shaped skeleton with a subtle pulsing border; disable pan/zoom/search.
- Empty (total = 0): show "Chưa có dữ liệu cho Spotlight." centered in the canvas at `--text-h4`, `--color-text-secondary`; hide pan/zoom/search controls.
- Reconnecting to realtime: show a small `Reconnecting…` label beside B.7.1 at `--text-body-sm`, `--color-text-secondary`.

### C.1 — ALL KUDOS header (`2940:14221`)

Full-width section header; sits **above** the 2-column C.2/D split.

`display: flex; flex-direction: column; gap: 8px; align-items: flex-start; margin-bottom: 24px;`

- **Eyebrow** `Sun* Annual Awards 2025` — `--text-h4`, `color: --color-text-tertiary`.
- **Title** `ALL KUDOS` — `--text-display` (57 / 700 / 64), `color: --color-accent-gold`, text-shadow `--glow-gold-lg`.

### C.2 — Feed container (`2940:13482`)

`width: 680px; display: flex; flex-direction: column; gap: 24px;` — infinite-scroll list of C.3 cards. Empty state renders a 680-wide placeholder with `Hiện tại chưa có Kudos nào.` (`--text-h4`, `--color-text-secondary`, `text-align: center`, padding-y 80 px).

### C.3 — Kudo Post card (`3127:21871`)

| Property | Value |
|---|---|
| width | 680px |
| min-height | 749px (fill on overflow) |
| padding | 40px 40px 16px 40px |
| background | #FFF8E1 |
| border-radius | 24px |
| display | flex column, gap 16 |
| box-shadow | `--shadow-card` |

Structure:
- C.3.1 sender block — avatar 56 + name (`--text-h4`, #00101A) + sub (department · stars · title `--text-body-sm`).
- C.3.2 sent-icon — 24 × 24, between C.3.1 and C.3.3.
- C.3.3 recipient block — identical style to C.3.1.
- C.3.4 time — `--text-body-sm`, `#00101A / 60%`.
- C.3.5 content — `--text-body-md`, 5-line clamp + `…`.
- C.3.6 attachment grid — horizontal row of 5 thumbs max, 80 × 80, radius 8, `object-cover`; click → lightbox.
- C.3.7 hashtags — same behaviour as B.4.3.
- C.4 action bar — left: C.4.1 Hearts pill (see below); right: C.4.2 "Copy Link" text-link.

### C.4.1 — Hearts pill (`I3127:21871;256:5175`)

| Property | Value |
|---|---|
| height | 40px |
| padding | 4px 12px |
| border-radius | 9999px |
| display | inline-flex, gap 6 |
| background | transparent |
| icon size | 20 × 20 |

**States**:

| State | Icon colour | Text colour | Background |
|---|---|---|---|
| Unliked | `--color-heart-inactive` (stroke) | `#00101A` | transparent |
| Hover | stroke → `--color-heart-active` | — | rgba(0,0,0,0.04) |
| Liked | fill `--color-heart-active` | `--color-heart-active` | rgba(212,39,29,0.08) |
| Disabled (author self) | stroke `#999`, icon 50% opacity | — | cursor: not-allowed |

### D — Sidebar (`2940:13488`)

`width: 422px; display: flex; flex-direction: column; gap: 24px; position: sticky; top: 24px;`

- D.1 stats panel: bg `rgba(16,20,23,0.80)`, border 1 px solid `--color-border-gold`, radius 16 px, padding 24 px, gap 16 px, each row `display: flex; justify-content: space-between;` label left / value right.
- Divider D.1.5: 1 px solid `#2E3940`, full-width.
- D.1.8 `Mở quà` button: **permanently rendered in the disabled variant** this release (feature deferred). Enabled variant styling is kept for future use.
  - Enabled (future): h 48, radius 8, bg `--color-accent-gold` (#FFEA9E), colour `#00101A`, `--text-h5`.
  - Disabled (this release — default): h 48, radius 8, bg `--color-surface-muted` (#2E3940), colour `--color-text-secondary` (#999), cursor `not-allowed`, no hover/focus transition. `aria-disabled="true"`, `disabled` attribute on the underlying `<button>`.
- D.3 list: title (`--text-h4`, `--color-accent-gold`, text-shadow glow) + 10 item rows; each row: avatar 40 + name (`--text-body-md`, white) + gift desc (`--text-body-sm`, `#EEE`). Scroll inside if content overflows height.

---

## Dropdowns

Both dropdowns share the same chrome (documented here once) and differ only in width and item content.

### Shared chrome

| Property | Value |
|---|---|
| background (panel) | `#00070C` |
| border | 1px solid `#998C5F` |
| border-radius | 8px |
| padding | 6px |
| display | flex column, gap 0 |
| position | absolute; anchored below trigger with 4px offset |
| max-height | 348px (then scroll-y) |
| z-index | 50 |
| shadow | `0 8px 24px rgba(0,0,0,0.35)` |

**Item (list row)**

| Property | Default | Selected | Hover / Focus |
|---|---|---|---|
| width | fill panel inner (so the click target spans the whole row) | — | — |
| height | 56px | — | — |
| padding | 16px | — | — |
| border-radius | 4px | — | — |
| background | transparent | `rgba(255,234,158,0.10)` | `rgba(255,234,158,0.06)` |
| text | `#FFFFFF`, Montserrat 16 / 700 / 24, letter-spacing 0.5px | + text-shadow `0 4px 4px rgba(0,0,0,0.25), 0 0 6px #FAE287` | — |
| text-align | **left** (with padding-left 16 px); Figma's `textAlign: center` on the inner TEXT node is a no-op because the text frame hugs its own width | — | — |
| cursor | pointer | — | — |

**A11y**: panel `role="listbox"`, items `role="option"` with `aria-selected`; arrow-up/down moves focus, `Enter`/`Space` selects, `Esc` closes.

### Dropdown — Hashtag filter (`JWpsISMAaM`)

| Property | Value |
|---|---|
| Figma node (panel) | `563:8026` (inner 200 × 349 px) |
| Trigger anchor | B.1.1 |
| Outer frame | 215 × 410 px (with Figma backdrop) |
| Panel width | 215px |
| Items | 13 program hashtags (see spec.md § Dropdown — Hashtag filter for list) |
| Widest item | `#Truyền cảm hứng` (≈ 180px wide) |

### Dropdown — Phòng ban (`WXK5AYB_rG`)

| Property | Value |
|---|---|
| Figma node (panel) | `563:8027` |
| Trigger anchor | B.1.2 |
| Outer frame | 289 × 410 px (with Figma backdrop) |
| Panel width | 289px |
| Items | ~49 department codes queried from DB at runtime (snapshot in spec.md) |
| Widest item | `OPDC - HRD - HRBP` / `CEVC1 - DSV - UI/UX 2` (≈ 255 px) |

---

## Component Hierarchy with Styles

```
Screen (bg: --color-page-bg)
└── Page container (max-w: 1440, px: 144, py: 48, flex-col, gap: 40)
    │
    ├── Row 1 · A KV Kudos (FULL WIDTH, w: 1152, h: 160, flex-col, gap: 10)
    │   ├── Hero title (Montserrat 36/700)
    │   └── A.1 Pill input (738×72, radius: 68, border: gold, bg: gold/10)
    │
    ├── Row 2 · B HIGHLIGHT KUDOS (FULL WIDTH, flex-col, gap: 40)
    │   ├── B.1 header (flex-col, gap: 16)
    │   │   ├── eyebrow "Sun* Annual Awards 2025"
    │   │   ├── title "HIGHLIGHT KUDOS" (57/700, gold, glow)
    │   │   └── filter row (flex, gap: 16)
    │   │       ├── B.1.1 Hashtag trigger  → Hashtag dropdown
    │   │       └── B.1.2 Phòng ban trigger → Phòng ban dropdown
    │   ├── B.2 carousel (3-up visible of up-to-5 total, center focused)
    │   │   └── B.3 Highlight card (showing 3 at a time)
    │   │       ├── sender/recipient blocks (B.3.1..B.3.6)
    │   │       ├── B.4 inner (B.4.1 time, B.4.2 content, B.4.3 hashtags)
    │   │       └── B.4.4 action bar (♥, Copy, Xem chi tiết)
    │   └── B.5 slide nav (←  n/5  →)
    │
    ├── Row 3 · Spotlight (FULL WIDTH, flex-col, gap: 24)
    │   ├── B.6 Spotlight header (eyebrow + "SPOTLIGHT BOARD" 57/700, gold, glow)
    │   └── B.7 Spotlight canvas (1157×548, radius: 47.14, border: gold)
    │       ├── B.7.1 "388 KUDOS" (top-left, 32/700, gold, glow)
    │       ├── B.7.3 search input (top-right)
    │       ├── B.7.2 pan/zoom icon (top-right)
    │       └── <word-cloud nodes>
    │
    └── Row 4 · ALL KUDOS
        ├── C.1 header (FULL WIDTH, eyebrow + "ALL KUDOS" 57/700, gold, glow)
        └── split row (flex, gap: 32)
            ├── C.2 feed (w: 680, flex-col, gap: 24)
            │   └── C.3 Kudo Post × N  (680×749, radius: 24, cream)
            │       ├── C.3.1 sender + C.3.2 sent-icon + C.3.3 recipient
            │       ├── C.3.4 time · C.3.5 content (5-line clamp)
            │       ├── C.3.6 attachment grid (≤ 5 × 80px)
            │       ├── C.3.7 hashtags
            │       └── C.4 action bar
            │           ├── C.4.1 Hearts pill
            │           └── C.4.2 Copy Link
            └── D Sidebar (w: 422, position: sticky, top: 24, flex-col, gap: 24)
                ├── D.1 Stats panel
                │   ├── D.1.2 Số Kudos bạn nhận được
                │   ├── D.1.3 Số Kudos bạn đã gửi
                │   ├── D.1.4 Số tim bạn nhận được
                │   ├── D.1.5 divider
                │   ├── D.1.6 Số Secret Box bạn đã mở
                │   ├── D.1.7 Số Secret Box chưa mở
                │   └── D.1.8 "Mở quà" button
                └── D.3 "10 SUNNER NHẬN QUÀ MỚI NHẤT"
                    ├── D.3.1 title
                    └── D.3.2..D.3.6+ receiver rows (avatar · name · gift)

   Floating dropdowns (overlay, z: 50)
   ├── Hashtag panel (215×≤348, 13 items) ─ anchored below B.1.1
   └── Phòng ban panel (289×≤348, 49 items) ─ anchored below B.1.2
```

---

## Responsive Specifications

### Breakpoints

| Name | Min Width | Max Width |
|------|-----------|-----------|
| Mobile | 0 | 767px |
| Tablet | 768px | 1023px |
| Desktop | 1024px | 1439px |
| Desktop XL | 1440px | ∞ |

### Responsive Changes

#### Mobile (< 768px)

| Component | Change |
|-----------|--------|
| Page container | px: 16 |
| A.1 pill | width 100%, height 56, font-size 14 |
| B.1 header title | font-size 32 |
| B.1 filter row | flex-direction column, buttons full width |
| B.2 carousel | 1 card per viewport, 100% width, swipe to nav, arrows hidden |
| B.3 card | width 100% |
| B.7 Spotlight | height 360, pan-only (zoom uses pinch) |
| C.3 card | width 100%, padding 24 |
| D Sidebar | hidden; replaced with a "Thống kê" bottom-sheet triggered by a sticky button |
| Hashtag/Phòng ban dropdown | rendered as bottom sheet (full-width, max-h 60vh) |

#### Tablet (768–1023px)

| Component | Change |
|-----------|--------|
| Page container | px: 32 |
| Main + Sidebar | single column; sidebar collapses into an accordion above C |
| B.2 carousel | 1 card per viewport with peek |

#### Desktop (≥ 1024px)

As specified in main layout above. At ≥ 1440 the layout caps at 1440 centered.

---

## Icon Specifications

| Icon Name | Size | Color | Usage |
|-----------|------|-------|-------|
| icon-pencil | 24×24 | `--color-accent-gold` | A.1 pill leading icon |
| icon-chevron-down | 16×16 | `--color-text-primary` | Filter trigger trailing icon |
| icon-chevron-left / icon-chevron-right | 24×24 | `--color-text-primary` | B.5 carousel arrows (disabled 30% opacity) |
| icon-arrow-right | 24×24 | `--color-text-on-cream` | B.3.4 between sender/recipient |
| icon-heart | 20×20 | `--color-heart-active` (filled) / inactive stroke | C.4.1 / B.4.4 hearts |
| icon-link | 16×16 | `--color-text-on-cream` | Copy Link button |
| icon-search | 20×20 | `--color-text-primary` | B.7.3 |
| icon-pan-zoom | 20×20 | `--color-text-primary` | B.7.2 |
| icon-gift | 20×20 | `#00101A` | D.1.8 leading icon |
| icon-close | 14×14 | `--color-text-primary` | Applied-filter "×" chip clear |

All icons MUST be provided as a single `<Icon />` React component (per project convention), not raw `<img>` or inline SVG tags.

---

## Animation & Transitions

| Element | Property | Duration | Easing | Trigger |
|---------|----------|----------|--------|---------|
| Filter button | background, outline | 150ms | ease-in-out | Hover, focus |
| Carousel track | transform | 300ms | cubic-bezier(.22,.61,.36,1) | Next/prev |
| Carousel card | transform, opacity | 300ms | ease-out | Slide change (center vs faded) |
| Heart icon | transform, color | 200ms | ease-out | Click (scale 1 → 1.15 → 1) |
| Dropdown panel | opacity, transform-y | 150ms | ease-out | Open / close (translateY(-4px) → 0) |
| Spotlight tooltip | opacity | 120ms | ease-out | Hover node |
| Toast (Copy Link) | opacity, transform-y | 200ms / 2.0s visible / 200ms out | ease | `Copy Link` click |

---

## Implementation Mapping

| Design Element | Figma Node ID | Tailwind / CSS Class | React Component |
|----------------|---------------|---------------------|-----------------|
| KV banner | `2940:13437` | `flex flex-col items-start gap-2.5 w-[1152px] h-40` | `<KvBanner />` (title = text; `KUDOS` wordmark = `<Image src="/assets/kv-kudos-wordmark.svg" />`) |
| Pill input (A.1) | `2940:13449` | `flex items-center gap-2 h-[72px] px-4 py-6 rounded-[68px] border border-[var(--border-gold)] bg-[rgba(255,234,158,0.10)]` | `<WriteKudoLauncher />` |
| Filter trigger (B.1.1 / B.1.2) | `2940:13459`, `2940:13460` | `h-14 px-4 gap-2 rounded bg-[rgba(255,234,158,0.10)] border border-[var(--border-gold)] text-white text-base font-bold tracking-[0.5px]` | `<FilterTrigger label="..." activeLabel={...} />` |
| Hashtag dropdown panel | `JWpsISMAaM` / `563:8026` | `w-[215px] rounded-lg bg-[#00070C] border border-[var(--border-gold)] p-1.5 flex flex-col` | `<HashtagDropdown items={...} value={...} onChange={...} />` |
| Phòng ban dropdown panel | `WXK5AYB_rG` / `563:8027` | `w-[289px] rounded-lg bg-[#00070C] border border-[var(--border-gold)] p-1.5 flex flex-col` | `<DepartmentDropdown items={...} value={...} onChange={...} />` |
| Dropdown option | `186:1496` / `186:1433` (component set `186:1426`) | `h-14 p-4 rounded text-white text-base font-bold text-center data-[selected=true]:bg-[rgba(255,234,158,0.10)] data-[selected=true]:text-shadow-gold` | `<DropdownItem selected={...} onSelect={...}>` |
| Carousel | `2940:13461` | `relative overflow-hidden` + JS track | `<HighlightCarousel slides={...} />` |
| Highlight card | `2940:13465` | `w-[528px] rounded-2xl bg-[#FFF8E1] border-4 border-[#FFEA9E] p-6 pb-4 flex flex-col gap-4` | `<HighlightCard kudo={...} />` |
| Slide nav chip | `2940:13473` | `text-[28px] font-bold leading-9 text-[#999]` | `<SlidePagination current={...} total={...} />` |
| Spotlight | `2940:14174` | `relative w-[1157px] h-[548px] rounded-[47.14px] border border-[var(--border-gold)]` | `<SpotlightBoard nodes={...} total={...} />` |
| Kudo Post card | `3127:21871` | `w-[680px] min-h-[749px] rounded-3xl bg-[#FFF8E1] p-10 pb-4 flex flex-col gap-4` | `<KudoPost kudo={...} />` |
| Hearts pill | `I3127:21871;256:5175` | `inline-flex items-center gap-1.5 h-10 px-3 rounded-full` | `<HeartsButton kudoId count active disabled />` |
| Copy Link | `I3127:21871;256:5216` | `text-base font-bold underline-offset-4 hover:underline` | `<CopyLinkButton kudoId />` |
| Spotlight header | `2940:13476` | `flex flex-col gap-2 mb-6` | `<SectionHeader eyebrow="Sun* Annual Awards 2025" title="SPOTLIGHT BOARD" />` |
| All Kudos header | `2940:14221` | `flex flex-col gap-2 mb-6` | `<SectionHeader eyebrow="Sun* Annual Awards 2025" title="ALL KUDOS" />` |
| Feed container | `2940:13482` | `w-[680px] flex flex-col gap-6` | `<KudoFeed items={...} onLoadMore={...} />` |
| Sidebar | `2940:13488` | `w-[422px] flex flex-col gap-6 sticky top-6 self-start` | `<KudosSidebar stats={...} receivers={...} />` |
| Stats panel | `2940:13489` | `rounded-2xl bg-[rgba(16,20,23,0.80)] border border-[var(--border-gold)] p-6 flex flex-col gap-4` | `<StatsPanel stats={...} />` |
| Mở quà button (always-disabled this release) | `2940:13497` | `h-12 rounded-lg bg-[#2E3940] text-[#999] text-[22px] font-bold cursor-not-allowed` | `<OpenSecretBoxButton disabled />` _(feature deferred; always passes `disabled`)_ |
| Recent receivers | `2940:13510` | `flex flex-col gap-3 rounded-2xl bg-[rgba(16,20,23,0.80)] border border-[var(--border-gold)] p-6` | `<RecentReceiversList items={...} />` |

---

## Notes

- All colors MUST be promoted to CSS variables / Tailwind theme tokens in `tailwind.config.ts` per constitution § II (TailwindCSS).
- Prefer Tailwind utilities; reserve inline hex only for the KV / card brand palette (`#FFF8E1`, `#FFEA9E`, `#00070C`, `#998C5F`, `#FAE287`) — these MUST be declared as theme tokens first and referenced via `bg-accent-cream`, `border-border-gold`, etc.
- Icons MUST be served through the shared `<Icon />` component (project-wide convention), not inline SVG/img tags.
- Contrast check: white body text on `#00101A` page bg = 17.8:1 (AAA); selected dropdown item gold glow text on `#00070C` remains ≥ 15:1 — AAA.
- Both dropdowns share the same component chrome — implement as a single `<AnchoredSingleSelect />` with width / items props, not two separate components.
- Carousel MUST be transform-driven (not `scrollLeft`) to keep pagination state JS-owned and avoid browser scroll-restoration glitches.
- On filter change, reset the carousel to slide 0 and update the pagination chip before the data arrives (skeleton the cards) — feels faster than waiting for the refetch.
- **Shared footer**: the site footer is rendered by the project-wide `<AppFooter />` layout (outside this screen's component tree). It is not specified here — do not re-implement; just ensure no content in A/B/C/D collides with the footer at common breakpoints.
- **SVG asset export**: confirm `public/assets/kv-kudos-wordmark.svg` is present before implementation — the developer MUST export this from Figma node `2940:13437` (KV Kudos group, the "KUDOS" logo subnode) rather than approximate with CSS.
- **Realtime scope reminder**: only B.7 is live. Keep the Supabase Realtime subscription *inside* the Spotlight component so tearing it out in a future release (or scope-expanding it) is a one-file change.
