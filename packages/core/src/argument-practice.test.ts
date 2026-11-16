import { describe, expect, test } from "vitest";
import { readFileSync } from "node:fs";
import {
  ACTS, RELATIONS, SCHEMES, STASES, CQ_ANSWERS, accepted, accuracy, calibration, choicesFor, combine, cqKey, cqText, drawSession, isAgreed, isSplit,
  issueKey, itemId, itemsFor, krippendorffAlpha, parseCq, parseTurns, placeOf, unitKey, unitsOf, type Answer, type Settled,
} from "./argument-practice.ts";
import { DIALOGUES, DRAFTS, ISSUES } from "./practice-settled.ts";

const text = (id: string) => readFileSync(new URL(`../../../web/src/data/dialogues/${id}.txt`, import.meta.url), "utf8");
const e = parseTurns(text("euthyphro"));
const units = unitsOf(e);
const at = (place: string) => units.find((x) => placeOf(x) === place)!;

/** The drafts as settled answers, the way the server reads them. */
function settledFromDrafts(): Settled[] {
  return DRAFTS.flatMap((d) => {
    const answer = d.kind === "target" && d.answer !== "none" ? unitKey("euthyphro", at(d.answer)) : d.answer;
    const [place, rest] = d.at.split("~") as [string, string | undefined];
    const c = rest ? parseCq(`x~${rest}`)! : null;
    const key = d.kind === "stasis" ? issueKey("euthyphro", d.at) : c ? cqKey(unitKey("euthyphro", at(place)), c.scheme, c.i) : unitKey("euthyphro", at(place));
    return [{ key, kind: d.kind, answer, ...(d.also ? { also: d.also } : {}), by: "test" }];
  });
}

