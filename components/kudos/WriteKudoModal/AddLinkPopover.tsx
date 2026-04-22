"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { useTranslations } from "next-intl";
import { CloseIcon } from "@/components/ui/icons/CloseIcon";
import { LinkIcon } from "@/components/ui/icons/LinkIcon";

interface AddLinkPopoverProps {
  initialText?: string;
  initialUrl?: string;
  onCancel: () => void;
  onSave: (payload: { text: string; url: string }) => void;
}

/**
 * Cream "Add link" popover used by the EditorToolbar's link button.
 * Matches Figma node `OyDLDuSGEa` — single cream card with a `Thêm đường dẫn`
 * title, Nội dung + URL fields and Hủy / Lưu buttons.
 *
 * The component is mounted fresh each time the popover opens (parent
 * conditionally renders), so the props initializers seed state once and we
 * avoid the setState-in-effect cascade.
 */
export function AddLinkPopover({
  initialText = "",
  initialUrl = "",
  onCancel,
  onSave,
}: AddLinkPopoverProps) {
  const t = useTranslations("kudos.writeKudo.addLink");
  const titleId = useId();
  const textInputRef = useRef<HTMLInputElement>(null);
  const [text, setText] = useState(initialText);
  const [url, setUrl] = useState(initialUrl);
  const [urlError, setUrlError] = useState<string | null>(null);

  // Autofocus the text input + wire Escape-to-cancel. Both are one-shot
  // side-effects tied to mount; no setState inside the body.
  useEffect(() => {
    const timeoutId = window.setTimeout(
      () => textInputRef.current?.focus(),
      0,
    );
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onCancel();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(timeoutId);
      document.removeEventListener("keydown", onKey);
    };
  }, [onCancel]);

  const validateUrl = (value: string): boolean => {
    const trimmed = value.trim();
    if (trimmed.length === 0) return false;
    // Accept absolute http(s) OR same-origin relative paths like `/profile/1`.
    if (trimmed.startsWith("/")) return true;
    try {
      const parsed = new URL(trimmed);
      return parsed.protocol === "http:" || parsed.protocol === "https:";
    } catch {
      return false;
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!validateUrl(url)) {
      setUrlError(t("urlInvalid"));
      return;
    }
    // Text is optional — when empty the toolbar falls back to the URL itself
    // (or the current selection, handled by the caller).
    onSave({ text: text.trim(), url: url.trim() });
  };

  return (
    <div
      role="dialog"
      aria-labelledby={titleId}
      className="rounded-2xl p-5 shadow-lg"
      style={{
        background: "var(--color-accent-cream, #FFF8E1)",
        border: "1px solid var(--color-border-gold, #998C5F)",
        minWidth: 440,
        maxWidth: "100%",
      }}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <h2
          id={titleId}
          className="text-lg font-bold leading-6"
          style={{ color: "var(--color-surface-dark-1, #00070C)" }}
        >
          {t("title")}
        </h2>

        <div className="flex items-center gap-4">
          <label
            className="w-[72px] shrink-0 text-sm font-bold"
            style={{ color: "var(--color-surface-dark-1, #00070C)" }}
          >
            {t("textLabel")}
          </label>
          <input
            ref={textInputRef}
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="flex-1 h-10 px-3 rounded-lg bg-white text-sm outline-none focus:ring-2 focus:ring-[#998C5F]/40"
            style={{
              border: "1px solid var(--color-border-gold, #998C5F)",
              color: "var(--color-surface-dark-1, #00070C)",
            }}
          />
        </div>

        <div className="flex items-center gap-4">
          <label
            className="w-[72px] shrink-0 text-sm font-bold"
            style={{ color: "var(--color-surface-dark-1, #00070C)" }}
          >
            {t("urlLabel")}
          </label>
          <div className="flex-1 flex flex-col gap-1">
            <input
              type="url"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                if (urlError) setUrlError(null);
              }}
              aria-invalid={!!urlError || undefined}
              className="h-10 px-3 rounded-lg bg-white text-sm outline-none focus:ring-2 focus:ring-[#998C5F]/40"
              style={{
                border: urlError
                  ? "1px solid #CF1322"
                  : "1px solid var(--color-border-gold, #998C5F)",
                color: "var(--color-surface-dark-1, #00070C)",
              }}
            />
            {urlError ? (
              <p role="alert" className="text-xs text-[#CF1322]">
                {urlError}
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex items-center gap-3 pt-1">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-white text-sm font-bold"
            style={{
              border: "1px solid var(--color-border-gold, #998C5F)",
              color: "var(--color-surface-dark-1, #00070C)",
            }}
          >
            {t("cancel")}
            <CloseIcon size={16} />
          </button>
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 h-10 flex-1 rounded-lg text-sm font-bold transition-opacity hover:opacity-90"
            style={{
              background: "var(--color-accent-gold, #FFEA9E)",
              color: "var(--color-surface-dark-1, #00070C)",
            }}
          >
            {t("save")}
            <LinkIcon size={16} />
          </button>
        </div>
      </form>
    </div>
  );
}
