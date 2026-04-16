import { test as setup, expect } from "@playwright/test";

const authFile = "tests/e2e/.auth/user.json";

setup("authenticate", async ({ page }) => {
  // Navigate to login page
  await page.goto("/login");

  // Click the Google login button
  await page.getByRole("button", { name: /login with google/i }).click();

  // Wait for Google OAuth flow to complete and redirect to homepage
  // The user must complete the Google login manually on the first run.
  // After that, the session will be saved and reused.
  await page.waitForURL("/", { timeout: 120_000 });

  // Verify we're on the authenticated homepage
  await expect(page.getByRole("banner")).toBeVisible();

  // Save authentication state (cookies + localStorage)
  await page.context().storageState({ path: authFile });
});
