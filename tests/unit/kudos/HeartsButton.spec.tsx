import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => {
    const dict: Record<string, string> = {
      heartError: "Không thể thả tim. Vui lòng thử lại.",
    };
    return dict[key] ?? key;
  },
}));

const toastError = vi.fn();
vi.mock("sonner", () => ({
  toast: {
    error: (msg: string) => toastError(msg),
  },
}));

const { HeartsButton } = await import(
  "@/components/kudos/LiveBoard/parts/HeartsButton"
);

function mockFetchOnce(body: unknown, ok = true, status = 200) {
  const fn = vi.fn().mockResolvedValueOnce({
    ok,
    status,
    json: async () => body,
  });
  globalThis.fetch = fn as unknown as typeof fetch;
  return fn;
}

describe("HeartsButton", () => {
  let originalFetch: typeof fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
    toastError.mockReset();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("renders inactive heart with the given count", () => {
    render(
      <HeartsButton kudoId={10} count={3} hearted={false} canHeart={true} />,
    );
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Thả tim/ }),
    ).toHaveAttribute("aria-pressed", "false");
  });

  it("is disabled when canHeart=false (author self-like rule)", () => {
    render(
      <HeartsButton kudoId={10} count={3} hearted={false} canHeart={false} />,
    );
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("optimistically flips to hearted on click, then reconciles with server", async () => {
    const fetchMock = mockFetchOnce({
      data: { kudoId: 10, heartCount: 4, heartedByMe: true },
    });
    render(
      <HeartsButton kudoId={10} count={3} hearted={false} canHeart={true} />,
    );
    const btn = screen.getByRole("button", { name: /Thả tim/ });

    await act(async () => {
      fireEvent.click(btn);
    });

    // Optimistic + reconciled (same value here) — final count is 4.
    expect(screen.getByText("4")).toBeInTheDocument();
    expect(screen.getByRole("button")).toHaveAttribute("aria-pressed", "true");
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/kudos/10/like",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("sends DELETE when unliking (caller was previously hearted)", async () => {
    const fetchMock = mockFetchOnce({
      data: { kudoId: 10, heartCount: 2, heartedByMe: false },
    });
    render(
      <HeartsButton kudoId={10} count={3} hearted={true} canHeart={true} />,
    );

    await act(async () => {
      fireEvent.click(screen.getByRole("button"));
    });

    expect(fetchMock.mock.calls[0][1]).toMatchObject({ method: "DELETE" });
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByRole("button")).toHaveAttribute("aria-pressed", "false");
  });

  it("rolls back and toasts on non-2xx response (e.g. 403 self-like bypass)", async () => {
    mockFetchOnce(
      { error: { code: "SELF_LIKE_FORBIDDEN", message: "…" } },
      false,
      403,
    );
    render(
      <HeartsButton kudoId={10} count={3} hearted={false} canHeart={true} />,
    );

    await act(async () => {
      fireEvent.click(screen.getByRole("button"));
    });

    // Reverted back to the pre-click state.
    await waitFor(() => {
      expect(screen.getByText("3")).toBeInTheDocument();
    });
    expect(screen.getByRole("button")).toHaveAttribute("aria-pressed", "false");
    expect(toastError).toHaveBeenCalledWith(
      "Không thể thả tim. Vui lòng thử lại.",
    );
  });

  it("rolls back when fetch rejects (network error)", async () => {
    globalThis.fetch = vi
      .fn()
      .mockRejectedValueOnce(new Error("network")) as unknown as typeof fetch;

    render(
      <HeartsButton kudoId={10} count={3} hearted={false} canHeart={true} />,
    );

    await act(async () => {
      fireEvent.click(screen.getByRole("button"));
    });

    await waitFor(() => {
      expect(screen.getByText("3")).toBeInTheDocument();
    });
    expect(screen.getByRole("button")).toHaveAttribute("aria-pressed", "false");
    expect(toastError).toHaveBeenCalledTimes(1);
  });

  it("applies a brief scale-up on click (pulse animation hook)", async () => {
    mockFetchOnce({
      data: { kudoId: 10, heartCount: 4, heartedByMe: true },
    });
    const { container } = render(
      <HeartsButton kudoId={10} count={3} hearted={false} canHeart={true} />,
    );

    // Before click — rest state uses scale-100.
    expect(container.querySelector(".scale-100")).not.toBeNull();

    await act(async () => {
      fireEvent.click(screen.getByRole("button"));
    });

    // Immediately after click the icon span is pulsed (scale-125). After
    // the 200ms timeout it returns to scale-100 — asserted via waitFor.
    expect(container.querySelector(".scale-125")).not.toBeNull();
    await waitFor(
      () => {
        expect(container.querySelector(".scale-100")).not.toBeNull();
      },
      { timeout: 600 },
    );
  });

  it("re-syncs with server props when parent refetches feed", async () => {
    const { rerender } = render(
      <HeartsButton kudoId={10} count={3} hearted={false} canHeart={true} />,
    );
    expect(screen.getByText("3")).toBeInTheDocument();

    rerender(
      <HeartsButton kudoId={10} count={9} hearted={true} canHeart={true} />,
    );
    expect(screen.getByText("9")).toBeInTheDocument();
    expect(screen.getByRole("button")).toHaveAttribute("aria-pressed", "true");
  });
});
