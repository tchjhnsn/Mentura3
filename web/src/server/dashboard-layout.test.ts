import { describe, expect, it } from "vitest";
import { EMPTY_LAYOUT, applyChanges, arrange, orderOf, readLayout } from "./dashboard-layout";

const KNOWN = ["approvals", "today", "people", "money", "events", "chats"];
const cards = KNOWN.map((id) => ({ id }));

describe("dashboard layout", () => {
  it("is the default order with nothing set, and new cards come after the person's order", () => {
    expect(orderOf(KNOWN, EMPTY_LAYOUT)).toEqual(KNOWN);
    expect(orderOf(KNOWN, { order: ["money", "gone", "today"], hidden: [], sizes: {} })).toEqual(["money", "today", "approvals", "people", "events", "chats"]);
  });

  it("hides, shows, sizes and moves cards", () => {
    let l = applyChanges(EMPTY_LAYOUT, [{ id: "events", hidden: true }, { id: "money", to: "top" }, { id: "chats", size: "large" }], KNOWN);
    expect(arrange(cards, l).map((c) => c.id)).toEqual(["money", "approvals", "today", "people", "chats"]);
    expect(arrange(cards, l).find((c) => c.id === "chats")?.size).toBe("large");
    expect(arrange(cards, l).find((c) => c.id === "today")?.size).toBe("medium");
    l = applyChanges(l, [{ id: "events", hidden: false, to: { before: "today" } }, { id: "chats", size: null }, { id: "money", to: "bottom" }], KNOWN);
    expect(arrange(cards, l).map((c) => c.id)).toEqual(["approvals", "events", "today", "people", "chats", "money"]);
    expect(l.sizes).toEqual({});
    l = applyChanges(l, [{ id: "people", to: { after: "money" } }, { id: "today", to: 0 }, { id: "chats", to: 99 }], KNOWN);
    expect(l.order).toEqual(["today", "approvals", "events", "money", "people", "chats"]);
  });

  it("refuses a card that does not exist, naming the cards there are", () => {
    expect(() => applyChanges(EMPTY_LAYOUT, [{ id: "vocabulary", hidden: false }], KNOWN)).toThrow(/no dashboard card "vocabulary".*approvals, today/);
    expect(() => applyChanges(EMPTY_LAYOUT, [{ id: "today", to: { before: "nope" } }], KNOWN)).toThrow(/nope/);
  });

  it("reads only a layout from stored JSON", () => {
    expect(readLayout(null)).toEqual(EMPTY_LAYOUT);
    expect(readLayout({ order: ["a", "a", 3, ""], hidden: "x", sizes: { a: "large", b: "huge" } })).toEqual({ order: ["a"], hidden: [], sizes: { a: "large" } });
  });
});
