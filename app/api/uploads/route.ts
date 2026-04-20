import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentEmployee } from "@/lib/auth/current-employee";
import {
  authErrorToResponse,
  errorResponse,
  zodErrorToResponse,
} from "@/lib/kudos/api-responses";
import { createUploadRequestSchema } from "@/lib/validations/uploads";
import {
  KUDO_IMAGES_BUCKET,
  MAX_IMAGE_SIZE_BYTES,
} from "@/lib/constants/kudos";

const SIGNED_UPLOAD_TTL_SECONDS = 60 * 15; // 15 min window to complete PUT
const SIGNED_READ_TTL_SECONDS = 60 * 60; // 1 h (TR-008)

/**
 * POST /api/uploads — mint a signed upload URL + insert metadata row.
 *
 * Flow (TR-003 + TR-008 + TR-011):
 *   1. Resolve caller via getCurrentEmployee.
 *   2. Validate payload with Zod (fileName, mimeType, byteSize, optional wxh).
 *   3. `createSignedUploadUrl` on bucket `kudo-images` with path
 *      `{ownerId}/{timestamp}-{slug}`.
 *   4. Insert `uploads` row, return `{ id, uploadUrl, token, signedReadUrl, expiresAt }`.
 *
 * The client then streams the file to `uploadUrl` with `x-upsert: false`.
 * Storage bucket policies (bucket-level) enforce size + MIME as a defense-in-depth.
 */
export async function POST(request: Request) {
  const supabase = await createClient();

  let callerId: number;
  try {
    const caller = await getCurrentEmployee(supabase);
    callerId = caller.id;
  } catch (err) {
    const res = authErrorToResponse(err);
    if (res) return res;
    console.error("POST /api/uploads identity error", err);
    return errorResponse("INTERNAL_ERROR", "Unexpected error", 500);
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return errorResponse("BAD_REQUEST", "Invalid JSON body", 400);
  }
  const parsed = createUploadRequestSchema.safeParse(raw);
  if (!parsed.success) return zodErrorToResponse(parsed.error);

  const { fileName, mimeType, byteSize, width, height } = parsed.data;

  // Defence-in-depth: redundant with Zod but guards against drift.
  if (byteSize > MAX_IMAGE_SIZE_BYTES) {
    return errorResponse(
      "PAYLOAD_TOO_LARGE",
      `File exceeds ${MAX_IMAGE_SIZE_BYTES} bytes`,
      413,
    );
  }

  // Build a storage key that colocates a user's uploads.
  const safeName = fileName
    .toLowerCase()
    .replace(/\.(jpe?g|png|webp)$/, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "image";
  const ext = mimeType === "image/jpeg" ? "jpg" : mimeType.split("/")[1];
  const storageKey = `${callerId}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}-${safeName}.${ext}`;

  const { data: signed, error: signError } = await supabase.storage
    .from(KUDO_IMAGES_BUCKET)
    .createSignedUploadUrl(storageKey);
  if (signError || !signed) {
    console.error("POST /api/uploads signed-url error", signError);
    return errorResponse(
      "INTERNAL_ERROR",
      signError?.message ?? "Could not mint upload URL",
      500,
    );
  }

  const { data: inserted, error: insertError } = await supabase
    .from("uploads")
    .insert({
      owner_id: callerId,
      storage_key: storageKey,
      mime_type: mimeType,
      byte_size: byteSize,
      width: width ?? null,
      height: height ?? null,
    })
    .select("id, storage_key, mime_type, byte_size, width, height")
    .single();

  if (insertError || !inserted) {
    // Best-effort cleanup of the storage reservation.
    await supabase.storage.from(KUDO_IMAGES_BUCKET).remove([storageKey]);
    console.error("POST /api/uploads insert error", insertError);
    return errorResponse(
      "INTERNAL_ERROR",
      insertError?.message ?? "Could not create upload row",
      500,
    );
  }

  // Generate a short-lived read URL the client can use immediately in preview.
  const { data: read } = await supabase.storage
    .from(KUDO_IMAGES_BUCKET)
    .createSignedUrl(storageKey, SIGNED_READ_TTL_SECONDS);

  return NextResponse.json(
    {
      data: {
        id: inserted.id,
        uploadUrl: signed.signedUrl,
        token: signed.token,
        signedReadUrl: read?.signedUrl ?? null,
        mimeType: inserted.mime_type,
        byteSize: inserted.byte_size,
        width: inserted.width,
        height: inserted.height,
        expiresAt: new Date(
          Date.now() + SIGNED_UPLOAD_TTL_SECONDS * 1000,
        ).toISOString(),
      },
    },
    { status: 201 },
  );
}
