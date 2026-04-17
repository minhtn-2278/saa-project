import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getLaunchConfig } from "@/lib/validations/launch-config";

describe("getLaunchConfig", () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
    vi.unstubAllEnvs();
  });

  it("returns parsed Date for valid ISO 8601 with offset", () => {
    vi.stubEnv("NEXT_PUBLIC_LAUNCH_DATE", "2026-05-01T09:00:00+07:00");

    const result = getLaunchConfig();

    expect(result).not.toBeNull();
    expect(result?.launchDate).toBeInstanceOf(Date);
    expect(result?.launchDate.toISOString()).toBe("2026-05-01T02:00:00.000Z");
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it("returns null and warns when env var is missing", () => {
    vi.stubEnv("NEXT_PUBLIC_LAUNCH_DATE", "");

    const result = getLaunchConfig();

    expect(result).toBeNull();
    expect(warnSpy).toHaveBeenCalledOnce();
  });

  it("returns null and warns when value is not a valid ISO string", () => {
    vi.stubEnv("NEXT_PUBLIC_LAUNCH_DATE", "not-a-date");

    const result = getLaunchConfig();

    expect(result).toBeNull();
    expect(warnSpy).toHaveBeenCalledOnce();
  });

  it("rejects ISO string without timezone offset", () => {
    vi.stubEnv("NEXT_PUBLIC_LAUNCH_DATE", "2026-05-01T09:00:00");

    const result = getLaunchConfig();

    expect(result).toBeNull();
    expect(warnSpy).toHaveBeenCalledOnce();
  });

  it("does not log the raw env value in the warning", () => {
    const rawValue = "obviously-invalid-sentinel-xyz";
    vi.stubEnv("NEXT_PUBLIC_LAUNCH_DATE", rawValue);

    getLaunchConfig();

    for (const call of warnSpy.mock.calls) {
      for (const arg of call) {
        expect(String(arg)).not.toContain(rawValue);
      }
    }
  });
});
