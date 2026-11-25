import { expect, test, type Browser, type BrowserContext, type Page } from "@playwright/test";
import { EMPTY_EMAIL, emptyState } from "./setup";

// Members on the live site (doc "Mentura console: screens, navigation and teams", 2026-11-25, tests E6, E8 and E9). The
// check account (setup.ts) is the Owner and the empty account the invitee. Each run makes one team, named by the run's
// time, and one business in it, which stay on the check account until Delete team (D6) exists. E9 takes the empty
// account off the team again, and setup.ts takes it off any team a failed run left it on, so its console stays empty.
const STATE = process.env.PROD_CHECK_STATE ?? "test-results/prod/state.json";
const stamp = new Date().toISOString().slice(0, 16).replace("T", " ");
const teamName = `Production check members ${stamp}`;

test.describe.configure({ mode: "serial" });

let teamPath = "";
let businessHref = "";
let member: BrowserContext | null = null;

const asMember = async (browser: Browser, baseURL: string | undefined): Promise<Page> => {
  member ??= await browser.newContext({ baseURL, storageState: emptyState(STATE) });
  return member.newPage();
};

test.afterAll(async () => { await member?.close(); });

test("E6 an Owner invites someone as a Member; they open the link, accept and work in the team", async ({ page, browser, baseURL }) => {
  test.setTimeout(300_000);
  // The Owner makes a team and, on D3, invites the empty account as a Member.
  await page.goto("/studio");
  await expect(page).toHaveURL(/\/studio\/[a-z0-9-]+$/, { timeout: 60_000 });
  await page.getByRole("button", { name: /switch team or business/ }).click();
  await page.getByRole("menuitem", { name: "Create team" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Team name").fill(teamName);
  await dialog.getByRole("button", { name: "Create" }).click();
  await expect(dialog.getByRole("heading", { name: "Invite to your new team" })).toBeVisible({ timeout: 60_000 });
  await dialog.getByLabel("Email").fill(EMPTY_EMAIL);
  await dialog.getByRole("button", { name: "Invite", exact: true }).click();
  const link = dialog.getByTestId("invite-link");
  await expect(link).toContainText("/invite/", { timeout: 60_000 });
  const invite = new URL((await link.innerText()).trim()).pathname;
  await page.screenshot({ path: "test-results/prod/e6-invite-step.png" });
  await dialog.getByRole("button", { name: "Done" }).click();
  await expect(page).toHaveURL(/\/studio\/production-check-members-[a-z0-9-]+$/, { timeout: 60_000 });
  teamPath = new URL(page.url()).pathname;

  // One business in the team, so the Member has something to see.
  await page.getByPlaceholder("Describe the business").fill(`Production check ${stamp}: a members test bakery`);
  await page.getByRole("button", { name: "Send" }).click();
  await expect(page.getByText("Your business is ready")).toBeVisible({ timeout: 150_000 });
  const card = page.getByRole("list", { name: "Businesses in this team" }).locator('a[href^="/studio/"]').first();
  await expect(card).toBeVisible({ timeout: 60_000 });
  businessHref = (await card.getAttribute("href")) ?? "";

  // Members, Pending lists the invitation.
  await page.goto(`${teamPath}/members`);
  await page.getByRole("tab", { name: /Pending/ }).click();
  await expect(page.getByRole("list", { name: "Pending invitations" }).getByText(EMPTY_EMAIL)).toBeVisible({ timeout: 60_000 });

  // The invitee opens the link (A3): the team, who invited them and the role; Accept lands on the team.
  const p2 = await asMember(browser, baseURL);
  await p2.goto(invite);
  await expect(p2.getByText(new RegExp(`invited you to join ${teamName} as a Member`))).toBeVisible({ timeout: 60_000 });
  await p2.screenshot({ path: "test-results/prod/e6-invitation.png" });
  await p2.getByRole("button", { name: "Accept" }).click();
  await expect(p2).toHaveURL(new RegExp(`${teamPath}$`), { timeout: 60_000 });
  await expect(p2.getByRole("list", { name: "Businesses in this team" }).locator(`a[href="${businessHref}"]`)).toBeVisible({ timeout: 60_000 });
  await expect(p2.getByPlaceholder("Describe the business")).toBeVisible();
  await p2.getByRole("button", { name: /switch team or business/ }).click();
  const row = p2.getByRole("menu").getByRole("menuitem").filter({ hasText: teamName });
  await expect(row).toContainText("Member");
  await p2.screenshot({ path: "test-results/prod/e6-joined.png" });
  await p2.close();
});

test("E8 the Owner makes the Member a Viewer: they see the businesses, no prompt, and the server refuses a write", async ({ page, browser, baseURL }) => {
  expect(teamPath, "E6 made the team").not.toBe("");
  await page.goto(`${teamPath}/members`);
  const people = page.getByRole("list", { name: "People on this team" });
  await expect(people.getByText(EMPTY_EMAIL)).toBeVisible({ timeout: 60_000 });
  await page.getByRole("combobox", { name: /^Role for / }).filter({ hasText: "Member" }).click();
  await page.getByRole("option", { name: /^Viewer/ }).click();
  await expect(page.getByText(/is now a Viewer\./)).toBeVisible({ timeout: 60_000 });

  const p2 = await asMember(browser, baseURL);
  await p2.goto(teamPath);
  await expect(p2.getByRole("list", { name: "Businesses in this team" }).locator(`a[href="${businessHref}"]`)).toBeVisible({ timeout: 60_000 });
  await expect(p2.getByText("You can view this team's businesses.")).toBeVisible();
  await expect(p2.getByPlaceholder("Describe the business")).toHaveCount(0);
  await expect(p2.getByRole("link", { name: "New business" })).toHaveCount(0);
  await p2.getByRole("button", { name: /switch team or business/ }).click();
  await expect(p2.getByRole("menu").getByRole("menuitem", { name: "New business" })).toHaveCount(0);
  await p2.keyboard.press("Escape");
  await p2.screenshot({ path: "test-results/prod/e8-viewer.png" });

  // A write straight to the server (an upload into the business's Files) is refused for a Viewer.
  const id = businessHref.split("/").pop() ?? "";
  const team = teamPath.split("/").pop() ?? "";
  const res = await p2.request.post(`/studio/r/${id}/files/raw?team=${encodeURIComponent(team)}`, {
    multipart: { file: { name: "viewer-check.txt", mimeType: "text/plain", buffer: Buffer.from("A Viewer cannot write this.") } },
  });
  expect(res.status()).toBe(400);
  expect(await res.text()).toContain("a Viewer cannot change them");
  await p2.close();
});

test("E9 the member leaves the team, lands on their own team, and the old team is gone from the switcher", async ({ browser, baseURL }) => {
  expect(teamPath, "E6 made the team").not.toBe("");
  const p2 = await asMember(browser, baseURL);
  await p2.goto(`${teamPath}/settings`);
  await p2.getByRole("button", { name: "Leave team" }).click();
  const dialog = p2.getByRole("dialog");
  await expect(dialog.getByRole("heading", { name: `Leave ${teamName}?` })).toBeVisible();
  await dialog.getByRole("button", { name: "Leave team" }).click();
  await expect(p2).toHaveURL(/\/studio\/[a-z0-9-]+$/, { timeout: 60_000 });
  expect(new URL(p2.url()).pathname).not.toBe(teamPath);
  await expect(p2.getByRole("heading", { name: "What business do you want to work on?" })).toBeVisible({ timeout: 60_000 });
  await p2.getByRole("button", { name: /switch team or business/ }).click();
  const menu = p2.getByRole("menu");
  await expect(menu.getByText(/'s businesses$/)).toHaveCount(1);
  await expect(menu.getByText(teamName)).toHaveCount(0);
  await p2.screenshot({ path: "test-results/prod/e9-left.png" });
  // The team's URL now refuses them.
  await p2.goto(teamPath);
  await expect(p2.getByRole("heading", { name: "You are not a member of this team." })).toBeVisible({ timeout: 60_000 });
  await p2.close();
});
