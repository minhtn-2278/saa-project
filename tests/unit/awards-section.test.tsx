import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next-intl", () => ({
  useTranslations: (namespace?: string) => (key: string) => {
    const t: Record<string, string> = {
      "awardsPage.menuAriaLabel": "Danh mục giải thưởng",
      "awardsPage.quantityLabel": "Số lượng giải thưởng:",
      "awardsPage.valueLabel": "Giá trị giải thưởng:",
      "awardsPage.perAward": "cho mỗi giải thưởng",
      "awardsPage.or": "hoặc",
      "awardsPage.units.don_vi": "Đơn vị",
      "awardsPage.units.ca_nhan": "Cá nhân",
      "awardsPage.units.tap_the": "Tập thể",
      "awardsPage.units.ca_nhan_hoac_tap_the": "Cá nhân hoặc tập thể",
      "awardsPage.signature.forIndividual": "cho giải cá nhân",
      "awardsPage.signature.forGroup": "cho giải tập thể",
      "awardsPage.topTalent.description": "desc Top Talent",
      "awardsPage.topProject.description": "desc Top Project",
      "awardsPage.topProjectLeader.description": "desc Top Project Leader",
      "awardsPage.bestManager.description": "desc Best Manager",
      "awardsPage.signature2025.description": "desc Signature",
      "awardsPage.mvp.description": "desc MVP",
      "homepage.awards.topTalent.name": "Top Talent",
      "homepage.awards.topProject.name": "Top Project",
      "homepage.awards.topProjectLeader.name": "Top Project Leader",
      "homepage.awards.bestManager.name": "Best Manager",
      "homepage.awards.signature2025.name": "Signature 2025 - Creator",
      "homepage.awards.mvp.name": "MVP (Most Valuable Person)",
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

const { AwardsSection } = await import("@/components/awards/AwardsSection");

describe("AwardsSection", () => {
  it("renders the AwardsMenu with 6 items", () => {
    render(<AwardsSection locale="vi" />);
    const nav = screen.getByRole("navigation", {
      name: "Danh mục giải thưởng",
    });
    expect(nav).toBeInTheDocument();
    const links = nav.querySelectorAll("a");
    expect(links).toHaveLength(6);
  });

  it("renders exactly 6 award cards in displayOrder", () => {
    const { container } = render(<AwardsSection locale="vi" />);
    const cards = container.querySelectorAll("article[id]");
    expect(cards).toHaveLength(6);
    const ids = Array.from(cards).map((c) => c.id);
    expect(ids).toEqual([
      "top-talent",
      "top-project",
      "top-project-leader",
      "best-manager",
      "signature-2025",
      "mvp",
    ]);
  });

  it("renders the Signature card with single combined unit and two value suffixes", () => {
    render(<AwardsSection locale="vi" />);
    expect(screen.getByText("Cá nhân hoặc tập thể")).toBeInTheDocument();
    expect(screen.getByText("cho giải cá nhân")).toBeInTheDocument();
    expect(screen.getByText("cho giải tập thể")).toBeInTheDocument();
  });
});
