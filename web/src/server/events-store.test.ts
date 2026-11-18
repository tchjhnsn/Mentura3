import { describe, expect, it } from "vitest";
import type { EventOut } from "@reflect/core/events";
import { austinLocal, byDay, canPublish, cleanPart, DRAFT_TITLE, fetchEddy, fromAustinLocal, hashToken, hasTag, isPast, newDoorToken, rowToEvent, toCalEvent } from "./events-store";

// Events (2026-11-18): the store's pure parts, and the feed's paging over a stand-in fetch. The SQL runs in the app.
const ev = (over: Partial<EventOut>): EventOut => ({
  id: "e1", source: "eddy", hostUser: null, status: "published", title: "Meetup", description: null, startsAt: "2026-11-20T00:00:00.000Z", endsAt: null,
  venue: null, address: null, url: null, coverUrl: null, tags: [], price: null, city: "austin", forWhom: null, ...over,
});

describe("a hosted event's parts", () => {
  it("cleans each part as the row keeps it", () => {
    expect(cleanPart("title", "  Founders   breakfast ")).toBe("Founders breakfast");
    expect(() => cleanPart("title", " ")).toThrow("Name the event");
    expect(cleanPart("starts_at", "2026-12-03T18:00:00-06:00")).toBe("2026-12-04T00:00:00.000Z");
    expect(cleanPart("starts_at", "")).toBeNull();
    expect(() => cleanPart("ends_at", "soon")).toThrow("not a date");
    expect(cleanPart("cover_url", "https://example.test/a.jpg")).toBe("https://example.test/a.jpg");
    expect(() => cleanPart("cover_url", "javascript:alert(1)")).toThrow("link to a picture");
    expect(cleanPart("tags", "AI, founders,  ai , Free")).toEqual(["AI", "founders", "Free"]);
    expect(cleanPart("venue", "")).toBeNull();
    expect(cleanPart("description", "Line one\nLine two")).toBe("Line one\nLine two");
  });

  it("publishes only a named draft with a start", () => {
    expect(canPublish({ title: "Breakfast", startsAt: "2026-12-04T00:00:00Z", status: "draft" })).toBe(true);
    expect(canPublish({ title: DRAFT_TITLE, startsAt: "2026-12-04T00:00:00Z", status: "draft" })).toBe(false);
    expect(canPublish({ title: "Breakfast", startsAt: null, status: "draft" })).toBe(false);
    expect(canPublish({ title: "Breakfast", startsAt: "2026-12-04T00:00:00Z", status: "published" })).toBe(false);
  });

  it("makes a door token whose hash alone is kept", () => {
    const a = newDoorToken(), b = newDoorToken();
    expect(a.token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(a.hash).toBe(hashToken(a.token));
    expect(a.hash).toMatch(/^[0-9a-f]{64}$/);
    expect(a.token).not.toBe(b.token);
  });

  it("reads and writes Austin's clock across daylight saving", () => {
    expect(fromAustinLocal("2026-12-03T18:00")).toBe("2026-12-04T00:00:00.000Z");
    expect(fromAustinLocal("2026-07-03T18:00")).toBe("2026-07-03T23:00:00.000Z");
    expect(austinLocal("2026-12-04T00:00:00.000Z")).toBe("2026-12-03T18:00");
    expect(fromAustinLocal("tomorrow")).toBeNull();
  });
});

describe("listing events", () => {
  it("reads a row", () => {
    const e = rowToEvent({ id: "x", source: "reflect", host_user: "u", status: "draft", title: "T", starts_at: new Date("2026-12-04T00:00:00Z"), tags: ["AI"], city: "austin" });
    expect(e).toMatchObject({ id: "x", hostUser: "u", startsAt: "2026-12-04T00:00:00.000Z", endsAt: null, tags: ["AI"], coverUrl: null });
  });

  it("groups by Austin day with hosted events first in each day", () => {
    const list = [
      ev({ id: "a", startsAt: "2026-11-20T01:00:00.000Z" }), // Nov 19, 7 PM in Austin
      ev({ id: "b", source: "reflect", startsAt: "2026-11-20T03:00:00.000Z" }), // Nov 19, 9 PM
      ev({ id: "c", startsAt: "2026-11-20T15:00:00.000Z" }), // Nov 20
    ];
    expect(byDay(list).map((d) => [d.day, d.events.map((e) => e.id)])).toEqual([["2026-11-19", ["b", "a"]], ["2026-11-20", ["c"]]]);
  });

  it("filters by tag, Free matching the price too, and knows a past event", () => {
    expect(hasTag(ev({ tags: ["AI"] }), "ai")).toBe(true);
    expect(hasTag(ev({ price: "Free" }), "Free")).toBe(true);
    expect(hasTag(ev({ tags: ["Founders"] }), "AI")).toBe(false);
    const now = new Date("2026-11-20T10:00:00Z");
    expect(isPast(ev({ startsAt: "2026-11-20T01:00:00Z" }), now)).toBe(true);
    expect(isPast(ev({ startsAt: "2026-11-20T01:00:00Z", endsAt: "2026-11-20T11:00:00Z" }), now)).toBe(false);
  });

  it("puts a going event on the calendar on its Austin day and time, read-only", () => {
    expect(toCalEvent(ev({ id: "e9", title: "Demo night", startsAt: "2026-11-20T00:30:00.000Z", endsAt: "2026-11-20T03:00:00.000Z", venue: "Capital Factory" }))).toMatchObject({
      id: "event:e9", title: "Demo night", day: "2026-11-19", starts: "18:30", ends: "21:00", note: "Capital Factory", feed: { id: "events", name: "Events" },
    });
    expect(toCalEvent(ev({ startsAt: null }))).toBeNull();
  });
});

describe("Eddy's feed", () => {
  it("follows hasMore page by page and keeps what fromEddy keeps", async () => {
    const pages = [
      { events: [{ id: "1", title: "One", startDate: "2026-11-20T00:00:00Z" }, { id: "2", title: "Online", startDate: "2026-11-20T00:00:00Z", isOnline: true }], hasMore: true },
      { events: [{ id: "3", title: "Three", startDate: "2026-11-21T00:00:00Z" }], hasMore: false },
    ];
    const urls: string[] = [];
    const fake = async (url: string) => { urls.push(url); return new Response(JSON.stringify(pages[urls.length - 1])); };
    const got = await fetchEddy(fake);
    expect(got.map((e) => e.sourceId)).toEqual(["1", "3"]);
    expect(urls).toEqual(["https://eddyhdzg.com/api/rest/v1/events?limit=200&offset=0", "https://eddyhdzg.com/api/rest/v1/events?limit=200&offset=2"]);
  });

  it("fails when the feed answers with an error", async () => {
    await expect(fetchEddy(async () => new Response("down", { status: 503 }))).rejects.toThrow("503");
  });
});
