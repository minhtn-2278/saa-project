"use client";

import { createContext, useContext, type Dispatch } from "react";

/**
 * Filter + carousel state for the Sun* Kudos Live board.
 *
 * Lifted to the top-level client island (`LiveBoardClient`) so the Highlight
 * carousel (B.2), the filter bar (B.1.1 / B.1.2), and the ALL KUDOS feed
 * (C.2) share a single source of truth. Hashtag chips inside any card
 * (B.4.3 / C.3.7) dispatch into this reducer via `LiveBoardFilterContext`
 * without prop-drilling through the virtualised list.
 *
 * URL mirroring (`?hashtagId=…&departmentId=…`) is handled by a separate
 * effect in `LiveBoardClient` — this reducer stays pure and URL-agnostic so
 * it's trivially testable.
 *
 * Plan § T030.
 */

export interface LiveBoardFilterState {
  /** Selected Hashtag ID, or `null` when no hashtag filter is active. */
  hashtagId: number | null;
  /** Selected Department ID, or `null` when no department filter is active. */
  departmentId: number | null;
  /** Current carousel slide index — always resets to 0 on any filter change. */
  carouselIndex: number;
}

export const initialLiveBoardFilterState: LiveBoardFilterState = {
  hashtagId: null,
  departmentId: null,
  carouselIndex: 0,
};

export type LiveBoardFilterAction =
  | { type: "setHashtag"; id: number | null }
  | { type: "setDepartment"; id: number | null }
  | { type: "clearFilters" }
  | { type: "resetCarouselIndex" }
  | { type: "nextSlide"; totalSlides: number }
  | { type: "prevSlide"; totalSlides: number }
  | { type: "setSlide"; index: number; totalSlides: number }
  | { type: "hydrate"; state: Partial<LiveBoardFilterState> };

/**
 * Pure reducer — no effects, no I/O. Safe to call from any context
 * (server, client, tests). Unknown action types are no-ops so stale
 * dispatchers don't crash during hot reload.
 */
export function liveBoardFilterReducer(
  state: LiveBoardFilterState,
  action: LiveBoardFilterAction,
): LiveBoardFilterState {
  switch (action.type) {
    case "setHashtag":
      if (state.hashtagId === action.id) return state;
      return { ...state, hashtagId: action.id, carouselIndex: 0 };

    case "setDepartment":
      if (state.departmentId === action.id) return state;
      return { ...state, departmentId: action.id, carouselIndex: 0 };

    case "clearFilters":
      if (state.hashtagId === null && state.departmentId === null) return state;
      return { ...state, hashtagId: null, departmentId: null, carouselIndex: 0 };

    case "resetCarouselIndex":
      if (state.carouselIndex === 0) return state;
      return { ...state, carouselIndex: 0 };

    case "nextSlide": {
      // Circular navigation — wraps around at the end.
      const total = Math.max(0, action.totalSlides);
      if (total <= 1) return state;
      const next = (state.carouselIndex + 1) % total;
      if (next === state.carouselIndex) return state;
      return { ...state, carouselIndex: next };
    }

    case "prevSlide": {
      // Circular navigation — wraps around at the start.
      const total = Math.max(0, action.totalSlides);
      if (total <= 1) return state;
      const prev = (state.carouselIndex - 1 + total) % total;
      if (prev === state.carouselIndex) return state;
      return { ...state, carouselIndex: prev };
    }

    case "setSlide": {
      const total = Math.max(0, action.totalSlides);
      if (total === 0) return state;
      const clamped = Math.max(0, Math.min(total - 1, action.index));
      if (clamped === state.carouselIndex) return state;
      return { ...state, carouselIndex: clamped };
    }

    case "hydrate":
      return { ...state, ...action.state };

    default:
      return state;
  }
}

// ---------------------------------------------------------------------------
// Context — exposes only `dispatch` so consumers don't re-render when state
// changes elsewhere (Q-P6 / T030 rationale). Consumers that need the state
// read it via props from `LiveBoardClient`.
// ---------------------------------------------------------------------------

export const LiveBoardFilterContext = createContext<
  Dispatch<LiveBoardFilterAction> | null
>(null);

/**
 * Get the Live-board filter dispatcher. Throws when used outside a
 * `<LiveBoardFilterContext.Provider>` to catch misuse early.
 */
export function useLiveBoardFilterDispatch(): Dispatch<LiveBoardFilterAction> {
  const dispatch = useContext(LiveBoardFilterContext);
  if (!dispatch) {
    throw new Error(
      "useLiveBoardFilterDispatch must be used inside <LiveBoardFilterContext.Provider>",
    );
  }
  return dispatch;
}
