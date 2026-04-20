import { test, expect } from "@playwright/test";
import { signInTestUser } from "../_helpers/authSetup";

const CALLER = "tran.nhat.minh@sun-asterisk.com";

/**
 * US4 acceptance scenarios — validation + block-submit + recover.
 */
test.describe("Write-Kudo validation (US4)", () => {
  test.skip(
    process.env.RUN_E2E !== "true",
    "E2E gated behind RUN_E2E=true",
  );

  test.beforeEach(async ({ context, request }) => {
    await signInTestUser(context, request, CALLER);
  });

  test("AS1..AS4: Gửi stays disabled until required fields are valid", async ({
    page,
  }) => {
    await page.goto("/?write=kudo");
    const dialog = page.getByRole("dialog");
    const submit = dialog.getByRole("button", { name: "Gửi" });
    await expect(submit).toBeDisabled();

    // Fill body only — still disabled.
    await dialog
      .getByPlaceholder(/Hãy gửi gắm lời cám ơn/)
      .fill("hi");
    await expect(submit).toBeDisabled();
  });

  test("AS7: network failure keeps the modal open + submit returns to idle", async ({
    page,
  }) => {
    await page.route("**/api/kudos", (route) =>
      route.fulfill({
        status: 500,
        body: JSON.stringify({
          error: { code: "INTERNAL_ERROR", message: "boom" },
        }),
        contentType: "application/json",
      }),
    );

    await page.goto("/?write=kudo");
    const dialog = page.getByRole("dialog");

    // Fill minimal required fields.
    await dialog.getByRole("combobox").first().click();
    await dialog.getByRole("combobox").first().fill("Nguyen");
    const firstOption = dialog.getByRole("option").first();
    await firstOption.waitFor({ state: "visible", timeout: 5000 });
    await firstOption.click();

    await dialog.getByRole("combobox").nth(1).click();
    const firstTitle = dialog.getByRole("option").first();
    await firstTitle.waitFor({ state: "visible" });
    await firstTitle.click();

    await dialog.getByPlaceholder(/Hãy gửi gắm lời cám ơn/).fill("hi");
    await dialog.getByRole("button", { name: /Hashtag$/ }).click();
    const htOpt = dialog.getByRole("option").first();
    await htOpt.waitFor({ state: "visible" });
    await htOpt.click();

    await dialog.getByRole("button", { name: "Gửi" }).click();

    // Modal stays open; submit button returns to enabled.
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("button", { name: "Gửi" })).toBeEnabled();
  });
});
