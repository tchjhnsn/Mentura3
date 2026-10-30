---
type: plan
source: ai-drafted
created: 2026-10-29T22:15:00Z
ai-model: claude-opus-5.5
tags: [naive, roles, delegation, verification, chief-of-staff, handoff]
---

# Roles, delegation and verification gates

A plan for role templates, the open-source chief of staff agent, a delegation suite and verification gates. Everything here is a draft for Torian to decide.

## 1. Are verification gates central to Naive? Yes, and part of it is already code

The ethos is "people decide by default; agents propose". In code it already shows up in four places:

| What | Where | State |
|---|---|---|
| The gate before every write (land, draft, owner, refuse) | `schema/gate.mjs`, `meta/naive.config.json` | Built |
| The builder is never its own reviewer: a handoff's `review` criterion must name a role other than the holder's | `schema/check-ready.mjs:75`, `schema/check-execution.mjs:61` | Built for handoffs |
| Done criteria by kind: `conformance` (a command, no model), `self-proof` (evidence), `review` (another role) | `schema/handoff.schema.json` | Built |
| Decision classes delegated to a role, checked against decision rights | `schema/team-plan.schema.json` `authority`, `schema/check-team.mjs` | Built, one level only |

What is missing:
- A gate between phases. Exit criteria aren't checked before a phase change today; the person's word is the gate.
- Delegation chains. Nothing stops a role from handing on authority it was never given.
- Verification for records outside handoffs. A record write is gated by decision class, but no rule says its reviewer differs from its writer.
- Docs. Verification is not named as a core concept in the docs or the master article.

**Recommendation:** make "verification gates" a named core concept: every piece of work has a builder and a verifier that differs from it, and authority flows only from the founder.

## 2. The post you shared

The post's text says the algorithm is "the secret behind every RL env/data company" and "the algorithm for RSI" (recursive self-improvement). The algorithm itself is in an image that I couldn't read. The replies point at its likely shape: a generate, verify, keep-what-passes loop, with "the very-stressed human in the loop" and "unverifiable tasks" named as what it misses.

It is relevant, with one caution. Naive isn't doing reinforcement learning. The shared lesson is that progress is limited by the verifier, not the generator. For Naive that means:
- Gates and lint suites are the verifiers, so they matter as much as the agents.
- Verifiers must be separate from builders, as in section 1.
- Unverifiable work, such as taste or strategy, goes back to the founder. Naive's "people decide by default" is that rule.

I couldn't see the image, so treat this reading as an inference from the text and replies.

## 3. The one hat: the founder as chief delegator

- The founder holds all authority. They wear one hat: the founder, or "chief delegator".
- The **chief of staff agent** ships open source with Naive. It wears every other hat by delegating. It can delegate only what the founder has granted it, and nothing more.
- Every other agent role gets authority only through the chief of staff, and never more than the chief of staff holds.

## 4. Role templates

Each role is a template, `governance/venture-template/roles/<id>.json`, extending today's `agent-roles.json`. It holds the role's function, the decision classes it may be granted, its default tier (person, frontier, workhorse, none), the lint suites it runs, the role that verifies its work, and its skill. Grokbot's plugin and skills can inherit these.

| Role | Function | Verified by |
|---|---|---|
| Founder (chief delegator) | All | Self; the only role that needs no verifier |
| Chief of staff | Delegation, docket, handoffs | Founder |
| Product and design lead (`product-design-lead`, alias `product-manager`) | product | Chief of staff, then founder for scope |
| Architect (`architect`, alias `cto`) | engineering | Builder's work reviewed by architect; architect by founder |
| Builder | engineering | Architect plus conformance checks; never itself |
| Marketing lead | marketing | Brand lint plus chief of staff |
| Finance lead | finance, money | Finance lint plus founder for spend |
| Validation lead | validation | Validation lint plus founder for phase gates |
| People lead | people | Founder |
| Counsel | legal | Founder; outside counsel for regulated matters |

## 5. Delegation suite (install the defaults, customize per venture)

- **Record:** `governance/delegation.json`: grants `{from, to, classes, scope, may_redelegate, expires}`. The founder is the root.
- **Default template:**
  - The founder grants the chief of staff `may_redelegate: true` for operations-level classes.
  - Strategy-or-constitution, experience-design and money classes are not re-delegated.
- **Check, `schema/check-delegation.mjs`:**
  - A grant may not exceed its grantor's grant, and the chain must lead back to the founder.
  - No role may verify its own work.
  - Any grant that has expired fails.
- **Playbook:** `governance/playbooks/delegation.md`, with the default ladder and how to widen it.

## 6. Next steps

1. Torian confirms sections 3 to 5, especially the name of the one hat.
2. Hand sections 4 and 5 to Cursor as one more item in the existing handoff, following the same pattern as the lint suites.
3. Add a "Verification gates" concepts page to the docs and to the master article.
4. Fix the gate bug found today: an agent's write of the experience-design record landed as final.
