import { readFileSync } from "node:fs";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { attributesFromPuzzle } from "./founder-puzzle.ts";
import { readPersonFile, writePersonFile } from "./files-person.ts";
import { checkInstance, initInstance } from "./instance.ts";
import { closeAttribute, confirmAttribute, currentAttributes, EMPTY_PERSON, proposeAttributes, readPersonState, stateAttribute, type IsoDate } from "./person.ts";
import { personProblems } from "./person-schema.ts";

const AT = "2026-11-20" as IsoDate;
const REPORT = {
  kind: "naive.founder-puzzle-source",
  version: 1,
  reported_by: { assistant: "Claude", model: "m", basis: "memory", reported_at: "2026-10-30" },
  founder: { name: "Tester" },
  puzzle: { statement: "How can a person build a life whose parts serve one end?", why: "It recurs in every project.", confidence: "medium", alternatives: [] },
  attributes: {
    telos: [{ text: "A good life lived in a good polis", type: "life", basis: "founder-said", evidence: "Said in October", confidence: "high" }],
    ambitions: [{ text: "Three client ventures pass Validation", type: "venture", basis: "founder-said", evidence: "Stated goal", confidence: "high" }],
    "unfair-advantages": [{ text: "Builds the method and the tools", type: "craft", basis: "agent-inferred", evidence: "Repos", confidence: "sure" }],
    strengths: [{ text: "" }],
  },
  open_questions: ["What is the money for?"],
};

describe("the person's attributes", () => {
  it("states, proposes, confirms and closes without overwriting, and passes the person schema", () => {
    let p = stateAttribute(EMPTY_PERSON, "telos", "  A good life  ", AT);
    expect(stateAttribute(p, "telos", "A good life", AT)).toBe(p);
    expect(() => stateAttribute(p, "value", " ", AT)).toThrow(/own words/);
    const r = proposeAttributes(p, attributesFromPuzzle(REPORT, AT));
    expect(r.added).toBe(4);
    expect(proposeAttributes(r.person, attributesFromPuzzle(REPORT, AT)).added).toBe(0);
    p = r.person;
    expect(currentAttributes(p).map((a) => a.text)).toEqual(["A good life"]);
    p = confirmAttribute(p, 2);
    expect(p.attributes[2]).toMatchObject({ kind: "telos", status: "confirmed", source: { kind: "import", name: "founder's puzzle, Claude, 2026-10-30", item: "attributes.telos[0]", status: "confirmed" } });
    p = closeAttribute(p, 0, AT);
    expect(() => closeAttribute(p, 0, AT)).toThrow(/already closed/);
    expect(currentAttributes(p, "telos").map((a) => a.text)).toEqual(["A good life lived in a good polis"]);
    expect(p.attributes).toHaveLength(5);
    expect(personProblems(p)).toEqual([]);
    expect(readPersonState(JSON.parse(JSON.stringify(p)))).toEqual(p);
  });

  it("reads a founder's puzzle report as proposed imports, the statement as a puzzle", () => {
    const list = attributesFromPuzzle(REPORT, AT);
    expect(list.map((a) => [a.kind, a.status, a.source.kind])).toEqual([
      ["puzzle", "proposed", "import"],
      ["telos", "proposed", "import"],
      ["ambition", "proposed", "import"],
      ["unfair-advantage", "proposed", "import"],
    ]);
    expect(list[0]).toMatchObject({ evidence: "It recurs in every project.", confidence: "medium", validFrom: "2026-10-30", recordedAt: AT });
    expect(list[3]!.confidence).toBeUndefined();
    expect(() => attributesFromPuzzle({ kind: "other" }, AT)).toThrow(/not a founder's puzzle report/);
  });

  it("reads Torian's real reports (both assistants) and every proposed attribute passes the schema", () => {
    for (const f of ["puzzle-claude-2026-10-30.json", "puzzle-chatgpt-2026-10-30.json"]) {
      let raw: unknown;
      try {
        raw = JSON.parse(readFileSync(`/mnt/project-files/founder-puzzle/records/${f}`, "utf8"));
      } catch {
        return; // only where the project files are mounted
      }
      const p = proposeAttributes(EMPTY_PERSON, attributesFromPuzzle(raw, AT)).person;
      expect(p.attributes.length).toBeGreaterThan(20);
      expect(personProblems(p)).toEqual([]);
    }
  });

  it("refuses a confirmed status on a proposed source, and an unknown kind", () => {
    const p = proposeAttributes(EMPTY_PERSON, attributesFromPuzzle(REPORT, AT)).person;
    const bad = { ...p, attributes: p.attributes.map((a, i) => (i === 0 ? { ...a, status: "confirmed" } : a)) };
    expect(personProblems(bad)).toEqual(["person.attributes[0].status is proposed, as its source is"]);
    expect(personProblems({ ...p, attributes: [{ ...p.attributes[0], kind: "dream" }] }).length).toBeGreaterThan(0);
    expect(personProblems({ facts: [], relationships: [], holds: [] })).toEqual([]);
  });
});

describe("person.json in a vault", () => {
  const dirs: string[] = [];
  afterAll(async () => Promise.all(dirs.map((d) => rm(d, { recursive: true, force: true }))));

  it("keeps the id and name, logs each write, and passes reflect check", async () => {
    const dir = await mkdtemp(join(tmpdir(), "reflect-person-"));
    dirs.push(dir);
    await initInstance(dir, "Tester");
    const before = JSON.parse(await readFile(join(dir, "person.json"), "utf8")) as Record<string, unknown>;
    const { person } = await readPersonFile(dir);
    await writePersonFile(dir, stateAttribute(person, "ambition", "Run a marathon", AT));
    const after = JSON.parse(await readFile(join(dir, "person.json"), "utf8")) as Record<string, unknown>;
    expect(after).toMatchObject({ ...before, attributes: [expect.objectContaining({ kind: "ambition", text: "Run a marathon" })] });
    expect(await checkInstance(dir)).toMatchObject({ problems: [], outside: [] });
    await writeFile(join(dir, "person.json"), JSON.stringify({ ...after, attributes: [{ kind: "dream", text: "x" }] }));
    expect((await checkInstance(dir)).problems.some((p) => p.startsWith("person.json"))).toBe(true);
  });
});
