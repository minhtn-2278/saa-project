"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useTranslations } from "next-intl";

interface CancelConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

/**
 * Confirmation shown when the author tries to cancel with unsaved changes
 * (FR-013). Uses Radix Dialog primitives so we inherit focus-trap + ESC
 * handling for free.
 *
 * Note: do NOT set custom `id` on `Dialog.Title` / `Dialog.Description` or
 * a custom `aria-labelledby` / `aria-describedby` on `Dialog.Content` —
 * Radix's a11y checks use `document.getElementById(ctx.titleId)` from its
 * own context. Overriding the id breaks that lookup and triggers the
 * "DialogContent requires a DialogTitle" warning.
 */
export function CancelConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
}: CancelConfirmDialogProps) {
  const t = useTranslations("kudos.writeKudo.cancelConfirm");
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-md rounded-2xl bg-white p-6 shadow-lg">
          <Dialog.Title className="text-lg font-bold text-[#00101A]">
            {t("title")}
          </Dialog.Title>
          <Dialog.Description className="mt-2 text-[#00101A]">
            {t("message")}
          </Dialog.Description>
          <div className="mt-5 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="px-4 py-2 rounded-md border border-[#998C5F] bg-white text-[#00101A] font-bold hover:bg-[#FFF8E1] focus:outline-2 focus:outline-[#998C5F] focus:outline-offset-2"
            >
              {t("abort")}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className="px-4 py-2 rounded-md bg-[#CF1322] text-white font-bold hover:opacity-90 focus:outline-2 focus:outline-[#CF1322] focus:outline-offset-2"
            >
              {t("confirm")}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
