# Backlog — CSRF hardening

**Filed from**: Live Board plan T110 (Phase 10 polish).
**Scope**: retrofits **all** mutating route handlers in the repo.
**Status**: not started — track separately from the Live Board release.

---

## Problem

The current auth flow relies on Supabase session cookies. Any cross-origin page a
signed-in Sunner opens could, in principle, trigger a POST / PUT / PATCH / DELETE
against our Route Handlers — the browser attaches the cookie automatically and
we do not currently check the request origin.

Concretely affected endpoints today:

- `POST /api/kudos` (Viết Kudo submit)
- `POST /api/kudos/[id]/like` (Live Board heart)
- `DELETE /api/kudos/[id]/like`
- `POST /api/_test/*` (test-only, gated by `NODE_ENV==='test'`; out of scope)

Next.js 16 + React 19 Server Actions auto-hash the referer, but plain Route
Handlers do not — they are classic fetch endpoints.

---

## Proposed fix (single PR, no feature flag)

1. Add `lib/auth/csrf.ts` exporting `assertSameOrigin(request: Request): void`.
   The helper:
   - reads `Origin` and `Sec-Fetch-Site` headers;
   - treats `same-origin` / `same-site` as pass;
   - compares `Origin` against `NEXT_PUBLIC_SITE_URL` (already configured) when
     `Sec-Fetch-Site` is missing (older browsers);
   - throws `CsrfForbiddenError` otherwise.
2. Extend `authErrorToResponse` to translate `CsrfForbiddenError` → 403
   `{code: "CSRF_FORBIDDEN"}`.
3. Call `assertSameOrigin(request)` as the **first** line inside every mutating
   handler (POST / PUT / PATCH / DELETE). Reads stay untouched.
4. Add an integration test per mutating endpoint:
   - Missing `Origin` header → 403.
   - Wrong-origin header → 403.
   - Matching origin → normal flow.

## Risks / considerations

- Mobile WebViews may elide `Origin`. Keep the `NEXT_PUBLIC_SITE_URL` comparison
  as the fallback, and log (don't block) on the first rollout to measure
  legitimate traffic.
- Server Actions already include Next's own `x-action` header; don't require it.
- The test-only endpoints (`/api/_test/*`) already gate on `NODE_ENV` — exclude
  them to avoid breaking the Playwright sign-in helper.

## Estimate

~½ day engineering + tests. No UI work. No DB migration. Can ship to prod
behind observability only (log-first for a week) before flipping to enforcement.

## Owner

Unassigned — pick up after the Live Board is stable in production.
