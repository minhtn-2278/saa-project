export type LoginState = "idle" | "loading" | "error" | "success";

export interface AuthError {
  code: string;
  message: string;
}

export type SupportedLocale = "vi" | "en" | "ja";
