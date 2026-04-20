import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Test-db helper for integration tests.
 *
 * HTTP-level integration tests call Route Handlers that open their own
 * Supabase connection, so we cannot wrap the handler in a `BEGIN/ROLLBACK`
 * transaction from the test side. Instead we clear the per-kudo tables in
 * `beforeEach`, preserving the master rows (employees / titles / hashtags)
 * that were loaded once by `seed-kudos-test.sql`.
 *
 * See plan.md § Integration Testing Strategy → Isolation approach.
 */

let cached: SupabaseClient | null = null;

export function getTestAdminClient(): SupabaseClient {
  if (cached) return cached;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error(
      "integration helpers: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in the test env",
    );
  }
  cached = createClient(url, serviceKey, { auth: { persistSession: false } });
  return cached;
}

/**
 * Clear the per-kudo tables. Preserves master rows (employees, titles,
 * hashtags) so individual test cases don't re-pay the seed cost.
 *
 * Call from `beforeEach` of every HTTP-level integration test file.
 *
 * Uses PostgREST deletes (service-role client) instead of raw SQL because
 * the local/test Supabase project does not register a generic `exec_sql`
 * RPC. The child join tables all have `ON DELETE CASCADE` on `kudos`, so
 * deleting kudos cascades through them; `uploads` is cleaned separately.
 */
export async function resetKudoState(): Promise<void> {
  const admin = getTestAdminClient();

  // kudos → cascades to kudo_hashtags / kudo_images / kudo_mentions
  {
    const { error } = await admin.from("kudos").delete().gt("id", 0);
    if (error) {
      throw new Error(`resetKudoState: failed deleting kudos: ${error.message}`);
    }
  }

  {
    const { error } = await admin.from("uploads").delete().gt("id", 0);
    if (error) {
      throw new Error(`resetKudoState: failed deleting uploads: ${error.message}`);
    }
  }
}

/**
 * Factory: insert an employees row (useful when a test wants a fresh user
 * distinct from the seeded 20). Returns the new id.
 */
export async function insertEmployee(attrs: {
  email: string;
  full_name?: string;
  department?: string;
  is_admin?: boolean;
}): Promise<number> {
  const admin = getTestAdminClient();
  const { data, error } = await admin
    .from("employees")
    .insert({
      email: attrs.email,
      full_name: attrs.full_name ?? attrs.email.split("@")[0],
      department: attrs.department ?? "Testing",
      is_admin: attrs.is_admin ?? false,
    })
    .select("id")
    .single();
  if (error || !data) {
    throw new Error(`insertEmployee failed: ${error?.message}`);
  }
  return data.id as number;
}

/**
 * Look up an active employee by email — used by integration tests to
 * resolve the seeded caller id before crafting requests.
 */
export async function getEmployeeIdByEmail(
  email: string,
): Promise<number | null> {
  const admin = getTestAdminClient();
  const { data, error } = await admin
    .from("employees")
    .select("id")
    .ilike("email", email)
    .is("deleted_at", null)
    .limit(1)
    .maybeSingle();
  if (error) {
    throw new Error(`getEmployeeIdByEmail failed: ${error.message}`);
  }
  return data?.id ?? null;
}
