---
publish: false
type: design-note
source: hybrid
created: 2026-10-31T08:30:19Z
ai-model: claude-opus-5.5
authority: implementation
status: DRAFT
tags: [everything-ecosystem, naive, venture-schema, meta-schema, proof-suite, provenance, conversations]
description: "Draft whole-venture meta-schema (axes split, levels, functions, phases, markets, roles, research, conversations as parent records) and the design of a property suite that proves, for any venture type, which records, phase, market, research and roles it needs. Architecture only; nothing here is built. Torian chose this order by card on 2026-10-31 08:28Z."
---

# Venture meta-schema and proof suite (draft)

Torian, 2026-10-31 08:24Z: define a venture through its functions, phases, identity and its parents, siblings and children; scaffold the schema for an entire venture; prove, for any venture type, which records, phase, market, research and roles it needs, including a function with zero modules; and route conversations and generated documents into records, with the thread as the parent provenance record. He chose (08:28Z) "meta-schema, then proof suite".

Everything below is PROPOSED unless it cites a decision. It is grounded in `origin/main` 752da5d.

## 1. What exists today

| Concern | Where it lives now | Gap |
|---|---|---|
| Identity | `venture.json` fields `kind`, `core` (promise, must_not, competence) | No rigid identity block (founding, founders, essential why, name history, lineage). R-01..R-12. |
| Type | `type` → `schema/venture-types.json` (9 presets) | A preset bundles business model, legal form, functions, roles, packages and decisions. It reads as an axis but is a bundle. |
| Industry | `industry` {system naics, code, label} | Fine. Supply side only. |
| Market | none | ICP records (`icp-profile.schema.json`) link to no market (R-66..R-68). |
| Legal form, funding | `form` {legal_form, funding} | Legal form belongs to a legal entity, not the venture (identity research, R-13). |
| Functions | `functions` keyed from `operations/departments.json` (13 ids), owner required (EE-071) | Only declared functions appear. A function with no owner or no module is invisible instead of named. |
| Phase | `phase` enum of 5 (EE-012) | One value, not bitemporal (R-20). |
| Packages | `packages/*/package.json` with `kind` core / data / handoff / folder / raw | Kinds already exist. `investor` (handoff) and `investors` (data) are distinct, not duplicates; the names are confusing. Core packages declare one function; validation and foundation both map to `strategy`. |
| Roles | `venture-role.schema.json`, `role-template.schema.json`, preset role lists | Roles are not tied to functions or to required decisions. |
| Provenance | `provenance.jsonl` (PROV, hash chain, EE-031), `conversation-ref.schema.json` (file, timestamp, sha256) | A conversation is cited, but it is not itself a record with children. |
| Research | none as a record | R-63..R-65 say research runs as code; no record type holds the fetch manifest. |

## 2. Principle: axes, not types

A venture is described by independent axes. A "type" becomes a **preset**: a named set of default axis values a founder can start from and then change. Nothing downstream reads the preset; everything reads the axes. This is what makes the proof suite possible: obligations are a function of axis values, so the suite can generate every combination instead of nine hand-written cases.

| Axis | Values (source) | Rigid? |
|---|---|---|
| `identity` | id, founded, founders, essential_why, names[], lineage | rigid |
| `level` | parent, siblings, children (section 3) | anti-rigid |
| `offering` | software, service, physical-good, media, capital, mixed | anti-rigid |
| `revenue_model` | subscription, transaction, services, advertising, licensing, donations, none-yet | anti-rigid |
| `industry` | NAICS 2022 code (existing field) | anti-rigid |
| `markets` | market ids (section 6) | anti-rigid |
| `entity` | link to a legal entity record, or none | anti-rigid link |
| `funding` | bootstrapped, grant, angel, venture-capital, debt, mixed (existing) | anti-rigid |
| `ambition` | existing enum | anti-rigid |
| `regulation` | exposure light / some / heavy (existing, EE-040) plus jurisdictions | anti-rigid |
| `team_size` | count of people holding roles (derived, not declared) | derived |
| `phase` | bitemporal spans over the 5 phases | anti-rigid |

`schema/venture-types.json` survives as `presets.json`: `software-startup` = {offering software, revenue_model subscription, funding mixed, ambition aggressive-growth}. Migration: `type` stays readable for one minor version and is expanded into axes by `naive migrate`.

## 3. Levels: parent, sibling, child

A venture is a node in a graph, after the relationships work in PR #107.

