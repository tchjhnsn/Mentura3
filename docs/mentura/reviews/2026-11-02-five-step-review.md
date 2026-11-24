# Five-step review, 2026-11-02

Companion notes from the same night sit beside this file.

- [Promised vs landed](2026-11-02-promised-vs-landed.md)
- [Unwired diagnosis](2026-11-02-unwired-diagnosis.md)

## 1. Why

Torian is betting that speed wins, so he needs to trust work he hands to agents and people without checking it himself. The Nov 2 ledger showed that the READMEs, the folder restructure and the branch and worktree controls never landed. The `framework` branch had never received a PR. 3 of 14 assistant claims were false or stale. The diagnosis showed the EE-095 term engine and Lean proofs were built but never wired in.

## 2. Standing rules

Decided by Torian, Nov 2, 2026.

- The symbolic layer is verified in code and proven in Lean through the EE-095 term engine. No symbolic check may bypass it.
- Work counts as done only when it is merged, named by branch and commit. Anything else is a note, a draft or an open PR.
- Decisions live in this repo, not in an assistant's memory.

## 3. Decision

Torian, Nov 2, 2026. Naive-the-company's own records (`purpose/`, `governance/`, `evidence/`, `operations/`, `knowledge/`, `instance/`) split out of the product codebase into their own place, still as files checked by code. Moving business logic into a Neon database is deferred. The library (`frameworks/`, playbooks, templates) stays with the product. Where exactly the records go is not yet decided.

Torian, Nov 2, 2026, 11:04 PM CT. The `framework` branch is dropped. main will be protected, and every PR goes to main through review. Protection is not on yet (GitHub reports protected: false as of Nov 2). Open PRs that target `framework` get retargeted to main or closed before the branch is removed.

## 4. Five-step review

This review follows Musk's algorithm. The five steps are question requirements, delete, simplify, accelerate and automate. Steps 1 and 2 are drafted. Steps 3 to 5 are not started.

### Step 1, requirements questioned

- Code and company records in one repo. Questioned, now decided as above.
- Every decision gets a decision-record PR. Came from the assistant, not Torian. Cut to records a check actually reads.
- Framework work goes to the `framework` branch. That was Torian's rule, but the branch received nothing in 6 days. The decision is in section 3.
- Seven layer READMEs and a 25-step docs plan. Came from the assistant. The real need is that readers can navigate. Waits on the restructure.
- Glossary labels, metamodel, upper ontology and catalog. Torian's decisions, kept, but on hold until they are wired to the EE-095 term engine.

What survives is a check that shows what actually landed, the EE-095 and Lean wiring, and the records-versus-product split.

### Step 2, proposed deletions

Pending Torian's OK. Nothing is erased. Items are closed, archived or moved with a manifest.

- The queue of 11 decision-record PRs.
- The parallel vocabulary checks #164 and #157.
- The 7 PRs open more than a day (#34, #107, #108, #130, #144, #148, #149). Each lands or closes.
- Built-but-unrun code. The design-coverage checker, the discovery harness, `run-handoff.mjs`, the agent-upgrade kit, LangSmith helpers, about 30 replay scripts, the duplicate phase gate in `lifecycle.mjs`, and the docket check that can't fail. Each is wired into the tests or archived.
- Merged branches are pruned after auto-delete is turned on.
- Assistant research notes, with real decisions moved into the repo.

## 5. Next

Steps 3 to 5. Then a handoff for a new engineer whose proposed first assignment is making the landed-or-not ledger a CI check.
