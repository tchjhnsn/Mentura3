---
type: handoff
source: ai-drafted
created: 2026-10-29T22:50:00Z
ai-model: claude-opus-5.5
tags: [naive, handoff, cursor, publishing, gate, lint, mdx, eslint, jev]
---

# Handoff to Cursor: the publishing gate, publish linting and ESLint

Branch from `main`. Use one branch and one draft PR per item. Don't merge. No Co-Authored-By lines. `node test.mjs` must pass.

## Why

Torian, 2026-10-29: much of what reached main reads in the same language as the internal records. Public copy must never be the internal copy. Every word goes through a gate before it is published.

Naive already has the gate's parts, but the site bypasses them:
- `governance/publication-policy.json` (`schema/publication-policy.schema.json`): channels, who may publish what, and every publication run as a handoff under the public-commitment decision class with a person's approval (EE-025).
- `operations/marketing/check-public.mjs` (EE-064): public content is a variant of an internal record that names its source, audience and approver. Any run of ten words shared with the internal record is a leak.
- **The gap:** the marketing site (`site/content/marketing/*.mdx` with the `Fact` component) and the artifact one-pagers (`site/scripts/artifact.mjs`, `site/scripts/foundation.mjs`) render internal record text verbatim. That is exactly the leak the public gate forbids. Fix this first.

## 1. `cursor/publish-manifest`: where things are published, with provenance

- Add a record `governance/publications.json` (schema `schema/publications.schema.json`). It lists every place the venture publishes: channel id, kind (site, Claude artifact, social, docs, email), URL, the MDX sources that compile to it, the last published version and its sha256, who approved it, and when. Extend `publication-policy.json`'s channels rather than duplicating them.
- Every publish writes a provenance line (activity `publish`) naming the compiled MDX file, its sha256 and the destination.
- Add a check, `schema/check-publications.mjs`. It fails when something live has no manifest entry, when an entry's sha256 doesn't match its source, or when an entry has no approver.

## 2. `cursor/mdx-everything`: every public word is compiled MDX first

- Every public page, section and component's text is a `marketing/content/**/*.mdx` public variant, under the EE-064 contract. Nothing renders an internal record's text directly.
- `Fact` and the artifact builders read only public variants or explicitly public fields (the venture name, an approved tagline). They never read `foundation/*` statements.
- A compile step, `naive publish build <channel>`, compiles the MDX for one channel into the artifact or site. Publishing reads only that output.

## 3. `cursor/publish-lint`: the lint pipeline, all of it run as code

`naive publish check <channel>` runs, in order:

| Stage | Tool | What it checks |
|---|---|---|
| Copy distance | `check-public.mjs` (extend it) | No ten-word run from an internal record. Also no near-paraphrase: flag sentences too similar to the internal text. |
| Prose | Vale (already configured for the site) | Style, voice rules from `marketing/brand.json`, banned words |
| Brand | `marketing/brand-lint` | avoid-words, jargon, audience, sourced choices |
| Design | `marketing/brand/tokens` | Colors and fonts in compiled output come only from brand tokens. Contrast is at least WCAG AA. |
| Claims | new | Every claim about what Naive does, who it's for or numbers traces to a confirmed record or a source. Unconfirmed claims block. |
| Secrets and private data | `schema/check-private.mjs` | Nothing from `_private/` and no credentials |

Rules follow the ESLint shape: named rules, and `naive.config.json` `publish_lint.rules.<id>` set to `off`, `warn` (fail-open) or `error` (fail-closed). The defaults: copy distance, claims and secrets are `error`, and everything else is `warn`.

## 4. `cursor/publish-decision-gate`: one-way or two-way door

Before any publish, the gate writes a publish decision record (under `decisions/`, class public-commitment) with:
- **Door:** two-way (easy to undo: an edit to a private artifact, a draft page) or one-way (hard to undo: a public social post, an email sent, a launch, anything indexed or cached). This follows Amazon's Type 1 and Type 2 decisions from Jeff Bezos's 2015 shareholder letter: one-way doors are decided slowly and by the founder, two-way doors quickly.
- **Exposure risk:** who could see it, and the cost if they see it before it's ready. That covers a competitor, an investor, a customer, a legal or regulatory issue, and brand harm.
- **Reversibility:** how to take it back, and how long that takes.
- **Defaults:** a two-way door with low exposure can be approved by the delegated role. A one-way door always needs the founder (fail-closed). An agent never approves.

## 5. `cursor/eslint`: lint Naive's own code

Add ESLint with a flat config (`eslint.config.mjs`) for the repo's `.mjs`, `.jsx` and `.tsx`, starting from the recommended rules. Add `npm run lint` and a `test.mjs` step. Fix what is cheap now, and turn the rest off with a dated TODO.

## 6. Where Jev fits (optional, behind a key)

ESLint and Vale are for deterministic rules. Jev (TypeSafe AI) is for typed judgments that rules can't express, which is a good fit for the gate:
- `noul`: "is this sentence a paraphrase of the internal record?" and "does this page make a claim about customers?"
- A choice: "is this publication a one-way or a two-way door?"
- A score: exposure risk, on described levels.

Use Naive's existing `use model` and judgment cache, so each judgment is asked once per state. Jev is optional, the fallback without `TYPESAFE_API_KEY` is the default model, and project text goes to TypeSafe only when the founder turns it on. A Jev judgment can warn, but only deterministic rules or a person can block.

## Done when

The current site and both one-pagers, rebuilt through `naive publish build`, pass `naive publish check` with no `error`, and each one-way door asks the founder.
