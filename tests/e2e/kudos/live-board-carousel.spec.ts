import { test, expect } from "@playwright/test";
import { signInTestUser } from "../_helpers/authSetup";

const CALLER = "tran.nhat.minh-b@sun-asterisk.com";

/**
 * US3 acceptance scenarios — navigate the Highlight carousel.
 *
 * NOTE on divergence: spec.md § US3 originally called for arrows to be
 * `aria-disabled` at the ends (index 0 and N-1) — during Phase 5 the user
 * explicitly re-specced the navigation as infinite / circular so the
 * auto-slide loop is seamless. These scenarios exercise the *shipped*
 * behaviour:
 *   - AS#1: clicking right advances by one slide, chip updates 1/N → 2/N
 *   - AS#2: at index 0, clicking left wraps to the last slide (was: disabled)
 *   - AS#3: at index N-1, clicking right wraps to 0 (was: disabled)
 *   - AS#4: with fewer than 5 highlight Kudos, chip reads `x/<live-total>`
 *     and navigation still works
 *   - AS#5: changing the Hashtag filter resets the chip to 1/N'
 *
 * Gated behind `RUN_E2E=true`. Requires `seed-live-board.sql` to populate
 * ≥ 2 highlight Kudos (the seed inserts multiple hearts per kudo so the
 * `ORDER BY heart_count` filter has ties to break).
 *
 * Plan § T091.
 */
test.describe("Sun* Kudos Live Board — highlight carousel (US3)", () => {
  test.skip(process.env.RUN_E2E !== "true", "E2E gated behind RUN_E2E=true");

  test.beforeEach(async ({ context, request }) => {
    await signInTestUser(context, request, CALLER);
  });

  async function readChip(page: import("@playwright/test").Page) {
    const chip = page.getByTestId("slide-pagination-chip");
    await chip.waitFor({ state: "visible" });
    // Chip renders two spans: "<current>" + " / <total>" — `innerText` gives us
    // the concatenation. Normalize whitespace.
    const raw = (await chip.innerText()).replace(/\s+/g, " ").trim();
    const match = raw.match(/^(\d+)\s*\/\s*(\d+)$/);
    if (!match) throw new Error(`Unexpected chip text: "${raw}"`);
    return { current: Number(match[1]), total: Number(match[2]) };
  }

  test("AS#1: clicking right arrow advances current index by 1", async ({
    page,
  }) => {
    await page.goto("/kudos");

    const { current: c0, total } = await readChip(page);
    test.skip(total < 2, "Seed has fewer than 2 highlight Kudos — can't navigate");

    // Use the pagination-chip arrow to make the target unambiguous.
    const chipArea = page.getByTestId("slide-pagination-chip").locator("..");
    await chipArea.getByRole("button", { name: "Kudo tiếp theo" }).click();

    await expect
      .poll(async () => (await readChip(page)).current)
      .toBe((c0 % total) + 1);
  });

  test("AS#2: at index 0, clicking left wraps to the last slide", async ({
    page,
  }) => {
    await page.goto("/kudos");

    const { total } = await readChip(page);
    test.skip(total < 2, "Seed has fewer than 2 highlight Kudos");

    // The chip starts at 1/total. Click left → should wrap to `total/total`.
    const chipArea = page.getByTestId("slide-pagination-chip").locator("..");
    await chipArea.getByRole("button", { name: "Kudo trước" }).click();

    await expect
      .poll(async () => (await readChip(page)).current)
      .toBe(total);
  });

  test("AS#3: at last index, clicking right wraps to 1", async ({ page }) => {
    await page.goto("/kudos");

    const { total } = await readChip(page);
    test.skip(total < 2, "Seed has fewer than 2 highlight Kudos");

    // Advance to the last slide.
    const chipArea = page.getByTestId("slide-pagination-chip").locator("..");
    for (let i = 1; i < total; i++) {
      await chipArea.getByRole("button", { name: "Kudo tiếp theo" }).click();
      await expect
        .poll(async () => (await readChip(page)).current)
        .toBe(i + 1);
    }

    // One more click → wraps to 1.
    await chipArea.getByRole("button", { name: "Kudo tiếp theo" }).click();
    await expect
      .poll(async () => (await readChip(page)).current)
      .toBe(1);
  });

  test("AS#4: pagination reads `x/N` where N is the live highlight total", async ({
    page,
  }) => {
    await page.goto("/kudos");
    const { current, total } = await readChip(page);
    expect(current).toBeGreaterThanOrEqual(1);
    expect(total).toBeGreaterThanOrEqual(1);
    expect(total).toBeLessThanOrEqual(5);
  });

  test("AS#5: changing the Hashtag filter resets the chip to 1/N'", async ({
    page,
  }) => {
    await page.goto("/kudos");

    // Bump to at least index 2 so we can observe the reset.
    const { total } = await readChip(page);
    test.skip(total < 2, "Seed has fewer than 2 highlight Kudos");
    const chipArea = page.getByTestId("slide-pagination-chip").locator("..");
    await chipArea.getByRole("button", { name: "Kudo tiếp theo" }).click();
    await expect
      .poll(async () => (await readChip(page)).current)
      .toBeGreaterThan(1);

    // Pick the first hashtag from the B.1.1 dropdown.
    await page.getByRole("button", { name: "Hashtag" }).click();
    await page
      .getByRole("listbox")
      .first()
      .getByRole("option")
      .first()
      .click();

    // Chip returns to the first slide once the refetch + reducer settle.
    await expect
      .poll(async () => (await readChip(page)).current)
      .toBe(1);
  });
});
