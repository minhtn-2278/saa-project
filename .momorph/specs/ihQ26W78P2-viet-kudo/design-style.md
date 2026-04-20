# Design Style: Viết Kudo (Write Kudo Modal)

**Frame ID**: `ihQ26W78P2`
**Frame Name**: `Viết Kudo`
**Figma Link**: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/ihQ26W78P2
**Frame Image**: https://momorph.ai/api/images/9ypp4enmFmdK3YAFJLIu6C/520:11602/2a59143b0305d622e49b962fdf2cb2c7.png
**Extracted At**: 2026-04-20

---

## Design Tokens

### Colors

| Token Name | Hex Value | Opacity | Usage |
|------------|-----------|---------|-------|
| --color-page-bg | #00101A | 100% | Behind-modal page background |
| --color-modal-bg | #FFF8E1 | 100% | Modal surface (cream) |
| --color-primary | #FFEA9E | 100% | Primary button (Gửi), gold accent |
| --color-secondary-bg | #FFEA9E | 10% | Cancel (Hủy) button background |
| --color-input-bg | #FFFFFF | 100% | Input / select / textarea background |
| --color-border | #998C5F | 100% | Inputs, buttons, thumbnails border |
| --color-text-primary | #00101A | 100% | Titles, labels, primary button text |
| --color-text-placeholder | #999999 | 100% | Placeholder & helper text (Tối đa 5) |
| --color-text-hint | #00101A | 100% | "@ + tên" hint under textarea |
| --color-required | #CF1322 | 100% | Required asterisk `*` |
| --color-link-community | #E46060 | 100% | "Tiêu chuẩn cộng đồng" link |
| --color-cover-overlay | linear-gradient(0deg,#00101A 25%,rgba(0,19,32,0) 50%) | - | Page cover overlay |

### Typography

| Token Name | Font Family | Size | Weight | Line Height | Letter Spacing |
|------------|-------------|------|--------|-------------|----------------|
| --text-modal-title | Montserrat | 32px | 700 | 40px | 0 |
| --text-field-label | Montserrat | 22px | 700 | 28px | 0 |
| --text-body | Montserrat | 16px | 700 | 24px | 0.15px |
| --text-hint | Montserrat | 16px | 700 | 24px | 0.5px |
| --text-link | Montserrat | 16px | 700 | 24px | 0.15px |
| --text-button-secondary | Montserrat | 16px | 700 | 24px | 0.15px |
| --text-button-primary | Montserrat | 22px | 700 | 28px | 0 |
| --text-required | Noto Sans JP | 16px | 700 | 20px | 0 |

### Spacing

| Token Name | Value | Usage |
|------------|-------|-------|
| --spacing-xs | 2px | Label internal gap |
| --spacing-sm | 4px | Tight in-line gaps |
| --spacing-md | 8px | Tag chip gap, button icon-to-text |
| --spacing-lg | 16px | Field row gap, between label+input |
| --spacing-xl | 24px | Action bar gap (Hủy/Gửi), input horizontal padding |
| --spacing-2xl | 32px | Vertical gap between modal rows |
| --spacing-3xl | 40px | Modal inner padding |

### Border & Radius

| Token Name | Value | Usage |
|------------|-------|-------|
| --radius-sm | 4px | Cancel button corners |
| --radius-md | 8px | Inputs, select, textarea, submit button |
| --radius-lg | 18px | Image thumbnails |
| --radius-modal | 24px | Modal container |
| --border-width | 1px | Inputs, buttons, thumbnails |

### Shadows

| Token Name | Value | Usage |
|------------|-------|-------|
| --shadow-none | none | Modal uses no drop shadow in this frame |

*(No DROP_SHADOW effects detected on modal-level elements.)*

---

## Layout Specifications

### Modal Container

| Property | Value | Notes |
|----------|-------|-------|
| width | 752px | Fixed |
| min-height | 1012px | Fits all fields with 40px padding |
| padding | 40px | All sides |
| gap | 32px | Between vertically stacked rows |
| background-color | #FFF8E1 | Cream |
| border-radius | 24px | Large, soft modal |
| flex-direction | column | Vertical stack |
| align-items | flex-start | Left aligned |
| position | Centered over page, above a dimmed backdrop |

### Row Layout

All field rows span `672px` (modal inner width = 752 − 40×2).

| Row | Height | Direction | Gap |
|-----|--------|-----------|-----|
| A — Title | 80px | — | — |
| B — Recipient | 56px | row | 16px |
| Danh hiệu block | 104px | column | — |
| C — Toolbar row | 40px | row (space-between) | 0 (buttons tile) |
| &nbsp;&nbsp;· left: toolbar buttons | 40px | row | 0 |
| &nbsp;&nbsp;· right: `Tiêu chuẩn cộng đồng` link | 24px | — | — |
| D — Textarea | 200px | column | — |
| D.1 — `@mention` hint | 24px | row | — |
| E — Hashtag | 48px | row | 16px |
| F — Image | 80px | row | 16px |
| G — Anonymous toggle | 28px | row | 16px |
| G.1 — Anonymous alias input *(conditional, only when G is checked)* | 56px | row | 16px |
| H — Action bar | 60px | row | 24px |

### Layout Structure (ASCII)

```
┌─────────────────────────────────────────────────────────────┐
│ Page (1440×1024, bg #00101A, cover gradient overlay)         │
│                                                             │
│        ┌────────── Modal 752×1012 (bg #FFF8E1, r:24) ──────┐ │
│        │ padding: 40px, gap: 32px, flex-col                │ │
│        │                                                   │ │
│        │ ┌───────────────────────────────────────────────┐ │ │
│        │ │ A · Title (32/40 700 Montserrat, center)      │ │ │
│        │ │ "Gửi lời cám ơn và ghi nhận đến đồng đội"     │ │ │
│        │ │ w:672 h:80                                    │ │ │
│        │ └───────────────────────────────────────────────┘ │ │
│        │                                                   │ │
│        │ ┌────────── B · Recipient (row, gap 16) ────────┐ │ │
│        │ │ [Người nhận *]  [ 🔍 Tìm kiếm          ▼ ]   │ │ │
│        │ │   146×28           flex:1  56h  r:8  p:16/24 │ │ │
│        │ └───────────────────────────────────────────────┘ │ │
│        │                                                   │ │
│        │ ┌── Danh hiệu block (col, 672×104) ─────────────┐ │ │
│        │ │ [Danh hiệu *] ← 139×28                        │ │ │
│        │ │ [ Dành tặng một danh hiệu cho đồng đội   ▼ ]  │ │ │
│        │ │   w:514  r:8  p:16/24  border #998C5F        │ │ │
│        │ │ hint: "Ví dụ: Người truyền động lực cho tôi.  │ │ │
│        │ │        Danh hiệu sẽ hiển thị làm tiêu đề…"   │ │ │
│        │ └───────────────────────────────────────────────┘ │ │
│        │                                                   │ │
│        │ ┌── C · Toolbar row (672×40, space-between) ────┐ │ │
│        │ │ [B][I][S][•][🔗][❝]    "Tiêu chuẩn cộng đồng" │ │ │
│        │ │ 6 icon btns 56×40                 (red link) │ │ │
│        │ │ border 1px #998C5F, p:10/16                   │ │ │
│        │ └───────────────────────────────────────────────┘ │ │
│        │                                                   │ │
│        │ ┌────────── D · Textarea (672×200) ─────────────┐ │ │
│        │ │ placeholder: "Hãy gửi gắm lời cám ơn và ghi   │ │ │
│        │ │ nhận đến đồng đội tại đây nhé!"               │ │ │
│        │ │ border 1px #998C5F, r: 0 0 8 8, bg #FFF,      │ │ │
│        │ │ pl:24  (border-top: none — attaches to C)    │ │ │
│        │ └───────────────────────────────────────────────┘ │ │
│        │                                                   │ │
│        │ D.1  "Bạn có thể '@+tên' để nhắc đồng nghiệp"    │ │
│        │      (hint only — left aligned, #00101A)          │ │
│        │                                                   │ │
│        │ ┌────── E · Hashtag (row, 672×48, gap 16) ──────┐ │ │
│        │ │ [Hashtag *]  [#tag ✕][#tag ✕][+ Hashtag]      │ │ │
│        │ │                   Tối đa 5                    │ │ │
│        │ └───────────────────────────────────────────────┘ │ │
│        │                                                   │ │
│        │ ┌────── F · Image (row, 672×80, gap 16) ────────┐ │ │
│        │ │ [Image]  [80×80][80×80][80×80]   [+ Image]    │ │ │
│        │ │ label   thumbnails r:18 border 1px  Tối đa 5  │ │ │
│        │ └───────────────────────────────────────────────┘ │ │
│        │                                                   │ │
│        │ ┌── G · Anonymous toggle (row, 672×28) ─────────┐ │ │
│        │ │ [◻]  Gửi lời cám ơn và ghi nhận ẩn danh       │ │ │
│        │ └───────────────────────────────────────────────┘ │ │
│        │                                                   │ │
│        │ ┌── G.1 · Alias input — visible only when G on ─┐ │ │
│        │ │ [Tên ẩn danh]  [🎭 Nhập tên hiển thị...     ] │ │ │
│        │ │                  prefix ic-mask 24×24         │ │ │
│        │ │                  flex:1 56h r:8 pl:56  0/60   │ │ │
│        │ └───────────────────────────────────────────────┘ │ │
│        │                                                   │ │
│        │ ┌── H · Actions (row, 672×60, gap 24) ──────────┐ │ │
│        │ │ [  Hủy  ]   [         Gửi                   ] │ │ │
│        │ │  146w         502×60  bg #FFEA9E  r:8         │ │ │
│        │ │  r:4  p:16/40                                 │ │ │
│        │ └───────────────────────────────────────────────┘ │ │
│        └───────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## Component Style Details

### Modal Container

| Property | Value | CSS |
|----------|-------|-----|
| **Node ID** | 520:11647 | - |
| width | 752px | `width: 752px` |
| min-height | 1012px | `min-height: 1012px` |
| padding | 40px | `padding: 40px` |
| gap | 32px | `gap: 32px` |
| background | #FFF8E1 | `background-color: var(--color-modal-bg)` |
| border-radius | 24px | `border-radius: var(--radius-modal)` |
| display | flex | `display: flex` |
| flex-direction | column | `flex-direction: column` |
| align-items | flex-start | `align-items: flex-start` |

### A — Modal Title

| Property | Value | CSS |
|----------|-------|-----|
| **Node ID** | I520:11647;520:9870 | - |
| width | 672px | `width: 100%` |
| height | 80px | `min-height: 80px` |
| font-family | Montserrat | - |
| font-size | 32px | `font-size: 32px` |
| font-weight | 700 | `font-weight: 700` |
| line-height | 40px | `line-height: 40px` |
| color | #00101A | `color: var(--color-text-primary)` |
| text-align | center | `text-align: center` |

### B — Recipient Row (Search Dropdown)

**Row container** — Node `I520:11647;520:9871`
`display:flex; flex-direction:row; gap:16px; width:672px; height:56px; align-items:center;`

**B.1 — Label `Người nhận *`** — Node `I520:11647;520:9872`

| Property | Value |
|----------|-------|
| width | 146px |
| gap | 2px |
| font (label) | Montserrat 22/28 700 #00101A |
| font (asterisk) | Noto Sans JP 16/20 700 #CF1322 |

**B.2 — Search input** — Node `I520:11647;520:9873`

| Property | Value | CSS |
|----------|-------|-----|
| flex | 1 0 0 | `flex: 1 0 0` |
| height | 56px | `height: 56px` |
| padding | 16px 24px | `padding: 16px 24px` |
| background | #FFFFFF | `background-color: var(--color-input-bg)` |
| border | 1px solid #998C5F | `border: 1px solid var(--color-border)` |
| border-radius | 8px | `border-radius: var(--radius-md)` |
| placeholder | "Tìm kiếm" | Montserrat 16/24 700 #999999, LS 0.15 |
| suffix icon | Dropdown chevron | 24×24, aligned end |

**States:**
| State | Changes |
|-------|---------|
| Focus | border-color: #998C5F (2px), outline offset 2px |
| Error (required empty) | border-color: #CF1322, helper text `Vui lòng chọn người nhận` |
| Disabled | background: #F3F1E5, cursor not-allowed |

### Danh hiệu Block (Title of Kudo)

**Block container** — Node `I520:11647;1688:10448` (Frame 552)
`width:672px; height:104px; flex-direction:column;`

**Label** — Node `I520:11647;1688:10436`
Same style pattern as B.1 — `Danh hiệu *`, 139×28.

**Select/Input** — Node `I520:11647;1688:10437`
Same visual as B.2 search: `width:514px; padding:16px 24px; border:1px solid #998C5F; border-radius:8px; background:#FFF;` with dropdown chevron. Placeholder `Dành tặng một danh hiệu cho đồng đội` (Montserrat 16/24 700 #999). Supports both selecting an existing Danh hiệu and **creating a new one inline** when the typed label has no match (same popover pattern as Hashtag E.2 — a sticky `Tạo mới: "{label}"` row appears; Enter commits the pending label).

**Hint** — Node `I520:11647;1688:10447`
Montserrat 16/24 700 #999999, LS 0.15, width 418px, 2 lines:
`Ví dụ: Người truyền động lực cho tôi.`
`Danh hiệu sẽ hiển thị làm tiêu đề Kudos của bạn.`

**States:**
| State | Changes |
|-------|---------|
| Default | as above |
| Focus | `border-color: #998C5F`, `outline: 2px solid #998C5F, outline-offset: 2px` |
| Open (popover shown) | Chevron rotates 180°; popover visible |
| Pending-new label | The cell renders `Tạo mới: "{label}"` as a chip-like placeholder until submit persists it |
| Error (required empty) | border-color #CF1322, helper `Vui lòng chọn hoặc tạo danh hiệu` |
| Error (label length) | border-color #CF1322, helper `Danh hiệu dài từ 2 đến 60 ký tự` |
| Disabled (during submit) | `opacity: 0.6; cursor: not-allowed` |

### C — Rich-Text Toolbar Row

**Toolbar row container** — Node `I520:11647;520:9877`
`display:flex; flex-direction:row; justify-content:space-between; align-items:center; width:672px; height:40px;`

This row has TWO zones:
- **Left** — the six format buttons (`C.1`–`C.6`), tiled edge-to-edge, left-aligned.
- **Right** — the `Tiêu chuẩn cộng đồng` link (node `I520:11647;3053:11621`), right-aligned and vertically centered with the toolbar buttons. Position from Figma: `startY: 394, endY: 418` (inside the toolbar's `386–426` band). This link is **not** below the textarea.

Each button (**C.1 Bold, C.2 Italic, C.3 Strikethrough, C.4 Bulleted List, C.5 Link, C.6 Quote**):

| Property | Value | CSS |
|----------|-------|-----|
| height | 40px | `height: 40px` |
| padding | 10px 16px | `padding: 10px 16px` |
| gap | 8px | `gap: 8px` |
| background | transparent | `background: transparent` |
| border | 1px solid #998C5F | `border: 1px solid var(--color-border)` |
| border-radius | 0 — *except* C.1 (first) has `8px 0 0 0` | per-side radius |
| icon | 20×20, currentColor | - |

> Buttons tile edge-to-edge — shared border, first/last get top-left/right radius if any.

**States:**
| State | Changes |
|-------|---------|
| Hover | background: rgba(255,234,158,0.16) |
| Active/Toggled On | background: #FFEA9E, icon #00101A |
| Focus | outline: 2px solid #FFEA9E, offset 2px |
| Disabled | opacity: 0.4 |

### D — Textarea (Message Body)

**Textarea** — Node `I520:11647;520:9886`

| Property | Value | CSS |
|----------|-------|-----|
| width | 672px (align-self: stretch) | `width: 100%` |
| height | 200px | `height: 200px; min-height:120px` |
| padding-left | 24px | `padding: 16px 24px` |
| background | #FFFFFF | `background: var(--color-input-bg)` |
| border | 1px solid #998C5F | `border: 1px solid var(--color-border); border-top: none` *(attached to toolbar)* |
| border-radius | 0 0 8px 8px | `border-radius: 0 0 8px 8px` |
| placeholder | "Hãy gửi gắm lời cám ơn và ghi nhận đến đồng đội tại đây nhé!" | Montserrat 16/24 700 #999 |
| `@mention` behaviour | Typing `@` opens user suggestion dropdown, selected names render as chip/inline highlight | - |

### D.1 — `@mention` Hint Row (below textarea)

Node `I520:11647;520:9887` — `display:flex; justify-content:flex-start; align-items:center; width:672px; height:24px;`

Contents: `Bạn có thể "@ + tên" để nhắc tới đồng nghiệp khác` — Montserrat 16/24 700 **#00101A**, letter-spacing 0.5px, left-aligned.

> **Correction:** The `Tiêu chuẩn cộng đồng` link does **not** live in this row. It sits in the **toolbar row (C)**, right-aligned. The Figma node for the link (`I520:11647;3053:11621`) has `endY: 418` which is above the textarea (`startY: 426`), confirming the toolbar-row placement.

### `Tiêu chuẩn cộng đồng` Link — Node `I520:11647;3053:11621`

| Property | Value | CSS |
|----------|-------|-----|
| width | 191px (fits-content) | `width: auto` |
| height | 24px | `height: 24px` |
| font-family | Montserrat | - |
| font-size | 16px | `font-size: 16px` |
| font-weight | 700 | `font-weight: 700` |
| line-height | 24px | `line-height: 24px` |
| letter-spacing | 0.15px | `letter-spacing: 0.15px` |
| color | #E46060 | `color: var(--color-link-community)` |
| text-align | right | `text-align: right` |
| cursor | pointer | `cursor: pointer` |

**States:**
| State | Changes |
|-------|---------|
| Hover | `text-decoration: underline` |
| Focus | `outline: 2px solid #E46060, outline-offset: 2px; text-decoration: underline` |
| Visited | Color unchanged (#E46060) — explicit, to avoid default purple |

**Interaction:** opens target URL in a new tab (`target="_blank"`, `rel="noopener noreferrer"`); does not close or mutate the modal.

### E — Hashtag Field

**Row** — Node `I520:11647;520:9890`
`display:flex; flex-direction:row; gap:16px; align-items:flex-start; width:672px; height:48px;`

**E.1 Label** — `Hashtag *` (Montserrat 22/28 700 #00101A + asterisk). `width:108px`.

**E.2 Tag group** — Node `I520:11647;662:8595` `width:548px; gap:8px;`
- Chip: padding 8px 12px, border-radius 9999px, background #FFEA9E, border 1px #998C5F, Montserrat 14/20 700 #00101A, trailing `✕` (16×16).
- `+ Hashtag` button: ghost, border 1px #998C5F, radius 9999, padding 8px 12px, icon `+`. Clicking opens a combobox popover (320×max-h:240, bg #FFF, border 1 #998C5F, radius 8, shadow-md) with a search input, a list of existing matches, and — when the typed label has no exact match — a sticky last option **`Tạo mới: "{label}"`** (Montserrat 14/20 700 #00101A on #FFF8E1) that inserts the new hashtag as a pending chip.
- Hint: `Hashtag\nTối đa 5` Montserrat 14/20 700 #999999 (multi-line, right-aligned).

**States:**
| State | Changes |
|-------|---------|
| Empty (required) | Error outline on whole group, message `Chọn hoặc tạo ít nhất 1 hashtag` |
| 5 chips | `+ Hashtag` button hidden; helper text `Đã đạt tối đa 5 hashtag` |
| Chip hover | Chip background darkens ~4% |
| Typing no-match in popover | `Tạo mới: "{label}"` row appears; Enter creates a pending chip |
| Invalid label in popover | `Tạo mới` row disabled + helper `Chỉ gồm chữ, số, gạch dưới; 2–32 ký tự` |

### F — Image Upload

**Row** — Node `I520:11647;520:9896`
`display:flex; flex-direction:row; gap:16px; align-items:center; width:672px; height:80px;`

**F.1 Label** — `Image` (Montserrat 22/28 700 #00101A). `width:74px`.

**F.2–F.4 Thumbnail** — `80×80`, border 1px #998C5F, border-radius 18px, background #FFF, `object-fit: cover`, trailing `✕` delete button (top-right, 24×24 circle #FFF w/ border).

**F.5 Add button** — Node `I520:11647;662:9132` `width:98px; height:48px; flex-direction:column; align-items:center; gap:2px;`
- Icon `+` 24×24
- Label `Image\nTối đa 5` Montserrat 14/20 700 #999.

**States:**
| State | Changes |
|-------|---------|
| 5 images | `+ Image` button hidden |
| Upload in-progress | Thumbnail shows spinner overlay, opacity 0.6 |
| Upload failed | Red border, retry icon on thumbnail |

### G — Anonymous Toggle

Node `I520:11647;520:14099` — `display:flex; flex-direction:row; gap:16px; align-items:center; width:672px; height:28px;`
- Checkbox (20×20, border 1px #998C5F, radius 4, checked fill #FFEA9E).
- Label: `Gửi lời cám ơn và ghi nhận ẩn danh` — Montserrat 22/28 700 #999999 (muted until checked → #00101A).

### G.1 — Anonymous Alias Input *(conditional, rendered only when G is checked)*

> Per the design-item specification for G (`kind: text_form`, description: *"Bật: Hiển thị text field điền tên ẩn danh"*) and frontend test cases **ID-43 / ID-44**, toggling G ON reveals an inline text input where the author can enter the display name that will appear in place of their real name on the published Kudo. Toggling G OFF hides and clears this input.

| Property | Value | CSS |
|----------|-------|-----|
| wrapper | row, gap 16, align-items center | `display:flex; gap:16px; align-items:center; width:672px` |
| label | `Tên ẩn danh` — Montserrat 22/28 700 #00101A | matches B.1 / E.1 pattern |
| input width | `flex: 1 0 0` | `flex: 1 0 0` |
| input height | 56px | `height: 56px` |
| input padding | 16px 16px 16px 56px | left padding reserves 40px for the prefix icon + 16px gap |
| input background | #FFFFFF | `background: var(--color-input-bg)` |
| input border | 1px solid #998C5F | `border: 1px solid var(--color-border)` |
| input border-radius | 8px | `border-radius: var(--radius-md)` |
| input placeholder | `Nhập tên hiển thị khi gửi ẩn danh` | Montserrat 16/24 700 #999 LS 0.15 |
| input max-length | **60 chars** (Unicode-aware; surrogate pairs count as 1; enforced client + server) | `maxLength={60}` + Zod `.max(60)` |
| **prefix icon** | `ic-mask` (incognito / mask glyph), 24×24, color `#998C5F`, absolutely positioned at `left: 16px`, vertically centred | anchors the field as the "anonymous identity" control |
| character counter (optional) | right-aligned hint `0 / 60` below the input, Montserrat 14/20 700 #999 | shown when the user has focus; turns `#CF1322` over 60 |

**States:**
| State | Changes |
|-------|---------|
| Hidden | G unchecked — element is not mounted; focus returns to G checkbox |
| Shown (G checked, empty) | Default style; not required (server will fall back to "Ẩn danh" if empty) |
| Focus | `border-color: #998C5F`, `outline: 2px solid #998C5F, outline-offset: 2px` |
| Over max-length | Border red, helper `Tối đa 60 ký tự` |
| Disabled (during submit) | `opacity: 0.6; cursor: not-allowed` |

**Animation:** `max-height` transition 180ms ease-out on reveal/hide so layout reflows smoothly.

### H — Action Bar

**Row** — Node `I520:11647;520:9905` `display:flex; gap:24px; align-items:flex-start; width:672px; height:60px;`

**H.1 — Cancel (Hủy)** — Node `I520:11647;520:9906`

| Property | Value | CSS |
|----------|-------|-----|
| padding | 16px 40px | `padding: 16px 40px` |
| height | 60px (align-self stretch) | - |
| background | rgba(255, 234, 158, 0.10) | `background: rgba(255,234,158,0.10)` |
| border | 1px solid #998C5F | `border: 1px solid var(--color-border)` |
| border-radius | 4px | `border-radius: var(--radius-sm)` |
| font | Montserrat 16/24 700 #00101A LS 0.15 | - |

**H.2 — Submit (Gửi)** — Node `I520:11647;520:9907`

| Property | Value | CSS |
|----------|-------|-----|
| width | 502px (fill remaining) | `flex: 1` |
| height | 60px | `height: 60px` |
| padding | 16px | `padding: 16px` |
| background | #FFEA9E | `background: var(--color-primary)` |
| border | none | - |
| border-radius | 8px | `border-radius: var(--radius-md)` |
| font | Montserrat 22/28 700 #00101A | - |

**Submit button states:**
| State | Changes |
|-------|---------|
| Hover | background: #F7D872 |
| Active | background: #E6C651 |
| Disabled | background: rgba(255,234,158,0.40), color rgba(0,16,26,0.40), cursor not-allowed |
| Loading | spinner icon, text unchanged, disables click |
| Focus | outline: 2px solid #998C5F, offset 2px |

---

## Component Hierarchy with Styles

```
PageBackdrop (fixed, bg #00101A, overlay gradient)
└── ModalContainer (752×1012, bg #FFF8E1, r:24, p:40, gap:32, flex-col)
    ├── Title                (A:  Montserrat 32/40 700, center)
    ├── RecipientRow         (B:  row, gap:16)
    │   ├── Label            (B.1: 146w, "Người nhận *")
    │   └── SearchSelect     (B.2: flex:1, 56h, r:8, p:16/24, bg:#FFF)
    ├── DanhHieuBlock        (col, 672×104)
    │   ├── Label            ("Danh hiệu *", 139w)
    │   ├── SelectInput      (514w, r:8, p:16/24, supports inline "Tạo mới")
    │   └── Hint             ("Ví dụ: …" 16/24 700 #999)
    ├── EditorBlock
    │   ├── ToolbarRow       (C:  row, 40h, justify:space-between, w:full)
    │   │   ├── ToolbarButtons (6 tiled buttons, left)
    │   │   └── CommunityLink (#E46060, right, opens new tab)
    │   └── Textarea         (D:  672×200, r:0 0 8 8, bg:#FFF, p:16/24, border-top:none)
    ├── MentionHintRow       (D.1: row, justify:flex-start, 24h — hint only)
    │   └── MentionHint      (#00101A LS:0.5)
    ├── HashtagRow           (E:  row, gap:16, 48h)
    │   ├── Label            (E.1: 108w, "Hashtag *")
    │   └── TagGroup         (E.2: 548w, gap:8, chips + "+ Hashtag" (supports inline create) + "Tối đa 5")
    ├── ImageRow             (F:  row, gap:16, 80h)
    │   ├── Label            (F.1: 74w, "Image")
    │   ├── Thumbnail[]      (F.2-F.4: 80×80, r:18, border 1)
    │   └── AddImageButton   (F.5: 98×48, col, icon + "Image\nTối đa 5")
    ├── AnonymousRow         (G:  row, gap:16, 28h)
    │   ├── Checkbox         (20×20, r:4)
    │   └── Label            ("Gửi ... ẩn danh", muted #999)
    ├── AliasRow             (G.1: row, gap:16, 56h — only when G checked)
    │   ├── Label            ("Tên ẩn danh")
    │   └── AliasInput       (flex:1 56h r:8 pl:56, prefix ic-mask, maxLength 60)
    └── ActionBar            (H:  row, gap:24, 60h)
        ├── CancelButton     (H.1: r:4, border 1, p:16/40, "Hủy")
        └── SubmitButton     (H.2: flex:1, r:8, bg:#FFEA9E, 22/28, "Gửi")
```

---

## Responsive Specifications

### Breakpoints

| Name | Min Width | Max Width |
|------|-----------|-----------|
| Mobile | 0 | 767px |
| Tablet | 768px | 1023px |
| Desktop | 1024px | ∞ |

### Responsive Changes

#### Mobile (< 768px)

| Component | Changes |
|-----------|---------|
| Modal | width: 100vw (bottom-sheet style), max-height: 92vh, border-radius: 16px 16px 0 0, padding: 24px |
| Title | font-size: 22px, line-height: 28px |
| Field rows (B, E, F) | flex-direction: column, gap: 8px (label on top of input) |
| Recipient / Danh hiệu inputs | width: 100% |
| Action bar (H) | flex-direction: column-reverse, gap: 12px; Hủy full-width below Gửi |
| Submit button | width: 100%, padding: 14px |
| Toolbar (C) | horizontally scrollable, overflow-x: auto |

#### Tablet (768px – 1023px)

| Component | Changes |
|-----------|---------|
| Modal | width: min(752px, 92vw), max-height: 90vh, overflow-y: auto, padding: 32px |
| Field rows | retain row layout; if overflow, wrap labels above inputs |

#### Desktop (≥ 1024px)

| Component | Changes |
|-----------|---------|
| Modal | width: 752px, centered, max-height: 92vh, overflow-y: auto |
| Layout | Exactly as Figma |

---

## Icon Specifications

| Icon Name | Size | Color | Usage |
|-----------|------|-------|-------|
| ic-chevron-down | 24×24 | #00101A | Recipient / Danh hiệu select suffix |
| ic-bold (B) | 20×20 | currentColor | Toolbar |
| ic-italic (I) | 20×20 | currentColor | Toolbar |
| ic-strikethrough (S) | 20×20 | currentColor | Toolbar |
| ic-list-bulleted | 20×20 | currentColor | Toolbar (C.4) |
| ic-link | 20×20 | currentColor | Toolbar |
| ic-quote | 20×20 | currentColor | Toolbar |
| ic-plus | 16×16 | #00101A | "+ Hashtag", "+ Image" |
| ic-close | 16×16 | #00101A | Chip remove `✕`, thumbnail remove `✕` |
| ic-check | 14×14 | #00101A | Anonymous checkbox (checked) |
| ic-mask | 24×24 | #998C5F | Prefix icon inside the G.1 alias input |
| ic-spinner | 20×20 | #998C5F | Submit loading, thumbnail upload |

> All icons **MUST BE** rendered via the project `Icon` component, not inline `<svg>` or `<img>`.

---

## Animation & Transitions

| Element | Property | Duration | Easing | Trigger |
|---------|----------|----------|--------|---------|
| Modal | opacity + scale | 180ms | ease-out | Open/Close |
| Backdrop | opacity | 180ms | ease-out | Open/Close |
| Submit button | background-color | 150ms | ease-in-out | Hover / Active |
| Toolbar button | background-color | 120ms | ease-in-out | Hover / Toggle |
| Input / textarea | border-color, box-shadow | 150ms | ease-in-out | Focus |
| Chip (hashtag) | opacity, transform | 120ms | ease-out | Add / Remove |
| Thumbnail | opacity | 180ms | ease-out | Upload success |
| Mention dropdown | opacity, transform-y | 150ms | ease-out | Open (on `@`) |

---

## Implementation Mapping

| Design Element | Figma Node ID | Tailwind / CSS Class | React Component |
|----------------|---------------|---------------------|-----------------|
| Modal container | 520:11647 | `w-[752px] bg-[#FFF8E1] rounded-3xl p-10 flex flex-col gap-8` | `<KudoModal>` |
| Modal title (A) | I520:11647;520:9870 | `text-[32px] leading-10 font-bold text-center text-[#00101A]` | `<ModalTitle>` |
| Recipient row (B) | I520:11647;520:9871 | `flex flex-row gap-4 items-center h-14 w-full` | `<FieldRow>` |
| Field label (B.1/E.1/F.1) | 520:9872 / 520:9891 / 520:9897 | `text-[22px] leading-7 font-bold text-[#00101A]` | `<FieldLabel required />` |
| Search/select input (B.2) | I520:11647;520:9873 | `flex-1 h-14 px-6 py-4 rounded-lg border border-[#998C5F] bg-white` | `<UserSearchSelect>` |
| Danh hiệu block | I520:11647;1688:10448 | `flex flex-col gap-1 w-full` | `<TitleSelectField>` |
| Toolbar row (C) | I520:11647;520:9877 | `flex flex-row justify-between items-center w-full h-10` | `<EditorToolbarRow>` — wraps `<EditorToolbar>` (left) and `<CommunityStandardsLink>` (right) |
| Toolbar button (C.1–C.6) | 520:9881 / 662:11119 / 662:11213 / 662:10376 / 662:10507 / 662:10647 | `h-10 px-4 py-2.5 border border-[#998C5F] bg-transparent` | `<ToolbarButton variant="{bold/italic/strike/bulletList/link/quote}">` |
| Textarea (D) | I520:11647;520:9886 | `w-full h-[200px] px-6 py-4 bg-white border border-[#998C5F] rounded-b-lg border-t-0` | `<RichTextArea>` |
| Mention hint row (D.1) | I520:11647;520:9887 | `flex flex-row justify-start items-center h-6 text-base font-bold text-[#00101A] tracking-[0.5px]` | `<MentionHintRow>` |
| Hashtag tag group (E.2) | I520:11647;662:8595 | `flex flex-row gap-2 items-center` | `<HashtagPicker max={5}>` |
| Hashtag chip | — (instance) | `bg-[#FFEA9E] border border-[#998C5F] rounded-full px-3 py-2` | `<Chip onRemove>` |
| Image thumbnail | 662:9197 / 662:9393 / 662:9439 | `w-20 h-20 rounded-[18px] border border-[#998C5F] bg-white object-cover` | `<ImageThumbnail onRemove>` |
| Add image button (F.5) | I520:11647;662:9132 | `w-[98px] h-12 flex flex-col items-center gap-0.5` | `<AddImageButton max={5}>` |
| Anonymous toggle (G) | I520:11647;520:14099 | `flex flex-row gap-4 items-center h-7` | `<AnonymousCheckbox>` |
| Anonymous alias input (G.1) | — *(conditional, not in `list_design_items`)* | `flex flex-row gap-4 items-center w-full; input: flex-1 h-14 px-6 py-4 rounded-lg border border-[#998C5F] bg-white` | `<AnonymousAliasInput>` (rendered when G=checked) |
| `Tiêu chuẩn cộng đồng` link | I520:11647;3053:11621 | `text-[#E46060] text-base font-bold leading-6 hover:underline` | `<CommunityStandardsLink>` (sits in toolbar row, not below textarea) |
| Cancel button (H.1) | I520:11647;520:9906 | `px-10 py-4 border border-[#998C5F] rounded bg-[#FFEA9E]/10` | `<Button variant="secondary">` |
| Submit button (H.2) | I520:11647;520:9907 | `flex-1 h-[60px] p-4 bg-[#FFEA9E] rounded-lg text-[22px] leading-7 font-bold` | `<Button variant="primary">` |

---

## Notes

- Colors use CSS variables for theming support; modal theme reuses the SAA warm palette (`#FFF8E1` cream surface, `#FFEA9E` gold accent, `#00101A` deep navy text, `#998C5F` olive border).
- Prefer Tailwind utility classes for this project.
- All icons **MUST BE** rendered through the project `Icon` component — never inline SVG or `<img>`.
- Fonts: Montserrat (primary), Noto Sans JP (for `*` required marker) — load once at app root.
- Ensure color contrast meets WCAG AA: `#00101A` on `#FFEA9E` ≈ 14.3:1 ✅, `#00101A` on `#FFF8E1` ≈ 15.4:1 ✅, `#E46060` on `#FFF8E1` ≈ 4.2:1 — **warning**, bolden & underline on hover to compensate.
- Required-field asterisk uses Noto Sans JP 16/20 700 #CF1322 — consistent across Recipient, Danh hiệu, Hashtag.
- Modal must lock body scroll and trap focus (WCAG 2.4.3).
