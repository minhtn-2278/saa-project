# Feature Specification: Homepage SAA

**Frame ID**: `2167:9026`
**Screen ID**: `i87tDx10uM`
**File Key**: `9ypp4enmFmdK3YAFJLIu6C`
**Created**: 2026-04-16
**Status**: Reviewed

---

## Overview

The Homepage SAA is the main landing page after login for the Sun Annual Awards 2025 application. It is a long-scroll, single-page layout with a dark cinematic theme featuring: a hero banner with "ROOT FURTHER" branding and countdown timer, event information, CTA buttons to Awards and Kudos sections, an award categories grid (6 cards), a Sun* Kudos promotional block, and a shared header/footer navigation.

**Target Users**: Authenticated Sun* employees.

**Business Context**: The homepage serves as the central hub for SAA 2025, providing quick access to award information, the Kudos system, and event details. The countdown timer builds anticipation for the awards ceremony.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View Homepage & Event Countdown (Priority: P1)

**As a** Sun* employee,
**I want to** see the SAA 2025 homepage with a countdown to the event,
**So that** I know how much time remains before the ceremony.

**Why this priority**: The homepage is the first screen after login and the primary navigation hub. Without it, users cannot access any SAA features.

**Independent Test**: Navigate to `/` after login, verify hero section renders with countdown timer, event info, and CTA buttons.

**Acceptance Scenarios**:

1. **Scenario 1: Homepage loads with countdown**
   - **Given**: User is authenticated and navigates to `/`
   - **When**: The page loads
   - **Then**: The hero section shows "ROOT FURTHER" branding, a live countdown (Days/Hours/Minutes) to the event start time, event time/venue info, and two CTA buttons

2. **Scenario 2: Countdown updates in real-time**
   - **Given**: User is on the homepage with countdown visible
   - **When**: Time passes (every minute)
   - **Then**: The countdown values update automatically without page refresh. All values display with zero-padding (e.g., "05" not "5")

3. **Scenario 3: Countdown reaches zero**
   - **Given**: The event start time has passed
   - **When**: User views the homepage
   - **Then**: The countdown shows "00" for all units and the "Coming soon" label is hidden

4. **Scenario 4: CTA button navigation**
   - **Given**: User is on the homepage
   - **When**: User clicks "ABOUT AWARDS"
   - **Then**: User is navigated to the Awards Information page
   - **When**: User clicks "ABOUT KUDOS"
   - **Then**: User is navigated to the Sun* Kudos page

---

### User Story 2 - Browse Award Categories (Priority: P1)

**As a** Sun* employee,
**I want to** see all award categories on the homepage,
**So that** I can quickly learn about each award and navigate to details.

**Why this priority**: Award categories are the core content of SAA 2025. Displaying them on the homepage drives discovery and engagement.

**Independent Test**: Scroll to the awards section, verify 6 award cards are displayed in a grid, click a card to navigate to its detail.

**Acceptance Scenarios**:

1. **Scenario 1: Awards grid renders 6 categories**
   - **Given**: User is on the homepage
   - **When**: User scrolls to the awards section
   - **Then**: 6 award cards are displayed in a 3-column grid (desktop) / 2-column grid (mobile/tablet):
     - Top Talent
     - Top Project
     - Top Project Leader
     - Best Manager
     - Signature 2025 - Creator
     - MVP (Most Valuable Person)

2. **Scenario 2: Award card interaction**
   - **Given**: The awards grid is visible
   - **When**: User hovers over an award card
   - **Then**: The card shows a subtle elevation effect with border/light highlight
   - **When**: User clicks the card (image, title, or "Chi tiet" link)
   - **Then**: User is navigated to the Awards Information page with a hash anchor (`#slug`) to auto-scroll to the correct award section

3. **Scenario 3: Award card description truncation**
   - **Given**: An award card has a long description
   - **When**: The description exceeds 2 lines
   - **Then**: Text is truncated with ellipsis ("...")

---

### User Story 3 - View Sun* Kudos Promotion (Priority: P2)

**As a** Sun* employee,
**I want to** see the Sun* Kudos promotion on the homepage,
**So that** I can learn about the recognition movement and navigate to it.

**Why this priority**: Kudos is a secondary engagement feature. Displaying it on the homepage increases awareness but is not critical for core awards functionality.

**Independent Test**: Scroll to the Kudos section, verify content renders, click "Chi tiet" to navigate to Kudos page.

**Acceptance Scenarios**:

