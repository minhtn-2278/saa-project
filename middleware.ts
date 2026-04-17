import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import {
  PRELAUNCH_COUNTDOWN_ROUTE,
  PUBLIC_ROUTES,
} from "@/lib/utils/constants";
import { evaluatePrelaunchGate } from "@/lib/utils/prelaunch-gate";

export async function middleware(request: NextRequest) {
  const gateDecision = evaluatePrelaunchGate(request);

  if (gateDecision.type === "rewrite") {
    const response = NextResponse.rewrite(
      new URL(PRELAUNCH_COUNTDOWN_ROUTE, request.url)
    );
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
    return response;
  }

  if (gateDecision.type === "apiBlock") {
    return new NextResponse(null, {
      status: 503,
      headers: {
        "Retry-After": String(gateDecision.retryAfterSeconds),
        "X-Robots-Tag": "noindex, nofollow",
      },
    });
  }

  const { pathname } = request.nextUrl;

  const isPublicRoute = PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  const { user, supabaseResponse } = await updateSession(request);

  if (!user && !isPublicRoute) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|images/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
