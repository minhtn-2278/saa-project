import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => {
    const t: Record<string, string> = {
      eyebrow: "Sun* Annual Awards 2025",
      title: "Hệ thống giải thưởng SAA 2025",
    };
    return t[key] ?? key;
  },
}));

const { AwardsTitle } = await import("@/components/awards/AwardsTitle");

describe("AwardsTitle", () => {
  it("renders the eyebrow text", () => {
    render(<AwardsTitle />);
    expect(screen.getByText("Sun* Annual Awards 2025")).toBeInTheDocument();
  });

  it("renders the main heading as an h1", () => {
    render(<AwardsTitle />);
    const h1 = screen.getByRole("heading", { level: 1 });
    expect(h1).toHaveTextContent("Hệ thống giải thưởng SAA 2025");
  });

  it("renders a divider", () => {
    const { container } = render(<AwardsTitle />);
    expect(container.querySelector("hr")).not.toBeNull();
  });
});
