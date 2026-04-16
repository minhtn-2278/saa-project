import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => {
    const t: Record<string, string> = {
      detail: "Chi tiết",
      "topTalent.name": "Top Talent",
      "topTalent.description":
        "Vinh danh top cá nhân xuất sắc trên mọi phương diện",
    };
    return t[key] ?? key;
  },
}));

vi.mock("next/image", () => ({
  default: (props: Record<string, unknown>) => {
    const { fill, priority, sizes, ...rest } = props;
    return <img {...rest} />;
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
    [key: string]: unknown;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

const { AwardCard } = await import("@/components/homepage/AwardCard");

const mockAward = {
  id: "1",
  slug: "top-talent",
  i18nKey: "topTalent",
  thumbnailUrl: "/images/awards/top-talent.png",
};

describe("AwardCard", () => {
  it("renders thumbnail image with alt text", () => {
    render(<AwardCard award={mockAward} />);

    const img = screen.getByAltText("Top Talent");
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("src", "/images/awards/top-talent.png");
  });

  it("renders award title from i18n", () => {
    render(<AwardCard award={mockAward} />);

    expect(screen.getByText("Top Talent")).toBeInTheDocument();
  });

  it("renders award description from i18n", () => {
    render(<AwardCard award={mockAward} />);

    expect(
      screen.getByText(
        "Vinh danh top cá nhân xuất sắc trên mọi phương diện"
      )
    ).toBeInTheDocument();
  });

  it("renders detail link text", () => {
    render(<AwardCard award={mockAward} />);

    expect(screen.getByText("Chi tiết")).toBeInTheDocument();
  });

  it("links to /awards#slug", () => {
    render(<AwardCard award={mockAward} />);

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/awards#top-talent");
  });

  it("has line-clamp-2 class for description truncation", () => {
    render(<AwardCard award={mockAward} />);

    const desc = screen.getByText(
      "Vinh danh top cá nhân xuất sắc trên mọi phương diện"
    );
    expect(desc.className).toContain("line-clamp-2");
  });

  it("has hover transform class for elevation effect", () => {
    render(<AwardCard award={mockAward} />);

    const link = screen.getByRole("link");
    expect(link.className).toContain("hover:-translate-y-1");
  });

  it("has focus outline for accessibility", () => {
    render(<AwardCard award={mockAward} />);

    const link = screen.getByRole("link");
    expect(link.className).toContain("focus:outline-2");
  });
});
