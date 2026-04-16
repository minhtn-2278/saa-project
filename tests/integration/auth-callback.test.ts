import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Supabase server client
const mockExchangeCodeForSession = vi.fn();
const mockSignOut = vi.fn();
const mockGetUser = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: {
      exchangeCodeForSession: (...args: unknown[]) =>
        mockExchangeCodeForSession(...args),
      signOut: (...args: unknown[]) => mockSignOut(...args),
      getUser: (...args: unknown[]) => mockGetUser(...args),
    },
  }),
}));

// Import after mocks
const { GET } = await import("@/app/api/auth/callback/route");

describe("OAuth Callback Route Handler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redirects to / on successful Sun* domain login", async () => {
    mockExchangeCodeForSession.mockResolvedValue({
      data: { user: { email: "user@sun-asterisk.com" } },
      error: null,
    });

    const request = new Request(
      "http://localhost:3000/api/auth/callback?code=valid-code"
    );
    const response = await GET(request);

    expect(response.status).toBe(307);
    expect(new URL(response.headers.get("location")!).pathname).toBe("/");
    expect(mockExchangeCodeForSession).toHaveBeenCalledWith("valid-code");
  });

  it("redirects to /error/403 for non-Sun* domain", async () => {
    mockExchangeCodeForSession.mockResolvedValue({
      data: { user: { email: "user@gmail.com" } },
      error: null,
    });

    const request = new Request(
      "http://localhost:3000/api/auth/callback?code=valid-code"
    );
    const response = await GET(request);

    expect(response.status).toBe(307);
    expect(new URL(response.headers.get("location")!).pathname).toBe(
      "/error/403"
    );
    expect(mockSignOut).toHaveBeenCalled();
  });

  it("redirects to /login?error=auth_failed when code is missing", async () => {
    const request = new Request(
      "http://localhost:3000/api/auth/callback"
    );
    const response = await GET(request);

    expect(response.status).toBe(307);
    const location = new URL(response.headers.get("location")!);
    expect(location.pathname).toBe("/login");
    expect(location.searchParams.get("error")).toBe("auth_failed");
  });

  it("redirects to /login?error=auth_failed when exchange fails", async () => {
    mockExchangeCodeForSession.mockResolvedValue({
      data: { user: null },
      error: { message: "Invalid code" },
    });

    const request = new Request(
      "http://localhost:3000/api/auth/callback?code=invalid-code"
    );
    const response = await GET(request);

    expect(response.status).toBe(307);
    const location = new URL(response.headers.get("location")!);
    expect(location.pathname).toBe("/login");
    expect(location.searchParams.get("error")).toBe("auth_failed");
  });

  it("redirects to /login?error=auth_failed when user has no email", async () => {
    mockExchangeCodeForSession.mockResolvedValue({
      data: { user: { email: null } },
      error: null,
    });

    const request = new Request(
      "http://localhost:3000/api/auth/callback?code=valid-code"
    );
    const response = await GET(request);

    expect(response.status).toBe(307);
    const location = new URL(response.headers.get("location")!);
    expect(location.pathname).toBe("/login");
    expect(location.searchParams.get("error")).toBe("auth_failed");
  });
});
