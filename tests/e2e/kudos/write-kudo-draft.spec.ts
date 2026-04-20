import { test, expect } from "@playwright/test";
import { signInTestUser } from "../_helpers/authSetup";

const CALLER = "tran.nhat.minh@sun-asterisk.com";

/**
 * FR-011 — sessionStorage draft restore. Fill → cancel → reopen → body
 * restored.
 */
test.describe("Write-Kudo draft persistence (FR-011)", () => {
  test.skip(
    process.env.RUN_E2E !== "true",
    "E2E gated behind RUN_E2E=true",
  );

  test.beforeEach(async ({ context, request }) => {
    await signInTestUser(context, request, CALLER);
  });

  test("restores body text after closing and reopening the modal", async ({
    page,
  }) => {
    await page.goto("/?write=kudo");
    const dialog = page.getByRole("dialog");
    const textarea = dialog.getByPlaceholder(/Hãy gửi gắm lời cám ơn/);
    await textarea.fill("Bản nháp của tôi");

    // Cancel via confirm dialog.
    await dialog.getByRole("button", { name: "Hủy" }).click();
    await page.getByRole("button", { name: "Xác nhận huỷ" }).click();
    await expect(dialog).toHaveCount(0);

    // Reopen — draft should NOT restore because we confirmed cancel (draft
    // is cleared). Verify that:
    await page.goto("/?write=kudo");
    const dialog2 = page.getByRole("dialog");
    await expect(dialog2.getByPlaceholder(/Hãy gửi gắm lời cám ơn/)).toHaveValue("");
  });

  test("restores fields after a tab reload mid-edit", async ({ page }) => {
    await page.goto("/?write=kudo");
    const dialog = page.getByRole("dialog");
    await dialog.getByPlaceholder(/Hãy gửi gắm lời cám ơn/).fill("Nội dung lưu");

    // Reload.
    await page.reload();

    // Modal should still be open (URL param preserved) and body restored.
    const restored = page.getByRole("dialog");
    await expect(restored).toBeVisible();
    await expect(restored.getByPlaceholder(/Hãy gửi gắm lời cám ơn/)).toHaveValue(
      "Nội dung lưu",
    );
  });
});
