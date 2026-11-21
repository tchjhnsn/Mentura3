import { mkdtemp, rm, writeFile, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { filesFriendships, friendshipProblems, freshId } from "./files-friendships.ts";
import {
  addQuestion,
  ARISTOTLE,
  checkFriendshipSchemes,
  confirmEvaluation,
  counts,
  crosswalk,
  DEFAULT_CATALOG,
  DEFAULT_QUESTIONS,
  fromFriendRecord,
  hideQuestion,
  moveFriendship,
  newEvaluation,
  newFriendship,
  parseCatalog,
  parseFriendship,
  questionsFor,
  readEvaluation,
  SCHEMES,
  setScheme,
  suggestedBasis,
  TRANSITIONS,
  type FriendshipScheme,
} from "./friendship.ts";
import { categoryOfKind } from "./terms/ontology.ts";
import ontology from "./terms/ontology.json" with { type: "json" };
import { runVaultAction, type VaultContext } from "./vault-actions.ts";

const NOW = new Date("2026-11-21T17:00:00Z");
const dirs: string[] = [];
afterAll(async () => Promise.all(dirs.map((d) => rm(d, { recursive: true, force: true }))));
const tmp = async () => {
  const d = await mkdtemp(join(tmpdir(), "reflect-friendship-"));
  dirs.push(d);
  return d;
};

describe("the schemes", () => {
  it("pass their own check: Aristotle is the base, every other concept maps onto one of his", () => {
    expect(checkFriendshipSchemes()).toEqual([]);
    expect(SCHEMES.map((s) => s.id)).toEqual(["aristotle", "christian", "lewis"]);
    const base = new Set(ARISTOTLE.concepts.map((c) => c.id));
    for (const m of crosswalk()) expect(base.has(m.to)).toBe(true);
  });

  it("refuses a mapping to a concept Aristotle's scheme lacks, a concept with no mapping and a second base", () => {
    const bad: FriendshipScheme[] = [
      ARISTOTLE,
      { id: "lewis", label: "x", source: "x", base: true, concepts: [{ id: "a", label: "a", definition: "a", cite: "c", maps: [{ match: "exactMatch", to: "nowhere" }] }, { id: "b", label: "b", definition: "b", cite: "c" }] },
    ];
    const p = checkFriendshipSchemes(bad, DEFAULT_QUESTIONS);
    expect(p).toContain("Aristotle's scheme is the one base scheme");
    expect(p).toContain("lewis:a maps to nowhere, which is not a concept of Aristotle's");
  });

  it("names the departures: friendship with God, and charity to all", () => {
    const departs = crosswalk().filter((m) => m.departs).map((m) => m.concept);
    expect(departs).toEqual(expect.arrayContaining(["charity", "order-of-charity", "fellowship", "eros"]));
  });

  it("refuses an Aristotle question that cites the Ethics without a Bekker number", () => {
    const q = { ...DEFAULT_QUESTIONS[0]!, cite: "NE VIII.3" };
    expect(checkFriendshipSchemes(SCHEMES, [q])).toContain(`question ${q.id} cites the Ethics without a Bekker number`);
  });
});

describe("the ontology", () => {
  it("files friendship, goodwill and fellowship under relation, and the evaluation as a source", () => {
    const nouns = ontology.nouns as { noun: string; broader: string[]; app: string | null }[];
    for (const n of ["friendship", "goodwill", "fellowship"]) expect(nouns.find((x) => x.noun === n)).toMatchObject({ broader: ["relation"], app: "friends" });
    expect(ontology.sources.records).toContain("friendship evaluation");
    expect(categoryOfKind("friends", "friend")).toBe("substance");
  });
});

describe("the friendship record", () => {
  const ana = () => newFriendship({ id: "ana", friend: { name: "Ana", ref: "belonging/friends/ana.md" }, state: "friends" }, NOW);

  it("moves only as the statechart allows, and nothing leaves ended", () => {
    const f = ana();
    const d = moveFriendship(f, "dormant", NOW, "moved away");
    expect(d.state).toBe("dormant");
    expect(d.history.at(-1)).toEqual({ at: NOW.toISOString(), from: "friends", to: "dormant", why: "moved away" });
    expect(() => moveFriendship(d, "goodwill", NOW)).toThrow(/dormant can move to friends or ended/);
    const e = moveFriendship(d, "ended", NOW);
    expect(() => moveFriendship(e, "friends", NOW)).toThrow(/stays ended/);
    expect(TRANSITIONS.ended).toEqual([]);
    expect(() => newFriendship({ id: "x", friend: { name: "X" }, state: "ended" }, NOW)).toThrow(/does not begin ended/);
  });

  it("refuses a history that skips the statechart or disagrees with its state", () => {
    const f = ana();
    const bad = { ...f, state: "ended", history: [...f.history, { at: NOW.toISOString(), from: "goodwill", to: "ended" }] };
    expect(parseFriendship(bad).problems).toEqual(["friendship.history[1]: from is friends, the state before it"]);
    expect(parseFriendship({ ...f, state: "dormant" }).problems).toEqual(["friendship: state is dormant but the history ends in friends"]);
    expect(parseFriendship({ ...f, basis: "money" }).problems[0]).toMatch(/basis/);
  });

  it("reads today's friend record: its kind as the basis, its state mapped", () => {
    expect(fromFriendRecord("bo", { name: "Bo", kind: "Virtue", state: "close" }, NOW)).toMatchObject({ basis: "virtue", state: "friends" });
    expect(fromFriendRecord("cy", { name: "Cy", state: "acquaintance" }, NOW).state).toBe("goodwill");
    expect(fromFriendRecord("di", { name: "Di", state: "drifted" }, NOW).state).toBe("dormant");
  });
});

describe("the question catalog", () => {
  it("asks Aristotle's questions by default, and the others' when their scheme is on", () => {
    expect(questionsFor(DEFAULT_CATALOG).every((q) => q.scheme === "aristotle")).toBe(true);
    expect(questionsFor(DEFAULT_CATALOG)).toHaveLength(12);
    const all = setScheme(setScheme(DEFAULT_CATALOG, "christian", true), "lewis", true);
    expect(questionsFor(all)).toHaveLength(DEFAULT_QUESTIONS.length);
    expect(() => setScheme(DEFAULT_CATALOG, "aristotle", false)).toThrow(/stays on/);
  });

  it("hides a question without deleting it, and adds the person's own with not sure", () => {
    const h = hideQuestion(DEFAULT_CATALOG, "complaint", true);
    expect(questionsFor(h).map((q) => q.id)).not.toContain("complaint");
    expect(questionsFor(hideQuestion(h, "complaint", false)).map((q) => q.id)).toContain("complaint");
    const a = addQuestion(DEFAULT_CATALOG, { id: "laugh", text: "Do you laugh together?", bears: "state", choices: [{ id: "yes", label: "Yes" }, { id: "no", label: "No" }] });
    expect(questionsFor(a).at(-1)!.choices.map((c) => c.id)).toEqual(["yes", "no", "not-sure"]);
    expect(parseCatalog(JSON.parse(JSON.stringify(a))).problems).toEqual([]);
    expect(() => addQuestion(a, { id: "laugh", text: "Again", bears: "state", choices: [{ id: "y", label: "Y" }] })).toThrow(/taken/);
  });
});

describe("the evaluation", () => {
  it("reads each answer back against the text and never scores", () => {
    const e = newEvaluation(DEFAULT_CATALOG, { id: "e1", friendship: "ana", date: "2026-11-21", answers: [{ question: "what-each-gets", choice: "help" }, { question: "returned-and-known", choice: "not-returned" }] }, "person", NOW);
    expect(e.status).toBe("stated");
    const read = readEvaluation(DEFAULT_CATALOG, e);
    expect(read[0]!.reads).toMatch(/utility.*1156a10-21/);
    expect(read[1]!.reads).toMatch(/Goodwill, not yet friendship/);
    expect(suggestedBasis(e)).toBe("utility");
  });

  it("refuses an unknown question, a choice the question lacks, and a question answered twice", () => {
    expect(() => newEvaluation(DEFAULT_CATALOG, { id: "e", friendship: "ana", date: "2026-11-21", answers: [{ question: "nope", choice: "x" }] }, "person", NOW)).toThrow(/no question nope/);
    expect(() => newEvaluation(DEFAULT_CATALOG, { id: "e", friendship: "ana", date: "2026-11-21", answers: [{ question: "complaint", choice: "maybe" }] }, "person", NOW)).toThrow(/the choices are none, mine, theirs, both, not-sure/);
    expect(() => newEvaluation(DEFAULT_CATALOG, { id: "e", friendship: "ana", date: "2026-11-21", answers: [{ question: "complaint", choice: "none" }, { question: "complaint", choice: "mine" }] }, "person", NOW)).toThrow(/twice/);
    expect(() => newEvaluation(DEFAULT_CATALOG, { id: "e", friendship: "ana", date: "2026-11-21", answers: [{ question: "aelred-stage", choice: "harmony" }] }, "person", NOW)).not.toThrow();
  });

  it("comes in proposed when an assistant keeps it, and counts once the person confirms", () => {
    const e = newEvaluation(DEFAULT_CATALOG, { id: "e2", friendship: "ana", date: "2026-11-21", answers: [{ question: "how-long", choice: "tested" }] }, "assistant", NOW);
    expect([e.status, counts(e)]).toEqual(["proposed", false]);
    const c = confirmEvaluation(e);
    expect([c.status, counts(c)]).toEqual(["confirmed", true]);
    expect(() => confirmEvaluation(c)).toThrow(/only a proposed one/);
  });
});

describe("a vault's friendships", () => {
  it("keeps records, evaluations and the catalog as files, and reflect check finds what is wrong", async () => {
    const root = await tmp();
    const store = filesFriendships(root, { now: () => NOW });
    await store.put(newFriendship({ id: "ana", friend: { name: "Ana" } }, NOW));
    await store.putEvaluation(newEvaluation(DEFAULT_CATALOG, { id: "2026-11-21-ana", friendship: "ana", date: "2026-11-21", answers: [{ question: "how-long", choice: "new" }] }, "person", NOW));
    await store.putCatalog(setScheme(DEFAULT_CATALOG, "lewis", true));
    expect((await store.list()).map((f) => f.id)).toEqual(["ana"]);
    expect((await store.evaluations("ana")).map((e) => e.id)).toEqual(["2026-11-21-ana"]);
    expect((await store.catalog()).schemes).toEqual(["aristotle", "lewis"]);
    expect(await friendshipProblems(root)).toEqual([]);
    await expect(store.putEvaluation(newEvaluation(DEFAULT_CATALOG, { id: "x", friendship: "bo", date: "2026-11-21", answers: [{ question: "how-long", choice: "new" }] }, "person", NOW))).rejects.toThrow(/no friendship bo/);
    await mkdir(join(root, "friendships", "evaluations"), { recursive: true });
    await writeFile(join(root, "friendships", "evaluations", "stray.json"), JSON.stringify({ id: "other", friendship: "bo", date: "2026-11-21", by: "person", status: "stated", audience: "private", schemes: ["aristotle"], answers: [{ question: "how-long", choice: "forever" }], created: NOW.toISOString() }));
    expect(await friendshipProblems(root)).toEqual(["friendships/evaluations/stray.json: its id is other", "friendships/evaluations/stray.json: no friendship bo", "friendships/evaluations/stray.json: how-long has no choice forever"]);
    expect(freshId("Ana Lopez", new Set(["ana-lopez"]))).toBe("ana-lopez-2");
  });

  it("leaves keeping and moving a friendship to the person: an assistant over MCP is refused, its evaluation proposed", async () => {
    const root = await tmp();
    const ctx = { userId: "p-1", now: NOW, friendships: filesFriendships(root, { now: () => NOW }), changes: { add: async () => "c-1", get: async () => null, recent: async () => [], markUndone: async () => false, hold: async () => "h-1", held: async () => [], claim: async () => false } } as unknown as VaultContext;
    await expect(runVaultAction(ctx, "keep_friendship", { friend: "Ana" }, "mcp")).rejects.toThrow(/the person's to do/);
    await ctx.friendships!.put(newFriendship({ id: "ana", friend: { name: "Ana" }, state: "friends" }, NOW));
    const ran = await runVaultAction(ctx, "evaluate_friendship", { friendship: "ana", answers: "what-each-gets=themselves" }, "mcp");
    expect("result" in ran && ran.result).toMatchObject({ status: "proposed", suggested_basis: "virtue" });
    const q = await runVaultAction(ctx, "friendship_questions", {}, "mcp");
    expect(("result" in q ? (q.result as { questions: unknown[] }) : { questions: [] }).questions).toHaveLength(12);
  });
});
