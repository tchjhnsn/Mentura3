<!-- exported 2026-11-03 from https://claude.ai/artifact/3KvPSmfE7C4eyQHNFYc1bv (Claude Docs id 12d690e9-f2a2-446b-b8c5-febcd466ed51) -->
# Conversation theorem: how the next question is chosen

Oct 31, 2026 · @Torian

## Short answer

A script is one frame, the right one for a cold call to a stranger. Everyone else should get a conversation that flows. So the theorem doesn't give a list of questions. It gives the rules a good next question must satisfy, given who the person is to you, what has happened between you in time, what you already know, and what you are trying to learn.

The eight questions stay as **considerations**: a pool to draw from, each tagged with what it tests and what it needs first. The theorem picks the frame, then picks the next question from the pool, or from what they just said, every turn.

This is the same method as the research engine: state what has to be shown (the hypotheses), work out what is still open, and ask only what moves an open item. An interview is research with a person.

## What the theorem reads

Five inputs, taken from what you named. They are all records already, or nearly. The section on blind spots below adds the inputs you didn't name:

| Input | What it holds | Where it lives |
| --- | --- | --- |
| **Relationship** | how you know them: stranger, introduced, connection, acquaintance, colleague, friend; their role (founder, partner, connector) and ICP | lead record, founders folder |
| **History, bitemporal** | every shared event with *when it happened* (valid time) and *when we recorded it* (transaction time): a meeting, a message, an event you both attended, the day you connected | outreach log, meetings, calendar |
| **What we know** | confirmed facts about them, each with its source and how fresh it is; agent drafts kept apart | dossier |
| **Goal** | the open hypotheses for this conversation and what would move each (H1, H2, the three problem forms) | problem statement, meeting record |
| **The conversation so far** | what they have said, in their words, and which topics are open | the meeting, live |

Bitemporal time does two jobs here:

- **Elapsed time** since the last real contact (valid time) sets the frame. Connecting two years ago and never speaking is not the same as talking last week.
- **What we knew then** (transaction time) keeps the record honest. A fact recorded after a meeting can't be cited as something you knew going in, and a fact that is old may have changed, so it gets confirmed rather than assumed.

## Frames, and how the relationship picks one

The frame is chosen from the relationship and the history, before any question:

| Frame | When | How it opens |
| --- | --- | --- |
| **Cold** | no shared event and no introduction | a script works here: who you are, why them, one short ask |
| **Introduced** | no shared event, but someone you both know connected you | the person who introduced you, and why they thought you should talk |
| **Reconnect** | at least one shared event, but a long time has passed since the last real contact | the last real thing you shared, named honestly ("we connected after the Capital Factory event, and it's been a while"), then what has changed for them |
| **Ongoing** | recent contact | pick up from the last conversation: what they said they would do, or what was left open |

"A long time" isn't a fixed number. It starts at a default (say 90 days) and changes per person, because some people you see every year and it never feels long. It's a setting, and the record of how past reconnects went can tune it.

The frame also limits the depth. A cold call stays on the surface; questions about the founder themselves come only once there is rapport, in this conversation or from earlier ones.

## Rules every next question must satisfy

A question is **admissible** only if it breaks none of these. Each is a check that can fail, like the glossary terms.

| # | Rule | Fails when |
| --- | --- | --- |
| Q1 | **No pitch** | it names the product, the puzzle or the waitlist, or asks a hypothetical ("would you pay") |
| Q2 | **Not already asked** | it repeats a question from this or an earlier conversation |
| Q3 | **Not already known** | we hold a confirmed, fresh fact that answers it. A stale fact gets confirmed ("are you still at…?"), not assumed |
| Q4 | **Earned depth** | it is more personal than the frame and the rapport allow. Asking about someone's doubts in a cold call is the questioner's version of unearned candour |
| Q5 | **In order** | it needs an earlier question that hasn't been asked ("who did you go to" waits for "when were you stuck") |
| Q6 | **Right frame** | it only fits another frame, such as a cold-call opener in an ongoing conversation |
| Q7 | **Moves something** | it touches no open hypothesis, and doesn't follow up on something they just said |

