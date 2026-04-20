import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Service-role Supabase client — scoped to server-only modules.
 *
 * Used for Storage operations that need to bypass RLS on `storage.objects`
 * (e.g. `createSignedUploadUrl`, `remove`). API-layer authorisation still
 * happens BEFORE we reach for this client: every Route Handler must resolve
 * the caller via `getCurrentEmployee` and perform the ownership/permission
 * check first.
 *
 * NEVER import this from a client component. The `server-only` import at the
 * top of this file causes the build to fail if it's ever pulled into the
 * browser bundle.
 */
export function createServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "createServiceRoleClient: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set",
    );
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
