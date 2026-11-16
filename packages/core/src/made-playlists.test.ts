import { describe, expect, it } from "vitest";
import type { CollectionItem } from "./collections";
import { madePrompt, readMade, storedItems } from "./made-playlists";

const C: CollectionItem[] = [
  { kind: "audiobook", id: "663", title: "Oresteia", by: "Aeschylus" },
  { kind: "audiobook", id: "4632", title: "Antigone", by: "Sophocles" },
  { kind: "audiobook", id: "2707", title: "Republic", by: "Plato" },
  { kind: "find", medium: "music", title: "Seikilos Epitaph", by: "Anon." },
];

describe("playlists made for you", () => {
  it("numbers only what the topic holds, leaves out what they finished, and says what they work toward", () => {
    const p = madePrompt({ topic: "The Greeks", aims: ["Study law"], ask: "shorter", done: new Set(["audiobook:2707"]) }, C);
    expect(p).toContain("1. [Audiobook] Oresteia, Aeschylus");
    expect(p).toContain("4. [Music] Seikilos Epitaph");
    expect(p).not.toContain("Republic");
    expect(p).toContain("working toward: Study law");
    expect(p).toContain("They asked: shorter");
  });

  it("keeps only numbers on the list, each once, with the reason written", () => {
    const made = readMade('Here: {"name": "Justice, from the Greeks", "items": [{"n": 1, "why": "A court replaces revenge."}, {"n": 1, "why": "again"}, {"n": 9, "why": "invented"}, {"n": "2", "why": "Law against conscience."}, {"n": 4}]}', C);
    expect(made?.name).toBe("Justice, from the Greeks");
    expect(made?.items.map((i) => i.title)).toEqual(["Oresteia", "Antigone", "Seikilos Epitaph"]);
    expect(made?.items[0]!.why).toBe("A court replaces revenge.");
    expect(made?.items[2]!.why).toBeUndefined();
  });

  it("refuses an answer with no name, too few items or no JSON", () => {
    expect(readMade('{"name": "", "items": [{"n": 1}, {"n": 2}, {"n": 3}]}', C)).toBeNull();
    expect(readMade('{"name": "x", "items": [{"n": 1}]}', C)).toBeNull();
    expect(readMade("no", C)).toBeNull();
  });

  it("reads stored items back, dropping malformed ones", () => {
    expect(storedItems([C[0], { kind: "audiobook", id: "x", title: "t", by: "b" }, { kind: "film", title: "t", by: "b" }, null]).length).toBe(1);
    expect(storedItems("nope")).toEqual([]);
  });
});
