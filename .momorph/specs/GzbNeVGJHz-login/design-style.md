# Design Style: Login

**Frame ID**: `662:14387`
**Screen ID**: `GzbNeVGJHz`
**Frame Name**: Login
**Figma Link**: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/GzbNeVGJHz
**Extracted At**: 2026-04-16

---

## Design Tokens

### Colors

| Token Name | Hex Value | Opacity | Usage |
|------------|-----------|---------|-------|
| --color-bg-primary | #00101A | 100% | Page background, dark base |
| --color-header-bg | #0B0F12 | 80% | Header semi-transparent overlay |
| --color-btn-login | #FFEA9E | 100% | Login button background |
| --color-btn-login-text | #00101A | 100% | Login button text |
| --color-text-white | #FFFFFF | 100% | Body text, labels, footer |
| --color-footer-border | #2E3940 | 100% | Footer top border |
| --color-gradient-left | #00101A | 100% | Left gradient overlay (fade to transparent) |
| --color-gradient-bottom | #00101A | 100% | Bottom gradient overlay (fade to transparent) |
| --color-btn-login-hover | #F5DF8A | 100% | Login button hover (slightly darker gold) |
| --color-btn-login-active | #E8D278 | 100% | Login button active/pressed state |
| --color-lang-hover | #FFFFFF | 10% | Language selector hover background |
| --color-error | #EF4444 | 100% | OAuth error message text |
| --color-focus-ring | #FFEA9E | 100% | Focus indicator for interactive elements |

### Typography

| Token Name | Font Family | Size | Weight | Line Height | Letter Spacing |
|------------|-------------|------|--------|-------------|----------------|
| --text-hero-content | Montserrat | 20px | 700 | 40px | 0.5px |
| --text-btn-login | Montserrat | 22px | 700 | 28px | 0 |
| --text-lang-selector | Montserrat | 16px | 700 | 24px | 0.15px |
| --text-footer | Montserrat Alternates | 16px | 700 | 24px | 0 |
| --text-error | Montserrat | 14px | 500 | 20px | 0 |

### Spacing

| Token Name | Value | Usage |
|------------|-------|-------|
| --spacing-header-x | 144px | Header horizontal padding |
| --spacing-header-y | 12px | Header vertical padding |
| --spacing-hero-x | 144px | Hero section horizontal padding |
| --spacing-hero-y | 96px | Hero section vertical padding |
| --spacing-hero-gap | 80px | Gap between key visual and content area |
| --spacing-content-gap | 24px | Gap between content text and login button |
| --spacing-content-left | 16px | Left padding of content block |
| --spacing-footer-x | 90px | Footer horizontal padding |
| --spacing-footer-y | 40px | Footer vertical padding |
| --spacing-btn-x | 24px | Login button horizontal padding |
| --spacing-btn-y | 16px | Login button vertical padding |
| --spacing-btn-icon-gap | 8px | Gap between button text and Google icon |

### Border & Radius

| Token Name | Value | Usage |
|------------|-------|-------|
| --radius-btn | 8px | Login button corners |
| --radius-lang-btn | 4px | Language selector button corners |
| --border-footer | 1px solid #2E3940 | Footer top border |

### Shadows

| Token Name | Value | Usage |
|------------|-------|-------|
| --shadow-none | none | Default — no shadows on this screen |

---

## Layout Specifications

### Container (Full Screen)

| Property | Value | Notes |
|----------|-------|-------|
| width | 1440px | Desktop design width |
| height | 1024px | Desktop design height |
| background | #00101A | Dark navy base |

### Header

| Property | Value | Notes |
|----------|-------|-------|
| width | 1440px (100%) | Full width |
| height | 80px | Fixed height |
| padding | 12px 144px | Vertical / Horizontal |
| background | rgba(11, 15, 18, 0.8) | Semi-transparent dark |
| display | flex | Row layout |
| align-items | center | Vertically centered |
| justify-content | space-between | Logo left, language right |
| position | absolute | Overlays hero content at top (Figma uses absolute) |
| z-index | 50 | Above all content layers |

### Hero Section

| Property | Value | Notes |
|----------|-------|-------|
| width | 1440px (100%) | Full width |
| height | 845px | Content area |
| padding | 96px 144px | Large padding |
| display | flex | Column layout |
| flex-direction | column | Vertical stack |
| align-items | flex-start | Left aligned |

### Footer

