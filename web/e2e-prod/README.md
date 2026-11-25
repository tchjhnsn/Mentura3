# Production check

Browser tests that run against the live site (https://mentura.xyz by default) as two fresh accounts made for each run, so a change can be proved end to end on production, not only on a local server.

## Run it

```sh
cd web
NEON_API_KEY=... NEON_PROJECT_ID=<project> NEON_BRANCH_ID=<production branch> pnpm e2e:prod
```

`PROD_CHECK_DATABASE_URL` (the owner URL of the identity database) can stand in for the three Neon variables. `PROD_BASE_URL` points it at another deployment. In a container whose Playwright differs from the pinned one, set `PLAYWRIGHT_CHROMIUM` to the browser's path.

## The run's accounts

- `setup.ts` makes two accounts through the site's own sign-up on every run: the Owner, `production-check+<run>@mentura.xyz`, named "Mentura production check", and the invitee, `production-check+<run>-invitee@mentura.xyz`, named "Empty console check". `<run>` is the run's time and a random suffix. `PROD_CHECK_EMAIL` changes the base address.
- Their passwords are never stored. Setup signs each in and keeps only the session cookies under `test-results/prod/` (the invitee twice, so one test can sign out), which git ignores, and the run's two addresses in `test-results/prod/state.run.json` for the specs (`runAccounts()` in `setup.ts`).
- They are ordinary accounts: the row policy on the business store keeps their businesses apart from everyone else's, and they see nothing of anyone else's.

## Cleanup

Every account on a check address is deleted through the app's own Delete account (`DELETE /api/account`, A4), which deletes the teams only that account is on and every business in them. `setup.ts` does it before the run, and `teardown.ts` after it, even when a test failed. A check address is the base address with `+<anything>`, or one of the two standing accounts earlier rounds used (`production-check@` and `production-check-empty@`), so their teams and businesses go on the first run too. Nothing else is touched.

To sign in as an old account, its password is reset to a new random one through the identity database's owner. First, the check accounts' places on each other's teams are taken off (member rows of check accounts only, never an Owner's own team), so no team holds a deletion back. An account that cannot be deleted is named in the output and left, and the run goes on.

## What it checks

The files run in name order, one test at a time.

`console-empty.spec.ts` (doc "Mentura console: screens, navigation and teams", tests E1 to E3 and E11), as the invitee before it is on any team: `/` lands on an empty team home at `/studio/<team>` with four templates and no samples, no debug controls and no chief of staff copy; the team switcher holds one team, no businesses and New business; the account menu holds Your profile, Meetings, People, Account settings, Appearance and Sign out, and Sign out works. E11, at 390 px wide with touch: the empty home and the switcher do not scroll sideways, and "Open the sidebar" opens the sidebar as a sheet. Screenshots go to `test-results/prod`. Against `next dev`, E1 fails on the "Numbers off" button, which only development shows.

`members.spec.ts` (E6, E8, E9), with the Owner and the invitee: E6 makes a team, invites the invitee as a Member on the invite step (D3), makes one business in the team, and the invitee opens the invitation link, accepts, lands on the team and sees the business. E8 makes it a Viewer on Members: it sees the business but no prompt and no New business, and an upload straight to the business's Files is refused by the server. E9 leaves the team from Team settings and lands on its own team.

`studio.spec.ts` (E4): as the Owner in its personal team, a business said in a sentence shows "Setting up", opens inside its team at `/studio/<team>/<business>` on Needs you, and the team home shows one more card.

`surfaces.spec.ts` (round 5), as the Owner on E4's business: the business home shows Needs you, with one Open decision button that opens Decisions, or says nothing needs you, then Done by agents.

`teams.spec.ts` (E5, E7): E5 makes a team from the switcher (Create team, a name, Create, then Skip on the invite step), lands on its empty home and finds it in the switcher. E7 opens the Owner's personal team and one of its businesses as the invitee and expects "You are not a member of this team." with none of the team's businesses shown.

`transfer.spec.ts` (E10, D6, A4), as the Owner: E10 makes a team, moves E4's business to it from the card's More menu (D5), and the business opens at `/studio/<new team>/<business>`; the old URL redirects there, and the personal team no longer lists it. D6 deletes that team from Team settings with its name typed: the dialog lists the business that goes with it, the person lands on the personal team, and the team's URL and the business's URL then say "You are not a member of this team." A4 opens Delete account from Account settings and checks that it lists the teams and that its button waits for the email typed. It does not press it: teardown deletes the accounts through the same route.

They need migrations 0070 and 0071 and `packages/platform/hosted/sql/003-team-tenant.sql` applied on production.

Not built: a scheduled run in CI (it needs the Neon variables as repository secrets), and checks for Integrations and Ask Mentura.
