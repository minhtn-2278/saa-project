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
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
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
