import { test, expect } from "@playwright/test";
import { signInTestUser } from "../_helpers/authSetup";

const CALLER = "tran.nhat.minh@sun-asterisk.com";

/**
 * US2 acceptance — rich-text formatting + @mention + image attachments.
 * Gated behind RUN_E2E=true.
 */
test.describe("Write-Kudo rich content (US2)", () => {
  test.skip(
    process.env.RUN_E2E !== "true",
    "E2E gated behind RUN_E2E=true",
  );

  test.beforeEach(async ({ context, request }) => {
    await signInTestUser(context, request, CALLER);
  });

  test("bold + 1 mention + 2 images round-trip through the board", async ({
    page,
  }) => {
    await page.goto("/?write=kudo");
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    // Recipient
    const recipientInput = dialog.getByRole("combobox").first();
    await recipientInput.click();
    await recipientInput.fill("Nguyen");
    const firstOption = dialog.getByRole("option").first();
    await firstOption.waitFor({ state: "visible", timeout: 5000 });
    await firstOption.click();

    // Title
    const titleInput = dialog.getByRole("combobox").nth(1);
    await titleInput.click();
    const firstTitle = dialog.getByRole("option").first();
    await firstTitle.waitFor({ state: "visible" });
    await firstTitle.click();

    // Rich-text: type body, select it, click Bold.
    const editor = dialog.getByRole("textbox");
    await editor.click();
    await page.keyboard.type("Cám ơn đội ngũ");
    await page.keyboard.press("Control+A");
    await dialog.getByRole("button", { name: "Bold" }).click();

    // @mention — triggers the suggestion popover.
    await editor.click();
    await page.keyboard.press("End");
    await page.keyboard.type(" @Pham");
    const mentionOpt = page
      .getByRole("option")
      .filter({ hasText: /Phạm/i })
      .first();
    await mentionOpt.waitFor({ state: "visible", timeout: 5000 });
    await mentionOpt.click();

    // Hashtag
    await dialog.getByRole("button", { name: /Hashtag$/ }).click();
    const hashtagOpt = dialog.getByRole("option").first();
    await hashtagOpt.waitFor({ state: "visible" });
    await hashtagOpt.click();

    // Images — pick two small fixtures.
    const fileInput = dialog
      .getByRole("button", { name: "Image" })
      .locator("..")
      .locator("input[type=file]");
    const smallPng = Buffer.from(
      "89504E470D0A1A0A0000000D4948445200000001000000010806000000" +
        "1F15C4890000000D49444154789C6360000000020001E221BC330000000049454E44AE426082",
      "hex",
    );
    await fileInput.setInputFiles([
      { name: "a.png", mimeType: "image/png", buffer: smallPng },
      { name: "b.png", mimeType: "image/png", buffer: smallPng },
    ]);
    // Wait for the "uploading" → "ready" transition (≈ 2s budget).
    await expect(dialog.locator("img").first()).toBeVisible({ timeout: 8000 });

    // Submit.
    const submit = dialog.getByRole("button", { name: "Gửi" });
    await expect(submit).toBeEnabled();
    await submit.click();

    await expect(page.getByText("Đã gửi Kudo")).toBeVisible({ timeout: 10_000 });
  });
});
