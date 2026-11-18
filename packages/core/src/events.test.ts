import { describe, expect, it } from "vitest";
import { austinDay, cleanInterests, dayLabel, fromEddy, isRunning, sharedInterests } from "./events";

describe("events", () => {
  it("reads an event from Eddy's feed", () => {
    const e = fromEddy({ id: "a1", title: "AI Tinkerers", startDate: "2026-11-20T00:00:00.000Z", endDate: "2026-11-20T03:00:00.000Z", isFree: true, venue: { name: "Capital Factory", formattedAddress: "701 Brazos St" }, platforms: [{ url: "https://luma.com/x", price: "0" }], tags: [{ label: "AI" }, { label: "Free" }], shortDescription: "Builders demo." });
    expect(e).toMatchObject({ source: "eddy", sourceId: "a1", venue: "Capital Factory", url: "https://luma.com/x", price: "Free", tags: ["AI", "Free"], city: "austin" });
    expect(fromEddy({ id: "b", title: "Online", startDate: "2026-11-20T00:00:00Z", isOnline: true })).toBeNull();
    expect(fromEddy({ title: "No id" })).toBeNull();
  });
  it("groups by Austin's day", () => {
    expect(austinDay("2026-11-20T03:00:00Z")).toBe("2026-11-19");
    expect(dayLabel("2026-11-20")).toBe("Fri, Nov 20");
  });
  it("cleans and compares interests", () => {
    expect(cleanInterests([" Robotics ", "robotics", "Food  trucks", 3])).toEqual(["robotics", "food trucks"]);
    expect(sharedInterests(["ai", "food"], ["food", "music"])).toEqual(["food"]);
  });
  it("knows when an event is running", () => {
    const e = { startsAt: "2026-11-20T00:00:00Z", endsAt: "2026-11-20T03:00:00Z" };
    expect(isRunning(e, new Date("2026-11-19T23:30:00Z"))).toBe(true);
    expect(isRunning(e, new Date("2026-11-20T04:00:00Z"))).toBe(false);
  });
});
