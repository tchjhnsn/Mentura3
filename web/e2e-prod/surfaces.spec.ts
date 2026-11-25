import { expect, test, type Page } from "@playwright/test";

// Round 5 on the live site (doc "Mentura console: screens, navigation and teams", "Person and agent: what changes on
// screen"), as the run's Owner (setup.ts) in its personal team, on the business studio.spec.ts made (E4). The file name
// puts it after studio.spec.ts and before transfer.spec.ts, which moves that business away.

test.describe.configure({ mode: "serial" });

/** The business E4 made: the first card on the Owner's personal team home, or null when there is none. */
async function firstBusiness(page: Page): Promise<{ team: string; href: string } | null> {
  await page.goto("/studio");
  await expect(page).toHaveURL(/\/studio\/[a-z0-9-]+$/, { timeout: 60_000 });
  const team = new URL(page.url()).pathname;
  const list = page.getByRole("list", { name: "Businesses in this team" });
  await expect(list.or(page.getByText("Or start from a template"))).toBeVisible({ timeout: 60_000 });
  const card = list.locator('a[href^="/studio/"]').first();
  if (!(await card.count())) return null;
  return { team, href: (await card.getAttribute("href"))! };
}

test("the business home leads with Needs you, or says nothing needs you, then Done by agents", async ({ page }) => {
  const at = await firstBusiness(page);
  test.skip(!at, "E4 made no business");
  await page.goto(at!.href);
  await expect(page.getByRole("heading", { name: "Needs you", exact: true })).toBeVisible({ timeout: 60_000 });
  const waiting = page.getByRole("list", { name: "Decisions waiting on you" });
  await expect(waiting.or(page.getByText("Nothing needs you."))).toBeVisible({ timeout: 60_000 });
  if (await waiting.count()) {
    // The top decision carries the screen's one filled button, which opens it on Decisions.
    const open = page.getByRole("link", { name: "Open decision" });
    await expect(open).toHaveCount(1);
    await expect(open).toHaveAttribute("href", /\/decisions#decision-/);
  }
  await expect(page.getByRole("heading", { name: "Done by agents" })).toBeVisible();
  await page.screenshot({ path: "test-results/prod/r5-needs-you.png", fullPage: true });
});
