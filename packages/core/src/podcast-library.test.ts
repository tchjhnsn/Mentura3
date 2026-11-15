import { describe, expect, it } from "vitest";
import { heardIn, newEpisodes, type KeptShow } from "./podcast-library";
import type { Episode } from "./podcasts";

const ep = (key: string, date: string | null, seconds: number | null, extra: Partial<Episode> = {}) => ({ key, title: `Ep ${key}`, date, seconds, audio: "", about: null, ...extra }) as Episode;
const shows: KeptShow[] = [
  { item: "a", title: "Show A", image: "a.jpg", episodes: [ep("a3", "2026-11-14", 3600), ep("a2", "2026-11-10", 1800), ep("a1", "2026-10-01", 1200)], units: [{ unit: "a2", place: 600, doneOn: null }, { unit: "a1", place: null, doneOn: "2026-10-02" }] },
  { item: "b", title: "Show B", image: null, episodes: [ep("b2", "2026-11-12", null, { type: "trailer" }), ep("b1", "2026-11-11", 2400, { image: "b1.jpg" })], units: [{ unit: "b0", place: 900, doneOn: "2025-12-30" }, { unit: "b1", place: 2400, doneOn: "2026-11-12" }] },
];

describe("a person's shows", () => {
  it("lists new episodes not yet begun, newest first, without trailers", () => {
    expect(newEpisodes(shows, "2026-11-01").map((e) => [e.key, e.image])).toEqual([["a3", "a.jpg"]]);
    expect(newEpisodes(shows, "2026-09-01").map((e) => e.key)).toEqual(["a3"]);
  });
  it("adds up a year's episodes heard to the end, by the feed's length or the place kept", () => {
    expect(heardIn(2026, shows)).toEqual({ episodes: 2, seconds: 3600, shows: [{ item: "b", title: "Show B", episodes: 1, seconds: 2400 }, { item: "a", title: "Show A", episodes: 1, seconds: 1200 }] });
    expect(heardIn(2025, shows).seconds).toBe(900);
  });
});
