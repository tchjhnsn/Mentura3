---
name: feedback-decision-docket
description: Torian 2026-10-28: prefers one decision document he fills in and submits over a stream of decision cards; the Decision Docket artifact
metadata:
  type: feedback
  modified: 2026-10-28T16:42:35.653Z
---

Torian, 2026-10-28 16:39Z: "Rather than constantly producing these decision cards, how about we produce some sort of decision documents where I am able to write answers into the document itself and submit the document with my answers."

**Why:** many cards in a row felt like a stream of interruptions; he wants to answer in batches, in his own words.

**How to apply:** put open decisions into the Decision Docket https://claude.ai/artifact/GGuuHGu4DXpp9aMZTn9BYL (db: collection `decisions`, fields order/group/status open|submitted|applied/title/context/draft/options[{label,consequence}]/recommended/reason/text_label; his submissions land in `submissions` and set each decision's status "submitted" with `answer`). Add new decisions with ArtifactData, tell him in one line, and after he submits apply them, then set status "applied" with `applied_note`. Use a single card only for something urgent or irreversible. Supersedes the many-cards part of [[feedback-decisions-as-cards]]; content must still be shown plainly. Related: [[ee-self-validation]].
