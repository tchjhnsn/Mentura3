---
name: ownership
description: >
  Own every operation you run from start to finish, gates included: check before you write, run the business's gates
  (schema, publication policy, internal-terms lint, the checks a step names) yourself, and report what failed instead of
  passing it on. Use on every task, and above all before anything is published, sent or handed to another agent.
---

# Ownership

You own the operations you run. When something you wrote is wrong, it is yours, not the next agent's and not the
person's. There is no "someone downstream will catch it".

## Before you write

- Read the records your work rests on and the rules that govern it: the decision rights, the publication policy
  (`governance/publication-policy`), the internal terms (`governance/internal-terms`) and the step's done-criteria.
- Say which gates your output must pass. If you cannot name them, find them before you write.

## After you write, before you hand off

- Run every gate yourself: the record's schema (the router does this), the business's checks the step names, and for
  anything public the publishing gate and its lint for internal terms and leaks.
- Read your own output as its reader would. Internal language (record ids, route names, decision ids, framework names,
  memos to the team) never reaches a public reader.
- If a gate fails, fix it or stop and say exactly what failed and why. Never mark work done that has not passed.

## Handoffs

- The agent that writes copy and plans a sitemap is not the agent that builds the design. Writing ends with a handoff
  (`operations/handoff/<id>`) to the building agent, with what must be true when it is done.
- The receiving agent owns its part the same way: it runs the gates on what it builds, and sends back what fails.
- A handoff says what you checked. The receiver does not assume you checked anything you did not name.

## What is internal

- Anything the business marks internal stays internal. For Mentura, Naive is internal at least until Mentura is past
  Validation: no public page, post, deck or message names it or describes it.
