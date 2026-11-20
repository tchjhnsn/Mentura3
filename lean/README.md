# Reflect's Lean proofs

Step 3 of `docs/design/REFLECT_FRAMEWORK_2026-11-19.md`: Lean 4 proofs of the framework's structural claims, with core Lean only and no Mathlib, following NTS and tchjhnsn/naive (`packages/naive/lean/`).

## Build

```sh
cd lean && lake build
```

The toolchain is pinned in `lean-toolchain` (Lean 4.33.1). Install it with elan. The build takes a few seconds and has no dependencies. Build output goes to `lean/.lake/`, which git ignores.

## What is proved

| File | Holds |
|---|---|
| `Reflect/Hierarchy.lean` | A hierarchy of nouns under top categories and its checker, `Hierarchy.Certified`: every noun has something broader, every broader noun has a lower rank and the same category, and every broader category is that category. When it passes over a list of every noun, no noun is above itself (`no_cycle`) and each noun reaches exactly one top category (`one_top`). |
| `Reflect/Generated/Ontology.lean` | Generated from `packages/core/src/terms/ontology.json`; do not edit. Aristotle's ten Categories and the kept nouns as inductive types, each noun's broader links, and a certificate (rank and category) that `certified` checks by `decide`. A wrong certificate fails the build. |
| `Reflect/Categories.lean` | Every noun of the ontology has exactly one category: `broader_no_cycle` (U1) and `noun_one_category` (U3 and U4). |
| `Reflect/Ends.lean` | Serves links between intents and ends. The checker `Ends.check` walks every chain from every node with a bound of the number of nodes. When it passes, "an end that a serves" is well-founded, no endless chain of ends exists (Nicomachean Ethics I.2, 1094a18-22), no node serves itself through a chain, and every node reaches a final end that serves nothing further. |
| `Reflect/Telos.lean` | Choices, intents and telos. The checker `Purposes.check` adds to `Ends.check` that from every choice a bounded walk of one or more serves links finds a telos. When it passes, every choice reaches a stated telos (`choice_reaches_telos`), since choice is of what is toward the end (Nicomachean Ethics III.2, 1111b26). |
| `Reflect/Communities.lean` | Person, union, household, village and polis (Politics I.2). "Part of" is one or more steps up; it is irreflexive, transitive, asymmetric and total, so a strict total order, and it agrees with the order of rank. The polis is part of nothing. |
| `Reflect/Sources.lean` | Where a field's value came from: stated, journal, conversation, import and noticed, mirrored from `SOURCE_KINDS` in `packages/core/src/value-source.ts` (`value-source.test.ts` checks the constructors match). Every kind other than stated starts proposed (`not_stated_starts_proposed`), only a stated value starts confirmed (`starts_confirmed_iff_stated`), and confirming keeps the kind (`confirm_keeps_kind`). |

The theorems depend on no axioms beyond `propext` and `Quot.sound`, and none uses `sorry`.

## The generated file

`node scripts/ontology-lean.ts` writes `Reflect/Generated/Ontology.lean` from the ontology, and `--check` exits 1 when the committed file is stale. The generator is `packages/core/src/terms/ontology-lean.ts`; `ontology-lean.test.ts` fails in `cd web && pnpm test` when the file is stale. Run the generator, then `lake build`, after any change to the ontology.

## CI

`.github/workflows/lean.yml` runs on a pull request or a push to main that touches `lean/`, `packages/core/src/terms/`, `scripts/ontology-lean.ts` or the workflow. It runs `node scripts/ontology-lean.ts --check`, then `lake build` in `lean/` through `leanprover/lean-action`, which installs elan and the toolchain in `lean-toolchain`. Its actions are pinned to commits.

## What is not built

- The Lean models of serves links and choices are abstract. No Reflect record carries a serves link or a telos yet, so nothing generates a plan from a person's records and checks it. That waits for the record types of step 2.
- Naive's term engine, which checks each term's properties, has no counterpart here: the ontology proof covers placement only.
