# GitHub Actions usage: tchjhnsn/everything-ecosystem (measured November 1, 2026)

Read-only measurement. Data came from the cursor-github connector, using the workflow runs, jobs, job logs, branch and file contents endpoints. All times below are in America/Chicago: CDT before Nov 1 at 2:00, CST after. Day buckets use UTC-6 throughout, so they are off by at most an hour before Nov 1.

## 1. Billing endpoints

I could not read them.
- The connector has no billing or usage tool.
- `gh` on the box is not logged in.
- get_me returns no plan field.

So the plan (Free or Pro), the billing-cycle date, the payment method and the actual spend are all unknown. Everything below comes from run and job records. The real figure is on github.com/settings/billing.

## 2. Measured usage

### Window
- The repo's workflow history starts on Oct 27, 2026. The first run was at 11:18 CDT and the last at 23:28 CST on Nov 1. That is about 5.57 days, so "last 30 days" in practice means this window.
- 1,235 runs in total, of which 1,052 executed. The other 183 are `pr-review-comment` runs. It triggers on workflow_run and every one of them was skipped.
- Runner: all jobs run on `ubuntu-latest`, the standard Linux 2-core runner, billed at $0.006 per minute (source 2).
  - The test log prints "2 workers" from `availableParallelism()`, which confirms 2 cores.
  - No Windows or macOS jobs, so no OS multiplier applies.

### Executed runs by workflow

| Workflow | Runs | Billable minutes (estimate) |
| --- | --- | --- |
| test (jobs: test, site, console) | 542 (425 on PRs, 117 pushes to main) | 3,737 to 4,065 |
| pr-review (`checks` job) | 186 | 874 to 994 |
| docs required | 312 | 312 (one job of about 6 s, rounded up to 1 min) |
| lean | 12 | about 20 |
| **Total** | **1,052** | **about 5,060 to 5,270** |

How I estimated billable minutes:
- I pulled 102 jobs from 50 sampled runs and rounded each job up to a whole minute, as GitHub does (source 2).
- Method A: mean billable minutes per sampled run × run count.
- Method B: ratio of billable to wall minutes in the sample × measured wall minutes of all runs.
- The two methods bracket the range above.

Cost:
- 5,060 to 5,270 min × $0.006 = **$30.4 to $31.6 in 5.57 days**. That is about 910 to 950 min, or $5.5 to $5.7, per day.
- At that average rate, 30 days would be about 27,300 to 28,400 min, or **about $164 to $170 per month**.
- The current rate is higher, because the test job has grown (see below).

### The test job keeps getting longer
Test workflow wall time, by day:

| Day | Runs | Median | p90 |
| --- | --- | --- | --- |
| Oct 27 | 36 | 46 s | 62 s |
| Oct 28 | 78 | 55 s | 60 s |
| Oct 29 | 136 | 274 s | 314 s |
| Oct 30 | 184 | 354 s | 450 s |
| Oct 31 | 67 | 486 s | 548 s |
| Nov 1 | 41 | 516 s | 582 s |

- The latest run, 41394149202 at 23:27 CST Nov 1, took 605 s for the test job, 59 s for site and 48 s for console.
  - That is 11 + 1 + 1 = 13 billable minutes for the test workflow alone.
- Over the whole window:
  - test job: median 304 s, p90 503 s (sample);
  - test workflow wall: median 295 s, p90 504 s (all 542 runs);
  - full CI per PR head, from the first job start to the last job end across all PR workflows: median 308 s, p90 537 s (425 heads).
- Current cost of one PR head is about 13 to 15 billable minutes:
  - test workflow: 11 to 13;
  - docs: 1;
  - pr-review checks: 1. Its four latest sampled jobs took 24 to 46 s, after `node test.mjs` was removed from it. The six earlier ones took 333 to 438 s.

### Runs per PR and churn
- 128 PRs merged in the window. That is **23.0 per day**: 51 on the peak day (Oct 30) and 13 to 14 per day on Oct 31 and Nov 1.
- Open to merge: median 161 min, p90 1,499 min.
- PR runs mapped to PRs by title. 933 of them matched, with 0 left over. Per merged PR:

| Per merged PR | Median | Mean | p90 |
| --- | --- | --- | --- |
| Executed runs | 6 | 6.71 | 13 |
| Test runs | 3 | 3.01 | 5 |
| Distinct heads | 3 | 3.01 | |

