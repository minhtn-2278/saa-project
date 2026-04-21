import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentEmployee } from "@/lib/auth/current-employee";
import {
  authErrorToResponse,
  errorResponse,
} from "@/lib/kudos/api-responses";
import type { MyStatsResponse } from "@/types/kudos";

/**
 * `GET /api/me/stats` — Live-board sidebar D.1 stats for the authenticated
 * caller (plan § T076).
 *
 * Three parallel aggregates:
 *   - `kudosReceived` = published, non-deleted kudos where I am the recipient
 *   - `kudosSent`     = published, non-deleted kudos where I am the author
 *                       (anonymous kudos STILL count — `author_id` is
 *                       recorded even when the UI masks it)
 *   - `heartsReceived`= `kudo_hearts` whose parent kudo is published,
 *                       non-deleted, and targets me
 *
 * `boxesOpened` / `boxesUnopened` are hard-coded to `0` — the Secret Box
 * feature is deferred (spec § Out of Scope, plan § Feature Defer Map).
 *
 * This handler is NOT cached: the sidebar reconciles after every write
 * (send kudo, like) and must reflect the latest per-caller state. Response
 * time is <50 ms in practice because the three counts run in parallel via
 * `Promise.all`.
 */
export async function GET() {
  const supabase = await createClient();

  let callerId: number;
  try {
    const caller = await getCurrentEmployee(supabase);
    callerId = caller.id;
  } catch (err) {
    const res = authErrorToResponse(err);
    if (res) return res;
    console.error("GET /api/me/stats identity error", err);
    return errorResponse("INTERNAL_ERROR", "Unexpected error", 500);
  }

  const receivedQuery = supabase
    .from("kudos")
    .select("id", { count: "exact", head: true })
    .eq("recipient_id", callerId)
    .eq("status", "published")
    .is("deleted_at", null);

  const sentQuery = supabase
    .from("kudos")
    .select("id", { count: "exact", head: true })
    .eq("author_id", callerId)
    .eq("status", "published")
    .is("deleted_at", null);

  // PostgREST `!inner` forces a JOIN so Postgres can filter on the parent
  // kudo's `status` / `deleted_at` / `recipient_id` — hearts on hidden
  // or soft-deleted kudos are excluded from the count (STATS_05).
  const heartsQuery = supabase
    .from("kudo_hearts")
    .select("kudo_id, kudos!inner(id)", { count: "exact", head: true })
    .eq("kudos.recipient_id", callerId)
    .eq("kudos.status", "published")
    .is("kudos.deleted_at", null);

  const [received, sent, hearts] = await Promise.all([
    receivedQuery,
    sentQuery,
    heartsQuery,
  ]);

  if (received.error || sent.error || hearts.error) {
    console.error(
      "GET /api/me/stats aggregate error",
      received.error ?? sent.error ?? hearts.error,
    );
    return errorResponse("INTERNAL_ERROR", "Could not load stats", 500);
  }

  const body: MyStatsResponse = {
    data: {
      kudosReceived: received.count ?? 0,
      kudosSent: sent.count ?? 0,
      heartsReceived: hearts.count ?? 0,
      boxesOpened: 0,
      boxesUnopened: 0,
    },
  };
  return NextResponse.json(body);
}
