import { existsSync } from "node:fs";
import { resolve } from "node:path";
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

/**
 * Derive the Supabase Storage hostname from NEXT_PUBLIC_SUPABASE_URL at build
 * time so next/image can optimise signed-URL image responses (plan § Image
 * rendering with next/image). Falls back to a placeholder at lint/test time.
 */
function supabaseStorageHostname(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) return "*.supabase.co";
  try {
    return new URL(url).hostname;
  } catch {
    return "*.supabase.co";
  }
}

/**
 * Build-time guard (plan § Q-P7): fail `next build` if the test-only sign-in
 * endpoint is still present in a production build. Runtime checks inside the
 * route add a second line of defence, but this prevents the file from ever
 * reaching a production bundle in the first place.
 */
function assertNoTestRoutesInProduction(): void {
  if (process.env.NODE_ENV !== "production") return;
  const testRoute = resolve(process.cwd(), "app/api/_test/sign-in/route.ts");
  if (existsSync(testRoute)) {
    throw new Error(
      [
        "[next.config.ts] SECURITY: app/api/_test/sign-in/route.ts must NOT be",
        "present in a production build. Remove the file from the production",
        "branch or add it to a test-only ignore pattern before deploying.",
      ].join("\n"),
    );
  }
}

assertNoTestRoutesInProduction();

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: supabaseStorageHostname(),
        pathname: "/storage/v1/**",
      },
    ],
  },
  async headers() {
    // Supabase Storage signed URLs resolve to the project hostname; allow
    // them as an `img-src` source. We avoid a wildcard — the Storage host is
    // the only external origin the app loads media from.
    const supabaseOrigin = (() => {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      if (!url) return "https://*.supabase.co";
      try {
        return new URL(url).origin;
      } catch {
        return "https://*.supabase.co";
      }
    })();

    const csp = [
      "default-src 'self'",
      // Next.js injects inline bootstrap scripts + CSS; dev mode also needs
      // `'unsafe-eval'` for Turbopack HMR, so we relax in non-production.
      process.env.NODE_ENV === "production"
        ? "script-src 'self' 'unsafe-inline'"
        : "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      // `data:` covers base64 preview images emitted by some libs; `blob:`
      // covers the in-memory previews the image uploader creates.
      `img-src 'self' data: blob: ${supabaseOrigin}`,
      "font-src 'self' data:",
      `connect-src 'self' ${supabaseOrigin}`,
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; ");

    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
