# Implementation Plan: Homepage SAA

**Frame**: `i87tDx10uM-homepage-saa`
**Date**: 2026-04-16
**Spec**: `specs/i87tDx10uM-homepage-saa/spec.md`

---

## Summary

Implement the SAA 2025 Homepage as the main hub after login. The page features a hero banner
with a live countdown timer, event info, CTA buttons, a 6-card award categories grid, a
Sun* Kudos promotional block, a floating action button, and shared Header/Footer navigation.
The Header and Footer from the Login screen MUST be promoted to shared app-level components
and extended with nav links, notification bell, and user avatar.

---

## Technical Context

**Language/Framework**: TypeScript / Next.js 16 (App Router)
**Primary Dependencies**: React 19, TailwindCSS 4, Supabase JS + SSR, next-intl (existing)
**Database**: Supabase — Auth existing, no new tables (award data static initially)
**Testing**: Vitest + Testing Library (existing setup)
**State Management**: React local state for countdown + FAB; no new global store
**API Style**: Static data for awards; Supabase Auth for session check (existing)

---

## Constitution Compliance Check

- [X] Server Components by default; `"use client"` only for CountdownTimer + FAB (Principle II)
- [X] Feature-based folder structure: `components/homepage/`, shared in `components/shared/` (Principle I)
- [X] TailwindCSS utility classes from design tokens (Principle II)
- [X] `next/image` for all images (Principle II)
- [X] HTTP-only cookie auth check via existing middleware (Principle IV)
- [X] WCAG 2.1 AA: keyboard nav, ARIA, focus rings, reduced motion (Principle V)
- [X] TDD: tests before implementation (Principle III)
- [X] Mobile-first responsive design (Principle V)

---

## Architecture Decisions

### Component Refactoring Strategy

The Login screen's Header and Footer are login-specific. They MUST be refactored:

1. **Promote** `components/login/Header.tsx` → `components/shared/AppHeader.tsx`

   - Add nav links: "About SAA 2025", "Awards Information", "Sun* Kudos"
   - Add active link state (golden text + underline via `aria-current="page"`)
   - Add notification bell icon with red badge (unread count)
   - Add user avatar button with dropdown (Profile, Sign out, Admin for admin role)
   - Keep LanguageSelector (already exists, reuse as-is)
   - Accept `activePath` prop for active link highlighting
2. **Promote** `components/login/Footer.tsx` → `components/shared/AppFooter.tsx`

   - Add nav links: "About SAA 2025", "Awards Information", "Sun* Kudos", "Tieu chuan chung"
   - Add SAA logo
   - Keep copyright text
