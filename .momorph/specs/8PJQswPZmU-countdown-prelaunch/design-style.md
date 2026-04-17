# Design Style: Countdown - Prelaunch Page

**Frame ID**: `2268:35127`
**Frame Name**: `Countdown - Prelaunch page`
**Screen ID**: `8PJQswPZmU`
**File Key**: `9ypp4enmFmdK3YAFJLIu6C`
**Figma Link**: https://www.figma.com/design/9ypp4enmFmdK3YAFJLIu6C/?node-id=2268-35127
**Extracted At**: 2026-04-17

---

## Design Tokens

### Colors

| Token Name | Hex Value | Opacity | Usage |
|------------|-----------|---------|-------|
| --color-bg-primary | #00101A | 100% | Page base background (deep navy) |
| --color-overlay-start | #00101A | ~100% (15.48%) | Gradient overlay top |
| --color-overlay-mid | #00121D | 46% (52.13%) | Gradient overlay mid |
| --color-overlay-end | #001320 | 0% (63.41%) | Gradient overlay bottom |
| --color-accent-gold | #FFEA9E | 100% | LED cell border (Details Text Primary 1) |
| --color-text-primary | #FFFFFF | 100% | Title & labels text |
| --color-digit-fill | #FFFFFF | 100% | LED digit glyph fill |
| --color-cell-gradient-start | #FFFFFF | 100% | LED cell background top |
| --color-cell-gradient-end | rgba(255,255,255,0.10) | 10% | LED cell background bottom |
| --color-cell-overlay-opacity | rgba(255,255,255,0.5) | 50% | Cell frosted overlay (opacity:0.5 on Rectangle 1) |

### Typography

| Token Name | Font Family | Size | Weight | Line Height | Letter Spacing |
|------------|-------------|------|--------|-------------|----------------|
| --text-title | Montserrat | 36px | 700 | 48px | 0 |
| --text-label | Montserrat | 36px | 700 | 48px | 0 |
| --text-digit | Digital Numbers | 73.728px | 400 | normal | 0 |

**Font loading notes:**
- Montserrat → load via `next/font/google` (weights 400, 700).
- Digital Numbers → load as local font (`/public/fonts/DigitalNumbers-Regular.ttf` or similar). Fallback stack: `"Digital Numbers", "Orbitron", "Courier New", monospace`.

### Spacing

| Token Name | Value | Usage |
|------------|-------|-------|
| --spacing-cell-gap | 21px | Gap between 2 digit cells inside one unit |
| --spacing-unit-gap | 60px | Gap between DAYS / HOURS / MINUTES blocks |
| --spacing-digit-to-label | 24px | Vertical gap between digit row & label |
| --spacing-title-to-time | 24px | Vertical gap between title and time row |
| --spacing-cover-padding-x | 144px | Horizontal padding of cover frame |
| --spacing-cover-padding-y | 96px | Vertical padding of cover frame |
| --spacing-section-gap | 60px | Gap inside countdown column |
| --spacing-group-gap | 120px | Gap at countdown outer wrapper |

### Border & Radius

| Token Name | Value | Usage |
|------------|-------|-------|
| --radius-cell | 12px | LED cell corner radius |
| --border-cell | 0.75px solid #FFEA9E | LED cell border |
| --backdrop-blur-cell | 24.96px | Frosted glass effect on LED cell |

### Shadows & Effects

| Token Name | Value | Usage |
|------------|-------|-------|
| --gradient-page-cover | `linear-gradient(18deg, #00101A 15.48%, rgba(0, 18, 29, 0.46) 52.13%, rgba(0, 19, 32, 0) 63.41%)` | Cover overlay over background image |
| --gradient-led-cell | `linear-gradient(180deg, #FFFFFF 0%, rgba(255,255,255,0.10) 100%)` | LED cell surface |
| --filter-cell-backdrop | `blur(24.96px)` | Backdrop-filter on cells |

---

## Layout Specifications

### Container

| Property | Value | Notes |
|----------|-------|-------|
| width | 100vw | Full viewport width |
| min-height | 100vh | Fills viewport (design reference: 1512 × 1077) |
| background-color | #00101A | Base dark navy |
| overflow | hidden | Background image may overflow |
| position | relative | For absolute-positioned layers |

### Layer Stack (z-index order)

