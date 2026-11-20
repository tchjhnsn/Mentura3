import { beforeEach, describe, expect, it, vi } from "vitest";
import { randomUUID } from "node:crypto";
import type { ChangeLog, HeldChange, LoggedChange, NewChange } from "./types";

// Reflect outputs files and never a website's code (Torian, 2026-11-20 03:16Z, "Files out, no site code"). Ask may read
// the site's repository with site_files; connector_act refuses a write to it, when asked for and again at Send, and
// still holds every other write for the person. The GitHub connector is mocked as site-repo.test.ts mocks it; a Notion
// connector stands for every other service. Nothing reaches a database or the network.
const calls: { name: string; args: Record<string, unknown> }[] = [];
const files: Record<string, string> = { "app/page.tsx": "export default function Page() {}\n" };
const CONNECTIONS = [
  { id: "c1", connector: "github", name: "GitHub", status: "connected" },
  { id: "c2", connector: "notion", name: "Notion", status: "connected" },
];
const TOOLS: Record<string, { name: string; annotations?: { readOnlyHint?: boolean } }[]> = {
  c1: [{ name: "get_file_contents", annotations: { readOnlyHint: true } }, { name: "create_or_update_file" }, { name: "push_files" }],
  c2: [{ name: "create_page" }],
};
let linked = true;
function call(_u: string, _c: string, name: string, args: Record<string, unknown>) {
  calls.push({ name, args });
  if (name === "get_file_contents") {
    const p = String(args.path);
    if (!(p in files)) throw new Error("Not Found");
    return { texts: [`successfully downloaded text file (SHA: ${"a".repeat(40)})`], resources: [files[p]!], structured: null };
  }
  return { texts: ["ok"], resources: [], structured: null };
}
vi.mock("../mcp-connections", () => ({
  connectedTo: async () => CONNECTIONS[0],
  connectionsOf: async () => CONNECTIONS,
  toolsOf: async (_u: string, id: string) => TOOLS[id] ?? [],
  callToolTexts: async (u: string, c: string, name: string, args: Record<string, unknown>) => call(u, c, name, args),
  callTool: async (u: string, c: string, name: string, args: Record<string, unknown>) => (call(u, c, name, args), { text: "ok", structured: null }),
}));
vi.mock("../site-store", () => ({
  siteOf: async () => ({ template: "plain", domain: null, domainCheckedAt: null, repo: linked ? { repo: "tchjhnsn/tcjcafe", branch: "main", folder: "app/blog/posts", ext: "mdx" } : null }),
  siteDataFolder: async () => "content/reflect",
  postRepoPath: async () => null,
  setPostRepoPath: async () => undefined,
}));

const { runAction, approveChange } = await import("./run");
const { siteFilesAction, connectorActAction } = await import("./marketplace");

/** The change log in memory, as Postgres keeps it. */
function memoryLog(): ChangeLog & { rows: LoggedChange[] } {
  const rows: LoggedChange[] = [];
  const find = (userId: string, id: string) => rows.find((r) => r.id === id && r.userId === userId);
  return {
    rows,
    async add(c: NewChange) {
      const id = randomUUID();
      rows.push({ ...c, id, status: "done", preview: null, createdAt: new Date(), undoneAt: null });
      return id;
    },
    async get(userId, id) { return find(userId, id) ?? null; },
    async recent(userId, limit) { return rows.filter((r) => r.userId === userId).reverse().slice(0, limit); },
    async markUndone() { return false; },
    async hold(c: HeldChange) {
      const id = randomUUID();
      rows.push({ ...c, id, before: null, after: null, status: "held", createdAt: new Date(), undoneAt: null });
      return id;
    },
    async held(userId, since, limit) { return rows.filter((r) => r.userId === userId && r.status === "held" && r.createdAt >= since).reverse().slice(0, limit); },
    async claim(userId, id) {
      const r = find(userId, id);
      if (!r || r.status !== "held") return false;
      r.status = "done";
      return true;
    },
    async settle(userId, id, c) { Object.assign(find(userId, id) ?? {}, c); },
    async release(userId, id) { const r = find(userId, id); if (r?.status === "done") r.status = "held"; },
    async decline(userId, id) {
      const r = find(userId, id);
      if (!r || r.status !== "held") return false;
      r.status = "declined";
      return true;
    },
  };
}

let ctx: { userId: string; changes: ReturnType<typeof memoryLog> };
const writes = () => calls.filter((c) => c.name !== "get_file_contents");
const push = { connector: "github", tool: "push_files", arguments: { owner: "tchjhnsn", repo: "tcjcafe", branch: "main", files: [{ path: "app/page.tsx", content: "x" }], message: "Change the home page" } };

describe("no site code from Reflect", () => {
  beforeEach(() => {
    calls.length = 0;
    linked = true;
    ctx = { userId: "u1", changes: memoryLog() };
  });

  it("refuses a connector write to the linked site repository from every source, saying the site's code lives in its own repository", async () => {
    for (const source of ["chat", "mcp", "page"] as const) {
      await expect(runAction(connectorActAction, ctx, push, source), source).rejects.toThrow(/Reflect does not change your site's code\. Your site's code lives in its own repository: change it there with Claude Code or Virtu/);
    }
    const single = { connector: "GitHub", tool: "create_or_update_file", arguments: { repository: "https://github.com/tchjhnsn/tcjcafe", path: "app/page.tsx", content: "x" } };
    await expect(runAction(connectorActAction, ctx, single, "chat")).rejects.toThrow(/tchjhnsn\/tcjcafe is your site's repository/);
    expect(ctx.changes.rows).toEqual([]);
    expect(writes()).toEqual([]);
  });

  it("refuses at Send a write held before the repository was linked", async () => {
    linked = false;
    const ran = await runAction(connectorActAction, ctx, push, "chat");
    if (!ran.held) throw new Error("connector_act is held for the chat");
    linked = true;
    await expect(approveChange(ctx, ran.changeId, "page")).rejects.toThrow(/Reflect does not change your site's code/);
    expect(writes()).toEqual([]);
    expect(ctx.changes.rows.find((r) => r.id === ran.changeId)?.status).toBe("held");
  });

  it("holds a write to another repository or service for the person, with no gate, and runs it on their Send", async () => {
    const other = await runAction(connectorActAction, ctx, { ...push, arguments: { ...push.arguments, repo: "notes" } }, "chat");
    const notion = await runAction(connectorActAction, ctx, { connector: "notion", tool: "create_page", arguments: { title: "tchjhnsn/tcjcafe" } }, "mcp");
    for (const ran of [other, notion]) {
      if (!ran.held) throw new Error("connector_act is held");
      expect(ran.gate).toBeUndefined();
      await approveChange(ctx, ran.changeId, "page");
    }
    expect(writes().map((c) => c.name)).toEqual(["push_files", "create_page"]);
  });

  it("reads the site's files with site_files, and offers nothing that writes them", async () => {
    const read = await runAction(siteFilesAction, ctx, { path: "app/page.tsx" }, "chat");
    expect(read).toEqual({ held: false, changeId: null, result: { repo: "tchjhnsn/tcjcafe", path: "app/page.tsx", text: files["app/page.tsx"] } });
    expect(siteFilesAction.tier).toBe("read");
    expect(siteFilesAction.description).toContain("Never offer to change the site's code");
    expect(connectorActAction.publishes).toBeUndefined();
    expect(writes()).toEqual([]);
  });
});
