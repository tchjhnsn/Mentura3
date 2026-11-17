import { describe, expect, it } from "vitest";
import { buildSpec } from "./spec";

describe("chat cards", () => {
  it("shows nothing when there is nothing to show", () => {
    expect(buildSpec([])).toBeNull();
  });

  it("builds library cards that carry their catalog entry for Add, and marks kept books", () => {
    const spec = buildSpec([{ kind: "library", label: '"wiring"', kept: new Set(["OL2W"]), books: [
      { work: "OL1W", title: "Wiring", authors: ["A. Writer"], subjects: [], contents: [], lcc: ["TK-1362"] },
      { work: "OL2W", title: "Kept", authors: [], subjects: [], contents: [] },
    ] }])!;
    expect(spec.root).toBe("root");
    expect(spec.elements.root!.children).toEqual(["e0", "e1"]);
    const a = spec.elements.e0!;
    expect(a.props).toMatchObject({ title: "Wiring", by: "A. Writer", shelf: "Electronics", onShelves: false, entry: expect.stringContaining('"work":"OL1W"') });
    expect(spec.elements.e1!.props).toMatchObject({ by: "unknown author", shelf: "not yet placed", onShelves: true });
  });

  it("proposes a claim the person accepts, and says plainly when a list is empty", () => {
    const spec = buildSpec([
      { kind: "propose_claim", text: "Virtue is a mean", stance: "belief", holders: [{ name: "Aristotle", citation: "NE II.6" }] },
      { kind: "claims", claims: [] },
      { kind: "shelves", shelves: [] },
    ])!;
    expect(spec.elements.e0!.props).toMatchObject({ text: "Virtue is a mean", holders: "Aristotle (NE II.6)", subject: null });
    expect(JSON.parse(String((spec.elements.e0!.props as { claim: string }).claim))).toEqual({ text: "Virtue is a mean", holders: [{ name: "Aristotle", citation: "NE II.6" }], stance: "belief" });
    expect(spec.elements.e1).toMatchObject({ type: "Note", props: { text: "You keep no claims yet." } });
    expect(spec.elements.e2!.type).toBe("Note");
  });

  it("shows a quote with its citation and the reader at its place", () => {
    const spec = buildSpec([{ kind: "quote", text: "The unexamined life", cite: "Plato, Apology, Part 1", href: "/schole/works/OL1W/read?c=1&find=x&p=2" }])!;
    expect(spec.elements.e0).toMatchObject({ type: "Quote", props: { cite: "Plato, Apology, Part 1", href: "/schole/works/OL1W/read?c=1&find=x&p=2" } });
  });
});

describe("calendar cards", () => {
  it("shows a Home card with its tile, lines and last day", () => {
    const spec = buildSpec([{ kind: "home_card", title: "Word of the day", tile: "learn", lines: ["laconic: using few words"], until: "2026-12-16" }])!;
    expect(spec.elements.e0).toEqual({ type: "HomeCard", props: { title: "Word of the day", tile: "learn", lines: ["laconic: using few words"], until: "Until Wednesday, December 16" } });
  });

  it("shows an added event with its day, time, tile and the calendar at its day", () => {
    const spec = buildSpec([{ kind: "event", title: "Dinner with Sam", day: "2026-11-20", when: "19:00–21:00", tile: "Friends", href: "/calendar?day=2026-11-20" }])!;
    expect(spec.elements.e0).toEqual({ type: "CalendarEvent", props: { title: "Dinner with Sam", day: "Friday, November 20", when: "19:00–21:00", tile: "Friends", href: "/calendar?day=2026-11-20" } });
  });

  it("puts Undo under a change the chat made, by its change id", () => {
    const change = "6f1c2c1e-6c1a-4f0e-9a8e-3b2a1d0c9b8a";
    const spec = buildSpec([{ kind: "undo", change, title: "Put an event on the person's calendar" }])!;
    expect(spec.elements.e0).toEqual({ type: "UndoChange", props: { change, text: "Done: put an event on your calendar." } });
  });
});