1. **MM_MEDIA_BG Image** — background photo, object-fit: cover, covers full container.
2. **Cover** — linear gradient overlay darkening the top-left for text legibility.
3. **Countdown Content** — flex column, centered horizontally, stacks title + timer, anchored to vertical center (offset to upper-center band per Figma position startY=314 / endY=577 of a 1077px frame ≈ upper half).

### Flex Layout

**Cover wrapper (Bìa / Frame 487 → 523 → Countdown time):**

| Property | Value |
|----------|-------|
| display | flex |
| flex-direction | column |
| justify-content | center |
| align-items | center |
| gap | 24px (between title and time row) |
| padding | 96px 144px |

**Time row (Time / Frame 485):**

| Property | Value |
|----------|-------|
| display | flex |
| flex-direction | row |
| justify-content | center |
| align-items | center |
| gap | 60px |

**Unit block (1_Days / 2_Hours / 3_Minutes):**

| Property | Value |
|----------|-------|
| display | flex |
| flex-direction | column |
| align-items | flex-start |
| gap | 21px |

**Digit row (Frame 485 inside a unit):**

| Property | Value |
|----------|-------|
| display | flex |
| flex-direction | row |
| align-items | center |
| gap | 21px |

### Layout Structure (ASCII)

```
┌──────────────────────────────────────────────────────────────────────────┐
│ Page (w: 100vw, min-h: 100vh, bg: #00101A)                               │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │ <Layer 1> MM_MEDIA_BG Image (absolute, inset:0, object-fit: cover) │  │
│  └────────────────────────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │ <Layer 2> Cover Gradient (absolute, inset:0,                       │  │
│  │           bg: linear-gradient(18deg, #00101A 15%, …))              │  │
│  └────────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │ <Layer 3> Countdown (flex-col, items-center, gap: 24px,            │  │
│  │           padding: 96px 144px)                                     │  │
│  │                                                                    │  │
│  │   ┌────────────────────────────────────────────────────────────┐   │  │
│  │   │  Title: "Sự kiện sẽ bắt đầu sau"                           │   │  │
│  │   │  (Montserrat 700 / 36px / 48px, color: #FFFFFF, center)    │   │  │
│  │   └────────────────────────────────────────────────────────────┘   │  │
│  │                                                                    │  │
│  │   ┌────────────────────────────────────────────────────────────┐   │  │
│  │   │ Time Row (flex-row, gap: 60px, items-center)               │   │  │
│  │   │                                                            │   │  │
│  │   │  ┌─── 1_Days ───┐  ┌─── 2_Hours ───┐  ┌── 3_Minutes ──┐    │   │  │
│  │   │  │  [0] [0]      │  │  [0] [5]      │  │  [2] [0]       │   │   │  │
│  │   │  │   (77×123)    │  │   (77×123)    │  │   (77×123)     │   │   │  │
│  │   │  │    gap:21px   │  │    gap:21px   │  │    gap:21px    │   │   │  │
│  │   │  │      ↓ 21px   │  │      ↓ 21px   │  │      ↓ 21px    │   │   │  │
│  │   │  │    "DAYS"     │  │    "HOURS"    │  │    "MINUTES"   │   │   │  │
│  │   │  └───────────────┘  └───────────────┘  └────────────────┘   │   │  │
│  │   └────────────────────────────────────────────────────────────┘   │  │
│  └────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Component Style Details

### 1. Page Background Image (`MM_MEDIA_BG Image`)

| Property | Value | CSS |
|----------|-------|-----|
| **Node ID** | 2268:35129 | - |
| width | 1512px (100%) | `width: 100%` |
| height | 1077px (100vh) | `height: 100vh` |
| position | absolute | `position: absolute; inset: 0` |
| object-fit | cover | `object-fit: cover` |
| z-index | 0 | `z-index: 0` |

**Notes:** Use `next/image` with `fill` and `priority`. Fetch from `/public/images/prelaunch-bg.jpg` (or placeholder until final asset provided).

---

### 2. Cover Gradient (`Cover`)

| Property | Value | CSS |
|----------|-------|-----|
| **Node ID** | 2268:35130 | - |
| position | absolute | `position: absolute; inset: 0` |
| width | 100% | - |
| height | 100% | - |
| background | gradient | `background: linear-gradient(18deg, #00101A 15.48%, rgba(0,18,29,0.46) 52.13%, rgba(0,19,32,0) 63.41%)` |
| pointer-events | none | `pointer-events: none` |
| z-index | 1 | `z-index: 1` |

---

### 3. Title Text (`Awards Information Navigation Links`)

> ⚠️ **Figma node-name caveat**: The Figma node is named `Awards Information Navigation Links` because it reuses a shared text style token from another screen. The **actual rendered content** is `Sự kiện sẽ bắt đầu sau`. Do not let the node name mislead you — this is the H1 title of the Prelaunch page, not navigation.

| Property | Value | CSS |
|----------|-------|-----|
| **Node ID** | 2268:35137 | - |
| character | "Sự kiện sẽ bắt đầu sau" | - |
| font-family | Montserrat | `font-family: 'Montserrat', sans-serif` |
| font-size | 36px | `font-size: 36px` |
| font-weight | 700 | `font-weight: 700` |
| line-height | 48px | `line-height: 48px` |
| text-align | center | `text-align: center` |
| color | #FFFFFF | `color: #FFFFFF` |
| width | 100% (fills container) | `width: 100%` |

---

### 4. Digit Cell (`Group 5` / `Group 4` — Instance of componentId 186:2619)

| Property | Value | CSS |
|----------|-------|-----|
| **Node ID** | 2268:35141 (Tens) / 2268:35142 (Units) — repeats per unit | - |
| width | 77px | `width: 77px` |
| height | 123px | `height: 123px` |
| position | relative | `position: relative` |
| border-radius | 12px | `border-radius: 12px` |
| overflow | hidden | `overflow: hidden` |

**Background layer (`Rectangle 1`, Node: I…;186:2616):**
| Property | Value | CSS |
|----------|-------|-----|
| width | 76.8px | `width: 100%` |
| height | 122.88px | `height: 100%` |
| opacity | 0.5 | `opacity: 0.5` |
| border | 0.75px solid #FFEA9E | `border: 0.75px solid #FFEA9E` |
| background | linear-gradient(180deg, #FFFFFF 0%, rgba(255,255,255,0.10) 100%) | `background: linear-gradient(180deg, #FFFFFF 0%, rgba(255,255,255,0.10) 100%)` |
| backdrop-filter | blur(24.96px) | `backdrop-filter: blur(24.96px)` |
| border-radius | 12px | `border-radius: 12px` |

**Digit glyph (Node: I…;186:2617):**
| Property | Value | CSS |
|----------|-------|-----|
| font-family | "Digital Numbers" | `font-family: 'Digital Numbers', monospace` |
| font-size | 73.728px | `font-size: 73.728px` |
| font-weight | 400 | `font-weight: 400` |
| color | #FFFFFF | `color: #FFFFFF` |
| position | absolute, centered | `position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%)` |

**States** (no user interaction — states describe value changes only):
| State | Changes |
|-------|---------|
| Default | Digit "0" — "9" rendered |
| Tick | On each second, digits update — may apply 200ms fade/flip animation (optional, see Animation section) |
| Expired | All cells display "00" when `now >= NEXT_PUBLIC_LAUNCH_DATE` (component unmounts in favor of destination route) |

---

### 5. Unit Label (`DAYS` / `HOURS` / `MINUTES`)

> **Intentional left-alignment**: Each unit block is a fixed 175 px column (matching the widest label, "MINUTES" = 173 px). `DAYS` (103 px) and `HOURS` (138 px) are therefore **intentionally left-aligned** inside their 175 px container — not centered — so their leftmost edge lines up with the leftmost digit cell above. Do not center them; the offset under the digit cells is the design.


| Property | Value | CSS |
|----------|-------|-----|
| **Node ID** | 2268:35143 (DAYS) / 2268:35148 (HOURS) / 2268:35153 (MINUTES) | - |
| font-family | Montserrat | `font-family: 'Montserrat', sans-serif` |
| font-size | 36px | `font-size: 36px` |
| font-weight | 700 | `font-weight: 700` |
| line-height | 48px | `line-height: 48px` |
| color | #FFFFFF | `color: #FFFFFF` |
| text-transform | uppercase | `text-transform: uppercase` |
| text-align | left | `text-align: left` (design shows left-aligned under digit group) |

---

### 6. Unit Block Wrapper (`1_Days` / `2_Hours` / `3_Minutes`)

| Property | Value | CSS |
|----------|-------|-----|
| **Node ID** | 2268:35139 / 2268:35144 / 2268:35149 | - |
| display | flex | `display: flex` |
| flex-direction | column | `flex-direction: column` |
| gap | 21px | `gap: 21px` |
| align-items | flex-start | `align-items: flex-start` |
| width | 175px (1_Days:175, 2_Hours:175, 3_Minutes:175) | `min-width: 175px` (min, so label fits) |
| height | 192px | `height: 192px` |

---

## Component Hierarchy with Styles

```
PrelaunchPage (w: 100vw, min-h: 100vh, bg: #00101A, position: relative)
├── BackgroundImage (absolute inset:0, object-fit: cover, z: 0)
├── CoverGradient (absolute inset:0, gradient 18deg, z: 1, pointer-events: none)
└── CountdownSection (z: 2, flex-col, items-center, justify-center,
                      gap: 24px, px: 144px, py: 96px, min-h: 100vh)
    ├── Title ("Sự kiện sẽ bắt đầu sau",
    │         Montserrat 700 36px/48px, color: #FFFFFF, text-center)
    └── TimeRow (flex-row, items-center, justify-center, gap: 60px)
        ├── UnitBlock "1_Days" (flex-col, gap: 21px, items-start)
        │   ├── DigitRow (flex-row, gap: 21px, items-center)
        │   │   ├── DigitCell (w: 77, h: 123, radius: 12, border: 0.75 #FFEA9E)
        │   │   │   └── Digit (Digital Numbers 400, 73.728px, #FFFFFF)
        │   │   └── DigitCell (w: 77, h: 123)
        │   │       └── Digit
        │   └── Label ("DAYS", Montserrat 700 36px/48px, #FFFFFF, uppercase)
        ├── UnitBlock "2_Hours"
        │   ├── DigitRow (2 cells, "0" "5")
        │   └── Label ("HOURS")
        └── UnitBlock "3_Minutes"
            ├── DigitRow (2 cells, "2" "0")
            └── Label ("MINUTES")
```

---

## Responsive Specifications

### Breakpoints (from constitution / Tailwind defaults)

| Name | Min Width | Max Width |
|------|-----------|-----------|
| Mobile | 0 | 639px |
| Tablet (sm/md) | 640px | 1023px |
| Desktop (lg) | 1024px | 1279px |
| XL | 1280px | ∞ |

### Responsive Changes

The Figma design is desktop-only (1512px). Derived responsive rules:

#### Desktop (≥ 1024px) — design baseline
| Component | Value |
|-----------|-------|
| CountdownSection padding | 96px 144px |
| Time row gap | 60px |
| Digit cell | 77 × 123 px |
| Digit font-size | 73.728px |
| Title / Label font-size | 36px / line-height 48px |

#### Tablet (640px – 1023px)
| Component | Value |
|-----------|-------|
| CountdownSection padding | 48px 32px |
| Time row gap | 32px |
| Digit cell | 64 × 102 px |
| Digit font-size | 60px |
| Title / Label font-size | 28px / line-height 36px |

#### Mobile (< 640px)
| Component | Value |
|-----------|-------|
| CountdownSection padding | 24px 16px |
| Time row gap | 16px |
| Digit cell | 48 × 76 px |
| Digit font-size | 44px |
| Title font-size | 20px / line-height 28px |
| Label font-size | 14px / line-height 20px |
| Time row | Remain `flex-row` (3 units fit side-by-side at 48px wide) |

---

## Icon Specifications

No icons in this screen.

---

## Animation & Transitions

| Element | Property | Duration | Easing | Trigger |
|---------|----------|----------|--------|---------|
| Digit glyph | opacity (fade-out→in) | 200ms | ease-in-out | Value change (every tick when the digit changes) |
| Countdown section | opacity | 300ms | ease-out | Initial page mount |

**Notes:**
- Animation is optional polish. MUST NOT delay accurate time display.
- Respect `prefers-reduced-motion: reduce` — disable animations if set.

---

## Implementation Mapping

| Design Element | Figma Node ID | Tailwind / CSS Class | React Component |
|----------------|---------------|----------------------|-----------------|
| Page root | 2268:35127 | `relative min-h-screen w-full overflow-hidden bg-[#00101A]` | `<PrelaunchPage>` |
| Background image | 2268:35129 | `absolute inset-0 -z-0 object-cover` | `<Image fill priority />` |
| Cover gradient | 2268:35130 | `absolute inset-0 z-[1] pointer-events-none` + inline style gradient | `<div className="cover-gradient" />` |
| Countdown section | 2268:35131 | `relative z-[2] flex min-h-screen flex-col items-center justify-center gap-6 px-36 py-24` | `<Countdown />` |
| Title | 2268:35137 | `text-center font-bold text-white font-[Montserrat]` with `text-4xl leading-[48px]` | `<CountdownTitle>` |
| Time row | 2268:35138 | `flex flex-row items-center justify-center gap-[60px]` | `<TimeRow>` |
| Unit block (Days) | 2268:35139 | `flex flex-col items-start gap-[21px]` | `<TimeUnit label="DAYS" value={days} />` |
| Unit block (Hours) | 2268:35144 | same | `<TimeUnit label="HOURS" value={hours} />` |
| Unit block (Minutes) | 2268:35149 | same | `<TimeUnit label="MINUTES" value={minutes} />` |
| Digit row | 2268:35140 etc. | `flex flex-row items-center gap-[21px]` | `<DigitRow>` |
| Digit cell (shell) | 2268:35141 etc. | `relative h-[123px] w-[77px] overflow-hidden rounded-xl` | `<DigitCell>` |
| Cell inner gradient surface | I…;186:2616 | `absolute inset-0 rounded-xl border-[0.75px] border-[#FFEA9E] opacity-50 backdrop-blur-[24.96px]` with inline linear-gradient | Nested `<div>` in `<DigitCell>` |
| Digit glyph | I…;186:2617 | `absolute inset-0 flex items-center justify-center font-[\"Digital_Numbers\"] text-[73.728px] font-normal text-white` | `<DigitGlyph>` |
| Unit label | 2268:35143 / 2268:35148 / 2268:35153 | `font-[Montserrat] font-bold text-white text-4xl leading-[48px] uppercase` | `<UnitLabel>` |

**Tailwind config additions required:**
- Extend `fontFamily.digital` with `['"Digital Numbers"', 'Orbitron', 'monospace']`.
- Extend `fontFamily.montserrat` with `['Montserrat', 'system-ui', 'sans-serif']`.
- Custom colors: `bgPrimary: '#00101A'`, `accentGold: '#FFEA9E'`.

---

## Accessibility Notes

- Entire countdown region MUST have `role="timer"` and `aria-live="polite"` on the time row so screen readers announce updates without interrupting.
- Title should be `<h1>` — the page has no other heading.
- Color contrast: #FFFFFF on #00101A = **17.2:1** (WCAG AAA ✅). #FFFFFF on gradient overlay at worst case still ≥ 7:1.
- `prefers-reduced-motion: reduce` — disable tick animations.
- Do NOT use seconds updates that tick 60× per minute and flood screen readers; only announce minute changes (or mute polite region and provide a combined readable summary such as `aria-label="Còn lại X ngày Y giờ Z phút"` on the `<section>`).
- All text is pre-rendered and stylable; no text embedded in images.

---

## Notes

- **Background asset**: Figma references `lightgray` placeholder. Replace with the production asset exported from Figma (node 2268:35129) before shipping. Store in `/public/images/prelaunch-bg.jpg`.
- **Digital Numbers font**: Must be licensed and self-hosted under `/public/fonts/`. If license is restrictive, substitute with open-source `Orbitron` 400 — visual parity is acceptable.
- **LED cell depth**: The design uses a single rectangle with a faint horizontal seam not visible in the image, but the glass-morphism surface approximates the flip-clock aesthetic. A horizontal divider line across the cell can be optionally added at 50% height with `border-top: 0.75px solid rgba(0,0,0,0.15)` if flip-clock look is desired.
- **No SECONDS block** — design intentionally omits seconds. Spec MUST keep it that way unless UX approves expansion.
- All tokens above MUST be wired through `tailwind.config.ts` per constitution (§II. TailwindCSS).
- Icons rule from template N/A: no icons present.
