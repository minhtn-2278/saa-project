"use client";

import { CloseIcon } from "@/components/ui/icons/CloseIcon";
import type { ImageDraft } from "../hooks/useKudoForm";

interface ImageThumbnailProps {
  image: ImageDraft;
  onRemove: () => void;
  disabled?: boolean;
}

/**
 * 80×80 thumbnail tile with top-right ✕ delete. Uploads are now batched
 * at submit, so the per-thumbnail spinner / retry UI has been dropped —
 * every image in the grid is a finalised local draft.
 * Design-style § F.
 */
export function ImageThumbnail({
  image,
  onRemove,
  disabled,
}: ImageThumbnailProps) {
  return (
    <div className="relative w-20 h-20 rounded-[18px] border border-[#998C5F] bg-white overflow-hidden">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={image.previewUrl}
        alt=""
        className="w-full h-full object-cover"
      />
      <button
        type="button"
        onClick={onRemove}
        disabled={disabled}
        aria-label="Xoá ảnh"
        className="absolute top-1 right-1 w-6 h-6 rounded-full bg-white border border-[#998C5F] inline-flex items-center justify-center text-[#00101A] hover:opacity-90 focus:outline-2 focus:outline-[#998C5F] focus:outline-offset-2 disabled:opacity-60"
      >
        <CloseIcon size={14} />
      </button>
    </div>
  );
}
