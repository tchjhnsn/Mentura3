import { beforeEach, describe, expect, it, vi } from "vitest";
import type { EventOut } from "@reflect/core/events";

// Events (2026-11-18): the actions over an in-memory stand-in for the event store.
const E1 = "11111111-1111-4111-8111-111111111111";
const E2 = "22222222-2222-4222-8222-222222222222";
const ev = (over: Partial<EventOut>): EventOut => ({
  id: E1, source: "eddy", hostUser: null, status: "published", title: "Demo night", description: "Show what you built.", startsAt: "2026-11-20T00:30:00.000Z", endsAt: null,
  venue: "Capital Factory", address: null, url: "https://lu.ma/x", coverUrl: null, tags: ["AI"], price: "Free", city: "austin", forWhom: null, ...over,
});
const events = new Map<string, EventOut>();
const rsvps = new Set<string>();
let nextId = E2;

vi.mock("../events-store", async (importOriginal) => {
  const real = await importOriginal<typeof import("../events-store")>();
  return {
    ...real,
    upcomingEvents: async (o: { tag?: string | null }) => [...events.values()].filter((e) => e.status === "published" && (!o.tag || real.hasTag(e, o.tag))),
    eventById: async (id: string, viewer: string) => { const e = events.get(id); return e && (e.status !== "draft" || e.hostUser === viewer) ? e : null; },
    goingAmong: async (u: string, ids: string[]) => new Set(ids.filter((i) => rsvps.has(`${u}:${i}`))),
    isGoing: async (u: string, id: string) => rsvps.has(`${u}:${id}`),
    knownGoing: async (_u: string, ids: string[]) => new Map(ids.filter((i) => rsvps.has(`friend:${i}`)).map((i) => [i, [{ id: "friend", name: "Sam", image: null }]])),
    personOf: async (id: string) => ({ id, name: "Host", image: null }),
    setGoing: async (u: string, id: string, going: boolean) => { if (going) { if (!events.has(id)) throw new Error("No such event."); rsvps.add(`${u}:${id}`); } else rsvps.delete(`${u}:${id}`); },
    createDraft: async (u: string, d: { title: string | null; startsAt: string | null }) => { events.set(nextId, ev({ id: nextId, source: "reflect", hostUser: u, status: "draft", title: d.title ?? real.DRAFT_TITLE, startsAt: d.startsAt, url: null })); return nextId; },
    removeDraft: async (u: string, id: string) => { const e = events.get(id); if (e?.hostUser === u && e.status === "draft") events.delete(id); },
    setEventPart: async (u: string, id: string, part: string, value: unknown) => {
      const e = events.get(id);
      if (!e || e.hostUser !== u) throw new Error("No such event of yours.");
      const key = { title: "title", venue: "venue", for_whom: "forWhom" }[part as "title"] as keyof EventOut;
      const before = e[key] as string | null;
      const after = real.cleanPart(part as "title", value);
      events.set(id, { ...e, [key]: after });
      return { before, after };
    },
  };
});

const { eventsAction, eventAction, goingToEvent, hostEvent, setEventPartAction } = await import("./events");
const ctx = { userId: "u" };
const logged = (actionId: string, before: unknown, after: unknown) => ({ id: "c", userId: "u", actionId, source: "chat" as const, tier: "own" as const, input: {}, before, after, status: "done" as const, preview: null, createdAt: new Date(), undoneAt: null });

describe("events", () => {
  beforeEach(() => { events.clear(); rsvps.clear(); events.set(E1, ev({})); });

  it("lists upcoming events with Going, who you know, and the source attributed, filtered by tag", async () => {
    rsvps.add(`friend:${E1}`);
    const res = await eventsAction.run(ctx, {});
    expect(res.events).toEqual([expect.objectContaining({ id: E1, title: "Demo night", going: false, known_going: ["Sam"], source: "Eddy's Austin events", href: `/events/${E1}`, register_url: "https://lu.ma/x" })]);
    expect(res.events[0]!.when).toMatch(/Thu, Nov 19, 6:30/);
    expect((await eventsAction.run(ctx, { tag: "Founders" })).events).toEqual([]);
    expect((await eventsAction.run(ctx, { tag: "free" })).events).toHaveLength(1);
  });

  it("reads one event, and no one else's draft", async () => {
    expect(await eventAction.run(ctx, { id: E1 })).toMatchObject({ id: E1, about: "Show what you built.", going: false, host: null });
    events.set(E2, ev({ id: E2, source: "reflect", hostUser: "other", status: "draft" }));
    await expect(eventAction.run(ctx, { id: E2 })).rejects.toThrow("No such event");
  });

  it("says Going and undoes it", async () => {
    const before = await goingToEvent.before!(ctx, { id: E1, going: true });
    const res = await goingToEvent.run(ctx, { id: E1, going: true });
    expect(rsvps.has(`u:${E1}`)).toBe(true);
    const c = goingToEvent.change!(res, { id: E1, going: true }, before);
    await goingToEvent.undo!(ctx, logged("going_to_event", c.before, c.after));
    expect(rsvps.has(`u:${E1}`)).toBe(false);
  });

  it("hosts a draft, sets a part with undo, and undo of hosting removes the draft", async () => {
    const res = await hostEvent.run(ctx, { title: "Founders breakfast", starts_at: "2026-12-03T08:00:00-06:00" });
    expect(events.get(res.id)).toMatchObject({ status: "draft", hostUser: "u", title: "Founders breakfast" });

    const set = await setEventPartAction.run(ctx, { id: res.id, part: "venue", value: "Epoch Coffee" });
    expect(events.get(res.id)!.venue).toBe("Epoch Coffee");
    const c = setEventPartAction.change!(set, { id: res.id, part: "venue", value: "" }, undefined);
    await setEventPartAction.undo!(ctx, logged("set_event_part", c.before, c.after));
    expect(events.get(res.id)!.venue).toBe("Capital Factory");

    await expect(setEventPartAction.run({ userId: "other" }, { id: res.id, part: "title", value: "Mine" })).rejects.toThrow("No such event of yours");

    const hc = hostEvent.change!(res, {}, undefined);
    await hostEvent.undo!(ctx, logged("host_event", hc.before, hc.after));
    expect(events.has(res.id)).toBe(false);
  });

  it("offers reading for free and changes only the person's own", async () => {
    const { actionById } = await import("./index");
    expect(["events", "event", "going_to_event", "host_event", "set_event_part"].map((id) => [id, actionById(id)?.tier])).toEqual([
      ["events", "read"], ["event", "read"], ["going_to_event", "own"], ["host_event", "own"], ["set_event_part", "own"],
    ]);
  });
});
