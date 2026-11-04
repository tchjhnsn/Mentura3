<!-- exported 2026-11-03 from https://claude.ai/artifact/TSYx8RQDzVxbcnmQQMaH1p (Claude Docs id d61ee3bc-69e9-44b7-900e-c60ba55260f7) -->
# Mentura discovery, the puzzle, and blind spots

Oct 31, 2026 · @Torian

This drafts Torian's mentor strategy of 2026-10-31 06:55Z, a blind-spot check against Felix Rieseberg's "Hunger beats tenure" and the article it links, and a design for a blind-spot module. Architecture only. These are the first of Mentura's strategy records; what follows is Torian's direction unless marked as my proposal.

## The discovery plan, as stated

- Naive and Mentura stay behind the waitlist.
- Discovery for both: go through Torian's LinkedIn connections and the Austin founders and ventures he has met, and interview the best candidates.
- Needed first: playbooks for approaching them and for running the interviews.
- The puzzle: rather than hand founders the puzzle document to paste into their own Claude, the real question is whether a founder can discover their puzzle from scratch. So the puzzle needs use cases: what having a puzzle does for a founder, in outcomes.
- Content: articles on Substack, X and LinkedIn as an early Mentura offering, starting with Torian's own puzzle and the outcomes and activities it unlocked for him. A likely popular frame: strengths versus weaknesses.

## What Mentura offers, and when Naive's MVP is done (06:57Z)

Mentura helps its discovery clients get through Discovery and Validation. **Naive has an MVP when it can fully help those other ventures navigate to a set point.** That gives the MVP a definition we can check in code: a client venture passes the Validation gate, on evidence, using Naive. The point to pick is how many clients, and whether the gate is Validation's exit or an earlier marker.

The business model is a contract per venture, not a fixed plan:

- **Deliverables:** what Mentura commits to deliver, written per engagement.
- **Compensation, negotiated each time:** equity (shares on the client's cap table), another form of partnership, or direct payment.
- **Packages and playbooks:** several standard ways of working with a venture, with room for each to differ. Nothing locked in.

In standard terms this is an engagement with a statement of work, and the equity option is what venture studios and accelerators do, and what advisor agreements cover (the Founder Institute's FAST agreement is the common template for advisor equity). My notes, not your decisions:

- **Counsel first on equity.** Taking shares for services has tax and securities consequences for both sides. The project already noted securities counsel comes before investment packages.
- **Mentura needs an entity to hold shares.** This is the cap table gate from the compliance design, applied to ourselves: Mentura cannot receive equity until it is formed. Good dogfood.
- **The contract is a record.** Deliverables, compensation and status fit as Naive records (a deal or partnership package already exists in `packages/deals` and `packages/partner`), which lets the MVP check "client reached the gate" against the contract's deliverables.

**Favorites (06:58Z).** Equity stays the preferred form when Mentura really believes in the idea; the other forms exist for the rest.

**Mentura's own phase exit (06:58Z).** Mentura moves out of Discovery and Validation when it has scaled its first clients through Beachhead. So the two milestones nest: Naive's MVP is clients passing Validation; Mentura's own Validation exit is those clients getting through Beachhead. Mentura's exit criterion reads its clients' phase records, which works because each client is a venture with its own phase log, linked to Mentura by the engagement.

**Is Mentura an accelerator? (07:27Z).** Torian: maybe, but not as YC is one. Mentura gives tools, not money ("something better than money"), and may later build a literal accelerator with investor partners willing to invest.

In standard terms: an accelerator runs fixed-term cohorts, usually invests for equity, and ends in a demo day. An incubator gives resources with no fixed term and often no money. A venture studio builds companies alongside founders for a large equity share. Mentura with tools and no money sits between an incubator and a studio; run in cohorts, it would be an equity-free accelerator, which exists already (Google for Startups Accelerator is one). A premise to test: tools beat money only for ventures that can bootstrap Discovery and Validation (the venture-type condition from 07:22Z); for capital-heavy ventures, money still matters.

**First option on a founder's exit (07:27Z).** Torian wants contracts to give Mentura the first option to buy when a founder wants to exit. Two standard clauses fit, and they differ:

- **Right of first offer (ROFO):** the founder must offer the shares to Mentura first, before looking for other buyers. Closest to what you described.
- **Right of first refusal (ROFR):** the founder finds a buyer, then Mentura may match that buyer's terms.

To settle with counsel: whether "exit" means a founder selling their own shares or the whole company being sold (a first-option right on a company sale can scare off acquirers), and how either right sits with later investors, who often ask for the same right themselves.

## What the market already pays (07:45Z)

Torian's question for discovery: given everything Naive could do, how much would it have been worth to you at that point? And to find what the market will pay, look at what it already pays, with YC as the closest comparison: founders give up equity expecting outcomes, mentorship and a network.

**Is giving up shares for capital a measure of willingness to pay?** Yes, but only the part above the price of the money. YC's standard deal (as I understand it; to verify) is $125k for 7% plus a further $375k on an uncapped SAFE. If founders could raise the same cash elsewhere at a higher valuation, the extra dilution they accept is what they pay for YC's services. So: willingness to pay for services = the equity given up, minus what the cash alone would have cost at a market valuation. Research on the "accelerator premium" (for example Hallen, Cohen and Bingham, "Do accelerators work?", 2020) is where to find measured values.

There is also a direct market price for mentorship alone: advisor equity. Advisors commonly get a fraction of a percent for a year or two of advice (the FAST agreement standardizes this). That is the closest comparable for what Mentura's mentors would be worth.

**What founders pay YC for.** Money, the batch, partners' office hours, Demo Day and investor access, the alumni network, perks, and the signal: a YC badge tells investors the company was selected. Naive's agents can compete on advice and on memory (they never forget your records). They cannot compete on network or signal by default.

**A blind spot, and an opening.** The signal is often what founders value most, and it rests on admission: YC picked you. Naive could offer a different signal: evidence. A venture record whose claims are checked, with provenance and gates passed, is something an investor could verify instead of trusting a selection. That is the judgment layer and `naive export` again, and it links to H3 (validation unlocks better terms).

**The network.** Agents do not compete with a network, as you said, so Mentura needs one, built from what already exists in Austin: Capital Factory, Antler and the communities around them. That fits the finding that founder mentors are more likely a channel than customers.

**How to ask about price in interviews.** "How much would this have been worth to you?" is a stated, hypothetical answer, and people overstate those. The Mom Test asks instead what they actually spent: money, equity, time, and on what. Then test commitment: a deposit, a letter of intent, or a signed engagement. Standard pricing surveys (Van Westendorp's price sensitivity meter) can come later, once there is something to price.

## The waitlist as selection (07:55Z)

Torian's direction: turn "YC picked you" into Mentura's own signal by making the waitlist a key feature.

- **Triage the waitlist and admit in cohorts.**
- **Nobody just waits.** Waitlisted founders get offerings while they wait.
- **The interview is the gate.** Passing it is what gets a founder off the waitlist.
- **The interview uses Naive.** The founder is given a few Naive modules, chosen for their weak spot (marketing, for example), and the interview watches which activities and outcomes they reach without Naive and with it, against goals Mentura keeps private.
- **The interview finds the founder's and the venture's strengths and weaknesses, and decides the package.**
- **Who:** Torian, as a mentor within Mentura. The interviews are a Mentura service.

My notes:

- **This is the prototype test.** Giving founders real Naive modules in the interview is the "prototype beats spec" move from the blind-spot list, and it is a work-sample test: observed behavior predicts better than answers to questions.
- **Keep discovery and admission apart.** In a discovery interview you learn from them; in an admission interview they perform for you. Applicants tell gatekeepers what they think gatekeepers want, which spoils the discovery data. So: a no-stakes discovery conversation first (Mom Test questions, past behavior), then the Naive trial as the admission gate.
- **Private criteria, but open evaluation.** Keeping the rubric private is normal (like a hidden test set). Founders should still know they are being assessed and how their records are used; anything from their puzzle stays confidential, as already agreed.
- **Capacity sets cohort size.** With Torian as the one mentor, a cohort is as large as his hours allow. That matches the 3 to 10 Mentura clients in the market sizing.
- **It is all records.** A waitlist entry, the interview and its evidence, the assessment (strengths and weaknesses, feeding the blind-spot module), and the package, written as the engagement. Admission is a gate: no "admitted" without interview evidence.
- **The signal has to be earned.** Selection only signals something when it is selective and admitted founders do better. Publishing cohort outcomes later, with their consent, is what makes the badge mean something.
- **Nothing exists yet:** there is no waitlist mechanism today.

## What the article says

Rieseberg, an engineering manager at Anthropic, argues that AI made execution cheap, so impact depends less on years of framework knowledge, and newcomers can outpace veterans: "hunger beats tenure." Newcomers' advantage is fresh eyes (James March, 1991: organizations need "an influx of the naive and ignorant"; Orson Welles on ignorance and confidence). Their handicap is that no one listens to people without standing; a working prototype now wins that hearing. His advice: aim at the goals your manager's manager cares about, pick one radical idea, prototype it over a weekend, and keep it to one idea, because several ideas in one prototype hide the strong one.

One correction: the article links no McKinsey piece. The link I think you mean is Patrick McKenzie's "Don't call yourself a programmer" (2011), cited for the claim that engineers are hired to create business value, not to write code. That is the outcomes-over-activities point.

This is also where Naive's name comes from: the March and Welles lines are the "naive founder" principle recorded on 2026-10-28.

## Blind spots this suggests

These are my reading, offered for you to attack, not conclusions.

| # | Blind spot | From the article | What it would change |
| --- | --- | --- | --- |
| 1 | Specs where a prototype would win the hearing | Execution is cheap; a working prototype gets people without standing heard | Tonight produced many design docs and no prototype. For Austin founders, a working puzzle session they try beats any document. This is not overbuilding: a prototype built to learn is a discovery tool, not the product |
| 2 | Too many ideas at once | One idea per prototype, or the strong one hides | The publish router, constraint library, compliance gates and blind-spot agent all arrived in one night. Discovery should test one idea: probably "find your puzzle from scratch" |
| 3 | Stealth can withhold the proof | Standing comes from shipped work | "Stealth until stable" protects Naive, but your own visible work is what earns founders' trust. Your posts about your puzzle are the right move; keep them about outcomes |
| 4 | Activities in the pitch | McKenzie: describe the value created, not the work | The mission ("helps founders navigate the venture development lifecycle") and most of tonight's design describe mechanisms. Founders buy outcomes: a decision made, a raise not botched, a month not wasted |
| 5 | Not every "impossible" is false | At Notion the founder resistance was imagined, but the data-model complexity was real | Fresh eyes help on user-facing work; on infrastructure, security and law, some impossibles are real. Those are where your self-described gaps (software, ML, AI) need a person with tenure to review, not only agents. It is the "builder never verifies itself" rule again |
| 6 | Interviewing your own network | (Not in the article; standard customer-discovery practice) | Friends and connections are kind, which biases answers. Use The Mom Test (Fitzpatrick): ask about past behavior, never pitch the puzzle during discovery, and mix in founders who owe you nothing |

## A blind spot is not a weakness you know

The standard frame here is the Johari window (Luft and Ingham, 1955): what is known or unknown to yourself, crossed with what is known or unknown to others. A blind spot is known to others and unknown to you. So by definition you cannot list your own blind spots; you can list known weaknesses. That splits the module three ways:

| Kind | Known to you? | How it is found |
| --- | --- | --- |
| Known weakness ("I never formally learned software") | Yes | You declare it |
| Blind spot | No, but visible to others | Mentors, peers, interviewees, reviewers, and evidence: premise-lint findings you keep waiving, decisions you override, areas you never confirm, gap-hunt results |
| Unknown unknown | No one has seen it yet | The industry map and research agents, by comparing what you do with what the whole industry does |

The strengths-versus-weaknesses frame for the puzzle fits the first row. The blind-spot module is what reaches the other two.

## The blind-spot module

Part of the founder module. Proposed shape:

- **Links, not tags on records.** Each entry points at a module of your venture or of the industry (for example "engineering / verification" or "finance / cap table"), with its kind (weakness, blind spot, unknown), who or what surfaced it, the evidence, and when. Your venture's records never carry blind-spot tags, as you said.
- **Private.** It lives with the founder, never published, never in `naive export`.
- **Runs on a schedule or on triggers.** A skill that runs daily or weekly, or when certain activities happen (a decision overridden, a gate waived, a new module activated), and proposes new entries for you to confirm.
- **Read by a separate agent.** A research agent (call it a scout) reads the blind spots and recommends articles and fresh perspectives. The agent and its skills are separate from the module; the module works without it.

One conflict to settle: today private records never reach a model (EE-073). A scout must read your blind spots to recommend anything. So blind spots need a consent setting: private, but readable by named agents you allow. That is a decision for you.

## Where this sits

The blind-spot record and its schema are Naive (the founder module). The scout agent, the scheduled skill and the article recommendations are Mentura. The interview and outreach playbooks are Naive templates for the Discovery phase, the free tier.

## Next steps, proposed

1. Write the outreach and interview playbooks for Austin and LinkedIn founders (Mom Test based), and reuse the interview setup already planned (first eight interviews by hand with a recorder).
2. List the puzzle's use cases as outcomes, starting from what your own puzzle unlocked.
3. Decide the one idea discovery tests, and prototype it before the first interview.