3. **Update Login page** to use the new shared components (backward-compatible — login just won't pass nav props)

### Frontend Approach

- **Server Component**: `app/(dashboard)/page.tsx` — main homepage, auth check, renders all sections
- **Client Components** (`"use client"`):
  - `CountdownTimer` — `setInterval` every 60s, clamps to 0, hides "Coming soon" at zero
  - `FloatingActionButton` — toggle open/close, 2 menu options (Viet Kudo, The le)
  - `AppHeader` needs client interactivity for dropdowns (notification, avatar, language)
- **Static Components**: HeroBanner, EventInfo, CTAButtons, RootFurtherContent, AwardsSectionHeader, AwardsGrid, AwardCard, KudosPromoBlock

### Data Strategy

- **Award categories**: Static JSON data file at `lib/data/award-categories.ts` — 6 hardcoded entries with id, slug, name, description, thumbnailUrl. Migrable to Supabase/API later. Since data is static (imported at build time), no loading/error states needed initially — add skeleton/error handling when migrated to API.
- **Event datetime**: Environment variable `NEXT_PUBLIC_EVENT_START_DATE` (ISO-8601)
- **Event info text**: Hardcoded i18n strings in `messages/{vi,en,ja}.json`
- **Notification count**: Stub as 0 initially — actual implementation depends on Notification system spec

---

## Project Structure

### New Files

```text
app/
├── (dashboard)/
│   ├── layout.tsx                    # Dashboard layout with shared header/footer
│   └── page.tsx                      # Homepage SAA (Server Component)

components/
├── shared/
│   ├── AppHeader.tsx                 # Shared app header ("use client" for dropdowns)
│   ├── AppFooter.tsx                 # Shared app footer
│   ├── NavLinks.tsx                  # Nav link list with active state
│   ├── NotificationBell.tsx          # Bell icon with badge ("use client")
│   └── UserAvatar.tsx               # Avatar with dropdown ("use client")
├── homepage/
│   ├── HeroBanner.tsx                # Hero background + ROOT FURTHER title
│   ├── CountdownTimer.tsx            # Live countdown ("use client")
│   ├── EventInfo.tsx                 # Time, venue, livestream text
│   ├── CTAButtons.tsx                # ABOUT AWARDS + ABOUT KUDOS buttons
│   ├── RootFurtherContent.tsx        # Description paragraph
│   ├── AwardsSectionHeader.tsx       # Section title "He thong giai thuong"
│   ├── AwardsGrid.tsx                # 3-col/2-col responsive grid
│   ├── AwardCard.tsx                 # Single award card (reused x6)
│   ├── KudosPromoBlock.tsx           # Sun* Kudos promo section
│   └── FloatingActionButton.tsx      # FAB with menu ("use client")
└── ui/icons/
    ├── BellIcon.tsx                   # Notification bell
    ├── UserIcon.tsx                   # User avatar placeholder
    ├── PencilIcon.tsx                 # FAB pencil icon
    ├── ArrowRightIcon.tsx             # "Chi tiet" link arrow
    ├── RulesIcon.tsx                  # FAB rules icon
    └── SAALogoIcon.tsx                # SAA logo for footer (if different from header PNG)

lib/
└── data/
    └── award-categories.ts            # Static award category data

types/
└── homepage.ts                        # AwardCategory, EventConfig types

public/
└── images/
    ├── homepage-hero-bg.jpg           # Hero background (from Figma)
    ├── awards/                        # Award card thumbnail images (6 files)
    │   ├── top-talent.png
    │   ├── top-project.png
    │   ├── top-project-leader.png
    │   ├── best-manager.png
    │   ├── signature-2025.png
    │   └── mvp.png
    └── kudos-promo.png                # Kudos section illustration
```

### Modified Files

| File                                      | Changes                                                                    |
| ----------------------------------------- | -------------------------------------------------------------------------- |
| `components/login/Header.tsx`           | Replace with import from `components/shared/AppHeader.tsx` (then delete) |
| `components/login/Footer.tsx`           | Replace with import from `components/shared/AppFooter.tsx` (then delete) |
| `components/login/LanguageSelector.tsx` | Move to `components/shared/LanguageSelector.tsx`                         |
| `app/(auth)/login/page.tsx`             | Use shared AppHeader (no nav links, login variant)                         |
| `app/page.tsx`                          | Remove — replaced by `app/(dashboard)/page.tsx`                         |
| `messages/vi.json`                      | Add homepage translation keys                                              |
| `messages/en.json`                      | Add homepage translation keys                                              |
| `messages/ja.json`                      | Add homepage translation keys                                              |
| `.env.local.example`                    | Add `NEXT_PUBLIC_EVENT_START_DATE`                                       |

### Dependencies

No new dependencies — all existing: React 19, TailwindCSS 4, next-intl, Supabase, Zod.

### Media Assets (from Figma)

| Asset              | Source                                    | File                                       |
| ------------------ | ----------------------------------------- | ------------------------------------------ |
| Hero background    | `get_figma_image` node `2167:9027`    | `public/images/homepage-hero-bg.jpg`     |
| 6 award thumbnails | `get_media_files` screen `i87tDx10uM` | `public/images/awards/*.png`             |
| Kudos promo image  | `get_media_files` screen `i87tDx10uM` | `public/images/kudos-promo.png`          |
| Bell icon          | SVG component                             | `components/ui/icons/BellIcon.tsx`       |
| User icon          | SVG component                             | `components/ui/icons/UserIcon.tsx`       |
| Pencil icon        | SVG component                             | `components/ui/icons/PencilIcon.tsx`     |
| Arrow right icon   | SVG component                             | `components/ui/icons/ArrowRightIcon.tsx` |

---

## Implementation Strategy

### Phase 0: Asset Preparation

- Download hero background from Figma, optimize (JPEG, max 1920px, mozjpeg q60)
- Download 6 award thumbnails from Figma
- Download Kudos promo illustration from Figma
- Create new SVG icon components (BellIcon, UserIcon, PencilIcon, ArrowRightIcon, RulesIcon)

### Phase 1: Setup & Refactoring

**Purpose**: Promote shared components, create types, static data, update i18n

1. Create `types/homepage.ts` — AwardCategory interface, EventConfig type
2. Create `lib/data/award-categories.ts` — 6 static award entries
3. Move `components/login/LanguageSelector.tsx` → `components/shared/LanguageSelector.tsx`
4. Promote Header → `components/shared/AppHeader.tsx`:
   - Accept `activePath`, `notificationCount` props
   - Add NavLinks, NotificationBell, UserAvatar sub-components
   - Reuse LanguageSelector from `components/shared/`
   - Logo click: navigate to `/` and `window.scrollTo(0, 0)` (FR-014)
   - Active nav re-click: call `window.scrollTo(0, 0)` instead of navigating (FR-015)
5. Promote Footer → `components/shared/AppFooter.tsx`:
   - Add nav links and SAA logo
6. Update Login page to import from `components/shared/` (no nav links for login variant)
7. Create `app/(dashboard)/layout.tsx` — wraps children with AppHeader + AppFooter
8. Delete `app/page.tsx` — replaced by `app/(dashboard)/page.tsx` (both serve route `/`)
9. Add `NEXT_PUBLIC_EVENT_START_DATE` to `.env.local.example`
10. Add homepage keys to `messages/{vi,en,ja}.json`

### Phase 2: Foundation — US1 (Homepage + Countdown) [P1]

**TDD**: Write tests for CountdownTimer (calculation, zero-clamp, Coming soon visibility) BEFORE implementation.

1. Create `components/homepage/CountdownTimer.tsx` (`"use client"`):
   - Read `NEXT_PUBLIC_EVENT_START_DATE` env var
   - Calculate days/hours/minutes remaining
   - `setInterval` every 60 seconds to update
   - Clamp to 0 (no negatives), zero-pad to 2 digits
   - Show "Coming soon" label; hide when all values = 0
   - `aria-live="polite"` for screen readers
   - Responsive font sizes per design-style.md
2. Create `components/homepage/EventInfo.tsx` — static i18n text (time, venue, livestream)
3. Create `components/homepage/CTAButtons.tsx` — "ABOUT AWARDS" (filled) + "ABOUT KUDOS" (outline) with `next/link`
4. Create `components/homepage/HeroBanner.tsx` — background image + gradient overlays + ROOT FURTHER title + contains CountdownTimer, EventInfo, CTAButtons
5. Create `app/(dashboard)/page.tsx` — Server Component, auth check, compose all sections

### Phase 3: US2 (Award Categories) [P1]

**TDD**: Write tests for AwardCard (render, truncation, hover, link with hash).

1. Create `components/homepage/AwardCard.tsx` — thumbnail, title, description (2-line truncate), "Chi tiet" link with arrow
2. Create `components/homepage/AwardsGrid.tsx` — responsive grid (3-col lg, 2-col default), maps `award-categories.ts` data
3. Create `components/homepage/AwardsSectionHeader.tsx` — "Sun* annual awards 2025" label + "He thong giai thuong" title + subtitle
4. Integrate into homepage page.tsx

### Phase 4: US3 (Kudos Promo) + US4 (Header Nav) [P1/P2]

**TDD**: Write tests for AppHeader (active state, logo scroll, re-click scroll, notification badge) BEFORE wiring sub-components.

1. Create `components/homepage/KudosPromoBlock.tsx` — title, description, illustration, "Chi tiet" button
2. Create `components/homepage/RootFurtherContent.tsx` — description paragraph
3. Create `components/shared/NavLinks.tsx` — renders nav links with `activePath` highlighting
4. Create `components/shared/NotificationBell.tsx` (`"use client"`) — bell icon + red badge (stub count=0)
5. Create `components/shared/UserAvatar.tsx` (`"use client"`) — avatar button + dropdown (Profile, Sign out)
6. Wire AppHeader with all sub-components

### Phase 5: US5 (FAB) + US6 (Footer) [P2/P3]

**TDD**: Write tests for FloatingActionButton (open/close, menu options, keyboard nav, Escape) BEFORE implementation.

1. Create `components/homepage/FloatingActionButton.tsx` (`"use client"`):
   - Pill shape (105x64), golden bg, fixed bottom-right
   - Click toggles menu with 2 options: "Viet Kudo" → `/kudos/write`, "The le" → `/rules`
   - Click-outside and Escape to close
   - `aria-expanded`, keyboard nav
2. Update `components/shared/AppFooter.tsx` — add nav links ("About SAA 2025", "Awards Info", "Sun* Kudos", "Tieu chuan chung")
3. Integrate FAB into homepage

### Phase 6: Responsive + Polish

1. Apply responsive classes to all components per design-style.md
2. `prefers-reduced-motion`: countdown uses no animation
3. Focus rings on all interactive elements
4. `<noscript>` fallback
5. Performance: `next/image` priority on hero, `sizes` props, verify LCP < 2.5s

---

## Integration Testing Strategy

### Test Scope

| Category       | Key Scenarios                                                            |
| -------------- | ------------------------------------------------------------------------ |
| CountdownTimer | Calculates correctly, clamps to 0, hides "Coming soon", updates interval |
| AwardCard      | Renders data, truncates at 2 lines, navigates with `#slug`             |
| AppHeader      | Active link state, logo scroll-to-top, re-click active link scrolls      |
| FAB            | Opens/closes menu, keyboard nav, Escape closes                           |
| Homepage page  | Auth redirect, renders all sections                                      |

### Mocking Strategy

| Dependency          | Strategy                                     |
| ------------------- | -------------------------------------------- |
| Supabase Auth       | Mock `getUser()` (existing pattern)        |
| Award data          | Import static data directly (no mock needed) |
| Date/Time           | Mock `Date.now()` for countdown tests      |
| `next/navigation` | Mock `usePathname`, `useRouter`          |

---

## Risk Assessment

| Risk                                     | Probability | Impact | Mitigation                                                                              |
| ---------------------------------------- | ----------- | ------ | --------------------------------------------------------------------------------------- |
| Header refactoring breaks Login page     | Medium      | High   | Refactor incrementally; test Login after each change                                    |
| Award thumbnail images large (6 files)   | Low         | Medium | Optimize with sharp, use `next/image` with responsive sizes                           |
| Countdown timer drift over long sessions | Low         | Low    | Recalculate from `Date.now()` on each tick, not decrement                             |
| Navigation links point to unbuilt pages  | High        | Low    | Use `href` links — pages return 404 until built; acceptable for incremental delivery |

### Estimated Complexity

- **Frontend**: Medium-High (11 new components, header refactoring, countdown logic)
- **Backend**: Low (no new API — static data + existing auth)
- **Testing**: Medium (countdown time mocking, header state tests)

---

## Dependencies & Prerequisites

### Required Before Start

- [X] Login screen implemented (auth, middleware, i18n, Supabase clients)
- [X] `constitution.md`, `spec.md`, `design-style.md` reviewed
- [X] Figma assets downloaded (hero bg, 6 award thumbnails, kudos image)
- [X] `NEXT_PUBLIC_EVENT_START_DATE` set in `.env.local`

### External Dependencies

- None new — all existing infrastructure from Login screen

---

## Next Steps

1. **Run** `/momorph.tasks` to generate task breakdown
2. **Review** tasks for parallelization
3. **Begin** Phase 0 (assets) → Phase 1 (refactoring) → Phase 2-5 (features)

---

## Notes

- The Header refactoring (Phase 1) is the riskiest part — it touches the Login page.
  Approach: create AppHeader as a NEW component, update Login to use it, then delete old Header.
  Never modify the old Header in place.
- Award card navigation uses `href="/awards#top-talent"` (hash anchor). The Awards Information
  page doesn't exist yet — the links will 404 until that screen is built. This is acceptable.
- The `app/(dashboard)/layout.tsx` wraps all authenticated pages with AppHeader + AppFooter.
  The Login page uses `app/(auth)/` route group which has its own layout — no conflict.
- The FAB should be included in the dashboard layout (not just homepage) since it's useful
  across multiple pages. However, per spec it's only defined for the homepage currently.
  Start in homepage only; promote to layout later if needed.
