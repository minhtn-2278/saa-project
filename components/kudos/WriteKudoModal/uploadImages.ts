import { createClient as createBrowserSupabase } from "@/lib/supabase/client";
import {
  KUDO_IMAGES_BUCKET,
  type AllowedImageMime,
} from "@/lib/constants/kudos";

interface SignedUpload {
  id: number;
  uploadUrl: string;
  token: string;
  path: string;
  signedReadUrl: string | null;
}

/**
 * Upload a single File through the signed-URL flow and return its
 * `uploads.id`. Step 1 reserves the row + mints the signed upload URL;
 * step 2 streams the bytes via Supabase's `uploadToSignedUrl` helper
 * (raw PUT would miss the `x-upsert` / content-type handshake).
 */
async function uploadOne(file: File): Promise<number> {
  const metaRes = await fetch("/api/uploads", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fileName: file.name,
      mimeType: file.type as AllowedImageMime,
      byteSize: file.size,
    }),
  });
  if (!metaRes.ok) {
    throw new Error(`metadata ${metaRes.status}`);
  }
  const meta = (await metaRes.json()) as { data: SignedUpload };

  const { error } = await createBrowserSupabase()
    .storage.from(KUDO_IMAGES_BUCKET)
    .uploadToSignedUrl(meta.data.path, meta.data.token, file, {
      contentType: file.type,
      upsert: false,
    });
  if (error) throw error;

  return meta.data.id;
}

/**
 * Upload every file sequentially and return the ordered list of ids.
 * Sequential (not parallel) because the signed-URL flow is fast enough
 * for the ≤5-image cap and this keeps per-request ordering obvious if
 * the server ever errors out mid-batch.
 *
 * Throws on the first failure — the caller should surface a toast and
 * skip the subsequent Kudo POST. Already-uploaded rows become orphans
 * and are cleaned up by the scheduled GC job.
 */
export async function uploadImages(files: File[]): Promise<number[]> {
  const ids: number[] = [];
  for (const file of files) {
    // eslint-disable-next-line no-await-in-loop -- sequential on purpose.
    ids.push(await uploadOne(file));
  }
  return ids;
}
