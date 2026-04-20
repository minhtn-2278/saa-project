"use client";

import { useId, useState } from "react";
import { useTranslations } from "next-intl";
import { FieldLabel } from "./parts/FieldLabel";
import { Combobox, type ComboboxOption } from "./parts/Combobox";
import { useErrorResolver } from "./parts/resolveError";
import { useEmployeeSearch } from "./hooks/useEmployeeSearch";
import type { EmployeePreview } from "./hooks/useKudoForm";

interface RecipientFieldProps {
  value: EmployeePreview | null;
  onChange: (next: EmployeePreview | null) => void;
  error?: string | null;
  disabled?: boolean;
  autoFocus?: boolean;
}

/**
 * Recipient search+select. Design-style § B.
 *
 * - Autocompletes via `/api/employees/search` with 250 ms debounce.
 * - Caller excluded by default (`ignore_caller=true`).
 * - Soft-deleted employees are filtered server-side.
 */
export function RecipientField({
  value,
  onChange,
  error,
  disabled,
}: RecipientFieldProps) {
  const t = useTranslations("kudos.writeKudo");
  const resolveError = useErrorResolver();
  const labelId = useId();
  const errorId = useId();

  const [query, setQuery] = useState(value?.fullName ?? "");
  const { results, loading, search } = useEmployeeSearch({ includeCaller: false });

  const options: ComboboxOption<EmployeePreview>[] = results.map((e) => ({
    value: String(e.id),
    label: e.fullName,
    data: e,
  }));

  const handleChange = (next: string) => {
    setQuery(next);
    search(next);
    // If user cleared the field, clear the selection too.
    if (next.trim().length === 0 && value) onChange(null);
  };

  return (
    <div
      className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 w-full"
      role="group"
      aria-labelledby={labelId}
    >
      <FieldLabel id={labelId} required className="sm:w-[146px] shrink-0">
        {t("fields.recipient.label")}
      </FieldLabel>
      <div className="flex-1 w-full">
        <Combobox<EmployeePreview>
          value={query}
          onChange={handleChange}
          placeholder={t("fields.recipient.placeholder")}
          options={options}
          loading={loading}
          disabled={disabled}
          invalid={!!error}
          labelledBy={labelId}
          describedBy={error ? errorId : undefined}
          onSelect={(opt) => {
            setQuery(opt.label);
            onChange(opt.data);
          }}
          renderOption={(opt) => (
            <div className="flex items-center gap-3">
              {opt.data.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={opt.data.avatarUrl}
                  alt=""
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-[#FFEA9E]" aria-hidden />
              )}
              <div className="flex flex-col">
                <span className="font-bold text-[#00101A]">{opt.label}</span>
                {opt.data.department && (
                  <span className="text-xs text-[#999999]">
                    {opt.data.department}
                  </span>
                )}
              </div>
            </div>
          )}
        />
        {error && (
          <p id={errorId} role="alert" className="mt-1 text-sm text-[#CF1322]">
            {resolveError(error)}
          </p>
        )}
      </div>
    </div>
  );
}
