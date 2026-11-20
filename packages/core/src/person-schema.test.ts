import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { finish } from "./onboarding";
import { ONBOARDING } from "./structure";
import { EMPTY_PERSON, readPersonState, stateFact, stateHold, stateRelationship, type IsoDate, type PersonState } from "./person";
import { PERSON_SCHEMA_FILE, personFileProblems, personProblems, personSchema, personSchemaFile } from "./person-schema";

const AT = "2026-11-20" as IsoDate;
const FILE = new URL(`../schemas/${PERSON_SCHEMA_FILE}`, import.meta.url);
const zodPerson = () => z.fromJSONSchema(JSON.parse(readFileSync(FILE, "utf8")));
const ada: PersonState = stateHold(stateRelationship(stateFact(EMPTY_PERSON, "name", "Ada", AT), "Sam", "closest_friend", AT), "partnership", "married", AT);
const fromJournal: PersonState = {
  ...ada,
  facts: [...ada.facts, { key: "work", value: "Nurse", validFrom: AT, validTo: null, recordedAt: AT, source: { kind: "journal", entry: "e1", quote: "I start at the hospital Monday.", status: "proposed" }, status: "proposed" }],
};

describe("the person schema", () => {
  it("the committed file is current (run pnpm schemas in web/ when this fails)", () => {
    expect(readFileSync(FILE, "utf8")).toBe(personSchemaFile());
  });

  it("carries the noun person: a substance, an external good, the person's community", () => {
    expect(personSchema()["x-reflect"]).toEqual({ noun: "person", category: "substance", good: "external", community: "person" });
  });

  it("takes what the stores write, in the core's check and in zod", () => {
    const answers = Object.fromEntries(ONBOARDING.map((q) => [q.id, q.id === "birthday" ? "1990-04-01" : "Sam"]));
    const onboarded = finish({ step: ONBOARDING.length, answers, error: null, editing: false }, EMPTY_PERSON, AT);
    for (const p of [EMPTY_PERSON, ada, stateFact(ada, "name", "Ada L.", "2026-12-01" as IsoDate), fromJournal, onboarded]) {
      expect(personProblems(p)).toEqual([]);
      expect(zodPerson().safeParse(p).success).toBe(true);
    }
  });

  it("refuses a value with no source, an unknown source, a journal source with no quote and a status that disagrees", () => {
    const fact = ada.facts[0]!;
    const cases: [string, unknown][] = [
      ["no source", { ...ada, facts: [{ ...fact, source: undefined }] }],
      ["unknown source", { ...ada, facts: [{ ...fact, source: { kind: "rumour" } }] }],
      ["no quote", { ...ada, holds: [{ ...ada.holds[0]!, source: { kind: "journal", entry: "e1", status: "proposed" } }] }],
      ["a bad day", { ...ada, relationships: [{ ...ada.relationships[0]!, validFrom: "20 November" }] }],
      ["an extra key", { ...ada, mood: "fine" }],
    ];
    for (const [name, p] of cases) {
      expect(personProblems(p).length, name).toBeGreaterThan(0);
      expect(zodPerson().safeParse(p).success, `${name} in zod`).toBe(false);
    }
    expect(personProblems({ ...ada, facts: [{ ...fact, status: "proposed" }] })).toEqual(["person.facts[0].status is confirmed, as its source is"]);
  });

  it("older records still read: a missing source is stated, fromJournal is journal, and both then pass", () => {
    const stored = {
      facts: [
        { key: "name", value: "Ada", validFrom: AT, validTo: null, recordedAt: AT, status: "confirmed" },
        { key: "work", value: "Nurse", validFrom: AT, validTo: null, recordedAt: AT, source: { kind: "fromJournal", entry: "e1", quote: "I start Monday.", grant: "g1" }, status: "proposed" },
      ],
      relationships: [{ name: "Sam", kind: "closest_friend", validFrom: AT, validTo: null, recordedAt: AT, source: { kind: "stated" } }],
      holds: [{ subject: "partnership", value: "married", validFrom: AT, validTo: null }],
    };
    const p = readPersonState(stored);
    expect(p.facts.map((f) => f.source)).toEqual([{ kind: "stated" }, { kind: "journal", entry: "e1", quote: "I start Monday.", grant: "g1", status: "proposed" }]);
    expect(p.holds[0]?.source).toEqual({ kind: "stated" });
    expect(personProblems(p)).toEqual([]);
  });

  it("checks a vault's person.json only when it holds facts, relationships or holds", () => {
    expect(personFileProblems(null)).toEqual([]);
    expect(personFileProblems(JSON.stringify({ id: "ada", name: "Ada" }))).toEqual([]);
    expect(personFileProblems(JSON.stringify({ id: "ada", name: "Ada", facts: ada.facts }))).toEqual([]);
    expect(personFileProblems("{ not json")).toEqual(["person.json is not JSON"]);
    expect(personFileProblems(JSON.stringify({ id: "ada", facts: [{ key: "name" }] }))[0]).toMatch(/^person\.json\.facts\[0\]\./);
  });
});
