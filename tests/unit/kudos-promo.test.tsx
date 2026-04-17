import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => {
    const t: Record<string, string> = {
      "kudos.eyebrow": "Phong trào ghi nhận",
      "kudos.title": "Sun* Kudos",
      "kudos.description": "Mô tả Sun* Kudos...",
      "kudos.cta": "Chi tiết",
    };
    return t[key] ?? key;
  },
}));

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
    [k: string]: unknown;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

const { KudosPromo } = await import("@/components/awards/KudosPromo");

describe("KudosPromo", () => {
  it("renders the eyebrow", () => {
    render(<KudosPromo />);
    expect(screen.getByText("Phong trào ghi nhận")).toBeInTheDocument();
  });

  it("renders the title as h2", () => {
    render(<KudosPromo />);
    const h2 = screen.getByRole("heading", { level: 2 });
    expect(h2).toHaveTextContent("Sun* Kudos");
  });

  it("renders the description", () => {
    render(<KudosPromo />);
    expect(screen.getByText(/Mô tả Sun\* Kudos/)).toBeInTheDocument();
  });

  it("renders a KUDOS decorative logotype", () => {
    render(<KudosPromo />);
    expect(screen.getByText("KUDOS")).toBeInTheDocument();
  });

  it("renders a CTA link pointing to /kudos", () => {
    render(<KudosPromo />);
    const cta = screen.getByRole("link", { name: /Chi tiết/i });
    expect(cta.getAttribute("href")).toBe("/kudos");
  });

  it("CTA has gold focus ring styling", () => {
    render(<KudosPromo />);
    const cta = screen.getByRole("link", { name: /Chi tiết/i });
    expect(cta.className).toContain("focus:outline-");
    expect(cta.className).toContain("[#FFEA9E]");
  });
});
