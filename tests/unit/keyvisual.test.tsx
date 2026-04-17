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

vi.mock("next/image", () => ({
  default: (props: Record<string, unknown>) => {
    const { fill, priority, sizes, ...rest } = props;
    return <img {...rest} data-priority={priority ? "true" : undefined} />;
  },
}));

const { Keyvisual } = await import("@/components/awards/Keyvisual");

describe("Keyvisual", () => {
  it("renders decorative images with empty alt text", () => {
    const { container } = render(<Keyvisual />);
    const imgs = container.querySelectorAll("img");
    expect(imgs.length).toBeGreaterThanOrEqual(2);
    imgs.forEach((img) => {
      expect(img.getAttribute("alt")).toBe("");
    });
  });

  it("marks both decorative images aria-hidden", () => {
    const { container } = render(<Keyvisual />);
    const hidden = container.querySelectorAll('[aria-hidden="true"]');
    expect(hidden.length).toBeGreaterThanOrEqual(2);
  });

  it("has priority loading on LCP images (background splash + ROOT FURTHER logo)", () => {
    const { container } = render(<Keyvisual />);
    const priorityImgs = container.querySelectorAll('[data-priority="true"]');
    expect(priorityImgs.length).toBeGreaterThanOrEqual(2);
  });

  it("renders a bottom-fading gradient overlay", () => {
    const { container } = render(<Keyvisual />);
    const overlay = container.querySelector(
      "[data-testid='keyvisual-overlay']"
    );
    expect(overlay).not.toBeNull();
  });

  it("renders the AwardsTitle block (eyebrow + title) inside the keyvisual", () => {
    render(<Keyvisual />);
    expect(screen.getByText("Sun* Annual Awards 2025")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Hệ thống giải thưởng SAA 2025"
    );
  });
});
