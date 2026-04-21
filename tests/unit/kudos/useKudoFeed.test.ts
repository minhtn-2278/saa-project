import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { useKudoFeed } from "@/components/kudos/LiveBoard/KudoFeed/use-kudo-feed";
import type { PublicKudo } from "@/types/kudos";

const kudo = (id: number, bodyPlain = `body ${id}`): PublicKudo =>
  ({
    id,
    senderName: "Sender",
    senderAvatarUrl: null,
    recipientId: 1,
    recipientName: "Recipient",
    recipientAvatarUrl: null,
    title: {
      id: 1,
      name: "Title",
      slug: "title",
      description: null,
      icon: null,
      sortOrder: 0,
    },
    body: { type: "doc", content: [] },
    bodyPlain,
    hashtags: [],
    images: [],
    mentions: [],
    isAnonymous: false,
    status: "published",
    createdAt: "2026-04-21T00:00:00Z",
    heartCount: 0,
    heartedByMe: false,
    canHeart: true,
  }) as PublicKudo;

type FetchArgs = Parameters<typeof fetch>;

describe("useKudoFeed", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    globalThis.fetch = fetchMock as unknown as typeof fetch;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function mockNextResponse(data: PublicKudo[], nextCursor: string | null) {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ data, meta: { limit: 10, nextCursor } }),
    });
  }

  it("seeds state from the initial feed + cursor — no fetch on mount", () => {
    const { result } = renderHook(() =>
      useKudoFeed({
        initialFeed: [kudo(1), kudo(2)],
        initialNextCursor: "cursor-2",
        hashtagId: null,
        departmentId: null,
      }),
    );

    expect(result.current.items.map((k) => k.id)).toEqual([1, 2]);
    expect(result.current.isEnd).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("isEnd=true when initial cursor is null", () => {
    const { result } = renderHook(() =>
      useKudoFeed({
        initialFeed: [kudo(1)],
        initialNextCursor: null,
        hashtagId: null,
        departmentId: null,
      }),
    );
    expect(result.current.isEnd).toBe(true);
  });

  it("loadMore appends the next page and advances the cursor", async () => {
    const { result } = renderHook(() =>
      useKudoFeed({
        initialFeed: [kudo(1), kudo(2)],
        initialNextCursor: "cursor-2",
        hashtagId: null,
        departmentId: null,
      }),
    );

    mockNextResponse([kudo(3), kudo(4)], "cursor-4");

    await act(async () => {
      await result.current.loadMore();
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const firstCallUrl = (fetchMock.mock.calls[0] as FetchArgs)[0] as string;
    expect(firstCallUrl).toContain("/api/kudos?");
    expect(firstCallUrl).toContain("cursor=cursor-2");

    expect(result.current.items.map((k) => k.id)).toEqual([1, 2, 3, 4]);
    expect(result.current.isEnd).toBe(false);
  });

  it("loadMore is a no-op when cursor is null (end of feed)", async () => {
    const { result } = renderHook(() =>
      useKudoFeed({
        initialFeed: [kudo(1)],
        initialNextCursor: null,
        hashtagId: null,
        departmentId: null,
      }),
    );

    await act(async () => {
      await result.current.loadMore();
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("refetches from scratch when the hashtag filter changes", async () => {
    const { result, rerender } = renderHook(
      (props: { hashtagId: number | null }) =>
        useKudoFeed({
          initialFeed: [kudo(1)],
          initialNextCursor: "cursor-1",
          hashtagId: props.hashtagId,
          departmentId: null,
        }),
      { initialProps: { hashtagId: null as number | null } },
    );

    // Changing the hashtag triggers a replace-mode fetch.
    mockNextResponse([kudo(10)], null);
    rerender({ hashtagId: 12 });

    await waitFor(() => {
      expect(result.current.items.map((k) => k.id)).toEqual([10]);
    });
    const url = (fetchMock.mock.calls[0] as FetchArgs)[0] as string;
    expect(url).toContain("hashtagId=12");
    // cursor param is absent on a fresh filter fetch.
    expect(url).not.toContain("cursor=");
  });

  it("prepend inserts a kudo at the top and dedupes by id", () => {
    const { result } = renderHook(() =>
      useKudoFeed({
        initialFeed: [kudo(1), kudo(2)],
        initialNextCursor: null,
        hashtagId: null,
        departmentId: null,
      }),
    );

    act(() => {
      result.current.prepend(kudo(99));
    });
    expect(result.current.items.map((k) => k.id)).toEqual([99, 1, 2]);

    // Dedupe — prepending the same id again is a no-op.
    act(() => {
      result.current.prepend(kudo(99));
    });
    expect(result.current.items.map((k) => k.id)).toEqual([99, 1, 2]);
  });

  it("prepends on the `kudo:created` window event (US7 optimistic flow)", () => {
    const { result } = renderHook(() =>
      useKudoFeed({
        initialFeed: [kudo(1), kudo(2)],
        initialNextCursor: null,
        hashtagId: null,
        departmentId: null,
      }),
    );

    const newKudo = kudo(500, "just submitted");
    act(() => {
      window.dispatchEvent(new CustomEvent("kudo:created", { detail: newKudo }));
    });

    expect(result.current.items[0].id).toBe(500);
    expect(result.current.items.map((k) => k.id)).toEqual([500, 1, 2]);
  });

  it("ignores malformed `kudo:created` payloads", () => {
    const { result } = renderHook(() =>
      useKudoFeed({
        initialFeed: [kudo(1)],
        initialNextCursor: null,
        hashtagId: null,
        departmentId: null,
      }),
    );

    act(() => {
      window.dispatchEvent(new CustomEvent("kudo:created", { detail: null }));
      window.dispatchEvent(
        new CustomEvent("kudo:created", { detail: { id: "not a number" } }),
      );
      window.dispatchEvent(
        new CustomEvent("kudo:created", { detail: { id: 99 /* no bodyPlain */ } }),
      );
    });

    // Feed is unchanged.
    expect(result.current.items.map((k) => k.id)).toEqual([1]);
  });

  it("surfaces a fetch error without crashing", async () => {
    fetchMock.mockRejectedValueOnce(new Error("network down"));
    const { result } = renderHook(() =>
      useKudoFeed({
        initialFeed: [kudo(1)],
        initialNextCursor: "cursor-1",
        hashtagId: null,
        departmentId: null,
      }),
    );
    await act(async () => {
      await result.current.loadMore();
    });
    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.items.map((k) => k.id)).toEqual([1]);
  });
});
