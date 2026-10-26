---
type: architecture-spec
source: hybrid
created: 2026-10-11
ai-model: claude-opus-5.5
authority: architectural
decision-status: proposed
status: DRAFT
governed-by:
  - "[[EVERYTHING_ECOSYSTEM_DOMAIN_DESIGN_2026-10-10]]"
  - "[[EVERYTHING_ECOSYSTEM_SYSTEMS_DESIGN_PHASE1_2026-10-10]]"
  - "[[DOMAIN_AND_SYSTEMS_DESIGN_METHOD]]"
tags: [everything-ecosystem, systems-design, phase-2, website, publishing, sd-01, sd-04, sd-05, sd-14, sd-21, sd-23]
description: "Systems design for Everything Ecosystem phase 2, the public website: the methodology published from the Ecosystem level down, generated from the vault's catalogs and documents through an allowlisted export, with nothing private able to leak. The owner decided D1-D4 on 2026-10-11; EE-ADR-005 and -006 remain proposed."
---

# Everything Ecosystem systems design: phase 2, public website

Layer: **systems design**. Implements goal G5 of [[EVERYTHING_ECOSYSTEM_DOMAIN_DESIGN_2026-10-10]] on top of phase 1 ([[EVERYTHING_ECOSYSTEM_SYSTEMS_DESIGN_PHASE1_2026-10-10]]).

**Phase outcome.** A public website presents the Everything Ecosystem from the top down (principles → domain → methodology catalog → artifact catalog → decision questions → evidence and research), generated from the vault, rebuilt on demand, and incapable of publishing anything not explicitly marked for publication.

## The site stands alone (the owner, 2026-10-11)

The methodology website is **separate from any of the founder's own work with it**. It does not reference his particular use cases (his ventures, their systems, his assignment records or decision ledgers). If use-case material is published at all, it goes in **one dedicated section**, to be designed and decided later; until then it is not published. Enforced by refusal rule R7 (`use-case-terms` in `publish.json`).

