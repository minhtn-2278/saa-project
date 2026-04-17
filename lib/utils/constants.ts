import type { SupportedLocale } from "@/types/auth";

export const ALLOWED_DOMAINS = ["sun-asterisk.com"] as const;

export const SUPPORTED_LOCALES: SupportedLocale[] = ["vi", "en", "ja"];

export const DEFAULT_LOCALE: SupportedLocale = "vi";

export const PUBLIC_ROUTES = [
  "/login",
  "/api/auth/callback",
  "/error/403",
] as const;

export const PRELAUNCH_COUNTDOWN_ROUTE = "/countdown";
export const PRELAUNCH_BYPASS_COOKIE = "prelaunch_bypass";
export const PRELAUNCH_BYPASS_HEADER = "x-prelaunch-bypass";
