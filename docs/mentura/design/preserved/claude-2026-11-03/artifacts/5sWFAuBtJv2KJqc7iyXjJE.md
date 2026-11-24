<!-- exported 2026-11-03 from https://claude.ai/artifact/5sWFAuBtJv2KJqc7iyXjJE (Claude Docs id 2771c3fd-f527-4bca-b127-abe7151bcd9f) -->
# Problem loop (proposed)

Oct 31, 2026 · @Torian

## Short answer

A venture already records one problem: the root problem it exists to solve, with its forms (EE-050). It does not record the problems each function takes on to solve it. Engineering, marketing and hiring each get their own version of the root problem, and those versions spawn more. This doc proposes a **problem record** for every one of them and a **problem loop** that agents run without being asked:

1. **Set out.** State what we set out to do.
2. **Do.** Do it.
3. **Identify.** Record each problem it turns up.
4. **Solve.** Solve the problem.
5. **Verify.** Check that the fix worked.
6. **Close.** Close it with what was found and how it was solved.

Each step is a provenance entry, so the record is append-only and every problem traces back to the root problem.

This gives us three things we can't see today:

- **Latency:** how long a problem takes to be noticed, and then to be solved.
- **Bottlenecks:** the problems that keep coming back, or that hold other problems open.
- **A hiring view:** problems listed by function, so a person like Rohith can be offered real problems rather than a role.

