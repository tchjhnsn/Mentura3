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

Every run first empties the check account's business store (its rows in `naive_records` in the `mentura_tenants` database, through the owner; `PROD_CHECK_TENANTS_URL` can stand in, `PROD_CHECK_EMPTY=0` skips it), and setup signs in twice so one test can sign out.

`console-empty.spec.ts` (doc "Mentura console: screens, navigation and teams", tests E1 to E3): `/` lands on an empty team home with four templates and no samples, no debug controls and no chief of staff copy; the team switcher holds one team, no businesses and New business; the account menu holds Your profile, Meetings, People, Account settings, Appearance and Sign out, and Sign out works. Screenshots go to `test-results/prod`.

`studio.spec.ts`: the Studio reads the account's businesses from the hosted store, a business made from a sentence is listed, and it opens with Naive's docket. Each run makes one business named "Production check" and the run's time; the next run's setup removes it.

Not built: a scheduled run in CI (it needs the Neon variables as repository secrets), and checks for Integrations and Ask Mentura.
