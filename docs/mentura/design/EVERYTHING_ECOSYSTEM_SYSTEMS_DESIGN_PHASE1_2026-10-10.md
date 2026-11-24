---
type: architecture-spec
source: hybrid
created: 2026-10-10
ai-model: claude-opus-5.5
authority: architectural
decision-status: in-force
status: ACTIVE
governed-by:
  - "[[EVERYTHING_ECOSYSTEM_DOMAIN_DESIGN_2026-10-10]]"
  - "[[DOMAIN_AND_SYSTEMS_DESIGN_METHOD]]"
related:
  - "[[METHODOLOGY_CATALOG]]"
  - "[[METHODOLOGY_ASSIGNMENT_REGISTER]]"
  - "[[skills/design-coverage/SKILL|design-coverage]]"
tags: [everything-ecosystem, systems-design, phase-1, methodology-catalog, artifact-catalog, assignment-register, typesafe, sd-01, sd-04, sd-05, sd-06, sd-07, sd-08, sd-21, sd-22, sd-23]
description: "Systems design for Everything Ecosystem phase 1, Working catalogs: the methodology catalog, artifact catalog, decision questions and assignment register become validated machine-readable files inside the vault, with a command-line tool and a TypeSafe recommender agents can use. The public website is outlined only (phase 2)."
---

# Everything Ecosystem systems design: phase 1, Working catalogs

Layer: **systems design** (SD). Implements the ratified [[EVERYTHING_ECOSYSTEM_DOMAIN_DESIGN_2026-10-10]]; every choice here must preserve its invariants (I1–I8) and trace to its concepts (SD-22).

**Phase outcome.** An agent working on any entity can (1) read the catalogs and decision questions, (2) get a recommended methodology for a system with reasons, (3) write a proposed assignment for the founder to ratify, and (4) record evidence against it. All of it checked by a validator.

**Full package for phase 1; outline for phase 2 (public website: SD-04, SD-05, SD-21 only).** Ratified by the owner 2026-10-10.

## SD-01 Functional requirements

| # | Requirement | Domain source |
|---|---|---|
| F1 | Store each methodology, artifact type and decision question as its own file with structured fields | DD-04 |
| F2 | Validate every file against a schema; report missing unfit-when conditions, unknown references and broken lifecycle states | I5, DD-06 |
| F3 | List and filter entries (by development domain, family, lifecycle state, evidence) | DD-04 |
| F4 | `recommend`: given a system description and answers to M1–M12, rank catalog methodologies by fit, with reasons, and flag answers that are assumed where cost of error is high (research trigger) | G3, P1, I2 |
| F5 | Write a **proposed** assignment file from a recommendation; never mark it ratified | I1, I2 |
| F6 | Record evidence against an assignment, append-only | I6 |
| F7 | Accept a methodology or artifact type outside the catalog as a `candidate` entry | I7 |
| F8 | Report: entries resting mainly on assumed answers; stale entries (K1); assignments with no evidence | K1–K3 |
| F9 | Make all of the above visible in Obsidian (Dataview) without the tool | Vault conventions |

## SD-02 Non-functional requirements

- **Plain text.** Every record is a text file in git, readable and diffable by people and agents.
- **Works without the network.** Everything except `recommend` runs offline and free.
- **Deterministic validation.** Same files, same result.
- **Recommendations are reproducible on record:** the inputs, model, catalog version and output are saved with every recommendation.
- **Publishable.** Nothing in the catalogs is private; assignment files for client or IP-sensitive entities can be marked `private: true` and are excluded from publishing (phase 2).

## SD-03 Capacity and cost

Tens to low hundreds of catalog entries; tens of assignments a year. No database needed. Cost is TypeSafe calls for `recommend` only: one call per candidate methodology per recommendation, on the order of 10–20 calls, run a few times a month. Validation and listing are free.

## SD-04 System context (C4 level 1)

