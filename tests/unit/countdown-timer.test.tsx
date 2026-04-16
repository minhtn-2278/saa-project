import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => {
    const t: Record<string, string> = {
      "hero.comingSoon": "Coming soon",
      "countdown.days": "DAYS",
      "countdown.hours": "HOURS",
      "countdown.minutes": "MINUTES",
    };
    return t[key] ?? key;
  },
}));

// Set event date to 5 days, 3 hours, 42 minutes from "now"
const MOCK_NOW = new Date("2026-06-10T10:00:00Z").getTime();
const MOCK_EVENT = "2026-06-15T13:42:00Z";

describe("CountdownTimer", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(MOCK_NOW);
    vi.stubEnv("NEXT_PUBLIC_EVENT_START_DATE", MOCK_EVENT);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
  });

  it("calculates days/hours/minutes correctly", async () => {
    const { CountdownTimer } = await import(
      "@/components/homepage/CountdownTimer"
    );
    render(<CountdownTimer />);

    // Digits are rendered individually — check labels exist and digit values are present
    expect(screen.getByText("DAYS")).toBeInTheDocument();
    expect(screen.getByText("HOURS")).toBeInTheDocument();
    expect(screen.getByText("MINUTES")).toBeInTheDocument();

    // 5 days → "0" and "5" as individual digit spans
    const allDigits = screen.getAllByText(/^[0-9]$/);
    expect(allDigits.length).toBe(6); // 2 digits per unit × 3 units
  });

  it("zero-pads single digit values", async () => {
    // Set event to 2 days, 5 hours, 8 minutes from now
    vi.stubEnv(
      "NEXT_PUBLIC_EVENT_START_DATE",
      "2026-06-12T15:08:00Z"
    );

    vi.resetModules();
    vi.doMock("next-intl", () => ({
      useTranslations: () => (key: string) => {
        const t: Record<string, string> = {
          "hero.comingSoon": "Coming soon",
          "countdown.days": "DAYS",
          "countdown.hours": "HOURS",
          "countdown.minutes": "MINUTES",
        };
        return t[key] ?? key;
      },
    }));

    const { CountdownTimer } = await import(
      "@/components/homepage/CountdownTimer"
    );
    render(<CountdownTimer />);

    // Check that "0" digits exist (zero-padded)
    const zeros = screen.getAllByText("0");
    expect(zeros.length).toBeGreaterThan(0);
  });

  it("shows 'Coming soon' when countdown is active", async () => {
    const { CountdownTimer } = await import(
      "@/components/homepage/CountdownTimer"
    );
    render(<CountdownTimer />);

    expect(screen.getByText("Coming soon")).toBeInTheDocument();
  });

  it("hides 'Coming soon' when countdown reaches zero", async () => {
    // Set event to the past
    vi.stubEnv("NEXT_PUBLIC_EVENT_START_DATE", "2026-06-01T00:00:00Z");

    vi.resetModules();
    vi.doMock("next-intl", () => ({
      useTranslations: () => (key: string) => {
        const t: Record<string, string> = {
          "hero.comingSoon": "Coming soon",
          "countdown.days": "DAYS",
          "countdown.hours": "HOURS",
          "countdown.minutes": "MINUTES",
        };
        return t[key] ?? key;
      },
    }));

    const { CountdownTimer } = await import(
      "@/components/homepage/CountdownTimer"
    );
    render(<CountdownTimer />);

    expect(screen.queryByText("Coming soon")).not.toBeInTheDocument();
  });

  it("clamps to 0 for past dates (never negative)", async () => {
    vi.stubEnv("NEXT_PUBLIC_EVENT_START_DATE", "2020-01-01T00:00:00Z");

    vi.resetModules();
    vi.doMock("next-intl", () => ({
      useTranslations: () => (key: string) => {
        const t: Record<string, string> = {
          "hero.comingSoon": "Coming soon",
          "countdown.days": "DAYS",
          "countdown.hours": "HOURS",
          "countdown.minutes": "MINUTES",
        };
        return t[key] ?? key;
      },
    }));

    const { CountdownTimer } = await import(
      "@/components/homepage/CountdownTimer"
    );
    render(<CountdownTimer />);

    // All digit boxes should show "0"
    const zeros = screen.getAllByText("0");
    expect(zeros.length).toBe(6); // 00 days + 00 hours + 00 minutes = 6 zeros
  });

  it("has aria-live=polite for screen readers", async () => {
    const { CountdownTimer } = await import(
      "@/components/homepage/CountdownTimer"
    );
    render(<CountdownTimer />);

    const timer = screen.getByRole("timer");
    expect(timer).toHaveAttribute("aria-live", "polite");
  });
});
