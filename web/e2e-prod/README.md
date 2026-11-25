# Production check

Browser tests that run against the live site (https://mentura.xyz by default) as one standing check account, so a change can be proved end to end on production, not only on a local server.

## Run it

```sh
cd web
NEON_API_KEY=... NEON_PROJECT_ID=<project> NEON_BRANCH_ID=<production branch> pnpm e2e:prod
```

`PROD_CHECK_DATABASE_URL` (the owner URL of the identity database) can stand in for the three Neon variables. `PROD_BASE_URL` points it at another deployment. In a container whose Playwright differs from the pinned one, set `PLAYWRIGHT_CHROMIUM` to the browser's path.

## The check account

- It is `production-check@mentura.xyz` (`PROD_CHECK_EMAIL` to change), named "Mentura production check". The first run makes it through the site's own sign-up; later runs reuse it, because the app has no account deletion yet.
- Its password is never stored. `setup.ts` writes a new random password's hash to the account row through the identity database's owner on every run, signs in, and keeps only the session cookie in `test-results/prod/state.json`, which git ignores.
- It is an ordinary account: the row policy on the business store keeps its businesses apart from everyone else's, and it sees nothing of anyone else's.

## What it checks

A second standing account, `production-check-empty@mentura.xyz` ("Empty console check", `PROD_CHECK_EMPTY_EMAIL` to change), never makes a business, so its console is always empty. Its password is reset the same way, and setup signs it in twice so one test can sign out. (The business store is append-only, so the check account's own businesses cannot be removed.)

`console-empty.spec.ts` (doc "Mentura console: screens, navigation and teams", tests E1 to E3): `/` lands on an empty team home with four templates and no samples, no debug controls and no chief of staff copy; the team switcher holds one team, no businesses and New business; the account menu holds Your profile, Meetings, People, Account settings, Appearance and Sign out, and Sign out works. Screenshots go to `test-results/prod`.

`console-empty.spec.ts` expects `/` to land on the person's personal team at `/studio/<team>` (teams, round 2).

`studio.spec.ts` (E4): as the check account in its personal team, a business said in a sentence shows "Setting up", opens inside its team at `/studio/<team>/<business>` on Needs you next, and the team home shows one more card. Each run makes one business named "Production check" and the run's time, and those businesses stay in the check account.

`teams.spec.ts` (E5, E7): E5 makes a team from the switcher (Create team, a name, Create, then Skip on the invite step), lands on its empty home and finds it in the switcher; each run makes one team named "Production check" and the run's time, which stays on the check account until Delete team exists. E7 opens the check account's personal team and one of its businesses as the empty account and expects "You are not a member of this team." with none of the team's businesses shown. Both need migration 0070 and `packages/platform/hosted/sql/003-team-tenant.sql` applied on production; nothing here deletes anything.

`members.spec.ts` (E6, E8, E9), with the check account as Owner and the empty account as the invitee: E6 makes a team, invites the empty account as a Member on the invite step (D3), makes one business in the team, and the empty account opens the invitation link, sees the team and the role, accepts, lands on the team and sees the business, with "Member" beside the team in the switcher. E8 makes it a Viewer on Members: it sees the business but no prompt and no New business, and an upload straight to the business's Files is refused by the server. E9 leaves the team from Team settings and lands on its own team, which is the only one in the switcher. Each run makes one team and one business, which stay on the check account until Delete team exists; setup takes the empty account off any team but its own first, so a run that failed before E9 leaves its console empty.

Not built: a scheduled run in CI (it needs the Neon variables as repository secrets), and checks for Integrations and Ask Mentura.
