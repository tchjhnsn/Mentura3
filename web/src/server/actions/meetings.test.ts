import { beforeEach, describe, expect, it, vi } from "vitest";
import type { MeetingRow, MeetingView } from "../meetings-store";

// Meetings (2026-11-19): the actions over an in-memory stand-in for the meetings store.
const M1 = "11111111-1111-4111-8111-111111111111";
const M2 = "22222222-2222-4222-8222-222222222222";
const NOW = new Date("2026-11-19T15:00:00Z");
const host = { id: "u", name: "Ana", image: null };
const view = (over: Partial<MeetingView> = {}): MeetingView => ({
  id: M1, role: "host", host, title: "Pitch review", startsAt: "2026-11-20T16:00:00.000Z", minutes: 45, agenda: "1. Numbers\n2. Ask", callUrl: null, ventureId: "v1",
  dailyRoom: null, cancelled: false, state: "scheduled", notes: "Went well", notesSharedAt: null, followups: [],
  guests: [{ id: "g1", email: "sam@example.com", name: "Sam", acceptedAt: null, person: null }], createdAt: NOW.toISOString(), ...over,
});
const rows: MeetingRow[] = [];
const notes = new Map<string, string>();
const removed: string[] = [];

vi.mock("../meetings-store", () => ({
  meetingsOf: async () => rows,
  meetingFor: async (u: string, id: string) => (id !== M1 ? null : u === "u" ? view() : view({ role: "guest", notes: null, followups: null, guests: [{ id: "g1", email: "", name: "Sam", acceptedAt: null, person: null }] })),
  createMeeting: async (_u: string, parts: Record<string, unknown>) => { expect(parts).not.toHaveProperty("agenda"); return { id: M2 }; },
  unscheduleMeeting: async (_u: string, id: string) => { removed.push(id); return "removed"; },
  setMeetingPart: async (u: string, id: string, part: string, value: unknown) => { if (u !== "u") throw new Error("No such meeting."); return { before: part === "title" ? "Old" : null, after: value }; },
  setNotes: async (u: string, id: string, text: string) => { if (u !== "u") throw new Error("No such meeting."); const before = notes.get(id) ?? null; notes.set(id, text); return { before }; },
  addFollowup: async (_u: string, _id: string, f: { text: string }) => ({ id: "f1", text: f.text, owner: null, due: null, done: false }),
  removeFollowup: async (_u: string, _m: string, f: string) => { removed.push(f); },
}));

const { meetingsAction, meetingAction, scheduleMeeting, setMeetingPartAction, setMeetingNotes, addMeetingFollowup } = await import("./meetings");
const logged = (actionId: string, before: unknown, after: unknown) => ({ id: "c", userId: "u", actionId, source: "chat" as const, tier: "own" as const, input: {}, before, after, status: "done" as const, preview: null, createdAt: NOW, undoneAt: null });
const row = (over: Partial<MeetingRow>): MeetingRow => ({ id: M1, role: "host", title: "Pitch review", startsAt: "2026-11-20T16:00:00.000Z", minutes: 45, cancelled: false, state: "scheduled", ventureId: null, people: [host], ...over });

describe("meetings", () => {
  beforeEach(() => { rows.length = 0; notes.clear(); removed.length = 0; });

  it("lists upcoming meetings with when in words and their page, and past ones apart", async () => {
    rows.push(row({}), row({ id: M2, title: "Old call", startsAt: "2026-11-01T16:00:00.000Z", state: "ended" }));
    const up = await meetingsAction.run({ userId: "u", now: NOW }, { past: false });
    expect(up.meetings).toEqual([expect.objectContaining({ id: M1, title: "Pitch review", people: ["Ana"], href: `/meetings/${M1}`, ends_at: "2026-11-20T16:45:00.000Z" })]);
    expect(up.meetings[0]!.when).toMatch(/Fri, Nov 20/);
    expect((await meetingsAction.run({ userId: "u", now: NOW }, { past: true })).meetings.map((m) => m.id)).toEqual([M2]);
  });

  it("reads one meeting: the host sees guests' emails, a guest never does", async () => {
    const h = await meetingAction.run({ userId: "u", now: NOW }, { id: M1 });
    expect(h).toMatchObject({ role: "host", agenda_items: ["Numbers", "Ask"], notes: "Went well", venture_id: "v1", guests: [{ name: "Sam", email: "sam@example.com", joined: false }] });
    const g = await meetingAction.run({ userId: "guest", now: NOW }, { id: M1 });
    expect(g).toMatchObject({ role: "guest", notes: null, followups: null });
    expect(g.guests[0]).not.toHaveProperty("email");
    expect(g).not.toHaveProperty("venture_id");
    expect(JSON.stringify(g)).not.toContain("sam@example.com");
    await expect(meetingAction.run({ userId: "u" }, { id: M2 })).rejects.toThrow("No such meeting");
  });

  it("schedules a meeting with only the parts given, and undo takes it back", async () => {
    const res = await scheduleMeeting.run({ userId: "u" }, { title: "Board call", minutes: 30 });
    expect(res).toEqual({ id: M2, href: `/meetings/${M2}` });
    await scheduleMeeting.undo!({ userId: "u" }, logged("schedule_meeting", null, scheduleMeeting.change!(res, {}, undefined).after));
    expect(removed).toEqual([M2]);
  });

  it("sets a part with its before for undo, and refuses a part it does not know", async () => {
    const res = await setMeetingPartAction.run({ userId: "u" }, { id: M1, part: "title", value: "New" });
    expect(setMeetingPartAction.change!(res, { id: M1, part: "title", value: "New" }, undefined)).toEqual({ before: { id: M1, part: "title", value: "Old" }, after: { id: M1, part: "title", value: "New" } });
    expect(setMeetingPartAction.input!.safeParse({ id: M1, part: "prep", value: "x" }).success).toBe(false);
  });

  it("keeps notes for the host only, and undo puts the notes before back", async () => {
    notes.set(M1, "first");
    const res = await setMeetingNotes.run({ userId: "u" }, { id: M1, text: "second" });
    expect(notes.get(M1)).toBe("second");
    await setMeetingNotes.undo!({ userId: "u" }, logged("set_meeting_notes", setMeetingNotes.change!(res, { id: M1, text: "second" }, undefined).before, null));
    expect(notes.get(M1)).toBe("first");
    await expect(setMeetingNotes.run({ userId: "guest" }, { id: M1, text: "x" })).rejects.toThrow("No such meeting");
  });

  it("adds a follow-up, and undo removes it", async () => {
    const res = await addMeetingFollowup.run({ userId: "u" }, { id: M1, text: "Send the deck" });
    expect(res.followup).toMatchObject({ id: "f1", text: "Send the deck" });
    await addMeetingFollowup.undo!({ userId: "u" }, logged("add_meeting_followup", null, addMeetingFollowup.change!(res, { id: M1, text: "Send the deck" }, undefined).after));
    expect(removed).toEqual(["f1"]);
  });
});
