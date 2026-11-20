import { describe, expect, it, vi } from "vitest";
import { APPS } from "@reflect/core/life";

// The store's writes and the audit against a stand-in database: writes are recorded, sealing is the identity, so a
// test can see what would be kept and what was refused before anything was written.
const writes: { sql: string; params: unknown[] }[] = [];
let stored: Record<string, unknown>[] = [];
const query = async (sql: string, params: unknown[] = []) => {
  if (/^\s*(INSERT|UPDATE)/.test(sql)) writes.push({ sql, params });
  if (sql.startsWith("SELECT id, app, kind, state, body_ct")) return { rows: stored };
  if (sql.startsWith("SELECT user_id, app, kind, body_ct")) return { rows: stored };
  return { rows: [] };
};
vi.mock("@/db/pool", () => ({ db: () => ({ query }) }));
vi.mock("./crypto", () => ({ seal: (_u: string, t: string) => t, open: (_u: string, t: string) => t }));
vi.mock("./learn-store", () => ({ tx: async (f: (c: { query: typeof query }) => Promise<unknown>) => f({ query }) }));
const { addLifeRecord, auditLifeRecords, saveLifeRecord } = await import("./life-store");
const { auditBodies, auditLines, inputProblems } = await import("./life-validate");
const { Refused } = await import("@reflect/core/registry");

const kindOf = (app: string, kind: string) => APPS.find((a) => a.id === app)!.kinds.find((k) => k.id === kind)!;
const USER = "u1";
const ID = "00000000-0000-4000-8000-000000000001";
const row = (app: string, kind: string, body: unknown) => ({ id: ID, user_id: USER, app, kind, state: null, body_ct: JSON.stringify(body), created_at: "2026-11-20", updated_at: "2026-11-20" });

async function refusal(p: Promise<unknown>): Promise<InstanceType<typeof Refused>> {
  const e = await p.then(() => null, (x: unknown) => x);
  expect(e).toBeInstanceOf(Refused);
  return e as InstanceType<typeof Refused>;
}

describe("life record writes are checked against their kind's schema", () => {
  it("refuses a choice outside the field's options, naming the field and not the value", async () => {
    writes.length = 0;
    const e = await refusal(addLifeRecord(USER, "work", "inspiration", { title: "A role", type: "astronaut-wizard" }));
    expect(e.reason).toBe("bad-input");
    expect(e.message).toBe("Inspiration: type: expected one of the field's choices (job, career, venture, company, role, other)");
    expect(e.message).not.toContain("astronaut-wizard");
    expect(writes).toEqual([]);
  });

  it("refuses text where a number belongs, and a number out of range", async () => {
    writes.length = 0;
    const e = await refusal(addLifeRecord(USER, "home", "belonging", { name: "Bike", value: "about four hundred" }));
    expect(e.message).toMatch(/: value: expected a number$/);
    expect(e.message).not.toContain("four hundred");
    expect((await refusal(addLifeRecord(USER, "home", "belonging", { name: "Bike", value: -3 }))).message).toMatch(/value: expected at least 0$/);
    expect(writes).toEqual([]);
  });

  it("refuses a bad day, a check that is not true or false, text over its length and an unknown origin", async () => {
    expect((await refusal(addLifeRecord(USER, "body", "fitness", { goal: "Run a 5K", by: "next spring" }))).message).toMatch(/by: expected a day as YYYY-MM-DD$/);
    expect((await refusal(addLifeRecord(USER, "home", "belonging", { name: "Bike", proof: "maybe" }))).message).toMatch(/proof: expected true or false$/);
    expect((await refusal(addLifeRecord(USER, "home", "belonging", { name: "x".repeat(301) }))).message).toMatch(/name: expected at most 300 characters$/);
    expect((await refusal(addLifeRecord(USER, "work", "inspiration", { title: "A role", origins: "not-an-origin" }))).message).toMatch(/origins: expected a comma list of origin ids$/);
  });

  it("names every bad field at once", async () => {
    const e = await refusal(addLifeRecord(USER, "body", "measures", { height: "tall", activity: "always" }));
    expect(e.message).toMatch(/height: expected a number; activity: expected one of/);
  });

  it("keeps a valid write, with numbers sent as text the way a form sends them and keys the kind does not declare", async () => {
    writes.length = 0;
    await addLifeRecord(USER, "home", "belonging", { name: " Bike ", value: "$1,200", proof: "on", _sources: { value: ["receipt"] } });
    expect(writes).toHaveLength(1);
    expect(JSON.parse(writes[0]!.params[5] as string)).toEqual({ name: "Bike", value: 1200, proof: true });
    await addLifeRecord(USER, "work", "inspiration", { title: "A role", type: "career", note: "" });
    expect(writes.filter((w) => w.sql.startsWith("INSERT INTO life_record ("))).toHaveLength(2);
  });

  it("on a save, refuses only what the save changes: a field kept in an older shape is passed back and dropped", async () => {
    stored = [row("work", "inspiration", { title: "A role", type: "retired-option" })];
    writes.length = 0;
    await saveLifeRecord(USER, ID, { title: "A new title", type: "retired-option" });
    expect(JSON.parse(writes[0]!.params[2] as string)).toEqual({ title: "A new title" });
    const e = await refusal(saveLifeRecord(USER, ID, { title: "A role", type: "another-bad-one" }));
    expect(e.message).toMatch(/type: expected one of/);
    expect(writes).toHaveLength(1);
    stored = [];
  });

  it("reads the fields as cleanBody does: blanks clear, numbers come as text, checks as on and off", () => {
    const k = kindOf("home", "belonging");
    expect(inputProblems("home", k, { name: "", value: "", proof: "off" })).toEqual([]);
    expect(inputProblems("home", k, { value: "12.5", proof: false })).toEqual([]);
    expect(inputProblems("home", k, { value: "12abc" })).toEqual([{ field: "value", problem: "expected a number" }]);
  });
});