```
 Founder ──ratifies──►┌──────────────────────────────┐◄──reads/proposes── AI agents (Claude, Cursor, Codex)
                      │  Everything Ecosystem         │
 Obsidian (Dataview)◄─│  catalogs + register + tool   │──judges fit──► TypeSafe
                      │  (in the vault, in git)       │
 GitHub ◄──push───────└──────────────────────────────┘──(phase 2)──► Public website
                                     │
                      Entity folders (the reference project, another project, …): design docs, decision ledgers
```

## SD-05 Containers

| Container | What it is | Location |
|---|---|---|
| **Catalog files** | One Markdown file per entry; fields in frontmatter, explanation in the body | `operations/catalog/{methodologies,artifact-types,questions}/` |
| **Schemas** | JSON Schema for each record type | `operations/catalog/_schema/` |
| **Register** | One Markdown file per assignment, evidence appended in the same file | `operations/register/A-NNN-<slug>.md` |
| **Tool** | Node script `ee.mjs` (validate, list, recommend, propose, evidence, report) | `operations/skills/methodology-selection/` |
| **Skill** | `SKILL.md` telling agents when and how to use the tool | same folder, with a wrapper in `~/.claude/skills/` |

The current [[METHODOLOGY_CATALOG]] table and [[METHODOLOGY_ASSIGNMENT_REGISTER]] are migrated into these files (slice 2) and become generated index views.

## SD-06 Components and contracts

| Component | Responsibility | Contract |
|---|---|---|
| Loader | Read files, parse frontmatter | Returns typed records or a parse error with file and line |
| Validator | Schema + cross-checks (references resolve; lifecycle legal; unfit-when present; ratified assignments unchanged) | Exit 0 / 1, report in Markdown and JSON |
| Indexer | Writes `catalog/INDEX.md` and `register/INDEX.md` | Generated; never hand-edited |
| Recommender | Builds one fit question per candidate methodology from the system's M1–M12 answers; calls TypeSafe; ranks | Output: ranked list, per-entry reasons, research triggers, inputs and model recorded |
| Proposer | Writes `A-NNN` with `status: proposed` | Refuses to write `ratified` |
| Evidence writer | Appends a dated evidence block | Append-only; refuses edits above the last block |

## SD-07 Data

**Methodology entry** (frontmatter):

```yaml
type: catalog-methodology
id: spec-as-source
name: Spec-as-source
domain: software            # nested: physical/built-environment/transit
family: spec-driven
lifecycle: listed           # candidate | listed | evidenced | deprecated | re-check
source-of-truth: "Spec; code generated"
answers:                    # M1–M12, each with value and basis
  M2: { value: knowable, basis: assumed }
  M4: { value: medium, basis: assumed }
fits-when: ["…"]
unfit-when: ["…"]           # required (I5)
switch-when: ["…"]
artifact-types: [adr-madr, openapi]   # references; unknown ids allowed only as candidates (I7)
bodies-of-knowledge: []
evidence: []                # assignment ids, filled by the tool
last-checked: 2026-10-10    # K1
```

**Artifact type:** `id`, `question-answered`, `readers`, `use` (executed / checked / read), `notations`, `formats`, `alternatives`, `use-when`, `unfit-when`, `lifecycle`, `last-checked`.

**Decision question:** `id` (M1…, A1…, K1…), `text`, `version`, `refined-from`, `reason` (DD-06).

**Assignment:** `id`, `entity`, `system`, `methodology`, `status` (proposed | ratified | in-force | switched | retired), `ratified-by`, `ratified-on`, `ledger-ref`, `supersedes`, `answers` (with basis), `options-considered`, `artifact-types`, `recommendation-ref`; evidence appended in the body.

All records also carry the vault's required frontmatter (`source`, `created`, `ai-model`, `tags`).

## SD-08 Interfaces

Command line (all write Markdown reports; `--json` for agents):

```
ee validate
ee list [--domain software] [--family spec-driven] [--lifecycle listed]
ee recommend --system <file-with-M1..M12-answers>
ee propose --from <recommendation> --entity <e> --system <s>
ee evidence A-NNN --note "…" [--changes M7=tested]
ee report [--stale-days 180]
```

## SD-09 Ingestion — N/A

