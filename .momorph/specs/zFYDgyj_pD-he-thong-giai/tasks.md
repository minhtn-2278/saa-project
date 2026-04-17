# Tasks: Hệ thống giải (Awards System)

**Frame**: `zFYDgyj_pD-he-thong-giai`
**Prerequisites**: [plan.md](./plan.md) (required), [spec.md](./spec.md) (required), [design-style.md](./design-style.md) (required)
**Created**: 2026-04-17

---

## Task Format

```
- [ ] T### [P?] [Story?] Description | file/path.ts
```

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: User story label (US1, US2, US3, US4, US5). Setup / Foundation / Polish tasks have no story label.
- **|**: File path(s) affected by this task

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Feature branch, new dependencies, project-wide utilities, asset preparation.

- [ ] T001 Create feature branch `feat/awards-page` from `main` | (git)
- [ ] T002 [P] Install `@axe-core/playwright` as devDependency | `package.json`
- [ ] T003 [P] Add `.scrollbar-hide` utility under `@layer utilities` (scrollbar-width: none; ::-webkit-scrollbar { display: none }) | `app/globals.css`
- [ ] T004 [P] Add global `IntersectionObserver` mock stub (class with observe/unobserve/disconnect/takeRecords no-ops assigned to `globalThis.IntersectionObserver`) | `tests/setup.ts`
- [ ] T005 [P] Create `withLocale(page, locale)` Playwright helper that sets `NEXT_LOCALE` cookie before navigation | `tests/e2e/helpers/with-locale.ts`
- [ ] T006 [P] Audit existing award thumbnails at `public/images/awards/*.png` — verify each is ≥ 672 × 672 px (Retina 2x for 336 × 336 display); re-export via `mcp__momorph__get_media_files` for screen `zFYDgyj_pD` if any are under-resolution | `public/images/awards/*.png`
- [ ] T007 Decide keyvisual source: (a) reuse `public/images/homepage-hero-bg.jpg` OR (b) export dedicated asset from Figma node `2167:5138` to `public/images/keyvisual-awards.jpg` | `public/images/keyvisual-awards.jpg` (if b)
- [ ] T008 Produce OG asset (1200 × 630, derived from keyvisual + title overlay) for TR-007 | `public/images/og-awards.jpg`
- [ ] T009 SVN-Gotham font decision: either register `.woff2` files via `next/font/local` in `app/layout.tsx`, OR accept Montserrat 900 fallback and document in design-style.md | `public/fonts/SVN-Gotham/*.woff2` + `app/layout.tsx` (if adopted)
- [ ] T010 [P] Create empty stub files + README in `components/awards/` and `lib/awards/` directories so later `[P]` tasks don't collide on directory creation | `components/awards/.gitkeep`, `lib/awards/.gitkeep`

---

## Phase 2: Foundation (Blocking Prerequisites)

**Purpose**: Type system, static data, formatters, and i18n keys. Every user story below depends on this phase.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

### Formatters (TDD)

- [ ] T011 [P] Write failing unit test for `formatVND` (all 3 locales) and `padQuantity` (1, 10, 100 cases) | `tests/unit/format-vnd.test.ts`
- [ ] T012 Implement `formatVND(value, locale)` using `Intl.NumberFormat` + locale-specific VNĐ/VND suffix, and `padQuantity(n)` with `padStart(2, '0')` when `n < 10` | `lib/utils/format.ts`

### Types & Static Data (TDD)

- [ ] T013 [P] Implement TypeScript types: `UnitKey`, `PrizeTier`, `Award`, `KudosPromo` | `lib/awards/types.ts`
- [ ] T014 [P] Implement zod schemas (`AwardSchema`, `PrizeTierSchema`, `KudosPromoSchema`, `AwardsArraySchema` with `.length(6)`) | `lib/awards/schema.ts`
- [ ] T015 Write failing unit test for `AWARDS` data: 6 entries, unique slugs, displayOrder 1..6, alternating layouts, valid prize tiers, all i18n key references exist in `vi.json` | `tests/unit/awards-data.test.ts`
- [ ] T016 Populate `AWARDS` readonly constant + `KUDOS_PROMO` constant (all 6 awards with correct slugs, layouts, quantities, VND values from spec.md §Screen Components table); call `AwardsArraySchema.parse(AWARDS)` in dev mode | `lib/awards/data.ts`