| Property | Value | Notes |
|----------|-------|-------|
| width | 1440px (100%) | Full width |
| padding | 40px 90px | Padding |
| border-top | 1px solid #2E3940 | Divider line |
| display | flex | Row layout |
| align-items | center | Vertically centered |
| justify-content | space-between | Centered text |

### Layout Structure (ASCII)

```
┌──────────────────────────────────────────────────────────────────┐
│  Background Image (C_Keyvisual, 1440×1024, cover)                │
│  + Gradient Overlay Left→Right (#00101A → transparent)           │
│  + Gradient Overlay Bottom→Top (#00101A → transparent)           │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  A_Header (h:80px, px:144px, bg:rgba(11,15,18,0.8))       │  │
│  │  ┌──────────┐                           ┌──────────────┐  │  │
│  │  │ A.1_Logo │                           │ A.2_Language  │  │  │
│  │  │ 52×48px  │                           │ [VN ▾] 108px │  │  │
│  │  └──────────┘                           └──────────────┘  │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  B_Bìa (px:144px, py:96px, flex-col)                      │  │
│  │                                                            │  │
│  │  ┌──────────────────────────────────────┐                  │  │
│  │  │  B.1_Key Visual                      │                  │  │
│  │  │  "ROOT FURTHER" logo (451×200px)     │                  │  │
│  │  └──────────────────────────────────────┘                  │  │
│  │                         gap: 80px                          │  │
│  │  ┌──────────────────────────────────────┐                  │  │
│  │  │  B.2_content (pl:16px)               │                  │  │
│  │  │  "Bắt đầu hành trình..." (480×80px)  │                  │  │
│  │  │  Montserrat 700 20px/40px white      │                  │  │
│  │  └──────────────────────────────────────┘                  │  │
│  │                         gap: 24px                          │  │
│  │  ┌──────────────────────────────────────┐                  │  │
│  │  │  B.3_Login Button (305×60px)         │                  │  │
│  │  │  bg:#FFEA9E  radius:8px  px:24 py:16 │                  │  │
│  │  │  "LOGIN With Google" + [G] icon      │                  │  │
│  │  └──────────────────────────────────────┘                  │  │
│  │                                                            │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  D_Footer (px:90px, py:40px, border-top: 1px #2E3940)     │  │
│  │           "Bản quyền thuộc về Sun* © 2025"                 │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

---

## Component Style Details

### A_Header - Navigation Bar

| Property | Value | CSS |
|----------|-------|-----|
| **Node ID** | 662:14391 | - |
| width | 100% | `width: 100%` |
| height | 80px | `height: 80px` |
| padding | 12px 144px | `padding: 12px 144px` |
| background | rgba(11, 15, 18, 0.8) | `background-color: rgba(11, 15, 18, 0.8)` |
| display | flex | `display: flex` |
| align-items | center | `align-items: center` |
| justify-content | space-between | `justify-content: space-between` |
| position | absolute (top: 0) | `position: absolute; top: 0` |

---

### A.1_Logo - SAA Logo

| Property | Value | CSS |
|----------|-------|-----|
| **Node ID** | I662:14391;186:2166 | - |
| width | 52px | `width: 52px` |
| height | 56px | `height: 56px` |
| display | flex | `display: flex` |
| align-items | center | `align-items: center` |
| cursor | default | Non-interactive |

---

### A.2_Language - Language Selector Button

| Property | Value | CSS |
|----------|-------|-----|
| **Node ID** | I662:14391;186:1601 | - |
| width | 108px | `width: 108px` |
| height | 56px | `height: 56px` |
| padding | 16px | `padding: 16px` |
| border-radius | 4px | `border-radius: 4px` |
| display | flex | `display: flex` |
| align-items | center | `align-items: center` |
| justify-content | space-between | `justify-content: space-between` |
| gap | 4px | `gap: 4px` |
| cursor | pointer | `cursor: pointer` |

**Children:**
- Flag icon (VN): 24×24px, Node ID: `I662:14391;186:1696;186:1821;186:1709`
- Text "VN": Montserrat 700, 16px/24px, white, Node ID: `I662:14391;186:1696;186:1821;186:1439`
- Chevron down icon: 24×24px, Node ID: `I662:14391;186:1696;186:1821;186:1441`

**States:**
| State | Changes | CSS |
|-------|---------|-----|
| Default | transparent background | `background-color: transparent` |
| Hover | white 10% overlay, cursor pointer | `background-color: rgba(255, 255, 255, 0.1); cursor: pointer` |
| Focus | focus ring visible | `outline: 2px solid #FFEA9E; outline-offset: 2px` |
| Active/Open | dropdown visible, chevron rotated | `[aria-expanded="true"]` chevron: `transform: rotate(180deg)` |

