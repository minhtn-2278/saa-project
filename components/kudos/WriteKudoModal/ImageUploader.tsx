"use client";

import { useCallback, useId, useRef } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { FieldLabel } from "./parts/FieldLabel";
import { ImageThumbnail } from "./parts/ImageThumbnail";
import { PlusIcon } from "@/components/ui/icons/PlusIcon";
import {
  ALLOWED_IMAGE_MIME_TYPES,
  MAX_IMAGES_PER_KUDO,
  MAX_IMAGE_SIZE_BYTES,
} from "@/lib/constants/kudos";
import type { ImageDraft } from "./hooks/useKudoForm";

interface ImageUploaderProps {
  images: ImageDraft[];
  onAdd: (image: ImageDraft) => void;
  onRemoveByFile: (file: File) => void;
  disabled?: boolean;
}

/**
 * Image grid + "+ Image" add button.
 *
 * Picking a file validates MIME + size client-side, then stashes the
 * File + a `blob:` preview URL in form state. No network calls happen
 * here — uploads are batched into the Gửi click in `WriteKudoModal`.
 */
export function ImageUploader({
  images,
  onAdd,
  onRemoveByFile,
  disabled,
}: ImageUploaderProps) {
  const t = useTranslations("kudos.writeKudo");
  const tErr = useTranslations("kudos.writeKudo.errors.image");
  const labelId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const enqueue = useCallback(
    (files: FileList | File[]) => {
      const remaining = MAX_IMAGES_PER_KUDO - images.length;
      if (remaining <= 0) return;

      const toAdd: File[] = [];
      for (const file of Array.from(files)) {
        if (toAdd.length >= remaining) break;

        if (
          !(ALLOWED_IMAGE_MIME_TYPES as readonly string[]).includes(file.type)
        ) {
          toast.error(tErr("invalid"));
          continue;
        }
        if (file.size <= 0 || file.size > MAX_IMAGE_SIZE_BYTES) {
          toast.error(tErr("invalid"));
          continue;
        }
        toAdd.push(file);
      }

      for (const file of toAdd) {
        onAdd({
          file,
          previewUrl: URL.createObjectURL(file),
        });
      }
    },
    [images.length, onAdd, tErr],
  );

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    enqueue(e.target.files);
    // Allow picking the same file again later.
    e.target.value = "";
  };

  const remove = useCallback(
    (draft: ImageDraft) => {
      if (draft.previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(draft.previewUrl);
      }
      onRemoveByFile(draft.file);
    },
    [onRemoveByFile],
  );

  const atLimit = images.length >= MAX_IMAGES_PER_KUDO;

  return (
    <div
      className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 w-full"
      role="group"
      aria-labelledby={labelId}
    >
      <FieldLabel id={labelId} className="sm:w-[74px] shrink-0">
        {t("fields.image.label")}
      </FieldLabel>
      <div className="flex flex-wrap items-center gap-4">
        {images.map((img) => (
          <ImageThumbnail
            key={img.file.name + img.file.lastModified}
            image={img}
            onRemove={() => remove(img)}
            disabled={disabled}
          />
        ))}
        {!atLimit && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
            aria-label={t("fields.image.addCta")}
            className="inline-flex flex-col items-center justify-center w-[98px] h-12 border border-dashed border-[#998C5F] rounded-md text-[#999999] hover:bg-[#FFEA9E]/10 focus:outline-2 focus:outline-[#998C5F] focus:outline-offset-2 disabled:opacity-60"
          >
            <PlusIcon size={20} />
            <span className="text-sm leading-5 font-bold">
              {t("fields.image.addCta")}
            </span>
          </button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept={(ALLOWED_IMAGE_MIME_TYPES as readonly string[]).join(",")}
          multiple
          onChange={onPick}
          className="hidden"
        />
        <span className="text-sm text-[#999999]">
          {t("fields.image.maxHint")}
        </span>
      </div>
    </div>
  );
}