### i18n Keys (TDD)

- [ ] T017 [P] Write failing unit test for locale key parity under `awardsPage.*` across vi/en/ja | `tests/unit/i18n-key-parity.test.ts`
- [ ] T018 [P] Populate `awardsPage.*` keys in VN: `eyebrow`, `title`, `menuAriaLabel`, `quantityLabel`, `valueLabel`, `perAward`, `units.{don_vi,ca_nhan,tap_the}`, `signature.{individualLabel,groupLabel}`, `kudos.{eyebrow,title,description,cta}`, `metaTitle`, `metaDescription`, and `<slug>.description` for all 6 awards (long copy from Figma extraction) | `messages/vi.json`
- [ ] T019 [P] Mirror the same `awardsPage.*` keys in EN (EN translation for each key) | `messages/en.json`
- [ ] T020 [P] Mirror the same `awardsPage.*` keys in JA (JA translation for each key; names reused from existing `homepage.awards.<slug>.name` which are already Latin in all 3 locales) | `messages/ja.json`

**Checkpoint**: Foundation ready — all user stories can now begin in parallel (if staffed).

---

## Phase 3: User Story 1 - View Award Catalogue (Priority: P1) 🎯 MVP

**Goal**: Render the full awards page at `/awards` — keyvisual + localized title + 6 cards with alternating layouts + Signature 2025 dual-tier, composed on a Server Component page. No interactive menu yet (stub/visible only) — that is US2.

**Independent Test**: Playwright E2E navigates to `/awards` (authenticated), asserts the localized `<h1>` renders, exactly 6 cards render in correct order with correct title/description/quantity/value, Signature 2025 shows both prize tiers.

### Presentational Components (TDD)

- [ ] T021 [P] [US1] Write failing unit test: `<Keyvisual>` renders `next/image` with `aria-hidden="true"`, empty `alt=""`, and bottom-fading gradient overlay | `tests/unit/keyvisual.test.tsx`
- [ ] T022 [US1] Implement `<Keyvisual>` Server Component — 1440×547 hero image with linear-gradient overlay to `#00101A`, `priority` loading per TR-001, `sizes="100vw"` | `components/awards/Keyvisual.tsx`
- [ ] T023 [P] [US1] Write failing unit test: `<AwardsTitle>` renders eyebrow (`awardsPage.eyebrow`), `<hr>` divider, and `<h1>` heading (`awardsPage.title`) | `tests/unit/awards-title.test.tsx`
- [ ] T024 [US1] Implement `<AwardsTitle>` Server Component — flex-col gap-4, Montserrat 700 24/32 white eyebrow, 1 px `#2E3940` divider, Montserrat 700 57/64 `#FFEA9E` centered `<h1>` | `components/awards/AwardsTitle.tsx`
- [ ] T025 [P] [US1] Write failing unit test: `<AwardImage>` renders `next/image` with correct alt (Latin brand name), `border border-[#FFEA9E]`; on `onError` swaps to gold-bordered placeholder with overlay name | `tests/unit/award-image.test.tsx`
- [ ] T026 [US1] Implement `<AwardImage>` Server Component — 336×336, `w-full max-w-[336px] aspect-square md:w-[336px] md:h-[336px]`, responsive sizes, fallback state | `components/awards/AwardImage.tsx`
- [ ] T027 [P] [US1] Write failing unit test: `<AwardMetadataRow variant="quantity">` renders label + padded number + localized unit; `<AwardMetadataRow variant="value">` renders label + formatted VND + optional perAward suffix; **FR-013 check**: no `line-clamp` / `truncate` classes | `tests/unit/award-metadata-row.test.tsx`
- [ ] T028 [US1] Implement `<AwardMetadataRow>` Server Component — two variants, gold 36/44 value text, white 16/24 label + suffix text, uses `formatVND` and `padQuantity` | `components/awards/AwardMetadataRow.tsx`
- [ ] T029 [P] [US1] Create `AwardQuantityIcon.tsx` (target/crosshair SVG, 24×24, sm: 20×20) | `components/ui/icons/AwardQuantityIcon.tsx`
- [ ] T030 [P] [US1] Create `AwardValueIcon.tsx` (coin/money SVG, 24×24, sm: 20×20) | `components/ui/icons/AwardValueIcon.tsx`
- [ ] T031 [P] [US1] Write failing unit test: `<AwardCard>` with `layout="image-left"` renders `md:flex-row`; `layout="image-right"` renders `md:flex-row-reverse`; DOM order always `image → content` for a11y; `<h2>` title; `<dl>` metadata; long description fully visible (FR-013) | `tests/unit/award-card-awards-page.test.tsx`
- [ ] T032 [US1] Implement `<AwardCard>` Server Component — `flex flex-col md:flex-row md:gap-10`, with `md:flex-row-reverse` when `layout="image-right"`; composes `<AwardImage>` + content (title + description + metadata rows + divider); bottom divider 1 px `#2E3940` | `components/awards/AwardCard.tsx`
- [ ] T033 [P] [US1] Write failing unit test: `<SignatureAwardCard>` renders BOTH `prizeTiers` entries with 1 px `#2E3940` divider between; tier labels from `awardsPage.signature.individualLabel` / `.groupLabel` | `tests/unit/signature-award-card.test.tsx`
- [ ] T034 [US1] Implement `<SignatureAwardCard>` Server Component — extends AwardCard layout; renders two `<AwardMetadataRow variant="value">` rows with tier labels and a divider between them | `components/awards/SignatureAwardCard.tsx`
- [ ] T035 [P] [US1] Write failing unit test: `<AwardsSection>` renders exactly 6 cards in slug order; card 5 (signature-2025) renders as `<SignatureAwardCard>`, others as `<AwardCard>`; each card has `id={slug}` anchor; stub (hidden or placeholder) for `<AwardsMenu>` | `tests/unit/awards-section.test.tsx`
- [ ] T036 [US1] Implement `<AwardsSection>` Server Component — flex-col mobile / `md:flex-row md:justify-between md:gap-20` desktop, maps `AWARDS` to correct card variant, renders placeholder `<AwardsMenu>` div (filled by US2) | `components/awards/AwardsSection.tsx`

