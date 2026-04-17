# Implementation Plan: Hệ thống giải (Awards System)

**Frame**: `zFYDgyj_pD-he-thong-giai`
**Date**: 2026-04-17
**Spec**: [`spec.md`](./spec.md)
**Design**: [`design-style.md`](./design-style.md)

---

## Summary

Implement the SAA 2025 Awards System page at `/awards`. It is a **long-scroll, static-content, fully-localized (VN / EN / JA)** page composed of a keyvisual, a title block, a two-column "Awards" section (sticky left `<AwardsMenu>` + 6 alternating award cards), a Sun\* Kudos promo block, and the shared `<AppHeader>` / `<AppFooter>`. All data is authored in-code (static arrays + locale JSON). The only interactive client logic is the menu's scroll-spy + click-to-scroll behaviour, with a horizontal-tab-bar variant on mobile (`< md`).

Much of the supporting infrastructure already exists (dashboard layout, AppHeader/AppFooter, ArrowRightIcon, 6 award thumbnails under `public/images/awards/`, `lib/data/award-categories.ts`, `homepage.awards.*` translation keys). The plan focuses on **extending** what exists rather than recreating it.

---

## Technical Context

**Language/Framework**: TypeScript 5 / Next.js 16 (App Router)
**Primary Dependencies**: React 19, TailwindCSS 4, `next-intl` (existing), Supabase JS (session check only)
**Database**: None (static data — no Supabase reads for this page)
**Testing**: Vitest + Testing Library (existing config: `vitest.config.ts`, `environment: "happy-dom"`, setup: `tests/setup.ts`), Playwright (existing config: `playwright.config.ts`, auth via `tests/e2e/auth.setup.ts`)
**Test file conventions** (verified against existing repo):
- Unit: `tests/unit/{kebab-case-name}.test.{ts,tsx}` — **flat** directory, **no sub-folders** (match existing `tests/unit/award-card.test.tsx`, `tests/unit/app-header.test.tsx`, etc.).
- Integration: `tests/integration/{kebab-case-name}.test.ts` — flat.
- E2E: `tests/e2e/{kebab-case-name}.spec.ts` — flat.
- Shared Vitest setup: `tests/setup.ts`.
**State Management**: React local state only — `activeSlug` in `<AwardsMenu>`, no global store additions
**API Style**: None — content is compiled into the bundle

---

## Constitution Compliance Check

*GATE: All must pass before implementation begins.*

- [x] **Clean code & feature-based organisation** (§I): components under `components/awards/`; static data under `lib/awards/`; utilities under `lib/utils/`.
- [x] **Tech stack discipline** (§II): Server Components by default, `"use client"` only for `<AwardsMenu>`; `next/link`, `next/image`; TailwindCSS utilities only; `strict: true` TypeScript; zod used for static-data validation at module load.
- [x] **TDD non-negotiable** (§III): Failing Vitest + Playwright tests MUST be written before each component's implementation. See Integration Testing Strategy.
- [x] **Security first (OWASP)** (§IV): No PII, no `dangerouslySetInnerHTML`; page gated by existing Supabase middleware; CSP + other headers already configured at the app level.
- [x] **Responsive UI standards & accessibility** (§V): Mobile-first with Tailwind `sm`/`md`/`lg`/`xl`; WCAG 2.1 AA (AAA text contrast on dark bg); 44×44 px touch targets on mobile; `prefers-reduced-motion` honored; full keyboard navigation.

### Violations (if any)

| Violation | Justification | Alternative Rejected |
|-----------|---------------|----------------------|
| Constitution says "all icons via shared `<Icon>` component" — such a unified component does **not** yet exist in the repo; we instead add per-icon SVG components under `components/ui/icons/` (matching the **already-established project pattern** seen in `ArrowRightIcon.tsx`, `BellIcon.tsx`, etc.). | The established pattern is per-icon SVG files; introducing a generic `<Icon name="..." />` abstraction on top of this page would balloon scope and duplicate work already done elsewhere. | Building a generic `<Icon>` now would require refactoring the 13 existing icon components across the app — out of scope. Recommend raising this as a separate constitution update PR. |

---

## Architecture Decisions

### Frontend Approach

- **Component structure**: Feature-scoped under `components/awards/`. One Server Component per logical block (`Keyvisual`, `AwardsTitle`, `AwardCard`, `SignatureAwardCard`, `KudosPromo`) and one Client Component (`AwardsMenu`) for scroll-spy & interactive click behaviour.
- **Server vs Client split**:
  - Page shell, keyvisual, title, all 6 cards, Kudos promo → **Server Components** (zero JS cost for static content).
  - `<AwardsMenu>` → **Client Component** (needs `IntersectionObserver`, `scrollIntoView`, `history.replaceState`).
- **Styling strategy**: Tailwind 4 utility classes only. No inline styles, no CSS-in-JS. Design tokens consumed as arbitrary-value classes (e.g. `bg-[#00101A]`, `text-[#FFEA9E]`) or Tailwind 4 `@theme` variables if globally shared.
- **Data fetching**: None. Static `AWARDS` array imported at module load; strings resolved via `getTranslations()` / `useTranslations()`.

