import { beforeEach, describe, expect, it, vi } from "vitest";
import { randomUUID } from "node:crypto";
import type { Presentation } from "@reflect/core/presentation";
import { defaultPolicy } from "@reflect/core/presentation";
import type { Presentations } from "../presentation-store";
import type { ChangeLog, HeldChange, LoggedChange, NewChange } from "./types";

// The site publish through the presentation gate (Reflect framework plan, step 6). The change log and the
// presentations are in memory; the GitHub connector is mocked as site-repo.test.ts mocks it, so a commit is a file
// written in `files`. The site, the work and the profile are stubbed; nothing reaches a database.
const calls: { name: string; args: Record<string, unknown> }[] = [];
const files: Record<string, string> = {};
let repoPathOf: string | null = null;

vi.mock("../mcp-connections", () => ({
  connectedTo: async () => ({ id: "c1", connector: "github", name: "GitHub" }),
  toolsOf: async () => [{ name: "get_file_contents" }],
  callToolTexts: async (_u: string, _c: string, name: string, args: Record<string, unknown>) => {
    calls.push({ name, args });
    if (name === "get_file_contents") {
      const p = String(args.path);
      if (p.endsWith("/")) return { texts: [JSON.stringify(Object.keys(files).filter((f) => f.startsWith(p)).map((path) => ({ path, type: "file" })))], resources: [], structured: null };
      if (!(p in files)) throw new Error("Not Found");
      return { texts: [`successfully downloaded text file (SHA: ${"a".repeat(40)})`], resources: [files[p]!], structured: null };
    }
    if (name === "create_or_update_file") files[String(args.path)] = String(args.content);
    return { texts: ["ok"], resources: [], structured: null };
  },
}));
const post = { id: "p1", workId: "", slug: "on-craft", kind: "essay", title: "On craft", body: "The work is the thing.", publishedAt: "2026-11-19T20:00:00.000Z", updatedAt: "2026-11-19T20:00:00.000Z" };
const published: string[] = [];
vi.mock("../site-store", () => ({
  siteOf: async () => ({ template: "plain", domain: null, domainCheckedAt: null, repo: { repo: "tchjhnsn/tcjcafe", branch: "main", folder: "app/blog/posts", ext: "mdx" } }),
  postRepoPath: async () => repoPathOf,
  setPostRepoPath: async (_u: string, _p: string, path: string | null) => { repoPathOf = path; },
  publishWork: async (_u: string, workId: string) => (published.push(workId), { ...post, workId }),
  subscribersToMail: async () => [],
}));
vi.mock("../work-store", () => ({ getWork: async (_u: string, id: string) => ({ id, title: "On craft", kind: "essay", body: "The work is the thing." }) }));
vi.mock("../profile-store", () => ({ profileSettings: async () => ({ handle: "torian" }), profilePage: async () => ({ name: "Torian" }) }));
vi.mock("../site-connectors", () => ({ sendSiteMail: async () => null }));

const { runAction, approveChange, pendingChanges } = await import("./run");
const { draftPresentationAction, checkPresentationAction, publishToSiteAction, sitePresenting } = await import("./presentations");

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
function memoryPresentations(): Presentations & { records: Map<string, Presentation> } {
  const records = new Map<string, Presentation>();
  return {
    records,
    policy: async () => defaultPolicy("Torian"),
    ensurePolicy: async () => ({ written: false }),
    get: async (id) => records.get(id) ?? null,
    put: async (p) => void records.set(p.id, structuredClone(p)),
    list: async () => [...records.values()].sort((a, b) => b.created.localeCompare(a.created)),
  };
}

const WORK = "5f0e8a3c-7d0b-4f39-9f43-1f1d6f6f2a11";
const now = new Date("2026-11-19T21:00:00.000Z");
let ctx: { userId: string; now: Date; changes: ReturnType<typeof memoryLog>; presentations: ReturnType<typeof memoryPresentations> };

const committed = () => calls.filter((c) => c.name === "create_or_update_file");

async function draft(fields: Record<string, string>) {
  const ran = await runAction(draftPresentationAction, ctx, { channel: "personal-site", ...fields }, "chat");
  if (ran.held) throw new Error("drafting is never held");
  return ran.result;
}