- Superseded runs, meaning runs on a head that was not the PR's final head:
  - 613 of 933 PR runs (66%);
  - 279 of 425 PR test runs.
  - These gave feedback on intermediate commits, but they are not the verdict the merge used.
- Duplicate test runs on the same head: 0. Nothing was rerun by hand.
- Cancelled runs: 7, all `pr-review`, from its `cancel-in-progress` concurrency group. `test` has no concurrency group, so a push to a PR never cancels the test run for the commit it replaces.

## 3. Official included amounts and prices (docs.github.com)
- Included compute per month (source 1):
  - GitHub Free: $12 (2,000 standard Linux minutes at $0.006);
  - GitHub Pro: $18 (3,000 minutes).
- Rates per minute (sources 1, 2): Linux 2-core x64 $0.006, Linux 1-core $0.002, Linux 2-core arm64 $0.005, Windows $0.010, macOS $0.062.
- Rounding: each job is rounded up to the nearest whole minute (source 2).
- Who pays: usage is charged to the repository owner (source 1).
- Public repos: standard runners are free (source 1).
- Without a valid payment method, usage is blocked once the included compute is used up (source 1).
- What this means here:
  - The window alone used 2.5 to 2.6 times the Free allowance and 1.7 to 1.8 times the Pro allowance.
  - Runs were still succeeding at 23:37 CST Nov 1. So either a payment method is on file, or a billing cycle reset fell inside the window. I cannot tell which without the billing page.
- Branch protection: `main` currently reports `protected: false` with no required status checks.
  - So "no push to main" is a convention, not something GitHub enforces.
  - Required status checks, including the strict "up to date" option, need branch protection or rulesets. For a private repo on a personal account, that needs Pro (source 3).

## 4. Cost of "require branches to be up to date before merging"
Assumptions:
- The gate merges one PR at a time.
- Strict mode means every other open PR becomes out of date after each merge.
- Each refresh is a new head, which triggers test, docs required and pr-review checks: 13 to 15 min.

Measured inputs:
- At each of the 128 merges, I counted the other PRs open at that moment.
  - Mean 21.65, median 17.5, p90 43, max 46, sum 2,771.
  - These counts include stale PRs that were never merged. 8 PRs were open when I fetched the data.
- The time-averaged open count was 12.31.

| Policy | Extra CI per merge | Window (5.57 d) | Per day | 30 days |
| --- | --- | --- | --- | --- |
| Refresh every open PR after each merge: (open - 1) reruns | mean 21.65 heads | 2,771 heads = 36,000 to 41,600 min = $216 to $249 | 6,470 to 7,460 min = $39 to $45 | about $1,160 to $1,340 |
| Rerun only the PR that is next to merge, at most 1 rerun | 1 head or fewer | 128 heads = 1,660 to 1,920 min = $10 to $12 | 300 to 345 min = $1.8 to $2.1 | about $54 to $62 |
| Today's baseline, no strict mode | 0 | 5,060 to 5,270 min = $30 to $32 | about 910 to 950 min | about $164 to $170 |

- Refreshing every open PR would multiply today's total Actions bill by about 7 to 8.
- Rerunning only the next PR adds about 35 to 40% to today's bill, and gives the same verified-on-latest-main guarantee for the PR that actually merges.
- With 8 PRs open, as now, the ratio is 7 reruns to 1 per merge: 105 against 15 minutes.

Throughput limit of serial strict merges:
- Each merge waits one full CI run on the latest main.
- At the latest test time of about 10.1 min, the gate can do at most about 142 merges a day. At the Nov 1 median of 516 s, about 167.
- The measured peak was 51 merges in a day. Average throughput fits, but bursts would queue. Every failed run also costs a slot.
- A native merge queue would batch this. It is not available for a personal-account repo (see the Task 2 report).

## 5. Slowest parts of the test job and how to cut them
Step times:
- Latest job: `node test.mjs` 554 s, `npm ci` 38 s, every other step 3 s or less.
- Window sample: `node test.mjs` median 312 s, p90 470 s; `npm ci` 28 s.

How I timed the sub-steps:
- test.mjs runs its steps in 2 workers and prints `pass` lines in list order.
- The gap before each `pass` line is how long the reporter waited on that step. With two workers it approximates the step's cost on the critical path, but is not an exact duration.
- Two recent logs agree within a few seconds:

| test.mjs step | Gap, job 125111745408 | Gap, job 125110724223 |
| --- | --- | --- |
| "the Get Started commands (every sh block runs as written)" (`site/scripts/docs-commands-test.mjs`) | 163 s | 168 s |
| "the console's bridge" (`console/lib/bridge-test.ts`); runs last, so it is the tail | 139 s | 141 s |
| "context: header first..." (`interface/context-test.mjs`) | 71 s | 73 s |
| "upgrades: migrations..." | 45 s | 44 s |
| "ontology membership gate" | 33 s | 36 s |
| eslint (cheap phase) | 25 s | 24 s |
| "checker tests" | 22 s | 22 s |
| "releases" | 22 s | 22 s |

- The three exclusive steps, which run alone at the end, all finished in under 1 s.
- The two slowest steps account for about 300 of the 554 s.

Ways to cut it:

1. **Run the two slow steps only when their inputs change.**
   - Option: run `docs-commands-test.mjs` only when docs or the commands it runs have changed, and `bridge-test.ts` only when `console/` has changed.
   - Do this with a changed-files check in test.mjs or a path filter.
   - Saving: up to about 300 s (5 billable min) of the roughly 10-minute job on PRs that touch neither. That would bring the job back to about 5 min, or about 6 billable.
   - With two workers some of that time overlaps, so the true saving lies between about 150 and 300 s. The `pass` gaps cannot pin it down further.
   - Keep both steps on push to main, so main is still fully verified.

2. **Split test.mjs across a 2-job matrix by step list.**
   - This roughly halves wall time: about 554 s down to about 280 to 300 s, with the two slow steps on different shards.
   - It does not reduce billable minutes. Each shard repeats setup, about 45 s for checkout + node + python + `npm ci`, so cost rises by about 1 minute per head.
   - Use it if latency matters more than dollars. Under strict serial merges, the speedup also doubles the gate's merge ceiling.

3. **Remove repeated work.**
   - ESLint runs twice on every PR head: in test.mjs (24 to 25 s) and in the pr-review `checks` job (24 to 46 s). Dropping one saves about 0.4 min of runner time per head. It saves a whole billable minute only when it pushes a job under a minute boundary.
   - `schema/publish-lint-test.mjs` appears twice in the test.mjs list (lines 91 and 93). It is fast, with gaps under 2 s, so this is about correctness, not money.
   - `npm ci` takes 38 s in the test job, plus 10 s in site and 6 s in console. Caching `node_modules` by package-lock hash could remove most of the 38 s. I did not measure how long a cache restore takes, so I am not claiming an exact saving.

Not measured in this window:
- **Adding a concurrency group to test.** A group with `cancel-in-progress` on PRs would cancel runs for heads that were already replaced.
- 279 of the PR test runs were on superseded heads. I did not measure how many of them were still running when the next push landed, so I am not putting a number on this saving.

## Sources
1. GitHub Docs, "GitHub Actions billing": https://docs.github.com/en/billing/concepts/product-billing/github-actions (fetched Nov 1, 2026)
2. GitHub Docs, "Actions runner pricing": https://docs.github.com/en/billing/reference/actions-runner-pricing (fetched Nov 1, 2026)
3. GitHub Docs, "About protected branches": https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches (cited in the companion Naive research note `docs/design/WORKTREES_BRANCHES_RESEARCH_2026-11-01.md` in tchjhnsn/Naive)

Measured data (local GitHub Actions API dumps, not kept in the repo):
- `runs.json` (1,235 runs)
- `jobs_mine.json` (102 sampled jobs)
- `prs.json` (150 PRs)
- Job logs 125111745408 and 125110724223
- `main` branch record
- `test.mjs` at HEAD cb502f9

## Path check (26 November 2026)

`schema/docs-commands-test.mjs` moved. Exactly one file in tchjhnsn/Mentura has that name, at `site/scripts/docs-commands-test.mjs`, so the timing table uses the new path. On 1 November 2026 the step lived at `schema/docs-commands-test.mjs`.

These citations do not match one current file, so the sentences above stay as written.

- No file named `interface/context-test.mjs` is in tchjhnsn/Mentura, tchjhnsn/Naive, or this repository. Commit `cb502f9` in tchjhnsn/Mentura still has the file.
- No file named `schema/publish-lint-test.mjs` is in those three trees. On commit `cb502f9`, `test.mjs` lists that path on lines 89 and 91. The sentence above says lines 91 and 93. tchjhnsn/Naive has `packages/naive/src/engine/publish-lint-test.ts`, a different filename.
- `docs/design/WORKTREES_BRANCHES_RESEARCH_2026-11-01.md` is not in tchjhnsn/Naive. No file of that name is in the three trees.
