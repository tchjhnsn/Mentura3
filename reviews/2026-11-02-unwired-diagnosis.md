# Unwired diagnosis, 2026-11-02

Copied from the Nov 2 note. Citations were updated to commit 9faf5b8.

The EE-095 engine and the Lean proofs are real, and `node test.mjs` does run admission. What never runs is the check that the TypeScript definitions and the Lean definitions are the same thing, or that any later membership rule has to go through them. I verified this on `framework` at `cb502f9` (same as `origin/framework`). `origin/main` is 8 commits ahead (`9faf5b8`) and does not change the term engine. No files in the repo were modified. `lake build` was not re-run here. The Lean CI runs cited below already succeeded.

One earlier note is wrong. At this commit, `admit.ts --check` is a `test.mjs` step. It has been since the engine landed.

## 1. The EE-095 and Lean failure

### What was built

PR [#135](https://github.com/tchjhnsn/everything-ecosystem/pull/135) (merged to `main` 2026-11-01, on `framework`) added the term engine and the first proofs. About 2,115 additions. The author recorded the two holes in the PR body and left them as follow-up.

| Piece | Where | Size |
| --- | --- | --- |
| Engine: `run`, `relation`, `freeze`, `validTest`, seeded cases | `schema/terms/engine.ts` (102), `levels.ts` (72), `terms.ts` (128) | 9 terms, all `status: "proposed"` |
| Admission | `schema/terms/admit.ts` (78) writes `schema/terms/admitted.json` (493) | `--check` exits 0 here (re-run in this investigation) |
| Engine tests | `schema/terms/engine-test.ts` (45) | In `test.mjs` |
| Concept engine and founder, phase-gate, id-uniqueness proofs | `lean/Naive/Concept.lean` (31), `Founder.lean` (56), `Terms.lean` (80) | Core Lean, no Mathlib |
| Standing-rule proofs, added later | `lean/Naive/StandingRules.lean` (596), PR [#152](https://github.com/tchjhnsn/everything-ecosystem/pull/152) | Separate Lake root, Mathlib |

The nine terms are founder, co-founder, early employee, mentor, coach, friend, unearned candour, threshold guardian, and phase gate. Three name Lean theorems: founder (`unconfirmed_not_founder`, `unevidenced_not_founder`), co-founder (`coFounder_isA_founder`), phase gate (`phaseGate_isA_thresholdGuardian`). The other six have `"lean": []`. Admission allows an empty list.

`docs/ontology.json` has 112 nouns. One, `founder appointment`, sets `term: "founder"` and properties F1 to F5 (`docs/ontology.json` around lines 1104 to 1118).

### What actually runs

`test.mjs` lines 122 and 123 spawn both of these on every `node test.mjs` run:

```122:123:test.mjs
  ["term engine: bad tests rejected, relations total, freezing notices change", "node", ["schema/terms/engine-test.ts"]],
  ["every glossary term admitted: valid test, cross-run, Lean theorems named (regenerate with node schema/terms/admit.ts)", "node", ["schema/terms/admit.ts", "--check"]],
```

`schema/check-nouns.mjs` (also a `test.mjs` step) always calls `checkOntology`. That checks, for a noun that already lists properties, that the ids match an admitted term (`schema/ontology-gate.ts` `checkProperties`, lines 226 to 233). It does not run the properties on any venture record.

`decidePackage` calls `failedProperties`, which calls `run` from the engine (`schema/ontology-gate.ts` lines 133 to 137 and 335). That path is `node schema/check-nouns.mjs --package`. Callers in this repo:

- `schema/ontology-gate-test.ts` and `schema/operating-rules-test.ts`, on fixtures under `schema/fixtures/ontology-gate/`.
- Nothing else. `interface/router.mjs`, `interface/cli/naive.mjs`, and `interface/cli/mentura.mjs` do not mention the gate. No JSON under `instance/` or `schema/examples/` contains an ontology block. No handoff in the venture has ever been given to this gate.

So the only production-shaped use of `run` is a fixture test. The router never asks whether a record is a founder, a phase gate, or anything else.

### What `--check` actually proves

`admit.ts` line 47:

```47:47:schema/terms/admit.ts
    for (const thm of t.lean ?? []) if (!new RegExp(`theorem\\s+${thm}\\b`).test(lean)) problems.push(`${t.id}: Lean theorem ${thm} is not in lean/Naive`);
```

That is a name search over the text of `lean/Naive/*.lean`. A theorem with the right name and a different statement passes. This run exited 0. EE-095 states the same limit in the decision text (`docs/decisions/decisions.json`, the EE-095 entry): admission does not check that a named theorem proves the current properties.

`lean/Naive/Terms.lean` lines 21 to 26 say the other hole out loud. `relationOf_total` only says the result is one of six constructors. The comment says that is true of any function into `Relation`, and that agreement with the TypeScript `relation` is not checked. The two functions are the same decision tree if you read them (`schema/terms/engine.ts` lines 44 to 54, and `relationOf` at `Terms.lean` lines 13 to 19). Nothing executes both on the same numbers.

The Lean concepts are a second copy, written by hand:

- `Founder.lean` lines 4 to 8: "a hand copy of the properties in `schema/terms/terms.ts`", and `schema/founders.ts` does not run them. `founders.ts` checks folder layout, roles, and privacy.
- `phaseGate_isA_thresholdGuardian` is `refine_isA`, which is true for any concept with extra properties (`Concept.lean` lines 26 to 31). It does not read `terms.ts`.
- Lean `admit` (`Terms.lean` lines 63 to 80) is a function on a list of strings. TypeScript `admitAll` freezes hashes, runs cases, and writes JSON. The shared name is the whole link.
- Unearned candour has a custom rule, U1 and U2 and any of U3 to U5 (`terms.ts` lines 98 to 99). Lean has no concept for it.
- The field names already differ: TypeScript `passableWithoutDestruction`, Lean `passable`.
- `freeze` hashes each check's own source and not helpers it calls (`engine.ts` lines 56 to 59). A helper edit can leave the hash unchanged. No check calls a helper today. That is a comment, and it is true of the current nine.

`schema/lifecycle.mjs` has its own phase gate, loaded from `purpose/frameworks/product-anatomy/phases.json`. It does not import `schema/terms`.

### What CI runs

On `framework`, `.github/workflows/test.yml` runs `node test.mjs` for every pull request and for pushes to `main`. That includes `admit.ts --check`. It does not run `lake`.

On `framework`, `.github/workflows/lean.yml` lines 3 to 7:

```3:7:.github/workflows/lean.yml
on:
  pull_request:
    paths: ["lean/**", ".github/workflows/lean.yml"]
  push:
    branches: [main]
```

A pull request runs the Lean job only when the diff touches `lean/**` or the workflow file. A push runs it only on `main`, and only with a `lean/**` change. A change to `schema/terms/**` does not build the proofs. A push to `framework` does not either.

Evidence from GitHub, not from the workflow file alone: open PR [#164](https://github.com/tchjhnsn/everything-ecosystem/pull/164) (base `framework`) has passing checks named `test`, `site`, `console`, `checks`, and `docs-required`. There is no Lean job. That PR does not touch `lean/**`.

Lean builds that did run, all `success`: the PR #135 runs (for example `41243541671`), the push of that merge to `main` (`41294179612`), the PR #152 run (`41392753779`), and the push of that merge (`41393756214`). Those diffs included `lean/**`, so the path filter let them through.

`origin/main` has PR [#159](https://github.com/tchjhnsn/everything-ecosystem/pull/159), which is not on `framework`. It sets `pull_request.branches: [main]` on both `test.yml` and `lean.yml`. The PR body says a pull request into `framework` should then get only `docs-required`. That is not what happens today. PR #164 into `framework` still ran the suite, because GitHub used `framework`'s workflow file, which has no base filter. Inferred from that result and from the two workflow files. Once `framework` contains #159, framework pull requests would stop running `test.mjs` as well.

### The bypass that nothing stopped

PR #164 is open and unmerged. It is not on `framework`. Its diff does not mention `schema/terms/engine`, `admit.ts`, `EE-095`, or `relationOf`. Membership is a declared string, `vocabulary_parent`, on a record type, a record, or a `// vocabulary_parent:` comment in the first 40 lines of a module. The baseline of 389 unlabeled subjects includes `module:schema/terms/admit.ts` and `module:schema/terms/engine.ts`. The engine is filed as something that lacks a label. Its own `test` check passed.

PR [#150](https://github.com/tchjhnsn/everything-ecosystem/pull/150) (on `framework`) is the gate that can call the engine. It calls it only when a noun already lists `properties`. A handoff type with no properties passes `check-nouns`. 111 nouns are in that state. The PR left "who confirms package facts" open, and the gate treats a missing `confirmed` as confirmed (`ontology-gate.ts` lines 149 to 151).

## 2. Timeline and root causes

| When | What | What it claimed | What it left |
| --- | --- | --- | --- |
| 2026-10-31, PR #135, commits `5b03a5e` through `56ae936` | Engine, 9 terms, Lean concept/founder/terms, `lean.yml`, `admit.ts --check` in `test.mjs` | "Definitions are checked, not argued." `lake build` succeeded. Review findings that the proofs are not tied to the code were "fixed as comments." | Running the founder term on founder records. Tying Lean definitions to `terms.ts`. |
| 2026-10-31, PR #142, `23ccf9b` | `affects` on decision records. EE-089 to EE-093. | "so a check can tell whether the repository agrees." Each `expect` "fails until its decision is built." | The checker was not written. `schema/decision-affects-test.mjs` lines 1 to 4 test the grammar only. Line 32 accepts `{ path: schema/terms/stale.ts, expect: exists }` as well-formed. That file does not exist. |
| 2026-11-01, EE-095 recorded in the same window as #135 | In force. No `affects` array. | One admission for every new or contested term. Lean in CI. | The same paragraph says "Not built yet" for the proof link and the founder-record check. |
| 2026-11-01, issue [#143](https://github.com/tchjhnsn/everything-ecosystem/issues/143) | Still open. Title: "Three glossaries that don't know about each other." | EE-090, EE-092, and EE-096 say prototypes (`proof-vocab.ts`, `s1-vocab.ts`, `S1.lean`, and others) land with the glossary PR for this issue. | Those files are not in the repo. The decisions' `term` targets (`glossary`, `harness`, `workbench`, `venture-draft`, and the rest) are not among the 9 admitted ids. |
| 2026-11-02, PR #150 | Membership gate, G5 calls `run` when properties exist. | Deterministic half of the handoff pipeline. | Optional. No instance package uses it. |
| 2026-11-02, PR #151 | `operations/operating-rules.json`. | Wilson and SPRT parameters "pending Lean." `questions.lean.one_way_door_ci` is `"block"`. | The module validates the JSON. The gate reads `rejection.retry` only (`schema/operating-rules.ts` lines 11 to 14). |
| 2026-11-02, PR #152 | 596 lines of Wilson and SPRT proofs. | "The operating-rules module is not changed here." A config module can cite the theorem names. "This note does not change that module." | The JSON still says "Provisional, pending Lean" and "Not enforced yet" (`operations/operating-rules.json` lines 103 and 140 to 146). The only code that reads `questions.lean` is an equality assertion in `schema/operating-rules-test.ts` line 74. The numbers match the Lean defaults (z 1.96, low 0.8, costly 0.9, p0 0.05, p1 0.30, alpha and beta 0.05). Nothing checks that they stay matched. Wald's error-rate guarantee is not proved (`StandingRules.lean` lines 29 and 571 to 573). |
| 2026-11-02, PR #159, on `main` only | CI cost cut. | Full suite only for pull requests into `main`. | Not on `framework` yet. See section 1. |
| Open, not on `framework` | #164 vocabulary labels. #157 (`schema/noun-relations.ts`) adds ontology relations. Its diff does not mention the term engine. #162 records EE-106, "Naive is the symbolic system," as a decision text only. Its conflict list discusses `docs/ontology.json` and `check-nouns` and does not mention EE-095. | Later symbolic work. | None of it is forced through the engine. |

### Root causes

1. The unfinished part was written into an in-force decision as prose, and EE-095 has no `affects` entries. PR #142 built a schema whose description says an in-force `affects` list is a requirement until every entry holds (`schema/decision.schema.json` lines 24 to 26). `schema/decisions.mjs` never reads `affects`. Ten decisions carry 41 `affects` entries. Zero are evaluated. A grammar test cannot fail a missing mechanism.

2. The authors of the proofs recorded the unwiring as comments, and review accepted the comments as the fix (PR #135, findings 4 and 6). `admit.ts --check` then went green. A green admission check is the thing a later agent would trust.

3. The Lean job's path filter means the proofs are rebuilt only when someone edits the proofs. The TypeScript engine, the ontology, and the operating rules are outside that filter. There is no job that runs one set of cases through `relation` and `relationOf`.

4. Nothing requires a new membership rule to be an admitted term. `check-nouns` fails a retired noun, a bad reference, a bad function id, and a property list that does not match a term. A noun with no `term` is legal. A new field named `vocabulary_parent` is legal. The engine is opt-in, and one noun opted in.

5. The agents that build the next piece are not told. `AGENTS.md` is the map loaded for every agent. It describes `check-nouns --package` as the membership gate and does not mention EE-095, `schema/terms`, or Lean. No `SKILL.md` mentions the term engine. `schema/generators/glossary.mjs` lines 1 to 3 say every new glossary term also runs the term engine via a glossary skill. The generator does not import the engine. There is no glossary skill.

6. "Lands later" became the default for the rest of the vocabulary. Issue #143 is still open. The decision records name Lean files (`Placement.lean`, `S1.lean`) that are not in `lean/Naive/`. The only Lean files on disk are the four above.

7. A shrink-only baseline that is not a diff against the previous file teaches the next agent the wrong ratchet. `schema/generators/gaps.json` says it only shrinks. `schema/check-data-model.mjs` lines 47 to 50 only check set membership. The list grew from 114 (`2b97ca1`) to 120, 124, then 125. Adding a line is a passing change. PR #164 copies that shape and puts the term engine in the gap list.

## 3. Other unwired parts

"Unwired" here means: the suite and the workflows do not run it, or they run a check that cannot fail when the mechanism is absent. Library modules that the router imports are omitted. `schema/check-ready.mjs` is omitted on purpose: `schema/test.mjs` does run it, and `test.mjs` runs `schema/test.mjs`.

| What | Evidence it is unwired | Size | Wiring |
| --- | --- | --- | --- |
| Lean definitions are a hand copy of 3 of 9 terms | `Terms.lean` 21 to 22. `Founder.lean` 6 to 8. Name regex at `admit.ts` 47. Six terms have an empty `lean` array. `admit.ts --check` exits 0 anyway. | ~167 lines of concept/founder/terms Lean, plus the 9 term definitions | Generate the Lean concepts from `admitted.json` and fail the build on a diff. Put `schema/terms/**` on the Lean workflow. |
| Standing-rule proofs vs the operating rules | `StandingRules.lean` is a Lake root (`lakefile.toml` line 11) and is not imported by `Naive.lean`. `questions.lean` is read only by `operating-rules-test.ts` 74. Eleven "Not enforced yet" notes in `operations/operating-rules.json`. The gate does not read `questions`. | 596 Lean lines, PR #152 (774 additions). JSON module from PR #151 (1,408 additions) | Cite theorem names from the JSON. Fail if `z`, `low`, `costly`, `p0`, `p1`, `alpha`, `beta` diverge from the Lean defs. Implement earn/lose in TypeScript only by calling those checks. |
| `affects` is a schema with no evaluator | `decision.schema.json` 24 to 26. `decisions.mjs` has no match for `affects`. The test file's valid example is the missing `schema/terms/stale.ts`. | PR #142, 278 additions. 41 entries on 10 decisions | A `test.mjs` step that evaluates every in-force entry. `term` / `defined` means an id in `admitted.json` with `valid: true`. |
| In-force decisions whose terms were never admitted | EE-089 through EE-100 `affects` term targets. None of `glossary`, `function`, `harness`, `workbench`, `mentura`, `record-generator`, `generative-endpoint`, and the others are in the 9 admitted ids. EE-089 also expects `schema/terms/stale.ts`, which is not in `schema/terms/`. | The decision records themselves | Same evaluator. An in-force decision may not say "Not built yet" except as an `affects` entry that is still failing. |
| Glossary records do not enter the engine | `schema/generators/glossary.mjs` 1 to 3. No glossary `SKILL.md`. Generators are tested by `schema/generators/generators-test.mjs` for schema shape. | 25 lines, plus EE-099 | `draft` refuses a term that is not admitted, or admission grows when a glossary term is accepted. |
| Lifecycle phase gate and the phase-gate term | `schema/lifecycle.mjs` loads `phases.json`. No import of `schema/terms`. | 149 lines, and it is on the CLI (`naive phase`) | The phase-exit check calls `run(phaseGate, facts)` on the venture's exit-criteria record. |
| Founder records and the founder term | `Founder.lean` 7 to 8. `founders.ts` (276 lines) checks layout and privacy. `test.mjs` runs `founders-test.ts` and `founders.ts check` on the example workspace. | PR #135's founder half | `founders.ts check` runs F1 to F5 on `founder.json` facts. |
| Record-generator gap list | Comment at `check-data-model.mjs` 47 says the list only shrinks. The code does not compare to the previous file. Counts: 114, then 120, 124, 125. 128 record types, 3 generators. | `gaps.json` plus the check | Store the previous set and fail a new id. |
| Design-coverage checker | `evidence/skills/design-coverage/check.mjs` and `scan.mjs`. Data model `checked_by` points at the check. No match in `test.mjs` or any workflow. Header still describes SAD v3 entity profiles and a Jev call. AGENTS.md says SAD is no longer part of the system (EE-036). | 199 + 45 lines | Delete it or point it at current records and run `--quick` in `test.mjs`. Inferred: it is leftover rather than a live check. The "not in CI" part is verified. |
| Fidelity-ladder census | `evidence/skills/fidelity-ladder-audit/ladder-census.mjs`. Not in `test.mjs` or workflows. Its own header says it is a proposal generator. | 181 lines | Run it only if a ladder record is still a product. Otherwise it is unused tooling. |
| Discovery harness | `interface/harness/run.mjs` (316) and `evals.mjs` (91). Not in `test.mjs` or workflows. `platform/mcp/research.mjs` (65) is spawned from `run.mjs` only. | About 470 lines | A fixture run of `run.mjs` in the suite, or a documented manual entry with a smoke test. |
| `run-handoff.mjs` | Not spawned by `test.mjs`, `schema/test.mjs`, or a workflow. `check-execution.mjs` checks evidence the runner would have written. Docs and one old handoff brief tell a person to run it. | 52 lines, EE-017 | Either the suite runs one fixture handoff through it, or the docs stop calling it part of the checked path. |
| Docket evidence check cannot fail | `test.mjs` line 149: "reports agreement; does not gate on it." `schema/docket-eval.mjs` prints MISS rows and has no failing exit code (`process.exit` only on the `request` subcommand, line 80). | 90 lines | Exit 1 below a stated rate, or drop it from the gate list and keep it as a report. |
| Feedback routing has no Jev client | `schema/feedback-route.mjs` lines 6 to 10. Tests inject a stub. The file is reached by `validation-study-test.mjs`. | The module is in the suite. The client is absent, as the file says. | Build the client or stop describing `beta.jev.send` as a live path. |
| Telemetry sender | `schema/telemetry.mjs` returns "no sender: sending telemetry is not built yet" when `send` is not a function. | In the validation-study tests | Same as above. The absence is declared. |
| Agent-upgrade kit and two LangSmith helpers | `platform/kits/agent-upgrade/run.mjs` (82) and `stand-in-agent.mjs` (33). `platform/integrations/langsmith-setup.mjs` (116) and `langsmith-docket.mjs` (54). Not imported and not in `test.mjs` or workflows. `langsmith.mjs` itself is spawned by port and vitals tests. | About 285 lines | Call them from the upgrade and docket paths that name them, or remove them. |
| Open parallel vocabularies | #164 label parents, including the engine modules in the 389-gap baseline. #157 noun relations, no term-engine references in the diff. #162 EE-106 text, no code, and its conflict list skips EE-095. | #164 is 1,590 additions. #157 touches `schema/noun-relations.ts` and `ontology-gate.ts`. | Do not merge a second membership predicate. See the fixes below. |
| Prototypes named by decisions and not in the tree | EE-096 cites `s1-vocab.ts` and `S1.lean`. EE-098 cites `offering-vocab.ts`, `placement.ts`, `Placement.lean` (20 theorems). EE-099 cites `generator-vocab.ts`. The handoff doc cites `proof-vocab.ts` and `anatomy-vocab.ts`. `lean/Naive/` has four files. None of those names are in the repo. | Unknown outside the repo. Not verified off-repo. | They become admitted terms in this repo, or the decision stops citing them as done. |
| `verification/` replay scripts | About 30 `replay.mjs` and `view.mjs` files showed up as never imported and never spawned by `test.mjs` or a workflow. Several thousand lines. | Manual evidence from earlier sessions | Keep them as notes. They are not a gate, and nothing pretends CI runs them. |

`schema/terms/admitted.json` is not stale against its generator: `--check` compares bytes and passed. `docs/ontology.md`, route docs, and record types have the same kind of freshness check and are in `test.mjs`. Those ratchets work. The term ratchet does not extend past the nine terms.

## 4. Prevention, by leverage

1. **Evaluate `affects`, and make "Not built yet" one of those entries.** Add one step to `test.mjs` that loads `docs/decisions/decisions.json` and, for every in-force decision, checks each `affects` entry against the tree. A `path`/`exists` entry fails when the file is missing (`schema/terms/stale.ts` would fail today). A `term`/`defined` entry fails unless that id is in `admitted.json` with `valid: true`. An in-force decision whose text contains "Not built yet" fails unless that sentence is an `affects` entry. EE-095 then cannot stay in force while its proof link is only a sentence, because the sentence has to be an entry, and the entry has to be true. This is the check PR #142 described and did not write. It would have made the whole class loud: missing files, terms that never entered the engine, and decisions that shipped as prose.

2. **One way to say that something is a member.** `check-nouns` fails a `handoff_type` noun that has no `term`, unless the noun carries an explicit recorded exception. A new source field or comment whose name is `vocabulary_parent`, or a new relation enum, fails unless the module imports `schema/terms/engine.ts` and the parent id is an admitted term. PR #164 would have failed on that rule while its `test` job was otherwise green. Generating labels from admitted terms is the allowed path. Declaring a label is not a definition.

3. **Make the Lean file a build product of the engine, and run that build with the engine.** `admit.ts` already has the property ids, the rule, and the hash. Emit the Lean `Concept` definitions from that record and fail if the committed `lean/Naive/Terms.lean` and `Founder.lean` differ. Replace the name regex with a check that the theorem statement mentions the current property ids (or the freeze hash). Add a shared case table: the same sizes go through TypeScript `relation` and Lean `relationOf`, and CI fails on a mismatch. `relationOf_total` can stay. It is not that check. Widen `lean.yml` paths to `schema/terms/**`, `docs/ontology.json`, `operations/operating-rules.json`, and `docs/decisions/decisions.json`, and run it for pull requests into `framework` as well as `main`. Do not take PR #159's base filter onto `framework` without a replacement that still builds Lean when the engine changes.

4. **Tie the standing-rule numbers to the theorems that exist.** `operating-rules.json` should name `unanimous_reaches_low_iff`, `unanimous_reaches_costly_iff`, `pure_failures_reach_iff`, and the default defs. The test that today only checks the strings `proven_before_use` and `block` should fail when those names are absent from `StandingRules.lean`, or when `z`, `low`, `costly`, `p0`, `p1`, `alpha`, or `beta` differ from the Lean constants. The note "pending Lean" fails once the theorem file is present and uncited. `one_way_door_ci: block` stays false until a real CI step refuses an uncited one-way-door constant. Wald's error bound stays unproved until a theorem exists. The JSON should not say the bound is proved.

5. **Tell the next agent in the file it actually loads.** `AGENTS.md` needs a short rule: a term is properties over facts, frozen and admitted by `schema/terms`, with a Lean theorem generated from that admission. A label, a noun row, or a `vocabulary_parent` string is not a definition. Membership checks call the engine. Point at EE-095 and at the generator, not at a skill that does not exist. Fix or delete the comment in `schema/generators/glossary.mjs`.

6. **Make a baseline a diff, or do not call it a ratchet.** `gaps.json` and the vocabulary baseline on #164 grow by editing the list. The check should load the previous file from the base branch and fail a new id. An approval entry can add one id only by removing another, or by referencing a person and a decision id, and the count of unapproved gaps is what must not rise. Listing `schema/terms/engine.ts` as a gap would then be a new membership mechanism, which fix 2 already rejects.

A blanket "every module has a caller" check would be noisy. This repo has many command-line tools that `test.mjs` spawns by string, and a static import graph misses them. The precise version is smaller: every path named by an in-force `affects` entry, every `checked_by` in `schema/data-model.json`, and every file under `schema/terms/` and `lean/` must show up in `test.mjs` or a workflow `run:` line. Design-coverage is the current miss for `checked_by`.
