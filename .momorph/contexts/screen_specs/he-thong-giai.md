# Screen: Hệ thống giải (Award System)

## Screen Info

| Property | Value |
|----------|-------|
| **Figma Frame ID** | zFYDgyj_pD |
| **Figma Link** | https://www.figma.com/design/9ypp4enmFmdK3YAFJLIu6C?node-id=zFYDgyj_pD |
| **Screen Group** | Main Application |
| **Status** | discovered |
| **Discovered At** | 2026-04-17 |
| **Last Updated** | 2026-04-17 |

---

## Description

"Hệ thống giải" (Award System) is the SAA 2025 awards catalog page. It presents the full set of award categories for the Sun* Annual Awards 2025 ("ROOT FURTHER" campaign) in a two-column layout: a sticky left-side navigation that lists the six categories, and a scrollable right-side content area that displays detailed info cards for each category. The page ends with a Sun* Kudos promo block and the global footer.

The screen is primarily informational (read-only) - users do not nominate or submit anything on this page. Its purpose is to help Sunners understand each award's criteria, quantity, and prize value, and to invite them to participate in Sun* Kudos as an adjacent initiative.

---

## Navigation Analysis

### Incoming Navigations (From)

| Source Screen | Trigger | Condition |
|---------------|---------|-----------|
| Homepage SAA (i87tDx10uM) | Header menu / Awards Information Navigation Link | Authenticated user |
| Footer (global) | Footer link "Hệ thống giải" | Any authenticated page |

### Outgoing Navigations (To)

| Target Screen | Trigger Element | Node ID | Confidence | Notes |
|---------------|-----------------|---------|------------|-------|
| Homepage SAA (i87tDx10uM) | Header LOGO click | I313:8440;178:1033 | High | Standard logo-to-home pattern |
| Homepage SAA (i87tDx10uM) | Header Nav button "Homepage" | I313:8440;186:1579 | Medium | "Awards Information Navigation Links" - one of three header nav buttons |
| Sun*Kudos Live board (MaZUn5xHXZ) | Header Nav button | I313:8440;186:1587 | Medium | Second header nav link |
| The le UPDATE (b1Filzi9i6) | Header Nav button | I313:8440;186:1593 | Medium | Third header nav link ("Thể lệ") |
| Dropdown-ngon ngu (hUyaaugye2) | Language button (VN flag) | I313:8440;186:1696 | High | Standard language switcher |
| Notification dropdown (D_jgDqvIc8) | Notification bell icon | I313:8440;186:2101 | High | Badge indicator attached |
| Dropdown-profile (z4sCl3_Qtk) | User avatar button | I313:8440;186:1597 | High | Standard avatar menu |
| Sun*Kudos Live board (MaZUn5xHXZ) | "Chi tiết" button in Sun*Kudos promo block | I335:12023;313:8426 | High | Explicit CTA "Chi tiết" next to Kudos promo |
| Homepage SAA (i87tDx10uM) | Footer logo / footer nav link | I354:4323;342:1408 | High | Footer LOGO |
| (anchor scroll) Top Talent section | Left menu C.1_Top talent | 313:8460 | High | In-page scroll, not a screen change |
| (anchor scroll) Top Project section | Left menu C.2_Top project | 313:8461 | High | In-page scroll |
| (anchor scroll) Top Project Leader section | Left menu C.3_Top Project leader | 313:8462 | High | In-page scroll |
| (anchor scroll) Best Manager section | Left menu C.4_Best manager | 313:8463 | High | In-page scroll |
| (anchor scroll) Signature 2025 section | Left menu C.5_Signature 2025 | 313:8464 | High | In-page scroll |
| (anchor scroll) MVP section | Left menu C.6_MVP | 313:8465 | High | In-page scroll |

### Navigation Rules
- **Back behavior**: Returns to previous screen (Homepage SAA in typical flow)
- **Deep link support**: Yes - `/awards` (with optional `#top-talent`, `#mvp`, etc. for category anchors)
- **Auth required**: Yes (behind Supabase session)

