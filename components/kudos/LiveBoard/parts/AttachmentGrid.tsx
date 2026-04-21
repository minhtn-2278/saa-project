"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import type { PublicKudo } from "@/types/kudos";

interface AttachmentGridProps {
  /** Up to 5 signed-URL thumbnails from `PublicKudo.images`. Extra entries are clipped. */
  images: PublicKudo["images"];
  /** Optional alt-text prefix; defaults to "Ảnh đính kèm". */
  altPrefix?: string;
}

/**
 * Horizontal attachment grid inside a Kudo Post card (`C.3.6`).
 *
 * Design-style.md § C.3.6:
 *   - Up to 5 thumbnails, square 80 × 80, `object-cover`, radius 8.
 *   - Wrap onto a second row below 5 if the card is narrow (tablet+ mobile).
 *   - Click opens a full-size lightbox — basic `<dialog>` overlay here;
 *     project-wide lightbox can replace it later.
 *
 * Plan § T038. The signed URLs come from the Route Handler (1h TTL — TR-008).
 */
export function AttachmentGrid({
  images,
  altPrefix = "Ảnh đính kèm",
}: AttachmentGridProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const shown = images.slice(0, 5);

  const handleClose = useCallback(() => setActiveIndex(null), []);

  // Esc key closes the lightbox (basic keyboard support).
  useEffect(() => {
    if (activeIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [activeIndex, handleClose]);

  if (shown.length === 0) return null;

  return (
    <>
      <ul
        className="flex flex-wrap gap-2"
        aria-label={`${shown.length} ảnh đính kèm`}
      >
        {shown.map((img, i) => (
          <li key={img.id}>
            <button
              type="button"
              onClick={() => setActiveIndex(i)}
              className="relative block w-20 h-20 rounded-lg overflow-hidden focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-live-accent-gold)]"
              aria-label={`${altPrefix} ${i + 1} trên ${shown.length}`}
            >
              <Image
                src={img.url}
                alt=""
                width={80}
                height={80}
                className="w-full h-full object-cover"
                unoptimized
              />
            </button>
          </li>
        ))}
      </ul>
      {activeIndex !== null ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Xem ảnh"
          onClick={handleClose}
          className="fixed inset-0 z-50 flex items-center justify-center p-6 cursor-zoom-out"
          style={{ background: "rgba(0, 0, 0, 0.85)" }}
        >
          <Image
            src={shown[activeIndex].url}
            alt=""
            width={shown[activeIndex].width ?? 1024}
            height={shown[activeIndex].height ?? 1024}
            className="max-w-full max-h-full w-auto h-auto object-contain"
            unoptimized
          />
        </div>
      ) : null}
    </>
  );
}