The first case is real. Issue [#139](https://github.com/tchjhnsn/everything-ecosystem/issues/139) is this loop written by hand. The term engine's case generator was broken, and re-testing its first commit found it.

## Vocabulary (run through the engine)

All six terms are at one level, a **problem**: one node of a venture's problem graph. The engine ran every combination of the facts, 24,576 cases. All six terms are valid tests, and all 11 predictions were confirmed.

| Term | Meaning | Kind |
| --- | --- | --- |
| problem | A gap between a present state and a wanted one, that someone has (Newell and Simon) | intrinsic |
| root problem | The problem the venture exists to solve. It derives from no other problem, and every other problem derives from it | mixed |
| function problem | A form of a problem that one function owns (engineering, marketing, hiring). It derives from at least one problem | mixed |
| technical problem | A function problem that engineering owns | mixed |
| decision | A choice among two or more options that a person has the right to make | intrinsic |
| bottleneck | An open problem that has come back at least twice, or holds at least two others open (Goldratt) | mixed |

**What the engine found:**

- **Problem and decision overlap.** Neither is a kind of the other. A founder's decision is a problem framed as a choice, but some decisions answer no gap, and most problems aren't choices yet. So the decision engine and the problem loop share records. They are not one thing.
- **Root problem and function problem are disjoint.** A function problem always has a parent problem.
- **Technical problem is a kind of function problem, which is a kind of problem.** Bottleneck is also a kind of problem.
- **Using the position test from the engine work,** problem and decision are intrinsic: they are what something is. Root, function and technical problem, and bottleneck are mixed: they also depend on where the problem sits in the graph.

**Problems are not only for agents.** A problem has a holder: a customer, the founder, or a function. It has a human owner, and agents contribute. You set the goals and requirements; agents find and work the problems.

**Lean (`Problems.lean`, checks clean):**

- `function_problem_not_root`
- `root_unique`: one root, when every other problem traces to it
- `blocking_has_dependents`: a bottleneck that blocks others is a parent in the blocking graph, as a kernel is. Recurrence alone does not make it a parent.

## The problem record and the loop

**Record.** Each problem gets one record. It follows the Toyota A3 shape (problem, cause, countermeasure, check) and is stored as provenance entries. Fields:

- **id, statement, holder, owner.** The owner is always a person. Agents are listed as contributors.
- **function.** One of venture, engineering, marketing, hiring, and so on.
- **derives\_from.** Its parent problems, which make up the problem graph, ending at the root problem.
- **set\_out.** What we were trying to do when it surfaced. It traces to a goal or requirement.
- **found.** The evidence: the failing check, the numbers, the commit.
- **cause and countermeasure.** Why it happened, and what we changed.
- **check.** The test or evidence that shows the fix holds.
- **Bitemporal times:**
  - `occurred` (when the defect entered, such as commit 884e59a);
  - `identified`, `solving`, `solved` and `verified`;
  - `reopened` if it comes back.
- **links.** Decision ids, the GitHub issue, PRs and provenance entries.

**Where it shows up.** The record is the source of truth. A GitHub issue is a view of it for engineering: same headings, one per technical problem, with the PR that closes it linked. Following GitHub practice:

- an issue template gives those headings;
- a fix PR says "Fixes #N";
- labels give the function;
- sub-issues give the derives\_from edges.

**The loop agents run.** These steps run on every task, without being asked:

1. **Set out.** Before acting, write what we set out to do and which goal or requirement it serves.
2. **Act.** Do the work.
3. **Identify.** After acting, compare the result with what we set out to do. Every gap is a problem candidate: a failing test, a limit, a surprise, a number that doesn't add up. Your "the limit may mean something was coded wrong" is exactly this step.
4. **Record.** Record each candidate with its parent problem. If an open problem has the same cause, reopen that one instead of creating a new one. That is how recurrence gets counted.
5. **Solve and verify.** Fix it, then show that the check passes. Show it failing first, where that's possible.
6. **Close.** Close with what was identified and how it was solved. The person who owns it confirms. An agent never closes its own problem as verified, by the same builder-is-not-verifier rule as `schema/verify.mjs`.

This is PDCA (Deming) at the size of one task. It is also the conversation theorem's question, "what did this turn change?", asked about problems.

## Latency, bottlenecks and the hiring view

**Latency.** The record's times give two measures. These match incident practice (time to detect, time to resolve, DORA).

- **Time to identify** = `identified` minus `occurred`. Issue #139: the defect entered at 21:25Z and was found about two hours later.
- **Time to solve** = `verified` minus `identified`.

Each can become a quality requirement with a fitness function that checks it on every run. An example: "a defect in the term engine is identified within one day of the commit". We don't set targets yet. You said these get discovered through the requirements graph, so the first job is to record the times.

**Bottlenecks.** A problem is flagged as a bottleneck when:

- it reopens two or more times (recurrence); or
- two or more open problems are held open by it (blocking); or
- it has the most open time in its function.

Blocking reuses the genealogy measures. Degree is the problems held open directly. Reach is everything downstream. A problem with a small degree and a large reach is a deep bottleneck, like `design-system` in the code graph.

**Hiring view.** Grouping open problems by function and owner shows where talent is needed:

- function problems with no person as owner;
- bottlenecks that keep recurring;
- long time to solve in one function.

That list is what you'd offer Rohith: specific problems to contribute to, not a role. Today the list is empty because we don't record function problems. Once the loop runs for a few weeks it will say whether engineering's problems need another person, and which kind.

## First case and next steps

Issue #139, read as a problem record:

- **Set out.** Prove that "engine" is behaviour only.
- **Found.** Our history couldn't tell the two definitions apart. Re-testing commit 884e59a then found three defects:
  - the generator cycled, leaving only 875 distinct cases out of 20,000;
  - the validity check covered only the first 2,000 cases;
  - the label check never tried a term's own name.
- **Cause.** The generator multiplied in floating point past 2^53, and no test covered it.
- **Countermeasure.** Use mulberry32, check validity on every case, and add three new tests.
- **Check.** The engine tests pass, and re-admission leaves every relation unchanged.
- **Function and parent.** It is a technical problem, derived from "the glossary must be trustworthy". That in turn derives from the root problem.
- **Times.**
  - `occurred`: 21:25Z
  - `identified`: about 23:10Z
  - `solved`: 23:20Z, staged
  - `verified`: not yet, because it waits on your OK to commit

A related open problem: the architecture fact detectors in the prototype are unreliable. They miss rule-taking code and count comments as domain references.

**Proposed next steps, smallest first:**

1. Add an issue template to the repo (`.github/ISSUE_TEMPLATE/problem.md`) with these headings. This is GitHub-native and costs almost nothing.
2. Add `problem-record.schema.json`, with the problem record as provenance entries. The admitted terms move into `schema/terms` with Lean.
3. Add the loop as a skill that every building thread loads, plus a check that a PR fixing a problem links its record.
4. Later, a problem-graph view and the latency and bottleneck measures in the venture console.

The current phase is a stable Naive. Steps 1 to 3 serve that directly, because they are how we will find and fix what makes it unstable. Step 4 waits.

## From problem to merged fix: the pipeline

Your Mac session already ran this pipeline once, by hand, on CI speed. The problem: agents wait about eight minutes on every push. It started from Owen's post on making CI 20x faster. Each stage below is one step, with the gate it has to pass and when it happened:

| Stage | What happens | Gate it passes | CI case (2026-10-31) |
| --- | --- | --- | --- |
| 1. Signal | A post, a failing check, a limit or a surprise suggests a problem | none: anything can raise one | 21:20 Owen's post shared |
| 2. Measure | A read-only audit measures before anyone changes code, and ranks the causes | Numbers are measured or labelled as estimates; nothing is changed | 21:21 to 22:04: 489s per run, steps run one at a time, 0% cache, a lint step silently skipped |
| 3. Record | The problem record is written: statement, function, parent, evidence, `identified` | G0: its words are defined terms | not done (this is the missing step) |
| 4. Brief | A fix brief: goal, the ranked items, what must not get weaker | The goal traces to a requirement | 22:04: "faster, without weakening a gate" |
| 5. Build | Work happens in a worktree on a new branch, with tests, repeat runs and before/after numbers | G2: the design equals the build | 22:04 to 23:21 |
| 6. Verify | An independent reviewer asks whether anything got weaker; the fix shows the check passing | G3; the builder is not the verifier | The reviewer found a bad worker value that could run zero steps and still print "all passing"; fixed |
| 7. Land | Draft PR, findings posted, merged by a person | Torian merges | #137, merged at 23:39 |
| 8. Close | Closed with the after numbers, `solved` and `verified` set; anything left over becomes a new problem | The owner confirms | 545s down to 341s, and two open items left over |

**Timing:** about 44 minutes to identify the problem and 2 h 18 m from signal to merge.

**What the pipeline adds over what happened.** Step 3 was skipped, so none of this was recorded as a problem. And the close produced a new problem that nobody recorded either: right after the merge, CI on main failed at 23:39 because GitHub Actions didn't start any jobs, citing billing or the spending limit. With the loop running, that becomes a new problem with `identified` = 23:39, parent "agents wait on CI", function engineering, and an owner (you: only you can fix billing).

**How to make it run every time** (proposed, smallest first):

1. An agent brief template whose report headings are set out, did, identified and solving. Every "Speed up test and CI" style agent already reports almost this way.
2. Write the problem record at stage 3, and update its times at 7 and 8, so latency is measured, not reconstructed.
3. A rule in the loop skill: a fix PR links its problem record, and a closed record with leftovers opens new records.

The pipeline is the problem loop at the size of a project, and stages 2 to 6 are the Owen recipe applied to any problem, not just CI.
