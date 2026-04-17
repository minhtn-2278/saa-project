import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fireEvent, render, screen, act } from "@testing-library/react";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => {
    const t: Record<string, string> = {
      menuAriaLabel: "Danh mục giải thưởng",
      "homepage.awards.topTalent.name": "Top Talent",
      "homepage.awards.topProject.name": "Top Project",
      "homepage.awards.topProjectLeader.name": "Top Project Leader",
      "homepage.awards.bestManager.name": "Best Manager",
      "homepage.awards.signature2025.name": "Signature 2025 - Creator",
      "homepage.awards.mvp.name": "MVP (Most Valuable Person)",
    };
    return t[key] ?? key;
  },
}));

// Capture observer callbacks + observed elements so tests can drive IO manually.
type IOEntryShape = { target: Element; isIntersecting: boolean };
let observerCallbacks: Array<(entries: IOEntryShape[]) => void> = [];

class TestIntersectionObserver {
  constructor(cb: IntersectionObserverCallback) {
    observerCallbacks.push(cb as unknown as (e: IOEntryShape[]) => void);
  }
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}

beforeEach(() => {
  observerCallbacks = [];
  globalThis.IntersectionObserver =
    TestIntersectionObserver as unknown as typeof IntersectionObserver;

  // Default: no reduced motion
  window.matchMedia = vi.fn().mockImplementation((q: string) => ({
    matches: false,
    media: q,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })) as unknown as typeof window.matchMedia;

  // Mock scrollIntoView on all elements
  Element.prototype.scrollIntoView = vi.fn();
});

afterEach(() => {
  vi.useRealTimers();
});

const { AwardsMenu } = await import("@/components/awards/AwardsMenu");

const items = [
  { slug: "top-talent", nameKey: "homepage.awards.topTalent.name" },
  { slug: "top-project", nameKey: "homepage.awards.topProject.name" },
  { slug: "mvp", nameKey: "homepage.awards.mvp.name" },
];

function mountCards() {
  // Mount fake anchor targets so scrollIntoView finds them
  items.forEach((i) => {
    const el = document.createElement("section");
    el.id = i.slug;
    document.body.appendChild(el);
  });
  return () =>
    items.forEach((i) => {
      const el = document.getElementById(i.slug);
      el?.remove();
    });
}

describe("AwardsMenu", () => {
  it("renders a nav with the provided aria-label and 6 links", () => {
    render(<AwardsMenu items={items} />);
    const nav = screen.getByRole("navigation", { name: "Danh mục giải thưởng" });
    expect(nav).toBeInTheDocument();
    expect(screen.getAllByRole("link")).toHaveLength(items.length);
  });

  it("links have href pointing to the slug anchor", () => {
    render(<AwardsMenu items={items} />);
    const link = screen.getByRole("link", { name: /MVP/i });
    expect(link.getAttribute("href")).toBe("#mvp");
  });

  it("click on a menu item calls scrollIntoView on the target card and updates history hash", () => {
    const cleanup = mountCards();
    const replaceSpy = vi.spyOn(history, "replaceState");

    render(<AwardsMenu items={items} />);
    const link = screen.getByRole("link", { name: /MVP/i });
    fireEvent.click(link);

    const target = document.getElementById("mvp");
    expect(
      (target!.scrollIntoView as unknown as ReturnType<typeof vi.fn>).mock.calls
        .length
    ).toBe(1);
    expect(replaceSpy).toHaveBeenCalledWith(null, "", "#mvp");

    cleanup();
    replaceSpy.mockRestore();
  });

  it("uses behavior: 'auto' when prefers-reduced-motion is reduce", () => {
    window.matchMedia = vi.fn().mockImplementation((q: string) => ({
      matches: q.includes("reduce"),
      media: q,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })) as unknown as typeof window.matchMedia;
    const cleanup = mountCards();

    render(<AwardsMenu items={items} />);
    const link = screen.getByRole("link", { name: /Top Talent/i });
    fireEvent.click(link);

    const target = document.getElementById("top-talent");
    const scrollMock =
      target!.scrollIntoView as unknown as ReturnType<typeof vi.fn>;
    expect(scrollMock).toHaveBeenCalled();
    expect(scrollMock.mock.calls[0][0]).toMatchObject({ behavior: "auto" });

    cleanup();
  });

  it("scroll-spy activates the menu item matching the in-view card", () => {
    const cleanup = mountCards();
    render(<AwardsMenu items={items} />);

    act(() => {
      const target = document.getElementById("top-project")!;
      observerCallbacks.forEach((cb) =>
        cb([{ target, isIntersecting: true }])
      );
    });

    const link = screen.getByRole("link", { name: /Top Project(?! Leader)/i });
    expect(link.getAttribute("aria-current")).toBe("true");

    cleanup();
  });

  it("auto-scrolls to the card matching location.hash on mount", () => {
    const cleanup = mountCards();
    window.history.replaceState(null, "", "#mvp");

    render(<AwardsMenu items={items} />);

    const target = document.getElementById("mvp")!;
    expect(
      (target.scrollIntoView as unknown as ReturnType<typeof vi.fn>).mock.calls
        .length
    ).toBeGreaterThan(0);

    cleanup();
    window.history.replaceState(null, "", "/");
  });

  it("does not activate any item for unknown hash", () => {
    const cleanup = mountCards();
    window.history.replaceState(null, "", "#bogus");

    render(<AwardsMenu items={items} />);

    const activeLinks = screen
      .getAllByRole("link")
      .filter((l) => l.getAttribute("aria-current") === "true");
    expect(activeLinks).toHaveLength(0);

    cleanup();
    window.history.replaceState(null, "", "/");
  });
});
