import { beforeEach, describe, expect, it, vi } from "vitest";
import { randomUUID } from "node:crypto";
import type { Presentation } from "@reflect/core/presentation";
import { defaultPolicy } from "@reflect/core/presentation";
import type { Presentations } from "../presentation-store";
import type { ChangeLog, HeldChange, LoggedChange, NewChange } from "./types";

// A write to the person's site repository through the presentation gate (Reflect framework plan, step 6): site_edit
// always, and connector_act only when it writes to the linked repository through GitHub. The change log and the
// presentations are in memory; the GitHub connector is mocked as site-repo.test.ts mocks it, so a commit is a file
// written in `files`. A Notion connector stands for every other service. Nothing reaches a database or the network.
const calls: { name: string; args: Record<string, unknown> }[] = [];
const files: Record<string, string> = {};
const CONNECTIONS = [
  { id: "c1", connector: "github", name: "GitHub", status: "connected" },
  { id: "c2", connector: "notion", name: "Notion", status: "connected" },
];
const TOOLS: Record<string, { name: string; annotations?: { readOnlyHint?: boolean } }[]> = {
  c1: [{ name: "get_file_contents", annotations: { readOnlyHint: true } }, { name: "create_or_update_file" }, { name: "push_files" }],
  c2: [{ name: "create_page" }],
};
function call(_u: string, _c: string, name: string, args: Record<string, unknown>) {
  calls.push({ name, args });
  if (name === "get_file_contents") {
    const p = String(args.path);
    if (!(p in files)) throw new Error("Not Found");
    return { texts: [`successfully downloaded text file (SHA: ${"a".repeat(40)})`], resources: [files[p]!], structured: null };
  }
  if (name === "create_or_update_file") files[String(args.path)] = String(args.content);
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
  siteOf: async () => ({ template: "plain", domain: null, domainCheckedAt: null, repo: { repo: "tchjhnsn/tcjcafe", branch: "main", folder: "app/blog/posts", ext: "mdx" } }),
  postRepoPath: async () => null,
  setPostRepoPath: async () => undefined,
  publishWork: async () => { throw new Error("not in this test"); },
  subscribersToMail: async () => [],
}));
vi.mock("../work-store", () => ({ getWork: async () => null }));
vi.mock("../profile-store", () => ({ profileSettings: async () => ({ handle: "torian" }), profilePage: async () => ({ name: "Torian" }) }));
vi.mock("../site-connectors", () => ({ sendSiteMail: async () => null }));

const { runAction, approveChange } = await import("./run");
const { draftPresentationAction } = await import("./presentations");
const { siteEditAction, siteFilesAction, connectorActAction } = await import("./marketplace");

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

/** A person's presentations in memory, with the default policy. */
function memoryPresentations(): Presentations {
  const records = new Map<string, Presentation>();
  return {
    policy: async () => defaultPolicy("Torian"),
    ensurePolicy: async () => ({ written: false }),
    get: async (id) => records.get(id) ?? null,
    put: async (p) => void records.set(p.id, structuredClone(p)),
    list: async () => [...records.values()].sort((a, b) => b.created.localeCompare(a.created) || b.id.localeCompare(a.id)),
  };
}

const now = new Date("2026-11-20T15:00:00.000Z");
let ctx: { userId: string; now: Date; changes: ReturnType<typeof memoryLog>; presentations: Presentations };
const commits = () => calls.filter((c) => c.name === "create_or_update_file" || c.name === "push_files");
const statusOf = (id: string) => ctx.changes.rows.find((r) => r.id === id)?.status;

async function draft(fields: Record<string, string>) {
  const ran = await runAction(draftPresentationAction, ctx, { channel: "personal-site", ...fields }, "chat");
  if (ran.held) throw new Error("drafting is never held");
  return ran.result;
}
/** A record the default policy's site owner rule passes: a plain change to the site's code. */
const maintain = () => draft({ role: "site owner", end: "maintain my site", audience: "anyone who looks me up" });

