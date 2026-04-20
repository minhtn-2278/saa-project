"use client";

import { CloseIcon } from "@/components/ui/icons/CloseIcon";
import { LoadingSpinner } from "@/components/ui/icons/LoadingSpinner";
import type { ImageDraft } from "../hooks/useKudoForm";

interface ImageThumbnailProps {
  image: ImageDraft;
  onRemove: () => void;
  onRetry: () => void;
  disabled?: boolean;
}

/**
 * 80×80 thumbnail tile with:
 *   - Image preview (from `previewUrl`).
 *   - Spinner overlay while `status === "uploading"`.
 *   - Red border + retry button when `status === "failed"`.
 *   - Top-right ✕ delete.
 * Design-style § F.
 */
export function ImageThumbnail({
  image,
  onRemove,
  onRetry,
  disabled,
}: ImageThumbnailProps) {
  const { status, previewUrl } = image;
  const borderClass =
    status === "failed" ? "border-[#CF1322]" : "border-[#998C5F]";
  return (
    <div
      className={`relative w-20 h-20 rounded-[18px] border ${borderClass} bg-white overflow-hidden`}
    >
      {previewUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={previewUrl}
          alt=""
          className={`w-full h-full object-cover ${
            status === "uploading" ? "opacity-60" : ""
          }`}
        />
      ) : (
        <div className="w-full h-full bg-[#FFF8E1]" aria-hidden />
      )}

      {status === "uploading" && (
        <div className="absolute inset-0 flex items-center justify-center">
          <LoadingSpinner size={20} className="text-[#998C5F]" />
        </div>
      )}

      {status === "failed" && (
        <button
          type="button"
          onClick={onRetry}
          disabled={disabled}
          aria-label="Thử lại tải ảnh"
          className="absolute inset-0 flex items-center justify-center bg-black/30 text-white text-xs font-bold focus:outline-2 focus:outline-[#998C5F] focus:outline-offset-2"
        >
          Thử lại
        </button>
      )}

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
