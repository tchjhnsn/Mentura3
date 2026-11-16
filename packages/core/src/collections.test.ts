import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { COLLECTIONS, collectionById, itemHref, itemKey, kindOf, nextInCollection, servedAim, suggestCollections } from "./collections.ts";

describe("collections", () => {
  it("names who chose each one, with unique ids and things that play here", () => {
    expect(new Set(COLLECTIONS.map((c) => c.id)).size).toBe(COLLECTIONS.length);
    for (const c of COLLECTIONS) {
      expect(c.by).toBeTruthy();
      expect(c.items.length).toBeGreaterThan(1);
    }
    expect(collectionById("greeks")?.name).toBe("Start with the Greeks");
  });

  it("points every recording at a line of the audiobook catalog", () => {
    const ids = new Set(readFileSync(new URL("../../../web/src/data/audiobooks.txt", import.meta.url), "utf8").split("\n").map((l) => l.split("|")[0]));
    for (const c of COLLECTIONS) for (const i of c.items) if (i.kind === "audiobook") expect(ids.has(i.id), `${c.id}: ${i.title}`).toBe(true);
  });

  it("mixes media, and gives a reason for each item in the mixed collections", () => {
    for (const id of ["greeks", "stoics", "founding"]) {
      const c = collectionById(id)!;
      expect(new Set(c.items.map((i) => i.kind)).size, id).toBeGreaterThanOrEqual(3);
      for (const i of c.items) expect(i.why, `${id}: ${i.title}`).toBeTruthy();
    }
  });

  it("opens episodes and finds where Scholē plays them", () => {
    const greeks = collectionById("greeks")!;
    const ep = greeks.items.find((i) => i.kind === "episode")!;
    expect(itemHref(ep)).toMatch(/^\/schole\/podcasts\/episode\?u=https%3A%2F%2Fpodcasts\.files\.bbci\.co\.uk%2Fb006qykl\.rss&k=\w+&t=In%20Our%20Time&i=/);
    const art = greeks.items.find((i) => i.kind === "find" && i.medium === "art")!;
    expect(itemHref(art)).toMatch(/^\/schole\/find\?m=art&t=Amphora.*&u=https%3A%2F%2Fwww\.artic\.edu%2Fartworks%2F166.*&h=1$/);
    expect(kindOf(art)).toBe("Art");
    expect(itemKey(art)).toBe("art|amphora (storage jar)");
    expect(kindOf(ep)).toBe("Podcast episode");
  });

  it("opens each item on its Scholē page", () => {
    expect(itemHref({ kind: "audiobook", id: "65", title: "Odyssey", by: "Homer" })).toBe("/schole/audiobooks/65");
    expect(itemHref({ kind: "course", url: "https://oyc.yale.edu/x", title: "X", by: "Y" })).toBe("/schole/courses?u=https%3A%2F%2Foyc.yale.edu%2Fx");
  });

  it("suggests the collections serving an aim first, saying why", () => {
    const s = suggestCollections(["Elementary School Teachers"]);
    expect(s[0]!.collection.id).toBe("teaching");
    expect(s[0]!.reason).toBe("For Elementary School Teachers, from your Work");
    expect(s.find((x) => x.collection.id === "greeks")!.reason).toBeNull();
    expect(servedAim(collectionById("care")!, ["Registered Nurses"])).toBe("Registered Nurses");
    expect(servedAim(collectionById("greeks")!, ["Registered Nurses"])).toBeNull();
  });

  it("puts the collections for anyone before those for aims the person does not hold", () => {
    const ids = suggestCollections([]).map((x) => x.collection.id);
    expect(ids.indexOf("greeks")).toBeLessThan(ids.indexOf("teaching"));
    expect(ids.indexOf("stoics")).toBeLessThan(ids.indexOf("care"));
  });

  it("finds the next item not yet begun", () => {
    const c = collectionById("stoics")!;
    expect(nextInCollection(c, new Set())?.title).toBe("Meditations");
    expect(nextInCollection(c, new Set([itemKey(c.items[0]!)]))?.title).toBe(c.items[1]!.title);
    expect(nextInCollection(c, new Set(c.items.map(itemKey)))).toBeNull();
  });
});
