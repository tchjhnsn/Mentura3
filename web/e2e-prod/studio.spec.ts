import { expect, test } from "@playwright/test";

// The Studio on the live site, as the check account (setup.ts): the hosted business store answers, a business made
// from a sentence is listed, and it opens with Naive's docket. Each run makes one business, named by the run's time.
const stamp = new Date().toISOString().slice(0, 16).replace("T", " ");
const idea = `Production check ${stamp}: sourdough delivered to cafes before 7am`;

test("a business is made, listed and opened on the hosted store", async ({ page }) => {
  await page.goto("/studio");
  // The check account keeps the businesses earlier runs made, so its home shows them as cards (T1).
  const list = page.getByRole("list", { name: "Businesses in this team" });
  await expect(list.or(page.getByText("Or start from a template"))).toBeVisible({ timeout: 60_000 });
  await expect(page.getByText(/can.t reach this team/)).toHaveCount(0);
  const before = await list.locator('a[href^="/studio/v/"]').count();

  await page.getByPlaceholder("Describe the business").fill(idea);
  await page.getByRole("button", { name: "Send" }).click();
  const ready = page.getByText("Your business is ready");
  await expect(ready.or(page.getByRole("button", { name: "Try again" }))).toBeVisible({ timeout: 120_000 });
  await expect(ready, await page.locator("section").first().innerText()).toBeVisible();
  await expect(list.locator('a[href^="/studio/v/"]')).toHaveCount(before + 1, { timeout: 60_000 });

  await page.getByRole("link", { name: "Open the business" }).click();
  await expect(page).toHaveURL(/\/studio\/v\//, { timeout: 60_000 });
  await expect(page.getByRole("heading", { name: "Needs you next" })).toBeVisible({ timeout: 60_000 });
});
