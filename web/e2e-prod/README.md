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

`studio.spec.ts`: the Studio reads the account's businesses from the hosted store, a business made from a sentence is listed, and it opens with Naive's docket. Each run makes one business named "Production check" and the run's time, and those businesses stay in the check account.

Not built: a scheduled run in CI (it needs the Neon variables as repository secrets), and checks for Integrations and Ask Mentura.
