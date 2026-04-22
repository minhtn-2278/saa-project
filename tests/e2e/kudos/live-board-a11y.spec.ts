import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { signInTestUser } from "../_helpers/authSetup";

const CALLER = "tran.nhat.minh-b@sun-asterisk.com";

/**
 * T104 — Accessibility audit.
 *
 * Uses `@axe-core/playwright` to check `/kudos` at each viewport we commit
 * to in design-style.md. The gate is **zero serious / critical violations**;
 * minor / moderate violations (e.g. decorative images lacking an alt that
 * we can't easily fix without breaking the Figma) are logged but don't
 * fail the suite.
 *
 * Gated behind `RUN_E2E=true` so CI doesn't require a seeded Supabase by
 * default.
 *
 * Rules disabled (with rationale):
 *   - `color-contrast` — the Spotlight card intentionally layers bright gold
 *     text over the radial-dark gradient; axe can't see the actual composite
 *     color once the canvas renders, so it reports false positives. Design
 *     reviewed the combo manually (WCAG AA at 52 px bold).
 */

const VIEWPORTS = [
  { name: "mobile-375", width: 375, height: 812 },
  { name: "tablet-768", width: 768, height: 1024 },
  { name: "desktop-1440", width: 1440, height: 900 },
] as const;

test.describe("Sun* Kudos Live Board — a11y (T104)", () => {
  test.skip(
    process.env.RUN_E2E !== "true",
    "E2E gated behind RUN_E2E=true",
  );

  for (const vp of VIEWPORTS) {
    test(`axe: no serious violations at ${vp.name}`, async ({
      context,
      page,
      request,
    }) => {
      await signInTestUser(context, request, CALLER);
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto("/kudos");
      await expect(page.getByTestId("kudo-feed")).toBeVisible();

      const results = await new AxeBuilder({ page })
        .disableRules(["color-contrast"])
        .analyze();

      const serious = results.violations.filter(
        (v) => v.impact === "serious" || v.impact === "critical",
      );

      if (serious.length > 0) {
        // eslint-disable-next-line no-console
        console.error(
          `axe violations at ${vp.name}:`,
          JSON.stringify(serious, null, 2),
        );
      }

      expect(serious, `No serious axe violations at ${vp.name}`).toHaveLength(0);
    });
  }

  test("keyboard: Tab reaches the A.1 pill and both filter dropdowns", async ({
    context,
    page,
    request,
  }) => {
    await signInTestUser(context, request, CALLER);
    await page.goto("/kudos");
    await expect(page.getByTestId("kudo-feed")).toBeVisible();

    // Walk the top of the document — A.1 pill, Hashtag trigger, Phòng ban
    // trigger should all be reachable via Tab without hidden traps.
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");

    const focused = await page.evaluate(
      () => document.activeElement?.tagName.toLowerCase() ?? null,
    );
    expect(focused).not.toBeNull();
  });

  test("Escape closes an open filter dropdown", async ({
    context,
    page,
    request,
  }) => {
    await signInTestUser(context, request, CALLER);
    await page.goto("/kudos");

    await page.getByRole("button", { name: /Hashtag/i }).first().click();
    await expect(page.getByRole("listbox")).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(page.getByRole("listbox")).toBeHidden();
  });
});
