---
type: readme
source: ai-drafted
created: 2026-11-01T03:40:00Z
ai-model: claude-opus-5.5
tags: [mentura, research, venture-anatomy, studies]
description: "Mentura's studies of outside ventures, kept as records. First two: Anthropic and OpenAI (2026-11-01)."
---

# Research: studies of outside ventures

Each study is a set of records about one company, built from public sources only. A matrix or comparison is a view computed from these records later, never stored here.

```
research/
  references/<id>.json          each source stored once, cited by id (tier, read or not, quotes)
  ventures/<id>/venture.json    identity, phase, core, holdings, decisions (with implies)
  ventures/<id>/products/*.json job, served, offering per product
  ventures/<id>/anatomy.json    the 13 venture anatomy parts, each with a ladder level and its required level
```

The Anthropic S-1 is cited as `anthropic-s-1-2026`, stored once at founder scope (`founders/tchjhnsn/references/`).

## Cells

Every value is a cell: `value`, `ref {id, locator}`, `evidence` (demonstrated, inferred, assumed), `as_of`. A fact with no public source is `{ unknown: true, reason }`, which is not zero. Where two sources disagree the cell is `{ contested: true, values: [...] }` with each value's source.

## Ladder

0 absent, 1 stated, 2 cited evidence, 3 verified by an outsider (for example audited statements or a court ruling). For an outside study the level measures the public record. A part that surely exists but is not public (OpenAI's confidential draft S-1) is unknown, not 0.

Required level: from the venture's phase, raised to 2 on every part by a decision to go public.

## Results on 2026-11-01

| Part | Anthropic | OpenAI |
|---|---|---|
| core | 2 | 1 |
| defined-terms | 2 | unknown |
| risk-register | 2 | unknown |
| customers | 2 | 1 |
| market | 2 | 1 |
| products | 2 | 1 |
| people | 2 | 1 |
| control | 2 | 2 |
| dependencies | 2 | 1 |
| financials | 3 | 1 |
| capital | 2 | 2 |
| regulation | 2 | 2 |
| related-parties | 2 | unknown |

Both are read as Scale, and both have decided to go public, so every part needs 2. Anthropic meets all 13 from one public S-1. OpenAI meets 3, falls short on 7 and is unknown on 3, because its S-1 is confidential.

## What the studies taught the engine

1. A part-level ladder is too coarse. Anthropic passes every part, yet key figures inside parts are blank in the preliminary S-1 (Q3 revenue, committed compute spend, offering size, dilution). The check should also count unknown cells inside a part.
2. Outside studies need the "public record" reading: unknown when a record surely exists but is not public, 0 only when it does not exist.
3. The cell needs a `contested` form (OpenAI's equity split and September run rate both have two reported values).
4. A reference needs a `tier` (primary, reputable reporting, index) and a `read` flag. A cell citing an unread source cannot rise above `inferred`.
5. Stated competitors and stated roles (Anthropic says Amazon, Google and Microsoft are its suppliers, investors, customers, channels and competitors) are facts the company stated, kept apart from any relationship verdict.

## Not done

- No comparison, similarity or competitor verdict.
- openai.com refuses automated fetches; it was not worked around. Its structure and statements come from reporting.
- SpaceX SI, Grok and Cursor are deferred (structure too complicated for now, Torian 2026-11-01).

## Decision (Torian, 2026-11-01 04:32Z): research, capabilities and safety at both levels

- `researches` is a venture-level link (ventures/<id>/research.json).
- `has-capability` is product-level and says own or supplied (ventures/<id>/capabilities.json).
- `safety-commitment` carries `scope: venture | product` (ventures/<id>/safety.json).
- `supplies` links ventures (relationships/).
Affects: every venture folder in this library; the research-vocab terms (researches, offers/own/supplied capability).

## Decision (Torian, 2026-11-01 04:33Z): internal research function, no AI-lab claim

We are an applied AI company with an internal research function (its areas and interests in research-areas/self.json). Nothing public; publishing is decided later. Open: whether research becomes its own function in the venture's function list or sits under an existing one.

## Decision (Torian, 2026-11-01 04:48Z): trigger rules live in our records

Rules that turn record changes into actions are records our code evaluates and our theorems can check. LangSmith keeps traces and evaluators only. Affects: the provenance log design, LangSmith setup (platform/integrations/langsmith-setup.mjs gate rules move to our records over time), the architecture record.

## Note (04:48Z): "suppliers, not competitors" (02:55Z) now reads "suppliers; competition not established"

Torian asked at 04:45Z that not-a-competitor be proven, not assumed. Both legs (demand, supply) are unrun for Cursor and Grokbot, so PR #147's handoff wording is out of date.

## Decision (Torian, 2026-11-01 04:49Z): log every check outcome now, train later

Each symbolic check writes pass/fail with its proposal, proposer (model, agent role, trace) and any stated confidence to the provenance log. Draft shape: /mnt/project-files/naive-design/architecture/check-outcome.schema.draft.json. No training is built.

## Decision (Torian, 2026-11-01 04:51Z): partner = complementor, supplier or channel with an agreement (PR #147 definition); the wider 'any agreement' sense is superseded.