### Backend Approach

- **None**. No API route, no Supabase read, no database migration. The existing Supabase Auth middleware protects `/awards` from unauthenticated users.

### Integration Points

- **Existing shared components** (reused, no modification):
  - `<AppHeader>` at `components/shared/AppHeader.tsx`
  - `<AppFooter>` at `components/shared/AppFooter.tsx`
  - `<NavLinks>` at `components/shared/NavLinks.tsx` (already has `/awards` in `NAV_ITEMS` and will auto-activate via `usePathname()`).
  - Dashboard layout `app/(dashboard)/layout.tsx` (already wraps children with `<AppHeader>` + `<AppFooter>`).
- **Existing icons reused**: `ArrowRightIcon`, `ChevronDownIcon`.
- **Existing static data extended**: `lib/data/award-categories.ts` + `types/homepage.ts` → either extend or replace with `lib/awards/*`. See Project Structure.
- **Existing i18n keys reused**: `homepage.awards.<slug>.name` (brand names are Latin across locales per FR-015a) — new long descriptions go under `awardsPage.<slug>.description`.

---

## Project Structure

### Documentation (this feature)

```text
.momorph/specs/zFYDgyj_pD-he-thong-giai/
├── spec.md              # Feature specification (reviewed)
├── design-style.md      # Design specifications (reviewed)
├── plan.md              # This file
├── tasks.md             # (next step — momorph.tasks)
└── assets/
    └── frame.png        # Figma frame screenshot (already downloaded)
```

### New Files

```text
app/
└── (dashboard)/
    └── awards/
        └── page.tsx                         # Server Component, metadata, composes page

components/
└── awards/
    ├── Keyvisual.tsx                        # Server — decorative hero banner
    ├── AwardsTitle.tsx                      # Server — eyebrow + divider + title
    ├── AwardsSection.tsx                    # Server — composes Menu + cards container
    ├── AwardsMenu.tsx                       # "use client" — sticky menu + scroll-spy
    ├── AwardCard.tsx                        # Server — standard card (image-left|image-right)
    ├── AwardImage.tsx                       # Server — 336×336 with gold border + onError fallback
    ├── AwardMetadataRow.tsx                 # Server — icon + label + value + unit/suffix
    ├── SignatureAwardCard.tsx               # Server — dual-tier variant of AwardCard
    └── KudosPromo.tsx                       # Server — Sun* Kudos block + CTA

lib/
├── awards/
│   ├── types.ts                             # Award, PrizeTier, KudosPromoContent types
│   ├── data.ts                              # AWARDS array + KUDOS_PROMO constant, zod-validated
│   └── schema.ts                            # zod schemas for AWARDS and KUDOS_PROMO
└── utils/
    └── format.ts                            # formatVND(value, locale), padQuantity(n)

components/ui/icons/
├── AwardQuantityIcon.tsx                    # Icon used in metadata row (if distinct from existing)
└── AwardValueIcon.tsx                       # Icon used in metadata row (if distinct from existing)

tests/
├── unit/                                    # Flat, kebab-case (match existing convention)
│   # Phase 1 — Foundation (3 files)
│   ├── format-vnd.test.ts                   # formatVND(value, locale), padQuantity(n)
│   ├── awards-data.test.ts                  # zod validation of AWARDS static array + key probes
│   ├── i18n-key-parity.test.ts              # vi/en/ja key-set equality under awardsPage.*
│   # Phase 2 — Presentational components (8 files)
│   ├── keyvisual.test.tsx                   # next/image, aria-hidden, gradient overlay
│   ├── awards-title.test.tsx                # eyebrow + divider + h1
│   ├── award-image.test.tsx                 # gold border, onError placeholder fallback
│   ├── award-metadata-row.test.tsx          # quantity vs value variants, FR-013 no truncation
│   ├── award-card-awards-page.test.tsx      # layout prop; distinct filename from existing homepage's award-card.test.tsx
│   ├── signature-award-card.test.tsx        # dual-tier + divider
│   ├── kudos-promo.test.tsx                 # eyebrow/title/desc/CTA href
│   └── awards-section.test.tsx              # composition: 6 cards, slug ids, SignatureAwardCard at D.5
│   # Phase 3 — Interactive menu (2 files)
│   ├── awards-menu.test.tsx                 # scroll-spy, click/keyboard, hash, reduced motion, isProgrammaticScroll
│   └── awards-menu-mobile.test.tsx          # mobile tab-bar: flex-row, snap, 44×44 touch, 20×20 icon, auto-center
├── integration/
│   └── awards-scroll-spy.test.tsx           # Integration: mount <AwardsSection>, dispatch IO entries, assert menu active state + hash update
└── e2e/
    ├── helpers/
    │   └── with-locale.ts                   # Sets NEXT_LOCALE cookie before nav for locale-loop tests
    ├── awards.spec.ts                       # US1 (6 cards render, localized) + US2 (menu click + scroll-spy + hash) + US3 (Kudos CTA) + edge cases + visual regression
    └── awards-a11y.spec.ts                  # axe-core accessibility scan on /awards (VN, EN, JA)

public/
├── images/
│   ├── keyvisual-awards.jpg                 # Dedicated LCP keyvisual asset (skip if homepage hero is reused)
│   └── og-awards.jpg                        # OG asset (1200 × 630) — TR-007
└── fonts/
    └── SVN-Gotham/                          # *.woff2 — skip if Montserrat 900 fallback accepted
        ├── SVN-Gotham-Regular.woff2
        └── SVN-Gotham-Bold.woff2            # (optional, depending on licence)
```

