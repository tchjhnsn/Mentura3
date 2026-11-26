---
name: tooling
description: >
  Recommend a tool for a piece of the business's work (a calendar, meeting software, a CRM, email, storage, analytics)
  and refuse tools that hide activity from the business or lock its data in. Use whenever a task, a meeting or a
  person names work that a tool would carry, and before any record names a tool the business will use.
---

# Choosing tools: visibility and ownership first

A Mentura agent is opinionated about tools. The business can only be run by agents and people together if every
activity, process and task leaves a record that the business can read. So a tool earns its place in two ways before
anything else: it lets the business see what happened, and it lets the business own what it holds.

## When to use this skill

- A person or a task names work that a tool would carry: meeting a lead, scheduling, sending email, tracking a deal,
  storing files, taking payments, publishing.
- A record is about to name a tool the business will use (an IT connection, a spend line, a workflow step).
- A meeting's agenda item reaches a step that happens outside the records, such as a call with a customer.

## The two questions, in order

1. **Visibility.** After the tool is used, can the business's agents read what happened, without a person retyping it?
   - Meetings are recorded and transcribed, with the participants' consent, and the transcript reaches the business's
     records (operations/meetings, a lead's record, the raw sources) through an API, an MCP server or an export.
   - Every action the tool takes on the business's behalf leaves an event an agent can read (webhooks, an audit log,
     an API with history).
   - A tool that keeps activity only in its own screens fails, however good the screens are.
2. **Ownership.** Does the business hold its own data and its own account?
   - The account is the business's, under the business's identity, never a person's personal account.
   - All of it exports in an open format (JSON, CSV, Markdown, ICS, audio files), and the export is tested once.
   - Prefer a tool the business can run itself, or one with a documented way out (the IT connection's `exit`), over
     one with neither. Leaving should cost a migration, not the history.

Then the usual fit: does it do the job, what does it cost per month, and who on the team must learn it.

## How to recommend

- Name one tool and one runner-up, with how each answers visibility and ownership, in a sentence each.
- Say what it records and where that record lands in the business, by route.
- Score each candidate with the rubric in `tool-policy.json` (`scoreTool` in `platform/agents/tool-policy.ts` does
  the arithmetic). A candidate that scores 0 on visibility or on ownership is ruled out, whatever the rest.
- A tool that spends money, signs anything or sends anything in the business's name is a decision for a person: write
  an open decision under `/decisions/` with the options, and keep every option open until the person chooses.
- When a meeting with a lead is planned, recommend a recording meeting tool before the meeting, and the consent line
  to read at its start.

## What not to do

- Do not recommend a tool because it is popular. Say how it answers the two questions.
- Do not connect a tool or create an account. Recommending is yours; connecting is a person's, through an IT connection.
- Do not record anyone without consent. A meeting with no consent is noted as unrecorded, and its notes are written by
  hand into the meeting record.
