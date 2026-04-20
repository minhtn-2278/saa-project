import { useTranslations } from "next-intl";

/**
 * The Zod schemas and Route Handlers emit i18n keys (e.g. `recipient.required`).
 * This helper resolves them under the `kudos.writeKudo.errors` namespace, and
 * falls back to the raw string if the key is not present (useful for ad-hoc
 * messages like "title.notFound:42").
 */
export function useErrorResolver() {
  const t = useTranslations("kudos.writeKudo.errors");
  return (key: string | null | undefined): string => {
    if (!key) return "";
    try {
      return t(key);
    } catch {
      return key;
    }
  };
}
