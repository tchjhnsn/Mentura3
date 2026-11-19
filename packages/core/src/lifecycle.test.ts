import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { checkLifecycle, LIFECYCLE, needNow, needsFromLife, type LifeRecordFacts, type LifeRecords, type Stage } from "./lifecycle";
import { keepNeed, keepPassage, lifeState, readLifeRecords, REGIONS, type Passage } from "./lifetime";

const passage = (region: Passage["region"], to: string, on: string): Passage => ({ region, to, on, at: `${on.slice(0, 7)}-01T00:00:00.000Z` });
const base = (over: Partial<LifeRecords> = {}): LifeRecords => ({ today: "2026-11-19", records: [], acts: [], needs: [], passages: [], ...over });
const rec = (id: string, app: LifeRecordFacts["app"], kind: string, state: string | null, body: LifeRecordFacts["body"]): LifeRecordFacts => ({ id, app, kind, state, body });

describe("the lifecycle definition", () => {
  it("is every state of the statechart once, in its order, with real kinds and consent-only hard gates", () => {
    expect(checkLifecycle()).toEqual([]);
    expect(LIFECYCLE.map((s) => s.state)).toEqual(Object.values(REGIONS).flat());
    const hard = LIFECYCLE.flatMap((s) => s.gates.filter((g) => g.kind === "consent").map((g) => `${s.state}:${g.id}`));
    expect(hard).toEqual(["affiliating:group-admits", "pair-bond:joint-vault"]);
  });

  it("refuses a lifecycle that drops a stage, names a kind that does not exist, or has a hard gate without consent", () => {
    const broken: Stage[] = LIFECYCLE.slice(1).map((s) => ({ ...s }));
    broken[0] = { ...broken[0]!, kinds: [{ app: "work", kind: "nope" }] };
    broken[1] = { ...broken[1]!, gates: [{ kind: "consent", id: "x", text: "x", of: "", opens: "a vault" }] };
    broken[2] = { ...broken[2]!, apps: ["kin"] };
    const p = checkLifecycle(broken);
    expect(p.some((x) => x.startsWith("the stages must be"))).toBe(true);
    expect(p.some((x) => x.includes("no kind work/nope"))).toBe(true);
    expect(p.some((x) => x.includes("apps must be the apps of its kinds"))).toBe(true);
    expect(p.some((x) => x.includes("must name whose consent"))).toBe(true);
  });
});

