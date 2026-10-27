---
publish: false
type: design-note
source: hybrid
created: 2026-10-27T15:09:51Z
ai-model: claude-opus-5.5
authority: advisory
status: DRAFT
tags: [everything-ecosystem, governance, mad, ownership, board, equity]
description: "What MAD's governance tier holds today, what the governance layer holds and should hold (cofounders, board, ownership and share classes), and how the two relate. For discussion before anything is renamed."
---

# Governance: the layer and MAD's tier

## Short answer

They govern different things. **MAD's tier governs one piece of software**: is it worth building, how is success judged, when is it reviewed. **The layer governs the venture itself**: who owns it, who controls it, who may decide what. Today the layer holds only the "who may decide what" part (decision rights and roles). **Nothing anywhere covers ownership and control**: cofounders, boards, equity and share classes. That belongs in the layer, because it is about the venture, not about any one system it builds.

## What is in MAD's governance tier today

MAD's governance tier is `layers/governance/layer.json` in the MAD repo, version 0.2.0, an unevaluated draft. Its own note says: "Governance decides whether something is worth building, who decides, and how value is judged." It asks everything about one software project.

| Kind | Questions |
| --- | --- |
| Situation (describe the project) | problem validated, customer reachable, who decides, funding, regulatory exposure, flow is the bottleneck, teams to align |
| Practice (how it is run) | go decision, success measure, review cadence, goal setting, evidence method, change of direction, agent autonomy |
| Templates | customer development, lean software development, Lean Startup, OKRs, open-source governance, pstack, handoff contract v2 |

Two of its questions touch the venture. **who_decides** offers "sole owner", "small group", "client or sponsor" and "board or committee". **funding** offers "self-funded", "external investment" and similar. The tier only *reads* these facts, to rank templates. It never helps anyone decide them.

## What is in the governance layer today

| Holds | Where |
| --- | --- |
| Decision rights: 23 classes (spend money, legal or terms, public commitment, production ship, and so on), each with an owner and a level | `governance/venture-template/decision-rights.json` |
| Roles, agent and person | `governance/venture-template/roles/agent-roles.json` |
| Pillars (product, brand, business) | `governance/venture-template/pillars/` |
| Skills: chief of staff, executive roles, cross-pillar trade-off, role and candidate authoring, stakeholder update, office-hours mode, three pillar skills | `governance/skills/` |

`venture.json` holds `form` (legal form, funding), but nothing helps a founder choose them.

## What the layer is missing: ownership and control

In the standard sense, corporate governance is "the system by which companies are directed and controlled" (Cadbury Report, 1992). Direction and control rest on who owns the venture and who sits on its board. The layer covers decision rights, but not these:

| Decision | What a founder needs | Established sources |
| --- | --- | --- |
| Whether to have cofounders, and who | Solo versus team; roles; the trade-off between control and growth ("rich versus king") | Wasserman, *The Founder's Dilemmas* (2012) |
| How to split founder equity | Equal or unequal split; vesting (commonly four years with a one-year cliff); what happens when someone leaves; IP assignment | Wasserman (2012); Moyer, *Slicing Pie* (dynamic equity) |
| Whether to have a board, and when | No board, advisory board, or formal board; when it is triggered (incorporation, a priced round); its size and make-up (founders, investors, independents) | Feld and Ramsinghani, *Startup Boards* (2013) |
| What powers the board holds and what founders keep | Matters reserved for the board; investor protective provisions; who controls the board seats | NVCA model legal documents; Feld and Mendelson, *Venture Deals* |
| Advisors, and what they get | Advisory board or one-off advisers; small equity grants with vesting; a standard advisor agreement | Founder Institute's FAST (Founder/Advisor Standard Template) |
| What investors get beyond shares | Board seats, information rights, pro-rata rights, protective provisions (vetoes), anti-dilution, drag-along and tag-along, right of first refusal | NVCA Investors' Rights and Voting Agreements; *Venture Deals* |
| How the venture might end, and who gets what | Acquisition, IPO, secondary sales, wind-down; the preference stack (who is paid first, from preferences down to common) | *Venture Deals*; NVCA documents |
| Which share types, and when | Common versus preferred; an option pool for employees; SAFEs or convertible notes before a priced round; dual-class (super-voting) shares to keep control; liquidation preferences | *Venture Deals*; Y Combinator's SAFE (2013); NVCA documents |

