import type { APIRequestContext, BrowserContext } from "@playwright/test";

/**
 * Playwright helper: sign in as a given test user via the `_test/sign-in`
 * endpoint, persisting the session cookie into the browser context.
 *
 * See plan.md § Integration Testing → E2E authentication strategy and
 * app/api/_test/sign-in/route.ts for the contract.
 *
 * Usage:
 *   test.beforeEach(async ({ context, request }) => {
 *     await signInTestUser(context, request, "tran.nhat.minh@sun-asterisk.com");
 *   });
 */
export async function signInTestUser(
  context: BrowserContext,
  request: APIRequestContext,
  email: string,
): Promise<{ userId: string | null; employeeId: number }> {
  const secret = process.env.TEST_AUTH_SECRET;
  if (!secret) {
    throw new Error(
      "authSetup: TEST_AUTH_SECRET env var missing. Set it to the same value used by the app.",
    );
  }

  const res = await request.post("/api/_test/sign-in", {
    headers: { "X-Test-Auth": secret, "Content-Type": "application/json" },
    data: { email },
  });
  if (!res.ok()) {
    const body = await res.text();
    throw new Error(
      `authSetup: sign-in failed for ${email} (${res.status()}): ${body}`,
    );
  }

  // Copy the Set-Cookie values from the API response into the browser context
  // so subsequent page.goto() calls are authenticated.
  const cookies = await res.headersArray();
  const setCookies = cookies
    .filter((h) => h.name.toLowerCase() === "set-cookie")
    .map((h) => h.value);
  if (setCookies.length) {
    await context.addCookies(parseSetCookies(setCookies));
  }

  return res.json() as Promise<{ userId: string | null; employeeId: number }>;
}

type CookieInput = Parameters<BrowserContext["addCookies"]>[0][number];

function parseSetCookies(raw: string[]): CookieInput[] {
  const cookies: CookieInput[] = [];
  const base = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";
  const { hostname } = new URL(base);
  for (const line of raw) {
    const [nameValue, ...attrs] = line.split(";").map((s) => s.trim());
    if (!nameValue) continue;
    const eq = nameValue.indexOf("=");
    if (eq < 0) continue;
    const name = nameValue.slice(0, eq);
    const value = nameValue.slice(eq + 1);
    const attrMap: Record<string, string | true> = {};
    for (const a of attrs) {
      const idx = a.indexOf("=");
      if (idx < 0) attrMap[a.toLowerCase()] = true;
      else attrMap[a.slice(0, idx).toLowerCase()] = a.slice(idx + 1);
    }
    cookies.push({
      name,
      value,
      domain: hostname,
      path: (attrMap.path as string) ?? "/",
      httpOnly: "httponly" in attrMap,
      secure: "secure" in attrMap,
      sameSite:
        (attrMap.samesite as "Lax" | "Strict" | "None" | undefined) ?? "Lax",
    });
  }
  return cookies;
}
