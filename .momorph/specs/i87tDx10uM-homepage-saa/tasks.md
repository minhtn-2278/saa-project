# Tasks: Homepage SAA

**Frame**: `i87tDx10uM-homepage-saa`
**Prerequisites**: plan.md (required), spec.md (required), design-style.md (required)

---

## Task Format

```
- [ ] T### [P?] [Story?] Description | file/path.ts
```

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this belongs to (US1-US6)
- **|**: File path affected by this task

---

## Phase 0: Asset Preparation

**Purpose**: Download and prepare all media assets from Figma

- [x] T001 Download homepage hero background from Figma (node `2167:9027`), optimize (JPEG, max 1920px, mozjpeg q60) | public/images/homepage-hero-bg.jpg
- [x] T002 [P] Download 6 award thumbnail images from Figma via `get_media_files` (screen `i87tDx10uM`) | public/images/awards/
- [x] T003 [P] Download Kudos promo illustration from Figma | public/images/kudos-promo.png
- [x] T004 [P] Create BellIcon SVG component (24x24, currentColor) | components/ui/icons/BellIcon.tsx
- [x] T005 [P] Create UserIcon SVG component (40x40, user silhouette) | components/ui/icons/UserIcon.tsx
- [x] T006 [P] Create PencilIcon SVG component (24x24, currentColor) for FAB | components/ui/icons/PencilIcon.tsx
- [x] T007 [P] Create ArrowRightIcon SVG component (16x16, currentColor) for "Chi tiet" links | components/ui/icons/ArrowRightIcon.tsx
- [x] T008 [P] Create RulesIcon SVG component (24x24, currentColor) for FAB rules option | components/ui/icons/RulesIcon.tsx
- [x] T009 [P] Create SAALogoIcon SVG component for footer | components/ui/icons/SAALogoIcon.tsx

---

## Phase 1: Setup & Refactoring (Shared Infrastructure)

**Purpose**: Promote Login components to shared, create types/data, update i18n

**CRITICAL**: No homepage UI work can begin until this phase is complete

- [x] T010 Create homepage types: `AwardCategory` (id, slug, name, description, thumbnailUrl), `EventConfig` (startDate: string ISO-8601) | types/homepage.ts
- [x] T011 [P] Create static award categories data: 6 entries (Top Talent, Top Project, Top Project Leader, Best Manager, Signature 2025 - Creator, MVP) with id, slug, name, description, thumbnailUrl | lib/data/award-categories.ts
- [x] T012 Move LanguageSelector from `components/login/` to `components/shared/`, update all imports | components/shared/LanguageSelector.tsx
- [x] T013 Create AppHeader (`"use client"`): full-width, fixed, bg rgba(16,20,23,0.8), z-50; contains inner max-w container with: SAA logo (click → `/` + scrollTo top), NavLinks placeholder, NotificationBell placeholder, LanguageSelector, UserAvatar placeholder; accept `activePath` and `notificationCount` props | components/shared/AppHeader.tsx
- [x] T014 [P] Create AppFooter: full-width, border-top #2E3940; inner max-w container with: SAA logo, nav links (About SAA 2025, Awards Info, Sun* Kudos, Tieu chuan chung), copyright text (i18n) | components/shared/AppFooter.tsx
- [x] T015 Update Login page: replace `components/login/Header` with `components/shared/AppHeader` (no nav links variant), replace Footer similarly; delete old `components/login/Header.tsx` and `components/login/Footer.tsx` | app/(auth)/login/page.tsx
- [x] T016 Create dashboard layout: wrap children with AppHeader + AppFooter, pass `activePath` from `usePathname` | app/(dashboard)/layout.tsx
- [x] T017 Delete old `app/page.tsx` — route `/` now served by `app/(dashboard)/page.tsx` | app/page.tsx
- [x] T018 [P] Add `NEXT_PUBLIC_EVENT_START_DATE` to env example | .env.local.example
- [x] T019 Add homepage i18n keys to Vietnamese translations: `homepage.hero.rootFurther`, `homepage.hero.comingSoon`, `homepage.countdown.days/hours/minutes`, `homepage.eventInfo.*`, `homepage.cta.aboutAwards/aboutKudos`, `homepage.rootFurther.content`, `homepage.awards.sectionLabel/title/subtitle`, `homepage.kudos.*`, `homepage.fab.writeKudo/rules` | messages/vi.json
- [x] T020 [P] Add homepage i18n keys to English translations (same keys as vi.json) | messages/en.json
- [x] T021 [P] Add homepage i18n keys to Japanese translations (same keys as vi.json) | messages/ja.json