These sources still need recording with `find-reference`, with URL and checked date. I have not checked them yet in this session.

These decisions depend on the venture's state, just as product roles do in Product Anatomy:

- A **hobby** or **lifestyle** venture with a sole owner needs none of this.
- **Managed growth** needs a founder agreement and vesting if there are cofounders, and perhaps an advisory board.
- **Aggressive growth with venture capital** needs a corporation (in the US, usually a Delaware C corporation), preferred shares, an option pool and a formal board.

So the right tool is a rule that runs off `phase`, `ambition`, `form` and `members`, not a fixed checklist.

They are also legal and tax decisions that depend on jurisdiction. In the method they are **founder decisions, made with counsel**. Agents prepare the options and the documents, and they never decide.

## Proposal

**Built 2026-10-27 (EE-022, proposed):** parts 1 and the decision class below exist: four schemas, `schema/check-governance.mjs`, `schema/payouts.mjs`, the five skills in `governance/skills/`, and a worked example venture, `schema/examples/workspace/ventures/tandem/` (two founders, an advisor, a seed round, a bridge SAFE, a formal and an advisory board, three exit scenarios). Part 2 is built too (EE-023): `derive-answers.mjs` gives MAD's tier its answers from the venture's telos, ownership, board, form and decision rights. Part 3 (naming) is still open.

**1. The layer gets an ownership-and-control kit.** Scope: cofounders, equity, boards, share types, advisors, investor rights and exits.

- Records, all in the venture's governance layer:
  - `ownership.json`: holders, share classes, vesting, pools and instruments; a cap table in plain JSON.
  - `board.json`: whether there is a board, its seats, what it decides, and how often it meets.
  - `founder-agreement`: roles, split, vesting, departure and IP terms, in prose with a JSON summary.
- More records (owner, 2026-10-27: advisors, investor rights and exits are in scope): advisors are holders in `ownership.json` with an agreement and vesting, and seats on an advisory board in `board.json`. Investor rights are terms on each instrument or share class in `ownership.json`. `exit.json` holds the exit paths the venture keeps open and the preference stack, computed from `ownership.json`, not typed by hand.
- Skills, five: `cofounder-structure`, `board-design` (formal and advisory boards), `equity-and-share-classes`, `financing-and-investor-rights` (SAFEs, notes, priced rounds and the rights each gives), and `exit-planning` (paths, payouts, drag-along and tag-along). Each reads phase, ambition, form and members, and gives the options with sources.
- A check: a venture with members of kind person who share ownership has a founder agreement. A venture with `funding: venture-capital` has `ownership.json` and `board.json`. Ownership percentages add up.
- Decision rights: a new class `ownership-or-control` (issuing shares, changing board powers, admitting a cofounder) at `escalate`, owned by the founder.

**2. The tier reads from the layer instead of asking again.**

- MAD's `who_decides` and `funding` answers would come from the venture's governance records (`board.json`, `ownership.json`, `form`).
- Its `agent_autonomy` answer "by decision class" would point at the venture's `decision-rights.json`.
- One source of truth, and the tier can tighten it for one system but never loosen it, the same rule decision rights already follow.

**3. Naming, once we agree on the above.** The layer stays **governance**, in the corporate sense: ownership, control and decision rights. The tier's own questions are about governing one project, so its standard names would be **project governance** (PMI's usage) or **governance of IT** (ISO/IEC 38500, whose evaluate, direct and monitor the tier already follows). "Project governance" may fit better, because MAD's tier asks about one project, not about IT across the organization.

## Questions for the discussion

1. ~~Is anything missing, such as advisors, investor rights or exits?~~ Added (owner, 2026-10-27). Anything else, such as employee equity beyond the option pool, or nonprofit governance (members and trustees instead of shareholders)?
2. Should ownership and control sit in governance, or beside `form` in `venture.json`? I'd keep them in governance, because they are about control. `form` would stay in `venture.json` as the summary, and the governance records would hold the detail.
3. Is "project governance" right for the tier, given that MAD will later cover more than software?