---

## Component Schema

### Layout Structure

```
┌─────────────────────────────────────────────────────────────┐
│  HEADER                                                      │
│  [Logo]  [Homepage][Hệ thống giải][Thể lệ]  [Lang][🔔][👤] │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  KEYVISUAL (Hero Banner)                                     │
│  "ROOT FURTHER - Sun* Annual Award 2025"                     │
│  [Background artwork 1200x871]                               │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  TITLE BLOCK                                                 │
│  "Sun* annual awards 2025" (small, muted)                    │
│  "Hệ thống giải thưởng SAA 2025" (large, yellow)            │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────┬─────────────────────────────────────┐   │
│  │ MENU (sticky)  │  AWARDS LIST (scroll-linked)        │   │
│  │                │                                      │   │
│  │ ● Top Talent   │  ┌───────┬──────────────────────┐   │   │
│  │   Top Project  │  │ Image │ Title: Top Talent    │   │   │
│  │   Top Project  │  │       │ Description...       │   │   │
│  │     Leader     │  │       │ Quantity: 10 CN      │   │   │
│  │   Best Manager │  │       │ Value: 7.000.000 VNĐ │   │   │
│  │   Signature    │  └───────┴──────────────────────┘   │   │
│  │     2025       │  ┌──────────────────────┬───────┐   │   │
│  │   MVP          │  │ Title: Top Project   │ Image │   │   │
│  │                │  │ Description...       │       │   │   │
│  │                │  │ Quantity: ...        │       │   │   │
│  │                │  │ Value: ...           │       │   │   │
│  │                │  └──────────────────────┴───────┘   │   │
│  │                │   ... (cards alternate L/R) ...     │   │
│  └────────────────┴─────────────────────────────────────┘   │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  SUN* KUDOS PROMO BLOCK                                      │
│  "Phong trào ghi nhận - Sun* Kudos"                          │
│  [Description]                    [KUDOS graphic]            │
│                                   [Chi tiết →]               │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│  FOOTER                                                      │
│  [Logo]  [Homepage][Hệ thống giải][Thể lệ][Sun*Kudos]       │
│  "Bản quyền thuộc về Sun* © 2025"                            │
└─────────────────────────────────────────────────────────────┘
```

### Component Hierarchy

```
Screen: Hệ thống giải (313:8436)
├── Cover (313:8439, Atom - background rectangle)
├── Header (313:8440, Organism - shared instance)
│   ├── Logo (Atom)
│   ├── NavLinks x3 (Molecule) -> Homepage, Hệ thống giải, Thể lệ
│   ├── Language (Molecule)
│   │   └── VN flag + Dropdown chevron
│   ├── Notification (Molecule) [Badge dot]
│   └── UserProfile button (Atom)
├── Keyvisual (313:8437, Organism - hero banner)
│   └── image 20 (Atom)
├── Bìa / Body (313:8449, Organism)
│   ├── KV Root Further Logo (Atom)
│   ├── A_Title block (Molecule)
│   │   ├── "Sun* Annual Awards 2025" (Atom)
│   │   └── "Hệ thống giải thưởng SAA 2025" (Atom)
│   └── B_Hệ thống giải thưởng (Organism)
│       ├── C_Menu list (Molecule - sticky nav)
│       │   ├── C.1 Top talent (Atom)
│       │   ├── C.2 Top project (Atom)
│       │   ├── C.3 Top Project leader (Atom)
│       │   ├── C.4 Best manager (Atom)
│       │   ├── C.5 Signature 2025 (Atom)
│       │   └── C.6 MVP (Atom)
│       └── D_Danh sách giải thưởng (Organism - card list)
│           ├── D.1 Top Talent card (Molecule)
│           ├── D.2 Top Project card (Molecule)
│           ├── D.3 Top Project Leader card (Molecule)
│           ├── D.4 Best Manager card (Molecule)
│           ├── D.5 Signature 2025 card (Molecule)
│           └── D.6 MVP card (Molecule)
├── D1_Sunkudos promo (335:12023, Organism)
│   ├── Content (Molecule) - "Phong trào ghi nhận / Sun* Kudos / description"
│   ├── Button-IC "Chi tiết" (Atom - CTA)
│   └── KUDOS graphic group (Atom)
└── Footer (354:4323, Organism - shared instance)
    ├── LOGO (Atom)
    ├── Footer NavLinks x4 (Molecule)
    └── Copyright text (Atom)
```

