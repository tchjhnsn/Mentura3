import { expect, test } from "@playwright/test";
import { emptyState } from "./setup";

// Teams on the live site (doc "Mentura console: screens, navigation and teams", 2026-11-25, tests E5 and E7), as the
// run's Owner (setup.ts). E5 makes one team per run, named by the run's time, which goes when teardown.ts deletes the
// Owner. E7 opens the Owner's team as the run's invitee, who is on none of the Owner's teams by then (E9).
const STATE = process.env.PROD_CHECK_STATE ?? "test-results/prod/state.json";
const stamp = new Date().toISOString().slice(0, 16).replace("T", " ");

test("E5 Create team opens the new team's empty home, and the switcher lists it", async ({ page }) => {
  await page.goto("/studio");
  await expect(page).toHaveURL(/\/studio\/[a-z0-9-]+$/, { timeout: 60_000 });
  const personal = new URL(page.url()).pathname;
  await page.getByRole("button", { name: /switch team or business/ }).click();
  await page.getByRole("menuitem", { name: "Create team" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("heading", { name: "Create team" })).toBeVisible();
  const name = `Production check ${stamp}`;
  await dialog.getByLabel("Team name").fill(name);
  await dialog.getByRole("button", { name: "Create" }).click();
  await expect(dialog.getByRole("heading", { name: "Invite to your new team" })).toBeVisible({ timeout: 60_000 });
  await dialog.getByRole("button", { name: "Skip" }).click();

  // The new team's empty home, at its own URL.
  await expect(page).toHaveURL(/\/studio\/production-check-[a-z0-9-]+$/, { timeout: 60_000 });
  expect(new URL(page.url()).pathname).not.toBe(personal);
  await expect(page.getByText("Or start from a template")).toBeVisible({ timeout: 60_000 });
  await expect(page.getByRole("list", { name: "Businesses in this team" })).toHaveCount(0);

  await page.getByRole("button", { name: /switch team or business/ }).click();
  const menu = page.getByRole("menu");
  await expect(menu.getByText(name)).toBeVisible();
  await expect(menu.getByText(/'s businesses$/)).toHaveCount(1);
  await expect(menu.getByText("No businesses yet")).toBeVisible({ timeout: 60_000 });
  await page.screenshot({ path: "test-results/prod/e5-create-team.png" });
});

test("E7 someone who is not on a team is refused at its URL and sees none of it", async ({ page, browser, baseURL }) => {
  // The Owner's personal team and one of its businesses (E4 made one).
  await page.goto("/studio");
  await expect(page).toHaveURL(/\/studio\/[a-z0-9-]+$/, { timeout: 60_000 });
  const team = new URL(page.url()).pathname;
  const list = page.getByRole("list", { name: "Businesses in this team" });
  await expect(list.or(page.getByText("Or start from a template"))).toBeVisible({ timeout: 60_000 });
  const first = list.locator('a[href^="/studio/"]').first();
  const business = (await first.count()) ? await first.getAttribute("href") : null;
  const businessName = business ? (await first.innerText()).split("\n")[0]!.trim() : null;

  const other = await browser.newContext({ baseURL, storageState: emptyState(STATE) });
  const p2 = await other.newPage();
  for (const path of [team, ...(business ? [business, `${business}/files`] : [])]) {
    await p2.goto(path);
    await expect(p2.getByRole("heading", { name: "You are not a member of this team." })).toBeVisible({ timeout: 60_000 });
    await expect(p2.getByRole("list", { name: "Businesses in this team" })).toHaveCount(0);
    await expect(p2.getByRole("heading", { name: "Needs you", exact: true })).toHaveCount(0);
    if (businessName) await expect(p2.getByText(businessName, { exact: true })).toHaveCount(0);
  }
  await p2.screenshot({ path: "test-results/prod/e7-isolation.png" });
  await other.close();
});