1. **Scenario 1: Kudos block renders**
   - **Given**: User is on the homepage
   - **When**: User scrolls to the Kudos section
   - **Then**: The promotional block shows: label "Phong trao ghi nhan", title "Sun* Kudos", description text, an illustration image, and a "Chi tiet" button

2. **Scenario 2: Navigate to Kudos**
   - **Given**: The Kudos section is visible
   - **When**: User clicks "Chi tiet"
   - **Then**: User is navigated to the Sun* Kudos page

---

### User Story 4 - Header Navigation (Priority: P1)

**As a** Sun* employee,
**I want to** use the header to navigate between SAA sections,
**So that** I can quickly access Awards, Kudos, Notifications, and my Profile.

**Why this priority**: The header is the primary navigation for the entire application, shared across all pages.

**Independent Test**: Verify header shows all nav links, active state, notification badge, language selector, and user avatar menu.

**Acceptance Scenarios**:

1. **Scenario 1: Header renders with all elements**
   - **Given**: User is on the homepage
   - **When**: The page loads
   - **Then**: The header displays: SAA logo (left), nav links ("About SAA 2025" selected, "Awards Information", "Sun* Kudos"), notification bell, language selector ("VN"), and user avatar (right)

2. **Scenario 2: Active nav link highlighting**
   - **Given**: User is on the "About SAA 2025" page (homepage)
   - **When**: The header renders
   - **Then**: "About SAA 2025" link shows selected state (golden text + underline), other links show normal state

3. **Scenario 3: Navigation click**
   - **Given**: Header is visible
   - **When**: User clicks "Awards Information"
   - **Then**: User is navigated to the Awards Information page
   - **When**: User clicks "Sun* Kudos"
   - **Then**: User is navigated to the Sun* Kudos page

4. **Scenario 4: Notification bell**
   - **Given**: User has unread notifications
   - **When**: Header renders
   - **Then**: The bell icon shows a red badge
   - **When**: User clicks the bell
   - **Then**: The notification panel opens

5. **Scenario 5: User avatar menu**
   - **Given**: Header is visible
   - **When**: User clicks the avatar icon
   - **Then**: A dropdown opens with options: Profile, Sign out (and Admin Dashboard for admin role)

6. **Scenario 6: Logo click returns to top**
   - **Given**: User has scrolled down on any page
   - **When**: User clicks the SAA logo in the header
   - **Then**: Page scrolls to the top of the homepage

7. **Scenario 7: Re-click active nav link scrolls to top**
   - **Given**: User is on the "About SAA 2025" page (homepage) and has scrolled down
   - **When**: User clicks "About SAA 2025" (the already-active link)
   - **Then**: Page scrolls to the top instead of navigating

---

### User Story 5 - Floating Action Button (Priority: P2)

**As a** Sun* employee,
**I want to** quickly access key actions via a floating button,
**So that** I can write a Kudo or perform other actions without scrolling.

**Why this priority**: Nice-to-have UX enhancement that improves accessibility of key actions on long-scroll pages.

**Independent Test**: Verify the floating button is visible, fixed at bottom-right, and opens an action menu on click.

**Acceptance Scenarios**:

1. **Scenario 1: FAB visible and fixed**
   - **Given**: User is on the homepage
   - **When**: User scrolls the page
   - **Then**: The floating action button (105x64px, golden background, pill shape) stays fixed at the bottom-right corner

2. **Scenario 2: FAB opens action menu**
   - **Given**: The FAB is visible
   - **When**: User clicks the FAB
   - **Then**: A menu appears with 2 options:
     - "Viet Kudo" (Write Kudo) — navigates to Write Kudo page
     - "The le" (Rules) — navigates to Rules page

---

### User Story 6 - Footer Navigation (Priority: P3)

**As a** Sun* employee,
**I want to** see footer navigation links,
**So that** I have an alternative way to navigate between sections.

**Why this priority**: The footer is supplementary navigation, identical links to the header.

**Acceptance Scenarios**:

1. **Scenario 1: Footer renders**
   - **Given**: User scrolls to the bottom
   - **When**: The footer is visible
   - **Then**: It shows: SAA logo, nav links ("About SAA 2025", "Awards Information", "Sun* Kudos", "Tieu chuan chung"), and copyright text "Ban quyen thuoc ve Sun* (C) 2025"

---

### Edge Cases

