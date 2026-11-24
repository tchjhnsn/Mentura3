<!-- exported 2026-11-03 from https://claude.ai/artifact/UN4dLQn4Fq2ySzT9UA3S3q (Claude Docs id dd97990e-52e1-4e2f-9125-cc7b91a548e8) -->
# Venture calendar: design proposal

Oct 29, 2026 · @Torian · Status: proposal, nothing built. Decisions are Torian's. Revised 09:10Z: the calendar is an optional installable component, not part of Naive by default.

## The short answer

Yes, it is possible and practical. The pattern is local-first software: every teammate's venture folder holds the full calendar as plain files, works offline, and syncs when it can. The calendar is a headless component in the library that a venture installs when it wants one. It is not inside Naive by default. The open component handles the calendar records offline, with no account and no vendor. Mentura adds everything that needs a network: live team sync, sharing that is actually enforced, and two-way sync with Google Calendar, iCloud and Outlook.

Naive stays a scaffold by default. Installing the calendar component (for example `naive add calendar`, package name to be decided) is what turns a venture folder into a local workspace with its own calendar. In the vocabulary already agreed, the open component is a package and Mentura's sync and connectors are its kit.

## The calendar component (open, installable, offline)

**Clock (open question).** A small time primitive: `now` from the system clock, the venture's IANA time zone from `venture.json`, and helpers for due, overdue and "in N days". No daemon is needed; deadlines and escalation are computed whenever a route, `naive check` or an agent reads the records. My recommendation is that this tiny clock stays in Naive core, because decision deadlines and escalation need it even in ventures without a calendar. The calendar component builds on it. If you want no time code in core at all, the clock moves into the component too.

**Calendar records.** One event per file, so git merges cleanly and two people rarely touch the same file. Proposed shape: JSON records that follow JSCalendar (RFC 8984, the JSON form of iCalendar), so they fit Naive's record conventions and convert losslessly to `.ics`. Each event has a stable UID, a start in local time plus an IANA zone (never a bare offset), optional RRULE recurrence, attendees and a calendar id.

**Calendars and sharing as data.** `calendars/<name>.json` names the owner, members and visibility. Locally this is advisory: anyone with the folder can read it. Real enforcement needs a server or encryption, which is Mentura.

**Derived events.** Once installed, the component shows decision deadlines, release dates and the near-daily strategic foundation review automatically, as a view over records that already carry dates. Nothing is copied, so nothing drifts. Uninstalling it loses nothing, because those dates still live in their own records.

**Interop without an account.** The component adds `calendar export` and `calendar import` commands for `.ics` files and a `/calendar.ics` route to the local API, so a calendar app on the same machine can subscribe. It stays headless: routes return data, and any visual calendar is Mentura or a visualization skill.

**Free sync tier.** Because events are files, a team that shares the venture repo already syncs through git pull and push. It is not live, but it works offline, across networks, with no Mentura account.

## Mentura (platform)

**Live team sync.** A relay that devices connect to over WebSocket. Each device keeps its own full copy and sends changes; the relay forwards them and keeps an encrypted backup. The server is a relay and backup, not the source of truth, which keeps the local-first promise.

**Merge rule.** Two options. (a) Per-field last-writer-wins ordered by a hybrid logical clock: simple, keeps records as plain files, and fine for calendars, where two people rarely edit the same field of the same event at once. (b) A CRDT such as Automerge: merges everything automatically but stores a change history beside or instead of plain files. Recommendation: start with (a), move to (b) only if real conflicts show up.

**Teams and multi-tenancy.** Organization, then team calendars, then personal calendars. Identity comes from the Mentura account. The relay enforces permissions and only sends each device the events it may see. End-to-end encryption can come later.

**External calendars.** In order of effort: (1) a hosted, read-only `.ics` subscription URL per calendar, which works in Google, Apple and Outlook on day one with no OAuth; (2) two-way Google Calendar sync through its API and push notification channels; (3) Microsoft Graph for Outlook; (4) CalDAV for iCloud, Fastmail and self-hosted servers. Invites to people outside Mentura go out as standard email invitations (iTIP/iMIP), which every calendar app understands.

**Webhooks out.** Event created, changed or due fires a webhook, so a team's own services and agents can react.

## The adoption path

The wedge is the subscription URL: a founder installs the calendar component, their decision deadlines show up in the Google or Apple calendar they already use, and teammates subscribe with one link. Team sync and two-way editing are the paid step. People adopt a Mentura calendar because it already holds their venture's dates, not because they switched calendar apps.

## Hard parts

- Time zones and daylight saving: store local time plus IANA zone, expand with a maintained library.
- Recurrence: RRULE with exceptions and moved instances is the most bug-prone area; use a tested library, never hand-rolled.
- Deletions: keep tombstones so a deleted event does not reappear from an offline device.
- Device clocks disagree: the hybrid logical clock handles ordering.
- Google verification: the calendar scopes need Google's OAuth app review, which can take weeks. Start it early if two-way Google sync is wanted.
- Scope: keeping the calendar out of Naive by default limits how much it grows Naive. Core gains at most the small clock.

## Proposed first slice

Naive core: the small clock only, if you agree. Calendar component: event and calendar record schemas, derived deadline events, `.ics` export and a local feed. Mentura: a hosted read-only feed URL. Live sync, two-way Google and encryption come after. No code before the hackathon ends; the demo excludes time features.

## Open decisions

1. **Record format:** JSCalendar-shaped JSON records with `.ics` export (recommended), or raw `.ics` files on disk.
2. **Merge rule for Mentura sync:** last-writer-wins with a hybrid logical clock first (recommended), or a CRDT from the start.
3. **First external bridge:** read-only subscription URL first (recommended), or two-way Google first.
4. **Clock and layer:** keep the small clock in Naive core (recommended) or put it inside the calendar component. Separately, the component's records belong in the governance layer as you suggested, or in operations.
5. **How it installs:** a command such as `naive add calendar` that installs an npm package and registers its routes (recommended), or a plain npm install the founder wires up.
6. **When:** start after the hackathon deadline (recommended), or now on a separate branch.
