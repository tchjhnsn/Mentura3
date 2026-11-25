import { expect, test } from "@playwright/test";
import { emptyState, signOutState } from "./setup";

const STATE = process.env.PROD_CHECK_STATE ?? "test-results/prod/state.json";
test.use({ storageState: emptyState(STATE) });

// An empty console on the live site (doc "Mentura console: screens, navigation and teams", 2026-11-25, tests E1 to
// E3), as the empty account (setup.ts), which no test lets make a business.
// Each test saves a screenshot under test-results/prod.

test("E1 the front door lands on an empty team home", async ({ page }) => {
  await page.goto("/");
  // The console lands on the person's personal team, which is in the URL (round 2, teams).
  await expect(page).toHaveURL(/\/studio\/[a-z0-9-]+$/, { timeout: 60_000 });
  await expect(page.getByRole("heading", { name: "What business do you want to work on?" })).toBeVisible();
  await expect(page.getByText("Or start from a template")).toBeVisible({ timeout: 60_000 });
  await expect(page.locator('main a[href*="/library/"]')).toHaveCount(4);
  await expect(page.getByRole("list", { name: "Businesses in this team" })).toHaveCount(0);
  await expect(page.getByText(/chief of staff|Good evening|Good morning|Good afternoon/i)).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Attach a file" })).toHaveCount(0);
  await expect(page.getByText(/Numbers (on|off)/)).toHaveCount(0);
  await page.screenshot({ path: "test-results/prod/e1-empty-home.png", fullPage: true });
});

test("E2 the switcher holds one team and no businesses", async ({ page }) => {
  await page.goto("/studio");
  await page.getByRole("button", { name: /switch team or business/ }).click();
  const menu = page.getByRole("menu");
  await expect(menu.getByText("Teams")).toBeVisible();
  await expect(menu.getByText(/'s businesses$/)).toHaveCount(1);
  await expect(menu.getByText("No businesses yet")).toBeVisible({ timeout: 60_000 });
  await expect(menu.getByRole("menuitem", { name: "New business" })).toBeVisible();
  await expect(menu.getByText(/^(Personal|Samples|Business Studio)$/)).toHaveCount(0);
  await page.screenshot({ path: "test-results/prod/e2-switcher.png" });
});

test("E3 the account menu holds Personal and signs out", async ({ page, browser, baseURL }) => {
  await page.goto("/studio");
  await page.getByRole("button", { name: "Account menu" }).click();
  const menu = page.getByRole("menu");
  for (const name of ["Your profile", "Meetings", "People", "Account settings", "Appearance", "Sign out"]) {
    await expect(menu.getByRole("menuitem", { name })).toBeVisible();
  }
  await expect(page.getByRole("link", { name: "Screen map" })).toHaveCount(0);
  await page.screenshot({ path: "test-results/prod/e3-account-menu.png" });
  // Sign out with the spare session setup.ts made, so the other tests keep theirs.
  const other = await browser.newContext({ baseURL, storageState: signOutState(STATE) });
  const p2 = await other.newPage();
  await p2.goto("/studio");
  await p2.getByRole("button", { name: "Account menu" }).click();
  await p2.getByRole("menuitem", { name: "Sign out" }).click();
  await expect(p2).toHaveURL(/\/sign-in/, { timeout: 60_000 });
  await other.close();
});
