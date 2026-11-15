import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { COLLECTIONS, collectionById, itemHref, itemKey, nextInCollection, servedAim, suggestCollections } from "./collections.ts";

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
    expect(nextInCollection(c, new Set([itemKey(c.items[0]!)]))?.title).toBe("Enchiridion");
    expect(nextInCollection(c, new Set(c.items.map(itemKey)))).toBeNull();
  });
});