### Page Composition & Metadata

- [ ] T037 [US1] Write failing E2E test for US1 acceptance scenarios: navigate `/awards`, assert title, 6 cards in order, Signature dual-tier; iterate over VN/EN/JA locales via `withLocale()` helper | `tests/e2e/awards.spec.ts`
- [ ] T038 [US1] Implement `app/(dashboard)/awards/page.tsx` Server Component — composes `<Keyvisual>` + `<main>` wrapper + `<AwardsTitle>` + `<AwardsSection>` (Kudos block stubbed); container `mx-auto max-w-[1152px] px-4 md:px-36 py-16 md:py-24 flex flex-col gap-16 md:gap-[120px]`; bg `#00101A` inherited from dashboard layout | `app/(dashboard)/awards/page.tsx`
- [ ] T039 [US1] Add `generateMetadata()` to page — locale-aware `title`, `description`, `openGraph.images` referencing `/images/og-awards.jpg` (1200 × 630), `alternates.canonical: '/awards'` | `app/(dashboard)/awards/page.tsx`

**Checkpoint**: User Story 1 complete. `/awards` renders all 6 cards in correct alternating layout across all three locales with correct currency / quantity formatting. The left rail has a placeholder for the menu (US2) but the page is independently testable.

---

## Phase 4: User Story 2 - Sticky Menu + Scroll-Spy (Priority: P1)

**Goal**: Add the interactive `<AwardsMenu>` — sticky left column on desktop, horizontal scroll-snap tab bar on mobile. Menu clicks smooth-scroll to target card and update URL hash; scroll-spy auto-activates the menu item matching the card in viewport.

**Independent Test**: Playwright E2E clicks each menu item and asserts hash + card in viewport; scrolls programmatically and asserts correct menu item becomes active; deep-link `/awards#mvp` lands on MVP card with that menu item active.

### Menu Component (TDD)