const EDIT = { path: "app/page.tsx", content: "export default function Page() {\n  return <h1>Hello</h1>;\n}\n", message: "Say hello on the home page" };

describe("site_edit through the presentation gate", () => {
  beforeEach(() => {
    calls.length = 0;
    for (const k of Object.keys(files)) delete files[k];
    files["app/page.tsx"] = "export default function Page() {\n  return <h1>Hi</h1>;\n}\n";
    ctx = { userId: "u1", now, changes: memoryLog(), presentations: memoryPresentations() };
  });

  it("holds an edit from the chat and MCP with what will be committed and the gate's answer, and commits nothing", async () => {
    for (const source of ["chat", "mcp"] as const) {
      const ran = await runAction(siteEditAction, ctx, { ...EDIT, presentation: "2026-11-20-personal-site" }, source);
      if (!ran.held) throw new Error(`a site edit is always held (${source})`);
      expect(ran.gate).toMatchObject({ ready: false, missing: [{ item: "presentation" }] });
      expect(ran.preview).toContain('Commit "Say hello on the home page" to tchjhnsn/tcjcafe on main; your host deploys it.');
      expect(ran.preview).toContain("Changes app/page.tsx: 1 added, 1 removed.\n-   return <h1>Hi</h1>;\n+   return <h1>Hello</h1>;");
      expect(ran.preview).toContain("On personal-site. Not ready to go out.");
    }
    expect(commits()).toEqual([]);
  });

  it("commits when the person taps Send and the record passes the gate, and one record covers the next edit too", async () => {
    const d = await maintain();
    expect(d).toMatchObject({ id: "2026-11-20-personal-site", gate: { ready: true, rule: { role: "site owner", end: "maintain my site" } } });
    const ran = await runAction(siteEditAction, ctx, { ...EDIT, presentation: d.id }, "chat");
    if (!ran.held) throw new Error("a site edit is always held");
    expect(ran.preview).toContain("On personal-site. The presentation record is complete.");
    expect(ran.preview).toContain(`Presentation record: ${d.id}.`);
    expect(commits()).toEqual([]);

    const ok = await approveChange(ctx, ran.changeId, "page");
    expect(ok.result).toEqual({ path: "app/page.tsx", repo: "tchjhnsn/tcjcafe" });
    expect(commits()).toHaveLength(1);
    expect(commits()[0]!.args).toMatchObject({ owner: "tchjhnsn", repo: "tcjcafe", branch: "main", path: "app/page.tsx", message: "Say hello on the home page", sha: "a".repeat(40) });
    expect(files["app/page.tsx"]).toBe(EDIT.content);
    expect(ctx.changes.rows.find((r) => r.id === ran.changeId)).toMatchObject({ status: "done", after: { repo: "tchjhnsn/tcjcafe", path: "app/page.tsx", presentation: d.id } });

    // site_files offers the ready record, so the chat can ask whether it covers the next change.
    const read = await runAction(siteFilesAction, ctx, { path: "app/page.tsx" }, "chat");
    expect(read).toMatchObject({ held: false, result: { text: EDIT.content, presentation: { id: d.id, role: "site owner", end: "maintain my site" } } });
    const next = await runAction(siteEditAction, ctx, { path: "app/about.tsx", content: "about\n", message: "Add an about page", presentation: d.id }, "mcp");
    if (!next.held) throw new Error("a site edit is always held");
    expect(next.preview).toContain("New file app/about.tsx, 1 line.\n+ about");
    await approveChange(ctx, next.changeId, "page");
    expect(files["app/about.tsx"]).toBe("about\n");
  });

  it("refuses an unready record with not-presented and keeps the edit held", async () => {
    const d = await draft({ role: "site owner", end: "maintain my site" });
    expect(d.gate).toMatchObject({ ready: false, missing: [{ item: "audience" }] });
    const ran = await runAction(siteEditAction, ctx, { ...EDIT, presentation: d.id }, "chat");
    if (!ran.held) throw new Error("a site edit is always held");
    await expect(approveChange(ctx, ran.changeId, "page")).rejects.toMatchObject({ reason: "not-presented", message: expect.stringContaining("the audience") });
    expect(statusOf(ran.changeId)).toBe("held");
    expect(commits()).toEqual([]);
  });

  it("refuses an agent's approval with person-only, even with a ready record", async () => {
    const d = await maintain();
    const ran = await runAction(siteEditAction, ctx, { ...EDIT, presentation: d.id }, "mcp");
    if (!ran.held) throw new Error("a site edit is always held");
    for (const by of ["mcp", "chat", "workflow"] as const) await expect(approveChange(ctx, ran.changeId, by)).rejects.toMatchObject({ reason: "person-only" });
    expect(statusOf(ran.changeId)).toBe("held");
    expect(commits()).toEqual([]);
  });
});