### Main Components

| Component | Type | Node ID | Description | Reusable |
|-----------|------|---------|-------------|----------|
| Header | Organism | 313:8440 | Global app header with nav, language, notification, avatar | Yes (shared instance) |
| Keyvisual | Organism | 313:8437 | "ROOT FURTHER" hero banner artwork | No (page-specific) |
| A_Title | Molecule | 313:8453 | Page title "Hệ thống giải thưởng SAA 2025" | No |
| C_Menu list | Molecule | 313:8459 | Sticky left navigation listing 6 award categories | No |
| D_Awards list | Organism | 313:8466 | Right column card list of award details | No |
| Award Card (Picture + Content) | Molecule | 313:8467 (D.1 template) | Reusable award info card: image + title + description + quantity + value | Yes (6 instances) |
| Sun*Kudos Promo | Organism | 335:12023 | CTA block promoting Sun*Kudos page | Yes (used on homepage too) |
| Footer | Organism | 354:4323 | Global footer | Yes (shared instance) |

---

## Form Fields (If Applicable)

N/A - This screen is read-only (no form inputs, no submissions).

---

## API Mapping

### On Screen Load

| API | Method | Purpose | Response Usage |
|-----|--------|---------|----------------|
| /awards | GET | Load list of award categories with title, description, quantity, prize value, image | Render the 6 award cards in D_Danh sách giải thưởng |
| /awards/:id | GET | Load detail for a specific award (optional - may be pre-embedded in /awards) | Fallback for per-card detail if data is paginated |
| /users/me | GET | Current user info for header avatar, language preference | Header UserProfile button, Language default |
| /notifications?unread_count=true | GET | Unread notification badge count | Header notification badge dot |

### On User Action

| Action | API | Method | Request Body | Response |
|--------|-----|--------|--------------|----------|
| Click left menu item (Top Talent, etc.) | - | - | Navigation only (smooth scroll to anchor) | - |
| Click "Chi tiết" on Sun*Kudos promo | - | - | Client-side route to /kudos | - |
| Click header nav "Homepage" | - | - | Client-side route to / | - |
| Click header nav "Thể lệ" | - | - | Client-side route to /rules | - |
| Click language switcher | /i18n/switch (or client-side) | PUT | `{locale: "vi"\|"en"\|"jp"}` | Updated translations |
| Click notification bell | /notifications | GET | - | Populate notification dropdown |
| Click user avatar | - | - | Opens profile dropdown | - |
| Click logo / footer logo | - | - | Client-side route to / | - |

### Error Handling

| Error Code | Message | UI Action |
|------------|---------|-----------|
| 401 | Session expired | Redirect to Login |
| 403 | Forbidden | Show Error 403 page |
| 500 | Cannot load awards | Show retry button and error message in place of awards list |
| Network | Offline | Show cached awards if available, otherwise error state |

---

## State Management

### Local State

| State | Type | Initial | Purpose |
|-------|------|---------|---------|
| activeCategory | string | "top-talent" | Currently highlighted left-menu item (driven by scroll position) |
| awards | Award[] | [] | Loaded award category data |
| isLoading | boolean | true | Initial data loading state |
| error | string \| null | null | Error message if API fails |

### Global State (If Applicable)

| State | Store | Read/Write | Purpose |
|-------|-------|------------|---------|
| user | authStore | Read | Header avatar, auth guard |
| locale | i18nStore | Read/Write | Multi-language (VN/EN/JP) |
| unreadNotifications | notifStore | Read | Header badge count |

---

## UI States

