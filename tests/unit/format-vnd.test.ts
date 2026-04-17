import { describe, it, expect } from "vitest";
import { formatVND, padQuantity } from "@/lib/utils/format";

describe("formatVND", () => {
  it("formats VN locale with period thousand separator and VNĐ suffix", () => {
    expect(formatVND(7_000_000, "vi")).toBe("7.000.000 VNĐ");
    expect(formatVND(15_000_000, "vi")).toBe("15.000.000 VNĐ");
    expect(formatVND(5_000_000, "vi")).toBe("5.000.000 VNĐ");
  });

  it("formats EN locale with comma separator and VND suffix (no diacritic)", () => {
    expect(formatVND(7_000_000, "en")).toBe("7,000,000 VND");
    expect(formatVND(15_000_000, "en")).toBe("15,000,000 VND");
  });

  it("formats JA locale with comma separator and VND suffix", () => {
    expect(formatVND(7_000_000, "ja")).toBe("7,000,000 VND");
    expect(formatVND(8_000_000, "ja")).toBe("8,000,000 VND");
  });

  it("handles zero defensively", () => {
    expect(formatVND(0, "vi")).toBe("0 VNĐ");
  });
});

describe("padQuantity", () => {
  it("zero-pads single-digit numbers to 2 digits", () => {
    expect(padQuantity(1)).toBe("01");
    expect(padQuantity(2)).toBe("02");
    expect(padQuantity(3)).toBe("03");
  });

  it("returns 2+ digit numbers as-is", () => {
    expect(padQuantity(10)).toBe("10");
    expect(padQuantity(100)).toBe("100");
  });
});
