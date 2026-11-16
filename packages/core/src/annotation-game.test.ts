import { describe, expect, test } from "vitest";
import { drawPassages, knownOf, passagesOf, pointsOf, scorePassage, type Known } from "./annotation-game.ts";
import { parseTurns, unitKey, unitsOf, type Answer, type Kind } from "./argument-practice.ts";

const units = unitsOf(parseTurns("AA: One. Two.\nBB: Three.\nAA: Four. Five. Six.\nBB: Seven.\nAA: Eight."));

describe("annotation game", () => {
  test("passages are whole turns of at least the size asked", () => {
    expect(passagesOf(units, 3)).toEqual([{ start: 0, end: 3 }, { start: 3, end: 6 }, { start: 6, end: 8 }]);
  });
  test("a settled answer is known; readers who agree make one known; readers who split make two", () => {
    const settled = [{ key: "k", kind: "act" as Kind, answer: "asserting", also: ["agreeing"], by: "t" }];
    expect(knownOf("k", "act", settled, [], new Map(), ["asserting", "agreeing"])).toEqual({ answers: ["asserting", "agreeing"], split: true, from: "settled" });
    const agree: Answer[] = ["a", "b", "c", "d", "e"].map((user) => ({ user, key: "j", kind: "act", answer: "challenging" }));
    expect(knownOf("j", "act", [], agree, new Map(), ["challenging", "asserting"])?.answers).toEqual(["challenging"]);
    expect(knownOf("j", "act", [], agree.slice(0, 2), new Map(), ["challenging", "asserting"])).toBeNull();
  });
  test("each mark is a match, a miss, missed or new; links are checked too", () => {
    const k: Record<string, Known> = { "a|act": { answers: ["asserting"], split: false, from: "settled" }, "b|act": { answers: ["agreeing"], split: false, from: "settled" }, "c|act": { answers: ["challenging"], split: false, from: "settled" }, "a|relation": { answers: ["supports"], split: false, from: "settled" }, "a|target": { answers: ["c"], split: false, from: "settled" } };
    const s = scorePassage([{ key: "a", act: "asserting", link: { rel: "supports", to: "c" } }, { key: "b", act: "asserting" }, { key: "d", act: "agreeing" }], ["a", "b", "c", "d"], (key, kind) => k[`${key}|${kind}`] ?? null);
    expect(s.units.map((u) => u.act)).toEqual(["match", "miss", "missed", "new"]);
    expect(s.units[0]!.link).toMatchObject({ relation: "match", target: "match" });
    expect(s).toMatchObject({ right: 3, checked: 5, added: 1 });
    expect(pointsOf(s)).toBe(32);
  });
  test("rounds go to passages with known items first and skip what the person has marked", () => {
    const ps = passagesOf(units, 3);
    const known = unitKey("w", units[6]!);
    const got = drawPassages({ work: "w", units, passages: ps, isKnown: (key) => key === known, mine: new Set(units.slice(0, 3).map((x) => unitKey("w", x))), seed: 3, count: 5 });
    expect(got[0]).toEqual(ps[2]);
    expect(got).not.toContainEqual(ps[0]);
  });
});
