# Design Style: Hệ thống giải

**Frame ID**: `313:8436`
**Screen ID**: `zFYDgyj_pD`
**Frame Name**: `Hệ thống giải`
**File Key**: `9ypp4enmFmdK3YAFJLIu6C`
**Figma Link**: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/zFYDgyj_pD
**Extracted At**: 2026-04-17

---

## Design Tokens

### Colors

| Token Name | Hex Value | Opacity | Usage |
|------------|-----------|---------|-------|
| --color-bg-primary | #00101A | 100% | Page background (frame root) |
| --color-bg-keyvisual-overlay | linear-gradient(0deg, #00101A -4.23%, rgba(0,19,32,0) 52.79%) | - | Keyvisual bottom fade overlay |
| --color-header-bg | #101417 | 80% | Header (semi-transparent) |
| --color-kudos-bg | #0F0F0F | 100% | Sun* Kudos promo block background |
| --color-text-primary | #FFFFFF | 100% | Body text, headings, nav items |
| --color-text-gold | #FFEA9E | 100% | Main title, active nav, award name overlay |
| --color-text-inverse | #00101A | 100% | Button text on gold button |
| --color-text-kudos-brand | #DBD1C1 | 100% | Sun*KUDOS logotype color |
| --color-divider | #2E3940 | 100% | Horizontal dividers between sections/cards |
| --color-border-gold-10 | rgba(255,234,158,0.10) | 10% | Subtle gold borders |
| --color-border-gold-muted | #998C5F | 100% | Button-IC icon border (header avatar) |
| --color-award-img-border | #FFEA9E | 100% (0.955px) | Award thumbnail image border |
| --color-notification-badge | #EF4444 | 100% | Bell icon red badge |

### Typography

| Token Name | Font Family | Size | Weight | Line Height | Letter Spacing | Usage |
|------------|-------------|------|--------|-------------|----------------|-------|
| --text-hero-title | Montserrat | 57px | 700 | 64px | 0 | "Hệ thống giải thưởng SAA 2025" main heading |
| --text-section-head | Montserrat | 36px | 700 | 44px | 0 | Award card titles ("Top Talent", "MVP", etc.) |
| --text-subtitle | Montserrat | 24px | 700 | 32px | 0 | "Sun* Annual Awards 2025" eyebrow, Kudos title |
| --text-kudos-logo | SVN-Gotham | 96px | 400 | 24px | -13% | "KUDOS" brand logotype |
| --text-body | Montserrat | 16px | 700 | 24px | 0.5px | Card descriptions, body copy |
| --text-body-white | Montserrat | 16px | 700 | 24px | 0 | Menu headers, event details |
| --text-btn-primary | Montserrat | 16px | 700 | 24px | 0 | "Chi tiết" CTA text (on gold) |
| --text-nav-link | Montserrat | 14px | 700 | 20px | 0.25px | Header nav links, menu items |
| --text-footer | Montserrat Alternates | 16px | 700 | 24px | 0 | "Bản quyền thuộc về Sun* © 2025" |

### Spacing

| Token Name | Value | Usage |
|------------|-------|-------|
| --spacing-page-x | 144px | Horizontal padding of main content |
| --spacing-page-y | 96px | Top/bottom padding of main content |
| --spacing-section-gap | 120px | Gap between major sections (Title ↔ Awards ↔ Kudos) |
| --spacing-awards-grid-gap | 80px | Gap between menu & awards grid; gap between award cards |
| --spacing-menu-gap | 16px | Gap between menu items (vertical) |
| --spacing-menu-item-pad | 16px | Padding inside menu item |
| --spacing-card-inner-gap | 32px | Gap between sections inside an award content block |
| --spacing-card-image-gap | 40px | Gap between image & text content in award card |
| --spacing-title-gap | 16px | Gap between eyebrow text and hero title |
| --spacing-header-x | 144px | Header horizontal padding |
| --spacing-header-y | 12px | Header vertical padding |
| --spacing-header-gap | 24px | Gap between header nav links |
| --spacing-footer-x | 90px | Footer horizontal padding |
| --spacing-footer-y | 40px | Footer vertical padding |

### Border & Radius

| Token Name | Value | Usage |
|------------|-------|-------|
| --radius-menu-item | 4px | Menu item active/hover background |
| --radius-content-block | 16px | Internal content frames (descriptive block) |
| --radius-card | 0px | Award card outer container (no rounded corners) |
| --border-award-img | 0.955px solid #FFEA9E | Award thumbnail image gold border |
| --border-divider | 1px solid #2E3940 | Horizontal dividers |
| --border-icon-btn | 1px solid #998C5F | Avatar/Icon button (header) |

### Shadows & Effects

| Token Name | Value | Usage |
|------------|-------|-------|
| --shadow-none | none | No drop shadows used on this screen |
| --overlay-keyvisual | linear-gradient bottom fade | Keyvisual → background blend |

---

## Layout Specifications

### Container (Desktop)

| Property | Value | Notes |
|----------|-------|-------|
| frame-width | 1440px | Figma base canvas |
| frame-height | 6410px | Long-scroll single page |
| content-max-width | 1152px | Inner "Bìa" (content wrapper) |
| content-padding | 96px 144px | Vertical / horizontal page padding |

### Layout Structure (ASCII)

```
┌──────────────────────────────────────────────────────────────────────┐
│  Header (fixed, h:80px, bg:#101417@80%, z:50)                        │
│  [Logo] [About SAA] [Awards Info] [Sun* Kudos]   [🔔][VN▾][👤]       │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  3_Keyvisual (h:547px, bg-image + bottom gradient to #00101A)        │
│  (decorative only)                                                   │
│                                                                      │
├──────────────────────────────────────────────────────────────────────┤
│  Bìa  (max-w:1152px, padding:96px 144px, gap:120px)                  │
│                                                                      │
│  KV (spacer, h:150px)                                                │
│                                                                      │
│  A_Title hệ thống giải thưởng (w:1152px, gap:16px)                   │
│   ├─ "Sun* Annual Awards 2025"  (24/32 Montserrat 700, white)        │
│   ├─ ─── divider (1px #2E3940) ───                                   │
│   └─ "Hệ thống giải thưởng SAA 2025" (57/64 Montserrat 700 #FFEA9E)  │
│                                                                      │
│  B_Hệ thống giải thưởng (flex-row, gap:80px, justify:space-between)  │
│  ┌─────────────────┐  ┌──────────────────────────────────────────┐   │
│  │  C_Menu list    │  │  D_Danh sách giải thưởng (w:853px)       │   │
│  │  (w:178px,      │  │  (flex-col, gap:80px)                    │   │
│  │   sticky,       │  │                                          │   │
│  │   gap:16px)     │  │  ┌──────────────────────────────────┐    │   │
│  │  ──────────     │  │  │ D.1 Top Talent                   │    │   │
│  │  ● Top Talent   │  │  │ ┌──────┐  ┌────────────────────┐ │    │   │
│  │    (active      │  │  │ │336x  │  │ Title 36/44 #FFF   │ │    │   │
│  │     #FFEA9E)    │  │  │ │336   │  │ Description 16px   │ │    │   │
│  │  ○ Top Project  │  │  │ │image │  │ ─── divider ───    │ │    │   │
│  │  ○ Top Project  │  │  │ └──────┘  │ Số lượng: 10       │ │    │   │
│  │    Leader       │  │  │           │ ─── divider ───    │ │    │   │
│  │  ○ Best Manager │  │  │           │ Giá trị:7.000.000đ │ │    │   │
│  │  ○ Signature    │  │  │           └────────────────────┘ │    │   │
│  │    2025         │  │  └──────────────────────────────────┘    │   │
│  │  ○ MVP          │  │  ───── 1px divider #2E3940 ─────         │   │
│  └─────────────────┘  │  D.2 Top Project   (reversed layout?)    │   │
│                       │  D.3 Top Project Leader                  │   │
│                       │  D.4 Best Manager                        │   │
│                       │  D.5 Signature 2025 (dual-tier prize)    │   │
│                       │  D.6 MVP (layout mirrored: text│image)   │   │
│                       └──────────────────────────────────────────┘   │
│                                                                      │
│  D1_Sunkudos (w:1152px, h:500px, bg:#0F0F0F + image overlay)         │
│  ┌──────────────────────────────────────────────────────────────┐    │
│  │  [D2_Content w:470px]         [KUDOS logotype]               │    │
│  │  Phong trào ghi nhận                                         │    │
│  │  Sun* Kudos (24/32 #FFF)                                     │    │
│  │  <description paragraph>                                     │    │
│  │  [Chi tiết →] (text_link button)                             │    │
│  └──────────────────────────────────────────────────────────────┘    │
│                                                                      │
├──────────────────────────────────────────────────────────────────────┤
│  Footer (h:144px, padding:40px 90px, bg:#00101A, top-border #2E3940) │
│  [Logo] [Home] [About SAA] [Awards Info] [Sun* Kudos]  © Sun* 2025   │
└──────────────────────────────────────────────────────────────────────┘
```

### Grid/Flex Layout

| Property | Value | Notes |
|----------|-------|-------|
| page layout | flex, column, gap: 120 px (desktop) / 64 px (mobile) | Page sections stacked |
| awards section layout (desktop `≥ md`) | flex, row, gap: 80 px, justify: space-between | Menu left / cards right |
| awards section layout (mobile `< md`) | flex, column | Menu becomes top tab bar, cards below |
| menu layout (desktop) | flex, column, gap: 16 px, `sticky top-[104px]` | Sticky left rail |
| menu layout (mobile) | flex, row, `sticky top-16 z-40`, `overflow-x-auto`, `snap-x snap-mandatory` | Sticky horizontal tab bar pinned under `<AppHeader>` |
| awards list layout | flex, column, gap: 80 px | Vertical stack of 6 cards |
| award card layout (desktop) | flex, row, gap: 40 px, alternating via `layout="image-left\|image-right"` | D.1/D.3/D.5 image-left; D.2/D.4/D.6 image-right |
| award card layout (mobile) | flex, column, image above content | Image centered, max 336 px width |
| card content layout | flex, column, gap: 32 px | Title / description / divider / metadata |

---

## Component Style Details

### 1. Header — use shared `<AppHeader>` ([components/shared/AppHeader.tsx](components/shared/AppHeader.tsx))

This page MUST render `<AppHeader />` as-is. Do NOT reimplement the header.

| Property | Value (from existing component) |
|----------|---------------------------------|
| **Node ID** | 313:8440 (Figma reference only) |
| width | `w-full`, `max-w-[1512px]` inner container |
| height | `h-16` (mobile) / `lg:h-20` (desktop) |
| position | `fixed top-0 z-50` |
| background | `bg-[#101417]/80 backdrop-blur-sm` |
| padding | `px-4 sm:px-12 lg:px-36 py-3` |
| display | `flex items-center justify-between` |
| children | `<Image>` logo + `<NavLinks>` + `<NotificationBell>` + `<LanguageSelector>` + `<UserAvatar>` |

**Active nav state** (defined by `<NavLinks>`, not by this page): `text-[#FFEA9E] underline underline-offset-8` + `aria-current="page"`. Since this page lives at `/awards`, the "Awards Information" (`nav.awardsInfo`) link auto-activates via `usePathname()`.

---

### 2. Keyvisual Banner

| Property | Value | CSS |
|----------|-------|-----|
| **Node ID** | 313:8437 (Group) · 313:8439 (overlay) | - |
| width | 1440px (100%) | `w-full` |
| height | 547px (image area) + 627px total with fade | `h-[547px]` |
| background | image (object-fit: cover, position: center) + bottom-fading gradient to #00101A | `bg-cover bg-center` |
| role | decorative (no interactive behavior) | `aria-hidden="true"` |

**Accessibility:** decorative; `alt=""` if `<img>`; otherwise `role="presentation"`.

---

### 3. Title Section (A_Title hệ thống giải thưởng)

| Property | Value | CSS |
|----------|-------|-----|
| **Node ID** | 313:8453 | - |
| width | 1152px | `w-full max-w-[1152px]` |
| display | flex, column | `flex flex-col` |
| gap | 16px | `gap-4` |

**Eyebrow Text** (Node 313:8454 – "Sun* Annual Awards 2025")
| Property | Value |
|----------|-------|
| font | Montserrat 700 24px / 32px |
| color | #FFFFFF |

**Divider** (Node 313:8455)
| Property | Value |
|----------|-------|
| width | 100% |
| height | 1px |
| background | #2E3940 |

**Main Heading** (Node 313:8457 – "Hệ thống giải thưởng SAA 2025")
| Property | Value |
|----------|-------|
| font | Montserrat 700 57px / 64px |
| color | #FFEA9E |
| text-align | center |

---

### 4. Navigation Menu (C_Menu list)

| Property | Value | CSS |
|----------|-------|-----|
| **Node ID** | 313:8459 | - |
| width (desktop) | hug content (max ~178 px) | `w-fit max-w-[178px]` |
| display | flex, column | `md:flex md:flex-col` |
| gap | 16 px | `md:gap-4` |
| position (desktop `≥ md`) | sticky, 104 px from top (header 80 + 24 px breathing room) | `md:sticky md:top-[104px]` |
| position (mobile `< md`) | sticky under `<AppHeader>`, horizontal tab bar | `sticky top-16 z-40 flex flex-row overflow-x-auto snap-x snap-mandatory scrollbar-hide` |

#### Menu Item (C.1 – C.6)

| Property | Value | CSS |
|----------|-------|-----|
| **Node IDs** | 313:8460 / 313:8461 / 313:8462 / 313:8463 / 313:8464 / 313:8465 | - |
| width | hug content (observed: 95 px to 178 px across the 6 items) | `w-fit` |
| height | 56px (1-line) / 72px (2-line wrap when text wraps, e.g. "Top Project Leader", "Signature 2025 – Creator") | - |
| min touch target | 44 × 44 px on mobile (met by padding) | - |
| padding | 16px | `px-4 py-4` |
| gap (icon ↔ text) | 4px | `gap-1` |
| border-radius | 4px | `rounded-[4px]` |
| icon | 24 × 24 (`MM_MEDIA_Target`) | - |
| text | Montserrat 700, 14 px / 20 px, letter-spacing 0.25 px | - |

**States:** Active state matches the established `<NavLinks>` convention — **gold text color + 8 px-offset underline**.

| State | background | text color | icon color | indicator | notes |
|-------|-----------|------------|-----------|-----------|-------|
| Default | transparent | #FFFFFF | currentColor (#FFFFFF) | none | Inactive |
| Hover | rgba(255,234,158,0.05) | #FFEA9E | #FFEA9E | none | Highlight |
| Active | transparent | #FFEA9E | #FFEA9E | `underline underline-offset-8` | Set by scroll-spy; `aria-current="true"` |
| Focus | transparent | inherits (#FFFFFF or #FFEA9E) | inherits | `outline-2 outline-[#FFEA9E] outline-offset-2` | Keyboard |
| Disabled | — (not applicable on this screen) | — | — | — | — |

---

### 5. Award Card — Standard (D.1 – D.4, D.6)

Two alternating layouts:
- **Image-left** (D.1, D.3, D.5): image | content
- **Image-right** (D.2, D.4, D.6): content | image (mirrored)

| Property | Value | CSS |
|----------|-------|-----|
| **Node IDs** | 313:8467 (D.1), 313:8468, 313:8469, 313:8470, 313:8510 (D.6) | - |
| width | 856px | `w-full max-w-[856px]` |
| padding | 0 | - |
| gap (outer) | 80px (before next card incl. divider) | `mb-20` |
| display | flex, column | `flex flex-col` |

Inside each card: `Frame 506` (row, w:856, gap:40px, h:~550–730).

#### Card Image (D.x.1_Picture-Award)

| Property | Value | CSS |
|----------|-------|-----|
| width / height | 336 × 336 px | `w-84 h-84` (custom: `w-[336px] h-[336px]`) |
| border | 0.955px solid #FFEA9E | `border border-[#FFEA9E]` |
| background | cover image (CSS `object-cover`) | `object-cover` |
| padding | 149.864px 53.455px | (used for label overlay positioning) |
| radius | 0 | `rounded-none` |
| overlay | Awards-Name badge centered (gold text over image) | - |

#### Card Content (D.x.2_Content)

| Property | Value | CSS |
|----------|-------|-----|
| width | 480px | `w-[480px]` |
| gap | 32px (between title, description, metadata blocks) | `gap-8` |
| display | flex, column | `flex flex-col` |

- **Title** — "Top Talent" / "Top Project" / etc. — Montserrat 700 36 px / 44 px #FFFFFF.
- **Description** — Montserrat 700 16 px / 24 px #FFFFFF, letter-spacing 0.5 px. Full paragraph, never truncated.
- **Divider** — 1 px line #2E3940 (between description and metadata row/s).
- **Metadata Row (structure)** — horizontal flex row, `gap: 16 px`, baseline alignment:
  - Left cluster (label + icon): icon 24 × 24 in gold + label "Số lượng giải thưởng:" or "Giá trị giải thưởng:" (Montserrat 700 16/24 #FFFFFF).
  - Right cluster (value): zero-padded quantity (e.g. `10`, `02`) OR formatted currency (`7.000.000 VNĐ`) — Montserrat 700 36 px / 44 px in gold `#FFEA9E`, followed by a unit / qualifier text in Montserrat 700 16/24 #FFFFFF (e.g. " Đơn vị", " Cá nhân", " Tập thể", " cho mỗi giải thưởng").
- **Inter-card divider** — 1 px line #2E3940 full-width (853 px) at the bottom of each card (except the last).

---

### 6. Award Card — Signature 2025 (D.5, dual-tier)

| Property | Value | CSS |
|----------|-------|-----|
| **Node ID** | 313:8471 | - |
| width × height | 856 × 1047 px (tallest card) | - |
| gap | 80px (outer), 40px (image↔content), 32px (inside content) | - |
| dual-prize block | Two rows showing individual (5.000.000 VNĐ) and group (8.000.000 VNĐ) prizes with a 1px #2E3940 divider | - |

Remaining properties mirror standard card (section 5).

---

### 7. Sun* Kudos Promo Block (D1_Sunkudos)

| Property | Value | CSS |
|----------|-------|-----|
| **Node ID** | 335:12023 | - |
| width × height | 1152 × 500 px | `w-full h-[500px]` |
| background | #0F0F0F + decorative image overlay | `bg-[#0F0F0F] relative overflow-hidden` |
| display | flex, row, align-center, justify-between | - |
| padding / gap | content block 470×408px positioned with Kudos logotype at right | - |

**Content** (`D2_Content` – Node I335:12023;313:8419):

| Element | Style |
|---------|-------|
| Eyebrow "Phong trào ghi nhận" | Montserrat 700 16/24 white |
| Title "Sun* Kudos" | Montserrat 700 24/32 white |
| Description | Montserrat 400 16/24 white |
| "Chi tiết" text link + icon | Montserrat 700 16/24 #FFEA9E, icon 20×20 |

**Logotype "KUDOS"** (Node I335:12023;329:2949)

| Property | Value |
|----------|-------|
| font | SVN-Gotham 400 96px |
| line-height | 24px (compressed) |
| letter-spacing | -13% |
| color | #DBD1C1 |

**"Chi tiết" Button States**

| State | background | text | icon |
|-------|-----------|------|------|
| Default | transparent | #FFEA9E | #FFEA9E |
| Hover | underline text | #FFEA9E | translate-x-1 (slide icon) |
| Focus | 2px outline #FFEA9E | - | - |

---

### 8. Footer — use shared `<AppFooter>` ([components/shared/AppFooter.tsx](components/shared/AppFooter.tsx))

This page MUST render `<AppFooter />` as-is. Do NOT reimplement the footer.

| Property | Value (from existing component) |
|----------|---------------------------------|
| **Node ID** | 354:4323 (Figma reference only) |
| width | `w-full`, `max-w-[1512px]` inner container |
| padding | `px-4 py-6 sm:px-12 sm:py-8 lg:px-[90px] lg:py-10` |
| background | transparent over page bg (`bg-[#00101A]` inherited from page) |
| border-top | `border-t border-[#2E3940]` |
| layout | `flex-col sm:flex-row items-start sm:items-center justify-between gap-6` |
| links | Home (`/`), Awards Info (`/awards`), Sun\* Kudos (`/kudos`), Rules (`/rules`) — all driven by `next-intl` `t()` |
| copyright | `t("login.footer.copyright")` — Montserrat 700 14/20 `text-white/60` |

> Note: the copyright text style in the Figma frame is Montserrat Alternates 700 16/24 white. The current `<AppFooter>` implementation uses Montserrat 700 14/20 at 60% opacity. **Visual discrepancy flagged** — decide during planning whether to (i) update `<AppFooter>` to match Figma, or (ii) accept the current footer style as the canonical system. This is a cross-page decision beyond the scope of this single screen.

---

## Component Hierarchy with Styles

```
Screen (bg: #00101A)
├── Header [fixed, h:80, bg:#101417/80]
│   ├── Logo (52×48)
│   ├── NavLinks (gap:24px, 14px/700 Montserrat)
│   └── Actions (gap:16px: Language, 🔔 Notification, Avatar-btn 40×40 border #998C5F)
│
├── Keyvisual [h:547px, bg-image + bottom fade #00101A]
│
├── Bìa (max-w:1152px, px:144px, py:96px, gap:120px, flex-col)
│   │
│   ├── KV (spacer h:150px)
│   │
│   ├── A_Title (flex-col, gap:16)
│   │   ├── "Sun* Annual Awards 2025" (24/32 700 #FFF)
│   │   ├── Divider 1px #2E3940
│   │   └── "Hệ thống giải thưởng SAA 2025" (57/64 700 #FFEA9E)
│   │
│   ├── B_Awards (flex-row, gap:80, justify:space-between)
│   │   ├── C_Menu (w:178, flex-col, gap:16, sticky)
│   │   │   └── C.1–C.6 (item: p:16, radius:4, 14/20 700 +icon 24×24)
│   │   │
│   │   └── D_Cards (w:853, flex-col, gap:80)
│   │       ├── D.1 Top Talent [image-left]
│   │       ├── D.2 Top Project [image-right]
│   │       ├── D.3 Top Project Leader [image-left]
│   │       ├── D.4 Best Manager [image-right]
│   │       ├── D.5 Signature 2025 [image-left, dual-tier]
│   │       └── D.6 MVP [image-right]
│   │
│   └── D1_Sunkudos (w:1152, h:500, bg:#0F0F0F + image)
│       ├── D2_Content (w:470, flex-col, gap:32)
│       │   ├── Eyebrow "Phong trào ghi nhận"
│       │   ├── Title "Sun* Kudos" (24/32 700 #FFF)
│       │   ├── Description
│       │   └── "Chi tiết" text_link button
│       └── KUDOS logotype (SVN-Gotham 96, #DBD1C1)
│
└── Footer [p:40 90, border-top #2E3940]
    ├── Logo (69×64)
    ├── NavLinks (Montserrat 700 14/20)
    └── Copyright "Bản quyền thuộc về Sun* © 2025" (Montserrat Alternates 700 16/24)
```

---

## Responsive Specifications

The Figma frame is desktop (1440px). Breakpoint plan follows the constitution's TailwindCSS mobile-first principle.

### Breakpoints (Tailwind 4 defaults — per constitution §V)

| Name | Tailwind prefix | Min Width |
|------|-----------------|-----------|
| Mobile (base) | (none) | 0 |
| Small | `sm:` | 640px |
| Tablet | `md:` | 768px |
| Desktop | `lg:` | 1024px |
| Large Desktop | `xl:` | 1280px (matches Figma base behaviour) |

> The Figma frame at 1440 px targets `xl` and above. Below `md` we adopt a single-column mobile layout. Touch targets ≥ 44 × 44 px required below `md`.

### Responsive Changes

#### Mobile (< 768 px, `< md`)

| Component | Changes |
|-----------|---------|
| Container | padding: 16 px 16 px |
| Hero title | font-size: 32 px / 40 px (auto-fit) |
| Eyebrow | font-size: 16 px / 24 px |
| Section gap | 64 px |
| B_Awards | `flex-direction: column` — menu stacks above cards |
| **C_Menu (mobile tab bar)** | `sticky top-16 z-40 bg-[#00101A] border-b border-[#2E3940] flex flex-row overflow-x-auto scroll-smooth` with `scroll-snap-type: x mandatory` and `scroll-snap-align: center` on each item. Container full-width. Each item `flex-shrink: 0`, `min-h: 44 px`. Active tab auto-scrolls into view via `scrollIntoView({ inline: 'center' })` when scroll-spy changes. Hide native scrollbar (`scrollbar-hide`) but keep touch scrolling enabled. |
| Menu item (in tab bar) | gap-1, `px-3 py-2`, `whitespace-nowrap`, touch target ≥ 44 × 44 px. Same active styling (gold + underline) as desktop. Icon 20×20 (reduced from 24×24 for compactness). |
| Award card | `flex-direction: column`, image `w-full max-w-[336px]` centered, content below |
| Card content width | 100% |
| D1_Sunkudos | `flex-col`, image becomes background decoration only; logotype scales to 56 px |
| KUDOS logotype | font-size: 56 px |
| Header | `<AppHeader>`'s mobile layout (already handled — `h-16`, logo + actions, `<NavLinks>` hidden via `hidden lg:flex`) |
| Footer | `<AppFooter>`'s mobile layout (already handled — `flex-col sm:flex-row`) |

#### Tablet (768px – 1023px)

| Component | Changes |
|-----------|---------|
| Container | padding: 48px 32px |
| Hero title | font-size: 44px / 52px |
| B_Awards gap | 40px |
| Menu | Sticky vertical (w:160px) |
| Award card | image 240×240, content flex-1 |

#### Desktop (≥ 1024px)

| Component | Changes |
|-----------|---------|
| Container | max-width: 1152px, margin: 0 auto |
| All dimensions | Match Figma exactly |

---

## Icon Specifications

| Icon Name | Size | Color | Usage |
|-----------|------|-------|-------|
| icon-target (MM_MEDIA_Target) | 24×24 | inherit currentColor | Menu item bullet/marker |
| icon-bell (Notification) | 40×40 (container) / 24 (glyph) | #FFFFFF | Header notification |
| icon-avatar | 40×40, 1px border #998C5F | - | Header user avatar |
| icon-globe | 20×20 | #FFFFFF | Language dropdown prefix |
| icon-chevron-down | 16×16 | #FFFFFF | Language dropdown toggle |
| icon-arrow-right | 20×20 | #FFEA9E | "Chi tiết" CTA trailing icon |

All icons MUST be rendered through a shared `<Icon name="..." />` component (per constitution).

---

## Animation & Transitions

| Element | Property | Duration | Easing | Trigger |
|---------|----------|----------|--------|---------|
| Menu item | `color`, `text-decoration-color`, `background-color` | 150 ms | ease-in-out | Hover / Active change |
| Mobile tab bar active-tab auto-scroll | `scrollLeft` (via `scrollIntoView`) | browser default (~300 ms) | ease-in-out | Scroll-spy active change (mobile only) |
| Smooth anchor scroll | `window.scrollY` | 400–600 ms | ease-in-out | Menu click → scroll to card |
| "Chi tiết" button | `translate-x` (icon) + `text-decoration` underline | 150 ms | ease-in-out | Hover |
| Keyvisual fade-in | `opacity 0→1` | 400 ms | ease-out | Mount (optional; respect RM) |
| Card image | `transform: scale(1)→scale(1.02)` | 200 ms | ease-out | Hover (optional enhancement) |

All animations MUST respect `prefers-reduced-motion: reduce` (fallback: no motion; smooth-scroll degrades to `behavior: 'auto'`).

---

## Implementation Mapping

| Design Element | Figma Node ID | Tailwind / CSS Class | React Component |
|----------------|---------------|---------------------|-----------------|
| Page container | 313:8436 | `min-h-screen bg-[#00101A] text-white font-montserrat` | `app/awards/page.tsx` (default export) |
| Header | 313:8440 | (reused, no override) | `<AppHeader />` from `@/components/shared/AppHeader` |
| Keyvisual | 313:8437 | `relative h-[547px] w-full` | `components/awards/Keyvisual.tsx` |
| Title section | 313:8453 | `flex flex-col gap-4 w-full max-w-[1152px]` | `components/awards/AwardsTitle.tsx` |
| Awards wrapper | 313:8458 | `flex flex-col md:flex-row md:justify-between md:gap-20` | (inline JSX in `page.tsx`) |
| Menu (desktop `≥ md`) | 313:8459 | `sticky top-[104px] w-fit flex flex-col gap-4` | `components/awards/AwardsMenu.tsx` (Client) |
| Menu (mobile `< md`) | 313:8459 | `sticky top-16 z-40 bg-[#00101A] border-b border-[#2E3940] flex flex-row overflow-x-auto scrollbar-hide snap-x snap-mandatory` | Same `AwardsMenu.tsx` — responsive branches on `md:` |
| Menu item | 313:8460–65 | `flex items-center gap-1 px-4 py-4 rounded-[4px] text-sm font-bold motion-safe:transition-colors` | `<MenuItem active={...} />` (internal to `AwardsMenu.tsx`) |
| Award card (standard) | 313:8467–8470, 8510 | `flex flex-col md:flex-row md:gap-10 w-full max-w-[856px] pb-20 border-b border-[#2E3940]` — `md:flex-row-reverse` applied when `layout="image-right"` | `components/awards/AwardCard.tsx` (Server, accepts `layout="image-left \| image-right"`) |
| Award image | I313:8467;214:2525 | `w-full max-w-[336px] aspect-square md:w-[336px] md:h-[336px] border border-[#FFEA9E] object-cover` | `components/awards/AwardImage.tsx` |
| Award content | I313:8467;214:2526 | `flex flex-col gap-8 w-full md:w-[480px]` | (internal to `AwardCard`) |
| Signature dual-prize | 313:8471 | `flex flex-col gap-6` | `components/awards/SignatureAwardCard.tsx` |
| Sun* Kudos block | 335:12023 | `relative w-full md:h-[500px] bg-[#0F0F0F] overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between px-4 py-8 md:px-36` | `components/awards/KudosPromo.tsx` |
| "Chi tiết" link | I335:12023;313:8426 | `inline-flex items-center gap-2 text-[#FFEA9E] font-bold` | `<Link href="/kudos">` (next/link, inside `KudosPromo`) |
| Footer | 354:4323 | (reused, no override) | `<AppFooter />` from `@/components/shared/AppFooter` |

---

## Notes

- All colors MUST be declared as CSS variables in `app/globals.css` or as Tailwind 4 `@theme` tokens (per constitution).
- Award cards alternate left/right image layout — implement via `layout` prop, not duplicate components. Pattern: D.1 / D.3 / D.5 = `image-left`; D.2 / D.4 / D.6 = `image-right` (verified by Figma `position.startX` extraction).
- The left `C_Menu` MUST implement **scroll-spy**: active state follows which award card is in viewport (`IntersectionObserver`, `rootMargin: "-104px 0px -50% 0px"`).
- Menu click MUST trigger **smooth scroll** to the corresponding card (respect `prefers-reduced-motion`).
- Images MUST be served via `next/image` per constitution; apply `priority` only to the Keyvisual (LCP). D.1 image may be `loading="eager"` to stabilize CLS of the awards section.
- Menu items MUST be keyboard-navigable with visible focus ring. `aria-current="true"` on the active `<a>`.
- All icons MUST be SVG rendered through a single `<Icon name="..." />` component; no `<img>` tags for icons.
- Font loading: Montserrat & Montserrat Alternates via `next/font/google`; SVN-Gotham as a local font asset loaded with `next/font/local`. Fallback chain: `'SVN-Gotham', 'Montserrat', system-ui, sans-serif` with `font-weight: 900` and tightened line-height simulating the compressed logotype.
- Color contrast: gold `#FFEA9E` on `#00101A` ≈ 12.3:1, passes WCAG AAA. White on `#00101A` ≈ 17.8:1, passes AAA. Metadata value gold text on `#00101A` also AAA.
- Touch targets: all interactive elements MUST be ≥ 44 × 44 px on viewports `< md` (per constitution §V).
- Active menu indicator: gold `#FFEA9E` text + `underline underline-offset-8`, matching the established `<NavLinks>` convention.
- Japanese (`ja`) locale adds a third set of strings in `messages/ja.json` — font stack unchanged (Montserrat supports Latin; Japanese glyphs fall back to system CJK fonts which is acceptable for body text).
