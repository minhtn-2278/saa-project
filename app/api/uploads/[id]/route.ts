import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { getCurrentEmployee } from "@/lib/auth/current-employee";
import {
  authErrorToResponse,
  errorResponse,
  zodErrorToResponse,
} from "@/lib/kudos/api-responses";
import { KUDO_IMAGES_BUCKET } from "@/lib/constants/kudos";

const idSchema = z.coerce.number().int().positive({ message: "image.invalidId" });

/**
 * DELETE /api/uploads/[id] — soft-delete an upload that hasn't been attached
 * to a Kudo yet.
 *
 * Rules (spec FR-016, UPLOAD_DEL_01..06):
 *   - Caller must be the `owner_id`.
 *   - If any `kudo_images` row references this upload → 409 (conflict).
 *   - Else soft-delete (`deleted_at = NOW()`) and remove the storage object.
 */
export async function DELETE(
  request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id: rawId } = await ctx.params;

  const parsed = idSchema.safeParse(rawId);
  if (!parsed.success) return zodErrorToResponse(parsed.error);
  const uploadId = parsed.data;

  const supabase = await createClient();

  let callerId: number;
  try {
    const caller = await getCurrentEmployee(supabase);
    callerId = caller.id;
  } catch (err) {
    const res = authErrorToResponse(err);
    if (res) return res;
    console.error("DELETE /api/uploads identity error", err);
    return errorResponse("INTERNAL_ERROR", "Unexpected error", 500);
  }

  const { data: upload, error: lookupError } = await supabase
    .from("uploads")
    .select("id, owner_id, storage_key, deleted_at")
    .eq("id", uploadId)
    .maybeSingle();
  if (lookupError) {
    console.error("DELETE /api/uploads lookup error", lookupError);
    return errorResponse("INTERNAL_ERROR", "Unexpected error", 500);
  }
  if (!upload || upload.deleted_at) {
    return errorResponse("NOT_FOUND", "Upload not found", 404);
  }
  if (upload.owner_id !== callerId) {
    return errorResponse("FORBIDDEN", "Not the owner", 403);
  }

  // Is this upload attached to any kudo already?
  const { count: attachedCount, error: attachError } = await supabase
    .from("kudo_images")
    .select("kudo_id", { count: "exact", head: true })
    .eq("upload_id", uploadId);
  if (attachError) {
    console.error("DELETE /api/uploads attach-check error", attachError);
    return errorResponse("INTERNAL_ERROR", "Unexpected error", 500);
  }
  if ((attachedCount ?? 0) > 0) {
    return errorResponse(
      "CONFLICT",
      "Upload is already attached to a Kudo",
      409,
    );
  }

  // Soft-delete the metadata row.
  const { error: softDeleteError } = await supabase
    .from("uploads")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", uploadId);
  if (softDeleteError) {
    console.error("DELETE /api/uploads soft-delete error", softDeleteError);
    return errorResponse("INTERNAL_ERROR", "Unexpected error", 500);
  }

  // Best-effort storage cleanup — not fatal if it fails (scheduled GC catches it).
  // Use service-role for storage because `storage.objects` has RLS enabled
  // without policies; ownership was enforced above on the `uploads` row.
  await createServiceRoleClient()
    .storage.from(KUDO_IMAGES_BUCKET)
    .remove([upload.storage_key]);

  return new NextResponse(null, { status: 204 });
}
