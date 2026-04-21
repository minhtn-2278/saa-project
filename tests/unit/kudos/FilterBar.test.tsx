import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { LiveBoardFilterContext } from "@/components/kudos/LiveBoard/filter-reducer";
import type { LiveBoardFilterAction } from "@/components/kudos/LiveBoard/filter-reducer";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => {
    const t: Record<string, string> = {
      hashtag: "Hashtag",
      department: "Phòng ban",
      clearAria: "Xóa bộ lọc",
    };
    return t[key] ?? key;
  },
}));

const { FilterBar } = await import("@/components/kudos/LiveBoard/FilterBar");

const hashtags = [
  { id: 1, label: "Dedicated" },
  { id: 2, label: "Teamwork" },
];
const departments = [
  { id: 11, code: "DSV - UI/UX 1", name: null, parentId: null, sortOrder: 10 },
  { id: 12, code: "DSV - FE 1", name: null, parentId: null, sortOrder: 20 },
];

function mockFetch() {
  const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
    const url =
      typeof input === "string" ? input : (input as URL | Request).toString();
    if (url.includes("/api/hashtags")) {
      return new Response(JSON.stringify({ data: hashtags }), { status: 200 });
    }
    if (url.includes("/api/departments")) {
      return new Response(JSON.stringify({ data: departments }), {
        status: 200,
      });
    }
    return new Response("not found", { status: 404 });
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("FilterBar", () => {
  beforeEach(() => {
    mockFetch();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("loads hashtag + department options on mount", async () => {
    const dispatch = vi.fn();
    render(
      <LiveBoardFilterContext.Provider value={dispatch}>
        <FilterBar hashtagId={null} departmentId={null} />
      </LiveBoardFilterContext.Provider>,
    );

    // Open Hashtag dropdown → expect items.
    const hashtagTrigger = screen.getByRole("button", { name: "Hashtag" });
    fireEvent.click(hashtagTrigger);
    await waitFor(() => {
      expect(screen.getByText("#Dedicated")).toBeInTheDocument();
      expect(screen.getByText("#Teamwork")).toBeInTheDocument();
    });
    // Close and open the Phòng ban dropdown — department items use `code`.
    fireEvent.keyDown(screen.getByRole("listbox"), { key: "Escape" });
    const deptTrigger = screen.getByRole("button", { name: "Phòng ban" });
    fireEvent.click(deptTrigger);
    await waitFor(() => {
      expect(screen.getByText("DSV - UI/UX 1")).toBeInTheDocument();
      expect(screen.getByText("DSV - FE 1")).toBeInTheDocument();
    });
  });

  it("dispatches setHashtag with the picked id", async () => {
    const dispatch = vi.fn<(a: LiveBoardFilterAction) => void>();
    render(
      <LiveBoardFilterContext.Provider value={dispatch}>
        <FilterBar hashtagId={null} departmentId={null} />
      </LiveBoardFilterContext.Provider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Hashtag" }));
    const option = await screen.findByRole("option", { name: "#Teamwork" });
    fireEvent.click(option);
    expect(dispatch).toHaveBeenCalledWith({ type: "setHashtag", id: 2 });
  });

  it("dispatches setDepartment with the picked id", async () => {
    const dispatch = vi.fn<(a: LiveBoardFilterAction) => void>();
    render(
      <LiveBoardFilterContext.Provider value={dispatch}>
        <FilterBar hashtagId={null} departmentId={null} />
      </LiveBoardFilterContext.Provider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Phòng ban" }));
    const option = await screen.findByRole("option", { name: "DSV - FE 1" });
    fireEvent.click(option);
    expect(dispatch).toHaveBeenCalledWith({ type: "setDepartment", id: 12 });
  });

  it("re-picking the active hashtag clears it (onChange null → setHashtag null)", async () => {
    const dispatch = vi.fn<(a: LiveBoardFilterAction) => void>();
    render(
      <LiveBoardFilterContext.Provider value={dispatch}>
        <FilterBar hashtagId={1} departmentId={null} />
      </LiveBoardFilterContext.Provider>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Hashtag" }));
    const option = await screen.findByRole("option", { name: "#Dedicated" });
    fireEvent.click(option);
    expect(dispatch).toHaveBeenCalledWith({ type: "setHashtag", id: null });
  });
});