---

### B.1_Key Visual - ROOT FURTHER Logo

| Property | Value | CSS |
|----------|-------|-----|
| **Node ID** | 662:14395 / 2939:9548 | - |
| width | 451px | `width: 451px` |
| height | 200px | `height: 200px` |
| aspect-ratio | 115/51 | `aspect-ratio: 115 / 51` |
| background | cover image | `background: url(...) 50% / cover no-repeat` |

---

### B.2_content - Hero Description Text

| Property | Value | CSS |
|----------|-------|-----|
| **Node ID** | 662:14753 | - |
| width | 480px | `width: 480px` |
| height | 80px (auto) | `height: auto` |
| font-family | Montserrat | `font-family: 'Montserrat', sans-serif` |
| font-size | 20px | `font-size: 20px` |
| font-weight | 700 | `font-weight: 700` |
| line-height | 40px | `line-height: 40px` |
| letter-spacing | 0.5px | `letter-spacing: 0.5px` |
| color | #FFFFFF | `color: #FFFFFF` |
| text-align | left | `text-align: left` |

**Content:**
```
Bắt đầu hành trình của bạn cùng SAA 2025.
Đăng nhập để khám phá!
```

---

### B.3_Login - Google Login Button

| Property | Value | CSS |
|----------|-------|-----|
| **Node ID** | 662:14426 | - |
| width | 305px | `width: 305px` |
| height | 60px | `height: 60px` |
| padding | 16px 24px | `padding: 16px 24px` |
| background | #FFEA9E | `background-color: #FFEA9E` |
| border | none | `border: none` |
| border-radius | 8px | `border-radius: 8px` |
| display | flex | `display: flex` |
| align-items | center | `align-items: center` |
| gap | 8px | `gap: 8px` |
| cursor | pointer | `cursor: pointer` |

**Text:**
| Property | Value | CSS |
|----------|-------|-----|
| **Node ID** | I662:14426;186:1568 | - |
| content | "LOGIN With Google " | - |
| font-family | Montserrat | `font-family: 'Montserrat', sans-serif` |
| font-size | 22px | `font-size: 22px` |
| font-weight | 700 | `font-weight: 700` |
| line-height | 28px | `line-height: 28px` |
| color | #00101A | `color: #00101A` |
| text-align | center | `text-align: center` |

**Google Icon:**
| Property | Value |
|----------|-------|
| **Node ID** | I662:14426;186:1766 |
| size | 24×24px |

**States:**
| State | Changes | CSS |
|-------|---------|-----|
| Default | background: #FFEA9E | `background-color: #FFEA9E` |
| Hover | background: #F5DF8A, shadow elevation | `background-color: #F5DF8A; box-shadow: 0 4px 12px rgba(255, 234, 158, 0.3)` |
| Active | background: #E8D278, scale down | `background-color: #E8D278; transform: scale(0.98)` |
| Focus | focus ring visible | `outline: 2px solid #FFEA9E; outline-offset: 2px` |
| Loading | opacity reduced, spinner replaces Google icon | `opacity: 0.7; cursor: wait; pointer-events: none` |
| Disabled | fully dimmed | `opacity: 0.5; cursor: not-allowed; pointer-events: none` |

---

### Error Message (not in Figma — derived for OAuth error display)

| Property | Value | CSS |
|----------|-------|-----|
| **Node ID** | N/A (dynamic element) | - |
| margin-top | 12px | `margin-top: 12px` |
| font-family | Montserrat | `font-family: 'Montserrat', sans-serif` |
| font-size | 14px | `font-size: 14px` |
| font-weight | 500 | `font-weight: 500` |
| line-height | 20px | `line-height: 20px` |
| color | #EF4444 | `color: #EF4444` |
| text-align | left | `text-align: left` |
| role | alert | `role="alert"` for screen readers |

---

### D_Footer - Copyright Footer

| Property | Value | CSS |
|----------|-------|-----|
| **Node ID** | 662:14447 | - |
| width | 100% | `width: 100%` |
| padding | 40px 90px | `padding: 40px 90px` |
| border-top | 1px solid #2E3940 | `border-top: 1px solid #2E3940` |
| display | flex | `display: flex` |
| align-items | center | `align-items: center` |
| justify-content | space-between | `justify-content: space-between` |

