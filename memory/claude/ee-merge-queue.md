---
name: ee-merge-queue
description: everything-ecosystem catch-up merge queue run from ~/code/ee-gate on the Mac; state as of 2026-10-30 07:55Z and where to read it
metadata:
  type: project
  modified: 2026-10-30T08:03:18.954Z
---

The merge queue for tchjhnsn/everything-ecosystem runs in a local Mac Claude Code session (session_01LJHEfujDjfLJG51dgQWEbM, "Local Mac catchup handoff") in ~/code/ee-gate (= /Users/torianm/workspace/code/ee-gate, reachable via folder access to /Users/torianm/workspace/code; /Users/torianm/code is not grantable).

State files: briefs/HANDOFF_LOCAL_MAC_CATCHUP_2026-10-30.md (queue order, rules), catchup-log.tsv (one row per action), land.sh <pr> (merge main, test, push, merge), briefs/AGENT_COMMON_2026-10-30.md (shared agent rules, incl. no broad pkill).

As of 07:55Z: merged through #100; open/in flight #37, #98, #86, #97, #78, #103, #106, #113, #115, #93/#94; held #82/#34 (Mentura repo); later #51-#71.
Waiting on Torian: #86 Vercel bypass secret + deployment_status confirmation; #98 needs people/people.json roster.

Thread continuing it: cmsg_01TRojivaFzywKqAKrsycdv8D7aRo4QFaWj1LMvZ9Qpzwx. Don't run the queue from two sessions at once. Torian 08:03Z: leave the Mac session alone to keep running the queue; don't take it over from a cloud thread.
