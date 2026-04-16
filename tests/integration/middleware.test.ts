import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mockGetUser = vi.fn();

vi.mock("@/lib/supabase/middleware", () => ({
  updateSession: vi.fn().mockImplementation(async (request) => {
    const { NextResponse } = await import("next/server");
    return {
      user: mockGetUser(),
      supabaseResponse: NextResponse.next({ request }),
    };
  }),
}));

const { middleware } = await import("@/middleware");

describe("Auth Middleware", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("allows authenticated users to access protected routes", async () => {
    mockGetUser.mockReturnValue({ id: "123", email: "user@sun-asterisk.com" });

    const request = new NextRequest("http://localhost:3000/dashboard");
    const response = await middleware(request);

    expect(response.status).toBe(200);
  });

  it("redirects unauthenticated users to /login", async () => {
    mockGetUser.mockReturnValue(null);

    const request = new NextRequest("http://localhost:3000/dashboard");
    const response = await middleware(request);

    expect(response.status).toBe(307);
    expect(new URL(response.headers.get("location")!).pathname).toBe("/login");
  });

  it("allows unauthenticated access to /login", async () => {
    mockGetUser.mockReturnValue(null);

    const request = new NextRequest("http://localhost:3000/login");
    const response = await middleware(request);

    expect(response.status).toBe(200);
  });

  it("allows unauthenticated access to /api/auth/callback", async () => {
    mockGetUser.mockReturnValue(null);

    const request = new NextRequest(
      "http://localhost:3000/api/auth/callback?code=abc"
    );
    const response = await middleware(request);

    expect(response.status).toBe(200);
  });

  it("allows unauthenticated access to /error/403", async () => {
    mockGetUser.mockReturnValue(null);

    const request = new NextRequest("http://localhost:3000/error/403");
    const response = await middleware(request);

    expect(response.status).toBe(200);
  });
});
