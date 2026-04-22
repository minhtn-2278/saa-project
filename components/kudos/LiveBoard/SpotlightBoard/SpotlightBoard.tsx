"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import {
  subscribeKudoEvents,
  type KudoChangePayload,
} from "@/lib/spotlight/realtime-channel";
import { SpotlightCanvas } from "@/components/kudos/LiveBoard/SpotlightBoard/SpotlightCanvas";
import { SpotlightSearch } from "@/components/kudos/LiveBoard/SpotlightBoard/SpotlightSearch";
import {
  RecentReceiverLog,
  type RecentReceiverEntry,
} from "@/components/kudos/LiveBoard/SpotlightBoard/RecentReceiverLog";
import { SpotlightSkeleton } from "@/components/kudos/LiveBoard/skeletons/SpotlightSkeleton";
import { EmptyState } from "@/components/kudos/LiveBoard/parts/EmptyState";
import type { SpotlightResponse } from "@/types/kudos";

const REFRESH_INTERVAL_MS = 5 * 60 * 1000;
const TOTAL_DEBOUNCE_MS = 500;
const LOG_MAX_ENTRIES = 10;

/**
 * Short random id used to correlate client-side error logs with server /
 * network traces. `crypto.randomUUID()` is available in every modern browser
 * and Node; we slice it down so the log line stays scannable.
 */
function cryptoRandomId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID().slice(0, 8);
  }
  return Math.random().toString(36).slice(2, 10);
}

type SpotlightData = SpotlightResponse["data"];

/**
 * B.6 + B.7 Spotlight island (plan § T099).
 *
 * Layout now matches Figma `2940:14170`: ONE dark rounded card
 * (1157 × 548 at the desktop reference, responsive below), with every
 * child absolutely-positioned INSIDE it:
 *
 *   ┌────────────────────────────────────────────────────────────┐
 *   │  [🔍 Tìm kiếm]        388 KUDOS                  [⊕]        │
 *   │                                                            │
 *   │      Name    Name      Name                                │
 *   │         Name       Name (red = search match)       Name    │
 *   │                                                            │
 *   │  08:30  Nguyễn Bá Chức đã nhận được một Kudo mới           │
 *   │  08:30  ...                                                │
 *   └────────────────────────────────────────────────────────────┘
 *
 * Fetch lifecycle, realtime subscription, and search state all live here
 * so the children stay pure. See earlier doc-comment for the contract.
 */
export interface SpotlightBoardProps {
  /** Optional SSR-seeded payload — skips the initial fetch when present. */
  initialData?: SpotlightData;
}

