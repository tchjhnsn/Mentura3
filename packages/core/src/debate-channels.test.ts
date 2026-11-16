import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { DEBATE_CHANNELS, newestDebates, readChannelFeed } from "./debate-channels";

const oxford = DEBATE_CHANNELS.find((c) => c.name === "Oxford Union")!;
const xml = readFileSync(new URL("./debate-channels.fixture.xml", import.meta.url), "utf8");

describe("new debates from channel feeds", () => {
  it("keeps only whole debates, as watch links, with where and when", () => {
    const got = readChannelFeed(xml, oxford);
    expect(got.length).toBe(1);
    expect(got[0]!.item.title).toMatch(/Full Debate/);
    expect(got[0]!.item.kind === "find" && got[0]!.item.url).toMatch(/^https:\/\/www\.youtube\.com\/watch\?v=[\w-]{11}$/);
    expect(got[0]!.item.why).toMatch(/^New from Oxford Union, \d+ \w+ 20\d\d\.$/);
  });
  it("leaves out shorts and titles with hashtags", () => {
    const jubilee = DEBATE_CHANNELS[0]!;
    const feed = `<entry><link rel="alternate" href="https://www.youtube.com/shorts/abcdefghijk"/><title>Surrounded clip</title><published>2026-11-15T00:00:00+00:00</published></entry>
<entry><link rel="alternate" href="https://www.youtube.com/watch?v=abcdefghijk"/><title>Surrounded #debate</title><published>2026-11-15T00:00:00+00:00</published></entry>
<entry><link rel="alternate" href="https://www.youtube.com/watch?v=2c81cbv0SKk"/><title>1 Boss vs 20 Workers | Surrounded</title><published>2026-11-15T00:00:00+00:00</published></entry>`;
    expect(readChannelFeed(feed, jubilee).map((x) => x.item.title)).toEqual(["1 Boss vs 20 Workers | Surrounded"]);
    expect(readChannelFeed(null, jubilee)).toEqual([]);
  });
  it("takes the newest within the window, at most three a channel", () => {
    const f = (t: string, d: string) => ({ item: { kind: "find" as const, medium: "debate" as const, title: t, by: "x" }, published: d });
    const a = [f("a1", "2026-11-15"), f("a2", "2026-11-14"), f("a3", "2026-11-13"), f("a4", "2026-11-12")];
    const b = [f("b1", "2026-11-16"), f("old", "2026-08-01")];
    expect(newestDebates([a, b], new Date("2026-11-16")).map((i) => i.title)).toEqual(["b1", "a1", "a2", "a3"]);
  });
});
