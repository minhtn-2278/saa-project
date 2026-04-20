import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { useEmployeeSearch } from "@/components/kudos/WriteKudoModal/hooks/useEmployeeSearch";

/**
 * Hook tests run with real timers: the debounce window (250 ms) is short
 * enough to `await` directly, and mixing fake timers with `waitFor()` is
 * brittle (waitFor uses real time under the hood).
 */
describe("useEmployeeSearch", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: [
          {
            id: 1,
            fullName: "Alice",
            avatarUrl: null,
            department: "Eng",
          },
        ],
      }),
    });
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("fetches after the debounce window", async () => {
    const { result } = renderHook(() => useEmployeeSearch());
    act(() => result.current.search("Al"));
    expect(fetchMock).not.toHaveBeenCalled();
    await waitFor(
      () => expect(fetchMock).toHaveBeenCalledTimes(1),
      { timeout: 1500 },
    );
    expect(fetchMock.mock.calls[0][0]).toContain("q=Al");
  });

  it("passes ignore_caller=false when includeCaller=true", async () => {
    const { result } = renderHook(() =>
      useEmployeeSearch({ includeCaller: true }),
    );
    act(() => result.current.search("min"));
    await waitFor(() => expect(fetchMock).toHaveBeenCalled(), { timeout: 1500 });
    expect(fetchMock.mock.calls[0][0]).toContain("ignore_caller=false");
  });

  it("clears results when the query becomes empty", async () => {
    const { result } = renderHook(() => useEmployeeSearch());
    act(() => result.current.search("alice"));
    await waitFor(
      () => expect(result.current.results.length).toBe(1),
      { timeout: 1500 },
    );
    act(() => result.current.search(""));
    expect(result.current.results).toEqual([]);
  });
});