export function SpotlightBoard({ initialData }: SpotlightBoardProps = {}) {
  const t = useTranslations("kudos.liveBoard.spotlight");
  const emptyT = useTranslations("kudos.liveBoard.emptyStates");
  const cardT = useTranslations("kudos.liveBoard.card");

  const [data, setData] = useState<SpotlightData | null>(initialData ?? null);
  const [etag, setEtag] = useState<string | null>(null);
  const [loading, setLoading] = useState(!initialData);
  const [highlightQuery, setHighlightQuery] = useState("");
  const [recentLog, setRecentLog] = useState<RecentReceiverEntry[]>([]);
  const [reconnecting, setReconnecting] = useState(false);

  const pendingDeltaRef = useRef(0);
  const debounceTimerRef = useRef<number | null>(null);
  /**
   * Kudo ids already reflected in `recentLog` / `pendingDeltaRef`. Realtime
   * INSERT and the `kudo:created` window event can both fire for the same
   * kudo (the author's own submit) — we need to register each id once.
   */
  const seenKudoIdsRef = useRef<Set<number>>(new Set());
  /**
   * Latest spotlight payload kept in a ref so the long-lived Realtime
   * subscription can resolve recipient names without re-subscribing when
   * `data` changes (the effect below has `[]` deps by design).
   */
  const dataRef = useRef<SpotlightData | null>(initialData ?? null);
  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  const fetchSpotlight = useCallback(async (useEtag: string | null) => {
    // Correlation id (plan § T107) — emitted on every failure so log readers
    // can trace a single client fetch through network panels and server logs.
    const correlationId = `spotlight-fetch-${cryptoRandomId()}`;
    try {
      const res = await fetch("/api/spotlight", {
        credentials: "include",
        headers: useEtag ? { "If-None-Match": useEtag } : undefined,
      });
      if (res.status === 304) {
        setLoading(false);
        return;
      }
      if (!res.ok) throw new Error(`GET /api/spotlight ${res.status}`);
      const json = (await res.json()) as SpotlightResponse;
      setData(json.data);
      setEtag(res.headers.get("ETag"));
      pendingDeltaRef.current = 0;
    } catch (err) {
      console.error(
        `[SpotlightBoard] fetch failed (${correlationId})`,
        err,
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!initialData) void fetchSpotlight(null);
    const id = window.setInterval(() => {
      void fetchSpotlight(etag);
    }, REFRESH_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [initialData, etag, fetchSpotlight]);

  useEffect(() => {
    const supabase = createClient();
    const flushDebounce = () => {
      if (debounceTimerRef.current !== null) {
        window.clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = window.setTimeout(() => {
        const delta = pendingDeltaRef.current;
        pendingDeltaRef.current = 0;
        debounceTimerRef.current = null;
        if (delta === 0) return;
        setData((prev) =>
          prev ? { ...prev, total: Math.max(0, prev.total + delta) } : prev,
        );
      }, TOTAL_DEBOUNCE_MS);
    };

    /**
     * Register a newly-seen published kudo exactly once across all sources
     * (Supabase Realtime + `kudo:created` window event). Bumps the pending
     * total delta + appends to the recent-receivers log; the debounced flush
     * reconciles the visible `N KUDOS` counter.
     */
    const registerNewKudo = (
      kudoId: number,
      recipientName: string,
      createdAt: string,
    ) => {
      const seen = seenKudoIdsRef.current;
      if (seen.has(kudoId)) return;
      seen.add(kudoId);
      pendingDeltaRef.current += 1;
      flushDebounce();
      setRecentLog((prev) => {
        const entry: RecentReceiverEntry = {
          kudoId,
          recipientName,
          seenAt: createdAt,
        };
        return [entry, ...prev].slice(0, LOG_MAX_ENTRIES);
      });
    };

    const cleanup = subscribeKudoEvents(supabase, {
      onInsert: (ev: KudoChangePayload) => {
        if (ev.status !== "published") return;
        // The realtime payload only carries `recipient_id`, not the name.
        // Look up the name from the current top-20 nodes when possible;
        // otherwise fall back to a generic placeholder so the animation
        // still fires. The next `/api/spotlight` poll resolves the name.
        const hit = dataRef.current?.nodes.find(
          (n) => n.id === ev.recipientId,
        );
        registerNewKudo(ev.id, hit?.name ?? "Sunner", ev.createdAt);
      },
      onDelete: (ev: KudoChangePayload) => {
        if (ev.status !== "published") return;
        pendingDeltaRef.current -= 1;
        flushDebounce();
      },
      onConnectionState: (state) => {
        setReconnecting(state !== "SUBSCRIBED");
        // Surface reconnect-failure states with a correlation id so ops can
        // stitch together a client event with the Supabase Realtime server
        // logs (plan § T107).
        if (state === "CHANNEL_ERROR" || state === "TIMED_OUT") {
          console.error(
            `[SpotlightBoard] realtime ${state} (${cryptoRandomId()})`,
          );
        }
      },
    });

    // Fallback path for the author's own submit. The Viết Kudo modal
    // dispatches `kudo:created` with the full serialised PublicKudo after a
    // successful POST — we use it both to cover the case where Supabase
    // Realtime replication isn't enabled on the `kudos` table yet, and to
    // surface the real recipient name (Realtime INSERT payloads only carry
    // the recipient id). `seenKudoIdsRef` dedupes against the Realtime path.
    const onKudoCreated = (ev: Event) => {
      const detail = (ev as CustomEvent<unknown>).detail;
      if (!detail || typeof detail !== "object") return;
      const rec = detail as {
        id?: unknown;
        recipientName?: unknown;
        createdAt?: unknown;
      };
      if (
        typeof rec.id !== "number" ||
        typeof rec.recipientName !== "string" ||
        typeof rec.createdAt !== "string"
      ) {
        return;
      }
      registerNewKudo(rec.id, rec.recipientName, rec.createdAt);
    };
    window.addEventListener("kudo:created", onKudoCreated);

    return () => {
      if (debounceTimerRef.current !== null) {
        window.clearTimeout(debounceTimerRef.current);
      }
      window.removeEventListener("kudo:created", onKudoCreated);
      cleanup();
    };
    // Intentionally empty deps — the effect owns a single long-lived channel
    // + listener tied to the component's lifetime.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading && !data) return <SpotlightSkeleton />;
  if (!data) return null;

  const hasNodes = data.nodes.length > 0;

  return (
    <div
      className="relative w-full aspect-[1157/548] overflow-hidden"
      style={{
        background:
          "radial-gradient(circle at 50% 50%, rgba(9,36,50,0.50) 0%, #00101A 100%)",
        border: "1px solid var(--color-live-border-gold)",
        borderRadius: "47.14px",
      }}
      aria-label="Spotlight board"
    >
      {/* Ribbon artwork — bottom layer, anchored to bottom-left. Rendered via
          <img> (not background-image) so it keeps its intrinsic aspect-ratio
          and doesn't stretch on wide canvases. Matches Figma `2940:14170`.
          next/image wants explicit dimensions / fill mode — for a purely
          decorative layer that scales with the card, a plain <img> keeps the
          markup honest. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/spotlight-ribbons-bg.png"
        alt=""
        aria-hidden
        className="absolute bottom-0 left-0 w-full pointer-events-none select-none"
        style={{ objectFit: "contain", objectPosition: "bottom left" }}
      />

      {/* Decorative network/constellation overlay — sits ABOVE the ribbons.
          `screen` blend mode drops the mid-grey field and lets only the bright
          polygon lines shine through against the dark card. Still below all
          interactive chrome (search, total, log) which carry z-10. */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: "url('/images/spotlight-network-overlay.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          mixBlendMode: "screen",
          opacity: 0.85,
        }}
      />

      {/* B.7.3 search — top-left */}
      <div className="absolute top-5 left-6 z-10 w-60 max-w-[40%]">
        <SpotlightSearch value={highlightQuery} onChange={setHighlightQuery} />
      </div>

      {/* B.7.1 `{N} KUDOS` — top-centre. Gold glow, live-animates on
          realtime INSERT/DELETE once the debounce flushes. */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 text-center">
        <p
          className="font-bold tracking-wide leading-none"
          style={{
            color: "var(--color-live-accent-gold)",
            fontSize: "clamp(28px, 4.5vw, 52px)",
            textShadow: "0 0 18px rgba(250, 226, 135, 0.45)",
          }}
        >
          <span
            className="tabular-nums"
            data-testid="spotlight-total"
            aria-live="polite"
          >
            {data.total.toLocaleString("vi-VN")}
          </span>{" "}
          <span className="text-white/95">{t("totalSuffix")}</span>
        </p>
        {reconnecting ? (
          <p
            role="status"
            className="text-xs mt-1"
            style={{ color: "var(--color-live-text-secondary)" }}
          >
            {t("reconnecting")}
          </p>
        ) : null}
      </div>

      {/* B.7.2 pan/zoom placeholder — bottom-right, disabled this release
          (T097 deferred; matches the Figma icon slot so the chrome is
          visually complete). */}
      <button
        type="button"
        disabled
        aria-disabled="true"
        title={cardT("disabledTitle")}
        aria-label={t("panZoomTooltip")}
        className="absolute bottom-5 right-6 z-10 inline-flex items-center justify-center h-10 w-10 rounded-full cursor-not-allowed opacity-70"
      >
        <PanZoomIcon />
      </button>

      {/* Word-cloud nodes (transparent layer; no own bg). */}
      {hasNodes ? (
        <SpotlightCanvas
          nodes={data.nodes}
          highlightQuery={highlightQuery}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <EmptyState className="!py-0 text-white/80 text-base">
            {emptyT("spotlightQuiet")}
          </EmptyState>
        </div>
      )}

      {/* Recent-receiver log — bottom-left. */}
      {hasNodes ? <RecentReceiverLog entries={recentLog} /> : null}
    </div>
  );
}

/**
 * Diagonal expand glyph — two arrows pointing to opposite corners
 * (top-right ↗ and bottom-left ↙). Matches the Figma pan/zoom icon at the
 * bottom-right of the Spotlight card.
 */
function PanZoomIcon() {
  return (
    <svg
      width={22}
      height={22}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className="text-white"
    >
      <path
        d="M14 4h6v6M20 4l-8 8M10 20H4v-6M4 20l8-8"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
