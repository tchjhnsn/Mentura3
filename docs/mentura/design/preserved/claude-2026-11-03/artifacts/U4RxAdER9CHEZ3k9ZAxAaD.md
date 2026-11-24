<!-- exported 2026-11-03 from https://claude.ai/artifact/U4RxAdER9CHEZ3k9ZAxAaD (Claude Docs id db215a10-7eb7-48d6-b5d4-6bd745386172) -->
# Founder interviews as training data: plan

Oct 28, 2026 · @Torian

## Summary

Run one interview programme with three formats (a podcast, AI-moderated interviews, short surveys) that all share a single decision guide, and code every answer into a cited **decision record**. Those records become Mentura's evidence for when each decision arrives in a venture's life, what the options were, and what founders wish they had known. That is what produces new kits, templates and better need-now priors.

Recommended first step: a pilot of about 10 interviews with founders who have scaled and about 20 with ICP founders (solo, low/no-code, small early teams), coded by hand into the draft record format below. Pick tools after the pilot shows which questions yield usable decisions.

"Training data" here should mean, at first, a cited corpus that Mentura retrieves from and an evaluation set it is tested against. Fine-tuning a model only makes sense after thousands of records.

## Who to interview

Scaled founders are the core, but interviewing only them teaches survivorship: you learn what winners did, not what separated them from people who made the same calls and failed. So the list deliberately includes founders who stalled or shut down.

| Segment | Priority | What they give us | Where to find them |
| --- | --- | --- | --- |
| Founders who scaled (past Beachhead into Scale or Platform) | 1 | The full arc of decisions, with outcomes known | Warm intros, podcast outreach, Listen Labs expert panel |
| ICP founders now in Discovery or Validation (platform users) | 1 | Decisions as they happen, without hindsight; what Mentura misses today | Mentura users, communities for solo and no-code founders |
| Founders who stalled or shut down | 2 | The counterfactual: same decisions, different outcomes | Post-mortem writers, intros from investors |
| Early employees and operators at scaled companies | 2 | How founder decisions looked from inside; operations detail | Referrals from scaled founders |
| Investors, advisors and accelerator staff | 3 | Patterns across many ventures; base rates | Podcast guests, direct outreach |
| Service providers (lawyers, accountants, agencies) | 3 | The admin decisions founders forget (entity, tax, contracts) | Referrals |

One decision to make early: whether a guest's company stage is screened by a hard bar (for example revenue or headcount) or by phase as Mentura defines it. Phase is better for the data, because it keeps the records comparable.

## Formats

The three formats are one funnel: the podcast finds the important decisions, AI interviews check them across many founders, and surveys measure how often they occur.

