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

describe("course cards", () => {
  it("shows a drafted course opening its course page", () => {
    const spec = buildSpec([{ kind: "course", title: "Socrates", goal: "Read the Apology closely.", units: "2 units, 3 passages", href: "/schole/courses/made/11111111-2222-4333-8444-555555555555" }])!;
    expect(spec.elements.e0).toEqual({ type: "Course", props: { title: "Socrates", goal: "Read the Apology closely.", units: "2 units, 3 passages", href: "/schole/courses/made/11111111-2222-4333-8444-555555555555" } });
  });
});

describe("budget cards", () => {
  it("shows tiles with an allotment or a cost as bars against the largest figure, marking those over", async () => {
    const { buildPlan } = await import("@reflect/core/plan");
    const { budgetView } = await import("@reflect/core/budget");
    const plan = buildPlan({ needs: [{ key: "shelter", cost: 1000, by: "market" }], income: 48_000 }, []);
    const spec = buildSpec([{ kind: "budget", view: budgetView(plan, { shelter: 800, friends: 50 }), href: "/plan" }])!;
    const props = spec.elements.e0!.props as { title: string; sub: string; href: string; rows: { label: string; allot: string; cost: string; allotShare: number; costShare: number | null; over: boolean }[] };
    expect(spec.elements.e0!.type).toBe("Budget");
    expect(props.title).toBe("Budget: $850 a month allotted");
    expect(props.sub).toMatch(/^Of \$[\d,]+ a month after taxes; \$[\d,]+ left to allot\.$/);
    expect(props.rows.map((r) => r.label)).toEqual(["Shelter", "Food", "Friends"]);
    expect(props.rows[0]).toMatchObject({ allot: "$800", cost: "$1,000 in the plan", allotShare: 0.8, costShare: 1, over: true });
    expect(props.rows[1]).toMatchObject({ allot: "Not allotted", allotShare: 0, over: false });
    expect(props.rows[2]).toMatchObject({ cost: "no cost in the plan", costShare: null });
  });

  it("shows a held change with the one tap its tier asks for: Keep for shared, Send for outside", async () => {
    const { catalog } = await import("./catalog");
    const change = "00000000-0000-4000-8000-000000000001";
    const spec = buildSpec([
      { kind: "approval", change, title: "Keep the person's legacy release plan", preview: "Trustees: Ann.", tier: "outside" },
      { kind: "approval", change, title: "Add to the household list", preview: "item: milk", tier: "shared" },
    ])!;
    expect(spec.elements.e0).toMatchObject({ type: "Approval", props: { change, title: "Keep your legacy release plan", preview: "Trustees: Ann.", tap: "Send" } });
    expect(spec.elements.e1!.props).toMatchObject({ tap: "Keep" });
    expect(catalog.data.components.Approval.props.safeParse(spec.elements.e0!.props).success).toBe(true);
  });
});
