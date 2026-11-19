// Meetings (doc "Mentura meetings and building-only Mentura design guide", 2026-11-19): the chat and the person's own
// AI read the meetings the person hosts or is a guest on and one meeting, schedule a meeting they host, set its parts,
// keep its notes and add follow-ups; the Meetings pages run the same entries. Inviting guests and sharing the notes
// reach other people, so they stay taps on the meeting's page (web/src/app/meetings/[id]/actions.ts).
import { z } from "zod";
import { agendaItems, endsAt, MEETING_PARTS, stateLine, type MeetingPart } from "@reflect/core/meetings";
import {
  addFollowup, createMeeting, meetingFor, meetingsOf, removeFollowup, setMeetingPart, setNotes, unscheduleMeeting, type MeetingRow,
} from "../meetings-store";
import { action } from "./types";

const meetingId = z.string().uuid().describe("The meeting's id, from `meetings`");
const href = (id: string) => `/meetings/${id}`;

/** A meeting in a list as the chat and MCP read it: when in words, who is in it, and its page. */
function brief(m: MeetingRow, now: Date) {
  return {
    id: m.id,
    title: m.title,
    role: m.role,
    state: m.state,
    when: stateLine(m, now),
    starts_at: m.startsAt,
    ends_at: endsAt(m),
    minutes: m.minutes,
    people: m.people.map((p) => p.name),
    href: href(m.id),
  };
}

const upcoming = (m: MeetingRow) => m.state === "live" || m.state === "scheduled" || m.state === "draft";

export const meetingsAction = action({
  id: "meetings",
  title: "Meetings",
  description: "The meetings the person hosts or is a guest on: upcoming first (live, then by start, then those with no time yet), or past ones (ended or cancelled, latest first). Each has when it is in words, who is in it and its page.",
  tier: "read",
  on: ["chat", "mcp"],
  input: z.object({ past: z.boolean().default(false).describe("Past meetings instead of upcoming ones") }),
  run: async ({ userId, now }, { past }) => {
    const at = now ?? new Date();
    const all = await meetingsOf(userId, at);
    const list = past ? all.filter((m) => !upcoming(m)).reverse() : all.filter(upcoming);
    return { meetings: list.slice(0, 60).map((m) => brief(m, at)), href: past ? "/meetings?tab=past" : "/meetings" };
  },
});

export const meetingAction = action({
  id: "meeting",
  title: "One meeting",
  description: "One meeting the person hosts or is a guest on, by its id: when, the agenda, the call link, who is in it, and the notes and follow-ups when the person may see them (a guest sees them once the host shares them). Never the host's prep.",
  tier: "read",
  on: ["chat", "mcp"],
  input: z.object({ id: meetingId }),
  run: async ({ userId, now }, { id }) => {
    const at = now ?? new Date();
    const m = await meetingFor(userId, id, at);
    if (!m) throw new Error("No such meeting.");
    const host = m.role === "host";
    return {
      id: m.id,
      title: m.title,
      role: m.role,
      host: m.host.name,
      state: m.state,
      when: stateLine(m, at),
      starts_at: m.startsAt,
      ends_at: endsAt(m),
      minutes: m.minutes,
      agenda: m.agenda,
      agenda_items: agendaItems(m.agenda),
      call_url: m.callUrl,
      ...(host ? { venture_id: m.ventureId } : {}),
      // A guest never gets another guest's email; the host sees whom they invited.
      guests: m.guests.map((g) => ({ name: g.person?.name ?? g.name ?? "A guest", joined: !!g.acceptedAt, ...(host ? { email: g.email } : {}) })),
      notes: m.notes,
      notes_shared: !!m.notesSharedAt,
      followups: m.followups,
      href: href(m.id),
    };
  },
});