No third-party data ingest in phase 1. The SpecOps watch reports to the founder; it doesn't write catalog files.

## SD-10 Consistency

Git is the concurrency control. The validator rejects a ratified assignment whose fields differ from the last committed version (I3, DD-06). Ids are assigned by scanning the register for the highest `A-NNN`.

## SD-11 Background work

None in phase 1, beyond the existing monthly SpecOps watch. `report` runs at session opening alongside design-coverage.

## SD-12 Read path — N/A

Files are small; no caching or search beyond Obsidian.

## SD-13 Secrets

TypeSafe key read from the existing env file used by design-coverage (`--env-file`); never written to the vault.

## SD-14, SD-15, SD-19 — N/A

No user data, no threats beyond the vault's existing git hygiene, no tenants. Revisit in phase 2 (public site).

## SD-16 Reliability

Everything is in git; recovery is `git revert`. A failed TypeSafe call leaves no partial assignment.

## SD-17 Observability

Each `recommend` run saves its inputs and outputs under `operations/register/_recommendations/`, so any proposal can be traced and re-run.

## SD-18 Deployment

No deployment: the tool runs from the vault. The skill wrapper in `~/.claude/skills/methodology-selection/` points at the vault copy (same pattern as design-coverage).

## SD-20 Testing

- Validator: fixture files for each rule (valid, missing unfit-when, illegal lifecycle step, edited ratified assignment).
- Recommender: a golden case — the first worked assignment’s answers should rank "clocks as data + TDD + contracts" components (spec-as-source narrow, TDD, design by contract) above whole-engine spec-as-source and prose spec-anchored.
- Domain acceptance (DD-10): record a second assignment in a non-software domain without schema changes.

## SD-21 Architecture decisions (MADR, short form)

| ADR | Decision | Options rejected | Why |
|---|---|---|---|
| EE-ADR-001 | One Markdown file per record, fields in frontmatter | One big JSON registry; a database | Visible in Obsidian and Dataview, diffable, agents edit naturally; JSON Schema still validates |
| EE-ADR-002 | Catalogs are canonical in the vault | Canonical in a code repo | Governance artifacts are vault-canonical (CLAUDE.md, Source of Truth) |
| EE-ADR-003 | Node CLI beside design-coverage | Python; an Obsidian plugin | Same runtime and TypeSafe wiring as the existing checker; works for every agent |
| EE-ADR-004 | TypeSafe recommends; only the founder ratifies | Automatic assignment | I2, N4 |

## SD-22 Traceability

| Domain | System |
|---|---|
| Methodology, family, development domain (DD-04) | Methodology entry fields `family`, `domain` |
| Artifact type (DD-04, A1–A8) | Artifact-type entry |
| Decision questions, P1 | Question files, versioned |
| I1, I2 | Assignment fields `ratified-by`; Proposer refuses `ratified` |
| I3 | Validator check on ratified assignments |
| I5 | Schema requires `unfit-when` |
| I6 | Evidence writer, append-only |
| I7 | `candidate` lifecycle; unknown references allowed only to candidates |
| DD-06 lifecycles | `lifecycle` / `status` enums and legal-transition check |

## SD-23 Build slices

1. **Schemas + validator + three seed entries** (spec-as-source, TDD, ADR-MADR). Done when `ee validate` passes and fails correctly on fixtures.
2. **Migrate** the current catalog table (11 software + candidates), the artifact-type table, M/A/K questions and the first assignment into files; generate the index views.
3. **list + report.**
4. **recommend + propose** with TypeSafe; golden test on the first assignment.
5. **evidence**; first evidence entry on the first assignment from its build.
6. **Skill** for agents; add `ee report` to the session-opening checklist.
7. **Domain acceptance:** a second assignment in another project or a hardware project.

## Phase 2 outline: public website

- **SD-04:** Readers on the public web; the site is generated from the vault's catalog and methodology files; private assignments excluded.
- **SD-05:** A static site generator reading the same Markdown files; hosted on a static host.
- **SD-21 (to decide):** generator and host; whether the site's source is the vault or a published export repo; licence for the published methodology.
