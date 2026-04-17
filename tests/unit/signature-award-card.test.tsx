import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next-intl", () => ({
  useTranslations: (namespace?: string) => (key: string) => {
    const t: Record<string, string> = {
      "homepage.awards.signature2025.name": "Signature 2025 - Creator",
      "awardsPage.signature2025.description":
        "Giải thưởng Signature 2025 – Creator...",
      "awardsPage.quantityLabel": "Số lượng giải thưởng:",
      "awardsPage.valueLabel": "Giá trị giải thưởng:",
      "awardsPage.perAward": "cho mỗi giải thưởng",
      "awardsPage.or": "hoặc",
      "awardsPage.units.ca_nhan_hoac_tap_the": "Cá nhân hoặc tập thể",
      "awardsPage.signature.forIndividual": "cho giải cá nhân",
      "awardsPage.signature.forGroup": "cho giải tập thể",
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

const { SignatureAwardCard } = await import(
  "@/components/awards/SignatureAwardCard"
);

const signatureAward = {
  slug: "signature-2025" as const,
  displayOrder: 5 as const,
  layout: "image-left" as const,
  imageUrl: "/images/awards/signature-2025.png",
  nameKey: "homepage.awards.signature2025.name",
  descriptionKey: "awardsPage.signature2025.description",
  quantity: 1,
  unit: "ca_nhan_hoac_tap_the" as const,
  valueTiers: [
    { valueVnd: 5_000_000, labelKey: "awardsPage.signature.forIndividual" },
    { valueVnd: 8_000_000, labelKey: "awardsPage.signature.forGroup" },
  ] as const,
};

describe("SignatureAwardCard", () => {
  it("renders a single quantity row with 'Cá nhân hoặc tập thể' unit", () => {
    render(<SignatureAwardCard award={signatureAward} locale="vi" />);
    expect(screen.getByText("Cá nhân hoặc tập thể")).toBeInTheDocument();
    // Only ONE quantity row: the digit "01" appears exactly once
    expect(screen.getAllByText("01")).toHaveLength(1);
  });

  it("renders two value rows with locale-formatted VND (5M and 8M)", () => {
    render(<SignatureAwardCard award={signatureAward} locale="vi" />);
    expect(screen.getByText("5.000.000 VNĐ")).toBeInTheDocument();
    expect(screen.getByText("8.000.000 VNĐ")).toBeInTheDocument();
  });

  it("renders both per-tier suffix labels (cho giải cá nhân / tập thể)", () => {
    render(<SignatureAwardCard award={signatureAward} locale="vi" />);
    expect(screen.getByText("cho giải cá nhân")).toBeInTheDocument();
    expect(screen.getByText("cho giải tập thể")).toBeInTheDocument();
  });

  it("does not render 'cho mỗi giải thưởng' (signature overrides suffix)", () => {
    render(<SignatureAwardCard award={signatureAward} locale="vi" />);
    expect(screen.queryByText("cho mỗi giải thưởng")).toBeNull();
  });

  it("renders a quantity-value divider <hr>", () => {
    const { container } = render(
      <SignatureAwardCard award={signatureAward} locale="vi" />
    );
    expect(
      container.querySelector('hr[data-testid="quantity-value-divider"]')
    ).not.toBeNull();
  });

  it("renders a labeled 'hoặc' separator between the two value tiers", () => {
    const { container } = render(
      <SignatureAwardCard award={signatureAward} locale="vi" />
    );
    const separator = container.querySelector('[role="separator"]');
    expect(separator).not.toBeNull();
    expect(separator!.textContent).toContain("hoặc");
    // Word is first: before the <hr>
    const children = Array.from(separator!.children);
    expect(children[0].tagName.toLowerCase()).toBe("span");
    expect(children[0].textContent).toBe("hoặc");
    expect(children[1].tagName.toLowerCase()).toBe("hr");
  });
});