### Loading State
- Skeleton cards for the 6 award entries (shimmer effect)
- Left menu skeleton with 6 rows
- Keyvisual and title render immediately (static assets)

### Error State
- Replace awards list with centered error message + "Thử lại" retry button
- Header and footer continue to render normally

### Success State
- All 6 award cards rendered with alternating left/right image placement
- Left menu active state follows scroll position (IntersectionObserver)
- Smooth-scroll on menu click

### Empty State
- N/A - awards list is server-configured and should always have entries. If `/awards` returns empty, show "Chưa có hạng mục giải thưởng nào" fallback.

---

## Accessibility

| Requirement | Implementation |
|-------------|----------------|
| Focus management | Tab order: Header -> Menu items -> Cards -> Sun*Kudos CTA -> Footer |
| Keyboard navigation | Enter/Space on menu items triggers scroll; arrow keys navigate menu |
| Screen reader | `aria-label` on each menu item ("Đi đến mục Top Talent"); card titles as headings (h2/h3) |
| Color contrast | Yellow title on dark background must meet WCAG AA (verify #FFD700 vs dark bg) |
| Active state | `aria-current="true"` on active menu item |

---

## Responsive Behavior

| Breakpoint | Layout Changes |
|------------|----------------|
| Mobile (<768px) | Left menu collapses to horizontal scrolling tabs; cards stack full width; keyvisual scales down |
| Tablet (768-1024px) | Left menu narrows; cards keep 2-column image/content but smaller |
| Desktop (>1024px) | Full sticky left menu + wide content area as designed (Figma reference) |

---

## Analytics Events (Optional)

| Event | Trigger | Properties |
|-------|---------|------------|
| screen_view | On mount | `{screen: "awards_system"}` |
| awards_category_click | Left menu click | `{category: "top_talent" \| ...}` |
| awards_kudos_cta_click | Sun*Kudos "Chi tiết" click | `{source: "awards_page"}` |
| awards_scroll_depth | Scroll | `{section: "mvp"}` for final section |

---

## Design Tokens

| Token | Value | Usage |
|-------|-------|-------|
| --color-accent-yellow | (from Figma) | Title "Hệ thống giải thưởng" + active menu indicator |
| --color-background-dark | (from Figma) | Page background |
| --color-card-surface | (from Figma) | Award card background |
| --award-card-image-size | 336x336px | Square image in each award card |
| --keyvisual-size | 1200x871px | Hero banner image |

---

## Implementation Notes

### Dependencies
- Routing: Next.js App Router (likely route `/awards` or `/he-thong-giai`)
- i18n: next-intl or similar (for VN/EN/JP)
- Scroll linking: IntersectionObserver for active menu highlight
- Data fetching: Supabase client SDK (`from('awards').select(...)`)

### Special Considerations
- The six award cards alternate image placement (image-left for odd, image-right for even) per Figma node structure (`Frame 506` vs `Frame 507`). Implementation should support both orientations.
- Signature 2025 card (D.5) has TWO prize values (5M for individual, 8M for group) separated by "Hoặc". Data model must support multi-tier prize info.
- Header and Footer are Figma component instances - reuse shared React components across all authenticated pages.
- Sun*Kudos promo block at bottom is reused from Homepage - extract as shared component.
- The entire page is informational/read-only; no mutations are performed here.

---

## Analysis Metadata

| Property | Value |
|----------|-------|
| Analyzed By | Screen Flow Discovery (momorph.screenflow) |
| Analysis Date | 2026-04-17 |
| Needs Deep Analysis | No (Figma already includes rich `specs` metadata on most nodes) |
| Confidence Score | High |

### Next Steps
- [ ] Confirm final API contract for `/awards` (single-call vs per-category)
- [ ] Extract design tokens via `list_frame_styles` when implementing UI
- [ ] Extract detailed design items via `list_frame_design_items` for pixel-perfect build
- [ ] Confirm Signature 2025 dual-prize data modeling with BE team
- [ ] Verify left-menu sticky behavior and scroll-linking on mobile breakpoints
