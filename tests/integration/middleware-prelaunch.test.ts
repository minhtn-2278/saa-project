import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/supabase/middleware", () => ({
  updateSession: vi.fn(async () => ({
    user: null,
    supabaseResponse: new Response("supabase-response", {
      headers: { "x-supabase-handled": "1" },
    }),
  })),
}));

async function runMiddleware(request: NextRequest) {
  const { middleware } = await import("@/middleware");
  return middleware(request);
}

function makeRequest(options: {
  pathname: string;
  header?: Record<string, string>;
  cookie?: Record<string, string>;
}): NextRequest {
  const url = `http://localhost:3000${options.pathname}`;
  const headers = new Headers(options.header);
  const req = new NextRequest(url, { headers });
  if (options.cookie) {
    for (const [k, v] of Object.entries(options.cookie)) {
      req.cookies.set(k, v);
    }
  }
  return req;
}

const FUTURE = "2099-01-01T00:00:00+00:00";
const PAST = "2000-01-01T00:00:00+00:00";

describe("middleware — prelaunch gate", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "info").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("future launch date + page route → rewrite to /countdown with X-Robots-Tag", async () => {
    vi.stubEnv("NEXT_PUBLIC_LAUNCH_DATE", FUTURE);
    const response = await runMiddleware(makeRequest({ pathname: "/login" }));

    expect(response).toBeDefined();
    expect(response!.headers.get("x-middleware-rewrite")).toContain("/countdown");
    expect(response!.headers.get("X-Robots-Tag")).toBe("noindex, nofollow");
  });

  it("past launch date → passes through to existing auth middleware", async () => {
    vi.stubEnv("NEXT_PUBLIC_LAUNCH_DATE", PAST);
    const response = await runMiddleware(makeRequest({ pathname: "/login" }));

    expect(response).toBeDefined();
    expect(response!.headers.get("x-middleware-rewrite")).toBeNull();
    expect(response!.headers.get("X-Robots-Tag")).toBeNull();
  });

  it("/api/auth/callback during gate → 503 with Retry-After", async () => {
    vi.stubEnv("NEXT_PUBLIC_LAUNCH_DATE", FUTURE);
    const response = await runMiddleware(
      makeRequest({ pathname: "/api/auth/callback" })
    );

    expect(response!.status).toBe(503);
    expect(response!.headers.get("x-middleware-rewrite")).toBeNull();

    const retryAfter = response!.headers.get("Retry-After");
    expect(retryAfter).not.toBeNull();
    expect(Number(retryAfter)).toBeGreaterThan(0);
  });

  it("/api/auth/callback with valid bypass header during gate → passes through", async () => {
    vi.stubEnv("NEXT_PUBLIC_LAUNCH_DATE", FUTURE);
    vi.stubEnv("PRELAUNCH_BYPASS_TOKEN", "secret");
    const response = await runMiddleware(
      makeRequest({
        pathname: "/api/auth/callback",
        header: { "x-prelaunch-bypass": "secret" },
      })
    );

    expect(response!.status).not.toBe(503);
    expect(response!.headers.get("x-middleware-rewrite")).toBeNull();
  });

  it("/countdown self-request during gate → passes through (no loop)", async () => {
    vi.stubEnv("NEXT_PUBLIC_LAUNCH_DATE", FUTURE);
    const response = await runMiddleware(
      makeRequest({ pathname: "/countdown" })
    );

    expect(response!.headers.get("x-middleware-rewrite")).toBeNull();
  });

  it("bypass cookie during gate → passes through", async () => {
    vi.stubEnv("NEXT_PUBLIC_LAUNCH_DATE", FUTURE);
    const response = await runMiddleware(
      makeRequest({ pathname: "/", cookie: { prelaunch_bypass: "1" } })
    );

    expect(response!.headers.get("x-middleware-rewrite")).toBeNull();
  });

  it("valid bypass header during gate → passes through", async () => {
    vi.stubEnv("NEXT_PUBLIC_LAUNCH_DATE", FUTURE);
    vi.stubEnv("PRELAUNCH_BYPASS_TOKEN", "secret");
    const response = await runMiddleware(
      makeRequest({ pathname: "/", header: { "x-prelaunch-bypass": "secret" } })
    );

    expect(response!.headers.get("x-middleware-rewrite")).toBeNull();
  });
});
