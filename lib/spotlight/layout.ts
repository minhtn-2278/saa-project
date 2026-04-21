/**
 * Deterministic packer for the Spotlight canvas nodes (Live board B.7).
 *
 * Given up to 20 top-recipient entries, produce a stable `{x, y}` layout in
 * the [0, 1] square. The function is **pure** and **deterministic**:
 *
 *   - Same inputs (rows + seed) → identical output on every call.
 *   - Same `employee_id` keeps the same bucket across 5-min refreshes when
 *     the ranking is unchanged (UI can animate moves when the bucket shifts).
 *
 * Algorithm: **phyllotaxis spiral** (golden-angle). It spreads points evenly
 * without overlap for N ≤ ~50 without simulation, is O(n), and gives a
 * visually interesting "word cloud" look. Kudos counts drive a weight
 * multiplier on the radius so the most-hearted recipients cluster near the
 * center.
 *
 * The spiral's starting angle is seeded by the `seed` string (event-day +
 * 5-min bucket) so layouts change every 5 minutes but stay stable within
 * a bucket — callers rely on this to decide when to animate.
 *
 * See plan `MaZUn5xHXZ-sun-kudos-live-board` § T018, Q-P6.
 */

export interface SpotlightLayoutInput {
  id: number;
  name: string;
  avatarUrl: string | null;
  kudosCount: number;
  lastReceivedAt: string;
}

export interface SpotlightLayoutNode extends SpotlightLayoutInput {
  /** Normalised horizontal position within the canvas, 0..1. */
  x: number;
  /** Normalised vertical position within the canvas, 0..1. */
  y: number;
}

const GOLDEN_ANGLE_RAD = Math.PI * (3 - Math.sqrt(5)); // ≈ 2.39996

/**
 * Compute canvas positions for up to 20 top-recipient rows.
 *
 * @param rows   Top-N recipients by `kudosCount`. Input order is preserved
 *               in the output; ranking + tie-breaking is the caller's job.
 * @param seed   Opaque string (e.g. `${eventDayIso}:${bucket5min}`). Same seed
 *               yields the same spiral start angle on every invocation.
 */
export function computeSpotlightLayout(
  rows: SpotlightLayoutInput[],
  seed: string,
): SpotlightLayoutNode[] {
  const n = rows.length;
  if (n === 0) return [];

  const seedOffset = hashStringToUnit(seed) * Math.PI * 2;
  const maxCount = rows.reduce((m, r) => Math.max(m, r.kudosCount), 1);

  return rows.map((row, i) => {
    // Phyllotaxis: radius grows with sqrt(i) so points stay evenly packed.
    // We normalise i to [0, 1] over the group and multiply by 0.44 — that
    // keeps every center of mass within the canvas even at the max radius.
    const progress = n === 1 ? 0 : i / (n - 1);
    const baseRadius = 0.44 * Math.sqrt(progress);

    // Hot recipients pull slightly inward. countWeight ∈ [0.82, 1.0] — a
    // gentle nudge so visual hierarchy shows but the top-N still spread
    // across the whole canvas (pure inward-pull would clump them).
    const countWeight = 1 - (row.kudosCount / maxCount) * 0.18;
    const radius = baseRadius * countWeight;

    const angle = seedOffset + i * GOLDEN_ANGLE_RAD;

    // Center the spiral at (0.5, 0.5); clamp defensively in case a future
    // change pushes the radius past 0.5.
    const x = clamp01(0.5 + radius * Math.cos(angle));
    const y = clamp01(0.5 + radius * Math.sin(angle));

    return { ...row, x, y };
  });
}

// ---------------------------------------------------------------------------
// Internals — pure helpers so they're easy to unit-test.
// ---------------------------------------------------------------------------

/**
 * Map an arbitrary string to a stable unit-interval [0, 1) value via FNV-1a.
 * Deterministic — same string always yields the same number.
 */
export function hashStringToUnit(input: string): number {
  // FNV-1a 32-bit. We only need ~22 bits of entropy for the angle offset.
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    // Force 32-bit wrap via Math.imul.
    hash = Math.imul(hash, 0x01000193);
  }
  // Convert to unsigned and fold into [0, 1).
  return ((hash >>> 0) % 1_000_003) / 1_000_003;
}

function clamp01(v: number): number {
  if (v < 0) return 0;
  if (v > 1) return 1;
  return v;
}