export const scheduleMeeting = action({
  id: "schedule_meeting",
  title: "Schedule a meeting",
  description: "Start a meeting the person hosts: its title, start, length in minutes, agenda (one item per line), the call's https link and the venture it is about. All are optional; left out, it is a draft called New meeting with no time. Guests are invited on its page. Only when they ask.",
  tier: "own",
  on: ["chat", "mcp"],
  input: z.object({
    title: z.string().min(1).max(200).optional().describe("The meeting's name"),
    starts_at: z.string().max(40).optional().describe("When it starts, as an ISO date and time with its offset, such as 2026-12-03T10:00:00-06:00"),
    minutes: z.number().int().min(5).max(480).optional().describe("How long it is planned to run; 45 when left out"),
    agenda: z.string().max(8000).optional().describe("The agenda, one item per line"),
    call_url: z.string().max(2000).optional().describe("The call's link (https), when it is held on an outside call"),
    venture_id: z.string().max(100).optional().describe("The venture the meeting is about"),
  }),
  run: async ({ userId }, parts) => {
    const given = Object.fromEntries(Object.entries(parts).filter(([, v]) => v !== undefined)) as Partial<Record<MeetingPart, unknown>>;
    const { id } = await createMeeting(userId, given);
    return { id, href: href(id) };
  },
  change: (res) => ({ after: { id: res.id } }),
  undo: async ({ userId }, c) => {
    const a = c.after as { id?: unknown } | null;
    if (typeof a?.id !== "string") throw new Error("This change cannot be undone.");
    await unscheduleMeeting(userId, a.id);
  },
});

export const setMeetingPartAction = action({
  id: "set_meeting_part",
  title: "Set a part of a meeting you host",
  description: "Set one part of a meeting the person hosts: title, starts_at (ISO date and time with offset), minutes (5 to 480), agenda (one item per line), call_url (an https link) or venture_id. An empty value clears it (not the title or the length). Only the person's own words.",
  tier: "own",
  on: ["chat", "mcp"],
  input: z.object({ id: meetingId, part: z.enum(MEETING_PARTS), value: z.string().max(8000) }),
  run: async ({ userId }, { id, part, value }) => {
    const { before, after } = await setMeetingPart(userId, id, part, value);
    return { id, part, before, after, href: href(id) };
  },
  change: (res) => ({ before: { id: res.id, part: res.part, value: res.before }, after: { id: res.id, part: res.part, value: res.after } }),
  undo: async ({ userId }, c) => {
    const b = c.before as { id?: unknown; part?: unknown; value?: unknown } | null;
    if (typeof b?.id !== "string" || !MEETING_PARTS.includes(b.part as MeetingPart)) throw new Error("This change cannot be undone.");
    await setMeetingPart(userId, b.id, b.part as MeetingPart, b.value ?? "");
  },
});

export const setMeetingNotes = action({
  id: "set_meeting_notes",
  title: "Keep the notes of a meeting you host",
  description: "Replace the notes of a meeting the person hosts with this text (the whole notes; read them with `meeting` first to add to them). Only the host keeps notes; guests see them once the host shares them on the page. Only the person's own words.",
  tier: "own",
  on: ["chat", "mcp"],
  input: z.object({ id: meetingId, text: z.string().max(50_000) }),
  run: async ({ userId }, { id, text }) => {
    const { before } = await setNotes(userId, id, text);
    return { id, before, href: href(id) };
  },
  logged: (input) => ({ id: input.id, chars: input.text.length }),
  change: (res) => ({ before: { id: res.id, text: res.before } }),
  undo: async ({ userId }, c) => {
    const b = c.before as { id?: unknown; text?: unknown } | null;
    if (typeof b?.id !== "string") throw new Error("This change cannot be undone.");
    await setNotes(userId, b.id, typeof b.text === "string" ? b.text : "");
  },
});

export const addMeetingFollowup = action({
  id: "add_meeting_followup",
  title: "Add a follow-up to a meeting you host",
  description: "Add a follow-up to a meeting the person hosts: what is to be done, who will do it (a name) and the day it is due (YYYY-MM-DD). Only the host adds follow-ups. Only when they ask.",
  tier: "own",
  on: ["chat", "mcp"],
  input: z.object({
    id: meetingId,
    text: z.string().min(1).max(500).describe("What is to be done"),
    owner: z.string().max(100).optional().describe("Who will do it"),
    due: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().describe("The day it is due, YYYY-MM-DD"),
  }),
  run: async ({ userId }, { id, text, owner, due }) => {
    const followup = await addFollowup(userId, id, { text, owner, due });
    return { id, followup, href: href(id) };
  },
  change: (res) => ({ after: { id: res.id, followup: res.followup.id } }),
  undo: async ({ userId }, c) => {
    const a = c.after as { id?: unknown; followup?: unknown } | null;
    if (typeof a?.id !== "string" || typeof a.followup !== "string") throw new Error("This change cannot be undone.");
    await removeFollowup(userId, a.id, a.followup);
  },
});