### Modified Files

| File | Changes |
|------|---------|
| `messages/vi.json` | Add `awardsPage.*` keys: `eyebrow`, `title`, `menuAriaLabel`, `quantityLabel`, `valueLabel`, `perAward`, `units.{don_vi,ca_nhan,tap_the}`, `signature.{individualLabel,groupLabel}`, `kudos.{eyebrow,title,description,cta}`, plus `metaTitle` + `metaDescription`, plus long-form `<slug>.description` per award. **Do NOT duplicate name keys** — reuse existing `homepage.awards.<slug>.name` (all 3 locales already hold the Latin brand names, verified). |
| `messages/en.json` | Same `awardsPage.*` keys in English. |
| `messages/ja.json` | Same `awardsPage.*` keys in Japanese. Names remain Latin by reusing the homepage keys (FR-015a). |
| `types/homepage.ts` | **Leave as-is**. New types go in `lib/awards/types.ts`. |
| `lib/data/award-categories.ts` | **Leave as-is** (used by homepage). The awards page uses a richer `lib/awards/data.ts`. Both share the same `slug` values so homepage hash-links (`/awards#top-talent`) continue to work. Optional cleanup in a later PR to migrate homepage to the new data source. |
| `app/globals.css` | Add a `.scrollbar-hide { scrollbar-width: none } .scrollbar-hide::-webkit-scrollbar { display: none }` utility under `@layer utilities` (Tailwind 4 has no such utility out-of-the-box and we avoid adding the `tailwind-scrollbar-hide` dep for one utility). |
| `tests/setup.ts` | Add a global `IntersectionObserver` polyfill/mock (happy-dom does not provide it). Minimal stub: `class MockIO { observe() {} unobserve() {} disconnect() {} takeRecords() { return [] } } globalThis.IntersectionObserver = MockIO as any`. Tests that need real IO behaviour will install their own spies per-test. |
| `playwright.config.ts` | Verify `projects` array routes the `awards*.spec.ts` files through the authenticated `storageState` fixture (existing `auth.setup.ts` already saves to `tests/e2e/.auth/user.json`). No config changes expected if already wired. |

### Dependencies

**Required to add** (one):
- `@axe-core/playwright` (`devDependency`) — for automated a11y scans in E2E tests per TR-004 / SC-004.

All other required packages already installed: `next@16.x`, `react@19.x`, `tailwindcss@4.x`, `next-intl`, `zod`, `vitest`, `@testing-library/react`, `playwright`.

### Media Assets

| Asset | Source / Status | Target path |
|-------|-----------------|-------------|
| 6 award thumbnails | **Already exist** at `public/images/awards/*.png` (from homepage build) | Reused as-is — 336 × 336 display size; verify source assets are ≥ 672 × 672 for Retina. If not, re-export. |
| Keyvisual (hero) image | Decide: **reuse** `public/images/homepage-hero-bg.jpg` OR export a dedicated awards keyvisual from Figma node `2167:5138` | `public/images/keyvisual-awards.jpg` (if new) |
| Kudos promo background | **Already exists** at `public/images/kudos-promo.png` (homepage) | Reuse |
| "Chi tiết" arrow icon | **Already exists** at `components/ui/icons/ArrowRightIcon.tsx` | Reuse |
| Target / quantity / value metadata icons | Verify in Figma — if simple check/coin icons, create minimal SVG components | `components/ui/icons/*.tsx` |
| SVN-Gotham local font (for "KUDOS" logotype) | Download `.woff2` from design team; place under `public/fonts/SVN-Gotham/`; register via `next/font/local` in `app/layout.tsx` | `public/fonts/SVN-Gotham/*.woff2` + font registration |

---

## Implementation Strategy

### Phase 0: Asset Preparation & Content Authoring

1. **Audit existing award thumbnails** at `public/images/awards/`. Verify each is at least 672 × 672 px (for 2x Retina at 336 × 336 display). Re-export from Figma if needed via `mcp__momorph__get_media_files` for screen `zFYDgyj_pD`.
2. **Decide on keyvisual source** — reuse `homepage-hero-bg.jpg` OR export a dedicated asset. If dedicated, call `mcp__momorph__get_figma_image` for node `2167:5138` and save to `public/images/keyvisual-awards.jpg`.
3. **Produce OG asset** (`public/images/og-awards.jpg`, 1200 × 630) — a crop/composite of the keyvisual + title overlay. Required by TR-007.
4. **Author long-form descriptions** in all 3 locales under `messages/{vi,en,ja}.json` → `awardsPage.<slug>.description`. VN copy comes from Figma; EN/JA translated by content team. Placeholders with VN fallbacks are NOT acceptable for release (per TR-010).
5. **Register SVN-Gotham font** (or accept Montserrat 900 fallback and move on). If adopted, place `.woff2` files under `public/fonts/SVN-Gotham/` and register via `next/font/local` in `app/layout.tsx`.
6. **Add `scrollbar-hide` utility** to `app/globals.css` under `@layer utilities`.
7. **Add IntersectionObserver mock** to `tests/setup.ts` (minimal class stub — see Modified Files table).
8. **Commit assets + setup changes** on a feature branch.