describe("connector_act through the presentation gate, only for a GitHub write to the site repository", () => {
  beforeEach(() => {
    calls.length = 0;
    for (const k of Object.keys(files)) delete files[k];
    ctx = { userId: "u1", now, changes: memoryLog(), presentations: memoryPresentations() };
  });

  const push = { connector: "github", tool: "push_files", arguments: { owner: "tchjhnsn", repo: "tcjcafe", branch: "main", files: [{ path: "a.md", content: "a" }], message: "Add a" } };

  it("gates a GitHub write to the site repository: held with its gate, refused without a ready record, refused for an agent", async () => {
    const ran = await runAction(connectorActAction, ctx, push, "chat");
    if (!ran.held) throw new Error("connector_act is held for the chat");
    expect(ran.gate).toMatchObject({ ready: false, missing: [{ item: "presentation" }] });
    expect(ran.preview).toContain("It writes to your site's repository, tchjhnsn/tcjcafe; your host deploys it.");
    expect(ran.preview).toContain("On personal-site. Not ready to go out.");
    await expect(approveChange(ctx, ran.changeId, "page")).rejects.toMatchObject({ reason: "not-presented" });

    const d = await maintain();
    const ready = await runAction(connectorActAction, ctx, { ...push, presentation: d.id }, "mcp");
    if (!ready.held) throw new Error("connector_act is held for MCP");
    await expect(approveChange(ctx, ready.changeId, "chat")).rejects.toMatchObject({ reason: "person-only" });
    expect(commits()).toEqual([]);
    expect(await approveChange(ctx, ready.changeId, "page")).toMatchObject({ result: { connector: "GitHub", tool: "push_files" } });
    expect(commits()).toHaveLength(1);
  });

  it("does not gate a write to another repository, another service or a read-only tool", async () => {
    const other = await runAction(connectorActAction, ctx, { ...push, arguments: { ...push.arguments, repo: "notes" } }, "chat");
    const notion = await runAction(connectorActAction, ctx, { connector: "notion", tool: "create_page", arguments: { title: "tchjhnsn/tcjcafe" } }, "chat");
    const read = await runAction(connectorActAction, ctx, { connector: "github", tool: "get_file_contents", arguments: { owner: "tchjhnsn", repo: "tcjcafe", path: "a.md" } }, "chat");
    for (const ran of [other, notion, read]) {
      if (!ran.held) throw new Error("connector_act is held for the chat");
      expect(ran.gate).toBeUndefined();
      expect(ran.preview).not.toContain("On personal-site");
    }
    if (!other.held || !notion.held) throw new Error("held");
    // With no gate, the person's Send runs them as before.
    await approveChange(ctx, other.changeId, "page");
    await approveChange(ctx, notion.changeId, "page");
    expect(calls.map((c) => c.name)).toEqual(["push_files", "create_page"]);
  });
});
