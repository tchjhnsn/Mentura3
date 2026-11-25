import { describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { businessFolder, changesSince, contentOf, memoryRecords, PULL_LIMIT, sendable, writersIn, type StoredPath } from "./sync-records";

const sha = (text: string) => createHash("sha256").update(text, "utf8").digest("hex");
const at = "2026-11-25T08:00:00.000Z";

type Row = StoredPath & { content: string };
const row = (path: string, content: string, seq: number): Row => ({ path, content, version: `v${seq}`, seq: String(seq), writtenAt: at });

const HARBOR = JSON.stringify({ id: "harbor", name: "Harbor" });
const MILL = JSON.stringify({ id: "mill", name: "Mill" });
const PROBLEM = `${JSON.stringify({ statement: "founders lose a day a week" }, null, 2)}\n`;

const account = (): Row[] => [
  row("harbor/venture.json", HARBOR, 1),
  row("harbor/foundation/problem.json", PROBLEM, 4),
  row("harbor/decisions/pricing.json", `${JSON.stringify({ id: "pricing" })}\n`, 6),
  row("mill/venture.json", MILL, 2),
  row("mill/foundation/problem.json", `${JSON.stringify({ statement: "other" })}\n`, 5),
];

describe("finding the business inside an account's store", () => {
  it("finds the folder whose venture.json names it", async () => {
    const store = memoryRecords(account());
    expect(await businessFolder(store, "harbor")).toBe("harbor");
    expect(await businessFolder(store, "mill")).toBe("mill");
  });

  it("finds a store rooted at the business itself", async () => {
    expect(await businessFolder(memoryRecords([row("venture.json", HARBOR, 1)]), "harbor")).toBe("");
  });

  it("gives null for a business this account does not hold", async () => {
    expect(await businessFolder(memoryRecords(account()), "quarry")).toBe(null);
  });

  it("walks past a venture.json that is not JSON", async () => {
    const rows = [row("broken/venture.json", "{", 1), ...account()];
    expect(await businessFolder(memoryRecords(rows), "harbor")).toBe("harbor");
  });
});

describe("changes since a point", () => {
  it("sends every record of the business and nothing of another", async () => {
    const page = await changesSince(memoryRecords(account()), "harbor", null);
    expect(page.business).toBe("harbor");
    expect(page.point).toBe("6");
    expect(page.records.map((r) => r.path)).toEqual(["venture.json", "foundation/problem.json", "decisions/pricing.json"]);
  });

  it("sends only what moved above the point, oldest first", async () => {
    const page = await changesSince(memoryRecords(account()), "harbor", "4");
    expect(page.records.map((r) => r.path)).toEqual(["decisions/pricing.json"]);
  });

  it("answers with no records and the store's point when nothing moved", async () => {
    const page = await changesSince(memoryRecords(account()), "harbor", "6");
    expect(page).toEqual({ business: "harbor", point: "6", records: [] });
  });

  it("gives each record its version, the hash of its bytes and its content parsed", async () => {
    const page = await changesSince(memoryRecords(account()), "harbor", "1");
    const problem = page.records.find((r) => r.path === "foundation/problem.json");
    expect(problem).toEqual({
      path: "foundation/problem.json",
      version: "v4",
      sha256: sha(PROBLEM),
      content: { statement: "founders lose a day a week" },
      by: "the business store",
      at,
    });
  });

  it("names the writer from the business's provenance log, by content hash", async () => {
    const lines = [
      { at, entity: "foundation/problem.json", activity: "write", agent: { kind: "agent", id: "foundation-agent" }, sha256: sha("an older draft") },
      { at, entity: "foundation/problem.json", activity: "write", agent: { kind: "person", id: "Ada" }, sha256: sha(PROBLEM) },
      { at, entity: "decisions/pricing.json", activity: "decide", agent: { kind: "person" } },
    ];
    const rows = [...account(), row("harbor/provenance.jsonl", `${lines.map((l) => JSON.stringify(l)).join("\n")}\n`, 7)];
    const page = await changesSince(memoryRecords(rows), "harbor", null);
    expect(page.records.find((r) => r.path === "foundation/problem.json")?.by).toBe("Ada");
    expect(page.records.find((r) => r.path === "decisions/pricing.json")?.by).toBe("person");
    expect(page.records.find((r) => r.path === "venture.json")?.by).toBe("the business store");
  });

  it("never sends a log, a cache or a dot folder", async () => {
    const rows = [
      ...account(),
      row("harbor/provenance.jsonl", "", 8),
      row("harbor/.naive/decision-index.json", "{}", 9),
      row("harbor/governance/detectors/gate.trials.jsonl", "", 10),
    ];
    const page = await changesSince(memoryRecords(rows), "harbor", null);
    expect(page.records.map((r) => r.path)).toEqual(["venture.json", "foundation/problem.json", "decisions/pricing.json"]);
    expect(page.point).toBe("10");
  });

  it("refuses a business the store does not hold", async () => {
    await expect(changesSince(memoryRecords(account()), "quarry", null)).rejects.toThrow(/does not hold/);
  });

  it("stops a long pull at the last record it sent, so the next pull takes the rest", async () => {
    const rows: Row[] = [row("venture.json", HARBOR, 1)];
    for (let i = 0; i < PULL_LIMIT + 5; i++) rows.push(row(`products/p${i}.json`, "{}", i + 2));
    const first = await changesSince(memoryRecords(rows), "harbor", null);
    expect(first.records).toHaveLength(PULL_LIMIT);
    // The point stops at the last record sent, not at the store's head, so nothing between them is skipped.
    expect(first.point).toBe(String(PULL_LIMIT));
    const rest = await changesSince(memoryRecords(rows), "harbor", first.point);
    expect(rest.records).toHaveLength(6);
    expect(rest.point).toBe(String(PULL_LIMIT + 6));
  });

  it("gives the same answer when it runs twice", async () => {
    const store = memoryRecords(account());
    expect(await changesSince(store, "harbor", "1")).toEqual(await changesSince(store, "harbor", "1"));
  });
});

describe("the small rules", () => {
  it("counts a log, a cache and a dot folder as not sendable", () => {
    expect(sendable("foundation/problem.json")).toBe(true);
    expect(sendable("provenance.jsonl")).toBe(false);
    expect(sendable(".naive/decision-index.json")).toBe(false);
    expect(sendable("programs/finance.md")).toBe(true);
  });

  it("parses a JSON record and leaves anything else as text", () => {
    expect(contentOf("a.json", '{"x":1}')).toEqual({ x: 1 });
    expect(contentOf("a.json", "{not json")).toBe("{not json");
    expect(contentOf("programs/finance.md", "# Finance\n")).toBe("# Finance\n");
  });

  it("reads no writer from an empty or broken log", () => {
    expect(writersIn(undefined).size).toBe(0);
    expect(writersIn("\n{\nnot a line\n").size).toBe(0);
    expect(writersIn(JSON.stringify({ entity: "a.json", activity: "write" })).size).toBe(0);
  });
});