describe("needNow", () => {
  it("with no passages, asks for one in each region and shows each region's first stage", () => {
    const n = needNow({}, base());
    expect(n.stages.map((s) => s.state)).toEqual([null, null, null]);
    expect(n.now.filter((i) => i.about.startsWith("life/")).map((i) => i.region)).toEqual(["provide", "belonging", "line"]);
    expect(n.now.filter((i) => i.about.startsWith("needs/"))).toHaveLength(8);
    expect(n.next.map((x) => x.to)).toEqual(["learning", "affiliating", "seeking-a-mate"]);
  });

  it("explains each item from the records in the current stage", () => {
    const passages = [passage("provide", "working", "2020-01"), passage("line", "caring-for-kin", "2026-06")];
    const records = [
      rec("w", "work", "work", "working", { role: "Electrician" }),
      rec("i", "work", "income", "coming-in", { source: "Shop", amount: 4000, per: "month" }),
      rec("h", "work", "household", null, { where: "Travis County", need: 96000, children: 2 }),
      rec("m", "kin", "relative", "regular-care", { name: "Mother", carer: "no-one-yet" }),
      rec("p", "legacy", "plan", "planned", { name: "will", reviewed: "2024-02-01" }),
    ];
    const n = needNow(lifeState(passages), base({ passages, records, acts: [{ kind: "visited", record: "m", day: "2026-09-01", minutes: null, amount: null }], needs: [{ need: "food", state: "stocked", runway: "30d", keptAt: "2026-10-01T00:00:00.000Z" }] }));
    const text = (about: string) => n.now.filter((i) => i.about === about);
    expect(text("work/income")[0]).toMatchObject({ region: "provide", stage: "working", text: "Income covers 50% of what your intended household needs" });
    expect(text("work/income")[0]!.because).toContain("$48,000");
    expect(text("kin/relative").map((i) => i.text)).toEqual(["Find who will care for Mother", "Visit Mother", "Ask Mother what they would want"]);
    expect(text("kin/relative")[1]!.because).toContain("2026-09-01");
    expect(text("legacy/plan")[0]!.because).toContain("your latest passage is 2026-06");
    expect(text("needs/food")[0]).toMatchObject({ text: "Restock food", region: null });
    expect(text("needs/food")[0]!.because).toContain("ran out on 2026-10-31");
    expect(n.now.some((i) => i.about === "work/work")).toBe(false);
    expect(n.next.map((x) => x.to)).toEqual(["affiliating"]);
  });

  it("shows the next stage's soft gates as evidence and its consent gate as waiting on someone", () => {
    const passages = [passage("line", "seeking-a-mate", "2023-01")];
    const records = [rec("s", "mate", "seeking", "pair-bond", { hopes: "kind" }), rec("d", "mate", "date", "went", { who: "A" })];
    const n = needNow(lifeState(passages), base({ passages, records }));
    const pair = n.next.find((x) => x.region === "line")!;
    expect(pair.to).toBe("pair-bond");
    expect(pair.gates[0]).toMatchObject({ kind: "soft", shown: true });
    expect(pair.gates[1]).toMatchObject({ kind: "consent", of: "your partner", opens: "a joint vault" });
    expect(n.now.find((i) => i.about === "mate/date")!.text).toBe("Write what you learned from the date with A");
  });

  it("names a friend who is due a visit by their own every, and not one seen recently", () => {
    const passages = [passage("belonging", "affiliating", "2010-01")];
    const records = [rec("a", "friends", "friend", "close", { name: "Ann", every: "every-month" }), rec("b", "friends", "friend", "friend", { name: "Ben", every: "every-month" })];
    const n = needNow(lifeState(passages), base({ passages, records, acts: [{ kind: "saw", record: "b", day: "2026-11-10", minutes: 60, amount: null }] }));
    expect(n.now.filter((i) => i.about === "friends/friend").map((i) => i.text)).toEqual(["See or call Ann"]);
    expect(n.now.find((i) => i.about === "friends/group")!.text).toBe("Nothing kept yet for Groups in Friends");
  });

  it("reads needs from the web app's Home records", () => {
    expect(needsFromLife([rec("f", "home", "food", null, { how: "supplied" }), rec("x", "home", "water", null, {})])).toEqual([{ need: "food", state: "supplied" }]);
  });
});

describe("readLifeRecords", () => {
  const dirs: string[] = [];
  afterAll(async () => Promise.all(dirs.map((d) => rm(d, { recursive: true, force: true }))));

  it("reads passages, needs and belonging notes from a vault", async () => {
    const dir = await mkdtemp(join(tmpdir(), "reflect-lifecycle-"));
    dirs.push(dir);
    const now = new Date("2026-11-01T00:00:00Z");
    await keepNeed(dir, "water", "stocked", { runway: "2w" }, now);
    await keepPassage(dir, "belonging", "affiliating", "2015-09", undefined, now);
    await mkdir(join(dir, "belonging", "friends"), { recursive: true });
    await writeFile(join(dir, "belonging", "friends", "README.md"), "# Friends\n");
    await writeFile(join(dir, "belonging", "friends", "ann.md"), "---\nstate: close\nevery: every-month\n---\n\n# Ann\n");
    const r = await readLifeRecords(dir, "2026-11-19");
    expect(r.passages.map((p) => p.to)).toEqual(["affiliating"]);
    expect(r.needs).toEqual([{ need: "water", state: "stocked", runway: "2w", keptAt: "2026-11-01T00:00:00.000Z" }]);
    expect(r.records).toEqual([{ id: "belonging/friends/ann", app: "friends", kind: "friend", state: "close", body: { name: "ann", every: "every-month" } }]);
    const n = needNow(lifeState(r.passages), r);
    expect(n.now.find((i) => i.about === "needs/water")!.text).toBe("Restock water");
    expect(n.now.find((i) => i.about === "friends/friend")!.text).toBe("See or call ann");
  });
});
