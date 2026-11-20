import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { filesPublished, readVaultWork } from "./files-published.ts";
import { filesPresentations } from "./files-presentations.ts";
import { filesChanges } from "./files-changes.ts";
import { filesJournal } from "./files-journal.ts";
import { checkInstance, initInstance } from "./instance.ts";
import { sha256 } from "./memory.ts";
import { defaultPolicy, draftPresentation, type Presentation } from "./presentation.ts";
import {
  emptyIndex,
  indexFile,
  isGated,
  parseFrontMatter,
  parseIndex,
  postFile,
  publishedProblems,
  publishPost,
  publishProfile,
  SCHEMAS,
  unpublish,
  type Approval,
  type Publication,
} from "./published.ts";
import { schemaProblems } from "./schema-check.ts";
import { draftPresentationIn, runVaultAction, vaultRunner, type VaultContext } from "./vault-actions.ts";

const NOW = new Date("2026-11-20T04:00:00.000Z");
const policy = defaultPolicy("Tester");
const record = (f: Record<string, string> = {}): Presentation =>
  draftPresentation(policy, null, { channel: "personal-site", role: "writer", end: "share what I have thought through", audience: "readers of my site", ...f }, { id: "2026-11-20-personal-site", now: NOW });
const ok = (r: Presentation | null = record()): Approval => ({ policy, record: r, channel: "personal-site", at: NOW });
const POST = { slug: "on-craft", title: "On craft", kind: "essay", body: "The work is the thing.\n\nAnd then more.", date: NOW.toISOString(), updated: NOW.toISOString(), tags: ["craft", " work ", "craft"] };

/** A publication's files as a folder's map, applied to what was there. */
function applied(files: Map<string, string>, p: Publication): Map<string, string> {
  const next = new Map(files);
  for (const w of p.write) next.set(w.path, w.bytes);
  for (const r of p.remove) next.delete(r);
  return next;
}

const dirs: string[] = [];
afterAll(async () => Promise.all(dirs.map((d) => rm(d, { recursive: true, force: true }))));

