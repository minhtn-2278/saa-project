# public/assets/

Static assets consumed by features in `app/`. Each file documents its source
(Figma node) so designers can export replacements without guessing paths.

## Current assets

| File | Used by | Source | Status |
|------|---------|--------|--------|
| `kv-kudos-wordmark.svg` | `components/kudos/LiveBoard/KvBanner.tsx` (`A` block on screen `MaZUn5xHXZ`) | Figma file `9ypp4enmFmdK3YAFJLIu6C`, node `2940:13437` — the stylised `KUDOS` wordmark with the red brush-stroke accent | **Final export** (593 × 106 intrinsic viewBox) — cream letters + layered red brush strokes with a multiply-blend gradient. Render via `next/image` with `width={593} height={106}` so the aspect ratio stays stable across breakpoints. |

The banner's background art is **not** a file in this directory — the
KV banner reuses the homepage hero image at
`/public/images/homepage-hero-bg.png` plus a CSS gradient overlay for
consistency with the rest of the dashboard.

## Export instructions (KUDOS wordmark)

1. Open the Figma file `9ypp4enmFmdK3YAFJLIu6C`.
2. Select the `KUDOS` group inside node `2940:13437` (frame `MaZUn5xHXZ` → `A_KV Kudos`).
3. In the right panel → Export → `SVG`.
4. Drop the exported file in this folder as `kv-kudos-wordmark.svg`, overwriting the placeholder.
5. Commit with a short message referencing plan task `T003`.

The consuming component uses `<Image src="/assets/kv-kudos-wordmark.svg" />`
so swapping the file takes effect immediately — no code changes needed.
