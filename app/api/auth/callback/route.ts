import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { emailDomainSchema } from "@/lib/validations/auth";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(
      new URL("/login?error=auth_failed", origin)
    );
  }

  const supabase = await createClient();

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user?.email) {
    return NextResponse.redirect(
      new URL("/login?error=auth_failed", origin)
    );
  }

  const domainResult = emailDomainSchema.safeParse(data.user.email);

  if (!domainResult.success) {
    await supabase.auth.signOut();
    return NextResponse.redirect(new URL("/error/403", origin));
  }

  return NextResponse.redirect(new URL("/", origin));
}
