import { test, expect } from "@playwright/test";
import { signInTestUser } from "../_helpers/authSetup";

const CALLER = "tran.nhat.minh@sun-asterisk.com";

/**
 * US3 — anonymous submit with a custom alias.
 * Gated behind RUN_E2E=true.
 */
test.describe("Write-Kudo anonymous (US3)", () => {
  test.skip(process.env.RUN_E2E !== "true", "E2E gated behind RUN_E2E=true");

  test.beforeEach(async ({ context, request }) => {
    await signInTestUser(context, request, CALLER);
  });

  test("anonymous toggle reveals alias input; alias appears as sender on the board", async ({
    page,
  }) => {
    await page.goto("/?write=kudo");
    const dialog = page.getByRole("dialog");

    // Fill required fields.
    const recipient = dialog.getByRole("combobox").first();
    await recipient.click();
    await recipient.fill("Nguyen");
    await dialog.getByRole("option").first().waitFor({ state: "visible" });
    await dialog.getByRole("option").first().click();

    const title = dialog.getByRole("combobox").nth(1);
    await title.click();
    await dialog.getByRole("option").first().waitFor({ state: "visible" });
    await dialog.getByRole("option").first().click();

    await dialog.getByRole("textbox").click();
    await page.keyboard.type("Cám ơn ẩn danh");

    await dialog.getByRole("button", { name: /Hashtag$/ }).click();
    await dialog.getByRole("option").first().waitFor({ state: "visible" });
    await dialog.getByRole("option").first().click();

    // Toggle anonymous + type the alias.
    const anonToggle = dialog.getByRole("checkbox");
    await anonToggle.check();
    const aliasInput = dialog.getByPlaceholder(/Nhập tên hiển thị khi gửi ẩn danh/);
    await expect(aliasInput).toBeVisible();
    await aliasInput.fill("Thỏ 7 màu");

    // Submit.
    await dialog.getByRole("button", { name: "Gửi" }).click();
    await expect(page.getByText("Đã gửi Kudo")).toBeVisible({ timeout: 10_000 });

    // Verify on the board.
    await page.goto("/kudos");
    await expect(page.getByText("Thỏ 7 màu")).toBeVisible();
  });
});