- [ ] T040 [P] [US2] Write failing unit test: `<AwardsMenu>` desktop — click item calls `scrollIntoView` on matching card, updates `location.hash` via `history.replaceState`; IO callback makes matching item `aria-current="true"` + `text-[#FFEA9E] underline underline-offset-8`; reduced-motion gives `behavior: 'auto'`; Enter/Space keys trigger scroll; mount with valid hash auto-scrolls; unknown hash → no active item; **isProgrammaticScroll guard** debounces IO for 600 ms after click | `tests/unit/awards-menu.test.tsx`
- [ ] T041 [P] [US2] Write failing unit test: `<AwardsMenu>` mobile (`window.matchMedia('(max-width: 767px)')` mocked match) — renders `flex-row overflow-x-auto snap-x snap-mandatory`; each item `min-h-[44px] min-w-[44px]` (FR-019); on activeSlug change calls `scrollIntoView({ inline: 'center', block: 'nearest' })`; icons 20×20 below `md`, 24×24 at/above | `tests/unit/awards-menu-mobile.test.tsx`
- [ ] T042 [US2] Implement `useScrollSpy(slugs, isProgrammaticRef)` hook — `IntersectionObserver` with `rootMargin: "-104px 0px -50% 0px"`, `threshold: 0`; ignores callbacks while `isProgrammaticRef.current === true`; exposes `activeSlug` state | `components/awards/AwardsMenu.tsx` (internal hook)
- [ ] T043 [US2] Implement `useReducedMotion()` hook — wraps `window.matchMedia('(prefers-reduced-motion: reduce)')` with subscription, returns `motionOk: boolean` | `components/awards/AwardsMenu.tsx` (internal hook)
- [ ] T044 [US2] Implement `<AwardsMenu>` Client Component (`"use client"`) — semantic `<nav aria-label={t('menuAriaLabel')}><ol><li><a href="#{slug}" aria-current={...}>…`; responsive classes (`sticky top-16 md:top-[104px] z-40 flex flex-row md:flex-col overflow-x-auto md:overflow-visible snap-x snap-mandatory md:snap-none scrollbar-hide bg-[#00101A] md:bg-transparent border-b border-[#2E3940] md:border-0`); click handler sets `isProgrammaticRef.current = true`, calls `scrollIntoView` with motion-respecting behavior, updates hash with `history.replaceState`, clears ref after 600 ms; icon size `h-5 w-5 md:h-6 md:w-6`; on-mount auto-scroll if `location.hash` matches a known slug | `components/awards/AwardsMenu.tsx`

### Integration Test

- [ ] T045 [US2] Write failing integration test: mount `<AwardsSection>` in happy-dom, manually dispatch IO entries (simulate scrolling), assert menu active-item state and URL hash update | `tests/integration/awards-scroll-spy.test.tsx`

### Wire Into Page

- [ ] T046 [US2] Replace placeholder in `<AwardsSection>` with real `<AwardsMenu slugs={…}>` passing the 6 slugs in order; ensure Server → Client boundary clean (no "use client" leaking above `AwardsMenu`) | `components/awards/AwardsSection.tsx`

### E2E

- [ ] T047 [US2] Extend `awards.spec.ts` with US2 scenarios: click "MVP" menu → `page.url()` ends with `#mvp` + MVP card in viewport; scroll to "Top Project" → its menu item has `aria-current="true"`; deep-link `/awards#signature-2025` auto-scrolls on mount; launch with `{ reducedMotion: 'reduce' }` context and verify menu clicks still work without animation | `tests/e2e/awards.spec.ts`

**Checkpoint**: User Story 2 complete. Menu is functional on desktop and mobile; scroll-spy updates the active item without oscillating during smooth-scroll.

---

## Phase 5: User Story 3 - Sun\* Kudos Promo (Priority: P2)

**Goal**: Render the Sun\* Kudos promo block below the awards list; "Chi tiết" / "Learn more" / "詳細" CTA navigates to `/kudos`.

**Independent Test**: Playwright E2E clicks the Kudos "Chi tiết" button on `/awards` and asserts navigation to `/kudos` (URL assertion only — `/kudos` page may 404 until built).

### KudosPromo Component

- [ ] T048 [US3] Inspect existing `components/homepage/KudosPromoBlock.tsx` — if visually and structurally identical to the awards-page Kudos promo, plan an extraction to `components/shared/KudosPromo.tsx` and note homepage migration for a follow-up PR; otherwise keep two variants | (decision only, no files)
- [ ] T049 [P] [US3] Write failing unit test: `<KudosPromo>` renders eyebrow (`awardsPage.kudos.eyebrow`), `<h2>` title (`awardsPage.kudos.title`), description paragraph, "KUDOS" logotype (SVN-Gotham 96 px OR Montserrat 900 fallback, color `#DBD1C1`), and `<Link href="/kudos">` CTA with trailing `<ArrowRightIcon />`; hover state underlines CTA; focus shows 2 px gold outline | `tests/unit/kudos-promo.test.tsx`
- [ ] T050 [US3] Implement `<KudosPromo>` Server Component — full-width dark block `bg-[#0F0F0F]`, flex-col mobile / `md:flex-row md:items-center md:justify-between md:h-[500px]`, content block 470 × 408 with eyebrow/title/description/CTA, KUDOS logotype at right (hidden below `md` or scaled to 56 px) | `components/awards/KudosPromo.tsx`

