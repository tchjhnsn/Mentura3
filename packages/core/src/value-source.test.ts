import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { interestSource, SOURCES } from "./interests";
import { schemaProblems, type Schema } from "./schema-check";
import { confirmSource, readValueSource, SOURCE_JSON_SCHEMA, SOURCE_KIND_IDS, SOURCE_KINDS, sourceKindOf, startStatus, STATED, statusOf, type ValueSource } from "./value-source";

const LEAN = readFileSync(new URL("../../../lean/Reflect/Sources.lean", import.meta.url), "utf8");
const schema = { $defs: { source: SOURCE_JSON_SCHEMA }, $ref: "#/$defs/source" } as unknown as Schema;

describe("sources of a value", () => {
  it("are the five kinds, in the same order as the Lean model", () => {
    expect(SOURCE_KIND_IDS).toEqual(["stated", "journal", "conversation", "import", "noticed"]);
    const inductive = LEAN.slice(LEAN.indexOf("inductive SourceKind"), LEAN.indexOf("deriving", LEAN.indexOf("inductive SourceKind")));
    expect([...inductive.matchAll(/\|\s+«?([a-z]+)»?/g)].map((m) => m[1])).toEqual([...SOURCE_KIND_IDS]);
  });

  it("start proposed for every kind but stated, and confirming keeps the kind", () => {
    for (const k of SOURCE_KINDS) expect(startStatus(k.id), k.id).toBe(k.id === "stated" ? "confirmed" : "proposed");
    const s: ValueSource = { kind: "conversation", conversation: "c1", quote: "I moved to Austin in May.", status: "proposed" };
    expect(confirmSource(s)).toEqual({ ...s, status: "confirmed" });
    expect(statusOf(STATED)).toBe("confirmed");
    expect(confirmSource(STATED)).toBe(STATED);
  });

  it("read older values: missing is stated, fromJournal is journal, told and imported are stated and import", () => {
    expect(readValueSource(undefined)).toEqual(STATED);
    expect(readValueSource(null)).toEqual(STATED);
    expect(readValueSource("told")).toEqual(STATED);
    expect(readValueSource({ kind: "fromJournal", entry: "e1", quote: "I am a nurse now.", grant: "g1" }, "confirmed")).toEqual({ kind: "journal", entry: "e1", quote: "I am a nurse now.", grant: "g1", status: "confirmed" });
    expect(readValueSource({ kind: "import", name: "Strava", item: "a9" })).toEqual({ kind: "import", name: "Strava", item: "a9", status: "proposed" });
    expect(readValueSource({ kind: "journal", entry: "e1" })).toBeNull();
    expect(readValueSource({ kind: "rumour" })).toBeNull();
    expect(["told", "imported", "noticed", undefined, "fromJournal", "nonsense"].map(sourceKindOf)).toEqual(["stated", "import", "noticed", "stated", "journal", "stated"]);
  });

  it("the interest model keeps three of the kinds and reads its old ids", () => {
    expect(SOURCES.map((s) => s.id)).toEqual(["stated", "import", "noticed"]);
    expect(["told", "imported", "noticed", undefined, "journal"].map(interestSource)).toEqual(["stated", "import", "noticed", "stated", "stated"]);
  });

  it("the JSON Schema takes each kind with what it carries and refuses the rest", () => {
    const good: ValueSource[] = [
      STATED,
      { kind: "journal", entry: "e1", quote: "We married in June.", status: "proposed" },
      { kind: "journal", entry: "e1", quote: "We married in June.", status: "confirmed", grant: "g1" },
      { kind: "conversation", conversation: "c1", quote: "I work nights.", status: "proposed" },
      { kind: "import", name: "contacts.vcf", item: "17", status: "proposed" },
      { kind: "noticed", records: ["work/interest/r1"], status: "proposed" },
    ];
    for (const s of good) expect(schemaProblems(schema, s), s.kind).toEqual([]);
    const bad: unknown[] = [
      { kind: "journal", entry: "e1", status: "proposed" },
      { kind: "conversation", conversation: "c1", quote: "x" },
      { kind: "noticed", records: [], status: "proposed" },
      { kind: "stated", status: "confirmed" },
      { kind: "rumour" },
      "told",
    ];
    for (const s of bad) expect(schemaProblems(schema, s).length, JSON.stringify(s)).toBeGreaterThan(0);
  });
});
