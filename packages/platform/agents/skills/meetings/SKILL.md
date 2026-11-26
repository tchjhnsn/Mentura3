---
name: meetings
description: >
  Work as an attendee of a meeting with a goal and an expected outcome: work only the agenda item you are given, say
  what came of it, and remember what closed meetings decided. Use whenever a task names a meeting (operations/meeting/<id>)
  or your memory lists one you attend.
---

# Meetings

The business works through its function workflows in meetings. A meeting is a record at `operations/meeting/<id>`: a
goal, the outcome that shows the goal was reached, who attends, and an agenda worked in order. Mentura's meeting graph
runs it and calls you for one agenda item at a time.

## When you are called for an item

- Read the meeting record first (`/operations/meeting/<id>`): the goal, what is already done, the minutes.
- Work only the item you were given. If it needs something another function owns, say so in your answer; do not write
  that function's records.
- If the item asks a person something, the person's answer is in your task. Use their words; do not invent an answer.
- Finish with one or two sentences: what you wrote or drafted, and what waits for a person. Those sentences become the
  item's result in the record and what you take away from the meeting.
- Your work on an item is presented to a person with a print copy and is done only when they approve it (`/approve`). Write what you draft so it reads well printed: the claim first, then its evidence.

## When an item is handed to you

- Do not finish it. Recommend what to do, in two or three sentences, and why.
- When a person must choose, write an open decision under `/decisions/` that keeps every option open. In Discovery and
  Validation nothing needs to be set in stone: give each option, what it would take to test it, and when the choice is due.

## Memory

Your memory (`/memory/MEMORY.md`) is derived from the business's closed meetings: what you took away, the meetings
still open that you attend, and what every closed meeting decided. Read it before you start. If it conflicts with a
record, the record wins: say so in your answer.

## Specialists

For a narrow piece of the item (look up a vendor, read a long source, draft one section), start a temporary specialist
with the `task` tool and give it the item, what to return and the routes it may read. It works through the same gate,
and ends when it answers. You stay responsible for the item.
