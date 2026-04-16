# Design Style: Homepage SAA

**Frame ID**: `2167:9026`
**Screen ID**: `i87tDx10uM`
**Frame Name**: Homepage SAA
**Figma Link**: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/i87tDx10uM
**Extracted At**: 2026-04-16

---

## Design Tokens

### Colors

| Token Name | Hex Value | Opacity | Usage |
|------------|-----------|---------|-------|
| --color-bg-primary | #00101A | 100% | Page background |
| --color-header-bg | #101417 | 80% | Header semi-transparent overlay |
| --color-btn-primary | #FFEA9E | 100% | CTA buttons (ABOUT AWARDS hover), FAB bg |
| --color-btn-primary-text | #00101A | 100% | CTA button text |
| --color-btn-outline | transparent | - | CTA button normal (ABOUT KUDOS) with border |
| --color-btn-outline-border | #FFEA9E | 10% | Outline button border |
| --color-text-white | #FFFFFF | 100% | Body text, headings |
| --color-text-gold | #FFEA9E | 100% | Active nav link, section labels |
| --color-footer-border | #2E3940 | 100% | Footer top border, card borders |
| --color-card-bg | transparent | - | Award card background |
| --color-notification-badge | #EF4444 | 100% | Bell badge red |

### Typography

| Token Name | Font Family | Size | Weight | Line Height | Letter Spacing |
|------------|-------------|------|--------|-------------|----------------|
| --text-countdown-digit | Montserrat | 48px | 700 | 56px | 0 |
| --text-countdown-label | Montserrat | 14px | 600 | 20px | 2px |
| --text-coming-soon | Montserrat | 16px | 600 | 24px | 4px |
| --text-event-info | Montserrat | 16px | 500 | 24px | 0 |
| --text-cta-button | Montserrat | 16px | 700 | 24px | 0.5px |
| --text-section-label | Montserrat | 14px | 600 | 20px | 2px |
| --text-section-title | Montserrat | 32px | 700 | 40px | 0 |
| --text-section-desc | Montserrat | 16px | 400 | 28px | 0 |
| --text-card-title | Montserrat | 20px | 700 | 28px | 0 |
| --text-card-desc | Montserrat | 14px | 400 | 22px | 0 |
| --text-card-link | Montserrat | 14px | 600 | 20px | 0.5px |
| --text-body | Montserrat | 16px | 400 | 28px | 0 |
| --text-nav-link | Montserrat | 16px | 700 | 24px | 0.15px |
| --text-nav-active | Montserrat | 16px | 700 | 24px | 0.15px |
| --text-hero-root | Montserrat | 120px | 700 | 130px | 0 |
| --text-kudos-title | Montserrat | 24px | 700 | 32px | 0 |
| --text-footer | Montserrat Alternates | 16px | 700 | 24px | 0 |

### Spacing

| Token Name | Value | Usage |
|------------|-------|-------|
| --spacing-page-x | 144px | Main content horizontal padding |
| --spacing-header-x | 144px | Header horizontal padding |
| --spacing-header-y | 12px | Header vertical padding |
| --spacing-hero-y | 96px | Hero section vertical padding |
| --spacing-section-gap | 120px | Gap between major page sections |
| --spacing-countdown-gap | 24px | Gap between countdown units |
| --spacing-card-gap | 32px | Gap between award cards |
| --spacing-card-inner | 24px | Award card inner padding |
| --spacing-footer-x | 90px | Footer horizontal padding |
| --spacing-footer-y | 40px | Footer vertical padding |
| --spacing-fab-right | 24px | FAB distance from right edge |
| --spacing-fab-bottom | 24px | FAB distance from bottom edge |

### Border & Radius

| Token Name | Value | Usage |
|------------|-------|-------|
| --radius-card | 12px | Award card corners |
| --radius-btn | 8px | CTA buttons |
| --radius-countdown | 8px | Countdown digit boxes |
| --radius-fab | 32px | FAB pill shape |
| --border-footer | 1px solid #2E3940 | Footer top border |
| --border-card | 1px solid rgba(255,234,158,0.1) | Award card border |

---

## Layout Structure (ASCII)

