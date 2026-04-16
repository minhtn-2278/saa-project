import type { SupportedLocale } from "@/types/auth";

export const ALLOWED_DOMAINS = ["sun-asterisk.com"] as const;

export const SUPPORTED_LOCALES: SupportedLocale[] = ["vi", "en", "ja"];

export const DEFAULT_LOCALE: SupportedLocale = "vi";

export const PUBLIC_ROUTES = [
  "/login",
  "/api/auth/callback",
  "/error/403",
] as const;
