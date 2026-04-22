import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => {
    const dict: Record<string, string> = {
      totalSuffix: "KUDOS",
      searchPlaceholder: "Tìm kiếm",
      recentReceiverPrefix: "Vừa nhận",
      reconnecting: "Đang kết nối lại…",
      spotlightQuiet:
        "Chưa có Kudos nào trong 24 giờ qua — hãy là người mở màn!",
    };
    return dict[key] ?? key;
  },
}));

// Stub the Supabase browser client — SpotlightBoard only uses it to pass
// into `subscribeKudoEvents`, which we mock below.
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({}),
}));

// Control the realtime channel: expose the latest handlers so tests can
// trigger `onInsert` / `onDelete` / `onConnectionState` on demand.
const realtimeHandlersRef: {
  current: {
    onInsert?: (p: unknown) => void;
    onDelete?: (p: unknown) => void;
    onConnectionState?: (s: string) => void;
  };
} = { current: {} };
const cleanupSpy = vi.fn();
vi.mock("@/lib/spotlight/realtime-channel", () => ({
  subscribeKudoEvents: (
    _client: unknown,
    handlers: {
      onInsert?: (p: unknown) => void;
      onDelete?: (p: unknown) => void;
      onConnectionState?: (s: string) => void;
    },
  ) => {
    realtimeHandlersRef.current = handlers;
    return cleanupSpy;
  },
}));

const { SpotlightBoard } = await import(
  "@/components/kudos/LiveBoard/SpotlightBoard/SpotlightBoard"
);

const initialData = {
  total: 100,
  nodes: [
    {
      id: 1,
      name: "Alice",
      avatarUrl: null,
      kudosCount: 5,
      lastReceivedAt: "2026-04-22T08:00:00Z",
      x: 0.5,
      y: 0.5,
    },
    {
      id: 2,
      name: "Bob",
      avatarUrl: null,
      kudosCount: 3,
      lastReceivedAt: "2026-04-22T07:00:00Z",
      x: 0.3,
      y: 0.4,
    },
  ],
  layoutVersion: "2026-04-22:5679000",
  cachedAt: "2026-04-22T08:00:00Z",
};

describe("SpotlightBoard", () => {
  beforeEach(() => {
    cleanupSpy.mockReset();
    realtimeHandlersRef.current = {};
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("renders total + node names from initialData", () => {
    render(<SpotlightBoard initialData={initialData} />);
    expect(screen.getByTestId("spotlight-total")).toHaveTextContent("100");
    expect(screen.getByText("KUDOS")).toBeInTheDocument();
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
  });

  it("debounces INSERT realtime events into a single total bump after 500 ms", async () => {
    render(<SpotlightBoard initialData={initialData} />);
    expect(screen.getByTestId("spotlight-total")).toHaveTextContent("100");

    // Fire three INSERTs back-to-back.
    act(() => {
      for (let i = 0; i < 3; i++) {
        realtimeHandlersRef.current.onInsert?.({
          id: 1000 + i,
          recipientId: 42,
          createdAt: "2026-04-22T09:00:00Z",
          status: "published",
        });
      }
    });

    // Before the debounce fires the total is still 100.
    expect(screen.getByTestId("spotlight-total")).toHaveTextContent("100");

    // After 500 ms the single bump lands.
    await act(async () => {
      vi.advanceTimersByTime(500);
    });
    expect(screen.getByTestId("spotlight-total")).toHaveTextContent("103");
  });

  it("ignores hidden / reported INSERT events", async () => {
    render(<SpotlightBoard initialData={initialData} />);

    act(() => {
      realtimeHandlersRef.current.onInsert?.({
        id: 500,
        recipientId: 1,
        createdAt: "2026-04-22T09:00:00Z",
        status: "hidden",
      });
    });

    await act(async () => {
      vi.advanceTimersByTime(500);
    });
    expect(screen.getByTestId("spotlight-total")).toHaveTextContent("100");
  });

  it("DELETE events decrement (debounced with any concurrent INSERTs)", async () => {
    render(<SpotlightBoard initialData={initialData} />);

    act(() => {
      realtimeHandlersRef.current.onDelete?.({
        id: 7,
        recipientId: 1,
        createdAt: "2026-04-22T09:00:00Z",
        status: "published",
      });
    });
    await act(async () => {
      vi.advanceTimersByTime(500);
    });
    expect(screen.getByTestId("spotlight-total")).toHaveTextContent("99");
  });

  it("shows the reconnecting status when the channel leaves SUBSCRIBED", () => {
    render(<SpotlightBoard initialData={initialData} />);

    act(() => {
      realtimeHandlersRef.current.onConnectionState?.("CHANNEL_ERROR");
    });
    expect(screen.getByText("Đang kết nối lại…")).toBeInTheDocument();

    act(() => {
      realtimeHandlersRef.current.onConnectionState?.("SUBSCRIBED");
    });
    expect(screen.queryByText("Đang kết nối lại…")).not.toBeInTheDocument();
  });

  it("renders the quiet-window empty state when nodes is empty", () => {
    render(
      <SpotlightBoard
        initialData={{
          total: 42,
          nodes: [],
          layoutVersion: "2026-04-22:5679000",
          cachedAt: "2026-04-22T08:00:00Z",
        }}
      />,
    );
    expect(
      screen.getByText(/Chưa có Kudos nào trong 24 giờ qua/),
    ).toBeInTheDocument();
  });

  it("cleans up the realtime channel on unmount", () => {
    const { unmount } = render(<SpotlightBoard initialData={initialData} />);
    expect(cleanupSpy).not.toHaveBeenCalled();
    unmount();
    expect(cleanupSpy).toHaveBeenCalledTimes(1);
  });
});
