export type SupportedLocale = "vi" | "en" | "ja";

export function formatVND(value: number, locale: SupportedLocale): string {
  const intlLocale = locale === "vi" ? "vi-VN" : locale;
  const formatted = new Intl.NumberFormat(intlLocale, {
    style: "decimal",
    maximumFractionDigits: 0,
  }).format(value);
  const suffix = locale === "vi" ? " VNĐ" : " VND";
  return `${formatted}${suffix}`;
}

export function padQuantity(n: number): string {
  return n < 10 ? String(n).padStart(2, "0") : String(n);
}
