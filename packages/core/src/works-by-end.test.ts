import { readFileSync } from "node:fs";
import { mkdtemp, readFile, rm, writeFile, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { readWorkRecords, writeWorkRecord } from "./files-published.ts";
import { checkInstance, initInstance } from "./instance.ts";
import { defaultPolicy, draftPresentation } from "./presentation.ts";
import { emptyIndex, publishedProblems, publishWorks, SCHEMAS, unpublish, type Approval, type Publication } from "./published.ts";
import { schemaProblems } from "./schema-check.ts";
import { END_IDS, SECTION_IDS, SECTIONS, sectionsOf, shownWork, shownWorks, workOfPath, workRecordProblems, type VaultWorkRecord } from "./works-by-end.ts";

const NOW = new Date("2026-11-20T05:00:00.000Z");
const policy = defaultPolicy("Tester");
const ok = (): Approval => ({
  policy,
  record: draftPresentation(policy, null, { channel: "personal-site", role: "founder", end: "show what I make and whom it serves", audience: "visitors to my site" }, { id: "2026-11-20-works", now: NOW }),
  channel: "personal-site",
  at: NOW,
});

const WORKS: VaultWorkRecord[] = [
  { end: "knowing", id: "specs-survey", record: { title: "Specs as source", section: "research", disclosure: "public", summary: "A survey.", problem: "Specs drift from code." } },
  { end: "making", id: "virtu", record: { title: "Virtu", section: "projects", disclosure: "public", sources: [{ connector: "github", url: "https://github.com/tchjhnsn/design-system-theory" }], status: "active", last_activity: "2026-11-19" } },
  { end: "making", id: "secret", record: { title: "Secret venture", section: "products", disclosure: "foreshadow", foreshadow: "A platform for founders, in stealth.", summary: "Never shown", solution: "Hidden solution." } },
  { end: "doing", id: "tutoring", record: { title: "Tutoring", section: "service", disclosure: "private" } },
  { end: "making", id: "everything", record: { title: "The Everything Ecosystem", section: "projects", disclosure: "public", pinned: true, links: [{ label: "Founding essay", href: "/blog/the-everything-ecosystem" }] } },
];

function applied(files: Map<string, string>, p: Publication): Map<string, string> {
  const next = new Map(files);
  for (const w of p.write) next.set(w.path, w.bytes);
  for (const r of p.remove) next.delete(r);
  return next;
}

describe("works by their end", () => {
  it("gives every section exactly one end, and every end a section", () => {
    for (const s of SECTION_IDS) expect(END_IDS).toContain(SECTIONS[s]);
    for (const e of END_IDS) expect(sectionsOf(e).length).toBeGreaterThan(0);
    expect(SECTIONS.research).toBe("knowing");
    expect(SECTIONS.projects).toBe("making");
    expect(SECTIONS.writing).toBe("making");
  });

  it("matches the Lean model's ends, sections and the end of each section", () => {
    const lean = readFileSync(new URL("../../../lean/Reflect/Works.lean", import.meta.url), "utf8");
    const ctors = (name: string) => [...lean.slice(lean.indexOf(`inductive ${name} where`), lean.indexOf("deriving", lean.indexOf(`inductive ${name} where`))).matchAll(/\|\s*([a-z]+)/g)].map((m) => m[1]);
    expect(ctors("End")).toEqual([...END_IDS]);
    expect(ctors("Section")).toEqual(SECTION_IDS);
    for (const e of END_IDS) expect(lean).toMatch(new RegExp(`\\| ${sectionsOf(e).map((s) => `\\.${s}`).join(" \\| ")} => \\.${e}`));
  });

  it("reads a work's end and id from its path", () => {
    expect(workOfPath("making/virtu.json")).toEqual({ end: "making", id: "virtu" });
    for (const p of ["making/Virtu.json", "work/virtu.json", "making/a/b.json", "knowing/x.md"]) expect(workOfPath(p)).toBeNull();
  });

  it("refuses a section of another end, a foreshadow without its line and a record off its schema", () => {
    expect(workRecordProblems("knowing", { title: "Virtu", section: "projects", disclosure: "public" })[0]).toMatch(/projects is a section of making, not knowing/);
    expect(workRecordProblems("making", { title: "X", section: "projects", disclosure: "foreshadow" })[0]).toMatch(/needs its one line/);
    expect(workRecordProblems("making", { title: "X", section: "projects", disclosure: "secret" }).length).toBeGreaterThan(0);
    expect(workRecordProblems("making", { title: "X", section: "projects", disclosure: "public", rating: 5 }).length).toBeGreaterThan(0);
    expect(workRecordProblems("making", WORKS[1]!.record)).toEqual([]);
  });

  it("shows a public work in full, a foreshadowed one without its name, a private one never", () => {
    expect(shownWork("doing", "tutoring", WORKS[3]!.record)).toBeNull();
    expect(shownWork("making", "secret", WORKS[2]!.record)).toEqual({ disclosure: "foreshadow", end: "making", section: "products", foreshadow: "A platform for founders, in stealth." });
    const shown = shownWorks(WORKS);
    expect(shown.map((w) => (w.disclosure === "public" ? w.id : `(${w.section})`))).toEqual(["everything", "virtu", "(products)", "specs-survey"]);
    expect(JSON.stringify(shown)).not.toMatch(/Secret venture|Never shown|Hidden solution|tutoring/);
  });

  it("passes problem, cause and solution through for a public work only, each one sentence", () => {
    const pcs = { problem: " Founders lose track of what they decided. ", cause: "Decisions live in chat, not records.", solution: "Keep every decision as a record?" };
    const pub = { title: "Naive", section: "projects", disclosure: "public", ...pcs } as const;
    expect(workRecordProblems("making", pub)).toEqual([]);
    expect(shownWork("making", "naive", pub)).toMatchObject({ problem: "Founders lose track of what they decided.", cause: "Decisions live in chat, not records.", solution: "Keep every decision as a record?" });
    const fore = shownWork("making", "naive", { ...pub, disclosure: "foreshadow", foreshadow: "A framework, in stealth." });
    expect(fore).toEqual({ disclosure: "foreshadow", end: "making", section: "projects", foreshadow: "A framework, in stealth." });
    expect(shownWork("making", "naive", { ...pub, disclosure: "private" })).toBeNull();
    expect(workRecordProblems("making", { ...pub, problem: "It is slow. It is also costly." })).toEqual(['work: problem must be one sentence, ending with ".", "?" or "!"']);
    expect(workRecordProblems("making", { ...pub, cause: "No ending mark" })[0]).toMatch(/cause must be one sentence/);
    expect(workRecordProblems("making", { ...pub, solution: "Ship it! Then measure." })[0]).toMatch(/solution must be one sentence/);
    expect(workRecordProblems("making", { ...pub, solution: "x".repeat(301) + "." }).length).toBeGreaterThan(0);
    expect(workRecordProblems("making", { ...pub, problem: "Version 2.0 broke the build." })).toEqual([]);
  });

  it("publishes works.json through the gate, passing its schema and the folder check", () => {
    expect(() => publishWorks(emptyIndex(), { ...ok(), record: null }, WORKS)).toThrow(expect.objectContaining({ reason: "not-presented" }));
    expect(() => publishWorks(emptyIndex(), ok(), [WORKS[3]!])).toThrow(/no work to publish/);
    expect(() => publishWorks(emptyIndex(), ok(), [{ end: "doing", id: "x", record: { title: "X", section: "research", disclosure: "public" } }])).toThrow(/section of knowing/);
    const pub = publishWorks(emptyIndex(), ok(), WORKS);
    const files = applied(new Map(), pub);
    const { $schema, ...works } = JSON.parse(files.get("works.json")!) as Record<string, unknown>;
    expect($schema).toMatch(/published-works\.schema\.json$/);
    expect(schemaProblems(SCHEMAS.works, works)).toEqual([]);
    expect(works).toMatchObject({ presentation: "2026-11-20-works", channel: "personal-site" });
    expect(pub.index.entries).toEqual([expect.objectContaining({ path: "works.json", kind: "works", approved_by: "person" })]);
    expect(publishedProblems(files)).toEqual([]);
    const bad = new Map(files).set("works.json", files.get("works.json")!.replace('"Virtu"', '"Virtu!"'));
    expect(publishedProblems(bad)[0]).toMatch(/changed since the person approved it/);
    expect([...applied(files, unpublish(pub.index, "works.json")).keys()]).toEqual(["index.json"]);
  });
});

describe("works in a vault", () => {
  const dirs: string[] = [];
  afterAll(async () => Promise.all(dirs.map((d) => rm(d, { recursive: true, force: true }))));

  it("keeps a work at <end>/<id>.json, moves it when its end changes, and checks the folders", async () => {
    const dir = await mkdtemp(join(tmpdir(), "reflect-works-"));
    dirs.push(dir);
    await initInstance(dir, "Tester");
    expect(await writeWorkRecord(dir, "making", "papers", { title: "Papers", section: "writing", disclosure: "public" }, NOW)).toEqual({ path: "making/papers.json" });
    expect(await writeWorkRecord(dir, "knowing", "papers", { title: "Papers", section: "research", disclosure: "public" }, NOW)).toEqual({ path: "knowing/papers.json", moved: "making/papers.json" });
    await expect(writeWorkRecord(dir, "doing", "x", { title: "X", section: "projects", disclosure: "public" }, NOW)).rejects.toThrow(/section of making/);
    expect((await readWorkRecords(dir)).works).toEqual([{ end: "knowing", id: "papers", record: { title: "Papers", section: "research", disclosure: "public" } }]);
    expect(JSON.parse(await readFile(join(dir, "knowing", "papers.json"), "utf8"))).toMatchObject({ section: "research" });
    let r = await checkInstance(dir);
    expect(r.problems).toEqual([]);
    expect(r.outside).toEqual([]);
    await mkdir(join(dir, "doing"), { recursive: true });
    await writeFile(join(dir, "doing", "talk.json"), JSON.stringify({ title: "A talk", section: "reading", disclosure: "public" }));
    r = await checkInstance(dir);
    expect(r.problems).toEqual(["doing/talk.json: reading is a section of knowing, not doing; move the file to knowing/"]);
    expect(r.outside).toEqual(["doing/talk.json"]);
  });
});