### Wire Into Page

- [ ] T051 [US3] Replace page stub with `<KudosPromo />`; verify gap spacing matches design-style `gap-[120px]` on desktop | `app/(dashboard)/awards/page.tsx`

### E2E

- [ ] T052 [US3] Extend `awards.spec.ts` with US3 scenario: scroll to Kudos block → assert eyebrow/title/description render; click "Chi tiết" → `await expect(page).toHaveURL('/kudos')` | `tests/e2e/awards.spec.ts`

**Checkpoint**: User Story 3 complete. Kudos block renders and its CTA navigates to `/kudos`.

---

## Phase 6: User Story 4 - Responsive Browsing (Priority: P2)

**Goal**: Verify all three breakpoints render correctly and meet responsive/a11y requirements. Most responsive behaviour is implemented in-component during US1–US3 (Tailwind responsive prefixes); this phase validates and captures baselines.

**Independent Test**: Playwright visual-regression snapshots at 390 × 844 (mobile), 768 × 1024 (tablet), 1440 × 6410 (desktop) pass; narrow-viewport (320 × 568) has no horizontal overflow on `document.body`.

- [ ] T053 [P] [US4] Extend `awards.spec.ts` with edge-case test: resize to 320 × 568, assert `document.body.scrollWidth <= window.innerWidth` (no horizontal overflow — spec edge case) | `tests/e2e/awards.spec.ts`
- [ ] T054 [P] [US4] Extend `awards.spec.ts` with edge-case test: at 390 × 844 viewport, assert `<AwardsMenu>` is a horizontal scroller (`overflow-x: auto`), sticky at `top: 64px` (header height) | `tests/e2e/awards.spec.ts`
- [ ] T055 [P] [US4] Extend `awards.spec.ts` with edge-case test: navigate `/awards` and assert ALL award description text is fully visible (FR-013) — iterate cards and check `scrollHeight === clientHeight` on each description | `tests/e2e/awards.spec.ts`
- [ ] T056 [P] [US4] Add visual-regression snapshots to `awards.spec.ts`: `awards-desktop.png` (1440×6410 full page), `awards-tablet.png` (768×1024), `awards-mobile.png` (390×844); re-run once to create baselines | `tests/e2e/awards.spec.ts`
- [ ] T057 [US4] Manual device QA on Chrome DevTools device mode for iPhone SE (375 px), iPhone 14 (390 px), Pixel 7 (412 px), Galaxy S8 (360 px); tune `scroll-snap` feel and active-tab centering if needed; document any findings in a comment on the PR | (manual QA)

**Checkpoint**: User Story 4 complete. Responsive behaviour validated at all spec breakpoints.

---

## Phase 7: User Story 5 - Global Header/Footer Navigation (Priority: P2)

**Goal**: Verify that the existing `<AppHeader>` / `<AppFooter>` integrate correctly with `/awards`: the "Awards Information" nav link auto-activates, language switching works, and all footer links are reachable.

**Independent Test**: Playwright E2E on `/awards` asserts the `nav.awardsInfo` link has `aria-current="page"` and gold+underline styling; language selector switches between VN/EN/JA and labels update in-place without a full reload.

- [ ] T058 [US5] Extend `awards.spec.ts` with US5.1 scenario: on `/awards`, the "Awards Information" link in `<AppHeader>` has `aria-current="page"` and the active styling classes applied | `tests/e2e/awards.spec.ts`
- [ ] T059 [US5] Extend `awards.spec.ts` with US5.4 scenario: language switch VN→EN→JA updates page content in place (no URL change, cookie-based); verify hero title and at least one award description change per locale | `tests/e2e/awards.spec.ts`
- [ ] T060 [US5] Extend `awards.spec.ts` with US5.2 + US5.5: logo click → `/`; avatar dropdown opens with Profile + Logout options (existing `<UserAvatar>` behaviour) | `tests/e2e/awards.spec.ts`
- [ ] T061 [US5] Extend `awards.spec.ts` with locale-change scroll-preservation edge case (spec edge case): scroll deep into `/awards`, switch locale, assert scroll position preserved within ±50 px and active menu item unchanged | `tests/e2e/awards.spec.ts`

