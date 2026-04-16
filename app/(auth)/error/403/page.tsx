import Link from "next/link";
import { useTranslations } from "next-intl";

export default function Error403Page() {
  const t = useTranslations("error403");

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-primary text-white px-4">
      <div className="text-center max-w-md">
        <h1 className="text-4xl font-bold mb-4">{t("title")}</h1>
        <p className="text-lg text-white/70 mb-8">{t("message")}</p>
        <Link
          href="/login"
          className="inline-flex items-center px-6 py-3 bg-btn-login text-btn-login-text font-bold rounded-lg hover:bg-btn-login-hover motion-safe:transition-colors"
        >
          {t("backToLogin")}
        </Link>
      </div>
    </div>
  );
}