- What happens when event date is not configured? -> Display countdown at "00" for all values, hide "Coming soon" label.
- What happens when award category data fails to load? -> Display a skeleton/loading state, then an error message with retry option.
- What happens on very slow connections? -> Background images use fallback `#00101A` color. Text content loads first (SSR).
- What happens when user has no notifications? -> Bell icon shows without badge.
- What happens when user resizes the browser? -> Award grid switches between 3-column (desktop) and 2-column (mobile/tablet). All sections stack vertically on mobile.
- What happens when event date is far in the past (negative time)? -> Countdown MUST clamp to "00" for all values, never display negative numbers.
- What happens when user clicks the active nav link? -> Page scrolls to top instead of re-navigating (per Figma design item A1.2 behavior).
- What happens when user clicks logo? -> Navigate to homepage and scroll to top.

---

## UI/UX Requirements *(from Figma)*

### Screen Components

| # | Component | Node ID | Description | Interactions |
|---|-----------|---------|-------------|--------------|
| A1 | Header | 2167:9091 | Fixed nav bar: logo, links, bell, language, avatar | Nav clicks, dropdowns |
| 3.5 | Keyvisual | 2167:9027 | Hero banner with ROOT FURTHER + decorative bg | Static |
| B1 | Countdown | 2167:9035 | Countdown timer: Days/Hours/Minutes | Auto-update every minute |
| B2 | Event Info | 2167:9053 | Time: 18h30, Venue: Nha hat nghe thuat quan doi, Livestream: Facebook Sun* Family | Static |
| B3 | CTA Buttons | 2167:9062 | "ABOUT AWARDS" + "ABOUT KUDOS" | Click: navigate |
| B4 | Content | 5001:14827 | Root Further description paragraph | Static |
| C1 | Awards Header | 2167:9069 | Section title: "He thong giai thuong" | Static |
| C2 | Award List | 5005:14974 | Grid of 6 award cards (3-col desktop, 2-col mobile) | Hover, Click: navigate |
| D1 | Sun* Kudos | 3390:10349 | Kudos promotional block with CTA | Click "Chi tiet": navigate |
| 6 | FAB | 5022:15169 | Floating action button (105x64, pill, golden) | Click: open action menu |
| 7 | Footer | 5001:14800 | Footer with logo, links, copyright | Nav clicks |

### Navigation Flow

- **From**: Login page (after successful auth) OR any page via header nav
- **To**:
  - "ABOUT AWARDS" / "Awards Information" -> Awards Information page
  - "ABOUT KUDOS" / "Sun* Kudos" -> Sun* Kudos page
  - Award card click -> Awards Information page `#award-slug`
  - Notification bell -> Notification panel/dropdown
  - Avatar -> Profile dropdown (Profile, Sign out, Admin Dashboard)
  - FAB -> Action menu: "Viet Kudo" (Write Kudo page), "The le" (Rules page)
  - Footer links -> Same targets as header

### Visual Requirements

- **Full visual specs**: See [design-style.md](./design-style.md)
- **Page dimensions**: 1512px wide (desktop), 4480px tall (scrollable)
- **Background**: `#00101A` (dark navy) with gradient overlays on hero section
- **Theme**: Dark cinematic, consistent with Login screen
- **Fonts**: Montserrat (various weights) + Montserrat Alternates (footer)
- **Responsive**: 3-col award grid on desktop, 2-col on tablet/mobile

### Accessibility Requirements (WCAG 2.1 AA)

- **Keyboard navigation**: All interactive elements reachable via Tab. Enter activates buttons/links.
- **Focus indicators**: Visible focus ring on all interactive elements.
- **Screen reader**: All images have alt text. Countdown has `aria-live="polite"` for updates. Nav active state communicated via `aria-current="page"`.
- **Color contrast**: White text on dark bg passes AA (18.06:1).
- **Reduced motion**: Countdown updates without animation when `prefers-reduced-motion` is active.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Homepage MUST be accessible only to authenticated users (redirect to `/login` if not authenticated)
- **FR-002**: System MUST display a live countdown timer (Days/Hours/Minutes) to the configured event start datetime
- **FR-003**: Countdown MUST update every minute in real-time without page refresh
- **FR-004**: Event start datetime MUST be configurable via environment variable (`NEXT_PUBLIC_EVENT_START_DATE` in ISO-8601 format)
- **FR-005**: "Coming soon" label MUST be hidden when countdown reaches zero
- **FR-006**: System MUST display 6 award category cards in a responsive grid (3-col desktop, 2-col mobile)
- **FR-007**: Award card click MUST navigate to Awards Information page with hash anchor for the specific category
- **FR-008**: Award card descriptions MUST truncate at 2 lines with ellipsis
- **FR-009**: Header MUST show active nav state for the current page
- **FR-010**: Header notification bell MUST show a red badge when unread notifications exist
- **FR-011**: Floating action button MUST be fixed-positioned at bottom-right and open an action menu on click
- **FR-012**: All navigation links in header and footer MUST work correctly
- **FR-013**: Language selector in header MUST work (reuse LanguageSelector component from Login)
- **FR-014**: Header logo click MUST navigate to homepage and scroll to top
- **FR-015**: Clicking the currently active nav link MUST scroll to the top of the page (not re-navigate)
- **FR-016**: Event info section MUST display time, venue, and livestream note ("Tuong thuat truc tiep tai Group Facebook Sun* Family")
- **FR-017**: Countdown values MUST be clamped to 0 (never display negative numbers)

