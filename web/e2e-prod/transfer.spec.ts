import { expect, test } from "@playwright/test";
import { runAccounts } from "./setup";

// Moving and removing on the live site (doc "Mentura console: screens, navigation and teams", 2026-11-25, test E10,
// with D6 and the A4 page), as the run's Owner (setup.ts). E10 moves the business E4 made from the Owner's personal team
// to a team made for it, then D6 deletes that team with the business in it. Nothing is left for teardown.ts but the
// accounts. The A4 test only reads the Delete account page: teardown.ts deletes the accounts through the same route.
const STATE = process.env.PROD_CHECK_STATE ?? "test-results/prod/state.json";
const stamp = new Date().toISOString().slice(0, 16).replace("T", " ");

test.describe.configure({ mode: "serial" });

let moved: { team: string; teamName: string; href: string } | null = null;

test("E10 Transfer moves a business to another team, and its old URL redirects", async ({ page }) => {
  await page.goto("/studio");
  await expect(page).toHaveURL(/\/studio\/[a-z0-9-]+$/, { timeout: 60_000 });
  const personal = new URL(page.url()).pathname;
  const list = page.getByRole("list", { name: "Businesses in this team" });
  await expect(list.or(page.getByText("Or start from a template"))).toBeVisible({ timeout: 60_000 });
  const card = list.locator('a[href^="/studio/"]').first();
  test.skip(!(await card.count()), "E4 made no business to transfer");
  const oldHref = (await card.getAttribute("href"))!;
  const name = (await card.innerText()).split("\n")[0]!.trim();
  const id = oldHref.split("/").pop()!;

  // A team to move it to.
  const teamName = `Production check transfer ${stamp}`;
  await page.getByRole("button", { name: /switch team or business/ }).click();
  await page.getByRole("menuitem", { name: "Create team" }).click();
  const create = page.getByRole("dialog");
  await create.getByLabel("Team name").fill(teamName);
  await create.getByRole("button", { name: "Create" }).click();
  await expect(create.getByRole("heading", { name: "Invite to your new team" })).toBeVisible({ timeout: 60_000 });
  await create.getByRole("button", { name: "Skip" }).click();
  await expect(page).toHaveURL(/\/studio\/production-check-transfer-[a-z0-9-]+$/, { timeout: 60_000 });
  const team = new URL(page.url()).pathname.split("/")[2]!;

  // D5 from the business card's More menu on the personal team home.
  await page.goto(personal);
  await page.getByRole("button", { name: `More for ${name}` }).first().click();
  await page.getByRole("menuitem", { name: "Transfer" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("heading", { name: `Transfer ${name}` })).toBeVisible();
  await dialog.getByRole("radio", { name: teamName }).click();
  await expect(dialog.getByRole("radio", { name: teamName })).toHaveAttribute("aria-checked", "true");
  await dialog.getByRole("button", { name: "Transfer" }).click();

  // It opens in its new team, at the new team's URL.
  await expect(page).toHaveURL(new RegExp(`/studio/${team}/${id}(-\\d+)?$`), { timeout: 120_000 });
  const href = new URL(page.url()).pathname;
  await expect(page.getByRole("heading", { name: "Needs you", exact: true })).toBeVisible({ timeout: 60_000 });
  await page.screenshot({ path: "test-results/prod/e10-transferred.png" });

  // The old URL sends the person to the business in its new team.
  await page.goto(oldHref);
  await expect(page).toHaveURL(new RegExp(`${href}$`), { timeout: 60_000 });
  await expect(page.getByRole("heading", { name: "Needs you", exact: true })).toBeVisible({ timeout: 60_000 });

  // The personal team no longer lists it.
  await page.goto(personal);
  await expect(page.getByText("Or start from a template").or(list)).toBeVisible({ timeout: 60_000 });
  await expect(page.locator(`main a[href="${oldHref}"]`)).toHaveCount(0);
  moved = { team, teamName, href };
});

test("D6 Delete team removes the team and the business in it", async ({ page }) => {
  test.skip(!moved, "E10 made no team to delete");
  const { team, teamName, href } = moved!;
  await page.goto(`/studio/${team}/settings`);
  await page.getByRole("button", { name: "Delete team" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("heading", { name: `Delete ${teamName}?` })).toBeVisible();
  await expect(dialog.getByRole("list", { name: "Businesses deleted with the team" })).toBeVisible({ timeout: 60_000 });
  const confirm = dialog.getByRole("button", { name: "Delete team" });
  await expect(confirm).toBeDisabled();
  await dialog.getByLabel(`Type ${teamName} to confirm`).fill(teamName);
  await confirm.click();

  // Back on the personal team, and the switcher no longer lists the team.
  await expect(page).not.toHaveURL(new RegExp(`/studio/${team}`), { timeout: 120_000 });
  await expect(page).toHaveURL(/\/studio\/[a-z0-9-]+$/);
  await page.getByRole("button", { name: /switch team or business/ }).click();
  await expect(page.getByRole("menu").getByText(teamName)).toHaveCount(0);
  await page.keyboard.press("Escape");

  for (const path of [`/studio/${team}`, href]) {
    await page.goto(path);
    await expect(page.getByRole("heading", { name: "You are not a member of this team." })).toBeVisible({ timeout: 60_000 });
  }
  await page.screenshot({ path: "test-results/prod/d6-team-deleted.png" });
});

test("A4 Delete account names the teams and waits for the email typed", async ({ page }) => {
  const { owner } = runAccounts(STATE);
  await page.goto("/settings/account");
  await page.getByRole("link", { name: /Delete account/ }).click();
  await expect(page).toHaveURL(/\/settings\/account\/delete$/, { timeout: 60_000 });
  await expect(page.getByText("Deleted with your account")).toBeVisible({ timeout: 60_000 });
  const button = page.getByRole("button", { name: "Delete account" });
  await expect(button).toBeDisabled();
  await page.getByLabel("Your email address").fill(owner);
  await expect(button).toBeEnabled();
  await page.screenshot({ path: "test-results/prod/a4-delete-account.png" });
  // Not pressed: teardown.ts deletes the account through the same route.
});
