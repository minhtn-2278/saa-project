# Feature Specification: Hệ thống giải (Awards System)

**Frame ID**: `313:8436`
**Screen ID**: `zFYDgyj_pD`
**Frame Name**: `Hệ thống giải`
**File Key**: `9ypp4enmFmdK3YAFJLIu6C`
**Created**: 2026-04-17
**Last Updated**: 2026-04-17
**Status**: Reviewed — ready for planning

---

## Overview

The **Hệ thống giải (Awards System)** page is the Sun\* Annual Awards 2025 (SAA 2025) dedicated landing page that presents the **full catalogue of award categories** to all Sun\* employees. It is a long-scroll single-page layout (desktop base 1440 × 6410 px) organised as:

1. A **hero keyvisual** banner.
2. A **title block** identifying the awards system.
3. A **two-column "Awards" section**: a sticky left **navigation menu** (6 items) paired with a right column listing **6 award category cards** (Top Talent, Top Project, Top Project Leader, Best Manager, Signature 2025 – Creator, MVP). Each card shows a branded thumbnail, title, description, quantity and monetary prize value. Cards have alternating image-left / image-right layouts.
4. A **Sun\* Kudos promo block** linking to the peer-recognition feature.
5. The shared **Header** and **Footer** navigation.

**Target Users**: Authenticated Sun\* employees.

**Business Context**: This page is the single source of truth for what awards exist, who is eligible, and what the prizes are. It powers transparency of the SAA 2025 program, drives discovery before rules/timeline pages, and cross-promotes the Sun\* Kudos recognition movement.

**Locales supported**: Vietnamese (`vi`), English (`en`), Japanese (`ja`) — all three already exist in `messages/` and are wired via `next-intl` with cookie-based locale (`NEXT_LOCALE`); no `[locale]` URL segment.

**Data strategy**: ALL award content (titles, descriptions, quantities, prize values, imagery paths) and the Kudos promo copy are **static** — authored in locale JSON files and a TypeScript constants file. No Supabase read, no admin CRUD, no runtime fetch. Content changes ship via PR + deploy.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View Award Catalogue (Priority: P1)

**As a** Sun\* employee,
**I want to** see all six SAA 2025 award categories with descriptions, quantities, and prize values on a single page,
**So that** I understand what awards exist, who they are for, and what I can aspire to.

**Why this priority**: This is the primary reason for the page to exist. Without the award list rendering correctly, the page delivers no value.

**Independent Test**: Navigate to `/awards`, verify the localized page title renders (VN: "Hệ thống giải thưởng SAA 2025"; EN: "SAA 2025 Awards System"; JA: per `messages/ja.json`) and all 6 award cards are visible with title, description, quantity, and prize value.

**Acceptance Scenarios** (default VN locale shown; EN / JA render the corresponding localized strings):

1. **Given** the user is authenticated, **When** they land on `/awards`, **Then** the page renders the keyvisual, title "Hệ thống giải thưởng SAA 2025" (VN), and exactly 6 award cards in order: Top Talent → Top Project → Top Project Leader → Best Manager → Signature 2025 – Creator → MVP. (Award proper nouns stay in Latin across all locales — see FR-015a.)
2. **Given** the awards list is visible, **When** the user reads a card, **Then** each card displays: an image (336 × 336 with gold border), a category title, a description paragraph, a "Số lượng giải thưởng" (or localized equivalent) row, and a "Giá trị giải thưởng" (or localized equivalent) row.
3. **Given** the MVP card under VN locale, **When** the user reads it, **Then** the quantity is "01" and the value is "15.000.000 VNĐ".
4. **Given** the Top Talent card under VN locale, **When** the user reads it, **Then** the quantity is "10 Đơn vị" and the value is "7.000.000 VNĐ cho mỗi giải thưởng".
5. **Given** the Signature 2025 – Creator card (any locale), **When** the user reads it, **Then** it shows BOTH tiers — individual prize (`5.000.000 VNĐ` VN / `5,000,000 VND` EN & JA) and group prize (`8.000.000 VNĐ` VN / `8,000,000 VND` EN & JA) — separated by a 1 px `#2E3940` divider.
6. **Given** the EN locale is active, **When** the user reads the Top Talent card, **Then** the quantity is "10 Unit(s)" and the value is "7,000,000 VND per award".
7. **Given** the JA locale is active, **When** the user reads any award card, **Then** the award *name* remains in Latin (e.g. "Top Talent"); the description, unit, and label strings render in Japanese; the monetary value renders as "7,000,000 VND" (comma separator, Latin script).

---

### User Story 2 - Jump to a Specific Award via the Sticky Menu (Priority: P1)

**As a** Sun\* employee,
**I want to** click a category name in the left menu and be taken directly to that award's card,
**So that** I can quickly find information about the award I'm interested in without scrolling the whole page.

**Why this priority**: The page is very long (6,410 px tall). Without in-page navigation, users will miss categories or give up.

**Independent Test**: Click each of the 6 menu items and verify smooth scroll lands on the matching award card, and that the menu item becomes visually active.

**Acceptance Scenarios**:

