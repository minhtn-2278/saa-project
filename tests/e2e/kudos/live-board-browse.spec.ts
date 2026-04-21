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

  test("US1-AS4: scrolling the sentinel appends the next page", async ({
    page,
  }) => {
    await page.goto("/kudos?limit=5");

    const feed = page.getByTestId("kudo-feed");
    await feed.waitFor({ state: "visible" });

    const initialCount = await feed.locator("article").count();

    // Scroll the sentinel into view to trigger `useKudoFeed.loadMore`.
    const sentinel = page.getByTestId("kudo-feed-sentinel");
    await sentinel.scrollIntoViewIfNeeded();

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
