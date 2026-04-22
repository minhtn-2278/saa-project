"use client";

import { useEffect, useId, useRef } from "react";
import { CheckIcon } from "@/components/ui/icons/CheckIcon";
import type { HashtagPreview } from "./hooks/useKudoForm";

export interface HashtagDropdownItem extends HashtagPreview {
  selected: boolean;
  disabled?: boolean;
}

interface HashtagDropdownProps {
  /** Inline search term (controlled). */
  query: string;
  onQueryChange: (next: string) => void;
  /** Placeholder text for the search input. */
  placeholder?: string;
  /** Items to render — parent marks `selected`/`disabled`. */
  items: HashtagDropdownItem[];
  /** User toggled a row. */
  onToggle: (item: HashtagPreview) => void;
  /** Parent dismiss (Escape, outside click). */
  onDismiss: () => void;
  /** Optional create-row rendered at the bottom (see `ComboboxCreateRow`). */
  footer?: React.ReactNode;
  /** Loading indicator row. */
  loading?: boolean;
  /** Accessible label id from the parent `<FieldLabel>`. */
  labelledBy?: string;
}

/**
 * Dark-themed multi-select dropdown for the hashtag picker.
 *
 * Matches Figma `p9zO-c4a4x`: charcoal card, white `#Label` rows, white
 * circular checkmark on selected rows. Unlike the generic `<Combobox>`,
 * this dropdown stays open across toggles so the user can pick up to 5
 * hashtags in one flow.
 */
export function HashtagDropdown({
  query,
  onQueryChange,
  placeholder,
  items,
  onToggle,
  onDismiss,
  footer,
  loading,
  labelledBy,
}: HashtagDropdownProps) {
  const listboxId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Autofocus the search input so keyboard users can type immediately.
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Dismiss on outside click / Escape.
  useEffect(() => {
    const onDocDown = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) onDismiss();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onDismiss();
      }
    };
    document.addEventListener("mousedown", onDocDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [onDismiss]);

  return (
    <div
      ref={containerRef}
      className="w-full sm:w-80 rounded-2xl overflow-hidden shadow-lg"
      style={{
        background: "var(--color-surface-dark-1, #1D1F15)",
        border: "1px solid rgba(153, 140, 95, 0.4)",
      }}
    >
      <div className="px-3 pt-3 pb-2">
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded
          aria-controls={listboxId}
          aria-labelledby={labelledBy}
          aria-autocomplete="list"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder={placeholder}
          className="w-full h-9 px-3 rounded-md bg-white/5 text-sm text-white placeholder:text-white/40 outline-none focus:ring-2 focus:ring-[#FFEA9E]/30"
        />
      </div>

      <ul
        id={listboxId}
        role="listbox"
        aria-multiselectable="true"
        aria-labelledby={labelledBy}
        className="max-h-72 overflow-auto pb-1"
      >
        {loading && items.length === 0 ? (
          <li className="px-4 py-2.5 text-sm text-white/50">Đang tải…</li>
        ) : null}

        {!loading && items.length === 0 && !footer ? (
          <li className="px-4 py-2.5 text-sm text-white/50">Không có kết quả</li>
        ) : null}

        {items.map((item) => {
          const rowDisabled = item.disabled && !item.selected;
          return (
            <li
              key={`${item.id}:${item.label}`}
              role="option"
              aria-selected={item.selected}
              aria-disabled={rowDisabled || undefined}
            >
              <button
                type="button"
                disabled={rowDisabled}
                onClick={() => onToggle(item)}
                className="w-full flex items-center justify-between gap-3 px-4 py-2.5 text-sm font-bold text-white text-left transition-colors hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <span className="truncate">#{item.label}</span>
                {item.selected ? (
                  <span
                    aria-hidden
                    className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-white/15"
                  >
                    <CheckIcon size={12} className="text-white" />
                  </span>
                ) : null}
              </button>
            </li>
          );
        })}

        {footer ? <li className="border-t border-white/10">{footer}</li> : null}
      </ul>
    </div>
  );
}
