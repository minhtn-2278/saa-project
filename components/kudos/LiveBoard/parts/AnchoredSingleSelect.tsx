"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { useAnchoredPosition } from "@/lib/hooks/use-anchored-position";
import { ChevronDownIcon } from "@/components/ui/icons/ChevronDownIcon";
import { CloseIcon } from "@/components/ui/icons/CloseIcon";

export interface AnchoredSelectItem<T extends string | number> {
  value: T;
  label: string;
}

interface AnchoredSingleSelectProps<T extends string | number> {
  /** Label rendered on the trigger when no selection is active. */
  triggerLabel: string;
  /** Items to render inside the panel. Caller owns ordering. */
  items: AnchoredSelectItem<T>[];
  /** Currently-selected value, or `null` when none. */
  value: T | null;
  /**
   * Called when the user picks an item or toggles the current selection off.
   * `next` is the chosen value, or `null` when the user clears the filter.
   */
  onChange: (next: T | null) => void;
  /** Width of the panel (px). Defaults to 240. */
  panelWidth?: number;
  /** Max height of the panel (px). Scrolls when overflowed. Defaults to 348. */
  panelMaxHeight?: number;
  /** Optional aria label for the trigger button. */
  ariaLabel?: string;
  /** Optional leading icon for the trigger (e.g. hashtag #, department icon). */
  leadingIcon?: ReactNode;
}

/**
 * Shared anchored dropdown primitive used by the Live-board Hashtag
 * (`B.1.1` → `JWpsISMAaM`) and Phòng ban (`B.1.2` → `WXK5AYB_rG`) filters.
 *
 * Behaviour:
 *   - Single-select. Re-clicking the active item clears the filter
 *     (`onChange(null)`).
 *   - Keyboard nav: ArrowUp / ArrowDown moves focus, Enter selects,
 *     Escape closes.
 *   - Outside click / scroll closes without changing the selection.
 *   - Panel is portalled into `document.body` with absolute positioning via
 *     `useAnchoredPosition` — same pattern as Viết Kudo's HashtagPicker.
 *
 * Visual tokens follow design-style.md § Dropdowns (dark panel, gold-tint
 * selected row, 4 px radius, white text).
 *
 * Plan § T028.
 */
export function AnchoredSingleSelect<T extends string | number>({
  triggerLabel,
  items,
  value,
  onChange,
  panelWidth = 240,
  panelMaxHeight = 348,
  ariaLabel,
  leadingIcon,
}: AnchoredSingleSelectProps<T>) {
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const listboxId = useId();

  const position = useAnchoredPosition(triggerRef, open);

  const selectedItem =
    value !== null ? items.find((it) => it.value === value) : undefined;
  const displayLabel = selectedItem ? selectedItem.label : triggerLabel;

  // Close on outside click.
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node | null;
      if (!target) return;
      if (triggerRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Reset focus index when opening.
  useEffect(() => {
    if (open) {
      const i = value !== null ? items.findIndex((it) => it.value === value) : -1;
      setActiveIndex(i >= 0 ? i : 0);
    } else {
      setActiveIndex(-1);
    }
  }, [open, items, value]);

  const handleSelect = useCallback(
    (v: T) => {
      if (v === value) {
        onChange(null); // toggle-off
      } else {
        onChange(v);
      }
      setOpen(false);
    },
    [onChange, value],
  );

  const handleTriggerKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setOpen(true);
    }
  };

  const handlePanelKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
      triggerRef.current?.focus();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(items.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      const item = items[activeIndex];
      if (item) handleSelect(item.value);
    } else if (e.key === "Home") {
      e.preventDefault();
      setActiveIndex(0);
    } else if (e.key === "End") {
      e.preventDefault();
      setActiveIndex(items.length - 1);
    }
  };

  const panelStyle =
    position !== null
      ? {
          top: position.top,
          left: position.left,
          minWidth: Math.max(position.width, panelWidth),
          maxHeight: panelMaxHeight,
        }
      : undefined;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-label={ariaLabel ?? triggerLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={handleTriggerKeyDown}
        className="inline-flex items-center gap-2 h-14 px-4 rounded text-base font-bold text-white transition-colors"
        style={{
          background: "var(--color-live-button-soft)",
          border: "1px solid var(--color-live-border-gold)",
          letterSpacing: "0.5px",
        }}
      >
        {leadingIcon}
        <span className="truncate max-w-[220px]">{displayLabel}</span>
        {value !== null ? (
          <span
            role="button"
            aria-label="Xóa bộ lọc"
            tabIndex={-1}
            onClick={(e) => {
              e.stopPropagation();
              onChange(null);
              setOpen(false);
            }}
            className="ml-1 opacity-80 hover:opacity-100"
          >
            <CloseIcon size={14} />
          </span>
        ) : (
          <ChevronDownIcon
            size={16}
            className={open ? "rotate-180 transition-transform" : "transition-transform"}
          />
        )}
      </button>
      {open && position && typeof document !== "undefined"
        ? createPortal(
            <div
              ref={panelRef}
              role="listbox"
              id={listboxId}
              tabIndex={-1}
              aria-activedescendant={
                activeIndex >= 0 ? `${listboxId}-opt-${activeIndex}` : undefined
              }
              onKeyDown={handlePanelKeyDown}
              className="absolute z-50 overflow-y-auto rounded-lg p-1.5 flex flex-col shadow-xl focus:outline-none"
              style={{
                ...panelStyle,
                background: "var(--color-live-surface-dark-1)",
                border: "1px solid var(--color-live-border-gold)",
                boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
              }}
            >
              {items.length === 0 ? (
                <p className="text-sm text-white/60 px-4 py-3">—</p>
              ) : (
                items.map((item, i) => {
                  const selected = item.value === value;
                  const active = i === activeIndex;
                  return (
                    <button
                      key={String(item.value)}
                      id={`${listboxId}-opt-${i}`}
                      role="option"
                      aria-selected={selected}
                      type="button"
                      onMouseEnter={() => setActiveIndex(i)}
                      onClick={() => handleSelect(item.value)}
                      className="w-full h-14 rounded text-left text-base font-bold text-white px-4 transition-colors"
                      style={{
                        background: selected
                          ? "var(--color-live-button-soft)"
                          : active
                            ? "rgba(255, 234, 158, 0.06)"
                            : "transparent",
                        letterSpacing: "0.5px",
                        textShadow: selected
                          ? "0 4px 4px rgba(0,0,0,0.25), var(--glow-live-gold-lg)"
                          : undefined,
                      }}
                    >
                      {item.label}
                    </button>
                  );
                })
              )}
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
