"use client";

import { useId, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { FieldLabel } from "./parts/FieldLabel";
import { Combobox, type ComboboxOption } from "./parts/Combobox";
import { ComboboxCreateRow } from "./parts/ComboboxCreateRow";
import { useErrorResolver } from "./parts/resolveError";
import {
  MAX_TITLE_NAME_LENGTH,
  MIN_TITLE_NAME_LENGTH,
} from "@/lib/constants/kudos";
import type { TitlePreview } from "./hooks/useKudoForm";

interface TitleFieldProps {
  titles: TitlePreview[];
  value: TitlePreview | null;
  onChange: (next: TitlePreview | null) => void;
  error?: string | null;
  disabled?: boolean;
}

/**
 * Danh hiệu (title) field. Design-style § Danh hiệu block.
 *
 * Select-existing OR inline-create (FR-006a):
 *   - typing a label that has no exact match shows a sticky "Tạo mới" row;
 *   - clicking/Enter marks the title as `pending: true` (id=-1) until submit
 *     upserts it server-side.
 * Receives pre-loaded `titles` prop from the Server Component parent
 * (no client-side fetch on first paint, TR-001).
 */
export function TitleField({
  titles,
  value,
  onChange,
  error,
  disabled,
}: TitleFieldProps) {
  const t = useTranslations("kudos.writeKudo");
  const resolveError = useErrorResolver();
  const labelId = useId();
  const errorId = useId();
  const hintId = useId();

  const [query, setQuery] = useState(value?.name ?? "");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length === 0) return titles;
    return titles.filter((t) => t.name.toLowerCase().includes(q));
  }, [query, titles]);

  const options: ComboboxOption<TitlePreview>[] = filtered.map((t) => ({
    value: String(t.id),
    label: t.name,
    data: t,
  }));

  const trimmed = query.trim();
  const normalized = trimmed.toLowerCase();
  const exactMatch = titles.some((t) => t.name.toLowerCase() === normalized);
  const canCreate = trimmed.length > 0 && !exactMatch;
  const createHelper =
    canCreate &&
    (trimmed.length < MIN_TITLE_NAME_LENGTH ||
      trimmed.length > MAX_TITLE_NAME_LENGTH)
      ? resolveError("title.length")
      : undefined;

  const createPending = (label: string) => {
    const name = label.trim();
    if (name.length < MIN_TITLE_NAME_LENGTH || name.length > MAX_TITLE_NAME_LENGTH) {
      return;
    }
    setQuery(name);
    onChange({ id: -1, name, pending: true });
  };

  const handleChange = (next: string) => {
    setQuery(next);
    if (next.trim().length === 0 && value) onChange(null);
  };

  return (
    <div className="flex flex-col gap-1 w-full" role="group" aria-labelledby={labelId}>
      <FieldLabel id={labelId} required>
        {t("fields.title.label")}
      </FieldLabel>
      <Combobox<TitlePreview>
        value={query}
        onChange={handleChange}
        placeholder={t("fields.title.placeholder")}
        options={options}
        disabled={disabled}
        invalid={!!error}
        labelledBy={labelId}
        describedBy={error ? errorId : hintId}
        onSelect={(opt) => {
          setQuery(opt.label);
          onChange(opt.data);
        }}
        onCreate={canCreate && !createHelper ? createPending : undefined}
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
      {error ? (
        <p id={errorId} role="alert" className="mt-1 text-sm text-[#CF1322]">
          {resolveError(error)}
        </p>
      ) : (
        <p
          id={hintId}
          className="mt-1 text-base leading-6 font-bold text-[#999999] whitespace-pre-line"
        >
          {t("fields.title.hint")}
        </p>
      )}
    </div>
  );
}
