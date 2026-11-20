import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { APPS, type Field } from "./life";
import { bodySchema } from "./life-body";
import { lifeSchema, lifeSchemaFiles } from "./life-schemas";
import { CATEGORIES, COMMUNITIES, GOODS } from "./terms/ontology";

const DIR = new URL("../schemas/life/", import.meta.url);
const KINDS = APPS.flatMap((a) => a.kinds.map((k) => ({ app: a.id, kind: k })));

/** A value `cleanBody` would keep for the field. */
const sample = (f: Field): string | number | boolean => {
  switch (f.kind) {
    case "number":
    case "money":
      return f.signed ? -97.74 : 12;
    case "check":
      return true;
    case "day":
      return "2026-11-19";
    case "choice":
      return f.options?.[0]?.id ?? "";
    case "origins":
      return "habit,reasoning";
    case "long":
      return "A longer note.\nOn two lines.";
    case "text":
      return "A short note";
  }
};
/** A value no field of this kind accepts. */
const wrong = (f: Field): unknown => (f.kind === "check" ? "yes" : f.kind === "number" || f.kind === "money" ? -1e6 : f.kind === "day" ? "19 November" : f.kind === "choice" || f.kind === "origins" ? "not-an-option" : 7);

describe("life schemas", () => {
  it("the committed files are current (run pnpm schemas in web/ when this fails)", () => {
    const want = lifeSchemaFiles();
    const have = readdirSync(DIR).filter((f) => f.endsWith(".schema.json")).sort();
    expect(have).toEqual([...want.keys()].sort());
    for (const [name, text] of want) expect(readFileSync(new URL(name, DIR), "utf8"), name).toBe(text);
  });

  it("carries each kind's noun, category, good and community", () => {
    for (const { app, kind } of KINDS) {
      const r = lifeSchema(app, kind)["x-reflect"];
      expect(r.app).toBe(app);
      expect(r.kind).toBe(kind.id);
      expect(CATEGORIES).toContain(r.category);
      expect(GOODS).toContain(r.good);
      expect(COMMUNITIES).toContain(r.community);
    }
    expect(lifeSchema("body", APPS.find((a) => a.id === "body")!.kinds.find((k) => k.id === "health")!)["x-reflect"]).toEqual({
      app: "body",
      kind: "health",
      noun: "health",
      category: "quality",
      good: "body",
      community: "person",
    });
  });

  it("a sample body for every kind validates against its JSON Schema and its zod schema", () => {
    for (const { app, kind } of KINDS) {
      const body = Object.fromEntries(kind.fields.map((f) => [f.key, sample(f)]));
      const json = z.fromJSONSchema(JSON.parse(readFileSync(new URL(`${app}.${kind.id}.schema.json`, DIR), "utf8")));
      expect(json.safeParse(body).success, `${app}:${kind.id}`).toBe(true);
      expect(json.safeParse({ ...body, extra: "kept" }).success, `${app}:${kind.id} with an extra key`).toBe(true);
      expect(json.safeParse({}).success, `${app}:${kind.id} empty`).toBe(true);
      expect(bodySchema(kind.id)?.safeParse(body).success, `${app}:${kind.id} in zod`).toBe(true);
    }
  });

  it("refuses a field of the wrong kind, as the zod schema does", () => {
    for (const { app, kind } of KINDS) {
      const json = z.fromJSONSchema(lifeSchema(app, kind));
      for (const f of kind.fields) {
        const body = { [f.key]: wrong(f) };
        expect(json.safeParse(body).success, `${app}:${kind.id}.${f.key}`).toBe(false);
        expect(bodySchema(kind.id)?.safeParse(body).success, `${app}:${kind.id}.${f.key} in zod`).toBe(false);
      }
    }
  });
});

describe("sources in the life schemas", () => {
  it("every schema takes _sources from a declared field to a source, and refuses an undeclared key or a bad source", () => {
    for (const { app, kind } of KINDS) {
      const json = z.fromJSONSchema(JSON.parse(readFileSync(new URL(`${app}.${kind.id}.schema.json`, DIR), "utf8")));
      const [a, b] = kind.fields;
      const sources = { [a!.key]: { kind: "journal", entry: "e1", quote: "A line from the entry.", status: "proposed" }, ...(b ? { [b.key]: { kind: "stated" } } : {}) };
      expect(json.safeParse({ _sources: sources }).success, `${app}:${kind.id}`).toBe(true);
      expect(json.safeParse({ _sources: { "not-a-field": { kind: "stated" } } }).success, `${app}:${kind.id} undeclared key`).toBe(false);
      expect(json.safeParse({ _sources: { [a!.key]: { kind: "journal", entry: "e1" } } }).success, `${app}:${kind.id} no quote`).toBe(false);
      expect(json.safeParse({ _sources: { [a!.key]: { kind: "told" } } }).success, `${app}:${kind.id} unknown kind`).toBe(false);
      expect(kind.fields.some((f) => f.key.startsWith("_")), `${app}:${kind.id} has a field key starting with _`).toBe(false);
    }
  });

  it("every choice field emits enum, its option ids", () => {
    for (const { app, kind } of KINDS) {
      const s = lifeSchema(app, kind);
      for (const f of kind.fields.filter((x) => x.kind === "choice")) expect(s.properties[f.key], `${app}:${kind.id}.${f.key}`).toMatchObject({ type: "string", enum: (f.options ?? []).map((o) => o.id) });
    }
  });
});