### Phase 1: Foundation — Types, Data, Formatters (no UI yet)

**TDD-first**: write tests before code.

1. **Write failing tests**: `tests/unit/format-vnd.test.ts`:
   - `formatVND(7_000_000, 'vi')` → `"7.000.000 VNĐ"`
   - `formatVND(7_000_000, 'en')` → `"7,000,000 VND"`
   - `formatVND(7_000_000, 'ja')` → `"7,000,000 VND"`
   - `formatVND(0, 'vi')` → `"0 VNĐ"` (edge — not expected in data but defensive)
   - `padQuantity(1)` → `"01"`; `padQuantity(10)` → `"10"`; `padQuantity(100)` → `"100"`.
2. **Implement** `lib/utils/format.ts`:
   - `formatVND(value, locale)` wraps `Intl.NumberFormat(locale === 'vi' ? 'vi-VN' : locale, { style: 'decimal' })` + appends `" VNĐ"` or `" VND"` by locale.
   - `padQuantity(n)` = `String(n).padStart(2, '0')` if `n < 10`, else `String(n)`.
3. **Write failing tests**: `tests/unit/awards-data.test.ts` — zod-parsed `AWARDS`:
   - Has exactly 6 entries.
   - `displayOrder` values are 1..6 unique.
   - Slugs are unique and non-empty.
   - Layouts alternate correctly: index 0/2/4 (D.1/D.3/D.5) = `image-left`; index 1/3/5 (D.2/D.4/D.6) = `image-right`.
   - Every `prizeTiers` entry has `quantity > 0` and `valueVnd > 0`.
   - All `nameKey` / `descriptionKey` / `tierLabelKey` references exist in `vi.json` (load + probe).
4. **Implement** `lib/awards/types.ts`, `lib/awards/schema.ts` (zod schemas), `lib/awards/data.ts` (populate the 6 awards + `KUDOS_PROMO`). Call `AwardsSchema.parse(AWARDS)` at module load in dev (guard with `process.env.NODE_ENV !== 'production'` to keep prod bundle tight).
5. **Write failing test**: `tests/unit/i18n-key-parity.test.ts` — asserts `Object.keys(vi.awardsPage)` deep-equals `Object.keys(en.awardsPage)` deep-equals `Object.keys(ja.awardsPage)` (recursive key-set, ignore values).
6. **Populate** `awardsPage.*` keys in all three locale files (from spec.md §Key Entities translation table); test passes.

### Phase 2: Static Presentational Components (Server, no interactivity)

**TDD-first**: component tests with `@testing-library/react` under `tests/unit/` (flat).

