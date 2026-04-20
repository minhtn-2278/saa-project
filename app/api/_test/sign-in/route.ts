import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { CookieOptions } from "@supabase/ssr";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

/**
 * Test-only Supabase sign-in endpoint.
 *
 * Playwright E2E (+ integration tests that need a real session cookie) call
 * this endpoint to mint a session without going through OAuth. Gated by
 * TWO independent layers:
 *
 *   1. Runtime: returns 404 unless NODE_ENV === 'test'.
 *   2. Build-time: next.config.ts fails the build when NODE_ENV === 'production'
 *      AND this file exists on disk (plan § Q-P7, two-layer guard).
 *
 * Contract:
 *   POST /api/_test/sign-in
 *   Headers:
 *     X-Test-Auth: <TEST_AUTH_SECRET from env>
 *   Body: { "email": "tran.nhat.minh@sun-asterisk.com" }
 *   Returns: 200 { userId, employeeId } on success, with a session cookie set.
 *
 * See plan.md § Integration Testing → E2E authentication strategy.
 */

// Runtime guard: if we're not in a test environment, pretend the route doesn't
// exist. Critical second layer in case the build-time guard is bypassed.
function notATestEnv(): boolean {
  return process.env.NODE_ENV !== "test";
}

interface SignInBody {
  email?: unknown;
}

export async function POST(request: Request) {
  if (notATestEnv()) {
    return new NextResponse("Not found", { status: 404 });
  }

  const secret = process.env.TEST_AUTH_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: { code: "MISCONFIGURED", message: "TEST_AUTH_SECRET not set" } },
      { status: 500 },
    );
  }
  if (request.headers.get("X-Test-Auth") !== secret) {
    return NextResponse.json(
      { error: { code: "FORBIDDEN", message: "Bad test auth header" } },
      { status: 403 },
    );
  }

  let body: SignInBody;
  try {
    body = (await request.json()) as SignInBody;
  } catch {
    return NextResponse.json(
      { error: { code: "BAD_REQUEST", message: "Invalid JSON" } },
      { status: 400 },
    );
  }
  const email = typeof body.email === "string" ? body.email.trim() : "";
  if (!email) {
    return NextResponse.json(
      { error: { code: "BAD_REQUEST", message: "email required" } },
      { status: 400 },
    );
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !serviceKey || !anonKey) {
    return NextResponse.json(
      {
        error: {
          code: "MISCONFIGURED",
          message: "Supabase env vars missing",
        },
      },
      { status: 500 },
    );
  }

  const admin = createAdminClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });

  // Generate a magic-link for the email, then verify it to obtain session tokens.
  const { data: linkData, error: linkError } =
    await admin.auth.admin.generateLink({
      type: "magiclink",
      email,
    });
  if (linkError || !linkData?.properties?.hashed_token) {
    return NextResponse.json(
      {
        error: {
          code: "GEN_LINK_FAILED",
          message: linkError?.message ?? "Could not generate magic link",
        },
      },
      { status: 500 },
    );
  }

  // Verify the OTP we just minted to get a session.
  const { data: verify, error: verifyError } = await admin.auth.verifyOtp({
    type: "email",
    email,
    token_hash: linkData.properties.hashed_token,
  });
  if (verifyError || !verify.session) {
    return NextResponse.json(
      {
        error: {
          code: "VERIFY_FAILED",
          message: verifyError?.message ?? "Could not verify test OTP",
        },
      },
      { status: 500 },
    );
  }

  // Seed a matching employees row if it doesn't exist, so
  // getCurrentEmployee() resolves.
  const { data: existing } = await admin
    .from("employees")
    .select("id")
    .ilike("email", email)
    .is("deleted_at", null)
    .limit(1)
    .maybeSingle();

  let employeeId: number;
  if (existing?.id) {
    employeeId = existing.id;
  } else {
    const { data: inserted, error: insertError } = await admin
      .from("employees")
      .insert({
        email,
        full_name: email.split("@")[0] ?? "Test User",
        department: "Testing",
        job_title: "Test Account",
      })
      .select("id")
      .single();
    if (insertError || !inserted) {
      return NextResponse.json(
        {
          error: {
            code: "SEED_FAILED",
            message: insertError?.message ?? "Could not seed employee",
          },
        },
        { status: 500 },
      );
    }
    employeeId = inserted.id;
  }

  // Set the session cookies on the response — uses the same SSR cookie
  // helper the app uses, keyed to this request's cookie jar.
  const cookieStore = await cookies();
  const ssr = createServerClient(supabaseUrl, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(
        cookiesToSet: {
          name: string;
          value: string;
          options?: CookieOptions;
        }[],
      ) {
        for (const { name, value, options } of cookiesToSet) {
          cookieStore.set(name, value, options);
        }
      },
    },
  });
  await ssr.auth.setSession({
    access_token: verify.session.access_token,
    refresh_token: verify.session.refresh_token,
  });

  return NextResponse.json({
    userId: verify.user?.id ?? null,
    employeeId,
  });
}
