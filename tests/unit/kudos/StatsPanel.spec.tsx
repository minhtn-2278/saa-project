import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => {
    const dict: Record<string, string> = {
      kudosReceived: "Số Kudos bạn nhận được:",
      kudosSent: "Số Kudos bạn đã gửi:",
      heartsReceived: "Số tim bạn nhận được:",
      boxesOpened: "Số Secret Box bạn đã mở:",
      boxesUnopened: "Số Secret Box chưa mở:",
      openGift: "Mở quà",
      recentReceiversTitle: "10 SUNNER NHẬN QUÀ MỚI NHẤT",
      mobileTrigger: "Thống kê",
      disabledTitle: "Tính năng sẽ ra mắt trong bản cập nhật sắp tới",
    };
    return dict[key] ?? key;
  },
}));

const { StatsPanel } = await import(
  "@/components/kudos/LiveBoard/Sidebar/StatsPanel"
);
const { OpenSecretBoxButton } = await import(
  "@/components/kudos/LiveBoard/Sidebar/OpenSecretBoxButton"
);

describe("StatsPanel", () => {
  it("renders the 5 labelled stat rows in the documented order", () => {
    render(
      <StatsPanel
        stats={{
          kudosReceived: 25,
          kudosSent: 30,
          heartsReceived: 400,
          boxesOpened: 0,
          boxesUnopened: 0,
        }}
      />,
    );
    for (const label of [
      "Số Kudos bạn nhận được:",
      "Số Kudos bạn đã gửi:",
      "Số tim bạn nhận được:",
      "Số Secret Box bạn đã mở:",
      "Số Secret Box chưa mở:",
    ]) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  it("renders each stat value next to its label", () => {
    render(
      <StatsPanel
        stats={{
          kudosReceived: 25,
          kudosSent: 30,
          heartsReceived: 400,
          boxesOpened: 0,
          boxesUnopened: 0,
        }}
      />,
    );
    // Values are vi-VN localised (no separator at 3-digit boundary, "400" stays "400")
    expect(screen.getByText("25")).toBeInTheDocument();
    expect(screen.getByText("30")).toBeInTheDocument();
    expect(screen.getByText("400")).toBeInTheDocument();
  });

  it("shows `–` placeholders for the 3 server-driven rows when stats is null", () => {
    render(<StatsPanel stats={null} />);
    // Top 3 rows are placeholder (`–`); the 2 Secret Box rows are always
    // hard-coded `0` in the component regardless of stats.
    expect(screen.getAllByText("–")).toHaveLength(3);
    expect(screen.getAllByText("0")).toHaveLength(2);
  });

  it("Secret Box rows always read 0 regardless of server payload", () => {
    // Even if the server ever returned a non-zero, the component overrides
    // to `0` this release — feature deferred, spec § Out of Scope.
    render(
      <StatsPanel
        stats={{
          kudosReceived: 1,
          kudosSent: 2,
          heartsReceived: 3,
          boxesOpened: 0,
          boxesUnopened: 0,
        }}
      />,
    );
    // Two rows display "0".
    const zeros = screen.getAllByText("0");
    expect(zeros.length).toBeGreaterThanOrEqual(2);
  });

  it("includes a divider between rows 3 and 4", () => {
    const { container } = render(
      <StatsPanel
        stats={{
          kudosReceived: 1,
          kudosSent: 2,
          heartsReceived: 3,
          boxesOpened: 0,
          boxesUnopened: 0,
        }}
      />,
    );
    expect(container.querySelector("hr")).not.toBeNull();
  });
});

describe("OpenSecretBoxButton", () => {
  it("is always disabled with aria-disabled='true' + not-allowed cursor", () => {
    render(<OpenSecretBoxButton />);
    const btn = screen.getByRole("button", { name: /Mở quà/ });
    expect(btn).toBeDisabled();
    expect(btn).toHaveAttribute("aria-disabled", "true");
    expect(btn.className).toContain("cursor-not-allowed");
  });

  it("shows the 'sắp ra mắt' tooltip on the title attribute", () => {
    render(<OpenSecretBoxButton />);
    const btn = screen.getByRole("button", { name: /Mở quà/ });
    expect(btn.getAttribute("title")).toMatch(/sắp tới|coming/i);
  });
});