describe("the site publish through the presentation gate", () => {
  beforeEach(() => {
    calls.length = 0;
    published.length = 0;
    for (const k of Object.keys(files)) delete files[k];
    repoPathOf = null;
    ctx = { userId: "u1", now, changes: memoryLog(), presentations: memoryPresentations() };
  });

  it("holds a publish from every source, the page's too, and commits nothing", async () => {
    for (const source of ["chat", "mcp", "page"] as const) {
      const ran = await runAction(publishToSiteAction, ctx, { work_id: WORK, email: false, presentation: "2026-11-19-personal-site" }, source);
      expect(ran.held, source).toBe(true);
      if (!ran.held) continue;
      expect(ran.gate).toMatchObject({ ready: false, missing: [{ item: "presentation" }] });
      expect(ran.preview).toContain('Publish "On craft" to your site');
      expect(ran.preview).toContain("committed to tchjhnsn/tcjcafe on main");
      expect(ran.preview).toContain("On personal-site. Not ready to go out.");
    }
    expect(committed()).toEqual([]);
    expect(published).toEqual([]);
    expect((await pendingChanges(ctx)).map((p) => [p.action, p.source])).toEqual([["publish_to_site", "page"], ["publish_to_site", "mcp"], ["publish_to_site", "chat"]]);
  });

  it("runs the commit when the person approves on the page and the record passes the gate", async () => {
    const d = await draft({ role: "writer", end: "share what I have thought through", audience: "readers of my site", relation: "a stranger to most" });
    expect(d).toMatchObject({ id: "2026-11-19-personal-site", gate: { ready: true, rule: { role: "writer" } } });
    expect(await runAction(checkPresentationAction, ctx, { id: d.id }, "mcp")).toMatchObject({ held: false, changeId: null, result: { ready: true } });
    const ran = await runAction(publishToSiteAction, ctx, { work_id: WORK, email: false, presentation: d.id }, "chat");
    if (!ran.held) throw new Error("a publish is always held");
    expect(ran.gate).toEqual(expect.objectContaining({ ready: true }));
    expect(committed()).toEqual([]);

    const ok = await approveChange(ctx, ran.changeId, "page");
    expect(ok.result).toMatchObject({ slug: "on-craft", href: "/p/torian/on-craft", repo: "app/blog/posts/on-craft.mdx" });
    expect(committed()).toHaveLength(1);
    expect(committed()[0]!.args).toMatchObject({ owner: "tchjhnsn", repo: "tcjcafe", branch: "main", message: 'Publish "On craft" from Reflect' });
    expect(files["app/blog/posts/on-craft.mdx"]).toContain('title: "On craft"');
    expect(published).toEqual([WORK]);
    expect(ctx.changes.rows.find((r) => r.id === ran.changeId)).toMatchObject({ status: "done", after: { repo: "app/blog/posts/on-craft.mdx", presentation: d.id } });
  });

  it("refuses an unready record with not-presented and keeps the publish held", async () => {
    const d = await draft({ role: "writer", end: "share what I have thought through" });
    expect(d.gate).toMatchObject({ ready: false, missing: [{ item: "audience" }] });
    const ran = await runAction(publishToSiteAction, ctx, { work_id: WORK, email: false, presentation: d.id }, "mcp");
    if (!ran.held) throw new Error("a publish is always held");
    await expect(approveChange(ctx, ran.changeId, "page")).rejects.toMatchObject({ reason: "not-presented", message: expect.stringContaining("the audience") });
    expect(ctx.changes.rows.find((r) => r.id === ran.changeId)?.status).toBe("held");
    expect(committed()).toEqual([]);

    // A role and an end the site's rules do not have is refused the same way.
    const odd = await draft({ role: "citizen", end: "speak to a public question", audience: "voters" });
    const again = await runAction(publishToSiteAction, ctx, { work_id: WORK, email: false, presentation: odd.id }, "chat");
    if (!again.held) throw new Error("a publish is always held");
    await expect(approveChange(ctx, again.changeId, "page")).rejects.toMatchObject({ reason: "not-presented", message: expect.stringContaining("no rule on personal-site") });
    expect(committed()).toEqual([]);
  });

  it("refuses an approval from MCP or the chat with person-only, even with a ready record", async () => {
    const d = await draft({ role: "founder", end: "show what I make and whom it serves", audience: "people who might use it" });
    const ran = await runAction(publishToSiteAction, ctx, { work_id: WORK, email: false, presentation: d.id }, "mcp");
    if (!ran.held) throw new Error("a publish is always held");
    for (const by of ["mcp", "chat", "workflow"] as const) await expect(approveChange(ctx, ran.changeId, by)).rejects.toMatchObject({ reason: "person-only" });
    expect(ctx.changes.rows.find((r) => r.id === ran.changeId)?.status).toBe("held");
    expect(committed()).toEqual([]);
    expect(published).toEqual([]);
  });

  it("gives the Publish sheet the site channel's rules and the last record on it", async () => {
    expect(await sitePresenting("u1", ctx.presentations)).toMatchObject({ rules: [{ role: "founder" }, { role: "writer" }], audience: "anyone who looks you up", repo: "tchjhnsn/tcjcafe", last: null });
    await draft({ role: "writer", end: "share what I have thought through", audience: "readers" });
    expect((await sitePresenting("u1", ctx.presentations))?.last).toEqual({ role: "writer", end: "share what I have thought through", audience: "readers", relation: "" });
  });
});
