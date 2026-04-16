import { test, expect } from "@playwright/test";

test.describe("Homepage SAA", () => {
  test("renders hero section with ROOT FURTHER logo", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByAltText("Root Further - SAA 2025")
    ).toBeVisible();
  });

  test("renders countdown timer", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("timer")).toBeVisible();
    await expect(page.getByText("DAYS")).toBeVisible();
    await expect(page.getByText("HOURS")).toBeVisible();
    await expect(page.getByText("MINUTES")).toBeVisible();
  });

  test("renders 6 award cards", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Top Talent")).toBeVisible();
    await expect(page.getByText("Top Project Leader")).toBeVisible();
    await expect(page.getByText("Best Manager")).toBeVisible();
    await expect(
      page.getByText("MVP (Most Valuable Person)")
    ).toBeVisible();
  });

  test("renders header with nav links", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("About SAA 2025")).toBeVisible();
    await expect(page.getByText("Awards Information")).toBeVisible();
    await expect(page.getByText("Sun* Kudos")).toBeVisible();
  });

  test("renders floating action button", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("button", { name: "Quick actions" })
    ).toBeVisible();
  });

  test("FAB opens menu with 2 options", async ({ page }) => {
    await page.goto("/");
    await page
      .getByRole("button", { name: "Quick actions" })
      .click();
    await expect(page.getByText("Viết Kudo")).toBeVisible();
    await expect(page.getByText("Thể lệ")).toBeVisible();
  });

  test("renders Kudos promo section", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Sun* Kudos")).toBeVisible();
    await expect(page.getByText("Phong trào ghi nhận")).toBeVisible();
  });

  test("no horizontal scroll at desktop viewport", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1024 });
    await page.goto("/");

    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });

    expect(hasHorizontalScroll).toBe(false);
  });
});
