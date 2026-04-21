import { test, expect } from "@playwright/test";
import { signInTestUser } from "../_helpers/authSetup";

const CALLER = "tran.nhat.minh-b@sun-asterisk.com";

/**
 * US4 acceptance scenarios — Like (thả tim) a Kudo.
 *
 * AS#1: Click grey heart on a kudo I did not author → turns red + count +1.
 * AS#2: Click again → un-likes, count -1.
 * AS#3: Server errors (network / 500) roll the optimistic UI back.
 * AS#4: On my own Kudo the heart button is disabled.
 *
 * Also covers Q-P3: a soft-removed / hidden kudo returns 404 from the API —
 * the UI surfaces the toast and rolls back.
 *
 * Gated behind `RUN_E2E=true`. Requires a running Next.js dev server +
 * the Live-board + Viết Kudo seeds so the caller has at least one
 * non-authored kudo to like.
 *
 * Plan § T074.
 */
test.describe("Sun* Kudos Live Board — like (US4)", () => {
  test.skip(process.env.RUN_E2E !== "true", "E2E gated behind RUN_E2E=true");

  test.beforeEach(async ({ context, request }) => {
    await signInTestUser(context, request, CALLER);
  });

  test("AS#1 + AS#2: like → count+1, un-like → count-1 (same session)", async ({
    page,
  }) => {
    await page.goto("/kudos");
    const feed = page.getByTestId("kudo-feed");
    await feed.waitFor({ state: "visible" });

    // First enabled heart in the feed — that's a kudo the caller did not author.
    const heart = feed
      .getByRole("button", { name: /^Thả tim$/ })
      .first();
    await heart.waitFor({ state: "visible" });

    const initialCount = Number((await heart.innerText()).trim() || "0");

    await heart.click();
    await expect
      .poll(async () => Number((await heart.innerText()).trim() || "0"))
      .toBe(initialCount + 1);
    await expect(heart).toHaveAttribute("aria-pressed", "true");

    // Second click — un-likes.
    await heart.click();
    await expect
      .poll(async () => Number((await heart.innerText()).trim() || "0"))
      .toBe(initialCount);
    await expect(heart).toHaveAttribute("aria-pressed", "false");
  });

  test("AS#3: rolls back and surfaces toast on server error", async ({
    page,
  }) => {
    // Intercept the like endpoint and return 500 on the first call.
    await page.route("**/api/kudos/*/like", async (route) => {
      await route.fulfill({
        status: 500,
        body: JSON.stringify({
          error: { code: "INTERNAL_ERROR", message: "boom" },
        }),
        headers: { "Content-Type": "application/json" },
      });
    });

    await page.goto("/kudos");
    const feed = page.getByTestId("kudo-feed");
    const heart = feed.getByRole("button", { name: /^Thả tim$/ }).first();
    await heart.waitFor({ state: "visible" });

    const initialCount = Number((await heart.innerText()).trim() || "0");
    await heart.click();

    // UI reverts, toast appears.
    await expect(
      page.getByText("Không thể thả tim. Vui lòng thử lại."),
    ).toBeVisible();
    await expect
      .poll(async () => Number((await heart.innerText()).trim() || "0"))
      .toBe(initialCount);
    await expect(heart).toHaveAttribute("aria-pressed", "false");
  });

  test("AS#4: heart button is disabled on the caller's own Kudo", async ({
    page,
  }) => {
    await page.goto("/kudos");
    const feed = page.getByTestId("kudo-feed");
    await feed.waitFor({ state: "visible" });

    // Any disabled heart is a self-authored kudo (server sets canHeart=false).
    const disabledHearts = feed.locator(
      'button[aria-label="Thả tim"][aria-disabled="true"], button[aria-label="Thả tim"]:is(:disabled)',
    );
    // The seed covers both authored and recipient-side kudos, so this should
    // match at least one.
    expect(await disabledHearts.count()).toBeGreaterThan(0);
  });

  test("Q-P3: liking a soft-removed/hidden kudo surfaces toast + rolls back", async ({
    page,
  }) => {
    await page.route("**/api/kudos/*/like", async (route) => {
      await route.fulfill({
        status: 404,
        body: JSON.stringify({
          error: { code: "NOT_FOUND", message: "Kudo not found" },
        }),
        headers: { "Content-Type": "application/json" },
      });
    });

    await page.goto("/kudos");
    const feed = page.getByTestId("kudo-feed");
    const heart = feed.getByRole("button", { name: /^Thả tim$/ }).first();
    await heart.waitFor({ state: "visible" });

    const initialCount = Number((await heart.innerText()).trim() || "0");
    await heart.click();

    await expect(
      page.getByText("Không thể thả tim. Vui lòng thử lại."),
    ).toBeVisible();
    await expect
      .poll(async () => Number((await heart.innerText()).trim() || "0"))
      .toBe(initialCount);
  });
});
