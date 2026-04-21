import { describe, expect, it } from "vitest";
import {
  computeSpotlightLayout,
  hashStringToUnit,
  type SpotlightLayoutInput,
} from "@/lib/spotlight/layout";

const row = (
  id: number,
  kudosCount: number,
  overrides: Partial<SpotlightLayoutInput> = {},
): SpotlightLayoutInput => ({
  id,
  name: `User ${id}`,
  avatarUrl: null,
  kudosCount,
  lastReceivedAt: "2026-04-21T12:00:00Z",
  ...overrides,
});

describe("lib/spotlight/layout", () => {
  describe("hashStringToUnit", () => {
    it("returns the same value for the same input", () => {
      expect(hashStringToUnit("abc")).toBe(hashStringToUnit("abc"));
      expect(hashStringToUnit("2026-04-21:471234")).toBe(
        hashStringToUnit("2026-04-21:471234"),
      );
    });

    it("returns different values for different inputs", () => {
      const a = hashStringToUnit("seed-a");
      const b = hashStringToUnit("seed-b");
      expect(a).not.toBe(b);
    });

    it("returns values in [0, 1)", () => {
      for (const input of ["", "a", "abc", "2026-04-21", "x".repeat(1000)]) {
        const v = hashStringToUnit(input);
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThan(1);
      }
    });
  });

  describe("computeSpotlightLayout", () => {
    it("returns empty array on empty input", () => {
      expect(computeSpotlightLayout([], "any-seed")).toEqual([]);
    });

    it("produces a single node at center for n=1", () => {
      const [node] = computeSpotlightLayout([row(1, 5)], "seed");
      expect(node.x).toBeCloseTo(0.5, 2);
      expect(node.y).toBeCloseTo(0.5, 2);
      expect(node.id).toBe(1);
      expect(node.kudosCount).toBe(5);
    });

    it("is deterministic: same seed + same rows → identical x/y", () => {
      const rows = [row(1, 10), row(2, 8), row(3, 6), row(4, 4), row(5, 2)];
      const a = computeSpotlightLayout(rows, "bucket-A");
      const b = computeSpotlightLayout(rows, "bucket-A");
      expect(a).toEqual(b);
    });

    it("different seeds produce different layouts", () => {
      const rows = [row(1, 10), row(2, 8), row(3, 6), row(4, 4), row(5, 2)];
      const a = computeSpotlightLayout(rows, "bucket-A");
      const b = computeSpotlightLayout(rows, "bucket-B");
      // Node 1 is at the center (progress = 0 → radius = 0) so it's always
      // at (0.5, 0.5) regardless of seed — compare a later node instead.
      expect(a[4].x).not.toBeCloseTo(b[4].x, 3);
    });

    it("preserves input order (ranking already applied by caller)", () => {
      const rows = [row(7, 50), row(3, 10), row(12, 1)];
      const out = computeSpotlightLayout(rows, "seed");
      expect(out.map((n) => n.id)).toEqual([7, 3, 12]);
    });

    it("keeps every node within the [0, 1] square", () => {
      // Build 20 rows with varied counts to exercise the weighting.
      const rows = Array.from({ length: 20 }, (_, i) =>
        row(i + 1, 20 - i),
      );
      const out = computeSpotlightLayout(rows, "bucket-X");
      for (const n of out) {
        expect(n.x).toBeGreaterThanOrEqual(0);
        expect(n.x).toBeLessThanOrEqual(1);
        expect(n.y).toBeGreaterThanOrEqual(0);
        expect(n.y).toBeLessThanOrEqual(1);
      }
    });

    it("carries through name / avatarUrl / lastReceivedAt unchanged", () => {
      const rows = [
        row(1, 5, {
          name: "Alice",
          avatarUrl: "https://example.com/a.png",
          lastReceivedAt: "2026-04-21T09:00:00Z",
        }),
      ];
      const [node] = computeSpotlightLayout(rows, "seed");
      expect(node.name).toBe("Alice");
      expect(node.avatarUrl).toBe("https://example.com/a.png");
      expect(node.lastReceivedAt).toBe("2026-04-21T09:00:00Z");
    });

    it("highest-count node sits closer to center than lowest-count node", () => {
      const rows = [
        row(1, 100), // highest — but at index 0, radius = 0 → at center
        row(2, 50),
        row(3, 25),
        row(4, 10),
        row(5, 2), // lowest, outermost index
      ];
      const out = computeSpotlightLayout(rows, "bucket-X");
      const distFromCenter = (x: number, y: number) =>
        Math.hypot(x - 0.5, y - 0.5);
      const top = distFromCenter(out[0].x, out[0].y);
      const bottom = distFromCenter(out[4].x, out[4].y);
      expect(top).toBeLessThan(bottom);
    });
  });
});