```
┌──────────────────────────────────────────────────────────────────┐
│  A1_Header (fixed, h:80px, bg:rgba(16,20,23,0.8), z:50)         │
│  [Logo] [About SAA*] [Awards Info] [Sun* Kudos]  [bell][VN][av] │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  3.5_Keyvisual (bg image + gradient, h:~1392px)                  │
│  ┌──────────────────────────────────────────────────────────────┐│
│  │  "ROOT FURTHER" (120px font, hero text)                      ││
│  │                                                              ││
│  │  B1_Countdown (Coming soon + DD:HH:MM)                       ││
│  │  [XX] DAYS  [XX] HOURS  [XX] MINUTES                         ││
│  │                                                              ││
│  │  B2_Event Info (Time: 18h30, Venue: ...)                     ││
│  │                                                              ││
│  │  B3_CTA [ABOUT AWARDS] [ABOUT KUDOS]                         ││
│  └──────────────────────────────────────────────────────────────┘│
│                                                                  │
│  B4_Content ("Root Further" description paragraph)               │
│                         gap: 120px                               │
│  ┌──────────────────────────────────────────────────────────────┐│
│  │  C1_Awards Header ("He thong giai thuong")                   ││
│  │  C2_Award List (3-col grid)                                  ││
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐                      ││
│  │  │Top Talent│ │Top Proj. │ │Top P.Lead│                      ││
│  │  └──────────┘ └──────────┘ └──────────┘                      ││
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐                      ││
│  │  │Best Mgr  │ │Signature │ │   MVP    │                      ││
│  │  └──────────┘ └──────────┘ └──────────┘                      ││
│  └──────────────────────────────────────────────────────────────┘│
│                         gap: 120px                               │
│  ┌──────────────────────────────────────────────────────────────┐│
│  │  D1_Sun*Kudos (title + desc + image + CTA button)            ││
│  └──────────────────────────────────────────────────────────────┘│
│                                                                  │
│  7_Footer (logo + links + copyright, border-top)                 │
└──────────────────────────────────────────────────────────────────┘

  [6_FAB] ← fixed bottom-right (105x64, pill, golden)
```

---

## Component Style Details

### A1_Header - Navigation Bar

| Property | Value | CSS |
|----------|-------|-----|
| **Node ID** | 2167:9091 | - |
| width | 100% | `width: 100%` |
| height | 80px | `height: 80px` |
| padding | 12px 144px | `padding: 12px 144px` |
| background | rgba(16, 20, 23, 0.8) | `background-color: rgba(16, 20, 23, 0.8)` |
| display | flex | `display: flex` |
| align-items | center | `align-items: center` |
| justify-content | space-between | `justify-content: space-between` |
| position | fixed | `position: fixed; top: 0` |
| z-index | 50 | `z-index: 50` |

**Nav Link States:**
| State | Changes | CSS |
|-------|---------|-----|
| Normal | text-white, no decoration | `color: #FFFFFF; text-decoration: none` |
| Hover | semi-transparent bg, cursor pointer | `background-color: rgba(255,255,255,0.05); cursor: pointer` |
| Focus | visible focus ring | `outline: 2px solid #FFEA9E; outline-offset: 2px` |
| Active/Selected | golden text + underline | `color: #FFEA9E; text-decoration: underline; text-underline-offset: 8px` |

---

### B1_Countdown - Timer Section

| Property | Value |
|----------|-------|
| **Node ID** | 2167:9035 |
| layout | flex row, gap: 24px |
| digit box | bg: rgba(255,234,158,0.1), rounded-8px, px:16 py:12 |
| digit text | Montserrat 48px/56px 700, white |
| label text | Montserrat 14px/20px 600, white, tracking: 2px, uppercase |

---

### B3_CTA Buttons

**Both CTA buttons share the same 2 visual states (toggled on hover):**

| State | Background | Text | Border | CSS |
|-------|-----------|------|--------|-----|
| Filled (ABOUT AWARDS hover) | #FFEA9E | #00101A | none | `bg-[#FFEA9E] text-[#00101A]` |
| Outline (ABOUT KUDOS normal) | transparent | #FFFFFF | 1px solid rgba(255,234,158,0.3) | `bg-transparent text-white border border-[rgba(255,234,158,0.3)]` |
| Focus | inherit | inherit | - | `outline: 2px solid #FFEA9E; outline-offset: 2px` |

