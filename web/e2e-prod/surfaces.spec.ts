import { expect, test, type Page } from "@playwright/test";

// Round 5 on the live site (doc "Mentura console: screens, navigation and teams", "Person and agent: what changes on
// screen"), as the run's Owner (setup.ts) in its personal team, on the business studio.spec.ts made (E4). The file name
// puts it after studio.spec.ts and before transfer.spec.ts, which moves that business away. The home test is "Needs you";
// the rest are B1, the bottom bar.

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

// B1 Bottom bar: on every page inside a business, and on no team page.
test("the bottom bar is on a business page and not on the team home", async ({ page }) => {
  const at = await firstBusiness(page);
  await expect(page.getByRole("toolbar", { name: "Bottom bar" })).toHaveCount(0);
  test.skip(!at, "E4 made no business");
  await page.goto(at!.href);
  const bar = page.getByRole("toolbar", { name: "Bottom bar" });
  await expect(bar).toBeVisible({ timeout: 60_000 });
  await expect(bar.getByRole("button", { name: /^Stream/ })).toBeVisible();
  await expect(bar.getByRole("button", { name: /^Running/ })).toBeVisible();
  await page.goto(at!.team);
  await expect(page.getByRole("list", { name: "Businesses in this team" })).toBeVisible({ timeout: 60_000 });
  await expect(page.getByRole("toolbar", { name: "Bottom bar" })).toHaveCount(0);
});

test("Stream and Running open with a tap and close with a second tap or Escape", async ({ page }) => {
  const at = await firstBusiness(page);
  test.skip(!at, "E4 made no business");
  await page.goto(at!.href);
  const bar = page.getByRole("toolbar", { name: "Bottom bar" });
  await expect(bar).toBeVisible({ timeout: 60_000 });
  for (const name of ["Stream", "Running"]) {
    const button = bar.getByRole("button", { name: new RegExp(`^${name}`) });
    const panel = page.getByRole("region", { name, exact: true });
    await button.click();
    await expect(panel).toBeVisible();
    await expect(button).toHaveAttribute("aria-expanded", "true");
    await button.click();
    await expect(panel).toHaveCount(0);
    await button.click();
    await expect(panel).toBeVisible();
    if (name === "Stream") {
      // Its rows, or that nothing needs the person, once the read lands; See all opens Decisions.
      await expect(panel.getByRole("list", { name: "Waiting on you" }).or(panel.getByText("Nothing needs you"))).toBeVisible({ timeout: 60_000 });
      await expect(panel.getByRole("link", { name: "See all" })).toHaveAttribute("href", /\/decisions$/);
    } else {
      await expect(panel.getByRole("list", { name: "Running work" }).or(panel.getByText("Nothing is running."))).toBeVisible({ timeout: 60_000 });
    }
    await page.keyboard.press("Escape");
    await expect(panel).toHaveCount(0);
  }
});

test.describe("at phone width", () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });

  test("the bar folds into a chip, and the chip opens a sheet with Stream and Running", async ({ page }) => {
    const at = await firstBusiness(page);
    test.skip(!at, "E4 made no business");
    await page.goto(at!.href);
    await expect(page.getByRole("heading", { name: "Needs you", exact: true })).toBeVisible({ timeout: 60_000 });
    await expect(page.getByRole("toolbar", { name: "Bottom bar" })).toBeHidden();
    const chip = page.getByRole("button", { name: "Open Stream and Running" });
    await expect(chip).toBeVisible();
    await chip.tap();
    const sheet = page.getByRole("dialog", { name: "Stream and Running" });
    await expect(sheet).toBeVisible();
    await expect(sheet.getByRole("tab", { name: "Stream" })).toBeVisible();
    await sheet.getByRole("tab", { name: "Running" }).tap();
    await expect(sheet.getByRole("tab", { name: "Running" })).toHaveAttribute("aria-selected", "true");
    await page.screenshot({ path: "test-results/prod/r5-phone-sheet.png" });
    await page.keyboard.press("Escape");
    await expect(sheet).toBeHidden();
    // No sideways scroll at phone width with the chip on the page.
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  });
});
