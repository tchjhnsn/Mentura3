<!-- exported 2026-11-03 from https://claude.ai/artifact/Jh4pQmq1ZtgeukjP2EwGs8 (Claude Docs id 8f4375e8-ca45-4952-8a3a-ac46547aa5d7) -->
# Venture project structure

Oct 28, 2026 · @Torian

## The decision: folders by package or by layer

Today a venture's folders are split by layer (`purpose/`, `knowledge/`, `operations/`, `evidence/`, `governance/`), while the venture package is split by department (foundation, validation, product, marketing, finance, people). Routes are folder paths (EE-032), so a route like `purpose/validation/pricing` says which layer a record belongs to, not which package. The founder sees packages; the file system shows layers. Every route, gate and progress bar has to translate between the two.

Next.js faced the same choice and documents it as "split by feature" versus "split by type". Its answer is that the top-level folders follow what the user navigates, and the framework's own concerns (build output, private folders, route groups) are marked by naming conventions rather than by folders.

**Options**

- **A. Folders are packages.** Each core package is a top-level folder. Layers become a property of each record type (which kit, skills and checks own it), not a folder. Routes read `validation/pricing`.
- **B. Folders stay layers; packages are a view.** This is today. Simple to keep, but routes never match what the founder sees, and every package needs a lookup table to find its files.
- **C. Layers as route groups.** `(purpose)/validation/pricing.json`: the layer stays visible in the tree but drops out of the route. Keeps both, at the cost of a deeper tree and a convention founders must learn.

**Recommendation: A.** The package is the business source of truth and the gate to automation, so it should be the shape on disk, in git and in the route. Layers still matter to the framework, and they live in `schema/data-model.json` where kits already declare ownership. B is the fallback if migration risk before the deadline is too high: the demo keeps today's folders and A lands after Oct 29.

## Top-level files and folders

A venture under option A. Folders marked *not modeled* exist in the spec but are not scaffolded for founder-led ventures in Discovery and Validation.

```
<venture>/
  venture.json            identity, phase, governance model, packages on (like package.json)
  naive.config.json       optional: overrides to defaults (like next.config.js)
  provenance.jsonl        who wrote, accepted or confirmed each file

  ideas/                  Capture and Understand
    dump.md               the raw idea dump
    map.mdx               Mentura's understanding, confirmed by the founder
    graph.json

  foundation/             core package: problem, ICP, profile, telos, alignment
  validation/             core package: solution, pricing, go-to-market, PMF, evidence
  product/[id]/           core package, one folder per product
  marketing/              core package: sitemap, content, brand, site presence
  finance/                core package: business models
  people/                 core package: team, team plan, founder agreement
  legal/                  not modeled
  operations/             not modeled
  relationships/          not modeled (investors, partners, accounts)

  decisions/              the docket: one file per decision, linked to the records it changed
  observations/<stream>/  raw, append-only observations (customer feedback, interviews, ...)
  evidence/               graded, cited evidence built from observations

  _drafts/                private: agent and founder scratch, never routed or packaged
  .package/               generated: the venture package view, versions, handoffs (like .next/)
```

The split mirrors the pipeline: `ideas/` is stages 1 and 2, the package folders are where stages 3 to 6 write, `decisions/` holds stage 4, and `.package/` is stage 7. Today's `pillars/`, `accounts/` and `knowledge/` fold into package folders or into `observations/` (see Migration).

## Inside a package folder

Every core package folder has the same shape, so a router, a check or an agent can treat any package the same way.

```
validation/
  package.json            optional: this package's required/optional records, refs, gates (overrides schema/packages.json)
  README.md               generated summary: state, progress, what moves now, what waits
  problem.json            one file per record; the file name is the record name
  solution.json
  pricing.json
  go-to-market.json
  pricing.decision.json   decisions colocated with the record they changed (alternative to decisions/)
  _notes/                 private to the package, not routed
```

Rules:

- **One home per record.** A record lives in exactly one package folder. Other packages read it as a ref; they never copy it. This is the rule packages.json already enforces.
- **The file name is the route segment.** `validation/pricing.json` is the route `validation/pricing`.
- **Collections use `[id]`.** `product/[id]/` holds one folder per product, each with the same record files (`product.json`, `anatomy-answers.json`).
- **Package config is optional.** Without a `package.json` the folder uses the defaults in `schema/packages.json` for the venture's phase and governance model. With one, the founder can add optional records or tighten a gate, the same way `next.config.js` overrides defaults.
- **The README is generated.** Founders and agents edit records, never the README.

## File and folder conventions

