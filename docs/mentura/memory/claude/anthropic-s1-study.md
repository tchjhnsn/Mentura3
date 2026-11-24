---
name: anthropic-s1-study
description: Torian 2026-11-01 02:09Z: study Anthropic's S-1 (filed 2026-10-26) as a founder reference, mentor skill sec-filing-reading, glossary run of its defined terms, harness collision
metadata:
  type: project
  modified: 2026-11-01T02:13:26.429Z
---

Torian 2026-11-01 02:09Z: Anthropic is the most important company to study (structure, risk factors, Select Defined Terms). S-1: https://www.sec.gov/Archives/edgar/data/2130357/000162828026067168/anthropicpbc-sx1.htm (fetch with a User-Agent naming a person and an email). It has 22 sections and 39 defined terms; risk factors run from p. 26 to p. 120 in 6 groups. His platform/models image is the S-1's own figure (business5b.jpg).

- Reference stored ONCE at founder scope, not per venture: /mnt/project-files/mentura-discovery/founders/tchjhnsn/references/anthropic-s-1-2026.json (valid against founder-reference schema; 3 exact quotes). Naive, Mentura, Polity and Vir cite it by id.
- Skill proposed: sec-filing-reading. It reads by section, turns risk factors into phase-tied risks with re-evaluation triggers, runs defined terms through the glossary as term@s1 (never copied), runs the company through the Product Anatomy Matrix, and gives no securities advice.
- Engine run: naive-design/prototypes/architecture/s1-vocab.ts (20/21) + S1.lean (clean).
  - platform@s1 is_a platform (= our Platform phase gate).
  - agent loop is_a loop.
  - model is disjoint from harness@s1 and application.
  - harness@s1 overlaps ours (EE-093).
  - REFUTED: the ontology's "agent harness is the default kind of harness" (a coding agent used only on code is not one).
  - Card posted: give harness the S-1 sense and rename ours "workbench" (recommended), or keep EE-093.
- Asked the coordinator for a separate thread: Anthropic, OpenAI, SpaceX and Thinking Machines through the Product Anatomy Matrix (NOT Google), plus a venture anatomy matrix design (new idea; architect only).
- NO Polity work now (Torian). Polity ingesting SEC records with its own glossary is an idea only.

Related: [[knowledge-convention-code]], [[founder-suite]], [[core-product-framework]].

- DECIDED 02:13Z (card): harness takes the S-1/industry sense (the software around a model; HS1 only, so a chatbot AI harness counts). Our multi-layer tool is renamed WORKBENCH (Eclipse, Fowler; engine: workbench is_a workbench@industry, overlaps harness). EE-096 supersedes EE-093. Staged, not committed, on branch claude/harness-standard-sense (worktree scratchpad/harness off main 23ccf9b): ontology, integration schema, layer.json, operator console README, records.d.ts. Asked Torian for OK to commit + draft PR. usage.json has harness/workbench notes.
- The coordinator started a thread "Map AI labs on the anatomy matrix" (cmsg_01TRojivaFzywKqAKrsycdv8NGQP6gEvW9G47gWh4gBma6).
- 11-01 ~02:35Z: "Venture Anatomy Matrix" + "holding" run (anatomy-vocab.ts 25/25, Anatomy.lean clean, usage.json). VAM is_a due-diligence checklist and decision matrix, overlaps Product Anatomy Matrix. "holding" only overlaps industry holding company (SpaceX = holding + parent company); standard umbrella = group (IFRS 10). Holding is a venture (ontology) but disjoint from the matrix's one-core venture: open question "may a venture have more than one core?". Sent to AI-labs thread.
- 11-01 ~03:00Z: term runs for prove senses/verify/validate/theorem/suite/function/value net (proof-vocab.ts 30/30, Proof.lean) and conversation terms workspace/receipt/triage/subject/sealed excerpt (conversation-vocab.ts 13/13, Conversation.lean). theorem@torian = "rule a program checks" (founder glossary), overlaps math theorem. Public term list for Grokbot: /mnt/project-files/naive-design/term-harvest/TERM_LIST_2026-11-01.json (199 terms, 36 run); Grok is an untrusted proposer, never send founder glossary or Mentura research terms.
