"use client";

import {
  type ReactNode,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { ChevronDownIcon } from "@/components/ui/icons/ChevronDownIcon";

export interface ComboboxOption<T> {
  value: string;
  label: string;
  data: T;
}

export interface ComboboxProps<T> {
  /** Current input value (controlled). */
  value: string;
  /** Called as user types. */
  onChange: (next: string) => void;
  placeholder?: string;
  /** Options to render in the popover. */
  options: ComboboxOption<T>[];
  /** Called when the user picks an option. */
  onSelect: (option: ComboboxOption<T>) => void;
  /** Called when Enter pressed with no exact match (inline-create hook). */
  onCreate?: (label: string) => void;
  /** Disables input + popover open. */
  disabled?: boolean;
  /** Show invalid state (red border). */
  invalid?: boolean;
  /** Accessible label bound via aria-labelledby to parent <label>. */
  labelledBy?: string;
  /** aria-describedby id (for helper / error text). */
  describedBy?: string;
  /** Loading spinner slot. */
  loading?: boolean;
  /** Optional renderer for an option row. Defaults to label. */
  renderOption?: (option: ComboboxOption<T>) => ReactNode;
  /** Optional footer (e.g. "Tạo mới" row for inline-create). */
  footer?: ReactNode;
  /** Disable the arrow suffix. */
  hideChevron?: boolean;
  /** Custom input className overrides. */
  className?: string;
}

/**
 * Accessible combobox implementing the WAI-ARIA combobox pattern.
 * Used by RecipientField, TitleField (Phase 3: select-existing) and later
 * the HashtagPicker popover.
 */
export function Combobox<T>({
  value,
  onChange,
  placeholder,
  options,
  onSelect,
  onCreate,
  disabled,
  invalid,
  labelledBy,
  describedBy,
  loading,
  renderOption,
  footer,
  hideChevron,
  className,
}: ComboboxProps<T>) {
  const listboxId = useId();
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const close = useCallback(() => {
    setOpen(false);
    setHighlighted(0);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (!wrapperRef.current?.contains(e.target as Node)) close();
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open, close]);

  useEffect(() => {
    // Clamp highlighted when options change.
    if (highlighted >= options.length && options.length > 0) {
      setHighlighted(options.length - 1);
    }
  }, [options.length, highlighted]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setHighlighted((h) => Math.min(h + 1, Math.max(options.length - 1, 0)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setOpen(true);
      setHighlighted((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      if (!open) return;
      e.preventDefault();
      const opt = options[highlighted];
      if (opt) {
        onSelect(opt);
        close();
      } else if (onCreate && value.trim().length > 0) {
        onCreate(value.trim());
        close();
      }
    } else if (e.key === "Escape") {
      if (open) {
        e.preventDefault();
        close();
      }
    }
  };

  const borderClass = invalid ? "border-[#CF1322]" : "border-[#998C5F]";
  const baseClass = `flex-1 h-14 px-6 py-4 rounded-lg border bg-white font-bold leading-6 text-base text-[#00101A] placeholder:text-[#999999] focus:outline-2 focus:outline-[#998C5F] focus:outline-offset-2 disabled:opacity-60 disabled:cursor-not-allowed ${borderClass}`;

  return (
    <div ref={wrapperRef} className="relative flex-1">
      <div className="relative flex items-center">
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-labelledby={labelledBy}
          aria-describedby={describedBy}
          aria-expanded={open}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-activedescendant={
            open && options[highlighted]
              ? `${listboxId}-opt-${highlighted}`
              : undefined
          }
          aria-invalid={invalid || undefined}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
            setHighlighted(0);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className={className ?? baseClass}
        />
        {!hideChevron && (
          <ChevronDownIcon
            size={24}
            className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#00101A]"
          />
        )}
      </div>
      {open && (options.length > 0 || onCreate || footer) && (
        <ul
          id={listboxId}
          role="listbox"
          className="absolute z-10 mt-1 w-full max-h-60 overflow-auto bg-white border border-[#998C5F] rounded-lg shadow-md"
        >
          {loading && (
            <li className="px-4 py-3 text-sm text-[#999999]">Đang tải…</li>
          )}
          {!loading && options.length === 0 && !onCreate && !footer && (
            <li className="px-4 py-3 text-sm text-[#999999]">Không có kết quả</li>
          )}
          {options.map((opt, idx) => (
            <li
              id={`${listboxId}-opt-${idx}`}
              key={opt.value}
              role="option"
              aria-selected={idx === highlighted}
              onMouseEnter={() => setHighlighted(idx)}
              onMouseDown={(e) => {
                e.preventDefault(); // keep input focus
                onSelect(opt);
                close();
              }}
              className={`px-4 py-3 cursor-pointer text-[#00101A] ${
                idx === highlighted ? "bg-[#FFF8E1]" : "bg-white"
              }`}
            >
              {renderOption ? renderOption(opt) : opt.label}
            </li>
          ))}
          {footer}
        </ul>
      )}
    </div>
  );
}
