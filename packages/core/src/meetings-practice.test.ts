import { describe, expect, it } from "vitest";
import { afterAnswer, newRound, practiceOrder, practiceQueue, readRound, roundParams } from "./meetings-practice";

const q = (id: string, rehearsed = false) => ({ id, question: `Q ${id}`, answer: `A ${id}`, rehearsed });
const ids = (xs: { id: string }[]) => xs.map((x) => x.id);

describe("practice order", () => {
  it("puts unrehearsed questions first, each group in the host's order", () => {
    expect(ids(practiceOrder([q("a", true), q("b"), q("c", true), q("d")]))).toEqual(["b", "d", "a", "c"]);
  });

  it("leaves an empty list empty", () => {
    expect(practiceOrder([])).toEqual([]);
  });
});

describe("a practice round", () => {
  const qs = [q("a", true), q("b"), q("c")];

  it("starts with every question, unrehearsed first", () => {
    expect(ids(practiceQueue(qs, newRound()))).toEqual(["b", "c", "a"]);
  });

  it("drops a question answered Rehearsed and sends one answered Again to the back", () => {
    let r = afterAnswer(newRound(), "b", "again");
    expect(ids(practiceQueue(qs, r))).toEqual(["c", "a", "b"]);
    r = afterAnswer(r, "c", "rehearsed");
    expect(ids(practiceQueue(qs, r))).toEqual(["a", "b"]);
    r = afterAnswer(r, "a", "rehearsed");
    expect(ids(practiceQueue(qs, r))).toEqual(["b"]);
    r = afterAnswer(r, "b", "again");
    expect(ids(practiceQueue(qs, r))).toEqual(["b"]);
    r = afterAnswer(r, "b", "rehearsed");
    expect(practiceQueue(qs, r)).toEqual([]);
  });

  it("keeps several Again answers oldest first", () => {
    const r = afterAnswer(afterAnswer(newRound(), "b", "again"), "c", "again");
    expect(ids(practiceQueue(qs, r))).toEqual(["a", "b", "c"]);
  });

  it("ignores ids of questions since removed", () => {
    expect(ids(practiceQueue(qs, { seen: ["zz"], again: ["zz"] }))).toEqual(["b", "c", "a"]);
  });

  it("reads a round back from the address", () => {
    const r = afterAnswer(afterAnswer(newRound(), "b", "again"), "c", "rehearsed");
    const p = roundParams(r);
    expect(readRound(p.seen, p.again)).toEqual(r);
    expect(readRound("a,,<x>,b", null)).toEqual({ seen: ["a", "b"], again: [] });
  });
});
