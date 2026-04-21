import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Supabase Realtime subscription for Live-board Spotlight updates.
 * See plan `MaZUn5xHXZ-sun-kudos-live-board` § T019, TR-005, SC-007.
 *
 * Scope (plan § Q-P7 resolved "no action"): subscribes only to the
 * `public.kudos` table and surfaces INSERT / DELETE events. The handlers do
 * not touch feed or highlight data — only the B.7.1 total label (debounced
 * 500 ms client-side) and the recent-receivers log animate live.
 *
 * Kept deliberately small so future features (e.g. live heart counts) can
 * either:
 *   (a) add their own channel wrapper alongside this one, or
 *   (b) extend this wrapper if the payload requirements converge.
 */

/** Narrow row payload surfaced by Postgres changes on `kudos`. */
export interface KudoChangePayload {
  /** `kudos.id` of the inserted / deleted row. */
  id: number;
  /** `kudos.recipient_id`. */
  recipientId: number;
  /** `kudos.created_at` (ISO-8601). */
  createdAt: string;
  /** `kudos.status` — hidden / reported rows are still surfaced here, but
   *  the consumer filters before updating the UI (plan § Out-of-scope). */
  status: "published" | "hidden" | "reported";
}

export interface SubscribeKudoEventsOptions {
  onInsert?: (payload: KudoChangePayload) => void;
  onDelete?: (payload: KudoChangePayload) => void;
  /**
   * Fired when the WebSocket transitions through connection states. The
   * Spotlight component uses this to show the "Đang kết nối lại…" hint.
   */
  onConnectionState?: (
    state: "SUBSCRIBED" | "CHANNEL_ERROR" | "TIMED_OUT" | "CLOSED",
  ) => void;
}

/**
 * Subscribe to `kudos` INSERT / DELETE events. Returns a cleanup function
 * the consumer MUST call on unmount.
 *
 * The wrapper translates Supabase's raw `postgres_changes` payload shape
 * into our narrow `KudoChangePayload` so downstream code doesn't depend on
 * the Supabase SDK types directly.
 */
export function subscribeKudoEvents(
  supabase: SupabaseClient,
  { onInsert, onDelete, onConnectionState }: SubscribeKudoEventsOptions,
): () => void {
  const channel = supabase.channel("live-kudos");

  if (onInsert) {
    channel.on(
      "postgres_changes" as never,
      {
        event: "INSERT",
        schema: "public",
        table: "kudos",
      },
      (payload: { new: Record<string, unknown> }) => {
        const row = toPayload(payload.new);
        if (row) onInsert(row);
      },
    );
  }

  if (onDelete) {
    channel.on(
      "postgres_changes" as never,
      {
        event: "DELETE",
        schema: "public",
        table: "kudos",
      },
      (payload: { old: Record<string, unknown> }) => {
        const row = toPayload(payload.old);
        if (row) onDelete(row);
      },
    );
  }

  channel.subscribe((status) => {
    if (onConnectionState) {
      onConnectionState(
        status as "SUBSCRIBED" | "CHANNEL_ERROR" | "TIMED_OUT" | "CLOSED",
      );
    }
  });

  return () => {
    void supabase.removeChannel(channel);
  };
}

// ---------------------------------------------------------------------------
// Internals
// ---------------------------------------------------------------------------

function toPayload(
  row: Record<string, unknown> | null | undefined,
): KudoChangePayload | null {
  if (!row) return null;
  const id = row.id;
  const recipientId = row.recipient_id;
  const createdAt = row.created_at;
  const status = row.status;
  if (
    typeof id !== "number" ||
    typeof recipientId !== "number" ||
    typeof createdAt !== "string" ||
    (status !== "published" && status !== "hidden" && status !== "reported")
  ) {
    return null;
  }
  return { id, recipientId, createdAt, status };
}
