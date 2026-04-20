import { test, expect } from "@playwright/test";
import { signInTestUser } from "../_helpers/authSetup";

const CALLER = "tran.nhat.minh@sun-asterisk.com";

/**
 * US3 (FR-006 / FR-006a) — inline-create a new Danh hiệu + a new hashtag
 * in the same submit.
 */
test.describe("Write-Kudo inline-create (US3)", () => {
  test.skip(process.env.RUN_E2E !== "true", "E2E gated behind RUN_E2E=true");

  test.beforeEach(async ({ context, request }) => {
    await signInTestUser(context, request, CALLER);
  });

  test("creates a new title + a new hashtag and submits successfully", async ({
    page,
  }) => {
    const titleName = `E2E Title ${Date.now().toString(36).slice(-6)}`;
    const hashtagLabel = `e2e_${Date.now().toString(36).slice(-6)}`;

    await page.goto("/?write=kudo");
    const dialog = page.getByRole("dialog");

    // Recipient.
    const recipient = dialog.getByRole("combobox").first();
    await recipient.click();
    await recipient.fill("Nguyen");
    await dialog.getByRole("option").first().waitFor({ state: "visible" });
    await dialog.getByRole("option").first().click();

    // Inline-create Danh hiệu.
    const titleInput = dialog.getByRole("combobox").nth(1);
    await titleInput.click();
    await titleInput.fill(titleName);
    const createTitleRow = dialog.getByText(`Tạo mới: "${titleName}"`);
    await createTitleRow.waitFor({ state: "visible" });
    await createTitleRow.click();

    // Body.
    await dialog.getByRole("textbox").click();
    await page.keyboard.type("Chúc mừng thành viên mới");

    // Inline-create hashtag.
    await dialog.getByRole("button", { name: /Hashtag$/ }).click();
    const hashtagInput = dialog.getByRole("combobox").nth(2);
    await hashtagInput.fill(hashtagLabel);
    const createHashtagRow = dialog.getByText(`Tạo mới: "${hashtagLabel}"`);
    await createHashtagRow.waitFor({ state: "visible" });
    await createHashtagRow.click();

    // Submit.
    await dialog.getByRole("button", { name: "Gửi" }).click();
    await expect(page.getByText("Đã gửi Kudo")).toBeVisible({ timeout: 10_000 });
  });

  test("Community Standards link opens in a new tab without closing the modal", async ({
    page,
    context,
  }) => {
    await page.goto("/?write=kudo");
    const dialog = page.getByRole("dialog");

    const link = dialog.getByRole("link", {
      name: /Mở tiêu chuẩn cộng đồng trong tab mới/i,
    });
    const [newTab] = await Promise.all([
      context.waitForEvent("page"),
      link.click(),
    ]);
    await newTab.waitForLoadState("domcontentloaded");
    expect(newTab.url()).toContain("community-standards");
    await expect(dialog).toBeVisible();
  });
});