- **parent**: the venture that owns or spawned it (holding company, studio, fund). Zero or one at a time; bitemporal.
- **children**: products (`kind: product`, EE-054) and spun-out ventures. A product child inherits the parent's identity, entity and functions unless it overrides them; a spun-out venture does not inherit.
- **siblings**: derived, never declared: ventures with the same parent. Cross-venture reads are on by default (memory, design 2026-10-30).
- **relationships** that are not ownership (Naive–Mentura open-core framework/platform; superseded by EE-097, 2026-11-01: Mentura is Moses David's kind of AI, and which product is the platform is open) stay in the relationships package, typed and dated.

Rule: a level change (spin-out, acquisition, reparenting) is an event with effective and recorded dates, and never changes identity. A change of essential why is the open refounding-vs-amendment card.

## 4. Functions are total

Every venture declares all 13 functions in `operations/departments.json`, always (R-function four tests: total, rigid, independent, activity not identity). Each function entry has three states that the schema makes explicit:

```json
"functions": {
  "finance":   { "owner": "torian", "modules": ["finance/runway"], "status": "covered" },
  "supply-chain": { "owner": null, "modules": [], "status": "not-applicable", "because": "offering=software" },
  "risk-and-compliance": { "owner": "torian", "modules": [], "status": "missing" }
}
```

- `covered`: an owner and at least one module whose phase has begun.
- `not-applicable`: allowed only when a rule derives it from the axes (software ventures have no supply chain until `offering` includes physical goods). A founder cannot just declare it; the derivation is the evidence.
- `missing`: obligation exists, no module. Gated actions in that function fail with `E_MODULE_MISSING` and the gap goes to the docket.
- `owner: null` with obligations is `E_FUNCTION_UNOWNED`.

A **module** belongs to exactly one function (its decision classes are a subset of the function's) and to the earliest phase in which its preconditions hold.

## 5. Phase is bitemporal

```json
"phase": [
  { "value": "discovery", "from": "2026-10-20", "recorded": "2026-10-20T14:00:00Z", "evidence": ["decisions/D-012"] },
  { "value": "validation", "from": "2026-11-15", "recorded": "...", "evidence": ["validation/exit-discovery.json"] }
]
```

The current phase is the latest span whose `from` is past. Entering a phase requires the previous phase's exit criteria to hold on confirmed evidence (R-62 for Mentura's own exit).

## 6. Markets, segments, ICPs

New records in the `customers` area (data package) or a new `markets` core package under `marketing-and-sales` (open choice, section 12):

- `market`: {id, need, place, time, status existing | emerging | to-be-created, sizing ref, evidence}. A market is bound to a place and time (Torian 07:09Z).
- `segment`: {id, market, criterion, occasion?}. Lunch vs dinner is an occasion segment.
- `icp`: existing schema plus required `segment` and `relation: captures | creates` (R-66, R-67).
- `persona`: a role inside an ICP's buying roles.
- Accounts (Capital Factory, Antler) and channels are separate records that reach ICPs, never segments (R-68).

A venture with no market record gets the docket decision "which market" before any validation module can run.

## 7. Roles

A role is {id, function(s), decision classes it may sign, held_by person, span}. The preset role lists become derived: the suite computes which decision classes the obligations need, and each class needs at least one role that may sign it. A solo founder holds every role; the schema does not care how many people there are, only that every required class is signable.

## 8. Research as a record

`research/<id>.json`, produced only by the research pipeline (R-63..R-65):

```json
{
  "id": "icp-market-size-v2",
  "question": "...",
  "fetch": { "query": "all icp records", "enumerated": ["foundation/icp/ai-native-early-founders.json#2fb19cf2...", "foundation/icp/founder-mentors.json#c08622ef..."], "complete": true },
  "definition": "theorem or computable claim",
  "result": "...",
  "verified_by": "check id + certificate",
  "artifact": "https://claude.ai/artifact/..."
}
```

The fetch gate fails if `enumerated` is not the full result of `query` against the records at that commit. This is the check that would have caught the one-ICP briefing error.

## 9. Conversations as parent records

The pipeline Torian described (generated docs and threads into records):

1. **capture**: `raw/conversations/<thread-id>/conversation.json` = {id, source (thread link or transcript), participants, started, ended, storage local | mentura, redaction policy} plus `inputs.jsonl`, one line per message, verbatim, with sha256 (the existing `conversation-ref` shape).
2. **understand / route**: each candidate record names the input lines it came from.
3. **decide / write**: children are ordinary records whose provenance entry has `derived_from: [conversation id + input hashes]` and `attributed_to` the person (founder words) or the agent (agent prose, R-53). Agent-drafted fields count as missing until confirmed.
4. **confirm / package**: the person confirms; the conversation's status becomes `triaged` when every input line is routed, dismissed with a reason, or left open on the docket.

"Resolving a thread" = the conversation record reaching `triaged`. Generated artifacts (Claude Docs, playbooks) are captured the same way: an artifact is an input, never a record (records vs artifacts rule, 2026-10-29). This thread would be the first conversation record.

## 10. Draft whole-venture schema (outline)

```json
{
  "$id": "venture.v2.schema.json",
  "required": ["identity", "axes", "functions", "phase"],
  "properties": {
    "identity": { "required": ["id", "founded", "founders", "essential_why"], "...": "R-01..R-12" },
    "preset": { "description": "where the axes started; never read downstream" },
    "axes": { "offering": {}, "revenue_model": {}, "industry": {}, "markets": {}, "funding": {}, "ambition": {}, "regulation": {} },
    "level": { "parent": [], "children": [] },
    "entity": { "description": "links to identity/entities/<id>.json spans" },
    "functions": { "required": ["<all 13 ids>"], "additionalProperties": false },
    "phase": { "type": "array", "items": { "$ref": "#/$defs/phase-span" } },
    "roles": { "type": "array" },
    "packages": { "description": "installed packages, by kind" },
    "layout": {}
  }
}
```

It stays in this note, not in `schema/`, because `schema/record-types.ts --check` generates types from every `schema/*.schema.json`.

## 11. The property suite

One pure function is the thing under proof:

```
obligations(venture facts, rules version) -> {
  functions:  { id -> covered | not-applicable(because) | missing },
  modules:    required module ids by function and phase,
  records:    required record ids,
  research:   required research questions,
  roles:      decision classes that need a signer,
  market:     present | E_NO_MARKET,
  phase:      current phase + unmet exit criteria
}
```

Properties, each a fast-check property over generated ventures (every axis combination, every phase, zero to many modules):

| # | Property | What it catches |
|---|---|---|
| P1 | **Total**: every function id gets exactly one state. | A function silently dropped. |
| P2 | **Deterministic**: same facts + rules version = same output. | Hidden time, randomness, model calls (code decides). |
| P3 | **Traced**: every obligation names the rule and the facts that produced it. | Unexplainable gates. |
| P4 | **Covered or named**: a required module either exists or yields `E_MODULE_MISSING` with the function id. The zero-modules venture yields one error per obligated function and nothing else. | The zero-modules case Torian named. |
| P5 | **not-applicable is derived**: it appears only when a rule derives it from axes. | Founders hiding gaps. |
| P6 | **Monotone in phase**: obligations of phase n are a subset of phase n+1 unless a rule retires one explicitly. | Requirements vanishing as a venture grows. |
| P7 | **Evidence, not claims**: an agent-drafted or unconfirmed record never satisfies an obligation. | False positives (Torian 06:43Z). |
| P8 | **Preset-invariant**: two ventures with equal axes and different presets get equal obligations. | Type still leaking downstream. |
| P9 | **Market before validation**: no validation module is satisfiable without a market record and an ICP linked to it. | R-66. |
| P10 | **Signable**: every required decision class has a role that may sign it, or yields `E_NO_SIGNER`. | Roles disconnected from decisions. |

**Lean**: P1, P4, P6 and P8 are statements about a finite rule table and are the first candidates for Lean theorems (same pattern as spct-lean: rules as data, theorems over them). Property tests run on every PR; Lean proofs run when the rule table changes.

**Fixtures**: Naive and Mentura are the first two real ventures through the suite. Both will fail P4 and P9 today; that failure list is the scaffold of their complete schemas.

## 12. The self-improving loop

Gaps are data, not crashes: `E_MODULE_MISSING`, `E_NO_MARKET`, `E_NO_SIGNER` become docket items. A docket item can open a research question (section 8). A research result proposes a rule or module, which passes the module admission gate (R-61) and is confirmed by a person before the rules version changes. The suite reruns on the new rules version; P6 and P8 guard against the change breaking older ventures. No model writes a rule directly.

## 13. Open questions for Torian (Q1 answered in §16, Q2–Q4 in §21)

1. Markets as a new core package under `marketing-and-sales`, or records inside the `customers` data package?
2. Rename `investor` (handoff) / `investors` (data) so the kinds read differently, for example `investor-release` vs `investors`?
3. Are the 13 functions in `operations/departments.json` the right total set, or should `communications` (publishing) be added as a 14th rather than living under `marketing-and-sales`?
4. Conversation storage default: local in `raw/` with redaction, Mentura opt-in?

## 14. Build order (when approved, not before)

1. `obligations()` over today's `venture.json` with the axes derived from existing fields, plus P1, P2, P4 tests. No schema change.
2. Run Naive and Mentura through it; publish the failure list as their scaffolds.
3. venture.v2 schema behind `naive migrate`.
4. Market/segment records and P9.
5. Conversation records and triage status.
6. Lean theorems for P1, P4, P6, P8.

## 15. Revisions after Torian's 08:52Z message (proposed)

**Offering and industry are siblings, not parent and child.** Official statistics already split them. NAICS classifies the producer's activity (supply side). NAPCS, the North American Product Classification System, and the UN's CPC classify what is sold, whatever industry makes it. A concordance links them many-to-many. So:
- `offering.kind` is rigid: `good` or `service`. This mirrors CPC's top split (sections 0–4 goods, 5–9 services). It answers Torian's test that "a service exists no matter the industry".
- `offering.product` is a NAPCS or CPC code. "Software" is not a kind. It is a product class that can be sold as a good (a licensed copy) or as a service (SaaS, CPC 84).
- Example: manufacturing as a service has `kind: service`, product = contract manufacturing, and industry = NAICS 31–33. Industry-specific services come from the pairing, not from nesting one inside the other.
- A market is demand for an offering in a place and a time. So markets link to offerings, and reach industries only through offerings.

**"Level" becomes a general typed relation.** It applies to ventures, axes and axis values alike. It replaces the venture-only parent/child block in section 3. The relation types:
- `is_a`: subsumption, for example SaaS is_a service.
- `part_of`
- `produces`: venture → offering.
- `classified_as`: offering → NAPCS, activity → NAICS.
- `sold_in`: offering → market.
- `owned_by`
- `parent_of`: venture ownership.
- Siblings are derived from shared parents, for any relation.

The proof suite treats these as a typed graph. `is_a` and `part_of` must be acyclic.

**Ownership traces to humans.**
- Agents are never owners. They appear only as `contributor` with a contributor kind, as in R-53 agent provenance.
- An `owner` is a person or a legal entity. Every chain of legal-entity owners must end in natural persons, as US beneficial-ownership reporting already requires.
- Proposed errors: `E_OWNER_NOT_HUMAN` and `E_OWNERSHIP_UNTRACED`.

**People are identified by an opaque id, never by personal data.**
- Records list a person as a person id, for example `per_01J...`, with a `handle`. Handles are unique within the workspace, like usernames. Display names may repeat; a display name is never a key. This answers the case of two people with the same name.
- Legal names, ID documents and hiring paperwork (for example the I-9) live encrypted in a separate store. Records hold only the id, a verification level, and evidence hashes.
- Verification level rises with need: `self-asserted`, then `documented`, then `verified`. Each gated action states the level it requires. Examples: owning a record needs `self-asserted`; hiring someone or issuing equity needs `verified`. A level that is too low fails with `E_IDENTITY_UNVERIFIED`. This belongs to the risk-and-compliance function.
- A person is a natural-person entity under `identity/entities/`, alongside juridical entities. Only the personal fields are kept out of records.

## 16. Open question 1, run through the §15 principles (Torian asked 09:01Z)

Question: should markets be a new core package under `marketing-and-sales`, or records inside the `customers` data package?

**Step 1. What kind of thing is a market?** A market is demand for an offering in a place and a time. Demand exists whether or not this venture serves it, the same way an industry does. The venture can stop targeting a market and still be the same venture. So, relative to the venture, a market is an external entity that the venture relates to. It is not part of the venture's identity, and it is not an activity.

**Step 2. Test "inside customers" with part_of.**
- A customer is a party (a person or a legal entity) that buys. Customers are part_of a segment, and a segment is part_of a market.
- Putting markets inside customers would put the whole inside its part, which inverts part_of. **Fails.**

**Step 3. Test "core package under marketing-and-sales" with the function tests.**
- Functions are activities (how). A market is a thing (what). The Zachman remap, agreed 2026-10-30, puts packages under "what" and function modules under "how".
- Several functions read markets independently. Strategy decides which one. Products shapes the offering to the need. Finance sizes it. Marketing-and-sales reaches it. Giving one function's package the market would make the others depend on it.
- Core packages are also meant to be completed. A market is never complete: its size, competitors and signals keep moving. **Fails.**

**Step 4. What passes.** Split three things that the question bundled:

| Thing | Kind | Home |
|---|---|---|
| The market, its segments, its ICPs and personas | External entities, never complete, gated by coverage and freshness | A new `markets` data package, sibling to `customers`, `investors` and `money`. The records are flat; nesting uses relations (`segment part_of market`, `icp describes segment`, `market part_of market` for Austin within the US), not folders. |
| Which markets the venture targets, and whether it captures or creates each one | A decision (anti-rigid, dated) | The docket, owned by the strategy function. The decision writes the relation `offering sold_in market` to the relation graph. |
| Market size, and the evidence that the market exists | Research | Research records (§8), cited by the market record. Sizing goes stale through the package's freshness gate. |

`customers` stays as it is. Each customer gains a derived relation `member_of segment`, computed from evidence and never declared.

**Step 5. What this changes elsewhere.**
- **ICPs leave `foundation/`.** `foundation/` becomes `identity/` (decided 2026-10-30 22:05Z). An ICP is not identity, since a venture can change its ICP and remain the same venture. So `foundation/icp/*.json` moves to `markets/`, and each ICP gains a `segment` link. The two existing ICP records keep their ids; their content hashes change only through the migration.
- **"to-be-created" needs no special case.** A market the venture is creating is the same kind of record, at the lowest rung of the evidence ladder: there is a hypothesis, and no demand has been observed yet.
- **A data package needs a steward.** Under the ownership rule, the steward of a data package is a human who holds a role in the steward function; here that function is strategy. Agents only contribute.

**Answer (proposed):** neither option. Markets become a data package of their own. Targeting is a decision, and sizing is research.

**Proof-suite properties this adds:**
- **P11:** `part_of` and `is_a` never place a whole inside its part (acyclic, and in the right direction).
- **P12:** every ICP links to a segment, and every segment links to a market.
- **P13:** every targeted market has a dated decision and current research; otherwise it fails with `E_MARKET_UNSIZED` or `E_MARKET_UNDECIDED`.

## 17. Records that go stale: temporal classes (Torian 09:06Z, proposed)

**What exists.** `schema/freshness.mjs` and `knowledge/freshness.json` (Revalidating, V-1 to V-3) give each record type one profile, after Next.js cacheLife: `stale`, `revalidate`, `expire`, `per_phase` and `live`. Decision records already render stale when a cited file's sha256 changes. These are the gaps:
1. A profile is fixed per record type. It cannot depend on the phase or on the venture.
2. There is no dependency invalidation for computed records. When an input changes, a sizing record does not know.
3. Stale is binary. Nothing tells a change that matters from noise.
4. Nothing measures how fast a subject actually moves.

**Step 1. Temporal class is a rigid property of a record type.** It describes how the record relates to time, not how fast it moves.

| Class | What it is | Changes? | Examples |
|---|---|---|---|
| `event` | Something that happened, at a time | Never. A correction is a new event. | Founding, a decision entry, a conversation input, a provenance line, a signed contract |
| `state` | What is true over a span | New bitemporal span: valid time and recorded time (SQL:2011, slowly changing dimension type 2) | Phase, owner of a function, legal form, a market's status |
| `observation` | A reading of something outside, at a time | Append-only time series | Interview notes, a price quote, a sign-up count, a competitor's pricing page |
| `derived` | Computed from other records by a stated method | Recomputed, never edited. It carries its inputs' hashes and its method version. | Market size, the obligations output, a score, a forecast |

A sizing record is `derived`. Its inputs are observations and research fetches; its method is the sizing definition.

**Step 2. Staleness has three triggers. Only `derived` and `state` records can go stale. Events never do.**
- **Input changed**: an input hash differs. This is exact, cheap and needs no clock. It generalizes what decision records already do.
- **Clock**: the subject may have moved even though nothing in the records changed. This is what the profiles cover today.
- **Event**: a phase change (`per_phase` today), a market event or a level change.

**Step 3. Volatility is a property of the subject, in a phase, for a venture.** It is not a property of the record type. This is the stock-market point: a market's size moves slowly for a local restaurant and fast for AI tooling, and a price decision is volatile in Validation but settled in Scale. So the profile becomes a function, chosen by rules from the same facts as `obligations()`:

```
freshness(record type, subject, phase, venture axes) -> profile
```

- Its defaults are today's profiles.
- Rules can tighten a default. For example: industry is in a fast-moving NAICS group, or phase is discovery or validation, so `research` revalidates in 30 days instead of 90.
- **Observed volatility** adjusts a profile within bounds. Each revalidation records whether the value moved and by how much. A subject that keeps moving gets a shorter interval, and one that never moves gets a longer one. This is adaptive TTL, the same idea as HTTP heuristic freshness. The bounds keep it deterministic and auditable, and the rules alone decide the bounds.

**Step 4. Materiality: when a stale input matters to a decision.** This is the judgment-engine part. A decision cites derived records the way an options position cites a price, and each citation carries a sensitivity:

```json
"reasons": [{ "ref": "markets/austin-founders/size.json", "sha256": "...", "valued_at": 700, "reopen_if": { "moves_by": "25%" } }]
```

- When an input revalidates and moves past `reopen_if`, the decision **reopens** and goes back on the docket, at the top if it is time-bound.
- A smaller move only renders the decision **stale, still holding**.
- Bitemporal: the decision record keeps what was known when it was decided (`valued_at`, recorded time) beside what is true now (valid time). "Were we wrong, or did the world change?" is then a query, not an argument.
- Reopening walks the dependency graph. Records derived from a reopened decision are flagged too, within the cascade cap (depth ≤ 3).

**Step 5. Proof-suite properties.**
- **P14:** `event` records never change. A changed hash on an event is `E_EVENT_MUTATED`.
- **P15:** a `derived` record is stale whenever any input hash differs. Nothing derived from it counts as evidence (P7) until it is recomputed.
- **P16:** `freshness()` is total and deterministic, like P2. Its output stays within the declared bounds for every venture and phase the generators produce.
- **P17:** a decision reopens if and only if a cited input moved past its `reopen_if`. There are no silent reopenings and no missed ones.

**Decided (Torian 09:15Z):** a frame in the decision library sets `reopen_if` by default, and the founder can change it in settings (`naive.config.json`, beside the freshness overrides that already live there).
**Open, research:** which NAICS groups count as fast-moving.

## 18. The data-management convention, and what it changes (Torian 09:15Z)

**What he remembered.** Two earlier discussions:
- **2026-10-28 03:25Z:** the master data management (MDM) research doc, https://claude.ai/artifact/RD24TRtsthiAGJ5kEyiTQ7. It uses DAMA-DMBOK terms: master data, system of record, golden record, survivorship, data owner, data steward, lineage, and the four hub styles (registry, consolidation, coexistence, centralized).
- **2026-10-28 22:05Z:** "master data vs activity/transactional data". That discussion produced data packages: `[id].json` master records plus append-only `_streams/` (agreed 22:07Z).

DAMA-DMBOK sorts data into categories by how they change:

| DAMA category | How it changes | Who changes it | Naive today |
|---|---|---|---|
| Reference data | Rarely, by published release | An outside authority (Census for NAICS, ISO for country codes, the UN for CPC) | Not modeled. NAICS codes sit in `industry` with no release. |
| Master data | Slowly; history kept as slowly changing dimensions | The venture, through a data owner | Data-package `[id].json` records |
| Transactional (activity) data | Never once written: append-only, high volume | Whatever happened | `_streams/`, `provenance.jsonl`, the decision log |
| Metadata | When the framework changes | The framework | Schemas, `knowledge/freshness.json` (profile `none`) |
| Analytical (derived) data | Recomputed from the categories above | A method | Scores, decision analytics (EE-072) |

**Effect 1. Use one vocabulary.** Section 17's temporal classes are DAMA's categories under other names. Adopting DAMA's names keeps one standard:
- `event` and `observation` → **transactional**. An observation is a transaction with something outside the venture.
- `state` → **master**.
- `derived` → **analytical**.
- Add **reference** and **metadata**.
Properties P14 and P15 keep their meaning under the new names.

**Effect 2. Reference data is the missing class, and section 15 depends on it.** Offering, industry and market codes are reference data, and they go stale by release, not by clock or by input. NAICS is revised every five years; a 2027 revision is due. So:
- Each code a venture uses cites its release, for example `{ "system": "naics", "release": "2022", "code": "541511" }`.
- Concordances (NAICS↔NAPCS, NAICS↔ISIC) are reference data too.
- The framework ships them in `knowledge/reference/`.
- A new release is an event that marks every citing record stale (section 17, trigger 3).
- Proposed property P18: every code cites a release that exists in `knowledge/reference/`.

**Effect 3. Freshness by category:**
- Transactional records never go stale.
- Master records go stale by clock or by event.
- Reference records go stale by release.
- Analytical records go stale when an input changes.
- Metadata changes only with the framework version.
So the category decides which staleness triggers apply, and the `freshness()` rule then sets their timing.

**Effect 4. Survivorship fits derived records with several sources.** Market size from three research sources disagrees. The sizing method states a survivorship rule (most recent, most authoritative, or a range), and the record keeps every input. This is the MDM answer to "which number do we decide on".

**Effect 5. Owner and steward map onto the ownership rule (section 15).** In DAMA, the data owner is accountable and the data steward runs the work.
- In Naive, both are humans holding roles.
- Agents may draft steward work (definitions, conflict queues), but only as contributors.
- A data package names an owner (a person id) and a steward function.
- Which MDM hub style a venture uses stays a per-domain choice. Registry style is Naive's default (Mentura offers the heavier styles); not decided.

### 18a. Checked against the web (09:17Z)

**DAMA categories.** Secondary sources confirm the split between reference data (it classifies other data and defines permitted values) and master data (parties, products, locations; non-transactional). Transactional data records events and depends on both for its meaning. One study guide rates reference data as low volatility but "not completely static", and master data as moderate to high volatility. I could not reach DMBOK2 chapter 10 itself.
- https://en.wikipedia.org/wiki/Reference_data
- https://en.wikipedia.org/wiki/Master_data
- https://open-exam-prep.com/study-guides/cdmp/master-reference-data/master-vs-reference-data

**Six layers of data.** A 2015 deck (AskGet.com; often credited to Malcolm Chisholm, but that credit is unverified) splits data into six layers:
- metadata
- reference data
- transaction structure data (the participants that must exist before a transaction fires)
- enterprise structure data
- transaction activity data
- transaction audit data

It adds two layers that DAMA's short list lacks:
- **Enterprise structure** maps to our functions, roles and level relations. It is what lets activity be reported by responsibility.
- **Transaction audit** maps to `provenance.jsonl`.

Source: https://archive.topquadrant.com/resources/blogs/semantic-ecosystem-journal/docs/RefDataPrepMCRC-Final060215.pdf

**Kimball's slowly changing dimensions** give the change rate a vocabulary:
- **Type 0:** never changes. This is identity (rigid fields).
- **Type 1:** overwrite, with no history. Naive should forbid it.
- **Type 2:** a new row with effective dates. These are our state spans.
- **Type 4, the mini-dimension:** attributes that change rapidly are split off from a large dimension. Otherwise Type 2 history makes the dimension grow without bound (Kimball's "rapidly changing monster dimension").

Sources:
- https://en.wikipedia.org/wiki/Slowly_changing_dimension
- https://www.kimballgroup.com/data-warehouse-business-intelligence-resources/kimball-techniques/dimensional-modeling-techniques/type-4-mini-dimension/

**What the web check adds:**
1. **Split by change rate inside a record type (Type 4).** A market record keeps only its slow attributes: need, place, time and status. Its fast attributes go to their own records: size, prices and competitor moves. Section 16 already does this for sizing; this is the standard justification and the general rule. A proof-suite check: no master record holds an attribute whose freshness profile is faster than the record's own profile.
2. **Each field declares its SCD type.** Identity fields are Type 0, master fields are Type 2, and Type 1 is never allowed. This lets the property suite check P14 field by field, not only record by record.
3. **Transaction structure must exist before activity.** A stream entry must reference master records that already exist, for example an interview that cites a person id. This is P19.

## 19. Storing references, at every level (Torian 09:22Z; storage DECIDED 09:29Z by card: once per scope, cited by id)

**What exists.**
- EE-014: one `references.json` per framework layer, with 26 entries in total. Each entry has `kind`, `url`, `checked`, `informs` (noun / phase / gate / rule / field) and `stance` (adopted / adapted / alternative / rejected). The find-reference skill fills gaps.
- R-34..R-38, directed 2026-10-31 03:20Z:
  - A reference is a link plus a note plus the claim it supports. Copies go in `raw/sources/<id>/`, with originals kept private (EE-070).
  - A lint checks that each link resolves and still says what it is cited for.
  - Weight is dynamic: foundational impact and current relevance are scored separately.
  - Whether a reference is outdated is a judgment, which a person can review.

So half of this is already decided. What is missing is the scoping by level, and one convention shared by the framework and ventures.

**Blind spot 1. "References" and "reference data" are two different things.**
- **Reference data** (§18) is code lists that classify other records: NAICS, ISO 3166, CPC.
- **References** are sources, the evidence behind a convention or claim: DAMA-DMBOK, Kimball, a blog post, a conversation.
- They connect at one point: each release of a code list is itself cited by a reference (the NAICS 2022 manual). Treating them as one class would mix a code list's values with the reason we adopted it.

**Blind spot 2. A folder per level duplicates.** If the founder, the venture, the engineering function and this feature each kept a `references/` folder, DAMA-DMBOK would exist in four copies. Each copy would drift, which is the golden-record and survivorship problem from §18. The principle from §15 and §16 applies: store flat records once, and express levels as relations.
- **A reference is stored once per scope, as a master record.** The path is `references/<id>.json`, and its fields use the CSL-JSON bibliographic fields that Zotero and Pandoc use, plus DOI, ISBN or URL as identifiers.
- **Each level cites it.** A citation is a small edge record: who cites it (a person id, a venture, a function, a module, a field), the claim it supports, the stance, and a hash of the quoted passage. Citation types can follow CiTO, the Citation Typing Ontology, whose relations include supports, disputes, uses-method-in and extends; it maps onto our `stance`.
- **"The references of engineering" is a query** (citations where the citer is under engineering), not a folder. The same holds for any axis point, as Torian asked.

**Blind spot 3. There are three scopes, and they have different owners and privacy.**

| Scope | Holds | Owner | Privacy |
|---|---|---|---|
| Framework (Naive, shipped in packages) | Why Naive's conventions are what they are: DAMA, Kimball, NAICS, Blank | Naive (the venture), stewarded by its owner | Behind the waitlist, with the docs (R-45) |
| Workspace / founder | A person's own library across ventures | That person | Private by default; cross-venture reads on within the workspace |
| Venture | Sources behind the venture's own records and decisions | The venture's owner | Venture-private; copies in `raw/` private |

A venture may cite a framework or founder reference by id without copying it. Copying happens only on export, and then with provenance.

**Blind spot 4. A reference goes stale in four ways.** The reference kind decides which apply, as the DAMA category does in §18.

| Way | Check | Applies to |
|---|---|---|
| Link rot | The url resolves (`checked`). Snapshot to a web archive on first cite. | Web pages, articles |
| Content drift | The quoted passage hash still matches (R-35) | Web pages, docs |
| Superseded | A newer edition or release exists, or the paper was retracted | Standards, laws, datasets, books, papers |
| Relevance | Current-relevance weight (R-36). A judgment, person-reviewable (R-37). | All |

Conversations never go stale; they are transactional. When a reference changes, the claims citing it go stale, and §17's `reopen_if` decides whether a decision reopens.

**Blind spot 5. Internal decisions are references too.** EE-NNN, G-NNN and D-NNN are cited by id (the repo rule), through the same citation edge. "Why is X so?" then has one answer path, whether the reason is a book or a decision.

**Dogfood.** The first entries are the sources behind this note: DAMA (via its secondary sources), the six-layers deck, Kimball, NAICS and NAPCS, CPC, OntoClean, CSL-JSON and CiTO. The first citer is this design note.

**Migration.** EE-014's per-layer `references.json` files become entries in the framework library plus citation edges (`informs` becomes the citer and `stance` becomes the citation type), so the layer files go away along with layers leaving the tree.

**Proof-suite properties.**
- **P20:** every adopted or adapted convention (noun, rule, gate, field) has at least one citation.
- **P21:** no reference id exists twice in one scope.
- **P22:** every citation's reference exists in a scope the citer can read, without a copy.
- **P23:** every reference has a freshness check for each way that applies to its kind.

## 20. Correction found while recording the 09:29Z decision

On 2026-10-27 at 03:55Z we agreed to a revised proposal in the spheres research: market, job, technology, offering and business model go on product cards (`products/<id>.json`), not on `venture.json`. Sections 2 and 15 put `offering`, `revenue_model` and `markets` on the venture. To fit the earlier agreement:
- These axes move to the product. The relation `venture produces offering` (§15) is the link between the two.
- A venture's offerings, revenue models and markets are derived as the union over its products.
- `industry` stays on the venture, as the industry of its current flagship, per the same agreement.

The proof suite generates products as well as ventures, and properties P8 and P9 are evaluated per product.

## 21. Open questions 2–4, run through the same principles (proposed)

### Q3. Should communications (publishing) be a 14th function?

**Where the 13 come from.** `operations/departments.json` (EE-047) uses the 13 top-level categories of APQC's cross-industry Process Classification Framework, version 7.x. APQC has no communications category. Instead it spreads communications across categories:
- marketing communications sit under 3.0 (Market and sell);
- employee communications under 7.0 (Human capital);
- investor, public, government and board relations under 12.0 (Manage external relationships).

**The four function tests.**
- **Total:** yes, every venture communicates.
- **Rigid:** yes.
- **Independent:** no. Every function publishes something, so publishing is an activity done inside other functions, not alongside them.
- **Activity, not identity:** yes.

Because it fails independence, publishing is a **shared module, not a function**: the publish router and gate pipeline (R-47..R-61), used by every function. Each publication records its sender function as the citer, and the gates are the same for all senders. The module itself has to be owned by someone. I'd propose `external-relationships` (12.0) for anything public, with the sending function accountable for the content.

**Answer:** keep 13. This revises the earlier note "publishing → communications function", which had failed the independence test.

### Q2. `investor` (handoff) vs `investors` (data)

**What a handoff is.** A handoff holds no records of its own. It is a versioned snapshot of core packages for one receiver, which is what "release" means (decided 2026-10-28 22:58Z).

**Answer:** handoffs leave `packages/` and become release templates under `releases/<receiver>/`:
- `investor`
- `cofounder`
- `counsel`
- `engineering`
- `partner`

The name collision disappears. Package kinds shrink to core, data, folder and raw, and every release cites the package versions it froze.

### Q4. Where do conversations live by default?

**What a conversation is.** It is transactional data (§18). It never changes, and it often contains other people's words and personal data. DAMA and our own 2026-10-28 rule agree on how to treat that: sensitive streams stay out of git, and only their summaries and hashes are versioned.

**Answer:**
- **Default:** local storage under `raw/conversations/<id>/`.
- **In git:** `conversation.json` and `inputs.jsonl` with hashes, speakers as person ids, and redacted text.
- **Private and local:** the verbatim text of anything with a third party (interviews, calls).
- **Founder-and-agent threads:** these may keep verbatim text in git once redacted, since the founder is the only person in them.
- **Mentura storage:** opt-in, and only with the consent of every participant who is a person. Consent is itself recorded as an event.

## 22. Refounding vs amendment, decided by code (prototype, 09:40Z)

Torian, 09:37Z: "We should be able to prove whether something is a refounding or an amendment through code verifications and proofs. Try it."

**The prototype** is in `/mnt/project-files/naive-design/prototypes/refound/` (`refound.ts`, `refound.test.ts`; Node 22 with `--experimental-strip-types`). It is not in the repo. Its 8 tests pass, and they run 5,000 generated cases per property.

**The rule.**
1. The essential why is structured into rigid components: `job`, `for_whom` and `benefit`. Each component is a concept id in an `is_a` taxonomy, which is reference data.
2. Each rigid component is compared with the **anchor**: the why at founding, or at the last refounding. A component either stayed the same, got narrower (the new concept is_a the old one), got broader (the old concept is_a the new one), or was **replaced**, meaning no is_a path exists either way.
3. **Refounding if and only if some component was replaced.** Otherwise it is an amendment. A refounding moves the anchor.

**Properties checked.**
- **P0:** the taxonomy is acyclic.
- **P1:** the classification is total and deterministic.
- **P2:** a why with no change is an amendment.
- **P3:** refounding holds exactly when some rigid component has no is_a path to the anchor either way.
- **P4:** the classification is symmetric.
- **P5:** no drift. If the latest why is unrelated to the anchor, some step in the history was flagged as a refounding.
- **P6** is a counterexample that justifies the anchor. If each version is compared only with the previous one, two amendments can drift into a different venture: narrowing "founders" to "people", then "people" to "restaurant owners". Comparing with the anchor catches it.

**What is proved and what is judged.**
- Code decides the verdict once each component is a confirmed concept id.
- Mapping a sentence ("we help solo founders...") to a concept id is a classification. A model may propose it; a person confirms it (S7: code decides, models classify inputs).
- The taxonomy's quality limits the verdict. Its is_a edges are themselves reference data, with citations (§19).

**Gaps.**
- Broadening all the way to a near-root concept (for example "people") counts as an amendment. Proposed fix: broadening more than one level, or to a root, needs a person's review; the verdict itself does not change.
- Whether `must_not` and `competence` are rigid components too is still open.
- Lean is not installed in this container. P3, P4 and P5 are statements over finite taxonomies and are good first Lean theorems (on the spct-lean pattern: no Mathlib, rules as data). Property tests sample cases; Lean would prove the properties for every taxonomy.

## 23. Vocabularies proved as they arise (Torian 09:53Z, proposed)

Question: can a function, a venture, an industry or a market have its own vocabulary that code verifies and Lean proves? Not by proving a whole lexicon up front, but by proving each term as it arises.

**The theorem to establish is an admission rule plus an invariant.**
- Let `V` be a vocabulary (an environment of admitted terms) and `I(V)` an invariant on it.
- The theorem: if `I(V)` holds and `admit(V, t)` succeeds, then `I(V ∪ {t})` holds.
- The empty vocabulary satisfies `I`. By induction, every vocabulary built only through `admit` satisfies `I`.
- So the whole lexicon is proved without ever checking it all at once, and each admission checks only one term against what already exists.

This is how Lean itself works: its kernel never checks a whole library, it checks each new definition against the environment of earlier ones. It is also the shape of ISO 704 terminology work: a concept is defined by its genus plus what distinguishes it.

**The invariant `I`, proposed.**
- **I1 Unique label per scope.** After normalizing forms (founder/founders become one lemma), each scope has one preferred label per concept. A second word for the same concept becomes an alternative label, not a new term. This is SKOS's integrity rule, and it is the guard against synonym drift.
- **I2 Well-founded definitions.** A definition uses only terms already admitted, or primitives from reference data. Definitions form a DAG, so no definition is circular.
- **I3 A genus.** Every concept is_a some admitted or inherited concept, so the vocabulary is a rooted taxonomy (§15, R-41).
- **I4 No silent shadowing.** A narrower scope (function inside venture inside market inside industry) may specialize an inherited term, but redefining it needs an explicit decision. Siblings may hold homonyms, for example `finance:margin` and `design:margin`, because a term is always qualified by its scope.
- **I5 Typed.** Each term has a part of speech that maps to the model. Nouns name entities and record types: the arguments in the diagram, and the rigid kinds. Verbs name activities and gated actions: the predicates, and functions' work. A verb cannot be admitted as a record type.
- **I6 Grounded.** Each term cites the input where it arose (a conversation input hash, §9), and its owner, a person, confirmed it (§15).

**How Torian's diagram maps on.**
- Leaves 1A–1C (roots, prefixes, suffixes) feed the deterministic lemma normalization behind I1.
- Node 2 (lexical stems) is where admission happens.
- Nodes 3A and 3B (nouns as arguments, verbs as predicates) are I5.
- Node 4 (syntax) is the existing prose and structure gates (R-58..R-61).
- Node 5 (semantics and pragmatics) is the part that cannot be proved. Whether a definition captures what people mean is judged: evidence of usage plus a person confirming it.
- The root (complete utterance hash) is the conversation input hash, which already exists.

**"As it arises."**
- The publish lint and the record lint flag words that are salient but not admitted in their scope.
- Each flagged word becomes a proposal on the docket.
- Admission runs the check, and a person confirms.
- Vocabulary therefore grows from real use, never from a dictionary written in advance.

**What this proves, and what it doesn't.**
- Proved: structure. Uniqueness, no cycles, a genus, no shadowing, typing, and grounding.
- Not proved: meaning, and whether a term is the right word for the market. Those stay on the evidence ladder.
- Cost: a check against the term's scope and ancestors on each admission (near-linear with an index). Nothing heavy, and nothing over the whole lexicon.

**Lean.** Lean is not installed here. The theorem is small: `admit_preserves : I V → admit V t = some V' → I V'` over a finite structure, with `I` a conjunction of decidable checks. It fits spct-lean's pattern (no Mathlib, rules as data).

## 24. Vocabulary kernel, pragmatics, reference clashes, library inheritance (Torian 10:00Z, proposed)

### Keeping it from being too rigid

- **Two vocabularies, one mapping.** The controlled vocabulary (admitted concepts) governs records, gates and published claims. People keep speaking their own way. Their words map onto concepts as alternative or hidden labels (SKOS `altLabel` and `hiddenLabel`). The kernel never rejects what someone said in a conversation; it acts only where a record or a publication makes a claim.
- **Register, not one true word.** One concept can carry a different preferred label for each audience: a founder, an investor, a customer, a regulator. A publication picks its labels by channel. Pragmatics then lives in the choice of label, and the concept stays fixed.
- **Severity by place.**
  - In records, an undefined or ambiguous term **blocks**.
  - In a draft, it **warns**.
  - In a conversation, it only **suggests**.
- **Blind spots become suggestions.** When someone describes a concept without knowing its formal name, the engine offers it: "what you describe is called a right of first offer". Matching a description to a definition is a model's proposal, and the person decides. This feeds the blind-spot module, which sits in the person's private records (2026-10-31 06:55Z).
- **Unknown is not wrong.** A new word becomes a docket proposal, never an error. The docket and the person's confirmation decide.

### Kernel and engine

Yes, and the two should be separate, following the LCF design and the de Bruijn criterion: a small trusted checker, with everything else outside it.
- **Kernel (trusted, small, proved):** `admit(V, t)` and `overlay(V, o)`. It checks only the decidable invariants I1–I6 (§23). Its correctness theorem is `admit_preserves`.
- **Engine (untrusted, replaceable):** everything that proposes. Lemma normalization, salient-word detection, extracting definitions from references, model-proposed mappings, clash detection, and suggestions. Every output is a candidate, which the kernel checks or a person confirms.
- This matches the research decision of 2026-10-30 05:12Z: a mechanical checker plus re-checkable certificates.

### References with clashing definitions

- **Each reference contributes defined terms.** A reference record (§19) gains `defines: [{label, definition, genus}]`, extracted by the engine and confirmed.
- **Two kinds of clash:**
  - **Homonym:** the same label in two references, with genera that have no is_a path either way. This is structural, so code detects it, using the same test as refounding (§22).
  - **Synonym:** two labels for the same concept. This is a judgment, so a model proposes it and a person confirms.
- **A clash becomes a decision.** It goes on the docket and is resolved by one of: adopt one, adapt (narrow the term per scope), qualify by scope (`finance:margin`), or record the two terms as distinct concepts. The resolution cites both references, the CiTO `disputes` / `agrees` types (§19).
- **Impact gate.** Admitting a reference whose weight (R-36) is at or above the scope's threshold triggers the clash scan for that scope. Lower-weight references are scanned in batch. The default threshold comes from the module, and the venture can change it in settings (same rule as `reopen_if`, 09:15Z).
- **Propagation.** A resolved clash that changes a concept marks stale every record using the term (§17). A decision reopens only past its threshold.

### The library as the central system, with ventures customizing their instances

This is MDM applied to vocabulary (§18). The library is the hub for vocabulary, and ventures register against it.

- **Scope chain.** Library core (cross-industry) → industry (NAICS) → market → venture → function → module instance. Each scope inherits from its parent by reference, never by copy (09:29Z decision).
- **Customization is an overlay.** A venture's change applies to its instance of a module, never to the library. An overlay record has:
  - `base: "<concept id>@<library version>"`;
  - the change: a new preferred label, a narrower definition, or an added alternative label;
  - a reason and its references;
  - the decision that approved it.

  This is the same pattern as Kustomize overlays, `patch-package` and the CSS cascade. The kernel checks that the overlay keeps I1–I6 (I4: a redefinition needs its decision).
- **Library upgrades work like a rebase.** When the library releases a new vocabulary version, every overlay is replayed onto it. An overlay that still passes the kernel carries over silently. One that conflicts goes to the venture's docket. A venture can pin a version.
- **Upstream signal (Mentura, later).** When many ventures make the same overlay, the library is probably wrong. With consent and aggregation, that becomes a proposal to the library's own docket. That is the self-improving loop of §12 applied to language.
- **The venture chooses its own references over time.** Its references join its scope, and the clash scan runs on them against the inherited vocabulary. The venture's vocabulary drifts only by recorded overlays, so "why do we call it this?" always has an answer.

### Proof-suite properties

- **P24:** an overlay never changes any scope other than its own instance.
- **P25:** replaying a set of overlays onto a library version is deterministic, and each overlay either applies or yields a conflict. None is silently dropped.
- **P26:** no record or publication in a scope uses a label that is ambiguous in that scope. Conversations are exempt.
- **P27:** every homonym clash in a scope's references has a resolving decision before any record in that scope uses the term.

## 25. Polysemy is data, not an error (Torian 10:06Z and 10:09Z, proposed)

**What Torian said.**
- Many words legitimately carry several meanings, and the system must allow this.
- We must not lock in a meaning that the industry itself has not locked in. Examples: "model" means something different in Rails, in AI and in finance, and "harness" varies too.
- His hypothesis: variance in meaning shrinks as you go down the scope chain, from industry to market to segment.
- Detecting words that lack a convention could become a separate service, the way agents.md became a convention.

**Revision to §23 I1.** Uniqueness moves from the vocabulary to the **use site**.
- A label maps to a *set of senses* in every scope. Many senses per label are allowed.
- What must be unique is the sense a record or publication uses. It is resolved like lexical scoping in code: the nearest enclosing scope with exactly one sense for the label wins. Otherwise the use names the sense explicitly (`model#ml`, `model#rails-orm`).
- P26 is restated: no record or publication uses a label whose sense is unresolved at that point. A label being ambiguous somewhere in the vocabulary is fine.
- This is how WordNet (synsets) and SKOS (separate concept schemes sharing a label) already work.

**The library records senses with evidence, never a decreed meaning.** Each (label, scope) pair has:
- its senses, each with a definition, a genus and citations to usages (§19);
- an observed **sense distribution**: how often each sense is used in that scope, counted from records, references and, with consent, public corpora;
- a **convention status**, derived from evidence and never declared:

| Status | Rule (proposed) |
|---|---|
| `contested` | No sense holds a clear majority in the scope |
| `emerging` | One sense is rising but below the threshold |
| `conventional` | One sense dominates the scope's usage above a threshold, over a time window |
| `standardized` | A recognized body fixed it, for example RFC 2119 for MUST and SHOULD, ISO terminology, or AGENTS.md under the Agentic AI Foundation |

The library only *defaults* a sense in a scope that is `conventional` or `standardized`. In a `contested` scope, every use must pick a sense explicitly. "Locking in what the industry hasn't locked" is then impossible by construction.

**Torian's narrowing hypothesis, made measurable.**
- Measure **sense entropy** per (label, scope). High entropy means many senses in comparable use; low entropy means one sense dominates.
- Hypothesis H-V1: entropy usually falls going down the chain (industry → market → segment → venture).
- This is a hypothesis to test, not a rule to enforce. Known counterexample: narrow scopes sometimes coin their own sense. "Harness" in Torian's own workspace means only the entity class for a first-party interface (G-029). Inside that scope entropy is low, but the sense *diverges* from its parent's.
- So two separate measures:
  - **dispersion within a scope** (entropy);
  - **divergence from the parent scope** (how far the dominant sense differs from the parent's).
- Both are useful. Low dispersion with high divergence is exactly jargon, and a newcomer's blind spot (§24).

**Proof-suite properties.**
- **P28:** a default sense exists only where the status is `conventional` or `standardized`.
- **P29:** every sense resolution is deterministic, given the scope chain and explicit tags.
- **P30:** convention status is a function of the evidence and the thresholds alone. Recomputing it from the same evidence gives the same status.

H-V1 itself is not a property. It goes to research.

**The service idea (architect only, per the 06:38Z overbuilding rule).** A "convention observatory":
- It maps contested terms across industries.
- It publishes sense maps with evidence.
- It helps communities converge, the way RFC 2119, schema.org, Wikidata lexemes, ISO TC 37 and the AGENTS.md effort did.

Open, all of it:
- whose service it is: Naive, Mentura, or its own venture (a relationship record, PR #107);
- data rights, since cross-venture usage counts need consent and aggregation;
- who it is for: standards bodies, developer-tool companies, documentation teams.

It is not tied to the current phase (Discovery / Validation for three clients), so it is recorded and not built.

## 26. The language collision map: a Mentura engineering service, and jargon vs word salad (Torian 10:20Z)

**Directed by Torian.**
- The service belongs to Mentura's engineering side.
- It maps jargon, contested terms and other language collisions in an industry, a market, a segment, and so on.
- The service can simply be documentation. Mentura publishes the map, proposes a convention where none exists, or flags that none exists.
- The aggregate is unique data. For example, the amount of jargon in a scope, and whether it converges over time, may signal whether a market is viable or emerging, or a negative trait ("word salad").

Working name: **language collision map**. Its home is `platform/` (Mentura). It is architecture only (06:38Z rule).

**Jargon and word salad: two axes, not one spectrum (proposed).** "Jargon" itself has two senses in standard dictionaries:
1. the technical vocabulary of a group;
2. confused or unintelligible language.

That makes it the map's first dogfood entry: Torian's kindergartner example is sense 1 heard as sense 2. Separating the senses gives two independent axes:

| Axis | Low end | High end | What we can measure |
|---|---|---|---|
| **Accessibility to an audience** (relational: speaker scope vs listener scope) | Shared vocabulary | **Jargon**: coherent inside its scope, opaque outside it | Divergence of the speaker scope's senses from the listener scope's (§25). The same text is jargon to one audience and plain to another. |
| **Definitional content** (a property of the scope's usage itself) | Terms with stable, definable senses | **Word salad / buzzwords**: words whose senses never stabilize, with definitions that are circular or empty | Terms that keep failing admission (no genus, circular definitions; §23 I2 and I3), plus sense entropy that does not fall over time |

So:
- Jargon is low accessibility with high definitional content. The aerospace engineer makes sense; the kid lacks the scope.
- Word salad, in the clinical sense (schizophasia), is low definitional content at any accessibility.
- Buzzword-speak is the interesting quadrant for markets: *high* accessibility (familiar words) with *low* definitional content.
- Torian's "two points on one spectrum" holds in the everyday pejorative use of "jargon", which blends both axes. Separating them is what makes the signal measurable.

**Market signals: hypotheses for research, not rules.**
- **H-V2:** in emerging markets, sense entropy starts high and falls as conventions form. The measure is the convergence rate, not the level.
- **H-V3:** high entropy that persists without converging, combined with low definitional content, correlates with hype or with weak markets.
- **Known risks:**
  - Some healthy fields keep permanently contested terms ("intelligence", or "value" in economics).
  - Correlation is not cause.
  - Publishing the measure invites gaming: Goodhart's law.
- So the measures go into the research pipeline (R-63..R-65) as evidence, with certificates, and never feed a gate on their own.

**What the map needs from what we already designed.**
- Senses with evidence and convention status (§25).
- Per-scope dispersion and divergence over time. This needs the sense distribution to be a time series: observation data under §18, kept as Kimball Type 4, outside the concept record.
- Public sources only, or venture data with consent and aggregation.