**Checkpoint**: User Story 5 complete. Shared header/footer integration verified.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Accessibility, performance, localization QA, and release-gate items.

### Accessibility

- [ ] T062 [P] Write failing a11y E2E: run `@axe-core/playwright` against `/awards` in VN, EN, JA; assert zero critical and zero serious violations | `tests/e2e/awards-a11y.spec.ts`
- [ ] T063 Manual keyboard tab-order audit with focus ring visible: Logo → NavLinks → Language → Bell → Avatar → Menu items 1–6 → Card 1 content → … → Kudos "Chi tiết" → Footer links | (manual QA)
- [ ] T064 Verify `prefers-reduced-motion: reduce` at OS level: smooth-scroll disabled on menu clicks; card hover animations disabled | (manual QA)

### Performance

- [ ] T065 [P] Run Lighthouse on production build (`npm run build && npm start` + DevTools): assert Performance ≥ 90, Accessibility = 100, Best Practices = 100, SEO ≥ 90 (SC-004); record scores in PR description | (manual / CI)
- [ ] T066 [P] Image optimisation audit: confirm all `next/image` usages have appropriate `sizes` props; verify award thumbnails serve @2x on Retina devices via DevTools Network panel | (manual QA)

### Localization QA

- [ ] T067 [P] Manual locale smoke-test: switch VN/EN/JA via `<LanguageSelector>`; verify no missing-key warnings in console; brand names stay Latin; currency format flips VN `.` ↔ EN/JA `,`; quantities padded | (manual QA)
- [ ] T068 Request content-team sign-off on EN and JA translations (blocks production deploy) | (external)

### Release

- [ ] T069 Open PR with checklist linking to this `tasks.md`, spec, plan, design-style; include Lighthouse scores and visual-regression diffs if any | (git / GitHub)
- [ ] T070 Address PR review feedback; rebase on `main` if needed | (git)
- [ ] T071 Merge to `main` after green CI, Lighthouse gate, axe gate, visual-regression baseline accepted, and content signoff | (git)
- [ ] T072 Post-merge: verify staging deploy, run smoke suite against staging, then promote to production | (deploy)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — can start immediately.
- **Phase 2 (Foundation)**: Depends on Phase 1 completion — BLOCKS all user stories.
- **Phase 3 (US1)**: Depends on Phase 2. MVP milestone.
- **Phase 4 (US2)**: Depends on Phase 3 (needs the AwardsSection placeholder to wire into).
- **Phase 5 (US3)**: Depends on Phase 2 only (independent of US2); can start in parallel with Phase 4 if staffed.
- **Phase 6 (US4)**: Depends on Phases 3 + 4 + 5 (needs full page to run responsive tests).
- **Phase 7 (US5)**: Depends on Phase 3 (needs page to exist at `/awards`); can run in parallel with Phase 4/5.
- **Phase 8 (Polish)**: Depends on all desired user stories being complete.

### Within Each User Story

- Tests MUST be written and confirmed failing BEFORE implementation (TDD per constitution §III).
- Types / schemas / data before components that consume them.
- Presentational components before page composition.
- Unit tests before integration tests before E2E tests.

### Parallel Opportunities

- **Phase 1 [P] tasks**: T002, T003, T004, T005, T006 run in parallel; T001 first (branch).
- **Phase 2 [P] tasks**: T011, T013, T014, T017, T018, T019, T020 run in parallel.
- **Phase 3 component tasks marked [P]**: T021/T023/T025/T027/T029/T030/T031/T033/T035 — all test-writing tasks parallel (different files); implementation tasks (T022, T024, T026, T028, T032, T034, T036) can also run in parallel since they touch different component files.
- **Phase 4 [P] tasks**: T040 + T041 (two test files) in parallel.
- **Phase 5 [P] tasks**: T049 standalone.
- **Phase 6 [P] tasks**: T053/T054/T055/T056 all extend the same `awards.spec.ts` file — should run sequentially OR be split into separate `.spec.ts` files if parallelism is needed.
- **Phase 8 [P] tasks**: T062, T065, T066, T067 run in parallel.