**Text:**
| Property | Value | CSS |
|----------|-------|-----|
| **Node ID** | I662:14447;342:1413 | - |
| content | "Bản quyền thuộc về Sun* © 2025" | - |
| font-family | Montserrat Alternates | `font-family: 'Montserrat Alternates', sans-serif` |
| font-size | 16px | `font-size: 16px` |
| font-weight | 700 | `font-weight: 700` |
| line-height | 24px | `line-height: 24px` |
| color | #FFFFFF | `color: #FFFFFF` |
| text-align | center | `text-align: center` |

---

### Background Layers (Bottom to Top)

| Layer | Node ID | Type | Description |
|-------|---------|------|-------------|
| 1 | 662:14387 | FRAME | Base: `#00101A` solid background |
| 2 | 662:14389 | RECTANGLE | Key visual image, cover, 1441×1022px |
| 3 | 662:14392 | RECTANGLE | Left gradient: `linear-gradient(90deg, #00101A 0%, #00101A 25.41%, transparent 100%)` |
| 4 | 662:14390 | RECTANGLE | Bottom gradient: `linear-gradient(0deg, #00101A 22.48%, transparent 51.74%)` |

---

## Component Hierarchy with Styles

```
Login (bg: #00101A, 1440×1024)
├── C_Keyvisual (GROUP, absolute, z:1)
│   └── image 1 (RECTANGLE, 1441×1022, cover image)
│
├── Rectangle 57 (RECTANGLE, gradient left→right overlay)
│   └── linear-gradient(90deg, #00101A 0%, #00101A 25.41%, transparent 100%)
│
├── Cover (RECTANGLE, gradient bottom→top overlay)
│   └── linear-gradient(0deg, #00101A 22.48%, transparent 51.74%)
│
├── A_Header (INSTANCE, w:1440, h:80, px:144, py:12, bg:rgba(11,15,18,0.8))
│   ├── A.1_Logo (FRAME, 52×56, flex, items-center)
│   │   └── LOGO (INSTANCE, 52×48, image)
│   └── A.2_Language (FRAME, 108×56, flex, items-center)
│       └── Language > Button (INSTANCE, p:16, radius:4, flex, gap:2)
│           ├── [VN Flag] (24×24)
│           ├── "VN" (Montserrat 700, 16px/24px, white)
│           └── [Chevron Down] (24×24)
│
├── B_Bìa (FRAME, px:144, py:96, flex-col, gap:120)
│   └── Frame 487 (FRAME, flex-col, gap:80, justify:center)
│       ├── B.1_Key Visual (FRAME, 1152×200)
│       │   └── "ROOT FURTHER" logo image (451×200, cover)
│       └── Frame 550 (FRAME, pl:16, flex-col, gap:24)
│           ├── B.2_content (TEXT, 480×80, Montserrat 700, 20px/40px, white)
│           │   └── "Bắt đầu hành trình của bạn cùng SAA 2025.\nĐăng nhập để khám phá!"
│           └── B.3_Login (FRAME, 305×60)
│               └── Button-IC About (INSTANCE, p:16/24, bg:#FFEA9E, radius:8)
│                   ├── "LOGIN With Google" (Montserrat 700, 22px/28px, #00101A)
│                   └── [Google Icon] (24×24)
│
└── D_Footer (INSTANCE, px:90, py:40, border-top:1px #2E3940, flex, center)
    └── "Bản quyền thuộc về Sun* © 2025" (Montserrat Alternates 700, 16px/24px, white)
```

---

## Responsive Specifications

### Breakpoints

| Name | Min Width | Max Width | Tailwind |
|------|-----------|-----------|----------|
| Mobile | 0 | 639px | default |
| Tablet | 640px | 1023px | `sm:` / `md:` |
| Desktop | 1024px | infinity | `lg:` / `xl:` |

### Responsive Changes

#### Mobile (< 640px)

| Component | Changes |
|-----------|---------|
| Header | padding: 12px 16px; height: 64px |
| Logo | width: 40px; height: 40px |
| Language | width: auto; padding: 8px |
| B_Bìa (Hero) | padding: 48px 16px |
| Key Visual | width: 100%; max-width: 280px; height: auto |
| B.2_content | font-size: 16px; line-height: 28px; width: 100% |
| B.3_Login button | width: 100%; max-width: 305px; font-size: 18px |
| Footer | padding: 24px 16px; text-align: center |

#### Tablet (640px - 1023px)

| Component | Changes |
|-----------|---------|
| Header | padding: 12px 48px |
| B_Bìa (Hero) | padding: 64px 48px |
| Key Visual | width: 350px; height: auto |
| B.2_content | font-size: 18px; width: 100%; max-width: 480px |
| Footer | padding: 32px 48px |

