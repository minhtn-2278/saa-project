import { describe, expect, it } from "vitest";
import {
  initialLiveBoardFilterState,
  liveBoardFilterReducer,
  type LiveBoardFilterState,
} from "@/components/kudos/LiveBoard/filter-reducer";

const stateWith = (
  overrides: Partial<LiveBoardFilterState>,
): LiveBoardFilterState => ({
  ...initialLiveBoardFilterState,
  ...overrides,
});

describe("liveBoardFilterReducer", () => {
  describe("setHashtag", () => {
    it("sets the hashtag id and resets carousel index", () => {
      const next = liveBoardFilterReducer(stateWith({ carouselIndex: 3 }), {
        type: "setHashtag",
        id: 42,
      });
      expect(next.hashtagId).toBe(42);
      expect(next.carouselIndex).toBe(0);
    });

    it("clears the filter when id is null", () => {
      const next = liveBoardFilterReducer(
        stateWith({ hashtagId: 7, carouselIndex: 1 }),
        { type: "setHashtag", id: null },
      );
      expect(next.hashtagId).toBeNull();
      expect(next.carouselIndex).toBe(0);
    });

    it("is a no-op when the hashtag is already set to the same id", () => {
      const before = stateWith({ hashtagId: 5, carouselIndex: 3 });
      const next = liveBoardFilterReducer(before, {
        type: "setHashtag",
        id: 5,
      });
      expect(next).toBe(before);
    });
  });

  describe("setDepartment", () => {
    it("sets departmentId and resets carouselIndex independently from hashtagId", () => {
      const next = liveBoardFilterReducer(
        stateWith({ hashtagId: 1, carouselIndex: 2 }),
        { type: "setDepartment", id: 99 },
      );
      expect(next.hashtagId).toBe(1); // preserved
      expect(next.departmentId).toBe(99);
      expect(next.carouselIndex).toBe(0);
    });
  });

  describe("clearFilters", () => {
    it("drops both filters and resets carousel index", () => {
      const next = liveBoardFilterReducer(
        stateWith({ hashtagId: 1, departmentId: 2, carouselIndex: 4 }),
        { type: "clearFilters" },
      );
      expect(next).toEqual(initialLiveBoardFilterState);
    });

    it("is a no-op when both filters are already null", () => {
      const before = initialLiveBoardFilterState;
      expect(liveBoardFilterReducer(before, { type: "clearFilters" })).toBe(
        before,
      );
    });
  });

  describe("carousel navigation", () => {
    it("nextSlide advances when not at the end", () => {
      const next = liveBoardFilterReducer(stateWith({ carouselIndex: 1 }), {
        type: "nextSlide",
        totalSlides: 5,
      });
      expect(next.carouselIndex).toBe(2);
    });

    it("nextSlide is a no-op at the last slide", () => {
      const before = stateWith({ carouselIndex: 4 });
      const next = liveBoardFilterReducer(before, {
        type: "nextSlide",
        totalSlides: 5,
      });
      expect(next).toBe(before);
    });

    it("prevSlide goes back but not below 0", () => {
      expect(
        liveBoardFilterReducer(stateWith({ carouselIndex: 2 }), {
          type: "prevSlide",
        }).carouselIndex,
      ).toBe(1);
      // At index 0 the reducer returns the same reference (no-op) — compare
      // against the input, not the exported `initialLiveBoardFilterState`
      // (they're structurally equal but not referentially identical after
      // going through `stateWith`'s spread).
      const zeroState = stateWith({ carouselIndex: 0 });
      expect(
        liveBoardFilterReducer(zeroState, { type: "prevSlide" }),
      ).toBe(zeroState);
    });

    it("setSlide clamps into [0, total-1]", () => {
      expect(
        liveBoardFilterReducer(initialLiveBoardFilterState, {
          type: "setSlide",
          index: 100,
          totalSlides: 5,
        }).carouselIndex,
      ).toBe(4);
      expect(
        liveBoardFilterReducer(initialLiveBoardFilterState, {
          type: "setSlide",
          index: -3,
          totalSlides: 5,
        }).carouselIndex,
      ).toBe(0);
    });

    it("resetCarouselIndex is a no-op when already 0", () => {
      const before = initialLiveBoardFilterState;
      expect(
        liveBoardFilterReducer(before, { type: "resetCarouselIndex" }),
      ).toBe(before);
    });

    it("resetCarouselIndex clears from non-zero", () => {
      expect(
        liveBoardFilterReducer(stateWith({ carouselIndex: 3 }), {
          type: "resetCarouselIndex",
        }).carouselIndex,
      ).toBe(0);
    });
  });

  describe("hydrate", () => {
    it("shallow-merges the partial state (URL-param restore)", () => {
      const next = liveBoardFilterReducer(initialLiveBoardFilterState, {
        type: "hydrate",
        state: { hashtagId: 12, departmentId: 5 },
      });
      expect(next).toEqual({
        hashtagId: 12,
        departmentId: 5,
        carouselIndex: 0,
      });
    });
  });

  it("returns the same reference on unknown action types", () => {
    const before = stateWith({ hashtagId: 1 });
    // @ts-expect-error — intentionally passing an unknown action.
    const next = liveBoardFilterReducer(before, { type: "__noop__" });
    expect(next).toBe(before);
  });
});
