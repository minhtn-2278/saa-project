import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { getCurrentEmployee } from "@/lib/auth/current-employee";
import {
  authErrorToResponse,
  errorResponse,
} from "@/lib/kudos/api-responses";
import {
  computeSpotlightLayout,
  hashStringToUnit,
  type SpotlightLayoutInput,
} from "@/lib/spotlight/layout";
import type { SpotlightResponse } from "@/types/kudos";

const TOP_N = 20;
const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;
const BUCKET_MS = 5 * 60 * 1000;

/**
 * `GET /api/spotlight` — Live-board B.7 data (plan § T093).
 *
 * Payload:
 *   - `total`         : event-wide `COUNT(*)` of published, non-deleted kudos.
 *   - `nodes[]`       : up to 20 recipients ranked by 24h kudos count; positions
 *                       come from `computeSpotlightLayout` seeded with
 *                       `layoutVersion`.
 *   - `layoutVersion` : `${eventDayUtc}:${fiveMinBucket}` — stable within a
 *                       5-min bucket, rotates on the next bucket so clients
 *                       can animate redraws.
 *   - `cachedAt`      : ISO timestamp of the most-recent computation.
 *
 * Caching:
 *   - `unstable_cache({ revalidate: 300, tags: ['spotlight'] })` so the inner
 *     aggregate + layout run at most once per 5-min bucket.
 *   - `Cache-Control: public, max-age=300, s-maxage=300` lets Vercel / Next.js
 *     edge + shared intermediaries reuse the response across users (the data
 *     is public to signed-in employees).
 *   - `ETag` = hash of `layoutVersion`; `If-None-Match` → 304.
 *
 * PostgREST aggregate functions are disabled on this Supabase project
 * (user preference 2026-04-22), so the per-recipient `kudosCount` is folded
 * in JS from a plain `SELECT … WHERE created_at >= now - 24h`. At event
 * scale (thousands of kudos per day) this stays comfortably under
 * PostgREST's 1000-row default; we bump `.range(0, 9999)` as a guard.
 *
 * Auth happens with the user client (so unauthed callers get 401); the
 * cached aggregate uses the service-role client because `unstable_cache`
 * runs outside the request scope (same pattern as `/api/departments`).
 */

interface CachedPayload {
  total: number;
  nodes: SpotlightResponse["data"]["nodes"];
  layoutVersion: string;
  cachedAt: string;
}

const loadSpotlight = unstable_cache(
  async (): Promise<CachedPayload> => {
    const supabase = createServiceRoleClient();

    const nowMs = Date.now();
    const since = new Date(nowMs - TWENTY_FOUR_HOURS_MS).toISOString();
    const bucket = Math.floor(nowMs / BUCKET_MS);
    const eventDayUtc = new Date(nowMs).toISOString().slice(0, 10);
    const layoutVersion = `${eventDayUtc}:${bucket}`;

    // 1. Event-wide total — PostgREST `Prefer: count=exact` header returns
    //    the COUNT via a metadata header (no aggregate function needed).
    const { count: totalRaw, error: totalError } = await supabase
      .from("kudos")
      .select("id", { count: "exact", head: true })
      .eq("status", "published")
      .is("deleted_at", null);
    if (totalError) {
      console.error("spotlight total query error", totalError);
      throw new Error(`spotlight total: ${totalError.message}`);
    }
    const total = totalRaw ?? 0;

    // 2. Last-24h kudos with recipient info — join kudos → employees so we
    //    can filter on recipient's `deleted_at IS NULL` + surface the name.
    const { data: windowRows, error: windowError } = await supabase
      .from("kudos")
      .select(
        "id, recipient_id, created_at, recipient:employees!recipient_id(id, full_name, avatar_url, deleted_at)",
      )
      .eq("status", "published")
      .is("deleted_at", null)
      .gte("created_at", since)
      .range(0, 9999);
    if (windowError) {
      console.error("spotlight window query error", windowError);
      throw new Error(`spotlight window: ${windowError.message}`);
    }

    interface WindowRow {
      id: number;
      recipient_id: number;
      created_at: string;
      recipient: {
        id: number;
        full_name: string;
        avatar_url: string | null;
        deleted_at: string | null;
      } | null;
    }

    const byRecipient = new Map<number, SpotlightLayoutInput>();
    for (const raw of (windowRows ?? []) as unknown as WindowRow[]) {
      // Exclude kudos whose recipient has been soft-deleted (SPOTLIGHT_13).
      if (!raw.recipient || raw.recipient.deleted_at) continue;
      const existing = byRecipient.get(raw.recipient_id);
      if (existing) {
        existing.kudosCount += 1;
        if (raw.created_at > existing.lastReceivedAt) {
          existing.lastReceivedAt = raw.created_at;
        }
      } else {
        byRecipient.set(raw.recipient_id, {
          id: raw.recipient.id,
          name: raw.recipient.full_name,
          avatarUrl: raw.recipient.avatar_url,
          kudosCount: 1,
          lastReceivedAt: raw.created_at,
        });
      }
    }

    // 3. Rank: kudosCount DESC, then lastReceivedAt DESC, then id ASC
    //    (SPOTLIGHT_09 / SPOTLIGHT_09b tie-breakers).
    const ranked = Array.from(byRecipient.values())
      .sort((a, b) => {
        if (b.kudosCount !== a.kudosCount) return b.kudosCount - a.kudosCount;
        if (a.lastReceivedAt !== b.lastReceivedAt) {
          return a.lastReceivedAt > b.lastReceivedAt ? -1 : 1;
        }
        return a.id - b.id;
      })
      .slice(0, TOP_N);

    const nodes = computeSpotlightLayout(ranked, layoutVersion);

    return {
      total,
      nodes,
      layoutVersion,
      cachedAt: new Date(nowMs).toISOString(),
    };
  },
  ["live-board-spotlight"],
  { revalidate: 300, tags: ["spotlight"] },
);

function etagFor(layoutVersion: string): string {
  // Weak ETag so intermediaries don't byte-compare bodies — we only need
  // identity on the layoutVersion (which also encodes when the cache
  // rotated). `W/"hash"` is the standard weak-ETag shape.
  const unit = hashStringToUnit(layoutVersion);
  const hex = Math.floor(unit * 0xffffffff).toString(16).padStart(8, "0");
  return `W/"${layoutVersion}-${hex}"`;
}

export async function GET(request: Request) {
  const supabase = await createClient();

  try {
    await getCurrentEmployee(supabase);
  } catch (err) {
    const res = authErrorToResponse(err);
    if (res) return res;
    console.error("GET /api/spotlight identity error", err);
    return errorResponse("INTERNAL_ERROR", "Unexpected error", 500);
  }

  let payload: CachedPayload;
  try {
    payload = await loadSpotlight();
  } catch (err) {
    console.error("GET /api/spotlight load error", err);
    return errorResponse("INTERNAL_ERROR", "Could not load spotlight", 500);
  }

  const etag = etagFor(payload.layoutVersion);
  const ifNoneMatch = request.headers.get("if-none-match");
  if (ifNoneMatch && ifNoneMatch === etag) {
    return new NextResponse(null, {
      status: 304,
      headers: {
        ETag: etag,
        "Cache-Control": "public, max-age=300, s-maxage=300",
      },
    });
  }

  const body: SpotlightResponse = { data: payload };
  return NextResponse.json(body, {
    headers: {
      ETag: etag,
      "Cache-Control": "public, max-age=300, s-maxage=300",
    },
  });
}