1. **Given** the user is on the awards page, **When** they click "MVP" in the menu, **Then** the page smoothly scrolls to the MVP card and the URL hash updates to `#mvp` (or similar slug).
2. **Given** the menu is visible, **When** the user scrolls through the page, **Then** the active menu item automatically updates to match the award card currently in the viewport (scroll-spy).
3. **Given** the active item, **When** it is rendered, **Then** it shows the active style — gold text color (`#FFEA9E`) + `underline underline-offset-8` (same convention as `<NavLinks>`); inactive items use white text.
4. **Given** a menu item has focus, **When** the user presses Enter or Space, **Then** the same smooth-scroll behavior triggers.
5. **Given** `prefers-reduced-motion: reduce` is set, **When** a menu item is clicked, **Then** the page jumps instantly (no animation) to the target card.
6. **Given** the user opens `/awards#top-talent` directly, **When** the page loads, **Then** the page auto-scrolls to the Top Talent card and that menu item is active.

---

### User Story 3 - Discover & Navigate to Sun\* Kudos (Priority: P2)

**As a** Sun\* employee,
**I want to** see the Sun\* Kudos promo block on the awards page and click "Chi tiết" to navigate to the full Sun\* Kudos experience,
**So that** I can participate in peer recognition tied to the awards program.

**Why this priority**: Kudos is a related but standalone feature. The promo drives engagement but the page is still useful without clicking through.

**Acceptance Scenarios**:

