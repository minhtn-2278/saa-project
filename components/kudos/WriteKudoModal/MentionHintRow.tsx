"use client";

import { useTranslations } from "next-intl";

/**
 * Static hint row under the textarea (D.1):
 *   Montserrat 16/24 700 #00101A, letter-spacing 0.5px, left-aligned.
 */
export function MentionHintRow() {
  const t = useTranslations("kudos.writeKudo");
  return (
    <p className="text-base leading-6 font-bold text-[#00101A] tracking-[0.5px]">
      {t("fields.body.mentionHint")}
    </p>
  );
}