| Format | Length | Volume | Public? | Job in the funnel |
| --- | --- | --- | --- | --- |
| Podcast (human host) | 45 to 60 min | 2 to 4 a month | Yes | Depth, brand and distribution; surfaces decisions nobody thought to ask about |
| AI-moderated interviews ([Listen Labs](https://listenlabs.ai)) | 20 to 30 min | Dozens a week | No | Breadth; the same decision guide asked of many founders, with follow-ups, in 120+ languages |
| Surveys | About 5 min | Hundreds | No | Frequency and timing of decisions already found, as closed questions |

The shared decision guide walks through Mentura's phases (Discovery, Validation, Beachhead, Scale, Platform). For each, it asks the founder for the two or three hardest decisions, then for each one: when it came up, what options they saw, what they chose, what happened, and what they would tell themselves now. Asking for concrete moments (dates, the document or message where it was decided) rather than general advice cuts hindsight bias.

Listen Labs advertises a 50M+ participant panel including B2B and expert audiences, and it can also interview your own contacts. Pricing is demo-only and the site lists no API, so exported reports are the integration for now, as already noted under EE-039.

## The data pipeline

Every decision record must cite the transcript span it came from, so Mentura's citation rule holds from interview to kit.

1. **Consent.** Before recording, the interviewee picks tiers separately: publish (podcast), use as cited evidence inside Mentura, use for model training, and attribution (named, anonymous, or company only). Scaled founders will share confidential numbers, so anonymous evidence has to be a real option.
2. **Capture.** Recording plus transcript. Podcast: our own recording. Listen Labs: their exported report and transcripts.
3. **Code.** A model proposes decision records from the transcript; a rule check and a human review accept them. The model classifies, it does not decide what is true.
4. **Store.** Accepted records go in the evidence layer, each linked to its source span and the consent tiers it inherits.
5. **Aggregate.** Records are grouped by decision type and phase to feed kits and priors (next section).

Draft decision record fields:

| Field | Example |
| --- | --- |
| decision | First hire: contractor or full-time |
| phase | Validation |
| arrived\_when | Month 7, after the first 10 paying customers |
| options\_seen | Contractor, full-time engineer, cofounder |
| chosen | Contractor |
| outcome | Worked for 6 months, then a costly handover |
| hindsight | Would hire full-time once revenue covered 6 months of salary |
| source | Transcript id + time span |
| consent | evidence: yes, training: no, attribution: anonymous |

On the framework and platform line: the record schema, the decision guide and the coding rules are framework (offline, no vendor). The Listen Labs import, transcription, the hosted corpus and the review queue are platform.

## From data to kits, templates and decision models

The records pay off in four ways, roughly in the order they become possible as the corpus grows.

| Output | What it is | When it becomes possible |
| --- | --- | --- |
| Kits | When several founders faced the same decision, write a kit: the options, the trade-offs, the timing signals and cited quotes | About 5 records on one decision |
| Templates | Artifacts founders share in interviews (a first offer letter, a pricing page, an investor update) generalised into templates | Whenever a guest shares one with consent |
| Need-now priors | How often each decision arrives in each phase, so Mentura raises a kit just before it is needed | About 30 records per phase |
| Decision models | For each decision, which choices led to which outcomes for ventures like yours, with honest uncertainty | Hundreds of records, including failures |

The same records double as an evaluation set: replay a founder's history and check whether Mentura would have surfaced the right kit before the decision arrived. That tests the mentor directly and does not need a trained model.

The record counts above are rough guesses to plan around, not measured thresholds.

## Jev form and submission routing

The [Jev x AI SDK Form Router](https://vercel.com/kb/guide/jev-ai-sdk-form-router) fits the intake side of this programme. In that template, Jev picks a destination for each form submission from a list of destinations and criteria, accepts its answer at confidence 0.95 or higher, and otherwise hands the same question to a fallback model.

We would apply the same pattern in two places:

- **Intake.** One "tell us your story" form for guest applications, interview sign-ups and decision stories from users. Destinations: podcast shortlist, AI interview invite, survey only, kit request, and triage.
- **Coding.** Each proposed decision record routed to the kit or decision type it belongs to, or to a new-decision queue when nothing fits.

One change from the template: low-confidence cases should go to a human review queue, not only to a second model. At this volume a person can read them, and those reviews become labelled examples.

The destinations and criteria are plain data, so they can live in the framework as part of the source-of-truth matrix. Jev itself is a named vendor, so the router is platform.

## Principle: the naive founder and the mentor who remembers

Proposed principle for Memento and Mentura: **the founder may move forward naive; the mentor remembers what they forget and prepares what they don't yet know, just before they need it.**

It draws on two lines quoted in [Felix Rieseberg's post](https://felixrieseberg.com/hunger-beats-tenure-advice-for-junior-engineers/). Orson Welles, on attempting shots nobody had tried: "Ignorance, sheer ignorance — you know there's no confidence to equal it." And James March (1991): organisations depend on "maintaining an influx of the naive and ignorant."

What it means in practice:

- Mentura does not front-load answers or make founders read everything first. Kits arrive when need-now says the decision is near.
- Mentura holds the memory: past decisions, promises, open threads and facts, so the founder can drop them.
- Not knowing is treated as an asset to protect, not a gap to fix up front.

This is also why the interview programme matters: the mentor can only see ahead because others have already walked the road. It could be logged as the next EE decision once you confirm the wording.

## Risks, open questions and next steps

Risks:

- **Survivorship and hindsight bias.** Scaled founders retell their story as a plan. Mitigation: include stalled founders, ask for concrete moments, and interview ICP founders while decisions are live.
- **Consent and confidentiality.** Training use needs its own explicit opt-in, and anonymous evidence must really be anonymous.
- **Small numbers.** Decision models built from a few dozen stories will overfit; keep them labelled as estimates.
- **Host time.** A podcast takes real weekly hours; AI interviews scale, the podcast does not.

Open questions:

- Who hosts the podcast, and does it carry the Mentura name?
- Do interviewees get paid, credited, or offered early access?
- Is fine-tuning a goal at all, or are retrieval and evaluation enough?

Next steps:

- [ ] Approve the draft decision record fields and the decision guide
- [ ] Book a Listen Labs demo to learn pricing, export formats and API plans
- [ ] Run the pilot: about 10 scaled founders and about 20 ICP founders
- [ ] Code the pilot by hand and write the first two kits from it
- [ ] Log the "naive founder" principle as an EE decision

Sources: [Listen Labs](https://listenlabs.ai) · [Jev x AI SDK Form Router](https://vercel.com/kb/guide/jev-ai-sdk-form-router) · [Hunger beats tenure (Felix Rieseberg)](https://felixrieseberg.com/hunger-beats-tenure-advice-for-junior-engineers/)
