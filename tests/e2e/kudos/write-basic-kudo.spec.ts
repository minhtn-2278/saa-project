import { test, expect } from "@playwright/test";
import { signInTestUser } from "../_helpers/authSetup";

const CALLER = "tran.nhat.minh@sun-asterisk.com";
const RECIPIENT = "Nguyen";

/**
 * US1 acceptance scenarios (P1) — basic Kudo send flow.
 *
 * The `setup` project stores an OAuth-authenticated user; these tests
 * substitute that with the test-only sign-in endpoint so they can run
 * deterministically without a real Google login. Requires the app to be
 * running under `NODE_ENV=test` with `TEST_AUTH_SECRET` matching the app.
 *
 * Gated: the suite skips unless `RUN_E2E=true` — protects against
 * accidentally running against a prod-like environment.
 */
test.describe("Write-Kudo basic flow (US1)", () => {
  test.skip(
    process.env.RUN_E2E !== "true",
    "E2E gated behind RUN_E2E=true",
  );

  test.beforeEach(async ({ context, request }) => {
    await signInTestUser(context, request, CALLER);
  });

  test("US1-AS1..AS4: opens modal, picks recipient + title + body + hashtag, submits", async ({
    page,
  }) => {
    await page.goto("/?write=kudo");

    // Modal should be visible with title.
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(
      dialog.getByText("Gửi lời cám ơn và ghi nhận đến đồng đội"),
    ).toBeVisible();

    // Fill recipient.
    const recipientInput = dialog.getByRole("combobox").first();
    await recipientInput.click();
    await recipientInput.fill(RECIPIENT);
    // Wait for autocomplete, pick the first option.
    const firstOption = dialog.getByRole("option").first();
    await firstOption.waitFor({ state: "visible", timeout: 5000 });
    await firstOption.click();

    // Fill Danh hiệu.
    const titleInput = dialog.getByRole("combobox").nth(1);
    await titleInput.click();
    const firstTitle = dialog.getByRole("option").first();
    await firstTitle.waitFor({ state: "visible" });
    await firstTitle.click();

    // Body.
    await dialog
      .getByPlaceholder(/Hãy gửi gắm lời cám ơn/)
      .fill("Cám ơn bạn đã giúp đỡ!");

    // Add hashtag from the picker popover.
    await dialog.getByRole("button", { name: /Hashtag$/ }).click();
    const hashtagOption = dialog.getByRole("option").first();
    await hashtagOption.waitFor({ state: "visible" });
    await hashtagOption.click();

    // Submit.
    const submitBtn = dialog.getByRole("button", { name: "Gửi" });
    await expect(submitBtn).toBeEnabled();
    await submitBtn.click();

    // Toast + modal closes.
    await expect(page.getByText("Đã gửi Kudo")).toBeVisible({ timeout: 10_000 });
    await expect(dialog).toHaveCount(0);
  });
});