**Checkpoint**: Login page still works with shared components. Dashboard layout renders empty page at `/`.

---

## Phase 2: US1 + US4 — Homepage + Countdown + Header Nav (Priority: P1)

**Goal**: Authenticated user sees homepage with hero banner, countdown timer, event info, CTA buttons, and full header navigation

**Independent Test**: Navigate to `/` after login → hero renders, countdown ticks, CTA buttons navigate, header shows active state for "About SAA 2025"

### TDD: Tests First

- [x] T022 [US1] Write unit tests for CountdownTimer: calculates days/hours/minutes from target date, zero-pads values, clamps to 0 for past dates, hides "Coming soon" when all values 0, updates on interval | tests/unit/countdown-timer.test.tsx
- [x] T023 [P] [US4] Write unit tests for AppHeader: renders all elements, active link has golden text + underline, logo click scrolls to top, re-click active link scrolls to top, notification badge shows when count > 0 | tests/unit/app-header.test.tsx

### Implementation

- [x] T024 [P] [US1] Create CountdownTimer (`"use client"`): read `NEXT_PUBLIC_EVENT_START_DATE`, calculate remaining days/hours/minutes via `Date.now()`, `setInterval` 60s, clamp to 0, zero-pad 2 digits, show "Coming soon" label (hide at 0), digit boxes bg rgba(255,234,158,0.1) rounded-8px, digit text Montserrat 48px/700, label text 14px/600 uppercase tracking-2px, `aria-live="polite"`, responsive (32px mobile → 48px desktop) | components/homepage/CountdownTimer.tsx
- [x] T025 [P] [US1] Create EventInfo: static i18n text — "Thoi gian: 18h30", "Dia diem: Nha hat nghe thuat quan doi", "Tuong thuat truc tiep tai Group Facebook Sun* Family"; Montserrat 16px/500 white | components/homepage/EventInfo.tsx
- [x] T026 [P] [US1] Create CTAButtons: 2 buttons side-by-side (stack on mobile); "ABOUT AWARDS" filled bg #FFEA9E text #00101A; "ABOUT KUDOS" outline border rgba(255,234,158,0.3) text white; both: px-24 py-16 rounded-8px Montserrat 16px/700; `next/link` to `/awards` and `/kudos`; hover swaps filled/outline states; focus ring 2px #FFEA9E | components/homepage/CTAButtons.tsx
- [x] T027 [US1] Create HeroBanner: background image via `next/image` (priority, sizes="100vw", object-cover, object-right-bottom), gradient overlays (left→right + bottom→top same as login), "ROOT FURTHER" title (Montserrat 120px/700 white, responsive 48px→80px→120px); contains CountdownTimer + EventInfo + CTAButtons | components/homepage/HeroBanner.tsx
- [x] T028 [US4] Create NavLinks: renders 3 links ("About SAA 2025" → `/`, "Awards Information" → `/awards`, "Sun* Kudos" → `/kudos`); active link: text #FFEA9E + underline (underline-offset-8px) via `aria-current="page"`; normal: text-white; hover: bg-white/5; re-click active: `window.scrollTo(0,0)` | components/shared/NavLinks.tsx
- [x] T029 [P] [US4] Create NotificationBell (`"use client"`): bell icon 40x40, accept `count` prop, show red badge (#EF4444) when count > 0, click opens notification panel (stub: log to console) | components/shared/NotificationBell.tsx
- [x] T030 [P] [US4] Create UserAvatar (`"use client"`): user icon 40x40, click opens dropdown menu with: "Profile" → `/profile`, "Sign out" → sign out + redirect `/login`; click-outside + Escape to close; `aria-expanded`, `aria-haspopup` | components/shared/UserAvatar.tsx
- [x] T031 [US4] Wire AppHeader with NavLinks, NotificationBell, UserAvatar sub-components; logo click → `router.push('/')` + `window.scrollTo(0,0)` | components/shared/AppHeader.tsx
- [x] T032 [US1] Create Homepage page (Server Component): auth check via `getUser()` (redirect `/login` if unauthenticated); compose: HeroBanner (full-width) + remaining sections (max-w-[1512px] mx-auto) | app/(dashboard)/page.tsx

**Checkpoint**: Homepage renders with hero, countdown, event info, CTAs, and full header navigation

---

## Phase 3: US2 — Award Categories (Priority: P1)

**Goal**: 6 award cards in responsive grid, clickable with hash anchor navigation

**Independent Test**: Scroll to awards section → 6 cards visible in 3-col grid → hover shows elevation → click navigates to `/awards#top-talent`

### TDD: Tests First

- [x] T033 [US2] Write unit tests for AwardCard: renders thumbnail + title + description + "Chi tiet" link, description truncates at 2 lines, link href includes `#slug`, hover class applied | tests/unit/award-card.test.tsx

### Implementation

- [x] T034 [P] [US2] Create AwardCard: thumbnail via `next/image` (square, rounded, golden ring border effect), title (Montserrat 20px/700 white), description (14px/400 white/70%, `line-clamp-2`), "Chi tiet" link (14px/600 gold + ArrowRightIcon); link `href="/awards#${slug}"`; hover: `translateY(-4px) border-color rgba(255,234,158,0.3) shadow`; focus: `outline 2px solid #FFEA9E` | components/homepage/AwardCard.tsx
- [x] T035 [P] [US2] Create AwardsSectionHeader: "Sun* annual awards 2025" label (14px/600 gold uppercase tracking-2px), "He thong giai thuong" title (32px/700 white), subtitle description (16px/400 white/70%) — all i18n | components/homepage/AwardsSectionHeader.tsx
- [x] T036 [US2] Create AwardsGrid: import award-categories.ts, render 6 AwardCards in responsive grid (`grid grid-cols-2 lg:grid-cols-3 gap-8`); section wrapper with px-4 sm:px-12 lg:px-36 | components/homepage/AwardsGrid.tsx
- [x] T037 [US2] Integrate AwardsSectionHeader + AwardsGrid into homepage page.tsx | app/(dashboard)/page.tsx

**Checkpoint**: Awards section renders 6 cards, clickable, responsive grid

---

## Phase 4: US3 — Sun* Kudos Promo + Root Further Content (Priority: P2)

**Goal**: Kudos promotional block and Root Further description paragraph visible on homepage

**Independent Test**: Scroll to Kudos section → title, description, illustration, "Chi tiet" button visible → click navigates to `/kudos`

- [x] T038 [P] [US3] Create RootFurtherContent: i18n description paragraph about "Root Further" theme; Montserrat 16px/400 white leading-7, max-w readable; px-4 sm:px-12 lg:px-36 | components/homepage/RootFurtherContent.tsx
- [x] T039 [US3] Create KudosPromoBlock: "Phong trao ghi nhan" label (14px/600 gold), "Sun* Kudos" title (24px/700 white), description text (16px/400), illustration image via `next/image`, "Chi tiet" button (filled gold, `next/link` → `/kudos`); side-by-side layout on desktop, stacked on mobile | components/homepage/KudosPromoBlock.tsx
- [x] T040 [US3] Integrate RootFurtherContent + KudosPromoBlock into homepage page.tsx with 120px section gap | app/(dashboard)/page.tsx

**Checkpoint**: Kudos section and Root Further content visible, navigation works

---

## Phase 5: US5 + US6 — FAB + Footer Nav (Priority: P2/P3)

**Goal**: Floating action button with "Viet Kudo" + "The le" options; footer with full nav links

**Independent Test**: FAB visible bottom-right, click opens 2-option menu, keyboard nav works; footer shows all links

### TDD: Tests First

- [x] T041 [US5] Write unit tests for FloatingActionButton: renders pill shape, opens menu on click, shows 2 options ("Viet Kudo" + "The le"), closes on Escape, closes on click-outside, keyboard navigation, `aria-expanded` | tests/unit/floating-action-button.test.tsx

### Implementation

- [x] T042 [US5] Create FloatingActionButton (`"use client"`): pill 105x64 (80x48 mobile), bg #FFEA9E, rounded-32px, fixed bottom-24px right-24px z-40; PencilIcon + "/" + SAALogoIcon; click toggles menu: "Viet Kudo" (PencilIcon → `/kudos/write`), "The le" (RulesIcon → `/rules`); click-outside + Escape close; `aria-expanded`, `aria-haspopup="menu"`, keyboard nav (ArrowUp/Down, Enter, Escape); motion-safe transitions | components/homepage/FloatingActionButton.tsx
- [x] T043 [US6] Update AppFooter: add NavLinks (About SAA 2025, Awards Info, Sun* Kudos, Tieu chuan chung) + SAA logo; ensure full-width border, inner content max-w constrained | components/shared/AppFooter.tsx
- [x] T044 [US5] Integrate FloatingActionButton into homepage page.tsx | app/(dashboard)/page.tsx

**Checkpoint**: FAB works with 2 options, footer has full navigation

---

## Phase 6: Responsive + Polish

**Purpose**: Ensure all breakpoints, accessibility, performance targets met

- [x] T045 [P] Apply responsive classes to HeroBanner: hero title 48px→80px→120px, padding px-4→px-12→px-36, gradient overlays full-viewport | components/homepage/HeroBanner.tsx
- [x] T046 [P] Apply responsive classes to CountdownTimer: digit font 32px→40px→48px, gap adjustments | components/homepage/CountdownTimer.tsx
- [x] T047 [P] Apply responsive classes to CTAButtons: stack vertical on mobile, side-by-side sm+ | components/homepage/CTAButtons.tsx
- [x] T048 [P] Apply responsive classes to KudosPromoBlock: stack vertical mobile, side-by-side lg+ | components/homepage/KudosPromoBlock.tsx
- [x] T049 Apply `prefers-reduced-motion`: countdown updates without transition animation | components/homepage/CountdownTimer.tsx
- [x] T050 [P] Verify all interactive elements have focus rings (2px solid #FFEA9E, offset 2px): CTA buttons, award cards, FAB, nav links, notification bell, avatar | all interactive components
- [x] T051 [P] Add `<noscript>` fallback message to homepage | app/(dashboard)/page.tsx
- [x] T052 Performance: verify hero `next/image` has `priority` + `sizes="100vw"`, award images have proper `sizes`, fonts preloaded, LCP < 2.5s target | app/(dashboard)/page.tsx

---

## Phase N: Code Cleanup & Verification

**Purpose**: Final quality checks

- [x] T053 [P] Verify Login page still works after shared component refactoring (manual test: navigate to `/login`, login flow, redirect) | app/(auth)/login/page.tsx
- [x] T054 [P] Run `npx tsc --noEmit` — zero TypeScript errors | all files
- [x] T055 [P] Run `npx vitest run` — all existing + new tests pass | tests/
- [x] T056 [P] Verify `npm audit` — no new critical/high vulnerabilities | package.json
- [x] T057 Code cleanup: remove unused imports, verify no `any` types, ensure all files < 300 lines | all modified files
- [x] T058 Delete old Login-specific Header/Footer if not already deleted in T015 | components/login/Header.tsx, components/login/Footer.tsx

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 0 (Assets)**: No dependencies — start immediately
- **Phase 1 (Setup)**: Depends on Phase 0 for icon components — BLOCKS all feature phases
- **Phase 2 (US1+US4)**: Depends on Phase 1 (shared components, types, data, i18n)
- **Phase 3 (US2)**: Depends on Phase 2 (homepage page.tsx must exist to integrate)
- **Phase 4 (US3)**: Depends on Phase 2 (homepage page.tsx must exist)
- **Phase 5 (US5+US6)**: Depends on Phase 2 (homepage page.tsx and AppFooter must exist)
- **Phase 6 (Polish)**: Depends on Phases 2-5 (all components must exist)
- **Phase N (Cleanup)**: Depends on Phase 6

### Within Each Phase

- Tests MUST be written and FAIL before implementation (TDD)
- Icon components before feature components that use them
- Sub-components before parent components
- Page integration tasks after all section components are created

### Parallel Opportunities

**Phase 0**: T001-T009 all parallel
**Phase 1**: T011, T014, T018, T020, T021 parallel with T010
**Phase 2**: T022, T023 parallel (tests); T024, T025, T026, T029, T030 parallel (independent components)
**Phase 3**: T034, T035 parallel (independent components)
**Phase 4**: T038 parallel with T039
**Phase 5**: (sequential — FAB depends on icons)
**Phase 6**: T045, T046, T047, T048, T050, T051 all parallel
**Phase N**: T053, T054, T055, T056 all parallel

---

## Implementation Strategy

### MVP First (Recommended)

1. Complete Phase 0 + 1 + 2
2. **STOP and VALIDATE**: Homepage with hero + countdown + header nav works
3. Deploy if ready — users can see homepage and navigate

### Incremental Delivery

1. Phase 0 + 1 (Assets + Setup) → Verify Login still works
2. Phase 2 (US1+US4: Homepage + Header) → Test → Deploy
3. Phase 3 (US2: Awards Grid) → Test → Deploy
4. Phase 4 (US3: Kudos Promo) → Test → Deploy
5. Phase 5 (US5+US6: FAB + Footer) → Test → Deploy
6. Phase 6 + N (Polish + Cleanup) → Final Deploy

---

## Notes

- Commit after each task or logical group
- Run tests before moving to next phase
- The header refactoring (T012-T015) is the highest-risk part — test Login page immediately after
- Award card images have a golden ring/glow effect — these are Figma graphic assets, not CSS-generated
- Navigation links (Awards, Kudos) will 404 until those screens are implemented — this is expected
- Mark tasks complete as you go: `[x]`
