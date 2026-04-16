"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { GoogleIcon } from "@/components/ui/icons/GoogleIcon";
import { LoadingSpinner } from "@/components/ui/icons/LoadingSpinner";

export function LoginButton() {
  const t = useTranslations("login");
  const searchParams = useSearchParams();
  const initialError = searchParams.get("error");

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    initialError === "auth_failed" ? t("error.authFailed") : null
  );

  async function handleLogin() {
    setIsLoading(true);
    setError(null);

    const supabase = createClient();

    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback`,
      },
    });

    if (oauthError) {
      setError(t("error.authFailed"));
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-3">
      <button
        onClick={handleLogin}
        disabled={isLoading}
        aria-label="Login with Google account"
        aria-busy={isLoading}
        aria-disabled={isLoading}
        className={`
          flex items-center gap-2 px-6 py-4
          bg-btn-login rounded-lg
          text-[22px] font-bold leading-7 text-btn-login-text
          font-[family-name:var(--font-montserrat)]
          motion-safe:transition-all motion-safe:duration-150 motion-safe:ease-in-out
          focus:outline-2 focus:outline-btn-login focus:outline-offset-2
          ${isLoading
            ? "opacity-70 cursor-wait pointer-events-none"
            : "hover:bg-btn-login-hover hover:shadow-[0_4px_12px_rgba(255,234,158,0.3)] active:bg-btn-login-active active:scale-[0.98] cursor-pointer"
          }
          disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none
          w-full max-w-[305px] lg:w-[305px]
          text-lg lg:text-[22px]
        `}
      >
        <span className="flex items-center gap-2">
          {t("button.text")}
        </span>
        {isLoading ? (
          <LoadingSpinner size={24} className="text-btn-login-text" />
        ) : (
          <GoogleIcon size={24} />
        )}
      </button>

      {error && (
        <p
          role="alert"
          className="text-sm font-medium text-error font-[family-name:var(--font-montserrat)]"
        >
          {error}
        </p>
      )}
    </div>
  );
}
