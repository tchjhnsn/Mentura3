import { beforeEach, describe, expect, it, vi } from "vitest";

const store = vi.hoisted(() => ({ added: [] as unknown[] }));
vi.mock("./calendar-store", async (actual) => ({
  ...(await actual<typeof import("./calendar-store")>()),
  addEvent: async (_user: string, e: unknown) => {
    store.added.push(e);
    return `id-${store.added.length}`;
  },
  calendar: async () => [{ id: "a", tile: "friends", title: "Dinner with Sam", note: null, day: "2026-11-20", starts: "19:00", ends: null, repeat: "none", until: null, recordId: null }],
}));
const { addEvents, calendarPart, eventSchema } = await import("./calendar-tools");

describe("the calendar tools", () => {
  beforeEach(() => {
    store.added = [];
  });

  it("adds an event and says where it opens", async () => {
    const [e] = await addEvents("u", [{ title: " Dinner  with Sam ", day: "2026-11-20", starts: "19:00", ends: "21:00", tile: "friends" }]);
    expect(e).toEqual({ id: "id-1", title: "Dinner with Sam", day: "2026-11-20", when: "19:00–21:00", tile: "friends", tile_label: "Friends", repeat: "none", href: "/calendar?day=2026-11-20" });
  });

  it("adds none of an itinerary when one event is wrong", async () => {
    await expect(addEvents("u", [{ title: "Drive", day: "2026-11-20" }, { title: "Hike", day: "2026-11-21", starts: "10:00", ends: "09:00" }])).rejects.toThrow("Event 2: An event ends after it starts.");
    expect(store.added).toEqual([]);
  });

  it("reads a week of the calendar and refuses a day it cannot read", async () => {
    const r = await calendarPart("u", "2026-11-17");
    expect(r).toMatchObject({ from: "2026-11-17", to: "2026-11-24", tile: null, events: [{ title: "Dinner with Sam", when: "19:00", tile_label: "Friends", href: "/calendar?day=2026-11-20" }] });
    await expect(calendarPart("u", "soon")).rejects.toThrow(/YYYY-MM-DD/);
  });

  it("takes times as HH:MM only", () => {
    expect(eventSchema.safeParse({ title: "Run", day: "2026-11-20", starts: "7pm" }).success).toBe(false);
    expect(eventSchema.safeParse({ title: "Run", day: "2026-11-20", starts: "07:00", tile: "body" }).success).toBe(true);
  });
});