#### Desktop (>= 1024px)

| Component | Changes |
|-----------|---------|
| All | Use Figma desktop specs as-is (1440px design) |
| Container | max-width: 1440px; margin: 0 auto |

---

## Icon Specifications

| Icon Name | Node ID | Size | Color | Usage |
|-----------|---------|------|-------|-------|
| Logo (SAA) | I662:14391;178:1033;178:1030 | 52×48px | image | Header logo |
| VN Flag | I662:14391;186:1696;186:1821;186:1709 | 24×24px | image | Language flag |
| Chevron Down | I662:14391;186:1696;186:1821;186:1441 | 24×24px | #FFFFFF | Language dropdown arrow |
| Google | I662:14426;186:1766 | 24×24px | original | Login button icon |
| ROOT FURTHER | 2939:9548 | 451×200px | image | Hero key visual |

---

## Animation & Transitions

| Element | Property | Duration | Easing | Trigger |
|---------|----------|----------|--------|---------|
| Login Button | background-color, box-shadow | 150ms | ease-in-out | Hover |
| Login Button | opacity | 150ms | ease-in-out | Disabled |
| Language Selector | background-color | 150ms | ease-in-out | Hover |
| Language Dropdown | opacity, transform | 200ms | ease-out | Toggle open/close |
| Page load | opacity | 300ms | ease-in | Initial render |

---

## Implementation Mapping

| Design Element | Figma Node ID | Tailwind Classes | React Component |
|----------------|---------------|-----------------|-----------------|
| Page Container | 662:14387 | `relative min-h-screen bg-[#00101A] overflow-hidden` | `<LoginPage />` |
| Background Image | 662:14389 | `absolute inset-0 object-cover` | `<Image />` (next/image) |
| Gradient Left | 662:14392 | `absolute inset-0 bg-gradient-to-r from-[#00101A] via-[#00101A]/25 to-transparent` | `<div />` |
| Gradient Bottom | 662:14390 | `absolute inset-0 bg-gradient-to-t from-[#00101A] via-[#00101A]/22 to-transparent` | `<div />` |
| Header | 662:14391 | `absolute top-0 w-full h-20 px-36 py-3 flex items-center justify-between bg-[#0B0F12]/80 z-50` | `<Header />` |
| Logo | I662:14391;186:2166 | `w-[52px] h-[48px]` | `<Logo />` |
| Language Button | I662:14391;186:1601 | `flex items-center gap-1 p-4 rounded cursor-pointer` | `<LanguageSelector />` |
| Hero Section | 662:14393 | `relative px-36 py-24 flex flex-col` | `<HeroSection />` |
| Key Visual | 2939:9548 | `w-[451px] h-[200px] object-cover` | `<Image />` (next/image) |
| Content Text | 662:14753 | `max-w-[480px] text-xl font-bold leading-[40px] tracking-[0.5px] text-white font-montserrat` | `<p />` |
| Login Button | 662:14426 | `flex items-center gap-2 px-6 py-4 bg-[#FFEA9E] rounded-lg` | `<LoginButton />` |
| Button Text | I662:14426;186:1568 | `text-[22px] font-bold leading-7 text-[#00101A] font-montserrat` | `<span />` |
| Footer | 662:14447 | `w-full px-[90px] py-10 border-t border-[#2E3940] flex items-center justify-center` | `<Footer />` |
| Footer Text | I662:14447;342:1413 | `text-base font-bold text-white font-montserrat-alternates` | `<p />` |
| Error Message | N/A | `mt-3 text-sm font-medium text-red-500 font-montserrat` | `<p role="alert" />` |

---

## Notes

- All colors MUST use Tailwind arbitrary values `[#hex]` or be configured as custom theme tokens in `tailwind.config.ts`
- Font families (Montserrat, Montserrat Alternates) MUST be loaded via `next/font/google`
- The "ROOT FURTHER" key visual and SAA logo are images — use `next/image` with proper `alt` text
- Background image from Figma MUST be served as an optimized asset via `next/image` or as a CSS background
- All icons MUST be implemented as Icon Components (not raw SVG files or img tags)
- Google icon follows Google's brand guidelines for third-party use
- The login button triggers Supabase Auth Google OAuth flow (PKCE) per constitution
- Ensure color contrast meets WCAG AA: white text on dark bg (#FFFFFF on #00101A) passes at 18.06:1
