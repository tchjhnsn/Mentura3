---
name: founder-puzzle-skill
description: 2026-10-30 founder-puzzle skill: portable prompt for the founder's own AI chat + `naive puzzle import/confirm`; staged on everything-ecosystem branch claude/project-thread-gr8tko, push not yet allowed
metadata:
  type: project
  modified: 2026-10-30T07:27:07.592Z
---

Torian 2026-10-30 06:57Z: use the "puzzle skill" (Torian's playbook step one, know-the-founder; founder profile attributes) with the AI assistant a founder talks to most, to find the puzzle of their life.

Built (thread cmsg_01TRojivaFzywKqAKrsycdv8Jpd5gVDP3fbjzE6kMfgN9n), everything-ecosystem:
- purpose/skills/founder-puzzle/prompt.md: paste-in prompt; reply is JSON `naive.founder-puzzle-source` v1 (schema/founder-puzzle-source.schema.json). Copy at /mnt/project-files/founder-puzzle/FOUNDER_PUZZLE_PROMPT.md.
- RULE (Torian 08:10Z): records are JSON; merge only COMPILES reports verbatim into one JSON record (people/puzzles/<founder>.json, schema/founder-puzzle.schema.json, reports [{id, source, sha256, report}]); anything printed is an artifact. Founder profile is NOT written.
- RULE (Torian 08:16Z): founder puzzle is confidential to the founder; publishing anything needs founder approval; a public founder profile could be derived later. Wants the prompt confidential (Naive/Mentura), ideally behind a Mentura API/connector so the user sees only output. Prompt moved to purpose/skills/founder-puzzle/_internal/prompt.md (excluded from npm). Architect only, not built.
- interface/puzzle/puzzle.ts (TS, Node type stripping): `naive puzzle import|list|show [report]|merge [reports]|confirm`. RULE (Torian 07:48Z): keep each assistant's report separate first; merge is an optional separate step that never corrupts originals. Import only writes raw/sources/puzzle-<assistant>-<date>/ (puzzle.json + text.md). Needs a founder (create-venture). Agent cannot confirm; confirmed profile never replaced.
- Torian ran it 07:42Z with Claude and ChatGPT (ChatGPT ~1 year stale: Commonwealth Partners, HomeBlock). Views in /mnt/project-files/founder-puzzle/.
- Full node test.mjs passed. Commit/push was denied by the auto-mode classifier (Torian controls git); changes staged, patch at /mnt/project-files/founder-puzzle/founder-puzzle.patch. pstack review not run (pstack is Mac-only).

Related: [[naive-plugins-and-proving]], [[ee-records-vs-artifacts]].

- 17:21Z Torian: mentor mode = what to do after the puzzle; start with puzzle-to-problem. Must be a callable, evolvable "framework/type" NOT set in stone in Naive; may belong to Mentura (undecided). Drafted as platform/agents/_internal/mentor-modes/puzzle-to-problem/SKILL.md (reads people/puzzles, writes foundation/problem draft). Connector plan/build running in a pstack Remote Control session on the Mac (worktree ~/workspace/.worktrees/everything-ecosystem/founder-puzzle, branch claude/founder-puzzle-connector).
