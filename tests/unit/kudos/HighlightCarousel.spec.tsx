import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { LiveBoardFilterContext } from "@/components/kudos/LiveBoard/filter-reducer";
import { SlidePagination } from "@/components/kudos/LiveBoard/HighlightCarousel/SlidePagination";
import type { PublicKudo } from "@/types/kudos";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => {
    const dict: Record<string, string> = {
      "highlight.ariaLabel": "Highlight carousel",
      prevAria: "Kudo trước",
      nextAria: "Kudo tiếp theo",
      disabledTitle: "Sắp ra mắt",
    };
    return dict[key] ?? key;
  },
}));

// Lazy-import HighlightCarousel AFTER mocking next-intl.
const { HighlightCarousel } = await import(
  "@/components/kudos/LiveBoard/HighlightCarousel/HighlightCarousel"
);

function kudo(id: number): PublicKudo {
  return {
    id,
    senderName: "S",
    senderDepartment: null,
    senderAvatarUrl: null,
    recipientId: 1,
    recipientName: "R",
    recipientDepartment: null,
    recipientAvatarUrl: null,
    title: {
      id: 1,
      name: "T",
      slug: "t",
      description: null,
      icon: null,
      sortOrder: 0,
    },
    body: { type: "doc", content: [] },
    bodyPlain: `body ${id}`,
    hashtags: [],
    images: [],
    mentions: [],
    isAnonymous: false,
    status: "published",
    createdAt: "2026-04-21T00:00:00Z",
    heartCount: 0,
    heartedByMe: false,
    canHeart: true,
  } as PublicKudo;
}

function mockHighlightResponse(items: PublicKudo[]) {
  globalThis.fetch = vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({ data: items }),
  }) as unknown as typeof fetch;
}

function renderWithDispatch(
  ui: React.ReactElement,
  dispatch = vi.fn(),
) {
  const result = render(
    <LiveBoardFilterContext.Provider value={dispatch}>
      {ui}
    </LiveBoardFilterContext.Provider>,
  );
  return { ...result, dispatch };
}

describe("SlidePagination", () => {
  it("renders `current+1 / total` — 1-based display of the 0-based index", () => {
    render(
      <SlidePagination current={2} total={5} onPrev={() => {}} onNext={() => {}} />,
    );
    const chip = screen.getByTestId("slide-pagination-chip");
    expect(chip).toHaveTextContent("3");
    expect(chip).toHaveTextContent("/ 5");
  });

  it("calls onPrev / onNext on arrow click", () => {
    const onPrev = vi.fn();
    const onNext = vi.fn();
    render(
      <SlidePagination current={1} total={3} onPrev={onPrev} onNext={onNext} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Kudo trước" }));
    fireEvent.click(screen.getByRole("button", { name: "Kudo tiếp theo" }));
    expect(onPrev).toHaveBeenCalledTimes(1);
    expect(onNext).toHaveBeenCalledTimes(1);
  });

  it("disables both arrows when total ≤ 1 (nothing to navigate to)", () => {
    render(
      <SlidePagination current={0} total={1} onPrev={() => {}} onNext={() => {}} />,
    );
    expect(screen.getByRole("button", { name: "Kudo trước" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Kudo tiếp theo" })).toBeDisabled();
  });

  it("keeps arrows enabled at the ends (circular / wrap carousel)", () => {
    // At index 0 + total 5, arrows must stay enabled — wrap handles the edge.
    render(
      <SlidePagination current={0} total={5} onPrev={() => {}} onNext={() => {}} />,
    );
    expect(screen.getByRole("button", { name: "Kudo trước" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Kudo tiếp theo" })).toBeEnabled();
  });
});

describe("HighlightCarousel", () => {
  let originalFetch: typeof fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("renders the skeleton initially, then the carousel once fetch resolves", async () => {
    mockHighlightResponse([kudo(1), kudo(2), kudo(3)]);
    const { container } = renderWithDispatch(
      <HighlightCarousel hashtagId={null} departmentId={null} carouselIndex={0} />,
    );

    // Skeleton (role=status) is present while loading.
    expect(container.querySelector('[role="status"]')).not.toBeNull();

    // Once the fetch resolves, the pagination chip renders with `1 / 3`.
    await waitFor(() => {
      const chip = screen.getByTestId("slide-pagination-chip");
      expect(chip).toHaveTextContent("1");
      expect(chip).toHaveTextContent("/ 3");
    });
  });

  it("fetches /api/kudos/highlight with no query when no filters are set", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ data: [kudo(1)] }),
    });
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    renderWithDispatch(
      <HighlightCarousel hashtagId={null} departmentId={null} carouselIndex={0} />,
    );

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    const url = fetchMock.mock.calls[0][0] as string;
    expect(url).toBe("/api/kudos/highlight");
  });

  it("includes hashtagId + departmentId in the query when set", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ data: [] }),
    });
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    renderWithDispatch(
      <HighlightCarousel hashtagId={12} departmentId={7} carouselIndex={0} />,
    );

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    const url = fetchMock.mock.calls[0][0] as string;
    expect(url).toContain("hashtagId=12");
    expect(url).toContain("departmentId=7");
  });

  it("dispatches {prevSlide, nextSlide} with the live total on arrow clicks", async () => {
    mockHighlightResponse([kudo(1), kudo(2), kudo(3)]);
    const { dispatch } = renderWithDispatch(
      <HighlightCarousel hashtagId={null} departmentId={null} carouselIndex={0} />,
    );

    // Wait for the carousel to mount with real items.
    await waitFor(() => {
      expect(screen.getByTestId("slide-pagination-chip")).toBeInTheDocument();
    });

    // Two rail arrows + two chip arrows — assert via aria-label.
    const nexts = screen.getAllByRole("button", { name: "Kudo tiếp theo" });
    const prevs = screen.getAllByRole("button", { name: "Kudo trước" });
    expect(nexts.length).toBeGreaterThanOrEqual(1);
    expect(prevs.length).toBeGreaterThanOrEqual(1);

    fireEvent.click(nexts[0]);
    fireEvent.click(prevs[0]);

    expect(dispatch).toHaveBeenCalledWith({ type: "nextSlide", totalSlides: 3 });
    expect(dispatch).toHaveBeenCalledWith({ type: "prevSlide", totalSlides: 3 });
  });

  it("refetches when hashtagId changes (filter reset flow)", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ data: [kudo(1)] }),
    });
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const { rerender } = renderWithDispatch(
      <HighlightCarousel hashtagId={null} departmentId={null} carouselIndex={0} />,
    );
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    await act(async () => {
      rerender(
        <LiveBoardFilterContext.Provider value={vi.fn()}>
          <HighlightCarousel
            hashtagId={42}
            departmentId={null}
            carouselIndex={0}
          />
        </LiveBoardFilterContext.Provider>,
      );
    });

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    const secondUrl = fetchMock.mock.calls[1][0] as string;
    expect(secondUrl).toContain("hashtagId=42");
  });

  it("does not render navigation UI when the feed is empty", async () => {
    mockHighlightResponse([]);
    renderWithDispatch(
      <HighlightCarousel hashtagId={null} departmentId={null} carouselIndex={0} />,
    );

    // No pagination chip when total === 0.
    await waitFor(() => {
      expect(
        screen.queryByTestId("slide-pagination-chip"),
      ).not.toBeInTheDocument();
    });
  });
});
