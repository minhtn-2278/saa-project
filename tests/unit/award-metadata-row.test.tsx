import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next-intl", () => ({
  useTranslations: (namespace?: string) => (key: string) => {
    const t: Record<string, string> = {
      "awardsPage.quantityLabel": "Số lượng giải thưởng:",
      "awardsPage.valueLabel": "Giá trị giải thưởng:",
      "awardsPage.perAward": "cho mỗi giải thưởng",
      "awardsPage.units.don_vi": "Đơn vị",
      "awardsPage.units.ca_nhan": "Cá nhân",
      "awardsPage.units.tap_the": "Tập thể",
      "awardsPage.units.ca_nhan_hoac_tap_the": "Cá nhân hoặc tập thể",
      "awardsPage.signature.forIndividual": "cho giải cá nhân",
      "awardsPage.signature.forGroup": "cho giải tập thể",
    };
    const prefix = namespace ? `${namespace}.` : "";
    return t[prefix + key] ?? t[key] ?? key;
  },
}));

const { AwardMetadataRow } = await import(
  "@/components/awards/AwardMetadataRow"
);

describe("AwardMetadataRow", () => {
  it("quantity variant renders label, padded number, and localized unit", () => {
    render(
      <AwardMetadataRow
        variant="quantity"
        quantity={2}
        unit="tap_the"
        locale="vi"
      />
    );
    expect(screen.getByText("Số lượng giải thưởng:")).toBeInTheDocument();
    expect(screen.getByText("02")).toBeInTheDocument();
    expect(screen.getByText("Tập thể")).toBeInTheDocument();
  });

  it("quantity variant supports the combined individual-or-group unit", () => {
    render(
      <AwardMetadataRow
        variant="quantity"
        quantity={1}
        unit="ca_nhan_hoac_tap_the"
        locale="vi"
      />
    );
    expect(screen.getByText("Cá nhân hoặc tập thể")).toBeInTheDocument();
  });

  it("value variant renders label and formatted VND with default per-award suffix", () => {
    render(
      <AwardMetadataRow
        variant="value"
        valueVnd={7_000_000}
        locale="vi"
        perAwardLabelKey="awardsPage.perAward"
      />
    );
    expect(screen.getByText("Giá trị giải thưởng:")).toBeInTheDocument();
    expect(screen.getByText("7.000.000 VNĐ")).toBeInTheDocument();
    expect(screen.getByText("cho mỗi giải thưởng")).toBeInTheDocument();
  });

  it("value variant renders custom suffix via perAwardLabelKey (signature individual)", () => {
    render(
      <AwardMetadataRow
        variant="value"
        valueVnd={5_000_000}
        locale="vi"
        perAwardLabelKey="awardsPage.signature.forIndividual"
      />
    );
    expect(screen.getByText("cho giải cá nhân")).toBeInTheDocument();
  });

  it("value variant renders custom suffix via perAwardLabelKey (signature group)", () => {
    render(
      <AwardMetadataRow
        variant="value"
        valueVnd={8_000_000}
        locale="vi"
        perAwardLabelKey="awardsPage.signature.forGroup"
      />
    );
    expect(screen.getByText("cho giải tập thể")).toBeInTheDocument();
  });

  it("quantity label uses gold color", () => {
    const { container } = render(
      <AwardMetadataRow
        variant="quantity"
        quantity={1}
        unit="ca_nhan"
        locale="vi"
      />
    );
    const label = container.querySelector("dt");
    expect(label).not.toBeNull();
    expect(label!.className).toContain("#FFEA9E");
  });

  it("value label uses gold color", () => {
    const { container } = render(
      <AwardMetadataRow
        variant="value"
        valueVnd={7_000_000}
        locale="vi"
        perAwardLabelKey="awardsPage.perAward"
      />
    );
    const label = container.querySelector("dt");
    expect(label).not.toBeNull();
    expect(label!.className).toContain("#FFEA9E");
  });

  it("value variant in EN formats as 7,000,000 VND", () => {
    render(<AwardMetadataRow variant="value" valueVnd={7_000_000} locale="en" />);
    expect(screen.getByText("7,000,000 VND")).toBeInTheDocument();
  });

  it("does not apply line-clamp / truncate classes (FR-013)", () => {
    const { container } = render(
      <AwardMetadataRow
        variant="quantity"
        quantity={10}
        unit="don_vi"
        locale="vi"
      />
    );
    expect(container.innerHTML).not.toContain("line-clamp");
    expect(container.innerHTML).not.toContain("truncate");
  });

  it("zero-pads single-digit quantities", () => {
    render(
      <AwardMetadataRow
        variant="quantity"
        quantity={3}
        unit="ca_nhan"
        locale="vi"
      />
    );
    expect(screen.getByText("03")).toBeInTheDocument();
  });
});