### Technical Requirements

- **TR-001**: Homepage MUST be a Server Component with client-side islands for countdown timer and FAB
- **TR-002**: Countdown timer MUST be a `"use client"` component using `setInterval` for real-time updates
- **TR-003**: Award categories SHOULD be fetched server-side (or from a static JSON initially)
- **TR-004**: Header and Footer MUST be shared components reusable across all pages
- **TR-005**: Background/hero images MUST use `next/image` with responsive `sizes` prop
- **TR-006**: Page MUST achieve LCP < 2.5s (hero image optimized, fonts preloaded)

### Key Entities

- **Event**: Start datetime (configured via env var), venue/time/livestream info (hardcoded i18n strings)
- **Award Category**: ID, slug, name, description, thumbnail image URL
- **Notification Count**: Number of unread notifications (for bell badge)

---

## API Dependencies

| Endpoint | Method | Purpose | Status |
|----------|--------|---------|--------|
| /api/awards/categories | GET | List all 6 award categories (name, slug, description, thumbnail) | New (predicted) |
| /api/notifications/count | GET | Get unread notification count for badge | New (predicted) |
| Supabase Auth | - | `supabase.auth.getUser()` for auth check | Existing |

---

## State Management

### Local Component State

| State | Type | Default | Purpose |
|-------|------|---------|---------|
| countdown | {days, hours, minutes} | calculated | Live countdown values (clamped to 0, never negative) |
| isComingSoonVisible | boolean | true | Hidden when countdown reaches zero |
| isFabOpen | boolean | false | FAB action menu visibility |

### Global State Needs

| State | Scope | Storage |
|-------|-------|---------|
| Session/Auth | App-wide | Supabase Auth (HTTP-only cookie) |
| Locale | App-wide | Cookie (`NEXT_LOCALE`) |
| Notification count | App-wide | Server-fetched, cached |

### Cache Requirements

- Award categories: Cache aggressively (rarely changes) — `revalidate: 3600` or ISR
- Notification count: Revalidate on every request or poll every 60 seconds
- Hero/background images: Immutable caching (long max-age)

---

## Success Criteria *(mandatory)*

- **SC-001**: Homepage loads within 2.5s LCP on 3G connection
- **SC-002**: Countdown timer is accurate within 1 minute of the real time
- **SC-003**: All 6 award cards render and are clickable
- **SC-004**: Navigation from homepage to all linked pages works correctly
- **SC-005**: Homepage passes WCAG 2.1 AA automated audit

---

## Out of Scope

- Award voting/nomination functionality — handled in Awards Information page
- Kudo writing/viewing — handled in Sun* Kudos page
- Notification list/detail — handled in Notifications page
- User profile management — handled in Profile page
- Admin dashboard — handled in Admin pages

---

## Dependencies

- [x] Constitution document exists (`.momorph/constitution.md`)
- [x] Login screen implemented (auth flow + shared components: Header, Footer, LanguageSelector)
- [x] Screen flow documented (`.momorph/SCREENFLOW.md`)
- [ ] Awards Information page spec (for navigation target)
- [ ] Sun* Kudos page spec (for navigation target)
- [ ] Notification system spec (for bell badge)

---

## Notes

- The Header and Footer components already exist from the Login screen implementation. They need to be **promoted to shared components** and extended with:
  - Nav links (About SAA, Awards Info, Sun* Kudos)
  - Active state per page
  - Notification bell with badge
  - User avatar with dropdown menu
- The countdown timer event start datetime should be configurable via `NEXT_PUBLIC_EVENT_START_DATE` environment variable.
- Award categories can initially be hardcoded as static data, then migrated to a Supabase table or API later.
- The page is designed at 1512px width (wider than the Login's 1440px). Ensure `max-w-[1512px]` or use the wider container for this page.
- The "Root Further" description section (B4) is a static content block — consider using i18n for the paragraph text.
