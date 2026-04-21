import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { getCurrentEmployee } from "@/lib/auth/current-employee";
import { fetchKudosPage } from "@/lib/kudos/fetch-kudos-page";
import { KvBanner } from "@/components/kudos/LiveBoard/KvBanner";
import { LiveBoardClient } from "@/components/kudos/LiveBoard/LiveBoardClient";
import type { PublicKudo } from "@/types/kudos";

/**
 * `/kudos` — Sun* Kudos Live Board.
 *
 * **Phase 3 (US1 Browse MVP + US7 Write entry)**: renders only the KV
 * banner (A) + ALL KUDOS feed (C.2). Filters, Highlight carousel,
 * Spotlight, and sidebar land in later phases.
 *
 * **Visual layout (Phase 4 pass 3 — matches Figma)**:
 *   - A full-width `<section className="relative">` hosts the hero
 *     watercolor background (`/images/homepage-hero-bg.png`) as a
 *     `<Image fill>` child plus a left-to-right darkening gradient
 *     overlay. Same pattern the homepage uses
 *     (`app/(dashboard)/page.tsx`), so the two routes look continuous.
 *   - `<KvBanner />` renders on top of the hero via a max-width
 *     container so the content stays left-aligned but the background
 *     spans the full viewport width.
 *   - The ALL KUDOS feed renders below on the plain dark page bg.
 *
 * **Performance** (Phase 4 pass 1): the page calls `fetchKudosPage()`
 * directly with the server-side Supabase client — no internal self-fetch
 * to our own Route Handler, no N+1 serialisation.
 *
 * See plan `MaZUn5xHXZ-sun-kudos-live-board` § T045 + Optimisation pass.
 */

interface KudosPageProps {
  searchParams: Promise<{
    hashtagId?: string;
    departmentId?: string;
  }>;
}

async function loadInitialFeed(params: {
  hashtagId: number | null;
  departmentId: number | null;
}): Promise<{ items: PublicKudo[]; nextCursor: string | null }> {
  const supabase = await createClient();

  let callerId: number | null = null;
  try {
    const emp = await getCurrentEmployee(supabase);
    callerId = emp.id;
  } catch {
    return { items: [], nextCursor: null };
  }

  const result = await fetchKudosPage(supabase, {
    callerEmployeeId: callerId,
    limit: 10,
    page: 1,
    hashtagId: params.hashtagId ?? undefined,
    departmentId: params.departmentId ?? undefined,
  });

  if (!result.ok) return { items: [], nextCursor: null };
  return { items: result.items, nextCursor: result.nextCursor };
}

function parseNumberOrNull(raw: string | undefined): number | null {
  if (!raw) return null;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export default async function KudosBoardPage({
  searchParams,
}: KudosPageProps) {
  const sp = await searchParams;
  const hashtagId = parseNumberOrNull(sp.hashtagId);
  const departmentId = parseNumberOrNull(sp.departmentId);

  const initial = await loadInitialFeed({ hashtagId, departmentId });

  return (
    <div className="text-white" style={{ background: "var(--color-live-page-bg)" }}>
      {/* Hero section — watercolor bg spans the full viewport width, same
          pattern as `/` (app/(dashboard)/page.tsx). The left-to-right
          darkening gradient keeps the banner text legible over the
          brighter right half of the artwork. */}
      <section className="relative">
        <Image
          src="/images/homepage-hero-bg.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className="absolute inset-0 object-cover object-center"
          aria-hidden="true"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 z-[1]"
          style={{
            background:
              "linear-gradient(90deg, #00101A 16%, rgba(0, 19, 32, 0.65) 48%, rgba(0, 19, 32, 0) 82%)",
          }}
        />
        <div className="relative z-10 mx-auto w-full max-w-[1440px] px-4 md:px-8 lg:px-16">
          <KvBanner />
        </div>
      </section>

      {/* ALL KUDOS feed on the plain dark page background. */}
      <div className="mx-auto w-full max-w-[1440px] px-4 md:px-8 lg:px-16">
        <LiveBoardClient
          initialFeed={initial.items}
          initialNextCursor={initial.nextCursor}
          initialHashtagId={hashtagId}
          initialDepartmentId={departmentId}
        />
      </div>
    </div>
  );
}
