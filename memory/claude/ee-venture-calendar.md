---
name: ee-venture-calendar
description: Torian 2026-10-29: headless local-first venture calendar as an installable component (not in Naive by default); Mentura adds team sync + Google/iCal; design doc, nothing built
metadata:
  type: project
  modified: 2026-10-29T08:45:00.070Z
---

Torian, 2026-10-29 08:42Z: a local calendar as part of every venture expands Naive from scaffold to local workspace; sync to the user's calendar of choice (Google, iCal); "the big win would be users adopting a Mentura calendar."

Thread cmsg_01TRojivaFzywKqAKrsycdv81S6TTUzrE967r56LbWHSet. Design doc: https://claude.ai/artifact/UN4dLQn4Fq2ySzT9UA3S3q

My proposal (not yet agreed): Naive = clock primitive (venture IANA zone, due/overdue computed on read, drives decision escalation), one-file-per-event JSCalendar-shaped JSON records, calendars/<name>.json with sharing as advisory data, derived events from decision deadlines/releases, .ics import/export + local /calendar.ics feed, git as free sync tier. Mentura = WebSocket relay (relay + backup, not source of truth), per-field LWW + hybrid logical clock first (CRDT later if needed), permission-enforced team calendars, hosted read-only .ics subscription URL as adoption wedge, then two-way Google, Graph, CalDAV, webhooks out. Open: record format, merge rule, first bridge, layer (governance vs operations), timing (after hackathon; no code before asking).

Related: [[ee-packages-kits-clock]], [[ee-framework-platform-split]], [[feedback-views-are-platform]].

2026-10-29 09:09Z Torian DECIDED: the calendar belongs in the library as an installable headless component, NOT inside Naive by default. Doc revised: open calendar component (package) + Mentura sync/connectors (kit). Still open: whether a tiny clock (now, venture zone, due/overdue for decision escalation) stays in Naive core (my recommendation) or moves into the component; install mechanism (`naive add calendar` recommended).