**Shared properties:** Node IDs: `2167:9063`, `2167:9064` | padding: 16px 24px | radius: 8px | font: Montserrat 16px 700 | `motion-safe:transition-all duration-150`

---

### C2 Award Card

| Property | Value |
|----------|-------|
| **Node ID** | 2167:9075 (template) |
| width | 1/3 of grid (desktop), 1/2 (mobile) |
| image | square, rounded, golden ring effect |
| title | Montserrat 20px 700, white |
| description | Montserrat 14px 400, white/70%, max 2 lines + ellipsis |
| link | "Chi tiet", Montserrat 14px 600, gold |
| hover | `transform: translateY(-4px); border-color: rgba(255,234,158,0.3); box-shadow: 0 8px 24px rgba(255,234,158,0.08)` |
| focus | `outline: 2px solid #FFEA9E; outline-offset: 2px` |

---

### 6_FAB - Floating Action Button

| Property | Value |
|----------|-------|
| **Node ID** | 5022:15169 |
| width | 105px |
| height | 64px |
| bg | #FFEA9E |
| radius | 32px (pill) |
| position | fixed, bottom: 24px, right: 24px |
| z-index | 40 |
| display | flex, items-center, gap: 4px |
| icons | pencil (left) + SAA logo (right), separator "/" |
| hover | `box-shadow: 0 4px 16px rgba(255,234,158,0.3)` |
| focus | `outline: 2px solid #FFEA9E; outline-offset: 2px` |

---

## Responsive Specifications

### Breakpoints

| Name | Min Width | Tailwind |
|------|-----------|----------|
| Mobile | 0 | default |
| Tablet | 640px | `sm:` |
| Desktop | 1024px | `lg:` |
| Wide | 1280px | `xl:` |

### Responsive Changes

| Component | Mobile | Tablet | Desktop |
|-----------|--------|--------|---------|
| Page padding | px-4 | px-12 | px-36 |
| Award grid | 2 columns | 2 columns | 3 columns |
| Countdown digits | 32px font | 40px font | 48px font |
| Hero title | 48px font | 80px font | 120px font |
| Header | px-4 h-16 | px-12 | px-36 h-20 |
| CTA buttons | stack vertical | side by side | side by side |
| Kudos block | stack vertical | side by side | side by side |
| FAB | 80x48px | 105x64px | 105x64px |

---

## Implementation Mapping

| Design Element | Node ID | React Component |
|----------------|---------|-----------------|
| Page Container | 2167:9026 | `<HomepageSAA />` (Server Component) |
| Header | 2167:9091 | `<AppHeader />` (shared, promoted from Login) |
| Hero/Keyvisual | 2167:9027 | `<HeroBanner />` |
| Countdown | 2167:9035 | `<CountdownTimer />` ("use client") |
| Event Info | 2167:9053 | `<EventInfo />` |
| CTA Buttons | 2167:9062 | `<CTAButtons />` |
| Root Further Content | 5001:14827 | `<RootFurtherContent />` |
| Awards Section Header | 2167:9069 | `<AwardsSectionHeader />` |
| Awards Grid | 5005:14974 | `<AwardsGrid />` |
| Award Card | 2167:9075 | `<AwardCard />` (reused x6) |
| Kudos Block | 3390:10349 | `<KudosPromoBlock />` |
| FAB | 5022:15169 | `<FloatingActionButton />` ("use client") |
| Footer | 5001:14800 | `<AppFooter />` (shared, promoted from Login) |

---

## Notes

- All colors reuse the Login screen's design token system — same dark theme (#00101A base)
- The Header and Footer need to be **promoted from Login-specific to shared app components** in `components/shared/`
- Award card images have a distinctive golden ring/glow effect — these are graphic assets from Figma
- The countdown timer is the only component that needs real-time client-side updates
- The "ROOT FURTHER" hero text at 120px is very large — use viewport-relative sizing for ultra-wide screens
- Award category data (name, slug, description, thumbnail) should be structured for easy future migration to a CMS or Supabase table
