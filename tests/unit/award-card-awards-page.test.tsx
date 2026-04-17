import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next-intl", () => ({
  useTranslations: (namespace?: string) => (key: string) => {
    const t: Record<string, string> = {
      "homepage.awards.topTalent.name": "Top Talent",
      "awardsPage.topTalent.description":
        "Giải thưởng Top Talent vinh danh những cá nhân xuất sắc...",
      "awardsPage.quantityLabel": "Số lượng giải thưởng:",
      "awardsPage.valueLabel": "Giá trị giải thưởng:",
      "awardsPage.perAward": "cho mỗi giải thưởng",
      "awardsPage.or": "hoặc",
      "awardsPage.units.don_vi": "Đơn vị",
    };
    const prefix = namespace ? `${namespace}.` : "";
    return t[prefix + key] ?? t[key] ?? key;
  },
}));

vi.mock("next/image", () => ({
  default: (props: Record<string, unknown>) => {
    const { fill, priority, sizes, onError, ...rest } = props;
    return <img {...rest} />;
  },
}));

const { AwardCard } = await import("@/components/awards/AwardCard");

const mockAward = {
  slug: "top-talent" as const,
  displayOrder: 1 as const,
  layout: "image-left" as const,
  imageUrl: "/images/awards/top-talent.png",
  nameKey: "homepage.awards.topTalent.name",
  descriptionKey: "awardsPage.topTalent.description",
  quantity: 10,
  unit: "don_vi" as const,
  valueTiers: [{ valueVnd: 7_000_000 }] as const,
};

describe("AwardCard (awards page variant)", () => {
  it("renders image-left layout with lg:flex-row", () => {
    const { container } = render(
      <AwardCard award={mockAward} locale="vi" isFirst />
    );
    const card = container.firstElementChild as HTMLElement;
    expect(card.className).toContain("lg:flex-row");
    expect(card.className).not.toContain("lg:flex-row-reverse");
  });

  it("renders image-right layout with lg:flex-row-reverse", () => {
    const { container } = render(
      <AwardCard
        award={{ ...mockAward, layout: "image-right" }}
        locale="vi"
      />
    );
    const card = container.firstElementChild as HTMLElement;
    expect(card.className).toContain("lg:flex-row-reverse");
  });

  it("renders title as an h2 with Latin brand name", () => {
    render(<AwardCard award={mockAward} locale="vi" />);
    const h2 = screen.getByRole("heading", { level: 2 });
    expect(h2).toHaveTextContent("Top Talent");
  });

  it("renders an icon (svg) before the award name", () => {
    const { container } = render(<AwardCard award={mockAward} locale="vi" />);
    const h2 = container.querySelector("h2")!;
    const headerRow = h2.parentElement as HTMLElement;
    const svg = headerRow.querySelector("svg");
    expect(svg).not.toBeNull();
    // Icon appears before the heading text in DOM order
    expect(headerRow.firstElementChild?.tagName.toLowerCase()).toBe("svg");
  });

  it("renders the full description (no line-clamp/truncate — FR-013)", () => {
    const { container } = render(<AwardCard award={mockAward} locale="vi" />);
    expect(container.innerHTML).not.toContain("line-clamp");
    expect(container.innerHTML).not.toContain("truncate");
    expect(
      screen.getByText(/Giải thưởng Top Talent vinh danh/)
    ).toBeInTheDocument();
  });

  it("renders metadata inside a <dl>", () => {
    const { container } = render(<AwardCard award={mockAward} locale="vi" />);
    expect(container.querySelector("dl")).not.toBeNull();
  });

  it("renders a divider <hr> between quantity and value rows", () => {
    const { container } = render(<AwardCard award={mockAward} locale="vi" />);
    const divider = container.querySelector(
      'hr[data-testid="quantity-value-divider"]'
    );
    expect(divider).not.toBeNull();
  });

  it("single-tier awards do not render the 'hoặc' separator", () => {
    render(<AwardCard award={mockAward} locale="vi" />);
    expect(screen.queryByText("hoặc")).toBeNull();
  });

  it("has an id matching the slug for anchor scroll", () => {
    const { container } = render(<AwardCard award={mockAward} locale="vi" />);
    const card = container.firstElementChild as HTMLElement;
    expect(card.id).toBe("top-talent");
  });

  it("applies bottom divider class", () => {
    const { container } = render(<AwardCard award={mockAward} locale="vi" />);
    const card = container.firstElementChild as HTMLElement;
    expect(card.className).toContain("border-b");
    expect(card.className).toContain("#2E3940");
  });

  it("keeps DOM order image → content regardless of visual layout (a11y)", () => {
    const { container } = render(
      <AwardCard
        award={{ ...mockAward, layout: "image-right" }}
        locale="vi"
      />
    );
    const card = container.firstElementChild as HTMLElement;
    const children = Array.from(card.children);
    // First child is the image wrapper, second is the content
    expect(children[0].querySelector("img")).not.toBeNull();
  });
});
