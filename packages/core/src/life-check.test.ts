import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { recordPaths } from "./layout.ts";
import { APPS, type Field } from "./life.ts";
import { parseBody } from "./life-body.ts";
import { bodyFromFrontMatter, checkLifeRecords, lifeCheckLine, lifeProblemLine, schemaProblems } from "./life-check.ts";
import { lifeSchema, lifeSchemaOf } from "./life-schemas.ts";

const dirs: string[] = [];
afterAll(async () => Promise.all(dirs.map((d) => rm(d, { recursive: true, force: true }))));

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
/** Values no field of this kind accepts. */
const wrongs = (f: Field): unknown[] => {
  switch (f.kind) {
    case "check":
      return ["yes", 1];
    case "number":
    case "money":
      return [-1e6, 1e11, "12", Number.NaN];
    case "day":
      return ["19 November", "2026-13-45", 20261119];
    case "choice":
    case "origins":
      return ["not-an-option", 7];
    case "long":
      return [7, "x".repeat(20001)];
    case "text":
      return [7, "x".repeat(f.internal ? 4001 : 301)];
  }
};

describe("checking a body against its kind's schema", () => {
  it("passes a sample body for every kind, an empty one and one with keys the kind does not declare", () => {
    for (const { app, kind } of KINDS) {
      const s = lifeSchema(app, kind);
      const body = Object.fromEntries(kind.fields.map((f) => [f.key, sample(f)]));
      expect(schemaProblems(s, body), `${app}.${kind.id}`).toEqual([]);
      expect(schemaProblems(s, {}), `${app}.${kind.id} empty`).toEqual([]);
      expect(schemaProblems(s, { ...body, extra: [1, 2] }), `${app}.${kind.id} extra`).toEqual([]);
    }
  });

  it("refuses each wrong value exactly where parseBody does, naming the field and never the value", () => {
    for (const { app, kind } of KINDS) {
      const s = lifeSchema(app, kind);
      for (const f of kind.fields) {
        for (const v of wrongs(f)) {
          const mine = schemaProblems(s, { [f.key]: v });
          const zod = parseBody(kind.id, { [f.key]: v });
          expect(mine.map((p) => p.field), `${app}.${kind.id}.${f.key} = ${String(v).slice(0, 20)}`).toEqual([f.key]);
          expect(zod.ok, `${app}.${kind.id}.${f.key} in parseBody`).toBe(false);
          if (typeof v === "string" && v.length > 3) expect(mine[0]!.problem).not.toContain(v);
        }
      }
    }
    expect(schemaProblems(lifeSchemaOf("home.meal")!, "a meal")).toEqual([{ field: "", problem: "expected an object" }]);
  });

  it("reads numbers and booleans from front matter where the field's schema says so", () => {
    const meal = lifeSchemaOf("meal")!;
    expect(bodyFromFrontMatter(meal, { serves: "4", name: "12", other: "4" })).toEqual({ serves: 4, name: "12", other: "4" });
    expect(schemaProblems(meal, bodyFromFrontMatter(meal, { serves: "four" }))).toEqual([{ field: "serves", problem: "expected a number" }]);
  });
});

describe("checking a vault's life records", () => {
  async function vault(): Promise<string> {
    const root = await mkdtemp(join(tmpdir(), "reflect-life-check-"));
    dirs.push(root);
    return root;
  }

  it("passes a vault that keeps none and says what it checked", async () => {
    const c = await checkLifeRecords(await vault(), recordPaths("vault", "p"));
    expect(c.problems).toEqual([]);
    expect(c.kinds.map((k) => [k.app, k.kind, k.dir, k.records])).toEqual([
      ["friends", "friend", "belonging/friends", 0],
      ["friends", "group", "belonging/groups", 0],
      ["polis", "standing", "belonging/standing", 0],
    ]);
    expect(lifeCheckLine(c)).toBe("life records: none kept; checked belonging/friends (friends.friend), belonging/groups (friends.group), belonging/standing (polis.standing)");
  });

  it("names the record, its kind and the field of each problem, never the value", async () => {
    const root = await vault();
    await mkdir(join(root, "belonging/friends"), { recursive: true });
    await mkdir(join(root, "belonging/standing"), { recursive: true });
    await writeFile(join(root, "belonging/friends/ana.md"), "---\nkind: rival-of-old\nevery: every-week\nstate: close\n---\n\n# Ana\n");
    await writeFile(join(root, "belonging/friends/README.md"), "# Friends\n");
    await writeFile(join(root, "belonging/standing/deacon.md"), `---\nrole: ${"x".repeat(301)}\n---\n`);
    await writeFile(join(root, "belonging/standing/clerk.md"), '---\nrole: "unclosed\n---\n');
    const c = await checkLifeRecords(root, recordPaths("vault", "p"));
    expect(c.kinds.map((k) => k.records)).toEqual([1, 0, 2]);
    expect(c.problems.map(lifeProblemLine)).toEqual([
      "belonging/friends/ana.md (friends.friend): field kind: expected one of the field's choices (utility, pleasure, virtue)",
      "belonging/standing/clerk.md (polis.standing): the note has front matter that cannot be read",
      "belonging/standing/deacon.md (polis.standing): field role: expected at most 300 characters",
    ]);
    expect(c.problems.map(lifeProblemLine).join("\n")).not.toContain("rival-of-old");
    expect(lifeCheckLine(c)).toBe("life records: 3 checked against their schemas (friends.friend 1, friends.group 0, polis.standing 2)");
  });

  it("checks nothing in the older people layout", async () => {
    const c = await checkLifeRecords(await vault(), recordPaths("people", "p"));
    expect(c).toEqual({ kinds: [], problems: [] });
  });
});
