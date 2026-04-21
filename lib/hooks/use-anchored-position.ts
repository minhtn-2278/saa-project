"use client";

import { useEffect, useLayoutEffect, useState, type RefObject } from "react";

/**
 * Shared anchored-positioning hook for popovers / dropdowns that portal
 * their panel into `document.body`. Matches the hand-rolled pattern already
 * used by `components/kudos/WriteKudoModal/HashtagPicker.tsx`; centralised
 * here so Live-board primitives (AnchoredSingleSelect) and future Viết Kudo
 * refactors share a single source of truth (plan § T020).
 *
 * USAGE:
 *   ```tsx
 *   const triggerRef = useRef<HTMLButtonElement>(null);
 *   const [open, setOpen] = useState(false);
 *   const pos = useAnchoredPosition(triggerRef, open);
 *   // render the panel absolutely at { top: pos.top, left: pos.left, minWidth: pos.width }
 *   ```
 *
 * Behaviour:
 *   - When `open` flips to true, captures the trigger's bounding rect.
 *   - Re-captures on `scroll` (any ancestor) and `resize` while open.
 *   - Returns `null` when closed — caller should skip rendering the panel.
 *
 * Coordinates are in **document** space (`pageYOffset + rect.top`) so the
 * portal target (`document.body`) renders correctly regardless of scroll.
 * If the trigger lives inside a scrolling container, the `scroll` listener
 * (registered with `capture: true`) will still see the event.
 */

export interface AnchoredPosition {
  /** Document-space top px for the panel's top edge (below the trigger + 4 px gap). */
  top: number;
  /** Document-space left px for the panel's left edge. */
  left: number;
  /** Trigger width — useful as `minWidth` so the panel at least spans the trigger. */
  width: number;
}

const GAP_PX = 4;

/**
 * @param ref   RefObject for the trigger element (button / input wrapper).
 * @param open  Whether the panel is currently open. When false, returns `null`.
 * @returns     Measured `{ top, left, width }` or `null` when closed.
 */
export function useAnchoredPosition(
  ref: RefObject<HTMLElement | null>,
  open: boolean,
): AnchoredPosition | null {
  const [position, setPosition] = useState<AnchoredPosition | null>(null);

  useLayoutEffect(() => {
    if (!open) {
      setPosition(null);
      return;
    }
    const measure = () => {
      const node = ref.current;
      if (!node) return;
      const rect = node.getBoundingClientRect();
      setPosition({
        top: rect.bottom + window.pageYOffset + GAP_PX,
        left: rect.left + window.pageXOffset,
        width: rect.width,
      });
    };
    measure();
    // fall through to the effect below that installs listeners
  }, [ref, open]);

  useEffect(() => {
    if (!open) return;
    const handle = () => {
      const node = ref.current;
      if (!node) return;
      const rect = node.getBoundingClientRect();
      setPosition({
        top: rect.bottom + window.pageYOffset + GAP_PX,
        left: rect.left + window.pageXOffset,
        width: rect.width,
      });
    };
    // capture: true so we catch scroll events on ancestor scrollers too.
    window.addEventListener("resize", handle, { passive: true });
    window.addEventListener("scroll", handle, { passive: true, capture: true });
    return () => {
      window.removeEventListener("resize", handle);
      window.removeEventListener("scroll", handle, {
        capture: true,
      } as unknown as AddEventListenerOptions);
    };
  }, [ref, open]);

  return position;
}