1. `Keyvisual.tsx` — **test** (`keyvisual.test.tsx`): renders a `next/image` marked `aria-hidden="true"` with empty `alt=""`; background gradient overlay present; **implement**.
2. `AwardsTitle.tsx` — **test** (`awards-title.test.tsx`): eyebrow from `awardsPage.eyebrow`, `<hr>` divider, heading from `awardsPage.title`; heading is an `<h1>`; implement.
3. `AwardImage.tsx` — **test** (`award-image.test.tsx`): renders `next/image` with correct alt (award name, Latin), gold border class (`border border-[#FFEA9E]`); on `onError` swaps to the 336×336 placeholder frame with gold name overlay; implement.
4. `AwardMetadataRow.tsx` — **test** (`award-metadata-row.test.tsx`): `variant="quantity"` renders icon + `awardsPage.quantityLabel` + padded number + localized unit; `variant="value"` renders icon + `awardsPage.valueLabel` + `formatVND(...)` + optional `perAward` suffix; **FR-013 check**: row DOES NOT truncate; implement.
5. `AwardCard.tsx` — **test** (`award-card-awards-page.test.tsx`, distinct filename from the homepage's existing `award-card.test.tsx`): `layout="image-left"` renders `md:flex-row`; `layout="image-right"` renders `md:flex-row-reverse`; title is an `<h2>`; metadata rendered via `<dl>`; **FR-013 check**: long description fully visible (no `line-clamp`); implement.
6. `SignatureAwardCard.tsx` — **test** (`signature-award-card.test.tsx`): renders both `prizeTiers` entries with `<hr>` between; tier labels (`awardsPage.signature.individualLabel` / `.groupLabel`) rendered; implement.
7. `KudosPromo.tsx` — **test** (`kudos-promo.test.tsx`): eyebrow / title / description / KUDOS logotype / `<Link href="/kudos">` CTA present with `aria-label` from `awardsPage.kudos.cta`; implement. *(Before implementation: inspect `components/homepage/KudosPromoBlock.tsx` — if visually and structurally identical, extract to `components/shared/KudosPromo.tsx` and refactor both sites to use it. Otherwise keep two variants.)*
8. `AwardsSection.tsx` — **test** (`awards-section.test.tsx`): renders `<AwardsMenu>` + exactly 6 award cards (5 `AwardCard`, 1 `SignatureAwardCard` at position 5); cards are anchored with `id={slug}`; implement. *(This is a Server Component that imports the `<AwardsMenu>` Client Component — verify with a build-time check that there is no "use client" leaking into the tree above it.)*

### Phase 3: Interactive Menu + Scroll-Spy (Client Component)

**TDD-first**: `tests/unit/awards-menu.test.tsx` + `tests/unit/awards-menu-mobile.test.tsx` with the IO mock from `tests/setup.ts` plus spies per-test.

1. **Write failing tests** (`awards-menu.test.tsx`):
   - Clicking a menu item calls `scrollIntoView` on the matching card (spied) AND updates `location.hash` to `#<slug>` via `history.replaceState`.
   - When IO callback reports card in view, the matching item gets `aria-current="true"` and the gold + underline classes.
   - `prefers-reduced-motion: reduce` → `scrollIntoView({ behavior: 'auto' })` (no smooth).
   - Keyboard: Enter and Space on a focused menu item trigger the same scroll behaviour.
   - On mount with `location.hash = "#mvp"`, auto-scrolls to MVP card and activates its menu item.
   - Unknown hash (`#bogus`) → no active item, no scroll.
   - **isProgrammaticScroll guard**: immediately after a menu click, IO callbacks are ignored for ~600 ms (debounced) so the active item doesn't oscillate during the smooth-scroll animation.
2. **Write failing mobile tests** (`awards-menu-mobile.test.tsx`, with `window.matchMedia` mocked to return `(max-width: 767px)` match):
   - Menu renders as horizontal `flex-row overflow-x-auto snap-x snap-mandatory` at `< md`.
   - Each item has `min-h-[44px] min-w-[44px]` satisfying FR-019.
   - On `activeSlug` change, the active tab is called with `scrollIntoView({ inline: 'center', block: 'nearest', behavior: motionOk ? 'smooth' : 'auto' })`.
   - Icon size reduces to 20×20 on mobile (per design-style §Mobile).
3. **Implement** `AwardsMenu.tsx` (`"use client"`):
   - Custom hook `useScrollSpy(slugs, isProgrammaticRef)` using `IntersectionObserver` with `rootMargin: "-104px 0px -50% 0px"`, `threshold: 0`. Ignores entries while `isProgrammaticRef.current === true`.
   - Second hook `useReducedMotion()` wraps `window.matchMedia('(prefers-reduced-motion: reduce)')` with a subscription.
   - Click handler: set `isProgrammaticRef.current = true`, call `scrollIntoView`, update hash with `history.replaceState(null, '', '#' + slug)`, and after 600 ms clear the ref.
   - Menu render: `<nav aria-label={t('menuAriaLabel')}><ol className="flex flex-row md:flex-col md:gap-4 overflow-x-auto md:overflow-visible snap-x snap-mandatory md:snap-none scrollbar-hide sticky top-16 md:top-[104px] z-40 bg-[#00101A] md:bg-transparent border-b border-[#2E3940] md:border-0">...`.
   - Each `<li>` contains `<a href="#{slug}" aria-current={isActive ? 'true' : undefined} className={...active ? 'text-[#FFEA9E] underline underline-offset-8' : 'text-white hover:bg-white/5'}>`.
   - Icon size responsive: `<TargetIcon className="h-5 w-5 md:h-6 md:w-6" />` (20 px mobile, 24 px desktop).
4. **Integration test** (`tests/integration/awards-scroll-spy.test.tsx`): render `<AwardsSection>` in happy-dom, manually dispatch IO entries → verify active changes and URL hash updates.

### Phase 4: Page Composition + Metadata

**TDD-first**: `tests/e2e/awards.spec.ts` (Playwright) — end-to-end tests written failing before the page exists.

1. **Write failing E2E** (`awards.spec.ts`, uses existing auth `storageState` from `tests/e2e/auth.setup.ts`):
   - **US1 (VN default)**: Navigate `/awards`. Assert title renders (per VN locale), exactly 6 cards render in slug order, Signature 2025 card shows both tiers with divider. Verify EN and JA by switching locale cookie and reloading (use a custom fixture `withLocale(page, 'en')`).
   - **US2**: Click "MVP" menu item → `page.url()` ends with `#mvp` → MVP card is in viewport (`page.locator('#mvp').isInViewport()`). Scroll programmatically to "Top Project" card → `awards-menu [aria-current="true"]` text is "Top Project".
   - **US3**: Kudos "Chi tiết" click → `await expect(page).toHaveURL('/kudos')` (page may 404 until `/kudos` is built — assert URL change only, not page content).
   - **Edge — deep link**: `page.goto('/awards#signature-2025')` → card scrolled into view on mount → menu item active.
   - **Edge — reduced motion**: Launch with `{ reducedMotion: 'reduce' }` context → smooth-scroll is disabled (verify via DOM inspection: menu click still works).
   - **Edge — long description**: Navigate `/awards`, assert full description text visible (no CSS truncation — assert `scrollHeight === clientHeight` on the description element).
   - **Edge — narrow viewport (< 360 px)**: Resize viewport to 320 × 568. Assert no horizontal overflow on the body (`document.body.scrollWidth <= window.innerWidth`).
   - **Edge — mobile tab bar**: At 390 × 844 viewport, assert `<AwardsMenu>` is a horizontal scroller (`overflow-x: auto`), sticky at `top: 64px` (header height).
2. **Write failing a11y E2E** (`awards-a11y.spec.ts`):
   - Run `@axe-core/playwright` against `/awards` in VN, EN, JA. Assert zero critical and zero serious violations.
3. **Install `@axe-core/playwright`** if not already present (`pnpm add -D @axe-core/playwright`).
4. **Implement** `app/(dashboard)/awards/page.tsx`:
   - Server Component.
   - `export async function generateMetadata({ searchParams })` reads locale (via `next-intl` server helper), returns:
     - `title`: `awardsPage.metaTitle` per locale (e.g. "Hệ thống giải thưởng SAA 2025 | Sun\*").
     - `description`: `awardsPage.metaDescription`.
     - `openGraph`: `{ images: [{ url: '/images/og-awards.jpg', width: 1200, height: 630 }], title, description }`.
     - `alternates.canonical`: `/awards`.
   - Structure:
     ```tsx
     <>
       <Keyvisual />
       <main className="mx-auto w-full max-w-[1152px] px-4 md:px-36 py-16 md:py-24 flex flex-col gap-16 md:gap-[120px]">
         <AwardsTitle />
         <AwardsSection />
         <KudosPromo />
       </main>
     </>
     ```
   - `<AppHeader />` / `<AppFooter />` are already provided by `app/(dashboard)/layout.tsx` — do NOT wrap them again.

### Phase 5: Responsive & Accessibility Polish

1. **Mobile device QA**: Verify the horizontal tab bar on Chrome DevTools device mode for iPhone SE (375 px), iPhone 14 (390 px), Pixel 7 (412 px), Galaxy S8 (360 px). Tune `scroll-snap` feel. Verify active-tab auto-centers smoothly.
2. **Keyboard tab order audit**: Tab through the full page with no mouse. Verify order: Logo → NavLinks → Language → Bell → Avatar → Menu items 1–6 → Card 1 content → Card 2 content → ... → Kudos "Chi tiết" → Footer links. Focus ring (`outline-2 outline-[#FFEA9E] outline-offset-2`) visible on every stop.
3. **Reduced motion verification**: Toggle OS-level `prefers-reduced-motion: reduce`, reload `/awards`, click menu items → verify instant jump (no smooth-scroll).
4. **Visual regression tests** (add to `awards.spec.ts`):
   - `await expect(page).toHaveScreenshot('awards-desktop.png', { fullPage: true })` at 1440 × 6410.
   - `awards-tablet.png` at 768 × 1024.
   - `awards-mobile.png` at 390 × 844.
   - Include one screenshot per locale (VN / EN / JA) at 1440.
5. **Lighthouse run** in production build (`pnpm build && pnpm start`): Performance ≥ 90, Accessibility = 100, Best Practices = 100, SEO ≥ 90 (matches SC-004).
6. **Axe violations count**: zero critical / zero serious across VN / EN / JA (already covered by `awards-a11y.spec.ts`).
7. **Image optimisation audit**: confirm all `next/image` usages have proper `sizes` props; confirm award thumbnail DPR > 1 by inspecting Network tab in a Retina simulation.

### Phase 6: Localization QA & Release

1. **Manual locale smoke-test**: VN / EN / JA — switch via `<LanguageSelector>` in the header:
   - All labels render; no missing-key warnings in console.
   - Brand names stay Latin across all three locales.
   - Currency format: VN `.` separator + `VNĐ`; EN / JA `,` separator + `VND`.
   - Quantities padded (`01`, `02`, `10`).
2. **Locale-change scroll preservation** (spec edge case): Scroll deep into the awards list on `/awards`. Switch locale. Verify scroll position and active menu item are preserved (cookie-based swap, not full reload). If Next.js router behaviour does NOT preserve scroll, mitigate by capturing `window.scrollY` before `router.refresh()` and restoring after mount.
3. **Content team sign-off** on EN & JA translations (content QA pass).
4. Final PR review, merge, deploy to staging, staging QA, production deploy.

---

## Integration Testing Strategy

### Test Scope

- [x] **Component / module interactions**: `AwardsSection` composes `AwardsMenu` + 6 cards; scroll-spy updates menu on real scroll; hash nav works.
- [x] **External dependencies**: None — static content.
- [x] **Data layer**: zod validates `AWARDS` at module load (fails build on typos).
- [x] **User workflows**: US1 (view all cards), US2 (menu click + scroll-spy), US3 (Kudos CTA → `/kudos`).

### Test Categories

| Category | Applicable? | Key Scenarios |
|----------|-------------|---------------|
| UI ↔ Logic | Yes | Menu click → scroll + hash; scroll-spy → active state; responsive layout swap at `md:` breakpoint |
| Service ↔ Service | No | — |
| App ↔ External API | No | — (no API for this page; header children reuse existing tests) |
| App ↔ Data Layer | Yes | `AWARDS` zod-parse; i18n key-parity across 3 locales |
| Cross-platform | Yes | Desktop (1440), tablet (768), mobile (390) — visual regression |

### Test Environment

- **Environment type**: happy-dom for Vitest units (project default); Playwright with Chromium locally and on CI.
- **Test data strategy**: Real `AWARDS` static data — no fixtures needed. Locale files loaded via `next-intl` test utilities.
- **Isolation approach**: Fresh DOM per Vitest test. Playwright starts dev server with a pre-authenticated Supabase test session (existing fixture).

### Mocking Strategy

| Dependency | Strategy | Rationale |
|------------|----------|-----------|
| `IntersectionObserver` | Global mock in `tests/setup.ts`; per-test spies to capture callbacks | happy-dom does not implement IO |
| `Element.scrollIntoView` | Spy | Verify called with correct options |
| `window.matchMedia('(prefers-reduced-motion: reduce)')` | Mock both values | Verify motion-on and motion-off behaviour |
| `usePathname` / `useRouter` | Mock (existing pattern from `NavLinks.test`) | Ensure active state activation |
| Supabase Auth | Real (existing test fixture) | Middleware is tested globally; reuse |
| `next-intl` translations | Real — load locale JSON directly | Catches real missing-key bugs |

### Test Scenarios Outline

1. **Happy Path**
   - [ ] Page renders with all 6 cards in the correct alternating layout.
   - [ ] Signature 2025 card renders both tiers with divider.
   - [ ] Clicking a menu item smooth-scrolls and updates hash.
   - [ ] Scrolling naturally updates the active menu item.
   - [ ] Kudos "Chi tiết" navigates to `/kudos`.
2. **Localization**
   - [ ] VN / EN / JA all render; brand names stay Latin across all; currency format differs correctly.
3. **Edge Cases**
   - [ ] Deep-link `/awards#mvp` auto-scrolls to MVP on load.
   - [ ] Deep-link `/awards#bogus` loads at top with no active item.
   - [ ] Image `onError` renders the gold-bordered fallback.
   - [ ] `prefers-reduced-motion` disables smooth-scroll.
   - [ ] Mobile layout: horizontal tab bar scrolls, active tab auto-centers.
4. **Accessibility**
   - [ ] Keyboard tab through menu → Enter activates → card gets focus or is scrolled to.
   - [ ] Axe reports zero critical/serious issues.
   - [ ] `aria-current="true"` on the active menu link.

### Tooling & Framework

- **Unit / integration**: Vitest + `@testing-library/react` (existing config). Shared setup in `tests/setup.ts`.
- **E2E**: Playwright, **Chromium only** (per `playwright.config.ts`). Auth via storage-state file `tests/e2e/.auth/user.json`, produced by `tests/e2e/auth.setup.ts` on first run. (Note: there is no `tests/e2e/fixtures/` directory — do NOT create one; match the existing pattern.)
- **Locale fixture** (new, small helper to create): `tests/e2e/helpers/with-locale.ts` — exports `withLocale(page, locale)` that sets the `NEXT_LOCALE` cookie before navigation. Used by `awards.spec.ts` to iterate over VN / EN / JA without depending on a UI language-selector click.
- **Accessibility**: axe-core (via `@axe-core/playwright`) integrated in the E2E suite (`awards-a11y.spec.ts`).
- **Visual regression**: Playwright's `toHaveScreenshot` matcher at 3 widths (390, 768, 1440), 3 locales at 1440.
- **CI integration**: runs in existing GitHub Actions workflow — Vitest on every push, Playwright on PRs (Chromium, `workers: 1` in CI).

### Coverage Goals

| Area | Target | Priority |
|------|--------|----------|
| Formatters (`formatVND`, `padQuantity`) | 100 % | High |
| `AwardsMenu` (scroll-spy, click, hash, reduced-motion) | 90 % | High |
| Cards (`AwardCard`, `SignatureAwardCard`) — layout prop, metadata rendering | 90 % | High |
| i18n key parity (static check) | 100 % (build-breaking) | High |
| Page composition (`page.tsx`) | Smoke via Playwright | Medium |
| Accessibility (axe) | zero critical / serious | High |

---

## Dependencies & Prerequisites

### Required Before Start

- [x] `.momorph/constitution.md` reviewed.
- [x] `.momorph/specs/.../spec.md` status "Reviewed — ready for planning".
- [x] `.momorph/specs/.../design-style.md` finalised.
- [x] `<AppHeader>` / `<AppFooter>` / `<NavLinks>` in place (`/awards` already in `NAV_ITEMS`).
- [x] `app/(dashboard)/layout.tsx` in place (already wraps with AppHeader + AppFooter).
- [x] 6 award thumbnails already exist at `public/images/awards/*.png` (pending Retina sharpness audit).
- [x] `lib/data/award-categories.ts` exists — can sit alongside new `lib/awards/data.ts`.
- [x] `messages/{vi,en,ja}.json` i18n infrastructure wired — homepage.awards names are Latin in all 3 locales (verified).
- [x] `tests/setup.ts`, `tests/e2e/auth.setup.ts`, `vitest.config.ts`, `playwright.config.ts` — all in place.
- [ ] Long-form award descriptions (from Figma) authored in VN; EN & JA translations produced.
- [ ] OG keyvisual asset (1200 × 630) produced.
- [ ] SVN-Gotham font asset (or accept Montserrat-900 fallback).
- [ ] `@axe-core/playwright` dev dependency added.

### External Dependencies

- Content team (for EN / JA translations — content freeze date TBD).
- Design team (for SVN-Gotham font file, if used).
- npm / package registry (for `@axe-core/playwright` install — ~60 KB).

---

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Scroll-spy misfires on fast scroll or during programmatic smooth-scroll loop | Medium | Medium | `rootMargin: "-104px 0px -50% 0px"` + `threshold: 0`; temporarily disable spy for ~600 ms after a menu click (flag `isProgrammaticScroll`) to avoid oscillation. Playwright E2E covers this. |
| Mobile horizontal-tab-bar UX feels cramped or unclear | Medium | Medium | Use `scroll-snap-type: x mandatory`, visible underline on active, auto-center active tab on state change. If still poor after Phase 5 device testing, fall back to collapsible accordion (Q-A alternative b). |
| Japanese translations delayed by content team | Medium | Medium | Parity test is build-breaking. Interim workflow: author `ja.json` keys with EN values so the parity test passes; gate release on a content-team signoff checklist that audits each `ja.json` value for actual Japanese text. Blocks prod deploy, not dev/staging. |
| Re-exporting 6 Retina thumbnails blocks on design team availability | Low | Low | Existing `.png` files under `public/images/awards/` appear usable — start with them; re-export only if sharpness audit fails at 2x. |
| SVN-Gotham font licence unclear | Low | Low | Fallback to Montserrat 900 tightly letter-spaced visually approximates the compressed logotype; noted in design-style.md. |
| AwardCard `image-right` (flex-row-reverse) introduces a11y reading-order mismatch (screen readers still go DOM order — image → content even when visually reversed) | Low | Low | Keep DOM order `image → content` always; flip visually with `flex-row-reverse`. Screen-reader order stays semantic and consistent across all 6 cards. |

### Estimated Complexity

- **Frontend**: Medium (8 new components, one client-side scroll-spy hook, responsive dual-mode menu).
- **Backend**: None — no API, no DB migration.
- **Testing**: Medium (scroll-spy & IO mocking; locale parity; visual regression at 3 widths).

---

## Next Steps

After plan approval:

1. Run `/momorph.tasks` to generate the phase-by-phase task breakdown.
2. Review tasks for parallelization (Phase 1 formatters/types can run in parallel with Phase 2 presentational components).
3. Begin Phase 0 → 1 → 2 → 3 → 4 → 5 → 6.
4. PR split suggestion (target ~300–600 lines-changed per PR):
   - **PR 1** — Phase 0 + 1: assets, types, data, formatters, i18n keys, IO mock, scrollbar-hide CSS.
   - **PR 2** — Phase 2: all presentational components + their unit tests.
   - **PR 3** — Phase 3: `<AwardsMenu>` + scroll-spy hook + integration test.
   - **PR 4** — Phase 4: page composition, metadata, E2E + a11y test suite, visual regression baselines.
   - **PR 5** — Phase 5 + 6: responsive polish, Lighthouse gate, locale QA, content signoff.

---

## Notes

- **Existing `lib/data/award-categories.ts` is retained** for the homepage use-case. The awards page consumes a richer dataset at `lib/awards/data.ts`. They share `slug` values (`top-talent`, `top-project`, …, `mvp`) — the hash link from the homepage (`/awards#top-talent`) will continue to work.
- **Dual layout (`image-left` / `image-right`)** is purely visual. DOM order is always `image → content` so that `Tab` order and screen-reader narration are consistent across all 6 cards. Use `md:flex-row-reverse` for the visual mirror.
- **KudosPromo reuse**: The homepage already has a `KudosPromoBlock` at `components/homepage/KudosPromoBlock.tsx`. Inspect it before Phase 2 — if identical in shape, extract a shared `components/shared/KudosPromo.tsx` and delete the homepage duplicate. Otherwise, keep two variants.
- **Menu item icon (MM_MEDIA_Target)**: Figma shows a small target/crosshair icon before each menu label. If an existing icon in `components/ui/icons/` matches, reuse; otherwise create a minimal SVG component.
- **Analytics explicitly excluded** from v1 (per resolved clarification #8). Revisit in a follow-up ticket.
- **No Supabase / no API** for this page. The Supabase `supabase` folder and `lib/supabase/*` files are untouched by this feature.
- The `scrollbar-hide` utility is NOT part of Tailwind 4 core. Either add the `tailwind-scrollbar-hide` plugin OR inline the CSS via `@layer utilities` in `app/globals.css`. Plan: inline CSS (avoids a dependency for one utility).
