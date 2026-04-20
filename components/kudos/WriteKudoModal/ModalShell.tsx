"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useEffect, useRef, type ReactNode } from "react";

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
  // Auto-hide scrollbar: toggle `is-scrolling` on the scroll container
  // during active scroll and remove it after 800 ms idle. CSS in
  // `globals.css` reveals the olive thumb only while this class is on or
  // the modal is hovered.
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const el = scrollRef.current;
    if (!el) return;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const onScroll = () => {
      el.classList.add("is-scrolling");
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => el.classList.remove("is-scrolling"), 800);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", onScroll);
      if (timer) clearTimeout(timer);
    };
  }, [open]);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-[#00101A]/60 motion-safe:animate-[fadeIn_180ms_ease-out]" />
        <Dialog.Content
          ref={scrollRef}
          onInteractOutside={onInteractOutside}
          // `kudo-modal-scroll` styles the overflow scrollbar in globals.css
          // (auto-hide thin thumb) so it sits inside the modal without the
          // default wide white gutter or the up/down arrow buttons.
          className="kudo-modal-scroll fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-full sm:w-[92vw] lg:w-[752px] max-h-[92vh] overflow-y-auto bg-[#FFF8E1] p-6 sm:p-8 lg:p-10 rounded-t-2xl sm:rounded-3xl"
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
