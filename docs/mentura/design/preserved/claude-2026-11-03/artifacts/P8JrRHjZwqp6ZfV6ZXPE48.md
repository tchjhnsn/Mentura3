<!-- exported 2026-11-03 from https://claude.ai/artifact/P8JrRHjZwqp6ZfV6ZXPE48 (Claude Docs id b32e4235-4092-45fc-8578-8c1074d3fe19) -->
# Proving modules, gating actions, and compliance

Oct 31, 2026 · @Torian

This drafts Torian's thinking of 2026-10-31 06:43Z. It is architecture, not a build. The main point: Naive's gates should be stated as theorems that a venture's records must satisfy, with the questions derived from them, the same move already made for the research engine.

## Why the MVP is still unclear

You are right that the MVP cannot be fixed until Mentura's own strategy is written: what Mentura is, who pays, how it makes money. That is the dogfood loop the go-to-market plan already relies on. Writing Mentura's records in Naive will show which modules are missing, and those gaps define the MVP better than any list we write now.

"Done" as code is the right target: if every gate is a theorem, then done for a phase is the proof that its gate holds. False positives are the risk, and the rule that prevents them is the one below: a gate passes on evidence, never on a claim.

## Proving what a module is

We already have four tests that prove something is a function (total, rigid, independent, activity not identity). Modules need the same, plus two relations:

| Claim | What proves it |
| --- | --- |
| X is a module | It declares the decisions it owns, the records it reads and writes, its checks, and its preconditions, and it passes the module schema and its own tests |
| Module X belongs to function F | Every decision class X owns is one F owns; X writes only records in F's packages. Belonging is a subset relation, so it can be checked in code and stated in Lean |
| Module X belongs to phase P | X's preconditions can first be true in P (for example, a cap table needs a formed entity), and its activation criteria name P. A module can run earlier as substrate (R-42), but its gate is tied to P |

These three are the same kind of statement as the function tests, so they live in the same shared Lean venture model (R-09).

## Publishing is a function, under its standard name

Run the tests on publishing: a venture always can publish, even when it publishes nothing (total, null is a value); it never stops having the ability (rigid); it is not computed from other functions (independent); it owns decisions that change with an owner, such as what goes out and where (activity). So it passes.

The standard name for it is **communications** (corporate communications, which includes public relations). The publish router, the gate and the writing frameworks are modules of the communications function. That keeps "publishing" as an activity and avoids coining a new function name.

## What belongs to a venture's identity

The rigidity test answers your question about legal formation. Can a venture stop being a Delaware C corporation and remain the same venture? Yes: it can exist before formation, convert from an LLC, or reincorporate. So the legal entity is not the venture's identity; it is a separate identity linked by a role ("operated by"), the same way founders are (R-04).

So identity holds what cannot change without it being a different venture: its name history, essential why (purpose, core promise), founding and founders' original agreement. The legal entity holds its own identity documents: legal name, entity type, jurisdiction, formation date, registered agent, tax ids, governing documents. That record is where the formation module writes, and what later gates read.

The full list needs research, as you said. Proposed starting points: the documents a formation service produces, the records counsel asks for in due diligence, and the data rooms investors request.

## Gated actions: preconditions as theorems

Every module action that commits the venture states its preconditions. Running the action checks them, and each unmet one returns a named error code with what would satisfy it.

| Action | Preconditions | Error if unmet |
| --- | --- | --- |
| Issue shares (cap table module) | A legal entity exists; its formation is evidenced (filed certificate); the governing documents authorize the shares; the issuance is approved as the documents require | `E_ENTITY_NOT_FORMED`, `E_NO_AUTHORIZED_SHARES`, `E_BOARD_APPROVAL_MISSING` |
| Hire someone | A legal entity that can employ; a signed offer or contract; the hire's role and decision rights recorded | `E_NO_EMPLOYER_ENTITY`, `E_NO_SIGNED_AGREEMENT` |
| Charge a customer | The evidence ladder supports it (already `assess-problem.mjs`); a way to receive money exists | `E_EVIDENCE_TOO_WEAK`, `E_NO_PAYMENT_ACCOUNT` |
| Ship a feature that touches personal data | The applicable compliance obligations are met (next section) | `E_COMPLIANCE_OBLIGATION_OPEN` |

How false positives are prevented:

- **Evidence, not claims.** "We are formed" is a claim; the filed certificate, with its hash and source, is evidence. A precondition passes only on evidence of the kind it names.
- **Agent-drafted is missing.** As in `naive check`, anything an agent wrote counts as unmet until a person confirms it.
- **Honest limits.** Code cannot prove a contract is legally binding. That precondition is satisfied by an attestation from a named lawyer, recorded as evidence, never by a model. The gate proves the attestation exists; the lawyer is accountable for the law.
- **Freshness.** Evidence expires on its freshness profile (`schema/freshness.mjs`): a good-standing certificate from last year does not pass.

## Compliance as theorems, not hard-coded questions

The research engine's method applies directly: state the goal as a theorem ("this venture may ship feature F"), derive the open obligations from rules, and turn each obligation into a question at the point of inquiry. No prefabricated checklist.

What that needs:

1. **Facts about the venture:** jurisdiction, entity type, industry, what the product does (handles payments, health data, children's data, personal data of EU residents).
2. **A rules library:** obligations as rules over those facts, from a source we cite. Rules are references with provenance, never our own legal advice.
3. **A resolver:** from facts and rules, the obligations that apply, each with the evidence that discharges it and a named error code.

Prior art to study before designing:

| Tool or standard | What it is |
| --- | --- |
| Catala | A programming language for writing law as code, used for tax law |
| Open Policy Agent (Rego) | Policy as code, widely used for infrastructure and access rules |
| LegalRuleML | An OASIS standard for representing legal rules |
| Vanta, Drata, Secureframe | SOC 2 and ISO 27001 compliance automation; they map controls to evidence, the same shape as our gates |
| Formation and registered-agent services (Stripe Atlas, Clerky) | Sources of formation documents and their evidence |

Where it sits: the gate engine, the error codes and the obligation format are framework. The rules library and connections to compliance services are platform (Mentura), and likely a partner rather than something we write.

## Missing modules you named

| Module | Function | First phase |
| --- | --- | --- |
| Business formation | Legal | Before the first commitment that needs an entity (often Validation) |
| Monetization strategy | Strategy, with finance | Discovery as hypotheses, Validation as tested |
| Policies, of every type: privacy, terms, security, hiring, expense, publication (exists, EE-025) | The function that owns each policy | When the first action that needs it is gated |
| Compliance obligations | Legal | When the first obligation applies |
| Cap table | Finance, with legal | After formation |

Policies look central, as you suspect: a policy is a rule a gate reads. The publication policy is already one. A general policy schema would let every gate read its rules from a policy record instead of from code.

## Proposed next steps

1. Write Mentura's strategy records in Naive (what it is, ICP, monetization). This is the main MVP blocker.
2. A research thread on venture identity documents and compliance prior art (the tables above), producing references with provenance.
3. Then design the precondition and error-code format, using the cap table and hiring as the first two cases.
