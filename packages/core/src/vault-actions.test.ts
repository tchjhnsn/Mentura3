import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { PassThrough } from "node:stream";
import { afterAll, describe, expect, it } from "vitest";
import { filesChanges } from "./files-changes.ts";
import { filesJournal } from "./files-journal.ts";
import { filesPresentations } from "./files-presentations.ts";
import { initInstance } from "./instance.ts";
import { runVaultAction, VAULT_ACTIONS, vaultRunner, type VaultContext } from "./vault-actions.ts";
import { answerMcp, serveStdio } from "./vault-mcp.ts";

const dirs: string[] = [];
afterAll(async () => Promise.all(dirs.map((d) => rm(d, { recursive: true, force: true }))));

const NOW = new Date("2026-11-19T15:00:00Z");

async function vault(): Promise<VaultContext & { root: string }> {
  const root = await mkdtemp(join(tmpdir(), "reflect-vault-actions-"));
  dirs.push(root);
  const c = await initInstance(root, "Tester");
  return { root, userId: c.person, journal: filesJournal(root, c.person, { layout: "vault" }), changes: filesChanges(root), presentations: filesPresentations(root, c.person, { now: () => NOW }), now: NOW };
}

describe("a vault's actions", () => {
  it("are the guide, the life schemas, the journal's and the presentation gate's, read and own tier, and none publishes", () => {
    expect(VAULT_ACTIONS.map((a) => [a.id, a.tier])).toEqual([["reflect_guide", "read"], ["life_schema", "read"], ["list_entries", "read"], ["write_entry", "own"], ["get_entry", "read"], ["draft_presentation", "own"], ["check_presentation", "read"]]);
    expect(VAULT_ACTIONS.filter((a) => a.publishes !== undefined)).toEqual([]);
  });

  it("draft a presentation, update it until the gate is ready, and check it; an agent may draft but never approves", async () => {
    const v = await vault();
    const first = await runVaultAction(v, "draft_presentation", { channel: "in-person", role: "son", audience: "my parents" }, "mcp");
    if (first.held) throw new Error("held");
    expect(first.result).toMatchObject({ id: "2026-11-19-in-person", gate: { ready: false, missing: [{ item: "end" }] } });
    expect(await readFile(join(v.root, "presentation-policy.json"), "utf8")).toContain('"in-person"');
    const second = await runVaultAction(v, "draft_presentation", { channel: "in-person", id: "2026-11-19-in-person", end: "Honour my parents", relation: "their son", virtue: "shame", occasion: "ceremonial" }, "mcp");
    expect(second).toMatchObject({ held: false, result: { gate: { ready: true, rule: { role: "son", end: "honour my parents" } }, presentation: { audience: { who: "my parents", relation: "their son" }, virtue: { excess: "bashfulness", deficiency: "shamelessness" } } } });
    expect(await runVaultAction(v, "check_presentation", { id: "2026-11-19-in-person" }, "mcp")).toMatchObject({ changeId: null, result: { id: "2026-11-19-in-person", channel: "in-person", ready: true } });
    expect((await v.changes.recent(v.userId, 5)).map((c) => [c.actionId, c.source, c.status])).toEqual([["draft_presentation", "mcp", "done"], ["draft_presentation", "mcp", "done"]]);
    await expect(runVaultAction(v, "draft_presentation", { channel: "in-person", id: "nope" }, "mcp")).rejects.toThrow(/no presentation nope/);
    await expect(runVaultAction(v, "draft_presentation", { channel: "in-person", occasion: "festive" }, "mcp")).rejects.toMatchObject({ reason: "bad-input" });
    await expect(runVaultAction(v, "check_presentation", { id: "missing" }, "mcp")).rejects.toThrow(/no presentation missing/);
  });

  it("gates a publishing action by the record its input names", async () => {
    const v = await vault();
    const host = vaultRunner as unknown as { runAction: typeof vaultRunner.runAction };
    const post = { id: "post_page", title: "Post a page", description: "Posts.", tier: "outside" as const, on: [], publishes: "personal-site", run: async () => "posted" };
    const none = await host.runAction(post, v, { presentation: "nope" }, "cli");
    expect(none).toMatchObject({ held: true, gate: { ready: false, missing: [{ item: "presentation" }] } });
    await runVaultAction(v, "draft_presentation", { channel: "personal-site", role: "writer", end: "share what I have thought through", audience: "readers" }, "cli");
    expect(await host.runAction(post, v, { presentation: "2026-11-19-personal-site" }, "cli")).toMatchObject({ held: true, gate: { ready: true } });
  });

  it("write, list and read entries in the folder, and keep a write in changes.jsonl without its text", async () => {
    const v = await vault();
    const wrote = await runVaultAction(v, "write_entry", { text: "  Walked to the river. ", local_date: "2026-11-19" }, "cli");
    if (wrote.held) throw new Error("held");
    const id = (wrote.result as { id: string }).id;
    expect(wrote.changeId).toEqual(expect.any(String));
    const listed = await runVaultAction(v, "list_entries", {}, "mcp");
    expect(listed).toMatchObject({ held: false, changeId: null, result: [{ id, date: "2026-11-19", closed: true, text: "Walked to the river." }] });
    expect(await runVaultAction(v, "get_entry", { entry_id: id }, "mcp")).toMatchObject({ result: { id, text: "Walked to the river." } });
    const log = await readFile(join(v.root, "changes.jsonl"), "utf8");
    expect(log).not.toContain("river");
    expect(await v.changes.recent(v.userId, 5)).toMatchObject([{ actionId: "write_entry", source: "cli", tier: "own", status: "done", input: { local_date: "2026-11-19" }, after: { id } }]);
    // write_entry has no undo, in the app or here.
    await expect(vaultRunner.undoChange(v, wrote.changeId!)).rejects.toMatchObject({ reason: "not-undoable" });
  });

  it("refuses an unknown action, a bad input, a date that is not today, and a write to a vault that moved", async () => {
    const v = await vault();
    await expect(runVaultAction(v, "send_message", {}, "cli")).rejects.toMatchObject({ reason: "not-offered" });
    await expect(runVaultAction(v, "get_entry", { entry_id: "nope" }, "cli")).rejects.toMatchObject({ reason: "bad-input", message: "Read one entry: entry_id: expected a uuid" });
    await expect(runVaultAction(v, "write_entry", { text: "x", local_date: "2026-01-01" }, "cli")).rejects.toThrow(/person's today/);
    const moved = { ...v, movedTo: "neon" };
    await expect(runVaultAction(moved, "write_entry", { text: "x", local_date: "2026-11-19" }, "cli")).rejects.toThrow(/moved to neon/);
    expect((await runVaultAction(moved, "list_entries", {}, "cli")).held).toBe(false);
  });

  it("give a life kind's schema with its noun, category, good and community, by app.kind or by the kind's id", async () => {
    const v = await vault();
    const schema = async (kind: string, source: "cli" | "mcp" = "cli") => {
      const ran = await runVaultAction(v, "life_schema", { kind }, source);
      if (ran.held) throw new Error("held");
      expect(ran.changeId).toBeNull();
      return ran.result;
    };
    const meal = await schema("home.meal", "mcp");
    expect(meal).toMatchObject({ $id: "urn:reflect:schema:life:home.meal", "x-reflect": { app: "home", kind: "meal", noun: "meal", category: "substance", good: "body", community: "household" } });
    expect(await schema("meal")).toEqual(meal);
    expect(await schema("friends:friend")).toMatchObject({ "x-reflect": { app: "friends", kind: "friend" } });
    await expect(runVaultAction(v, "life_schema", { kind: "unicorn" }, "cli")).rejects.toThrow(/no life kind unicorn\. The kinds are: work\./);
    await expect(runVaultAction(v, "life_schema", {}, "cli")).rejects.toMatchObject({ reason: "bad-input" });
    expect(await v.changes.recent(v.userId, 5)).toEqual([]);
  });
});

describe("the MCP server over a vault", () => {
  it("initializes, lists the tools and calls one", async () => {
    const v = await vault();
    const open = async () => v;
    expect(await answerMcp({ jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-03-26" } }, open)).toMatchObject({ id: 1, result: { protocolVersion: "2025-03-26", capabilities: { tools: {} } } });
    expect(await answerMcp({ jsonrpc: "2.0", method: "notifications/initialized" }, open)).toBeNull();
    const tools = await answerMcp({ jsonrpc: "2.0", id: 2, method: "tools/list" }, open);
    expect((tools?.result as { tools: { name: string }[] }).tools.map((t) => t.name)).toEqual(["reflect_guide", "life_schema", "list_entries", "write_entry", "get_entry", "draft_presentation", "check_presentation"]);
    const wrote = await answerMcp({ jsonrpc: "2.0", id: 3, method: "tools/call", params: { name: "write_entry", arguments: { text: "Cold.", local_date: "2026-11-19" } } }, open);
    expect(wrote?.result).toMatchObject({ content: [{ type: "text" }], _meta: { change: expect.any(String) } });
    expect((await v.changes.recent(v.userId, 1))[0]!.source).toBe("mcp");
    const bad = await answerMcp({ jsonrpc: "2.0", id: 4, method: "tools/call", params: { name: "get_entry", arguments: {} } }, open);
    expect(bad?.result).toEqual({ content: [{ type: "text", text: "Read one entry: entry_id: required" }], isError: true });
    expect((await answerMcp({ jsonrpc: "2.0", id: 5, method: "tools/call", params: { name: "keep_legacy_plan" } }, open))?.error?.code).toBe(-32602);
    expect((await answerMcp({ jsonrpc: "2.0", id: 6, method: "resources/list" }, open))?.error?.code).toBe(-32601);
  });

  it("serves the stdio transport, one message per line", async () => {
    const v = await vault();
    const input = new PassThrough();
    const out: string[] = [];
    const done = serveStdio(input, (l) => out.push(l), async () => v);
    input.end(['{"jsonrpc":"2.0","id":1,"method":"ping"}', "not json", '{"jsonrpc":"2.0","method":"notifications/initialized"}', '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"list_entries","arguments":{"limit":1}}}', ""].join("\n"));
    await done;
    expect(out.map((l) => JSON.parse(l) as { id: unknown })).toMatchObject([{ id: 1, result: {} }, { id: null, error: { code: -32700 } }, { id: 2, result: { content: [{ type: "text", text: "[]" }] } }]);
  });
});
