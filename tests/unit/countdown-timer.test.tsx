import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { CountdownTimer } from "@/components/shared/CountdownTimer";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => {
    const t: Record<string, string> = {
      days: "DAYS",
      hours: "HOURS",
      minutes: "MINUTES",
    };
    return t[key] ?? key;
  },
}));

const MOCK_NOW = new Date("2026-06-10T10:00:00Z");
const fixedClock = () => MOCK_NOW;

describe("CountdownTimer (shared)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(MOCK_NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders 3 unit blocks with labels at size='sm'", () => {
    render(
      <CountdownTimer
        targetDate="2026-06-15T13:42:00Z"
        size="sm"
        clock={fixedClock}
      />
    );

    expect(screen.getByText("DAYS")).toBeInTheDocument();
    expect(screen.getByText("HOURS")).toBeInTheDocument();
    expect(screen.getByText("MINUTES")).toBeInTheDocument();
  });

  it("renders 6 digit cells (2 per unit)", () => {
    render(
      <CountdownTimer
        targetDate="2026-06-15T13:42:00Z"
        size="sm"
        clock={fixedClock}
      />
    );

    const digits = screen.getAllByText(/^[0-9]$/);
    expect(digits.length).toBe(6);
  });

  it("zero-pads single-digit values", () => {
    // 2 days, 5 hours, 8 minutes from MOCK_NOW
    render(
      <CountdownTimer
        targetDate="2026-06-12T15:08:00Z"
        size="sm"
        clock={fixedClock}
      />
    );

    const zeros = screen.getAllByText("0");
    expect(zeros.length).toBeGreaterThan(0);
  });

  it("FR-009: displays '00' when a unit has zero remaining", () => {
    // Same day, 30 minutes ahead — days=0, hours=0
    const sameDayNow = new Date("2026-06-10T10:00:00Z");
    render(
      <CountdownTimer
        targetDate="2026-06-10T10:30:00Z"
        size="lg"
        clock={() => sameDayNow}
      />
    );

    // Days "00" and hours "00" both render as "0" digit cells
    const zeros = screen.getAllByText("0");
    expect(zeros.length).toBeGreaterThanOrEqual(4);
  });

  it("FR-010: clamps days to 99 when remaining exceeds 99 days", () => {
    // 200 days from now
    const farFuture = new Date(MOCK_NOW.getTime() + 200 * 86_400_000).toISOString();
    render(
      <CountdownTimer targetDate={farFuture} size="lg" clock={fixedClock} />
    );

    // Days digits should be "9" and "9"
    const nines = screen.getAllByText("9");
    expect(nines.length).toBeGreaterThanOrEqual(2);
  });

  it("clamps to 00/00/00 for past dates", () => {
    render(
      <CountdownTimer
        targetDate="2020-01-01T00:00:00Z"
        size="sm"
        clock={fixedClock}
      />
    );

    const zeros = screen.getAllByText("0");
    expect(zeros.length).toBe(6);
  });

  it("exposes role='timer' with aria-live='polite'", () => {
    render(
      <CountdownTimer
        targetDate="2026-06-15T13:42:00Z"
        size="sm"
        clock={fixedClock}
      />
    );

    const timer = screen.getByRole("timer");
    expect(timer).toHaveAttribute("aria-live", "polite");
  });

  it("renders optional title above the time row", () => {
    render(
      <CountdownTimer
        targetDate="2026-06-15T13:42:00Z"
        size="lg"
        title="Sự kiện sẽ bắt đầu sau"
        clock={fixedClock}
      />
    );

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Sự kiện sẽ bắt đầu sau"
    );
  });

  it("fires onExpire once when remaining reaches zero", () => {
    const onExpire = vi.fn();
    const pastNow = new Date("2026-06-16T00:00:00Z");
    render(
      <CountdownTimer
        targetDate="2026-06-15T13:42:00Z"
        size="lg"
        clock={() => pastNow}
        onExpire={onExpire}
      />
    );

    expect(onExpire).toHaveBeenCalledTimes(1);
  });
});
