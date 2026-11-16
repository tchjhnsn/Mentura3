import { describe, expect, it } from "vitest";
import { FORMATS, clean, debateState, formatById, formatMinutes, roomPeople, seated } from "./dialectic";

describe("dialectic", () => {
  it("has formats with steps", () => {
    expect(new Set(FORMATS.map((f) => f.id)).size).toBe(FORMATS.length);
    expect(formatMinutes(formatById("two-sides")!)).toBe(6 + 4 + 15 + 3);
  });

  it("cleans text to its bounds", () => {
    expect(clean("  Is it better?  ", 200, 8)).toBe("Is it better?");
    expect(clean("short", 200, 8)).toBeNull();
    expect(clean(3, 200)).toBeNull();
  });

  it("says where a debate stands", () => {
    const now = new Date("2026-11-20T01:00:00Z");
    expect(debateState({ startsAt: "2026-11-21T01:00:00Z", roomOpen: false, roomClosed: false }, now)).toBe("upcoming");
    expect(debateState({ startsAt: "2026-11-19T01:00:00Z", roomOpen: true, roomClosed: false }, now)).toBe("live");
    expect(debateState({ startsAt: "2026-11-19T01:00:00Z", roomOpen: false, roomClosed: false }, now)).toBe("ended");
    expect(debateState({ startsAt: "2026-11-20T00:30:00Z", roomOpen: false, roomClosed: true }, now)).toBe("ended");
  });

  it("seats the first taker of each side, never one person twice", () => {
    expect(seated([{ side: "for", userId: "a", at: "1" }, { side: "for", userId: "b", at: "2" }, { side: "against", userId: "a", at: "3" }, { side: "against", userId: "c", at: "4" }])).toEqual({ for: "a", against: "c" });
  });

  it("works out who is in a room", () => {
    const now = new Date("2026-11-20T01:00:00Z");
    const at = (m: number) => new Date(now.getTime() - m * 60_000).toISOString();
    const p = roomPeople({
      host: "h",
      moves: [{ userId: "h", kind: "join", at: at(30) }, { userId: "a", kind: "join", at: at(20) }, { userId: "b", kind: "join", at: at(20) }, { userId: "c", kind: "join", at: at(20) }, { userId: "c", kind: "leave", at: at(10) }, { userId: "old", kind: "join", at: at(200) }],
      hands: [{ userId: "a", at: at(15) }, { userId: "b", at: at(12) }],
      grants: [{ userId: "a", at: at(5) }],
    }, now);
    expect(p.present.sort()).toEqual(["a", "b", "h"]);
    expect(p.speakers).toEqual(["h", "a"]);
    expect(p.listeners).toEqual(["b"]);
    expect(p.hands).toEqual(["b"]);
  });
});
