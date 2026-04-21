import { test, expect } from "@playwright/test";
import { signInTestUser } from "../_helpers/authSetup";

const CALLER = "tran.nhat.minh-b@sun-asterisk.com";
const RECIPIENT_QUERY = "Nguyen";

/**
 * US7 acceptance scenarios — Write a new Kudo directly from the Live board.
 *
 * AS#1: Click the A.1 pill → Viết Kudo modal opens (existing flow, only
 *       the `?write=kudo` URL param toggles the mount).
 * AS#2: Submit → modal closes + new Kudo prepends to ALL KUDOS.
 *
 * Gated behind `RUN_E2E=true` like the rest of the E2E suite.
 *
 * Plan § T051.
 */
test.describe("Sun* Kudos Live Board — write entry (US7)", () => {
  test.skip(
    process.env.RUN_E2E !== "true",
    "E2E gated behind RUN_E2E=true",
  );

  test.beforeEach(async ({ context, request }) => {
    await signInTestUser(context, request, CALLER);
  });

  test("US7-AS1: A.1 pill opens the Viết Kudo modal from /kudos", async ({
    page,
  }) => {
    await page.goto("/kudos");

    // Click the pill link (renders as an anchor with the placeholder text).
    await page
      .getByText(/Hôm nay, bạn muốn gửi lời cảm ơn và ghi nhận đến ai/)
      .click();

    // The modal is mounted at the dashboard layout and opens via ?write=kudo.
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 5000 });
    await expect(
      dialog.getByText("Gửi lời cám ơn và ghi nhận đến đồng đội"),
    ).toBeVisible();

    // URL carries the open-modal param — deep-link + refresh-friendly.
    await expect(page).toHaveURL(/[?&]write=kudo/);
  });

  test("US7-AS2: submitted Kudo prepends to the ALL KUDOS feed", async ({
    page,
  }) => {
    await page.goto("/kudos");

    // Capture the top card's id before submit (if the feed is non-empty).
    const feed = page.getByTestId("kudo-feed");
    const topBeforeSelector = feed.locator("article").first();
    const topIdBefore = (await topBeforeSelector.count())
      ? await topBeforeSelector.getAttribute("aria-labelledby")
      : null;

    // Open modal via the pill.
    await page
      .getByText(/Hôm nay, bạn muốn gửi lời cảm ơn và ghi nhận đến ai/)
      .click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    // Fill recipient.
    const recipientInput = dialog.getByRole("combobox").first();
    await recipientInput.click();
    await recipientInput.fill(RECIPIENT_QUERY);
    const firstRecipient = dialog.getByRole("option").first();
    await firstRecipient.waitFor({ state: "visible", timeout: 5000 });
    await firstRecipient.click();

    // Fill Danh hiệu.
    const titleInput = dialog.getByRole("combobox").nth(1);
    await titleInput.click();
    const firstTitle = dialog.getByRole("option").first();
    await firstTitle.waitFor({ state: "visible" });
    await firstTitle.click();

    // Body.
    const uniqueBody = `E2E live-board ${Date.now()}`;
    await dialog.getByPlaceholder(/Hãy gửi gắm lời cám ơn/).fill(uniqueBody);

    // Hashtag.
    await dialog.getByRole("button", { name: /Hashtag$/ }).click();
    const hashtagOption = dialog.getByRole("option").first();
    await hashtagOption.waitFor({ state: "visible" });
    await hashtagOption.click();

    // Submit.
    const submitBtn = dialog.getByRole("button", { name: "Gửi" });
    await expect(submitBtn).toBeEnabled();
    await submitBtn.click();

    // Toast + modal closes.
    await expect(page.getByText("Đã gửi Kudo")).toBeVisible({
      timeout: 10_000,
    });
    await expect(dialog).toHaveCount(0);

    // The new Kudo is prepended (optimistic — window event `kudo:created`).
    const topAfter = feed.locator("article").first();
    await expect(topAfter).toBeVisible();
    // New top card carries the unique body we typed.
    await expect(topAfter).toContainText(uniqueBody);
    // ID changed compared to whatever was at top before (unless the feed
    // was empty, in which case topIdBefore is null).
    if (topIdBefore !== null) {
      const topIdAfter = await topAfter.getAttribute("aria-labelledby");
      expect(topIdAfter).not.toBe(topIdBefore);
    }
  });
});
