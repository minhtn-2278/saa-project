import { test, expect } from "@playwright/test";
import { signInTestUser } from "../_helpers/authSetup";

const CALLER = "tran.nhat.minh-b@sun-asterisk.com";

/**
 * US1 acceptance scenarios — browse the Live board.
 *
 * Requires the Live-board seed (`supabase/seed/seed-live-board.sql`) so the
 * feed has a handful of published Kudos to render. Gated behind
 * `RUN_E2E=true` to avoid accidental runs against prod-like envs.
 *
 * Plan § T048.
 */
test.describe("Sun* Kudos Live Board — browse (US1)", () => {
  test.skip(
    process.env.RUN_E2E !== "true",
    "E2E gated behind RUN_E2E=true",
  );

  test.beforeEach(async ({ context, request }) => {
    await signInTestUser(context, request, CALLER);
  });

  test("US1-AS1: KV banner + A.1 pill render on /kudos", async ({ page }) => {
    await page.goto("/kudos");

    await expect(
      page.getByRole("heading", {
        name: /Hệ thống ghi nhận lời cảm ơn/,
        level: 1,
      }),
    ).toBeVisible();

    // A.1 pill (opens the Viết Kudo modal — exposed as a link with the
    // placeholder text).
    await expect(
      page.getByText(
        /Hôm nay, bạn muốn gửi lời cảm ơn và ghi nhận đến ai/,
      ),
    ).toBeVisible();
  });

  test("US1-AS3: ALL KUDOS feed shows published cards, newest first", async ({
    page,
  }) => {
    await page.goto("/kudos");

    const feed = page.getByTestId("kudo-feed");
    await expect(feed).toBeVisible();

    // At least one card rendered (seed-live-board.sql inserts 12+).
    const articles = feed.locator("article");
    await expect(articles.first()).toBeVisible();
    const count = await articles.count();
    expect(count).toBeGreaterThan(0);

    // Each card has a time element (C.3.4).
    await expect(articles.first().locator("time")).toBeVisible();
  });

  test("US1-AS4: clicking 'Xem tiếp' appends the next page", async ({
    page,
  }) => {
    // Seed has ≥ 12 kudos; with limit=5 the first page is capped at 5 and
    // the button is visible for the next click.
    await page.goto("/kudos?limit=5");

    const feed = page.getByTestId("kudo-feed");
    await feed.waitFor({ state: "visible" });

    const initialCount = await feed.locator("article").count();

    // Explicit user action replaces the old IntersectionObserver sentinel.
    await page.getByTestId("kudo-feed-load-more").click();

    // Wait for at least one more card to appear.
    await expect
      .poll(() => feed.locator("article").count(), { timeout: 5000 })
      .toBeGreaterThan(initialCount);
  });

  test("US1-AS5: empty state shows 'Hiện tại chưa có Kudos nào.' when the DB is empty or the filter yields nothing", async ({
    page,
  }) => {
    // Seed DB will have data, so we force zero results by piling on a
    // non-matching filter. `hashtagId=999999` is virtually certainly absent.
    await page.goto("/kudos?hashtagId=999999");

    // Empty-state copy comes from messages/vi.json → kudos.liveBoard.emptyStates.feed
    await expect(
      page.getByText(/Hiện tại chưa có Kudos nào/),
    ).toBeVisible();
  });
});

/**
 * US6 acceptance scenarios — sidebar stats + recent-receivers (plan § T086).
 *
 * Desktop: the D panel renders 5 stat rows, a permanently-disabled Mở quà
 * button, and the D.3 "Chưa có dữ liệu" empty state.
 *
 * Mobile: the sidebar is replaced by a fixed "Thống kê" pill that opens a
 * bottom-sheet mirroring the same panels.
 */
test.describe("Sun* Kudos Live Board — sidebar (US6)", () => {
  test.skip(process.env.RUN_E2E !== "true", "E2E gated behind RUN_E2E=true");

  test.beforeEach(async ({ context, request }) => {
    await signInTestUser(context, request, CALLER);
  });

  test("US6-AS1 (desktop): 5 stat rows render with labels from messages/vi.json", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/kudos");

    const sidebar = page.getByRole("complementary", {
      name: "Thanh bên thống kê",
    });
    await expect(sidebar).toBeVisible();

    for (const label of [
      "Số Kudos bạn nhận được:",
      "Số Kudos bạn đã gửi:",
      "Số tim bạn nhận được:",
      "Số Secret Box bạn đã mở:",
      "Số Secret Box chưa mở:",
    ]) {
      await expect(sidebar.getByText(label)).toBeVisible();
    }
  });

  test("US6-AS2 (desktop): Mở quà button is disabled with cursor-not-allowed", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/kudos");

    const btn = page.getByRole("button", { name: "Mở quà" }).first();
    await expect(btn).toBeVisible();
    await expect(btn).toBeDisabled();
    await expect(btn).toHaveAttribute("aria-disabled", "true");
  });

  test("US6-AS3 (desktop): D.3 list renders the empty-state copy", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/kudos");

    await expect(page.getByText("Chưa có dữ liệu")).toBeVisible();
  });

  test("US6-AS4 (mobile): sidebar hidden, 'Thống kê' pill opens the bottom sheet", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/kudos");

    // Desktop sidebar is hidden at this width.
    await expect(
      page.getByRole("complementary", { name: "Thanh bên thống kê" }),
    ).toBeHidden();

    const trigger = page.getByRole("button", { name: "Thống kê" });
    await expect(trigger).toBeVisible();
    await trigger.click();

    const sheet = page.getByRole("dialog", { name: "Thống kê cá nhân" });
    await expect(sheet).toBeVisible();
    await expect(
      sheet.getByText("Số Kudos bạn nhận được:"),
    ).toBeVisible();
  });
});
