"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { FieldLabel } from "./parts/FieldLabel";
import { Chip } from "./parts/Chip";
import { Combobox, type ComboboxOption } from "./parts/Combobox";
import { ComboboxCreateRow } from "./parts/ComboboxCreateRow";
import { PlusIcon } from "@/components/ui/icons/PlusIcon";
import { useErrorResolver } from "./parts/resolveError";
import { MAX_HASHTAGS_PER_KUDO } from "@/lib/constants/kudos";
import { validateHashtagLabel } from "@/lib/kudos/hashtag-slug";
import type { HashtagPreview } from "./hooks/useKudoForm";

interface HashtagPickerProps {
  topHashtags: HashtagPreview[];
  value: HashtagPreview[];
  onAdd: (next: HashtagPreview) => void;
  onRemove: (id: number) => void;
  /** Remove a pending chip by its label (required when multiple pending share id=-1). */
  onRemoveByLabel: (label: string) => void;
  error?: string | null;
  disabled?: boolean;
}

/**
 * Hashtag picker. Design-style § E.2.
 *
 * Phase 3: select-existing only — typeahead against `GET /api/hashtags?q=`.
 * Phase 5 (FR-006): inline-create — when the typed label has no match
 *   AND passes charset + length rules, the combobox footer renders a
 *   "Tạo mới: {label}" row; selecting it adds a pending hashtag chip
 *   (`id=-1, pending=true`). Pending chips are persisted server-side when
 *   the Kudo is submitted.
 */
export function HashtagPicker({
  topHashtags,
  value,
  onAdd,
  onRemove,
  onRemoveByLabel,
  error,
  disabled,
}: HashtagPickerProps) {
  const t = useTranslations("kudos.writeKudo");
  const resolveError = useErrorResolver();
  const labelId = useId();
  const errorId = useId();
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<HashtagPreview[]>(topHashtags);
  const [loading, setLoading] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Refresh the results as user types.
  useEffect(() => {
    if (!popoverOpen) return;
    controllerRef.current?.abort();
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (query.trim().length === 0) {
      setResults(topHashtags);
      setLoading(false);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      const controller = new AbortController();
      controllerRef.current = controller;
      try {
        const res = await fetch(
          `/api/hashtags?q=${encodeURIComponent(query.trim())}`,
          { signal: controller.signal },
        );
        if (!res.ok) return;
        const json = (await res.json()) as {
          data: Array<{ id: number; label: string; usageCount: number }>;
        };
        setResults(
          json.data.map((h) => ({ id: h.id, label: h.label })),
        );
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          console.error("hashtag search error", err);
        }
      } finally {
        if (controllerRef.current === controller) {
          setLoading(false);
          controllerRef.current = null;
        }
      }
    }, 250);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, popoverOpen, topHashtags]);

  const max = MAX_HASHTAGS_PER_KUDO;
  const atLimit = value.length >= max;

  const availableResults = results.filter(
    (r) => !value.some((v) => v.label.toLowerCase() === r.label.toLowerCase()),
  );

  const options: ComboboxOption<HashtagPreview>[] = availableResults.map((h) => ({
    value: String(h.id),
    label: `#${h.label}`,
    data: h,
  }));

  const trimmed = query.trim();
  const normalized = trimmed.toLowerCase();
  const alreadySelected = value.some(
    (v) => v.label.toLowerCase() === normalized,
  );
  const exactMatch = availableResults.some(
    (r) => r.label.toLowerCase() === normalized,
  );
  const canCreate = trimmed.length > 0 && !exactMatch && !alreadySelected;
  const createHelperKey = canCreate ? validateHashtagLabel(trimmed) : null;
  const createHelper = createHelperKey
    ? resolveError(`hashtag.${createHelperKey}`)
    : undefined;

  const createPending = (label: string) => {
    const clean = label.trim();
    if (validateHashtagLabel(clean) !== null) return;
    onAdd({ id: -1, label: clean, pending: true });
    setQuery("");
    setPopoverOpen(false);
  };

  const removeChip = (chip: HashtagPreview) => {
    if (chip.pending) onRemoveByLabel(chip.label);
    else onRemove(chip.id);
  };

  return (
    <div
      className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-4 w-full"
      role="group"
      aria-labelledby={labelId}
    >
      <FieldLabel id={labelId} required className="sm:w-[108px] shrink-0">
        {t("fields.hashtag.label")}
      </FieldLabel>
      <div className="flex-1 w-full">
        <ul
          role="list"
          aria-invalid={!!error || undefined}
          className="flex flex-row flex-wrap items-center gap-2"
        >
          {value.map((tag) => (
            <li key={`${tag.id}:${tag.label}`} className="list-none">
              <Chip
                label={`#${tag.label}`}
                variant={tag.pending ? "pending" : "default"}
                onRemove={disabled ? undefined : () => removeChip(tag)}
                removeAriaLabel={`Xoá hashtag ${tag.label}`}
              />
            </li>
          ))}
          {!atLimit && !popoverOpen && (
            <li className="list-none">
              <button
                type="button"
                disabled={disabled}
                onClick={() => setPopoverOpen(true)}
                className="inline-flex items-center gap-1 px-3 py-2 rounded-full border border-[#998C5F] bg-transparent text-sm leading-5 font-bold text-[#00101A] hover:bg-[#FFEA9E]/30 focus:outline-2 focus:outline-[#998C5F] focus:outline-offset-2 disabled:opacity-60"
              >
                <PlusIcon size={14} />
                {t("fields.hashtag.addCta")}
              </button>
            </li>
          )}
        </ul>
        {popoverOpen && (
          <div className="mt-2 w-full sm:w-80">
            <Combobox<HashtagPreview>
              value={query}
              onChange={setQuery}
              placeholder={t("fields.hashtag.addCta")}
              options={options}
              loading={loading}
              disabled={disabled}
              labelledBy={labelId}
              hideChevron
              onSelect={(opt) => {
                onAdd(opt.data);
                setQuery("");
                setPopoverOpen(false);
              }}
              onCreate={
                canCreate && !createHelperKey ? createPending : undefined
              }
              footer={
                canCreate ? (
                  <ComboboxCreateRow
                    label={trimmed}
                    onCreate={createPending}
                    helperError={createHelper}
                  />
                ) : null
              }
            />
          </div>
        )}
        {error ? (
          <p id={errorId} role="alert" className="mt-1 text-sm text-[#CF1322]">
            {resolveError(error)}
          </p>
        ) : atLimit ? (
          <p className="mt-1 text-sm text-[#999999]">
            {t("fields.hashtag.maxHint")}
          </p>
        ) : null}
      </div>
    </div>
  );
}
