import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { NextRequest } from "next/server";
import { evaluatePrelaunchGate } from "@/lib/utils/prelaunch-gate";

function makeRequest(options: {
  pathname: string;
  header?: string;
  cookie?: string;
}): NextRequest {
  const headers = new Headers();
  if (options.header !== undefined) {
    headers.set("x-prelaunch-bypass", options.header);
  }
  const cookies = new Map<string, { value: string }>();
  if (options.cookie !== undefined) {
    cookies.set("prelaunch_bypass", { value: options.cookie });
  }
  return {
    headers,
    cookies: {
      get: (name: string) => cookies.get(name),
    },
    nextUrl: { pathname: options.pathname },
  } as unknown as NextRequest;
}

const FUTURE = "2099-01-01T00:00:00+00:00";
const PAST = "2000-01-01T00:00:00+00:00";

describe("evaluatePrelaunchGate", () => {
  beforeEach(() => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "info").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("past launch date → pass", () => {
    vi.stubEnv("NEXT_PUBLIC_LAUNCH_DATE", PAST);
    expect(evaluatePrelaunchGate(makeRequest({ pathname: "/" }))).toEqual({ type: "pass" });
  });

  it("missing env → pass (fail-open)", () => {
    vi.stubEnv("NEXT_PUBLIC_LAUNCH_DATE", "");
    expect(evaluatePrelaunchGate(makeRequest({ pathname: "/" }))).toEqual({ type: "pass" });
  });

  it("invalid env → pass (fail-open)", () => {
    vi.stubEnv("NEXT_PUBLIC_LAUNCH_DATE", "not-a-date");
    expect(evaluatePrelaunchGate(makeRequest({ pathname: "/" }))).toEqual({ type: "pass" });
  });

  it("page path during gate → rewrite", () => {
    vi.stubEnv("NEXT_PUBLIC_LAUNCH_DATE", FUTURE);
    expect(evaluatePrelaunchGate(makeRequest({ pathname: "/login" }))).toEqual({ type: "rewrite" });
  });

  it("homepage path during gate → rewrite", () => {
    vi.stubEnv("NEXT_PUBLIC_LAUNCH_DATE", FUTURE);
    expect(evaluatePrelaunchGate(makeRequest({ pathname: "/" }))).toEqual({ type: "rewrite" });
  });

  it("/countdown self-request during gate → pass (no loop)", () => {
    vi.stubEnv("NEXT_PUBLIC_LAUNCH_DATE", FUTURE);
    expect(evaluatePrelaunchGate(makeRequest({ pathname: "/countdown" }))).toEqual({ type: "pass" });
  });

  it("/api/* request during gate → apiBlock with retryAfterSeconds > 0", () => {
    vi.stubEnv("NEXT_PUBLIC_LAUNCH_DATE", FUTURE);
    const decision = evaluatePrelaunchGate(
      makeRequest({ pathname: "/api/auth/callback" })
    );
    expect(decision.type).toBe("apiBlock");
    if (decision.type === "apiBlock") {
      expect(decision.retryAfterSeconds).toBeGreaterThan(0);
    }
  });

  it("valid bypass header on /api/* during gate → pass (bypass wins over apiBlock)", () => {
    vi.stubEnv("NEXT_PUBLIC_LAUNCH_DATE", FUTURE);
    vi.stubEnv("PRELAUNCH_BYPASS_TOKEN", "secret");
    expect(
      evaluatePrelaunchGate(
        makeRequest({ pathname: "/api/auth/callback", header: "secret" })
      )
    ).toEqual({ type: "pass" });
  });

  it("bypass cookie on /api/* during gate → pass (bypass wins over apiBlock)", () => {
    vi.stubEnv("NEXT_PUBLIC_LAUNCH_DATE", FUTURE);
    expect(
      evaluatePrelaunchGate(
        makeRequest({ pathname: "/api/auth/callback", cookie: "1" })
      )
    ).toEqual({ type: "pass" });
  });

  it("valid bypass header during gate → pass", () => {
    vi.stubEnv("NEXT_PUBLIC_LAUNCH_DATE", FUTURE);
    vi.stubEnv("PRELAUNCH_BYPASS_TOKEN", "secret-value");
    expect(
      evaluatePrelaunchGate(makeRequest({ pathname: "/", header: "secret-value" }))
    ).toEqual({ type: "pass" });
  });

  it("invalid bypass header during gate → rewrite", () => {
    vi.stubEnv("NEXT_PUBLIC_LAUNCH_DATE", FUTURE);
    vi.stubEnv("PRELAUNCH_BYPASS_TOKEN", "secret-value");
    expect(
      evaluatePrelaunchGate(makeRequest({ pathname: "/", header: "wrong-value" }))
    ).toEqual({ type: "rewrite" });
  });

  it("missing bypass header during gate → rewrite", () => {
    vi.stubEnv("NEXT_PUBLIC_LAUNCH_DATE", FUTURE);
    vi.stubEnv("PRELAUNCH_BYPASS_TOKEN", "secret-value");
    expect(evaluatePrelaunchGate(makeRequest({ pathname: "/" }))).toEqual({ type: "rewrite" });
  });

  it("prelaunch_bypass=1 cookie during gate → pass", () => {
    vi.stubEnv("NEXT_PUBLIC_LAUNCH_DATE", FUTURE);
    expect(
      evaluatePrelaunchGate(makeRequest({ pathname: "/", cookie: "1" }))
    ).toEqual({ type: "pass" });
  });

  it("cookie with other value during gate → rewrite", () => {
    vi.stubEnv("NEXT_PUBLIC_LAUNCH_DATE", FUTURE);
    expect(
      evaluatePrelaunchGate(makeRequest({ pathname: "/", cookie: "0" }))
    ).toEqual({ type: "rewrite" });
  });

  it("bypass token compare tolerates length mismatch without crashing", () => {
    vi.stubEnv("NEXT_PUBLIC_LAUNCH_DATE", FUTURE);
    vi.stubEnv("PRELAUNCH_BYPASS_TOKEN", "short");
    expect(
      evaluatePrelaunchGate(
        makeRequest({ pathname: "/", header: "a-much-longer-incorrect-value" })
      )
    ).toEqual({ type: "rewrite" });
  });
});