The opener has its own rule. For anyone but a stranger it must name a **real** shared event from the record, never an invented one, and only one recorded before the conversation.

## Choosing among admissible questions

Usually several questions are admissible. The order is:

1. **Follow their words.** If what they just said opens a topic, follow it. This is what makes a conversation flow instead of running a list. In the prototype it outranks everything else.
2. **Move the most.** Otherwise, pick the question that moves the most open hypotheses. A later version would weight each hypothesis by how uncertain it still is, which is the research engine's information value.
3. **Shallower first.** On a tie, the less personal question goes first, so depth is earned on the way.

The pool is open. You can ask anything that is admissible, including something you thought of in the moment, and it is checked the same way. The eight questions are just the pool's starting contents. When nothing is admissible, the theorem says to stop: you have learned what you came for, or you have gone as deep as you have earned.

## Blind spots: what the five inputs miss

The five inputs came from what you said, so they share your vantage point: one person deciding what to ask another. I checked them two ways. First, from what a conversation is. Second, against research on conversation, interviews and politeness. Both point to the same gaps.

### From first principles

A conversation is a **joint action**. Two people build up common ground turn by turn, and each turn costs both of them effort ([Clark and Brennan, 1991](https://web.stanford.edu/~clark/1990s/)). So choosing the next question is a decision with two parties, a shared ledger and a cost. A complete model needs six things:

1. **Both people**, with what each wants and how each is doing right now. The five inputs only see them through you.
2. **What is shared**: what each knows the other knows. That is not the same as what you know about them.
3. **The channel and the clock.** Effort depends on the medium and on how much time is left.
4. **The value of an answer**: which decision it changes. A count of hypotheses moved doesn't measure that.
5. **The instrument's own error.** The person asking shapes the answers.
6. **How it ends.** The ending sets the frame for the next conversation.

The five inputs cover parts of 1, 2 and 4, and they miss most of the rest.

### Ten missing inputs

| # | Missing input | Why it matters | Source |
| --- | --- | --- | --- |
| B1 | **Their goal for this conversation**: why they said yes and what they hope to get | Without it the theorem only extracts. People disclose in step with each other, broad before deep, so a one-sided ledger stalls the relationship | Altman and Taylor, social penetration theory (1973) |
| B2 | **Power, distance and the size of the ask** | Rapport is one number in the prototype. Politeness theory says how risky a question is depends on three things: the social distance between you, the power gap, and how big an imposition the question is in their culture. An investor, a peer founder and a stranger at an event differ on all three | Brown and Levinson, *Politeness* (1987) |
| B3 | **Common ground, not just facts** | A fact from the dossier that they never told you, even a public one, signals that you researched them. Used without saying where it came from, it can feel like surveillance. Each fact needs a flag: did they tell us, or not | Clark and Brennan (1991) |
| B4 | **Channel and setting**: in person, call, text, a loud event, a third person present | Grounding costs differ by medium. Text loses tone and repair. An event allows a few minutes on the surface. An introducer in the room changes what is safe to ask | Clark and Brennan (1991) |
| B5 | **Time left and their state**: attention, mood, energy | A deep question with five minutes left gets a shallow answer and breaks a promise about time. Ending on time builds trust | first principles (effort and cost) |
| B6 | **Who started it** | If they asked to meet, they have an agenda, and it comes first. Your questions wait | first principles (B1 applied) |
| B7 | **Your own hypotheses and bias** | This is the most dangerous gap, because the input is you. Questions that presuppose an answer change the answer. Leading questions shift what people report | Loftus and Palmer (1974); confirmation bias |
| B8 | **What people can and can't report** | People are poor at reporting why they did something or what they would do. They report what they did far better. Ask about the past, with specifics | Nisbett and Wilson (1977); Fitzpatrick, *The Mom Test* (2013); [Migicovsky, YC Startup School, "How to talk to users"](https://www.ycombinator.com/blog/startup-school-week-1-recap-kevin-hale-and-eric-migicovsky) |
| B9 | **Decision value** | Two hypotheses aren't worth the same. The one tied to a decision on the docket that is due soon is worth more. A count of hypotheses moved misses that | value of information (decision theory) |
| B10 | **Consent and record state**: are you recording, did they agree, and is this on the record | Deeper questions need a known answer to "can I note this?" This ties into the meeting-recorder decision | research ethics (informed consent) |

### One of your instincts the research backs

Following their words first, the top ranking rule, holds up. Asking follow-up questions makes people like the person asking more, and the people asking tend to underestimate this effect (Huang, Yeomans, Brooks, Minson and Gino, "It doesn't hurt to ask", *Journal of Personality and Social Psychology*, 2017). So that rule earns its place for two reasons: it gets better data, and it builds the relationship.

### What I'd change (proposed)

1. **Replace the rapport number with a weight.** The weight of a question = distance + power + the size of the ask (B2). A question is admissible when its weight is below what the relationship and this conversation can bear. Rapport earned in the conversation lowers distance, and that is how depth gets earned.
2. **Add five rules to Q1 to Q7:**
   - **Q8 Not leading.** The question doesn't presuppose the answer or one of our hypotheses (B7).
   - **Q9 Past and specific.** It asks what happened, not what they would do or why in general. This widens Q1's ban on hypotheticals (B8).
   - **Q10 Their ground.** It uses only facts they told us, or names where a fact came from (B3).
   - **Q11 Fits the time.** A question that opens a deep thread waits if too little time is left (B5).
   - **Q12 Their agenda first.** When they started the conversation, what they came for goes before our questions (B1, B6).
3. **Add a give ledger.** Record what we gave (an intro, a useful answer, our own disclosure) beside what we asked. When the ledger runs one-sided, the next move is a give, not a question. This ties disclosure tiers to depth: what you may say and what you may ask rise together, which was one of the open values.
4. **Rank by decision value** instead of a count of hypotheses moved (B9).
5. **Add an ending rule.** Stop when nothing admissible is left, or when time runs out. End with a next step in their words, recorded, so the next conversation opens in the ongoing frame from something real. The Mom Test calls this commitment and advancement.

### Still blind after this pass

These I can name but not yet model, so they stay architecture:

- **Culture and language.** How direct a question can be varies a lot. Brown and Levinson's size-of-ask term is where it would go.
- **Their blind spots.** A good question sometimes shows them something they didn't know about their own situation. That is where the coach and mentor tests apply, and it needs standing (U1 to U5).
- **Your state.** Tired, rushed or attached to a hypothesis, the person asking is a worse instrument. Only you can report it, so it could be one field you set before the meeting.

Citations other than the two links come from memory and haven't been checked against the originals.

## What is proved, built and open

**Built (sandbox prototype, not in a repo):** `/mnt/project-files/naive-design/prototypes/conversation/`

- `next.ts` has `frame()`, `breaks()` (Q1 to Q7), `next()` and `opener()`. It has 7 passing tests: frames come from the relationship and bitemporal history; an event recorded after now wasn't known yet; a pitch is never admissible; a stale fact gets asked again; a cold call stays on the surface; follow-ups wait their turn; `next` never returns an inadmissible question; and it stops when nothing is admissible.
- `Conversation.lean` checks clean. It proves for every state and pool that the chosen question is admissible, so it never pitches, never goes deeper than earned and never repeats.

**Open: values you said you don't know yet**

- [ ] How rapport is earned and measured. In the prototype it is a number from 0 to 3. In practice it could come from the answers they give: length, whether they offer something unasked, whether they ask back.
- [ ] The reconnect threshold (90 days to start) and how fresh a fact must be (180 days to start), per person and per kind of fact.
- [ ] How the disclosure tier and the question depth relate. What you may *say* and what you may *ask* probably rise together.
- [ ] The missing inputs and the five new rules in Blind spots above, once you agree with them.
- [ ] How it is used live. The meeting packet could show the frame, the opener and three admissible next questions, refreshed as you take notes. You talk; it never does.

Per the overbuilding rule, the prototype stays a prototype until the first interviews show which values matter.