| Convention | Meaning | Next.js analogue |
| --- | --- | --- |
| `name.json` / `name.mdx` | A record. The name is the route segment. JSON for structured records, MDX for prose (marketing content, maps). | `page.tsx` |
| `[id]/` | A collection: one folder per item (products, pages, accounts). | `[slug]/` |
| `(group)/` | A grouping folder that does not appear in the route, for example `(phase)` groups. | `(group)/` |
| `_name/` or `_name` | Private: never routed, never packaged, never confirmed. | `_folder/` |
| `.name/` | Generated by the framework. Safe to delete and rebuild; not edited by hand. | `.next/` |
| `*.decision.json` | A decision colocated with the record it changed. | (none) |
| `*.draft.json` | An agent draft awaiting the founder's accept or correction. Replaced by the record on confirm. | (none) |
| `observations/<stream>/YYYY/MM/<date>-<id>.json` | A raw observation. Append-only; a correction is a new entry that points to the old one. | (none) |
| `package.json` inside a package | Overrides that package's defaults. | `layout.tsx` (scoped config) |
| `venture.json` at the root | Identity, phase, governance model, packages on. | `package.json` |

Streams declare `sensitive: true` or `false` in `observations/<stream>/stream.json`. Sensitive streams are gitignored; only their summaries are versioned with the package.

## Routes: today and proposed

There are three route types once observations exist.

- **Record routes** resolve to one file and carry a confirm state. They feed package progress.
- **Collection routes** (`[id]`) resolve to a folder of records of the same shape.
- **Stream routes** resolve to an append-only series. They never complete; instead a package gate asks for freshness (for example, validation needs customer feedback from the last 30 days).

| Record | Route today | Proposed route | Type |
| --- | --- | --- | --- |
| Idea dump | `purpose/ideas/dump` | `ideas/dump` | record |
| Problem | `purpose/validation/problem` | `foundation/problem` | record |
| ICP | `purpose/icp` | `foundation/icp` | record |
| Pricing | `purpose/validation/pricing` | `validation/pricing` | record |
| Product | `products/[id]` | `product/[id]` | collection |
| Sitemap | `operations/marketing/site/sitemap` | `marketing/sitemap` | record |
| Page content | `operations/marketing/content/[page]` | `marketing/content/[page]` | collection |
| Business models | `operations/finance/business-models` | `finance/business-models` | record |
| Team plan | `governance/team-plan` | `people/team-plan` | record |
| Customer feedback | (none) | `observations/customer-feedback` | stream |
| Graded evidence | `evidence/results` | `evidence/[id]` | collection |
| Venture package | `package/venture-package` | `.package/` | generated |

With A, the first segment of a route is always the package, so the idea map's routing step and the package progress bar use the same key. Route aliases keep the old paths working during migration.

The "today" column is approximate for some records and will be checked against `docs/reference/ROUTES.md` before any move.

## Layers, and migrating without breaking the demo

**Where layers go.** A layer stops being a folder and becomes a field on each record type in `schema/data-model.json`: which kit owns it, which skills write it, which checks run on it. The framework repo keeps its layer folders (`purpose/`, `knowledge/`, `operations/` ...) because those hold the framework's code and kits, not a venture's files. So: the framework is organized by layer; a venture is organized by package.

**Migration, after the deadline.**

1. Add the new path for each record in `data-model.json` beside the old one, and an alias in `interface/route-aliases.json` from old route to new.
2. Teach the scaffold to write new paths for new ventures; existing ventures keep old paths and resolve through aliases.
3. Add `mentura migrate --venture <id>`, which moves files with `git mv` (history kept), rewrites provenance paths, and records a version of the package.
4. Regenerate ROUTES.md and the layer doc, run the full harness rehearsal, and only then switch the default.
5. Archive the aliases after one release; never delete them silently.

**For the demo (Oct 29).** Nothing moves. The board already shows packages; this doc is what the structure becomes, and it can be shown as the plan.

## Data packages: master and activity data

Agreed with Torian 2026-10-28 22:07Z. A venture has three kinds of data, and packages come in three kinds to hold them.

| Data kind | What it is | Examples | Lives in |
| --- | --- | --- | --- |
| Package records | Curated documents, confirmed by the founder and versioned | problem, pricing, sitemap, team plan | core packages |
| Master data | Entities with a stable id that many records refer to | customers, contacts, investors, partners, vendors, accounts | data packages, `[id].json` |
| Activity data | Timestamped, append-only events | interviews, feedback, investor touchpoints, payments, emails | data packages, `_streams/` |

Data packages are organized by subject, not by data kind, so everything about customers sits in one place:

```
customers/
  [id].json                        master: one file per customer
  _streams/interviews/2026/10/...  activity: append-only
  _streams/feedback/...
investors/
  [id].json
  _streams/touchpoints/...
money/
  accounts.json
  _streams/transactions/...        pointers to Ramp or Mercury
```

Rules:

- **Never complete.** A data package has no 100%. Its gates are coverage and freshness, for example five interviews with ICP customers in the last 30 days.
- **Read, not copied.** Core packages read data packages as refs; evidence cites master and activity ids.
- **Outside systems of record.** When a CRM, Ramp or Mercury holds the data, the master file is a pointer plus a summary, and the connector lives in the platform.
- **Sensitive streams stay out of git.** Each stream declares `sensitive` in `_streams/<stream>/stream.json`; only summaries are versioned with the package.
- **Corrections are new entries.** An activity entry is never edited; a correction points to the entry it corrects.

This replaces the top-level `observations/` folder in the tree above: raw observations are activity streams inside the data package they are about.

## Raw sources: the idea dump and its references

Agreed with Torian 2026-10-28 22:12Z, modeled on the LLM Wiki pattern: a `raw/` folder of untouched sources, and a compiled layer that cites back to it.

```
raw/                               venture-wide; ideas/ is the first consumer
  dump/2026-10-28-0912.md          the founder's own words, one file per capture
  sources/[id]/
    source.json                    url, kind (blog, article, podcast, video, pdf), added, founder's note, transcript origin
    original.*                     the file or audio, private and out of git
    text.md                        extracted text or transcript
ideas/
  map.mdx, graph.json              compiled by Mentura; every node cites raw ids
```

Rules:

- **Raw is immutable.** Mentura never edits it. A new capture is a new file; a correction is a new note pointing to the old one.
- **The compiled layer is rebuildable** from raw. The Understand gate confirms the compiled layer, never raw.
- **Citations fail closed.** Every idea on the map cites a dump line or a source passage, and the map shows which ideas are the founder's and which are borrowed.
- **References are not evidence.** A source can later be graded into low-grade desk-research evidence.
- **Copyright.** Git keeps the link, the founder's note and short quotes. Full copies stay private and out of git.
- **Transcripts.** On the platform, Mentura fetches the official transcript when one exists and transcribes only when it does not. Outside the platform, the founder supplies `text.md` however they like. `source.json` records the origin: `official`, `platform` or `founder`.

Later packages cite `raw/sources` too, for example competitor pages and market reports.

## Phase packages

Agreed with Torian 2026-10-28 22:19Z. A venture package is defined per phase: the set of core and data packages that phase turns on. Discovery and Validation are fully defined; later phases exist but are off by default. A founder may adopt a more mature phase's packages early by turning them on in `venture.json`. This replaces "not modeled", and answers open question 5: a package folder is scaffolded when its phase, or the founder, turns it on.

## The pipeline as AI-powered software (System 1)

Agreed with Torian 2026-10-28 22:33Z, following TypeSafe's guide to building with System 1 (https://docs.typesafe.ai/concepts/how-to-build-with-system-one). Code owns the workflow; the model is used only for atomic judgments, through three primitives: Choice (pick one option), Noul (a yes/no probability, thresholds 0.7 and 0.3) and Score (a rating on a scale). Naive holds the questions and state as data; Mentura runs them on TypeSafe.

| Stage | Code | System 1 |
| --- | --- | --- |
| Capture | stores raw files; platform fetches transcripts | Choice: own words or source, and its kind |
| Understand | splits the dump into fragments, compiles the map | Choice per fragment: which record it belongs to |
| Route | moves ideas to package records | Choice per idea; low confidence goes to the founder |
| Decide | combines answers with phase priors | Noul per question-matrix row; Choice for phase; Noul per option for decision help |
| Write | templates and record schemas | not System 1: a stronger model drafts, then Noul per field and a Score check it |
| Confirm | the founder confirms | Noul flags what needs attention, such as contradictions |
| Package | completeness, versions | Noul per stream entry for coverage |

**Decision help.** One Noul per option asks whether it fits the venture's current records. The top option is recommended if it reaches 0.7; otherwise the card says there is no clear recommendation. A switch in the interface (saved in `venture.json`) turns help off, and when off nothing is computed, so the founder is not anchored. Help never decides.

**Docket order.** Code combines facts it knows (how many records and packages wait on the decision, how long it has been open) with separate Scores (how hard it is to reverse, how much it changes the problem or ICP, how time-sensitive it is). Sorting the combined score gives the relative order.

**What is missing.** The same method ranks missing records and packages: the phase prior and the number of dependents from code, plus a Score for how much the gap hurts this phase's goal. The docket and the missing list share one ordering logic.

## Resolved questions

All agreed with Torian 2026-10-28, 22:07Z to 22:35Z.

1. **Folders are packages (option A).** Migrated after the hackathon deadline, through route aliases.
2. **Decisions live in one `decisions/` folder**, so the docket is a single list; each decision links to the records it changed.
3. **`ideas/` does not count toward package progress.** It is input, compiled from `raw/`.
4. **`evidence/` sits at the top level**, fed by data packages and cited by core package gates.
5. **Packages are per phase.** A package folder is scaffolded when its phase, or the founder, turns it on (see Phase packages).
6. **One word: package.** "Kit" is retired everywhere, including inside the framework, because "package" is more familiar to most people.
