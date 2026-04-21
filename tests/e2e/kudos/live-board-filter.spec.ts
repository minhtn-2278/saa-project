import { test, expect } from "@playwright/test";
import { signInTestUser } from "../_helpers/authSetup";

const CALLER = "tran.nhat.minh-b@sun-asterisk.com";

/**
 * US2 acceptance scenarios — Filter by Hashtag / Department and refresh
 * both the Highlight carousel and the ALL KUDOS feed.
 *
 * Gated behind `RUN_E2E=true`. Requires the Live-board seed
 * (`supabase/seed/seed-live-board.sql`) so the filter has real tags /
 * departments to choose from.
 *
 * Plan § T067.
 */
test.describe("Sun* Kudos Live Board — filter (US2)", () => {
  test.skip(process.env.RUN_E2E !== "true", "E2E gated behind RUN_E2E=true");

  test.beforeEach(async ({ context, request }) => {
    await signInTestUser(context, request, CALLER);
  });

  test("US2-AS1: Hashtag dropdown opens and lists at most 10 options", async ({
    page,
  }) => {
    await page.goto("/kudos");

    // Trigger identified by its aria-label.
    const trigger = page.getByRole("button", { name: "Hashtag" });
    await trigger.click();

    const panel = page.getByRole("listbox").first();
    await expect(panel).toBeVisible();
    const options = panel.getByRole("option");
    const count = await options.count();
    expect(count).toBeGreaterThan(0);
    expect(count).toBeLessThanOrEqual(10);
  });

  test("US2-AS2: picking a hashtag refetches both blocks + reflects in URL", async ({
    page,
  }) => {
    await page.goto("/kudos");

    const trigger = page.getByRole("button", { name: "Hashtag" });
    await trigger.click();
    const firstOption = page.getByRole("listbox").first().getByRole("option").first();
    const optionLabel = await firstOption.innerText();
    await firstOption.click();

    // URL reflects the filter.
    await expect.poll(() => page.url()).toContain("hashtagId=");

    // Trigger now shows the picked tag (button text replaced with selection).
    await expect(trigger).toContainText(optionLabel);
  });

  test("US2-AS3: toggle-off — re-picking the active hashtag clears it", async ({
    page,
  }) => {
    await page.goto("/kudos");

    const trigger = page.getByRole("button", { name: "Hashtag" });
    await trigger.click();
    const firstOption = page.getByRole("listbox").first().getByRole("option").first();
    const optionLabel = (await firstOption.innerText()).trim();
    await firstOption.click();
    await expect.poll(() => page.url()).toContain("hashtagId=");

    // Re-open and click the same option to toggle it off.
    await trigger.click();
    await page
      .getByRole("listbox")
      .first()
      .getByRole("option", { name: optionLabel, exact: true })
      .click();

    await expect.poll(() => page.url()).not.toContain("hashtagId=");
  });

  test("US2-AS4: Phòng ban dropdown filters the feed to that department", async ({
    page,
  }) => {
    await page.goto("/kudos");

    const trigger = page.getByRole("button", { name: "Phòng ban" });
    await trigger.click();
    const firstOption = page.getByRole("listbox").first().getByRole("option").first();
    await firstOption.click();
    await expect.poll(() => page.url()).toContain("departmentId=");
  });

  test("US2-AS5: combined filters that yield nothing show the empty state", async ({
    page,
  }) => {
    await page.goto("/kudos?hashtagId=999999&departmentId=999999");
    await expect(page.getByText(/Hiện tại chưa có Kudos nào/)).toBeVisible();
  });

  test("US2-AS6: clicking a hashtag chip inside a card applies the filter", async ({
    page,
  }) => {
    await page.goto("/kudos");

    const feed = page.getByTestId("kudo-feed");
    await feed.waitFor({ state: "visible" });

    const chip = feed.getByRole("button", { name: /Lọc theo #/ }).first();
    await chip.click();

    await expect.poll(() => page.url()).toContain("hashtagId=");
  });

  test("US2-AS7: Escape closes an open dropdown without changing selection", async ({
    page,
  }) => {
    await page.goto("/kudos");
    const trigger = page.getByRole("button", { name: "Hashtag" });
    await trigger.click();
    const panel = page.getByRole("listbox").first();
    await expect(panel).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(panel).toBeHidden();
    await expect.poll(() => page.url()).not.toContain("hashtagId=");
  });
});
