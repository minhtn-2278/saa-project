import { test, expect } from "@playwright/test";
import { signInTestUser } from "../_helpers/authSetup";

const CALLER = "tran.nhat.minh-b@sun-asterisk.com";

/**
 * T105 — Performance verification.
 *
 * Rather than pulling in Lighthouse (which requires a Chromium headless
 * variant + extra deps), we measure the numbers the spec actually
 * commits to using Playwright + the Performance API directly:
 *
 *   - SC-003: heart click → red feedback ≤ 150 ms  (measured in-browser)
 *   - SC-005: filter refetch p75 ≤ 600 ms         (measured over 3 runs)
 *   - SC-006: LCP ≤ 2.5 s                         (PerformanceObserver)
 *   - SC-007: Spotlight live latency ≤ 2 s        (out-of-scope; needs
 *                                                  a second browser, see
 *                                                  deferred T102)
 *
 * Gated behind `RUN_E2E=true`. These are smoke checks — deploying anything
 * that regresses them by 2× is the signal, not absolute thresholds on
 * every CI run.
 */
test.describe("Sun* Kudos Live Board — perf (T105)", () => {
  test.skip(
    process.env.RUN_E2E !== "true",
    "E2E gated behind RUN_E2E=true",
  );

  test("LCP ≤ 2.5 s (SC-006)", async ({ context, page, request }) => {
    await signInTestUser(context, request, CALLER);
    await page.goto("/kudos");

    const lcp = await page.evaluate<number>(
      () =>
        new Promise((resolve) => {
          const observer = new PerformanceObserver((entries) => {
            const last = entries.getEntries().at(-1) as
              | PerformanceEntry
              | undefined;
            if (last) resolve(last.startTime);
          });
          observer.observe({ type: "largest-contentful-paint", buffered: true });
          // Fallback: if no LCP arrives inside 5 s, resolve with `Infinity`
          // so the assertion fails loudly.
          setTimeout(() => resolve(Number.POSITIVE_INFINITY), 5000);
        }),
    );

    // eslint-disable-next-line no-console
    console.log(`LCP: ${lcp.toFixed(0)} ms`);
    expect(lcp).toBeLessThanOrEqual(2500);
  });

  test("Heart click → red feedback ≤ 150 ms (SC-003)", async ({
    context,
    page,
    request,
  }) => {
    await signInTestUser(context, request, CALLER);
    await page.goto("/kudos");
    await expect(page.getByTestId("kudo-feed")).toBeVisible();

    // Click the first enabled heart and measure the time until the button
    // flips to its `aria-pressed="true"` state (optimistic-set).
    const heart = page.locator("[data-testid='hearts-button']:not([disabled])").first();
    await heart.waitFor();

    const t0 = Date.now();
    await heart.click();
    await expect(heart).toHaveAttribute("aria-pressed", "true");
    const elapsed = Date.now() - t0;

    // eslint-disable-next-line no-console
    console.log(`Heart optimistic flip: ${elapsed} ms`);
    expect(elapsed).toBeLessThanOrEqual(150);
  });

  test("Filter refetch p75 ≤ 600 ms (SC-005)", async ({
    context,
    page,
    request,
  }) => {
    await signInTestUser(context, request, CALLER);
    await page.goto("/kudos");
    await expect(page.getByTestId("kudo-feed")).toBeVisible();

    const samples: number[] = [];
    for (let i = 0; i < 3; i++) {
      // Open + pick + close the hashtag dropdown — measure until the feed
      // signals it finished fetching (the `aria-busy` drops back to false).
      const feed = page.getByTestId("kudo-feed");

      const t0 = Date.now();
      await page.getByRole("button", { name: /Hashtag/i }).first().click();
      await page.getByRole("option").first().click();
      await expect(feed).not.toHaveAttribute("aria-busy", "true", {
        timeout: 3_000,
      });
      samples.push(Date.now() - t0);

      // Toggle the filter off before the next sample.
      await page.getByRole("button", { name: /Hashtag/i }).first().click();
      await page.getByRole("option").first().click();
      await expect(feed).not.toHaveAttribute("aria-busy", "true", {
        timeout: 3_000,
      });
    }

    samples.sort((a, b) => a - b);
    const p75 = samples[Math.floor(samples.length * 0.75)];
    // eslint-disable-next-line no-console
    console.log(`Filter refetch samples: ${samples.join(", ")} ms — p75 ${p75}`);
    expect(p75).toBeLessThanOrEqual(600);
  });
});
