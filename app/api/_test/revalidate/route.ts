import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";

/**
 * Test-only cache invalidation endpoint.
 *
 * Integration tests that hit Route Handlers wrapped in `unstable_cache`
 * (e.g. `GET /api/departments`, `GET /api/spotlight`) need a way to force
 * a fresh computation between tests — otherwise the 5-min cache pollutes
 * the next test's assertions. Playwright's `globalSetup` + vitest's
 * `beforeEach` POST to this endpoint with the list of tags to revalidate.
 *
 * Two-layer gate (mirrors `/api/_test/sign-in/route.ts`):
 *   1. Runtime: returns 404 unless NODE_ENV === 'test'.
 *   2. Build-time: next.config.ts refuses a production build if this file
 *      is on disk with NODE_ENV === 'production'.
 *
 * Additionally, a shared-secret header is required — defence against test
 * envs that accidentally leak public access.
 *
 * Contract:
 *   POST /api/_test/revalidate
 *   Headers:
 *     X-Test-Auth: <TEST_AUTH_SECRET>
 *   Body: { "tags": ["spotlight", "departments", ...] }
 *   Returns: 200 { revalidated: string[] }
 *
 * See plan `MaZUn5xHXZ-sun-kudos-live-board` § T022.
 */

function notATestEnv(): boolean {
  return process.env.NODE_ENV !== "test";
}

interface RevalidateBody {
  tags?: unknown;
}

export async function POST(request: Request) {
  if (notATestEnv()) {
    return new NextResponse("Not found", { status: 404 });
  }

  const expectedSecret = process.env.TEST_AUTH_SECRET;
  if (!expectedSecret) {
    return NextResponse.json(
      { error: { code: "SERVER_MISCONFIGURED", message: "TEST_AUTH_SECRET missing" } },
      { status: 500 },
    );
  }
  if (request.headers.get("x-test-auth") !== expectedSecret) {
    return NextResponse.json(
      { error: { code: "FORBIDDEN", message: "Invalid test auth" } },
      { status: 403 },
    );
  }

  let body: RevalidateBody;
  try {
    body = (await request.json()) as RevalidateBody;
  } catch {
    return NextResponse.json(
      { error: { code: "BAD_REQUEST", message: "Invalid JSON body" } },
      { status: 400 },
    );
  }

  const rawTags = body.tags;
  if (
    !Array.isArray(rawTags) ||
    rawTags.some((t) => typeof t !== "string" || t.length === 0)
  ) {
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "`tags` must be a non-empty string array",
        },
      },
      { status: 422 },
    );
  }

  const tags = rawTags as string[];
  for (const tag of tags) {
    // Next 16 requires a cache-profile argument. `'default'` clears entries
    // in the default profile — which is what `unstable_cache` calls use and
    // therefore what our integration tests need.
    revalidateTag(tag, "default");
  }

  return NextResponse.json({ revalidated: tags });
}