Consequences on 2026-10-11:
- Catalog entries were generalised (one-line asides about specific ventures removed). Catalog text describes methods, not this founder's projects.
- **Held back** until a standalone public edition exists: the domain design (its worked example, acceptance test and theses name the founder's cases) and the physical-methods research note (written for one assignment). Writing public editions of these is open work.
- The user-centred design entry is unpublished (`publish: false`).

## Current state

- `github.com/<owner>/sad-methodology` (Apache 2.0): a **hand-copied** export of SAD v3, last updated 2026-05-13, now behind the vault. It describes SAD as *the* methodology, which the ratified domain design no longer does.
- An existing site repo uses Astro 5 on Cloudflare (wrangler), so that stack is known.

## SD-01 Functional requirements

| # | Requirement |
|---|---|
| W1 | Pages for: principles (P1, P2), the domain design, the methodology catalog (filter by domain, family, lifecycle), each methodology, the artifact catalog (grouped by the question each answers), each artifact type, the decision questions with their versions, research notes, and public assignments with evidence |
| W2 | Generated from the vault: no content is written by hand in the site repo |
| W3 | **Allowlist publishing**: a file is published only if listed in a publish manifest *and* its frontmatter permits it |
| W4 | Wikilinks to published notes become site links; links to unpublished notes become plain text (never a dead link, never a leak of the title of a private path beyond the link text already in a published file) |
| W5 | Every page shows its status: lifecycle, tested vs assumed answers, last checked, ratified or proposed |
| W6 | The site states plainly that the methodology is under active development and which theses are untested (T1–T3) |

## SD-02 Non-functional requirements

- **No leaks** (see SD-14). This outranks every other requirement.
- Static output; no server, no database, no accounts.
- Rebuild in under a minute; reproducible from a vault commit.
- Readable on a phone; accessible (headings, contrast, alt text).

## SD-03 Capacity and cost

About 100–200 pages. Static hosting at no or negligible cost.

## SD-04 System context

```
Vault (canonical, private)                       Public
──────────────────────────                       ──────────────────────────────
catalog/, register/, methodology/,  ──export──►  Public repo (generated files + site code)
references/ (allowlisted only)       (ee publish)        │
                                                         └──build──► Static host ──► Readers
Founder runs `ee publish`, reviews the diff, commits and pushes the public repo.
```

The vault stays canonical (EE-ADR-002). The public repo is a **generated export**, never edited directly, so it cannot drift the way `sad-methodology` did.

## SD-05 Containers

| Container | What | Where |
|---|---|---|
| Publish manifest | Allowlist of vault paths and globs to publish | `publish.json` |
| Exporter | `ee publish --out <public repo>`: checks, copies, rewrites links, writes a publish report | `skills/methodology-selection/ee.mjs` (new command) |
| Public repo | Generated `content/` + Astro site code | `<repos>/<name>` (decision D4) |
| Site | Astro 5 static build, content collections for methodologies, artifact types, questions, documents | in the public repo |
| Host | Static hosting | decision D2 |

## SD-06 Components and contracts

| Component | Contract |
|---|---|
| Manifest reader | Returns the set of vault files matched by the allowlist |
| Gate | For each file: refuses if any refusal rule fires (SD-14); output is a list of published files and a list of refused files with reasons |
| Link rewriter | `[[note]]` → `/path/` if published, else plain text; embeds (`![[…]]`) of unpublished files dropped |
| Writer | Copies frontmatter (minus private fields) and body into the public repo's `content/`; deletes generated files no longer published |
| Report | `publish-report.md` in the public repo: what was added, changed, removed, refused |

## SD-07 Data

Published content keeps the phase 1 frontmatter (it is already the site's data model). Two additions:

- `publish: true | false` on any document. Absent means **not published**, even if the manifest matches it.
- Assignments: `visibility: public | private`. Absent means **private** (decision D3).

Fields stripped on export: `ratified-by` (kept as "the founder"), `recommendation-ref`, any field naming a private path, and ids of private assignments in a methodology's `evidence` list (shown as a count, e.g. "evidence from 1 private assignment"). The owner decided 2026-10-11 that public pages carry no detail of private assignments.

## SD-08 Interfaces

```
node ee.mjs publish --out <repos>/<public repo> [--dry-run]
```

`--dry-run` prints the publish report without writing. The founder reviews the public repo's git diff before committing; the exporter never commits or pushes.

## SD-14 Security: leak prevention

Refusal rules, any one of which blocks a file:

1. Path outside `everything-ecosystem/` (so `clients/`, `projects/`, `_sessions/`, `the owner/` can never be published), unless the manifest names a single file explicitly **and** it carries `publish: true`.
2. `ip-sensitivity: high`, or a path under any `_archive/` folder containing co-authored work.
3. `publish` absent or false.
4. An assignment without `visibility: public`.
5. Raw captures (`type: raw-source`, `conversation-log`).
7. **R7 (added 2026-10-11, slice 3):** the text names one of the founder's own use cases (`use-case-terms`). The `evidence:` line is not checked, because the writer reduces private assignment ids to a count.
6. **R6 (added 2026-10-11, slice 2):** the text names a term listed in `publish.json` `private-terms` (entities with no public presence, e.g. Another project). Added after the first dry run showed six pages naming another project; the owner chose generic wording in the vault ("a city-development venture").

The gate fails the whole run if a refused file is linked by embed from a published file, so a private note cannot be pulled in through a transclusion. The exporter does not scan for secrets (vault rule: don't grep for secrets); the allowlist and the refusal rules are the protection, and the founder's diff review is the last check.

## SD-15 Privacy

No personal data is published. Assignments name entities, which may themselves be private ventures: hence private by default (D3).

## SD-16 / SD-18 Reliability and deployment

The public repo is in git; rollback is a revert. Deployment is the host's build-on-push from the public repo's main branch.

## SD-17 Observability

`publish-report.md` per run, committed in the public repo, is the record of what went public and when.

## SD-20 Testing

Fixture vault with one file per refusal rule: each must be refused; a published file embedding a private file must fail the run; links to unpublished notes must render as plain text.

## SD-21 Decisions

| ADR | Decision | Status |
|---|---|---|
| EE-ADR-005 | The public site is a **generated export** of the vault through an allowlist; never hand-edited | Proposed |
| EE-ADR-006 | **Astro 5** static site (same stack as an existing site; Markdown and frontmatter are native) | Proposed |
| D1 | **Licence**: methodology text CC BY 4.0, code and schemas Apache 2.0 | **Decided 2026-10-11** |
| D2 | **Host**: Cloudflare Pages (already used) vs GitHub Pages | **Decided 2026-10-11: Cloudflare Pages** |
| D3 | **Assignments private by default**; publish one only with `visibility: public` | **Decided 2026-10-11: private by default** (assignments stay private until marked public) |
| D4 | **Repository**: reuse `sad-methodology` now and rename when the methodology's name is chosen, vs a new repository later | **Decided 2026-10-11: reuse `sad-methodology`**; move its hand-written SAD v3 content to `legacy/` with a note; rename when the name is chosen |

## SD-22 Traceability

| Domain | Site |
|---|---|
| P1, P2 | Principles page |
| DD-04 development domains, families | Catalog filters |
| I5 unfit-when | Shown on every methodology and artifact page |
| I6 evidence, tested vs assumed | Status block on every page (W5) |
| T1–T3 theses | "What we don't know yet" page (W6) |
| I7 candidates | Candidates shown, labelled unresearched |

## SD-23 Build slices

1. Publish manifest, `publish` / `visibility` fields, gate and refusal tests (no site yet).
2. `ee publish --dry-run` on the real vault; review the report together.
3. Astro site: catalog, entry pages, questions, principles, domain design.
4. Link rewriting and status blocks; research and evidence pages.
5. First export into the public repo (D4), founder diff review, host setup (D2), launch.

Slice 1 can start before D1–D4 are decided; slice 5 needs all four.