describe("the published/ export", () => {
  it("writes a post with its front matter and a manifest line naming the record, the channel and the person", () => {
    const pub = publishPost(emptyIndex(), ok(), POST);
    expect(isGated(pub)).toBe(true);
    expect(pub.write.map((w) => w.path)).toEqual(["posts/on-craft.md", "index.json"]);
    const post = pub.write[0]!.bytes;
    expect(post).toBe(
      [
        "---",
        'title: "On craft"',
        'date: "2026-11-20T04:00:00.000Z"',
        'updated: "2026-11-20T04:00:00.000Z"',
        'slug: "on-craft"',
        'summary: "The work is the thing. And then more."',
        'kind: "essay"',
        'tags: ["craft","work"]',
        'presentation: "2026-11-20-personal-site"',
        'channel: "personal-site"',
        "---",
        "",
        "The work is the thing.",
        "",
        "And then more.",
        "",
      ].join("\n"),
    );
    expect(pub.index.entries).toEqual([{ path: "posts/on-craft.md", kind: "post", sha256: sha256(post), presentation: "2026-11-20-personal-site", channel: "personal-site", approved_at: NOW.toISOString(), approved_by: "person" }]);
    expect(pub.write[1]!.bytes).toBe(indexFile(pub.index));
  });

  it("writes files that pass their schemas, and reads its own front matter back", () => {
    const pub = publishProfile(publishPost(emptyIndex(), ok(), POST).index, ok(), { name: "Tester", headline: "Writes about craft", links: [{ label: "GitHub", url: "https://github.com/tester" }] });
    const files = applied(applied(new Map(), publishPost(emptyIndex(), ok(), POST)), pub);
    expect(schemaProblems(SCHEMAS.index, JSON.parse(files.get("index.json")!))).toEqual([]);
    expect(schemaProblems(SCHEMAS.profile, JSON.parse(files.get("profile.json")!))).toEqual([]);
    const { front, body } = parseFrontMatter(files.get("posts/on-craft.md")!);
    expect(schemaProblems(SCHEMAS.post, front)).toEqual([]);
    expect(body).toBe("The work is the thing.\n\nAnd then more.\n");
    expect(publishedProblems(files)).toEqual([]);
    expect(parseIndex(files.get("index.json")!).index?.entries.map((e) => e.path)).toEqual(["posts/on-craft.md", "profile.json"]);
  });

  it("refuses anything without a ready gate on the channel, and never a journal entry", () => {
    expect(() => publishPost(emptyIndex(), ok(null), POST)).toThrow(expect.objectContaining({ reason: "not-presented" }));
    expect(() => publishPost(emptyIndex(), ok(record({ audience: "" })), POST)).toThrow(/the audience/);
    expect(() => publishPost(emptyIndex(), ok(record({ role: "citizen", end: "speak to a public question" })), POST)).toThrow(/no rule on personal-site/);
    expect(() => publishPost(emptyIndex(), { ...ok(), channel: "social" }, POST)).toThrow(/is for personal-site, not social/);
    expect(() => publishProfile(emptyIndex(), ok(null), { name: "Tester" })).toThrow(expect.objectContaining({ reason: "not-presented" }));
    expect(() => publishPost(emptyIndex(), ok(), { ...POST, kind: "entry" })).toThrow(/journal entry never is/);
    expect(() => publishPost(emptyIndex(), ok(), { ...POST, slug: "Bad Slug" })).toThrow(/not a post's address/);
  });

  it("finds a changed file, a stray file, a missing file and a broken manifest", () => {
    const files = applied(new Map(), publishPost(emptyIndex(), ok(), POST));
    const changed = new Map(files).set("posts/on-craft.md", files.get("posts/on-craft.md")!.replace("thing", "point"));
    expect(publishedProblems(changed)).toEqual(["published/posts/on-craft.md changed since the person approved it: its sha256 is not the manifest's"]);
    const stray = new Map(files).set("posts/by-hand.md", "---\ntitle: \"x\"\n---\n\nx\n");
    expect(publishedProblems(stray)).toEqual(["published/posts/by-hand.md is not in the manifest: nothing goes in published/ without the gate"]);
    const missing = new Map(files);
    missing.delete("posts/on-craft.md");
    expect(publishedProblems(missing)).toEqual(["published/posts/on-craft.md is in the manifest and missing"]);
    expect(publishedProblems(new Map([["posts/x.md", "x"]]))).toEqual(["published/index.json is missing, so nothing here went through the gate"]);
    expect(publishedProblems(new Map([["index.json", '{"format":2,"entries":[{"path":"../x"}]}']]))[0]).toContain("index.json.format is 1");
  });

  it("unpublishes a post: the file and its entry go", () => {
    const first = publishPost(emptyIndex(), ok(), POST);
    const files = applied(new Map(), first);
    const out = unpublish(first.index, "posts/on-craft.md");
    expect(isGated(out)).toBe(true);
    expect(out.remove).toEqual(["posts/on-craft.md"]);
    const after = applied(files, out);
    expect([...after.keys()]).toEqual(["index.json"]);
    expect(out.index.entries).toEqual([]);
    expect(publishedProblems(after)).toEqual([]);
    expect(() => unpublish(out.index, "posts/on-craft.md")).toThrow(/not published/);
  });

  it("moves a post to its new slug, taking the old file out", () => {
    const first = publishPost(emptyIndex(), ok(), POST);
    const moved = publishPost(first.index, ok(), { ...POST, slug: "craft" }, { replaces: "on-craft" });
    expect(moved.remove).toEqual(["posts/on-craft.md"]);
    expect(moved.index.entries.map((e) => e.path)).toEqual(["posts/craft.md"]);
  });

  it("writes the same bytes for the same work, whoever calls it", () => {
    expect(publishPost(emptyIndex(), ok(), POST).write).toEqual(publishPost(emptyIndex(), ok(), { ...POST }).write);
    expect(postFile({ title: "A", date: NOW.toISOString(), slug: "a", summary: "s", kind: "essay", presentation: "p", channel: "c" }, "Body\r\n")).toBe('---\ntitle: "A"\ndate: "2026-11-20T04:00:00.000Z"\nslug: "a"\nsummary: "s"\nkind: "essay"\npresentation: "p"\nchannel: "c"\n---\n\nBody\n');
  });
});

describe("published/ in a vault", () => {
  async function vault() {
    const dir = await mkdtemp(join(tmpdir(), "reflect-published-"));
    dirs.push(dir);
    await initInstance(dir, "Tester");
    await mkdir(join(dir, "writing"));
    const ctx: VaultContext = {
      userId: "Tester",
      now: NOW,
      journal: filesJournal(dir, "Tester"),
      changes: filesChanges(dir),
      presentations: filesPresentations(dir, "Tester"),
      published: filesPublished(dir),
      readWork: (p) => readVaultWork(dir, p),
    };
    return { dir, ctx };
  }

  it("holds publish_files from the terminal and writes published/ only when the person approves a ready record", async () => {
    const { dir, ctx } = await vault();
    await writeFile(join(dir, "writing", "on-craft.md"), '---\ntitle: "On craft"\nkind: essay\n---\n\nThe work is the thing.\n');
    const held = await runVaultAction(ctx, "publish_files", { what: "post", file: "writing/on-craft.md", presentation: "2026-11-20-personal-site" }, "cli");
    if (!held.held) throw new Error("a publish is always held");
    expect(held.preview).toContain("Write published/posts/on-craft.md");
    expect(held.gate).toMatchObject({ ready: false });
    await expect(vaultRunner.approveChange(ctx, held.changeId, "cli")).rejects.toMatchObject({ reason: "not-presented" });
    expect(await filesPublished(dir).files()).toEqual(new Map());

    await draftPresentationIn(ctx.presentations, { channel: "personal-site", role: "writer", end: "share what I have thought through", audience: "readers" }, NOW);
    await expect(vaultRunner.approveChange(ctx, held.changeId, "mcp")).rejects.toMatchObject({ reason: "person-only" });
    const done = await vaultRunner.approveChange(ctx, held.changeId, "cli");
    expect(done.result).toEqual({ written: ["published/posts/on-craft.md", "published/index.json"], removed: [], presentation: "2026-11-20-personal-site" });
    const files = await filesPublished(dir).files();
    expect([...files.keys()]).toEqual(["index.json", "posts/on-craft.md"]);
    expect((await checkInstance(dir)).problems).toEqual([]);

    // A hand edit is found by its hash, and by memory.
    await writeFile(join(dir, "published", "posts", "on-craft.md"), (await readFile(join(dir, "published", "posts", "on-craft.md"), "utf8")) + "more\n");
    const check = await checkInstance(dir);
    expect(check.problems).toContain("published/posts/on-craft.md changed since the person approved it: its sha256 is not the manifest's");
    expect(check.outside).toContain("published/posts/on-craft.md");
  });

  it("refuses a work in the journal, a kind that is never published, and a write that skips the gate", async () => {
    const { dir, ctx } = await vault();
    await expect(readVaultWork(dir, "journal/2026-11-20.md")).rejects.toThrow(/never published/);
    await expect(readVaultWork(dir, "../outside.md")).rejects.toThrow(/name a Markdown work/);
    await writeFile(join(dir, "writing", "diary.md"), "---\ntitle: Diary\nkind: entry\n---\n\nToday.\n");
    await draftPresentationIn(ctx.presentations, { channel: "personal-site", role: "writer", end: "share what I have thought through", audience: "readers" }, NOW);
    // Refused when asked for, so nothing waits for an approval that could never run.
    await expect(runVaultAction(ctx, "publish_files", { what: "post", file: "writing/diary.md", presentation: "2026-11-20-personal-site" }, "cli")).rejects.toThrow(/never published/);
    await expect(runVaultAction(ctx, "publish_files", { what: "post", file: "journal/2026-11-20.md", presentation: "2026-11-20-personal-site" }, "mcp")).rejects.toThrow(/journal stays private/);
    expect(await ctx.changes.recent("Tester", 5)).toEqual([]);
    const forged = { write: [{ path: "posts/x.md", bytes: "x" }], remove: [], index: emptyIndex() };
    await expect(filesPublished(dir).apply(forged)).rejects.toThrow(/only through the presentation gate/);
  });
});