describe("turns and units", () => {
  test("each dialogue cuts into turns by speaker", () => {
    expect(e[0]!.speaker).toBe("EUTHYPHRO");
    expect(e[39]!.text).toBe("And what is piety, and what is impiety?");
    expect(new Set(e.map((t) => t.speaker))).toEqual(new Set(["EUTHYPHRO", "SOCRATES"]));
    for (const d of DIALOGUES) expect(parseTurns(text(d.id)).length).toBeGreaterThan(200);
  });
  test("a turn that does several things is cut into sentences", () => {
    expect(at("8.0").text).toBe("No, I do not remember him, Socrates.");
    expect(at("8.1").text).toBe("But what is the charge which he brings against you?");
    expect(units.filter((x) => x.n === 32).length).toBe(11);
  });
  test("a unit's key changes when its text does", () => {
    const x = { n: 3, u: 0, speaker: "SOCRATES", text: "Yes." };
    expect(unitKey("euthyphro", x)).toMatch(/^euthyphro#3\.0\./);
    expect(unitKey("euthyphro", x)).not.toBe(unitKey("euthyphro", { ...x, text: "No." }));
  });
});

describe("drafts", () => {
  test("every draft points at a unit or issue that exists, with an answer the question offers", () => {
    const ids = { act: ACTS, relation: RELATIONS, stasis: STASES, scheme: SCHEMES, cq: CQ_ANSWERS } as const;
    for (const d of DRAFTS) {
      if (d.kind === "stasis") expect(ISSUES.euthyphro.map((i) => i.id), d.at).toContain(d.at);
      else expect(at(d.at.split("~")[0]!), d.at).toBeDefined();
      if (d.kind === "target") { if (d.answer !== "none") expect(at(d.answer), `${d.at} -> ${d.answer}`).toBeDefined(); }
      else for (const a of [d.answer, ...(d.also ?? [])]) expect(ids[d.kind].map((c) => c.id), `${d.at} ${d.kind}`).toContain(a);
      if (d.kind === "cq") expect(cqText(`x~${d.at.split("~")[1]}`), d.at).toBeTruthy();
    }
  });
  test("each relation and target draft follows from a drafted act, as the questions open", () => {
    for (const d of DRAFTS.filter((x) => x.kind === "relation" || x.kind === "target")) expect(DRAFTS.some((x) => x.kind === "act" && x.at === d.at), d.at).toBe(true);
  });
});

describe("choices", () => {
  test("a target question offers every other unit, nearest first, and none", () => {
    const i = units.indexOf(at("40.2"));
    const c = choicesFor("target", { units, at: i, work: "euthyphro" });
    expect(c).toHaveLength(units.length);
    expect(c[0]!.id).toBe(unitKey("euthyphro", at("40.1")));
    expect(c[1]!.id).toBe(unitKey("euthyphro", at("40.3")));
    expect(c.at(-1)!.id).toBe("none");
  });
  test("a critical question is read from its key", () => {
    const k = cqKey("euthyphro#40.2.abcde", "analogy", 0);
    expect(parseCq(k)).toEqual({ unit: "euthyphro#40.2.abcde", scheme: "analogy", i: 0 });
    expect(cqText(k)).toBe("Do the two cases differ in a way that weakens the comparison?");
  });
});

describe("combining answers", () => {
  const item = { key: "k1", kind: "act" as const };
  const ids = ACTS.map((m) => m.id);
  const settled: Settled[] = [{ key: "g1", kind: "act", answer: "asserting", by: "t" }, { key: "g2", kind: "act", answer: "rhetorical-questioning", also: ["agreeing"], by: "t" }];
  test("accuracy comes from settled items, with a prior, and a split item accepts either reading", () => {
    const a: Answer[] = [{ user: "u", key: "g1", kind: "act", answer: "asserting" }, { user: "u", key: "g2", kind: "act", answer: "agreeing" }, { user: "w", key: "g1", kind: "act", answer: "agreeing" }];
    const acc = accuracy(a, settled);
    expect(acc.get("u|act")).toBeCloseTo(4 / 5);
    expect(acc.get("w|act")).toBeCloseTo(2 / 4);
    expect(accepted(settled[1]!)).toEqual(["rhetorical-questioning", "agreeing"]);
  });
  test("calibration counts right answers at each level of sureness", () => {
    const a: Answer[] = [{ user: "u", key: "g1", kind: "act", answer: "asserting", confidence: 3 }, { user: "u", key: "g2", kind: "act", answer: "none", confidence: 3 }, { user: "u", key: "g1", kind: "act", answer: "asserting", confidence: 1 }];
    expect(calibration(a, settled, "u")).toEqual([{ confidence: 1, n: 1, right: 1 }, { confidence: 2, n: 0, right: 0 }, { confidence: 3, n: 2, right: 1 }]);
  });
  test("five agreeing people make an item agreed; not sure counts for nothing", () => {
    const a: Answer[] = ["a", "b", "c", "d", "e"].map((user) => ({ user, key: "k1", kind: "act", answer: "disagreeing" }));
    const c = combine(item, [...a, { user: "f", key: "k1", kind: "act", answer: "unsure" }], new Map(), ids);
    expect(c!.answer).toBe("disagreeing");
    expect(c!.n).toBe(5);
    expect(isAgreed(c)).toBe(true);
    expect(isAgreed(combine(item, a.slice(0, 3), new Map(), ids))).toBe(false);
  });
  test("an item where readers divide is split, not forced", () => {
    const a: Answer[] = ["a", "b", "c"].map((user) => ({ user, key: "k1", kind: "act" as const, answer: "asserting" })).concat(["d", "e"].map((user) => ({ user, key: "k1", kind: "act" as const, answer: "none" })));
    expect(isSplit(combine(item, a, new Map(), ids))).toBe(true);
    expect(isSplit(combine(item, a.slice(0, 4), new Map(), ids))).toBe(false);
  });
  test("an accurate person outweighs two at chance", () => {
    const a: Answer[] = [{ user: "good", key: "k1", kind: "act", answer: "asserting" }, { user: "x", key: "k1", kind: "act", answer: "agreeing" }, { user: "y", key: "k1", kind: "act", answer: "agreeing" }];
    const acc = new Map([["good|act", 0.95], ["x|act", 0.15], ["y|act", 0.15]]);
    expect(combine(item, a, acc, ids)!.answer).toBe("asserting");
  });
  test("alpha is 1 when everyone agrees and lower when they split", () => {
    const same: Answer[] = ["a", "b"].flatMap((user) => [{ user, key: "1", kind: "act" as const, answer: "asserting" }, { user, key: "2", kind: "act" as const, answer: "agreeing" }]);
    expect(krippendorffAlpha(same)).toBe(1);
    const split: Answer[] = [{ user: "a", key: "1", kind: "act", answer: "asserting" }, { user: "b", key: "1", kind: "act", answer: "agreeing" }, { user: "a", key: "2", kind: "act", answer: "agreeing" }, { user: "b", key: "2", kind: "act", answer: "asserting" }];
    expect(krippendorffAlpha(split)!).toBeLessThan(0.1);
  });
});

describe("sessions", () => {
  const settled = settledFromDrafts();
  const items = itemsFor("euthyphro", units, ISSUES.euthyphro, [], settled, new Map());
  test("ten items, three settled, none answered before, the first settled on a first session", () => {
    const s = drawSession({ items, settled, answers: [], user: "u", seed: 7, firstSettled: true });
    expect(s).toHaveLength(10);
    expect(s.filter((i) => i.settled)).toHaveLength(3);
    expect(s[0]!.settled).toBe(true);
    const done: Answer[] = s.map((i) => ({ user: "u", key: i.key, kind: i.kind, answer: "asserting" }));
    const next = drawSession({ items, settled, answers: done, user: "u", seed: 8 });
    expect(next.some((i) => s.some((j) => itemId(j) === itemId(i)))).toBe(false);
  });
  test("relation, target, scheme and critical questions open as earlier answers settle; stasis is asked of issues", () => {
    const k = unitKey("euthyphro", at("40.2"));
    expect(items.some((i) => i.kind === "relation" && i.key === k)).toBe(true);
    expect(items.some((i) => i.kind === "target" && i.key === k)).toBe(true);
    expect(items.some((i) => i.kind === "scheme" && i.key === k)).toBe(true);
    expect(items.filter((i) => i.kind === "cq" && i.key.startsWith(`${k}~analogy.`))).toHaveLength(3);
    expect(items.some((i) => i.kind === "relation" && i.key === unitKey("euthyphro", at("39.0")))).toBe(false);
    expect(items.some((i) => i.kind === "target" && i.key === unitKey("euthyphro", at("38.0")))).toBe(true);
    expect(items.filter((i) => i.kind === "stasis")).toHaveLength(ISSUES.euthyphro.length);
  });
});
