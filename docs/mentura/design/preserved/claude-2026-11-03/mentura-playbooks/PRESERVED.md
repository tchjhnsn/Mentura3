---
type: preserved
status: preserved, not reconciled
source: project-files/mentura-playbooks/ on branch preserve/sources-2026-11-03 at acfb232 (Claude export of 2026-11-03), 2 files
sha256: per file in the table below, each equal to its line in SHA256SUMS.txt on that branch
ledger: N-028 (Claude audit id C-107)
recorded-on: 2026-11-04
---

# Mentura's discovery and waitlist playbooks, preserved

Each Markdown file in this folder except this one is a verbatim copy of a file under `project-files/mentura-playbooks/` in Claude's export of 2026-11-03, taken with `git show` from `preserve/sources-2026-11-03` and not edited. Both are drafts dated Oct 31, 2026, as their own front matter says.

Merged ledger row N-028, a confidential row, records the idea that the waitlist is a selection signal, with no-stakes discovery interviews first and a Naive trial as the admission gate. The full ledger, `grok-store/merged-ledger.full.md` on the preserve branch, names these two playbooks and the memory note `mentura-market-research.md` as its sources. The note is on main in `docs/memory/claude/`, so with this copy every source of N-028 is on main.

The files are preserved and not reconciled. They are records of the drafts as of 2026-10-31, not playbooks in force, and no checker loads them. `scripts/architecture-inventory.ts` reads them like every text file under 400 KB outside `docs/reviews/`. Stage 2 of the ontology program reconciles them.

`FLAGS.tsv` on the preserve branch flags both files `mentura-confidential`, on its lines 250 and 251. Torian decided gate G14, on Nov 3, that every source is preserved as-is, confidential files included, each flagged file with a `FLAGS.tsv` row. That row's cleanup rule still applies before any public mirror. Both files contain em dashes, as written.

| File | sha256 | Ledger rows | FLAGS.tsv line and flags |
|---|---|---|---|
| `DISCOVERY_INTERVIEW_PLAYBOOK_2026-10-31.md` | `0f88bbb0c036e1eb8d2d43a288984f0734fd3d17a84d636ff62abb045cb2fa79` | N-028 | line 250: mentura-confidential |
| `WAITLIST_ADMISSION_TRIAL_PLAYBOOK_2026-10-31.md` | `c457e6d06a0b1d1b5a44e1646a08c9c3aa739b47f7a35bc2fa44d13f04f74cf3` | N-028 | line 251: mentura-confidential |
