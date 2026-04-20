"use client";

import * as Dialog from "@radix-ui/react-dialog";
import type { ReactNode } from "react";

interface ModalShellProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  titleText: string;
  descriptionText?: string;
  onInteractOutside?: (e: Event) => void;
  children: ReactNode;
}

/**
 * Accessible modal container built on @radix-ui/react-dialog.
 * - focus trap
 * - ESC to close
 * - aria-modal + aria-labelledby wired up automatically by Radix via
 *   `Dialog.Title` (do NOT override its `id` — Radix's accessibility check
 *   uses `document.getElementById(ctx.titleId)` which fails when the id is
 *   manually set on the element but not in context).
 * - `Dialog.Description` is always rendered (visually hidden by default).
 *
 * Backdrop + body-scroll lock are handled by Radix. Visual tokens come
 * from design-style.md § Modal Container.
 */
export function ModalShell({
  open,
  onOpenChange,
  titleText,
  descriptionText,
  onInteractOutside,
  children,
}: ModalShellProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-[#00101A]/60 motion-safe:animate-[fadeIn_180ms_ease-out]" />
        <Dialog.Content
          onInteractOutside={onInteractOutside}
          className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-full sm:w-[92vw] lg:w-[752px] max-h-[92vh] overflow-y-auto bg-[#FFF8E1] p-6 sm:p-8 lg:p-10 rounded-t-2xl sm:rounded-3xl"
        >
          <Dialog.Title className="block w-full text-center text-[22px] sm:text-[28px] lg:text-[32px] leading-tight font-bold text-[#00101A]">
            {titleText}
          </Dialog.Title>
          <Dialog.Description className="sr-only">
            {descriptionText ?? titleText}
          </Dialog.Description>
          <div className="mt-6 flex flex-col gap-6 lg:gap-8">{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