### Critical Path (fastest ship order)

T001 → (T002–T010 parallel) → Phase 2 foundation (~T011–T020 parallel where marked) → T037/T038/T039 (US1 E2E + page) → T044 + T046 + T047 (US2 menu + wiring + E2E) → T050 + T051 (US3 kudos + wiring) → T062 (axe) + T065 (Lighthouse) → PR → merge.

---

## Implementation Strategy

### MVP First (Recommended)

1. Complete **Phase 1 (Setup) + Phase 2 (Foundation)**.
2. Complete **Phase 3 (US1 — View Award Catalogue)**.
3. **STOP and VALIDATE**: `/awards` renders all 6 cards correctly in all 3 locales. Run Lighthouse mobile + axe. Deploy to staging for PM review.
4. If acceptable as MVP (static menu placeholder), open PR for MVP deploy.

### Incremental Delivery

1. **PR 1**: Phases 1 + 2 (setup + foundation).
2. **PR 2**: Phase 3 (US1 — MVP) → Test → Staging → Sign-off.
3. **PR 3**: Phase 4 (US2 — Menu) → Test → Staging.
4. **PR 4**: Phase 5 (US3 — Kudos) + Phase 7 (US5 — Header verification) → Test → Staging.
5. **PR 5**: Phase 6 (US4 — Responsive baselines) + Phase 8 (Polish + Localization QA + content signoff) → Production deploy.

### Rollback Strategy

- `/awards` is a NEW route added to the dashboard group; rolling back is safe (revert the route file only). No existing page behaviour changes.
- The `<NavLinks>` and `<AppFooter>` already reference `/awards` — a rollback would leave those links pointing at a 404 briefly. Acceptable for a hotfix window.

---

## Validation & Completeness

All 19 FRs and 10 TRs from spec.md are traced to at least one task. Mapping highlights:

| FR / TR | Task(s) |
|---------|---------|
| FR-001 (`/awards` route) | T038 |
| FR-002 (6 cards in order) | T016, T035, T036, T037 |
| FR-003, FR-004 (quantity format) | T011, T012, T028 |
| FR-005 (currency format all locales) | T011, T012, T028 |
| FR-006 (Signature dual-tier) | T033, T034 |
| FR-007 (alternating layout) | T031, T032, T036 |
| FR-008 (responsive menu) | T040, T041, T044 |
| FR-009 (scroll-spy) | T042, T045 |
| FR-010 (active style) | T040, T044 |
| FR-011 (hash update) | T040, T044, T047 |
| FR-012 (Chi tiết → /kudos) | T049, T050, T052 |
| FR-013 (no truncation) | T027, T031, T055 |
| FR-014 (shared header/footer) | T058 (verified), no new impl |
| FR-015 (i18n all 3 locales) | T017–T020 |
| FR-015a (Latin brand names) | T018–T020 (name keys reused from homepage) |
| FR-016 (middleware auth) | existing infra; Phase 7 verifies |
| FR-017 (focus rings) | T044, T063 (audit) |
| FR-018 (reduced motion) | T040, T044, T064 |
| FR-019 (touch targets) | T041, T044 |
| TR-001 (perf / LCP) | T022, T065, T066 |
| TR-002 (security) | existing middleware |
| TR-003 (tech stack) | T022+ (Server Components default) |
| TR-004 (a11y) | T062, T063 |
| TR-005 (responsive) | T053–T057 |
| TR-006 (static data) | T013–T016 |
| TR-007 (SEO / OG) | T008, T039 |
| TR-008 (testing / TDD) | every "write failing test" task |
| TR-009 (folder structure) | all file paths follow plan.md |
| TR-010 (i18n) | T017–T020, T068 |

---

## Notes

- Commit after each task or small logical group (e.g. one test + its implementation).
- Run `npm test` (Vitest) before pushing; Playwright runs on PR CI.
- Update this `tasks.md` with `[x]` as tasks complete; open follow-up issues for any discovered scope changes.
- If the content team misses the JA translation deadline, T020 can ship with EN copy temporarily (passes key-parity), but T068 blocks production.
- The shared `<Icon>` rule in the constitution is **not** satisfied by this feature; acceptable per the documented deviation in plan.md. Raise a follow-up constitution PR if the team wants the unified abstraction.
