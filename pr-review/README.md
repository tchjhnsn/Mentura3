# PR review agent

Reads a pull request's Vercel preview and reports what it finds in a PR comment. It never merges, approves or pushes. `.github/workflows/pr-review.yml` runs it with the PR's own code, no secrets and a read-only token. `.github/workflows/pr-review-comment.yml` posts the comment from the default branch and runs no PR code.

| File | Does |
|---|---|
| `content.mjs` | Fetches the markdown of each changed site page and checks it for internal terms and secret shapes |
| `design.mjs` | Reads computed styles from the preview, with screenshots only when asked (`naive.config.json` `pr_review.screenshots`) |
| `pr-review-test.mjs` | Tests both offline, and checks the two workflows keep their permissions |

## Where the content patterns come from

`content.mjs` uses three lists, in this order:

1. Naive's internal terms, `packages/naive/src/engine/internal-terms.json` in the installed `naive-framework` package.
2. The founder's own list, frozen in `site/gate/governance/internal-terms.json` (`site/scripts/export-gate.ts` writes it from a venture folder). A missing file is skipped here; the site's page gate fails closed without it.
3. The built-in fallback patterns (ledger ids, private paths, local paths, unfinished markers, secret shapes, email addresses).

`pr-review.yml` reads no secret, so it installs without the private `naive-framework` package (EE-119). Then the first list is skipped, and the report's Patterns line says so: `Naive's list skipped (naive-framework is not installed)`. The venture's list and the fallback patterns still run.

## Run it

```sh
node scripts/pr-review/content.mjs --fixtures scripts/pr-review/fixtures
node scripts/pr-review/pr-review-test.mjs
```
