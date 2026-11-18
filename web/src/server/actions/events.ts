// Events (doc "Events and connections design guide", 2026-11-18): the chat and the person's own AI read the upcoming
// events of Austin (hosted in Reflect and Eddy's feed) and one event with who the person knows is going, say Going,
// host an event as a draft and set its parts; the Events pages run the same entries. Publishing and cancelling reach
// other people, so they stay taps on the event's page (web/src/app/events/actions.ts).
import { z } from "zod";
import { austinDay, dayLabel, EDDY, timeLabel, type EventOut } from "@reflect/core/events";
import {
  createDraft, EVENT_PARTS, eventById, goingAmong, isGoing, isPast, knownGoing, personOf, removeDraft, setEventPart, setGoing, upcomingEvents, type Person,
} from "../events-store";
import { action } from "./types";

const eventId = z.string().uuid().describe("The event's id, from `events`");

/** An event as the chat and MCP read it: when and where in words, its page, and its source attributed. */
function brief(e: EventOut, extra: { going?: boolean; known?: Person[] } = {}) {
  return {
    id: e.id,
    title: e.title,
    status: e.status,
    when: e.startsAt ? `${dayLabel(austinDay(e.startsAt))}, ${timeLabel(e.startsAt)}${e.endsAt ? ` to ${timeLabel(e.endsAt)}` : ""}` : null,
    starts_at: e.startsAt,
    ends_at: e.endsAt,
    venue: e.venue,
    address: e.address,
    tags: e.tags,
    price: e.price,
    for_whom: e.forWhom,
    register_url: e.url,
    href: `/events/${e.id}`,
    source: e.source === "eddy" ? EDDY.name : "Hosted in Reflect",
    ...(extra.going !== undefined ? { going: extra.going } : {}),
    ...(extra.known ? { known_going: extra.known.map((p) => p.name) } : {}),
  };
}

export const eventsAction = action({
  id: "events",
  title: "Upcoming events",
  description: `The events in Austin from now through four weeks, by start: those hosted in Reflect and those from ${EDDY.name} (say where each is from). Filter by a tag (such as Free, Technical, Founders, AI) or a day (YYYY-MM-DD). Each says whether the person is going and who they know is going.`,
  tier: "read",
  on: ["chat", "mcp"],
  input: z.object({
    tag: z.string().max(40).optional().describe("Only events with this tag"),
    day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().describe("Only events on this day in Austin"),
  }),
  run: async ({ userId }, { tag, day }) => {
    const list = (await upcomingEvents({ tag: tag ?? null, day: day ?? null })).slice(0, 60);
    const ids = list.map((e) => e.id);
    const [going, known] = await Promise.all([goingAmong(userId, ids), knownGoing(userId, ids)]);
    return { events: list.map((e) => brief(e, { going: going.has(e.id), known: known.get(e.id) ?? [] })), href: "/events" };
  },
});

export const eventAction = action({
  id: "event",
  title: "One event",
  description: "One event by its id: when, where, what it is about, who it is for, where to register, whether the person is going and the people they know who are going.",
  tier: "read",
  on: ["chat", "mcp"],
  input: z.object({ id: eventId }),
  run: async ({ userId }, { id }) => {
    const e = await eventById(id, userId);
    if (!e) throw new Error("No such event.");
    const [going, known, host] = await Promise.all([isGoing(userId, id), knownGoing(userId, [id]), e.hostUser ? personOf(e.hostUser) : Promise.resolve(null)]);
    return { ...brief(e, { going, known: known.get(id) ?? [] }), about: e.description, host: host?.name ?? null, past: isPast(e) };
  },
});

export const goingToEvent = action({
  id: "going_to_event",
  title: "Say Going to an event",
  description: "Say the person is Going to an event (or, with going false, take it back). Going puts it on their calendar. Only when they ask.",
  tier: "own",
  on: ["chat", "mcp"],
  input: z.object({ id: eventId, going: z.boolean().default(true) }),
  before: async ({ userId }, { id }) => ({ id, going: await isGoing(userId, id) }),
  run: async ({ userId }, { id, going }) => {
    await setGoing(userId, id, going);
    return { id, going, href: `/events/${id}` };
  },
  change: (res, _input, before) => ({ before, after: { id: res.id, going: res.going } }),
  undo: async ({ userId }, c) => {
    const b = c.before as { id?: unknown; going?: unknown } | null;
    if (typeof b?.id !== "string" || typeof b.going !== "boolean") throw new Error("This change cannot be undone.");
    if (b.going) await setGoing(userId, b.id, true).catch(() => {}); // an event since over or cancelled stays as it is
    else await setGoing(userId, b.id, false);
  },
});

export const hostEvent = action({
  id: "host_event",
  title: "Host an event",
  description: "Start an event the person hosts in Reflect, as a draft only they see: its title and start. They set the rest (place, cover, who it is for, about) and tap Publish on its page. Only when they ask.",
  tier: "own",
  on: ["chat", "mcp"],
  input: z.object({
    title: z.string().min(1).max(200).optional().describe("The event's name; left out, the draft is called New event"),
    starts_at: z.string().max(40).optional().describe("When it starts, as an ISO date and time with its offset, such as 2026-12-03T18:00:00-06:00"),
  }),
  run: async ({ userId }, { title, starts_at }) => {
    const id = await createDraft(userId, { title: title ?? null, startsAt: starts_at ?? null });
    return { id, href: `/events/${id}` };
  },
  change: (res) => ({ after: { id: res.id } }),
  undo: async ({ userId }, c) => {
    const a = c.after as { id?: unknown } | null;
    if (typeof a?.id !== "string") throw new Error("This change cannot be undone.");
    await removeDraft(userId, a.id);
  },
});

export const setEventPartAction = action({
  id: "set_event_part",
  title: "Set a part of an event you host",
  description: "Set one part of an event the person hosts: title, starts_at or ends_at (ISO date and time with offset), venue, address, cover_url (a picture's https link), description (about), for_whom (who it is for), or tags (comma separated). An empty value clears it. Only the person's own words.",
  tier: "own",
  on: ["chat", "mcp"],
  input: z.object({ id: eventId, part: z.enum(EVENT_PARTS), value: z.string().max(8000) }),
  run: async ({ userId }, { id, part, value }) => {
    const { before, after } = await setEventPart(userId, id, part, value);
    return { id, part, before, after, href: `/events/${id}` };
  },
  change: (res) => ({ before: { id: res.id, part: res.part, value: res.before }, after: { id: res.id, part: res.part, value: res.after } }),
  undo: async ({ userId }, c) => {
    const b = c.before as { id?: unknown; part?: unknown; value?: unknown } | null;
    if (typeof b?.id !== "string" || typeof b.part !== "string" || !EVENT_PARTS.includes(b.part as (typeof EVENT_PARTS)[number])) throw new Error("This change cannot be undone.");
    await setEventPart(userId, b.id, b.part as (typeof EVENT_PARTS)[number], b.value ?? "");
  },
});
