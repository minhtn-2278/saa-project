# public/assets/

Static assets consumed by features in `app/`. Each file documents its source
(Figma node) so designers can export replacements without guessing paths.

## Current assets

| File | Used by | Source | Status |
|------|---------|--------|--------|
| `kv-kudos-wordmark.svg` | `components/kudos/LiveBoard/KvBanner.tsx` (`A` block on screen `MaZUn5xHXZ`) | Figma file `9ypp4enmFmdK3YAFJLIu6C`, node `2940:13437` — the stylised `KUDOS` wordmark inside the KV banner | **PLACEHOLDER** — text-based stand-in with the same bounding box. Replace before launch. |

## Export instructions (KUDOS wordmark)

1. Open the Figma file `9ypp4enmFmdK3YAFJLIu6C`.
2. Select the `KUDOS` group inside node `2940:13437` (frame `MaZUn5xHXZ` → `A_KV Kudos`).
3. In the right panel → Export → `SVG`.
4. Drop the exported file in this folder as `kv-kudos-wordmark.svg`, overwriting the placeholder.
5. Commit with a short message referencing plan task `T003`.

The consuming component uses `<Image src="/assets/kv-kudos-wordmark.svg" />`
so swapping the file takes effect immediately — no code changes needed.
