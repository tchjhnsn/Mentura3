import { expect, test } from "@playwright/test";

// E4 First business (doc "Mentura console: screens, navigation and teams", 2026-11-25), as the run's Owner (setup.ts)
// in its personal team: say a sentence on the team home (T1), see "Setting up", open the business on its Overview (B1,
// Needs you), and the team home shows one more card. E10 (transfer.spec.ts) moves this business to another team.
const stamp = new Date().toISOString().slice(0, 16).replace("T", " ");
const idea = `Production check ${stamp}: sourdough delivered to cafes before 7am`;
const card = 'a[href^="/studio/"]';

test("E4 a business is made in the team, opened, and shown as a card", async ({ page }) => {
  await page.goto("/studio");
  await expect(page).toHaveURL(/\/studio\/[a-z0-9-]+$/, { timeout: 60_000 });
  const home = new URL(page.url()).pathname;
  // A fresh Owner's home is empty (the hero and templates); members.spec.ts made its business in another team.
  const list = page.getByRole("list", { name: "Businesses in this team" });
  await expect(list.or(page.getByText("Or start from a template"))).toBeVisible({ timeout: 60_000 });
  await expect(page.getByText(/can.t reach this team/)).toHaveCount(0);
  const before = await list.locator(card).count();

  await page.getByPlaceholder("Describe the business").fill(idea);
  await page.getByRole("button", { name: "Send" }).click();
  await expect(page.getByText("Setting up the business")).toBeVisible({ timeout: 30_000 });
  const ready = page.getByText("Your business is ready");
  await expect(ready.or(page.getByRole("button", { name: "Try again" }))).toBeVisible({ timeout: 120_000 });
  await expect(ready, await page.locator("section").first().innerText()).toBeVisible();
  await expect(list.locator(card)).toHaveCount(before + 1, { timeout: 60_000 });

  await page.getByRole("link", { name: "Open the business" }).click();
  // The business opens inside its team: /studio/<team>/<business>.
  await expect(page).toHaveURL(new RegExp(`^[^?]*${home}/[^/]+$`), { timeout: 60_000 });
  await expect(page.getByRole("heading", { name: "Needs you", exact: true })).toBeVisible({ timeout: 60_000 });
  await page.screenshot({ path: "test-results/prod/e4-first-business.png", fullPage: true });
});
