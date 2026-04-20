"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { FieldLabel } from "./parts/FieldLabel";
import { ImageThumbnail } from "./parts/ImageThumbnail";
import { PlusIcon } from "@/components/ui/icons/PlusIcon";
import {
  ALLOWED_IMAGE_MIME_TYPES,
  MAX_IMAGES_PER_KUDO,
  MAX_IMAGE_SIZE_BYTES,
  type AllowedImageMime,
} from "@/lib/constants/kudos";
import type { ImageDraft } from "./hooks/useKudoForm";

interface ImageUploaderProps {
  images: ImageDraft[];
  onAdd: (image: ImageDraft) => void;
  onUpdate: (file: File, next: Partial<ImageDraft>) => void;
  onRemoveById: (id: number) => void;
  onRemoveByFile: (file: File) => void;
  disabled?: boolean;
}

interface SignedUpload {
  id: number;
  uploadUrl: string;
  token: string;
  signedReadUrl: string | null;
}

// Max 3 parallel signed-URL uploads (TR-003).
const MAX_PARALLEL_UPLOADS = 3;

/**
 * Image grid + "+ Image" add button.
 *
 * Flow per file:
 *   1. Client-side validate MIME + size.
 *   2. POST /api/uploads → receive { id, uploadUrl, token, signedReadUrl }.
 *   3. PUT the file bytes to `uploadUrl` (Supabase Storage signed upload URL
 *      — no extra auth header needed, the token is in the URL).
 *   4. Mark the ImageDraft as `ready` with `previewUrl = signedReadUrl`.
 *
 * Concurrency is capped at 3 in-flight uploads; extras queue. If a file
 * fails, the draft turns `failed` with a retry button on the thumbnail.
 */
export function ImageUploader({
  images,
  onAdd,
  onUpdate,
  onRemoveById,
  onRemoveByFile,
  disabled,
}: ImageUploaderProps) {
  const t = useTranslations("kudos.writeKudo");
  const tErr = useTranslations("kudos.writeKudo.errors.image");
  const labelId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Simple semaphore: number of in-flight uploads.
  const inflightRef = useRef(0);
  const queueRef = useRef<File[]>([]);
  const [, forceRerender] = useState(0);
  useEffect(() => {
    // trigger rerender when inflight changes (for hiding/showing +button)
    forceRerender((n) => n);
  }, [images]);

  const startUpload = useCallback(
    async (file: File) => {
      inflightRef.current += 1;
      try {
        // 1. Request signed URL + insert uploads row.
        const metaRes = await fetch("/api/uploads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileName: file.name,
            mimeType: file.type as AllowedImageMime,
            byteSize: file.size,
          }),
        });
        if (!metaRes.ok) throw new Error(`metadata ${metaRes.status}`);
        const meta = (await metaRes.json()) as { data: SignedUpload };

        // 2. PUT bytes to Supabase Storage.
        const putRes = await fetch(meta.data.uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": file.type },
          body: file,
        });
        if (!putRes.ok) throw new Error(`storage put ${putRes.status}`);

        onUpdate(file, {
          id: meta.data.id,
          previewUrl: meta.data.signedReadUrl,
          status: "ready",
        });
      } catch (err) {
        console.error("upload failed", err);
        onUpdate(file, { status: "failed" });
        toast.error(tErr("uploadFailed"));
      } finally {
        inflightRef.current -= 1;
        const nextFile = queueRef.current.shift();
        if (nextFile) void startUpload(nextFile);
      }
    },
    [onUpdate, tErr],
  );

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
        const draft: ImageDraft = {
          id: -1,
          file,
          previewUrl: URL.createObjectURL(file),
          status: "uploading",
          expiresAt: null,
        };
        onAdd(draft);
        if (inflightRef.current < MAX_PARALLEL_UPLOADS) {
          void startUpload(file);
        } else {
          queueRef.current.push(file);
        }
      }
    },
    [images.length, onAdd, startUpload, tErr],
  );

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    enqueue(e.target.files);
    // Allow picking the same file again later.
    e.target.value = "";
  };

  const retry = useCallback(
    (draft: ImageDraft) => {
      onUpdate(draft.file, { status: "uploading" });
      if (inflightRef.current < MAX_PARALLEL_UPLOADS) {
        void startUpload(draft.file);
      } else {
        queueRef.current.push(draft.file);
      }
    },
    [onUpdate, startUpload],
  );

  const remove = useCallback(
    (draft: ImageDraft) => {
      // Revoke the object URL to avoid leaks.
      if (draft.previewUrl && draft.previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(draft.previewUrl);
      }
      // If the upload succeeded, best-effort DELETE the server-side row.
      if (draft.id > 0) {
        onRemoveById(draft.id);
        void fetch(`/api/uploads/${draft.id}`, { method: "DELETE" });
      } else {
        onRemoveByFile(draft.file);
      }
    },
    [onRemoveById, onRemoveByFile],
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
            onRetry={() => retry(img)}
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
          {atLimit ? t("fields.image.maxHint") : t("fields.image.maxHint")}
        </span>
      </div>
    </div>
  );
}
