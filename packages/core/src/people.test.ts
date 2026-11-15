import { describe, expect, it } from "vitest";
import { feedForms, feedHosts, hostsQuery, namedShows, personQuery, readHosts, readPerson } from "./people";

const sparql = (bindings: Record<string, string>[]) => JSON.stringify({ results: { bindings: bindings.map((b) => Object.fromEntries(Object.entries(b).map(([k, v]) => [k, { value: v }]))) } });

describe("people", () => {
  it("writes a feed every way Wikidata may hold it", () => {
    expect(feedForms("https://lexfridman.com/feed/podcast/")).toEqual([
      "https://lexfridman.com/feed/podcast", "https://lexfridman.com/feed/podcast/", "http://lexfridman.com/feed/podcast", "http://lexfridman.com/feed/podcast/",
    ]);
  });

  it("asks for hosts by Apple id and feed, and nothing without either", () => {
    const q = hostsQuery({ apple: "1502871393", feed: "https://a.example/feed" })!;
    expect(q).toContain('wdt:P5842 "1502871393"');
    expect(q).toContain("wdt:P1019");
    expect(q).toContain("wdt:P371");
    expect(hostsQuery({ apple: "x\" }", feed: null })).toBeNull();
    expect(hostsQuery({})).toBeNull();
  });

  it("reads hosts, dropping unlabelled ones and repeats", () => {
    const hosts = readHosts(sparql([
      { host: "http://www.wikidata.org/entity/Q1", hostLabel: "Chamath Palihapitiya", article: "https://en.wikipedia.org/wiki/Chamath_Palihapitiya" },
      { host: "http://www.wikidata.org/entity/Q1", hostLabel: "Chamath Palihapitiya" },
      { host: "http://www.wikidata.org/entity/Q2", hostLabel: "Q2" },
      { host: "http://www.wikidata.org/entity/Q3", hostLabel: "David Sacks" },
    ]));
    expect(hosts).toEqual([{ name: "Chamath Palihapitiya", qid: "Q1", wiki: "https://en.wikipedia.org/wiki/Chamath_Palihapitiya" }, { name: "David Sacks", qid: "Q3" }]);
    expect(readHosts("not json")).toEqual([]);
  });

  it("takes a show's hosts from its feed, else an author who is a person", () => {
    const base = { episodes: [] };
    expect(feedHosts({ ...base, author: "Big Media", people: [{ name: "Ann Lee", role: "host" }, { name: "Bob Ray", role: "guest" }] } as never)).toEqual([{ name: "Ann Lee" }]);
    expect(feedHosts({ ...base, author: "Lex Fridman", people: [] } as never)).toEqual([{ name: "Lex Fridman" }]);
    expect(feedHosts({ ...base, author: "The Daily Wire", people: [] } as never)).toEqual([]);
    expect(feedHosts({ ...base, author: "Vox Media Podcast Network", people: [] } as never)).toEqual([]);
  });

  it("asks only for a real Wikidata id", () => {
    expect(personQuery("Q4886439")).toContain("wd:Q4886439");
    expect(personQuery("Q1 }")).toBeNull();
  });

  it("reads a person's accounts, X first, and the shows they host", () => {
    const { links, shows } = readPerson(sparql([
      { kind: "site", v: "https://www.benshapiro.com/" },
      { kind: "instagram", v: "benshapiro" },
      { kind: "x", v: "benshapiro" },
      { kind: "x", v: "otherhandle" },
      { kind: "youtube", v: "not-a-channel" },
      { kind: "show", show: "http://www.wikidata.org/entity/Q9", showLabel: "The Ben Shapiro Show", apple: "1047335260" },
      { kind: "show", show: "http://www.wikidata.org/entity/Q9", showLabel: "The Ben Shapiro Show", feed: "https://feeds.megaphone.fm/WWO8086402096" },
    ]));
    expect(links.map((l) => l.kind)).toEqual(["x", "instagram", "site"]);
    expect(links[0]).toEqual({ kind: "x", label: "@benshapiro", href: "https://x.com/benshapiro" });
    expect(links[2]!.label).toBe("benshapiro.com");
    expect(shows).toEqual([{ title: "The Ben Shapiro Show", apple: "1047335260", feed: "https://feeds.megaphone.fm/WWO8086402096" }]);
  });

  it("keeps Apple's shows whose title carries the name", () => {
    const text = JSON.stringify({ results: [
      { collectionId: 1047335260, collectionName: "The Ben Shapiro Show", artistName: "The Daily Wire", feedUrl: "https://f.example/feed", artworkUrl600: "https://i.example/a.jpg" },
      { collectionId: 2, collectionName: "Daily Politics" },
      { collectionId: 3, collectionName: "If Ben Shapiro Were a Democrat", artistName: "IBSWAD" },
      { collectionId: 4, collectionName: "Ben Shapiro - Biography Flash", artistName: "Liquid Studios" },
    ] });
    expect(namedShows(text, "Ben Shapiro")).toEqual([{ title: "The Ben Shapiro Show", apple: "1047335260", feed: "https://f.example/feed", image: "https://i.example/a.jpg", by: "The Daily Wire" }]);
    expect(namedShows(JSON.stringify({ results: [{ collectionId: 5, collectionName: "Titans on Tomorrow with Ben Shapiro" }] }), "Ben Shapiro").map((x) => x.title)).toEqual(["Titans on Tomorrow with Ben Shapiro"]);
    expect(namedShows("bad", "x")).toEqual([]);
  });
});
