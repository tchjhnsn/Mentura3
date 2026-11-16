import { describe, expect, test } from "vitest";
import { readFileSync } from "node:fs";
import { MOVES, accuracy, choicesFor, combine, drawSession, isAgreed, itemId, itemsFor, krippendorffAlpha, parseTurns, turnKey, type Answer, type Settled } from "./argument-practice.ts";
import { DIALOGUES, DRAFTS } from "./practice-settled.ts";

const text = (id: string) => readFileSync(new URL(`../../../web/src/data/dialogues/${id}.txt`, import.meta.url), "utf8");

describe("turns", () => {
  test("each dialogue cuts into turns by speaker", () => {
    const e = parseTurns(text("euthyphro"));
    expect(e[0]!.speaker).toBe("EUTHYPHRO");
    expect(e[39]!.text).toBe("And what is piety, and what is impiety?");
    expect(new Set(e.map((t) => t.speaker))).toEqual(new Set(["EUTHYPHRO", "SOCRATES"]));
    for (const d of DIALOGUES) expect(parseTurns(text(d.id)).length).toBeGreaterThan(200);
  });
  test("a turn's key changes when its text does", () => {
    const t = { n: 3, speaker: "SOCRATES", text: "Yes." };
    expect(turnKey("euthyphro", t)).toMatch(/^euthyphro#3\./);
    expect(turnKey("euthyphro", t)).not.toBe(turnKey("euthyphro", { ...t, text: "No." }));
  });
  test("every draft points at a turn that exists, and a target at an earlier one", () => {
    const e = parseTurns(text("euthyphro"));
    for (const d of DRAFTS) {
      expect(e[d.n], `turn ${d.n}`).toBeDefined();
      if (d.kind === "target" && d.answer !== "none") expect(Number(d.answer)).toBeGreaterThanOrEqual(d.n - 3);
      if (d.kind === "move") expect(MOVES.map((m) => m.id)).toContain(d.answer);
    }
  });
  test("a target question offers the three turns before and none", () => {
    const e = parseTurns(text("euthyphro"));
    const c = choicesFor("target", e, 40, "euthyphro");
    expect(c.map((x) => x.id)).toEqual([turnKey("euthyphro", e[39]!), turnKey("euthyphro", e[38]!), turnKey("euthyphro", e[37]!), "none"]);
    expect(c[0]!.label).toBe("Socrates: And what is piety, and what is impiety?");
  });
});

describe("combining answers", () => {
  const item = { key: "k1", kind: "move" as const };
  const ids = MOVES.map((m) => m.id);
  const settled: Settled[] = [{ key: "g1", kind: "move", answer: "claim", by: "t" }, { key: "g2", kind: "move", answer: "question", by: "t" }];
  test("accuracy comes from settled items, with a prior", () => {
    const a: Answer[] = [{ user: "u", key: "g1", kind: "move", answer: "claim" }, { user: "u", key: "g2", kind: "move", answer: "question" }, { user: "w", key: "g1", kind: "move", answer: "grant" }];
    const acc = accuracy(a, settled);
    expect(acc.get("u|move")).toBeCloseTo(4 / 5);
    expect(acc.get("w|move")).toBeCloseTo(2 / 4);
  });
  test("five agreeing people make an item agreed; not sure counts for nothing", () => {
    const a: Answer[] = ["a", "b", "c", "d", "e"].map((user) => ({ user, key: "k1", kind: "move", answer: "rebut" }));
    const c = combine(item, [...a, { user: "f", key: "k1", kind: "move", answer: "unsure" }], new Map(), ids);
    expect(c!.answer).toBe("rebut");
    expect(c!.n).toBe(5);
    expect(isAgreed(c)).toBe(true);
    expect(isAgreed(combine(item, a.slice(0, 3), new Map(), ids))).toBe(false);
  });
  test("an accurate person outweighs two at chance", () => {
    const a: Answer[] = [{ user: "good", key: "k1", kind: "move", answer: "claim" }, { user: "x", key: "k1", kind: "move", answer: "grant" }, { user: "y", key: "k1", kind: "move", answer: "grant" }];
    const acc = new Map([["good|move", 0.95], ["x|move", 0.15], ["y|move", 0.15]]);
    expect(combine(item, a, acc, ids)!.answer).toBe("claim");
  });
  test("alpha is 1 when everyone agrees and lower when they split", () => {
    const same: Answer[] = ["a", "b"].flatMap((user) => [{ user, key: "1", kind: "move" as const, answer: "claim" }, { user, key: "2", kind: "move" as const, answer: "grant" }]);
    expect(krippendorffAlpha(same)).toBe(1);
    const split: Answer[] = [{ user: "a", key: "1", kind: "move", answer: "claim" }, { user: "b", key: "1", kind: "move", answer: "grant" }, { user: "a", key: "2", kind: "move", answer: "grant" }, { user: "b", key: "2", kind: "move", answer: "claim" }];
    expect(krippendorffAlpha(split)!).toBeLessThan(0.1);
  });
});

describe("sessions", () => {
  const e = parseTurns(text("euthyphro"));
  const settled: Settled[] = DRAFTS.filter((d) => d.kind === "move").map((d) => ({ key: turnKey("euthyphro", e[d.n]!), kind: "move", answer: d.answer, by: "test" }));
  test("ten items, three settled, none answered before, the first settled on a first session", () => {
    const items = itemsFor("euthyphro", e, [], settled, new Map());
    const s = drawSession({ items, settled, answers: [], user: "u", seed: 7, firstSettled: true });
    expect(s).toHaveLength(10);
    expect(s.filter((i) => i.settled)).toHaveLength(3);
    expect(s[0]!.settled).toBe(true);
    const done: Answer[] = s.map((i) => ({ user: "u", key: i.key, kind: i.kind, answer: "claim" }));
    const next = drawSession({ items, settled, answers: done, user: "u", seed: 8 });
    expect(next.some((i) => s.some((j) => itemId(j) === itemId(i)))).toBe(false);
  });
  test("target and stasis questions open once a move is settled", () => {
    const items = itemsFor("euthyphro", e, [], settled, new Map());
    expect(items.some((i) => i.kind === "target" && i.key === turnKey("euthyphro", e[80]!))).toBe(true);
    expect(items.some((i) => i.kind === "stasis" && i.key === turnKey("euthyphro", e[39]!))).toBe(true);
    expect(items.some((i) => i.kind === "target" && i.key === turnKey("euthyphro", e[39]!))).toBe(false);
  });
});
