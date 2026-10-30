---
type: handoff
source: ai-drafted
created: 2026-10-29T23:05:00Z
ai-model: claude-opus-5.5
tags: [naive, handoff, cursor, publishing, pr-review, lint, accessibility]
---

# Companion handoff: the PR review agent and more publish checks

This companion goes with `HANDOFF_CURSOR_PUBLISHING_GATE_AND_LINTING_2026-10-29.md`. The same rules apply: one branch and one draft PR per item, no merging, `node test.mjs` passes, and no Co-Authored-By lines. Every check uses the same `off`, `warn` and `error` settings in `naive.config.json`.

The motivating case is the PR 63 preview (`/`, `/why`, `/for`). It shows "(Torian, 2026-10-28)", "(EE-045)", phase jargon, a superseded ICP, internal statements word for word, duplicate headings, and a preview URL that names the internal platform.

## 7. `cursor/pr-review-agent`: content and design on every PR's preview

- **Content (the default).** Every page is agent-readable: a `.md` route, `Accept: text/markdown`, `llms.txt` and `llms-full.txt`. On each PR the agent fetches the markdown of the changed pages from the Vercel preview and runs `naive publish check` on it. No screenshots.
- **Design as code.** One headless browser pass reads the DOM and computed styles, with no images. It checks that:
  - every color and font comes from brand tokens;
  - contrast meets WCAG AA;
  - each page has one H1 and no skipped or duplicate headings;
  - nothing overflows horizontally at 375px;
  - every image has alt text.
- **Screenshots.** Set by `pr_review.screenshots`: `off` (the default), `on-demand` (a PR label) or `always`. When on, the agent takes one image per changed page and does not keep it.
- **Comments.** The agent comments findings on the PR. It never merges, approves or pushes.

## 8. `cursor/internal-terms-dictionary`: what must never appear in public

Add a record, `governance/internal-terms.json`, holding patterns that mark internal text:
- decision and ledger IDs (`EE-\d+`, `G-\d+`, `D-\d+`);
- the dated attribution form `(<name>, YYYY-MM-DD)`;
- record paths (`foundation/…`, `_drafts`, `_private`);
- internal codenames that aren't public yet (Mentura until announced);
- phase jargon used internally;
- Draft markers.

The publish check fails any public output that matches one of these patterns. The founder edits the list.

## 9. `cursor/leak-canaries`: prove the gate works

Seed each internal record type in the test fixtures with a unique canary string. The test builds the public site and the artifacts and fails if any canary appears in the output. This catches components, such as `Fact`, that read internal records directly.

## 10. `cursor/field-visibility`: public or internal is set on the field itself

Every field of every record, and every component that renders one, carries `visibility`:
- `public`: the internal and public versions are the same. A component may fetch and render the field directly, for example the approved mission.
- `variant`: publishable, but only through a separate public version. That version is an MDX variant, versioned on its own, naming its source field and its approver. Components render the variant and never the field.
- `internal` (the default): never published.

Rules:
- The default is `internal`.
- Only a person sets a field to `public`, as a recorded decision (two-way door). An agent may propose it.
- Setting `public` pins the exact wording by sha256. Any later edit drops the field to `variant` until a person re-approves it.
- `<Fact>` and every public component refuse to render a field unless it is `public` (or render its approved variant). The build fails otherwise.
- Store visibility in a sidecar per record, `<record>.visibility.json`, or under a `visibility` key that schemas allow. Either way, the router reads it and the publish check enforces it.

This replaces the per-folder `public.json` idea.

## 10b. `cursor/confidentiality`: above internal, known only to a named few

Add `confidential` as a fourth visibility value, above `internal`, with a severity level and an access list. Store it per record or field in `<record>.confidential.json` (the counterpart of the public variant), or in the record's `visibility` block.

| Level | Meaning | Who may know it exists | Examples |
|---|---|---|---|
| C1 restricted | Internal, but only for the roles that need it | Everyone internal; content limited by role | Salaries, pipeline deals |
| C2 confidential | Only named people and agents | Named people only | Fundraising terms before signing, an acquisition talk |
| C3 secret | Founder plus one or two named people. Agents only by explicit, expiring grant | Named people only; others never learn it exists | Mentura's agent and training pipeline, unannounced pivots |
| C4 founder-only | The founder alone. No agent unless the founder opens it for one session | No one | Personal finances, health, family matters |