1. **Given** the user scrolls past the last award card, **When** the Sun\* Kudos block enters the viewport, **Then** it renders with dark background (#0F0F0F), the eyebrow "Phong trào ghi nhận", the title "Sun\* Kudos", the description, the decorative "KUDOS" logotype, and a "Chi tiết" button.
2. **Given** the Sun\* Kudos promo block is visible, **When** the user clicks "Chi tiết" (or the localized equivalent "Learn more" / "詳細"), **Then** they are navigated to `/kudos` (Sun\* Kudos live board).
3. **Given** the "Chi tiết" button has focus, **When** rendered, **Then** it shows a visible 2px gold outline focus ring.

---

### User Story 4 - Responsive Browsing on Mobile / Tablet (Priority: P2)

**As a** Sun\* employee on a phone or tablet,
**I want to** browse the awards system page with all content readable and the menu still usable,
**So that** I can access award information anywhere without a desktop.

**Why this priority**: Sun\* employees work on multiple devices; employees reading during the commute or at events need a mobile-friendly experience.

**Acceptance Scenarios**:

1. **Given** viewport width < 768 px (`< md`), **When** the page loads, **Then** cards stack to a single column with the image above the content; the left `<AwardsMenu>` collapses to a **horizontal scrolling tab bar pinned directly under the `<AppHeader>`** (`sticky top-16`, bg `#00101A`, overflow-x: auto, scroll-snap on items); the hero title reduces to ≤ 32 px font-size.
2. **Given** viewport width is tablet (768–1023 px), **When** the page loads, **Then** the two-column menu + cards layout remains, card images become 240 × 240, and container padding reduces to 48 px × 32 px.
3. **Given** any viewport, **When** content is rendered, **Then** all text passes WCAG AA contrast (≥ 4.5 : 1) on the dark background.
4. **Given** mobile layout, **When** the user taps a menu tab, **Then** it still smooth-scrolls to the correct card and updates the active state.

---

### User Story 5 - Global Header & Footer Navigation (Priority: P2)

**As a** Sun\* employee,
**I want to** use the same `<AppHeader>` and `<AppFooter>` as the rest of SAA 2025 from this page,
**So that** I can leave the page for any other destination (Homepage, Rules, Kudos live, Logout, Language switch, Notifications, Profile) without going back.

> Implementation note: `<AppHeader>` lives at [components/shared/AppHeader.tsx](components/shared/AppHeader.tsx) and `<AppFooter>` at [components/shared/AppFooter.tsx](components/shared/AppFooter.tsx). `<NavLinks>` already knows the `/awards` route and will light up its own active state via `usePathname()` — no special work required on this page.

**Acceptance Scenarios**:

1. **Given** the user is on `/awards`, **When** they look at the header, **Then** the "Awards Information" (`nav.awardsInfo`) link in `<AppHeader>` → `<NavLinks>` renders with `aria-current="page"`, gold text `#FFEA9E`, and an underline (per the project's existing `NavLinks` active style).
2. **Given** the user clicks the logo in the `<AppHeader>`, **When** activated, **Then** they are navigated to the homepage `/`.
3. **Given** the user clicks the notification bell, **When** there are unread notifications, **Then** a dropdown appears showing them; when zero, the empty-state view appears. (Handled inside the shared `<NotificationBell>` component.)
4. **Given** the user opens the language selector, **When** they switch between VN, EN, and JA, **Then** the `NEXT_LOCALE` cookie updates and the page re-renders in the selected locale (no URL segment change).
5. **Given** the user clicks the avatar, **When** activated, **Then** the `<UserAvatar>` dropdown appears with "Profile" (`nav.profile`) and "Logout" (`nav.signOut`) options.

---

### Edge Cases

- **Initial loading state**: Because award content is static and rendered server-side, there is **no data-fetch loading state**. The page is fully painted on first render; no skeleton is required.
- **No runtime data errors**: Static content cannot fail to load. A build-time type error would fail the build (per TR-008). There is no runtime retry UI.
- **Long descriptions**: If any award description exceeds the visual card height, the card MUST grow vertically (no truncation); dividers and metadata remain correctly positioned. Do not cap the description height.
- **Missing translation key**: If a translation key is missing for the active locale (`vi` / `en` / `ja`), `next-intl` emits a warning in dev; in production the fallback behaviour is the key name. Tests MUST catch missing keys before merge (parity check across all three locale files).
- **Image load failure**: If an award image asset 404s, render the gold-bordered placeholder frame (336 × 336, `#00101A` bg, `1 px solid #FFEA9E`) with the award name overlaid in gold; never show a broken-image glyph. Use `next/image`'s `onError` handler for this fallback.
- **Locale change mid-scroll**: Switching VN / EN / JA while the user is scrolled deep into the page MUST preserve the current scroll position and the active menu item. Locale swap is cookie-based; the page re-renders server-side but the browser's scroll position is retained by Next.js router behaviour.
- **Direct deep-link hash that doesn't exist** (e.g., `/awards#unknown`): Page MUST load at the top (scroll position 0) without throwing, and no menu item is active until the user scrolls.
- **Hash links collide with scroll-spy**: When the user clicks a menu item, the hash update MUST NOT re-trigger a second smooth-scroll from the browser's native hash-change handler (debounce / call `preventDefault`).
- **Reduced motion**: All smooth scroll, card hover zoom, and fade-in animations MUST be disabled when `prefers-reduced-motion: reduce` is set; menu clicks fall back to `scrollIntoView({ behavior: 'auto' })` and hash is updated immediately.
- **Very narrow viewport (< 360 px)**: Layout must not horizontally overflow; card images fall back to 100% width with `aspect-ratio: 1/1`.
- **Mobile touch targets**: Every tappable element (menu items, "Chi tiết", header controls, footer links) MUST have a minimum 44×44 px hit area on viewports `< md` (per constitution §V).
- **Keyboard-only user**: Tab order MUST be Logo → Nav links → Language → Bell → Avatar → Menu items (1–6) → Card 1..Card N content → "Chi tiết" → Footer links. Focus must always be visible.
- **Slow network**: Award images MUST use `loading="lazy"` (except the first-card image which may be eager to improve FCP of the Awards section). Show a low-opacity placeholder (`#101417`) while the image is loading.
- **Content updates**: Since data is static, content changes ship via PR + redeploy. Users with an open tab keep seeing the older bundle until they navigate or hard-refresh — this is acceptable for a read-only reference page. No live re-subscribe / SSR revalidation is required.

---

## UI/UX Requirements *(from Figma)*

Visual specifications (colors, typography, spacing, component sizing, responsive behavior, animations, node IDs) are documented in [design-style.md](./design-style.md). This section describes the components and interactions.

### Screen Components

| Component | Node ID | Description | Interactions |
|-----------|---------|-------------|--------------|
| `<AppHeader />` (shared) | 313:8440 | Sticky top header — renders `<NavLinks>` + `<NotificationBell>` + `<LanguageSelector>` + `<UserAvatar>` | Click logo → `/`; nav link `/awards` auto-activates; bell → notification dropdown; language → cycles VN / EN / JA via `NEXT_LOCALE` cookie; avatar → profile dropdown |
| Keyvisual | 313:8437 | Decorative hero banner image (SAA 2025 artwork) | None (decorative) |
| Title Block | 313:8453 | Localized eyebrow (`awardsPage.eyebrow`) + divider + localized main title (`awardsPage.title`) | None (static) |
| `<AwardsMenu>` | 313:8459 | **Desktop (`≥ md`)**: sticky left column of 6 category links. **Mobile (`< md`)**: horizontal scroll-snap tab bar pinned under `<AppHeader>`. | Click / Enter / Space → smooth scroll + hash update; hover → highlight; scroll-spy updates `aria-current` |
| Menu Item C.1 Top Talent | 313:8460 | Menu entry | Click → scroll to D.1; becomes active |
| Menu Item C.2 Top Project | 313:8461 | Menu entry | Click → scroll to D.2 |
| Menu Item C.3 Top Project Leader | 313:8462 | Menu entry | Click → scroll to D.3 |
| Menu Item C.4 Best Manager | 313:8463 | Menu entry | Click → scroll to D.4 |
| Menu Item C.5 Signature 2025 | 313:8464 | Menu entry | Click → scroll to D.5 |
| Menu Item C.6 MVP | 313:8465 | Menu entry | Click → scroll to D.6 |
| Award Card D.1 Top Talent | 313:8467 | Image-**left**; title "Top Talent"; description; metadata row "Số lượng giải thưởng: 10 Đơn vị" (icon + label + quantity + unit); metadata row "Giá trị giải thưởng: 7.000.000 VNĐ cho mỗi giải thưởng" | None (read-only) |
| Award Card D.2 Top Project | 313:8468 | Image-**right** (mirrored); quantity `02 Tập thể`; value `15.000.000 VNĐ` per award | Read-only |
| Award Card D.3 Top Project Leader | 313:8469 | Image-**left**; quantity `03 Cá nhân`; value `7.000.000 VNĐ` | Read-only |
| Award Card D.4 Best Manager | 313:8470 | Image-**right**; quantity `01 Cá nhân`; value `10.000.000 VNĐ` | Read-only |
| Award Card D.5 Signature 2025 | 313:8471 | Image-**left**; dual-tier prize — individual `5.000.000 VNĐ` AND group `8.000.000 VNĐ`; 1 px #2E3940 divider between tiers | Read-only |
| Award Card D.6 MVP | 313:8510 | Image-**right**; quantity `01 Cá nhân`; value `15.000.000 VNĐ` | Read-only |
| Sun\* Kudos Promo | 335:12023 | Dark block with eyebrow, title, description, decorative KUDOS logotype, "Chi tiết" CTA | Click "Chi tiết" → navigate to Sun\* Kudos page |
| Chi tiết Button | I335:12023;313:8426 | Text link + arrow icon | Click → navigation; hover → underline + icon slide |
| `<AppFooter />` (shared) | 354:4323 | Logo, 4 nav links (`/`, `/awards`, `/kudos`, `/rules`), copyright | Click nav link → route navigation |

### Navigation Flow

- **From**: Homepage SAA (`<NavLinks>` → "Awards Information"), `<AppFooter>` "Awards Information" link, direct URL / deep link, or the same `<NavLinks>` / `<AppFooter>` from any other authenticated page.
- **To**:
  - Homepage (`/`) via `<AppHeader>` logo, `<NavLinks>` "About SAA 2025", or `<AppFooter>` "About SAA 2025".
  - Rules page (`/rules`) via `<AppFooter>` "Rules" link.
  - Sun\* Kudos live (`/kudos`) via "Chi tiết" button in the Kudos promo block, `<NavLinks>` "Sun\* Kudos", or `<AppFooter>` "Sun\* Kudos".
  - Same page re-rendered in a different locale via `<LanguageSelector>` (cycles `vi` / `en` / `ja` via `NEXT_LOCALE` cookie).
  - Profile page (`/profile` — owned by `<UserAvatar>` dropdown) / Login (logout flow).
- **In-page anchors**: `#top-talent`, `#top-project`, `#top-project-leader`, `#best-manager`, `#signature-2025`, `#mvp` (via menu clicks). Hash is updated with `history.replaceState` — no history entry stack pollution.

### Visual Requirements

- **Responsive breakpoints** (Tailwind 4 defaults per constitution §V): `sm: 640px`, `md: 768px`, `lg: 1024px`, `xl: 1280px`. Figma 1440 px is the `xl`-and-above reference. See design-style.md §Responsive Specifications for per-component behaviour.
- **Animations/Transitions**: Menu item color transitions (150 ms), smooth anchor scroll (400–600 ms), "Chi tiết" button hover. All respect `prefers-reduced-motion`.
- **Accessibility**: WCAG 2.1 AA minimum (AAA for text contrast where possible — gold `#FFEA9E` on `#00101A` is 12.3:1 = AAA). All interactive controls reachable by keyboard. Scroll-spy must not steal focus.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST render a single awards page at the static route `/awards` (confirmed against the existing `AppFooter.FOOTER_LINKS` and `NavLinks.NAV_ITEMS` which already point to `/awards`). File: `app/awards/page.tsx`.
- **FR-002**: The system MUST display exactly six award cards in the order: Top Talent, Top Project, Top Project Leader, Best Manager, Signature 2025 – Creator, MVP.
- **FR-003**: Each award card MUST display title, description, quantity (with unit label: Đơn vị / Cá nhân / Tập thể in VN; Unit(s) / Individual(s) / Team(s) in EN; Japanese equivalents in JA), and monetary prize value.
- **FR-004**: Quantity numbers MUST be zero-padded to 2 digits when the value is a single digit (e.g., `01`, `02`, `03`, `10`). Values of 2 or more digits are rendered as-is. Zero-padding is applied uniformly across all three locales.
- **FR-005**: Monetary values MUST be formatted per active locale:
  - VN (`vi`): `7.000.000 VNĐ` (period thousand-separator, "VNĐ" suffix with đ).
  - EN (`en`): `7,000,000 VND` (comma separator, "VND" without diacritic).
  - JA (`ja`): `7,000,000 VND` (comma separator, "VND" suffix — VND is rendered in Latin script in JA copy).
  Use `Intl.NumberFormat(locale, { style: 'decimal' })` to produce the number part, then append the currency suffix.
- **FR-006**: The Signature 2025 – Creator card MUST display two prize tiers (individual and group) with their distinct values and unit labels separated by a 1 px `#2E3940` divider.
- **FR-007**: Card layout MUST alternate: D.1 / D.3 / D.5 render image-left; D.2 / D.4 / D.6 render image-right. A single `<AwardCard layout="image-left|image-right">` component MUST implement both layouts (no duplicate components).
- **FR-008**: The `<AwardsMenu>` MUST adapt responsively:
  - **Desktop & tablet (`≥ md`, i.e. ≥ 768 px)**: sticky vertical column on the left with `top: 104 px` (header height + 24 px breathing room), width `w-fit` (max ~178 px).
  - **Mobile (`< md`)**: horizontal scrolling tab bar pinned under `<AppHeader>` (`sticky top-16`, `z-40`, `bg-[#00101A]`, `border-b border-[#2E3940]`). Items flex in a single row with `overflow-x: auto`, `scroll-snap-type: x mandatory`, and `-webkit-overflow-scrolling: touch`. The active tab auto-scrolls into view when scroll-spy updates (`element.scrollIntoView({ inline: 'center', block: 'nearest', behavior: motionOk ? 'smooth' : 'auto' })`).
  - Both layouts share the same 6 items, same click-to-scroll behaviour, same scroll-spy, same active style.
- **FR-009**: The menu MUST implement scroll-spy using `IntersectionObserver` with `rootMargin: "-104px 0px -50% 0px"`; the active item updates automatically as each card crosses into the upper half of the viewport.
- **FR-010**: The active menu item MUST be visually distinguishable with gold text (`#FFEA9E`) AND an 8 px-offset underline, matching the established `NavLinks` active style in [components/shared/NavLinks.tsx:34-38](components/shared/NavLinks.tsx#L34-L38) (`underline underline-offset-8`). Inactive items remain white.
- **FR-011**: The URL hash MUST update to the active section slug when the user clicks a menu item (via `history.replaceState`, no page reload); opening the page with a valid hash MUST auto-scroll to that card on mount.
- **FR-012**: The Sun\* Kudos promo block's "Chi tiết" / "Learn more" / "詳細" button MUST navigate to `/kudos` (Sun\* Kudos live-board) when clicked or activated via keyboard. Use `next/link` with `href="/kudos"`.
- **FR-013**: Award descriptions MUST be displayed in full (no truncation on desktop or mobile); cards grow vertically to fit content.
- **FR-014**: The page MUST render the shared `<AppHeader />` from [components/shared/AppHeader.tsx](components/shared/AppHeader.tsx) and `<AppFooter />` from [components/shared/AppFooter.tsx](components/shared/AppFooter.tsx). The page MUST NOT re-implement header/footer UI. `<NavLinks>` auto-activates the `/awards` entry via `usePathname()` — no custom active-state code is needed at the page level.
- **FR-015**: All text content MUST be localizable via `next-intl` for **three locales: `vi`, `en`, `ja`** — all three files MUST ship with identical key sets. Default locale is `vi` (per `DEFAULT_LOCALE` in `lib/utils/constants`). Currency formatting per FR-005 MUST follow the active locale.
- **FR-015a (Latin brand names policy)**: Award proper nouns — "Top Talent", "Top Project", "Top Project Leader", "Best Manager", "Signature 2025 – Creator", "MVP", "Sun\* Kudos" — MUST remain in Latin/English across **all three locales** (including `ja`). Only **descriptions**, **unit labels** (Đơn vị / Unit(s) / 単位 etc.), and **UI labels** (Số lượng giải thưởng, Giá trị giải thưởng, Chi tiết, etc.) are translated. The `awardsPage.<slug>.name` keys therefore hold the same Latin string in `vi.json`, `en.json`, and `ja.json`; the `awardsPage.<slug>.description` keys differ per locale.
- **FR-016**: The page MUST be gated by middleware: unauthenticated users are redirected to `/login`.
- **FR-017**: All interactive elements (menu items, "Chi tiết", header & footer controls) MUST have a visible focus ring: `2px solid #FFEA9E` with `outline-offset: 2px`.
- **FR-018**: The page MUST respect the user's `prefers-reduced-motion` preference and disable smooth-scroll and all non-essential transitions.
- **FR-019**: On mobile viewports (`< md`, i.e. < 768 px per Tailwind defaults), every tappable element MUST have a minimum 44 × 44 px hit area.

### Technical Requirements

- **TR-001 (Performance, per constitution §V Core Web Vitals)**: LCP < 2.5 s, FID < 100 ms, CLS < 0.1. The keyvisual image MUST be served via `next/image` with `priority` and a `sizes="100vw"` prop. Award thumbnails use `loading="lazy"` except D.1's image (eager, to reduce Awards-section CLS).
- **TR-002 (Security, per constitution §IV)**: Route is gated by Next.js middleware. Session tokens stored in HTTP-only cookies (Supabase Auth default). No `dangerouslySetInnerHTML`; all text escaped. `Content-Security-Policy`, `X-Frame-Options`, `X-Content-Type-Options`, `Strict-Transport-Security` MUST be set in `next.config.ts`. No PII rendered.
- **TR-003 (Tech stack, per constitution §II)**: Next.js 16 App Router, React 19, TailwindCSS 4, TypeScript 5 (`strict: true`, no `any`). Server Component by default. Client Components (`"use client"`) ONLY for: `<AwardsMenu>` (scroll-spy + click handlers), header interactive controls (dropdowns), and the "Chi tiết" button if it requires client navigation. Use `next/link` for all internal links, `next/image` for all images. Tailwind utility classes only — NO inline styles, NO CSS-in-JS. `zod` validation at every data boundary.
- **TR-004 (Accessibility, per constitution §V)**: Meets WCAG 2.1 AA (text contrast passes AAA). All icons wrapped in `<Icon name="..." />` component; decorative icons marked `aria-hidden="true"`. Menu uses `<nav aria-label="Danh mục giải thưởng">` (localized) containing `<ol>` with `<a href="#{slug}">` children. Each award card uses semantic headings (`<h2>` for card title; metadata rendered with `<dl>/<dt>/<dd>`). `aria-current="true"` on active menu link. Keyboard nav fully functional. Touch targets ≥ 44×44 px on mobile.
- **TR-005 (Responsiveness, per constitution §V)**: Mobile-first. Use Tailwind breakpoints `sm: 640px`, `md: 768px`, `lg: 1024px`, `xl: 1280px`. Figma 1440 px is the `xl` reference. Below `lg`, no fixed pixel layouts — everything uses fluid widths.
- **TR-006 (Data layer — STATIC)**: Award content is **static** and ships with the code. No Supabase read, no API route, no caching strategy required.
  - Translatable strings (names, descriptions, unit labels, tier labels, Kudos copy) live in `messages/vi.json`, `messages/en.json`, and `messages/ja.json` under a new `awardsPage` namespace.
  - Non-translatable structured data (slug, `display_order`, `layout`, `image_url`, `prize_tiers` numeric values) lives in a constants module — e.g. `lib/awards/data.ts` — exporting a typed, readonly `AWARDS` array.
  - `zod` still validates the constants module at module load in dev (to catch authoring typos), but there is no runtime network dependency.
  - Content changes require a PR + deploy. No admin UI needed.
- **TR-007 (SEO / metadata)**: `generateMetadata()` sets:
  - `<title>`: "Hệ thống giải thưởng SAA 2025 | Sun\*" (VN) / "SAA 2025 Awards System | Sun\*" (EN).
  - `<meta name="description">`: summary of the 6 award categories and total prize pool.
  - Open Graph image: dedicated OG asset (1200 × 630) derived from the keyvisual — NOT the full-page screenshot.
  - Canonical URL per locale.
- **TR-008 (Testing, per constitution §III TDD NON-NEGOTIABLE)**: Unit tests (Vitest) for formatters (`formatVND`, `padQuantity`), the scroll-spy hook, and the menu-click handler. Integration tests for the `zod` validation of the `AWARDS` constants module (fail build on authoring typos). Locale key-parity test (Vitest) across `vi.json` / `en.json` / `ja.json` under `awardsPage.*`. E2E tests (Playwright) for all P1 user stories — US1 (all 6 cards render with correct localized strings) and US2 (menu click + scroll-spy + hash update). Tests MUST be written failing first, then implementation added. No integration test against Supabase or a Route Handler is required for this page because it has neither.
- **TR-009 (Folder structure, per constitution)**:
  - Page: `app/awards/page.tsx` (no `[locale]` segment — locale is cookie-based via `next-intl`).
  - Feature components: `components/awards/` — `AwardsMenu.tsx` (client), `AwardCard.tsx` (server, accepts `layout` prop), `SignatureAwardCard.tsx` (server, two-tier variant), `KudosPromo.tsx` (server).
  - Static data module: `lib/awards/data.ts` — exports the typed `AWARDS` constant.
  - Zod schemas: `lib/validations/awards.ts`.
  - Formatters: `lib/utils/format.ts` — `formatVND(value, locale)`, `padQuantity(n)`.
  - Shared header/footer: reused from `components/shared/AppHeader.tsx`, `components/shared/AppFooter.tsx` — do NOT fork.
- **TR-010 (i18n)**: Three locales — `vi`, `en`, `ja` — all wired via existing `i18n/request.ts`. New translation keys MUST be added under an `awardsPage` namespace in all three `messages/*.json` files simultaneously. Japanese translations are authored by the content team; placeholder with VN values is not acceptable for release.

### State Management

- **Static content**: `AWARDS` array imported from `lib/awards/data.ts`. Translatable fields read via `useTranslations` / `getTranslations` at render time.
- **Client state (`<AwardsMenu>`)**: `activeSlug: string | null` — driven by scroll-spy (IntersectionObserver), consumed by menu items to toggle `aria-current="true"` and gold + underline style.
- **Client state (header)**: `notificationOpen`, `languageOpen`, `profileOpen` — owned by `<AppHeader>` children (`<NotificationBell>`, `<LanguageSelector>`, `<UserAvatar>`), not re-implemented here.
- **No loading, error, or empty states** for awards data — content is compiled into the bundle.
- **No global state introduced** for this page (no Zustand/Context additions).

### Key Entities *(feature involves data — STATIC)*

No database tables. All entities below are TypeScript types declared in `lib/awards/types.ts` and populated in `lib/awards/data.ts`.

```ts
type UnitKey = 'don_vi' | 'ca_nhan' | 'tap_the';

type PrizeTier = {
  quantity: number;           // e.g. 10, 2, 3, 1
  unit: UnitKey;              // translation key under awardsPage.units.*
  valueVnd: number;           // raw integer, e.g. 7_000_000
  tierLabelKey?: string;      // translation key, present only for multi-tier awards
};

type Award = {
  slug: string;                             // 'top-talent' | 'top-project' | ... | 'mvp'
  displayOrder: 1 | 2 | 3 | 4 | 5 | 6;
  layout: 'image-left' | 'image-right';     // D.1/D.3/D.5 = left; D.2/D.4/D.6 = right
  imageUrl: string;                         // '/images/awards/top-talent.png' (2x asset)
  nameKey: string;                          // 'awardsPage.topTalent.name'
  descriptionKey: string;                   // 'awardsPage.topTalent.description'
  prizeTiers: readonly [PrizeTier] | readonly [PrizeTier, PrizeTier];
};

type KudosPromo = {
  eyebrowKey: string;      // 'awardsPage.kudos.eyebrow'
  titleKey: string;        // 'awardsPage.kudos.title'
  descriptionKey: string;  // 'awardsPage.kudos.description'
  ctaLabelKey: string;     // 'awardsPage.kudos.cta'
  ctaTargetHref: '/kudos';
};
```

**Translation keys (required in all three locale files)** — non-exhaustive list:

| Key | VN | EN | JA |
|-----|----|----|----|
| `awardsPage.eyebrow` | "Sun\* Annual Awards 2025" | "Sun\* Annual Awards 2025" | "Sun\* Annual Awards 2025" |
| `awardsPage.title` | "Hệ thống giải thưởng SAA 2025" | "SAA 2025 Awards System" | "SAA 2025 アワードシステム" (suggested) |
| `awardsPage.menuAriaLabel` | "Danh mục giải thưởng" | "Award categories" | "アワードカテゴリー" |
| `awardsPage.quantityLabel` | "Số lượng giải thưởng:" | "Number of awards:" | "受賞数:" |
| `awardsPage.valueLabel` | "Giá trị giải thưởng:" | "Prize value:" | "賞金:" |
| `awardsPage.perAward` | "cho mỗi giải thưởng" | "per award" | "1賞あたり" |
| `awardsPage.units.don_vi` | "Đơn vị" | "Unit(s)" | "単位" |
| `awardsPage.units.ca_nhan` | "Cá nhân" | "Individual(s)" | "個人" |
| `awardsPage.units.tap_the` | "Tập thể" | "Team(s)" | "団体" |
| `awardsPage.topTalent.name` | "Top Talent" | "Top Talent" | "Top Talent" |
| `awardsPage.topTalent.description` | (long VN text) | (long EN text) | (long JA text) |
| `awardsPage.signature.individualLabel` | "Giải cá nhân" | "Individual prize" | "個人賞" |
| `awardsPage.signature.groupLabel` | "Giải tập thể" | "Team prize" | "団体賞" |
| `awardsPage.kudos.eyebrow` | "Phong trào ghi nhận" | "Recognition movement" | (JA translation) |
| `awardsPage.kudos.title` | "Sun\* Kudos" | "Sun\* Kudos" | "Sun\* Kudos" (brand, Latin) |
| `awardsPage.kudos.description` | (VN paragraph) | (EN paragraph) | (JA paragraph) |
| `awardsPage.kudos.cta` | "Chi tiết" | "Learn more" | "詳細" |

**Latin brand-name rule (FR-015a)**: The `.name` key for every award (`topTalent`, `topProject`, `topProjectLeader`, `bestManager`, `signature2025`, `mvp`) and the `awardsPage.kudos.title` key MUST hold the same Latin string across `vi` / `en` / `ja` — only description and label keys differ per locale.

---

## API Dependencies

This page has **no dedicated data APIs** — all award content is static. The only backend interactions happen inside the shared `<AppHeader>` components and are reused from existing pages:

| Dependency | Purpose | Status |
|------------|---------|--------|
| Supabase Auth session (via middleware) | Gate `/awards` to authenticated users; redirect to `/login` otherwise. | Existing |
| `<NotificationBell>` internal fetch | Hydrate header notification count | Existing (shared) |
| `<UserAvatar>` internal fetch | Hydrate header avatar/name | Existing (shared) |
| `<LanguageSelector>` cookie write | Persist locale choice (`NEXT_LOCALE` cookie) | Existing (shared) |
| Static asset CDN (`/images/awards/*.png`, `/images/kudos-bg.png`) | Serve award thumbnails and Kudos promo background | Build output |

No new API routes, no Route Handlers, no Supabase queries are introduced by this page.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Pixel-perfect parity with Figma frame `313:8436` on Desktop (1440 × 6410 px) — spacing, typography, and colors match tokens within ±2 px / exact hex.
- **SC-002**: All 6 award cards render with correct title, description, quantity, and value read from `lib/awards/data.ts` + `messages/*.json`; visual regression tests (Playwright screenshot) pass for desktop, tablet, and mobile breakpoints.
- **SC-003**: Menu click → scroll + hash update works for all 6 items; scroll-spy activates correct item when each card is > 50 % visible.
- **SC-004**: Lighthouse score ≥ 90 for Performance, 100 for Accessibility, 100 for Best Practices on production build.
- **SC-005**: No console errors or warnings in the browser on page load, scroll, or resize.
- **SC-006**: Works under VN, EN, and JA locales with no missing translation keys. A parity-check test (Vitest) compares the key sets of `vi.json`, `en.json`, `ja.json` under `awardsPage.*` and fails the build if any key is missing.
- **SC-007**: `prefers-reduced-motion: reduce` disables smooth-scroll and card hover transitions.

---

## Out of Scope

- Award detail pages (each award's winners, past recipients, photos).
- Voting or nomination flows.
- Admin editor / CMS for award content (content is static; changes via code PR + redeploy).
- Dynamic award data from Supabase or any backend (explicitly out-of-scope per TR-006).
- Sun\* Kudos live board content (this page only shows the promo; the full feature lives elsewhere).
- Authentication flows — handled by existing login page.
- Email/push notifications of award updates.
- Analytics / event tracking — not required in v1 (resolved clarification #8).
- Animation-heavy motion effects beyond what's listed in design-style.md.

---

## Dependencies

- [x] Constitution document exists (`.momorph/constitution.md`)
- [x] Screen flow documented (`.momorph/SCREENFLOW.md`) — updated with this screen (row #4, "He thong giai (Award System)").
- [x] Homepage spec exists (`.momorph/specs/i87tDx10uM-homepage-saa/spec.md`) — source of shared Header/Footer behaviour.
- [x] `<AppHeader>` exists at [components/shared/AppHeader.tsx](components/shared/AppHeader.tsx).
- [x] `<AppFooter>` exists at [components/shared/AppFooter.tsx](components/shared/AppFooter.tsx) (already contains `/awards` in its `FOOTER_LINKS`).
- [x] `<NavLinks>` at [components/shared/NavLinks.tsx](components/shared/NavLinks.tsx) already knows `/awards` and the active-link style (`underline underline-offset-8`).
- [x] i18n infrastructure exists — `i18n/request.ts` loads `vi`/`en`/`ja` from `messages/` based on `NEXT_LOCALE` cookie.
- [ ] `awardsPage.*` translation keys added to all three locale files (`vi.json`, `en.json`, `ja.json`).
- [ ] Static data module `lib/awards/data.ts` authored with the 6 awards and KudosPromo constants.
- [ ] Award thumbnail images exported from Figma and placed under `public/images/awards/`.
- [ ] Shared `<Icon>` component **does not yet exist** in the repo (no `components/**/Icon.tsx` found as of this spec). Either (a) create it under `components/ui/Icon.tsx` before this page, or (b) replace the constitution's "all icons via `<Icon>`" rule with direct inline SVG per icon. Resolve during planning phase.
- [ ] Montserrat, Montserrat Alternates fonts loaded via `next/font/google`; SVN-Gotham loaded as a local font asset (fallback: Montserrat weight 900 at compressed line-height).
- [ ] Awards page route registered (`app/awards/page.tsx`).

---

## Resolved Clarifications *(for traceability)*

All open questions from earlier spec-review rounds are now resolved. This section captures the final answers so future readers don't have to re-derive them.

| # | Question | Resolution |
|---|----------|-----------|
| 1 | Route path | `/awards` (confirmed from existing `<NavLinks>` and `<AppFooter>` FOOTER_LINKS) |
| 2 | Header nav label | `nav.awardsInfo` → "Awards Information" — auto-activated by `<NavLinks>` via `usePathname()` |
| 3 | Active menu indicator | Gold `#FFEA9E` text + `underline underline-offset-8` (matches `<NavLinks>`) |
| 4 | Awards data source | **Static** — authored in `lib/awards/data.ts` + `messages/*.json`. No Supabase / API / runtime fetch. |
| 5 | Kudos promo data | **Static** — authored in the same constants and locale files. |
| 6 | "Chi tiết" CTA target | `/kudos` |
| 7 | Mobile menu pattern | **Horizontal scrolling tab bar** pinned under `<AppHeader>` (`sticky top-16`, scroll-snap, auto-scrolls active tab into view) — see FR-008. |
| 8 | Analytics events | **Not required** in v1. No tracking wired. |
| 9 | Signature 2025 schema | `prizeTiers` tuple `readonly [PrizeTier] \| readonly [PrizeTier, PrizeTier]` supports 1 or 2 tiers uniformly. |
| 10 | Japanese proper nouns | **Latin brand names** kept across all locales (FR-015a); only descriptions and UI labels are translated. |

---

## Notes

- **Pixel-perfect images**: Each award thumbnail (Node IDs `I313:8467;214:2525`, `I313:8473;81:2442`, …) is 336 × 336 with a 0.955 px gold border and the category name overlaid in a branded font. Ensure assets are uploaded at 2x (672 × 672) for Retina.
- **Alternating layout**: D.1 / D.3 / D.5 use image-left; D.2 / D.4 / D.6 use image-right. Implement via a single `<AwardCard layout="image-left | image-right">` prop, **not** duplicated components.
- **Signature 2025 dual-tier**: The prize structure differs from all other cards. The data model (`Award.prizeTiers` typed as a 1-or-2 tuple, see §Key Entities) already supports this; render tiers as two metadata rows with a divider between them.
- **Sun\* Kudos promo**: This block is shared in shape with the Homepage SAA Kudos promo — consider extracting `<KudosPromo />` as a shared molecule.
- **Keyvisual image**: The cover image (Node `2167:5138`) is saved to `assets/frame.png` at `.momorph/specs/zFYDgyj_pD-he-thong-giai/assets/`. Production image should be a dedicated hero asset (not the full frame screenshot).
- **Menu scroll-spy reliability**: Use IntersectionObserver with `rootMargin: "-104px 0px -50% 0px"` (104 px = 80 px fixed header + 24 px breathing room, matching the `top-[104px]` sticky offset in FR-008) and `threshold: 0` to trigger the active state when a card's top edge crosses below the menu-rail level into the upper half of the viewport.
- **SSR vs Client split**: The page shell, title, Keyvisual, Sun\* Kudos block, and Footer render on the server (static content). The `<AwardsMenu>` (sticky menu with click handlers and scroll-spy) is a Client Component; `<AppHeader>` is already a Client Component.
- **Analytics**: Not required for this release. (Resolved: no event tracking wired in v1.)