describe("the audit of stored life records", () => {
  it("counts per kind which bodies pass and which fields fail, with every kind listed", () => {
    const audit = auditBodies([
      { app: "home", kind: "belonging", body: { name: "Bike", value: 4 } },
      { app: "home", kind: "belonging", body: { name: "Bike", value: "four" } },
      { app: "home", kind: "belonging", body: { value: "five", proof: "yes" } },
      { app: "work", kind: "inspiration", body: { title: "A role", type: "nope" } },
      { app: "home", kind: "gone", body: {} },
    ]);
    expect(audit).toHaveLength(APPS.reduce((n, a) => n + a.kinds.length, 0) + 1);
    expect(audit.find((k) => k.kind === "belonging")).toEqual({
      app: "home", kind: "belonging", records: 3, pass: 1,
      fields: [{ field: "value", problem: "expected a number", records: 2 }, { field: "proof", problem: "expected true or false", records: 1 }],
    });
    expect(audit.find((k) => k.kind === "fitness")).toMatchObject({ records: 0, pass: 0, fields: [] });
    expect(audit.at(-1)).toMatchObject({ app: "home", kind: "gone", records: 1, pass: 0, fields: [{ field: "", problem: "is of no declared kind" }] });
    const lines = auditLines(audit);
    expect(lines).toContain("home.belonging: 1 of 3 pass; value expected a number (2); proof expected true or false (1)");
    expect(lines.at(-1)).toBe("life records: 1 of 5 stored bodies pass their schemas; kinds with failures: work.inspiration, home.belonging, home.gone");
    expect(lines.join("\n")).not.toMatch(/four|five|nope|"yes"/);
  });

  it("reads every stored body from the database, and a body that cannot be opened fails", async () => {
    stored = [row("home", "belonging", { name: "Bike", value: 4 }), { ...row("home", "belonging", {}), body_ct: "not json" }];
    const audit = await auditLifeRecords();
    expect(audit.find((k) => k.kind === "belonging")).toMatchObject({ records: 2, pass: 1, fields: [{ field: "", problem: "expected an object", records: 1 }] });
    stored = [];
  });
});