**Rules, in code:**
- Lists, search, the docket, `llms.txt`, provenance views and error messages hide C2 and above from anyone not on the access list. A read answers "no such record", not "forbidden", so its existence isn't revealed.
- An agent reads C3 and above only under a delegation grant (from the delegation suite) that names the record and expires. Its context, cache and logs for that session are kept in `_private/` and never reach a shared library or a model provider beyond the one call.
- Confidential content never compiles into any public output. The publish gate and the leak canaries treat C1 and above like `internal`, and C2 and above as a hard `error` if found anywhere outside the access list's own views.
- Raising the level is open to anyone on the access list. Lowering it is a founder decision, because declassifying is a one-way door.

**Framework for deciding the level:** a short decision frame scores four things:
1. harm if known (to the venture, to people, legal);
2. who would be harmed;
3. reversibility of disclosure (always one-way);
4. how many people must know for the work to get done.

The highest triggered factor sets the level, not an average, as in MAD's risk rule. Personal data about real people starts at C3 or above. The frame proposes a level; the founder decides it.

## 11. `cursor/republish-on-change`: published pages don't go stale

When an internal record changes, every public variant derived from it, and every manifest entry built from those variants, is marked stale through the existing revalidation (`mentura revalidate`). Retiring an ICP or changing the mission lists the pages to revisit. A stale page is re-linted before its next publish.

## 12. `cursor/preview-hygiene`: previews are public too

- Preview deployments send `noindex` and, where the host allows it, sit behind protection.
- Preview and project names never contain internal codenames. Rename `mentura-docs`.
- `robots` stays `noindex` until a person approves a channel. That rule already exists (EE-025, EE-034); add a test that keeps it so.

## 13. `cursor/a11y-seo-links`: the cheap checks

All of these run headless, without images:
- accessibility with axe-core;
- every page has a title and a description of 40 to 160 characters, with an OG image;
- internal links and anchors resolve;
- each external claim's link answers.

## 14. `cursor/legal-and-privacy`: before anything is public

- Flag names of other companies and their marks, such as Nike and its slogans, for a trademark check.
- Flag personal data (emails, phone numbers, people's names other than an approved public team list).
- Run secret scanning over the diff with gitleaks or an equivalent. Any match is an `error`.

## 15. `cursor/rollback-and-embargo`: two-way doors stay two-way

- Each publish keeps the previous version in the manifest. `naive publish rollback <channel>` restores it.
- A publication may carry `not_before` (an embargo). The gate refuses an earlier publish.

## 16. `cursor/lint-feedback-loop`: the improver

Log every finding and how it was resolved (fixed, waived, or the rule changed) in provenance. A monthly report lists:
- rules that are often waived, which are candidates to loosen;
- leaks found after publish, which are candidates for new rules.

This is the improver step from the generator, verifier and grader loop.

## 17. `cursor/decision-versions`: decisions work like a Git workflow

Today a decided decision can't change (`schema/decisions.mjs` `approve()` refuses "already decided"), and a new decision ID is the workaround (`mission`, then `mission-wording`). Replace that with versions:

| Git | Naive decision |
|---|---|
| Draft or branch | An agent or person drafts a new wording: `status: open`, `version: n+1`, `supersedes: n` |
| Commit | `mentura propose` records the draft and its provenance |
| Review | The decision gate, lint suites and verifier (never the drafter) |
| Approve | A person (or a delegated role, see below) approves the version |
| Merge | The approved version is applied to the records it decides (for example `venture.json` `core.promise` for the mission) and becomes current |
| Revert | `mentura decide <id> --rollback <version>` makes an earlier version current again, as a new version, so history is never rewritten |

- Every version is kept, at `decisions/<id>/v<n>.decision.json` or as `versions[]` in the record, each with its own provenance hash. The current version is a pointer.
- **Approve and merge are separate steps.** Merging writes to other records, so it is its own permission.
- **Merge is delegable.** `governance/delegation.json` grants can name `merge` for decision classes and parameters, for example "the chief of staff may merge experience-design decisions for two-way-door publications". With no grant, only the founder merges. One-way doors are never delegated.
- A merge marks everything derived from the old version as stale (item 11), so pages built on the old mission are re-linted.
- This also fixes today's gap: deciding the mission didn't update the strategic foundation, because nothing merged it into `core.promise`.

## Done when

Rebuilt through the gate, the PR 63 site shows none of the leaks listed above. The canary test passes. The review agent has commented on a test PR with content and design findings and no screenshots.
