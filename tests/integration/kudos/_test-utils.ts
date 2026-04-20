/**
 * Shared helpers for Phase-3 integration tests.
 *
 * Each integration-test file is gated behind `RUN_INTEGRATION_TESTS=true` so
 * default Vitest runs stay green without a running Next.js dev server. Turn
 * the flag on in CI once the dev server + Supabase test project are wired
 * (see supabase/SETUP.md).
 */

export const runIntegration = process.env.RUN_INTEGRATION_TESTS === "true";
export const BASE_URL = process.env.INTEGRATION_BASE_URL ?? "http://localhost:3000";

const TEST_AUTH_SECRET = process.env.TEST_AUTH_SECRET ?? "";

export interface SignInResult {
  cookieHeader: string;
  userId: string | null;
  employeeId: number;
}

/**
 * Sign in via the test-only endpoint, returning a `Cookie` header string
 * suitable for subsequent `fetch()` calls.
 */
export async function signInAsEmail(email: string): Promise<SignInResult> {
  if (!TEST_AUTH_SECRET) {
    throw new Error(
      "TEST_AUTH_SECRET missing. Set it before running integration tests.",
    );
  }

  const res = await fetch(`${BASE_URL}/api/_test/sign-in`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Test-Auth": TEST_AUTH_SECRET,
    },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) {
    throw new Error(
      `signInAsEmail: ${res.status} ${await res.text()}`,
    );
  }
  const setCookies = res.headers.getSetCookie?.() ?? [];
  const cookieHeader = setCookies
    .map((c) => c.split(";")[0])
    .join("; ");
  const json = (await res.json()) as { userId: string | null; employeeId: number };
  return { cookieHeader, userId: json.userId, employeeId: json.employeeId };
}

export async function authedFetch(
  path: string,
  cookieHeader: string,
  init: RequestInit = {},
): Promise<Response> {
  const headers = new Headers(init.headers);
  headers.set("Cookie", cookieHeader);
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  return fetch(`${BASE_URL}${path}`, { ...init, headers });
}

/**
 * Minimal ProseMirror doc with a single paragraph + text.
 * Returns plaintext ≥ 1 char so body_plain passes Zod validation.
 */
export function plainBody(text: string) {
  return {
    type: "doc",
    content: [
      { type: "paragraph", content: [{ type: "text", text }] },
    ],
  };
}
