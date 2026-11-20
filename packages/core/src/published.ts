// Reflect outputs files (Torian, 2026-11-20 03:16Z: "Files out, no site code"). Reflect does not build websites. It
// controls the gate for content about the person, and what passes the gate is written as plain files to a folder,
// `published/`, the way headless Naive writes records. A site (tcjcafe.com, a Next.js blog in its own repository)
// reads those files. The layout:
//   - `published/profile.json`: the public profile facts the person approved;
//   - `published/posts/<slug>.md`: one post, Markdown with YAML front matter (title, date, updated, slug, summary,
//     kind, tags when there are any, and the presentation record and its channel);
//   - `published/index.json`: the manifest, each file with its sha256, the presentation record, the channel, when it
//     was approved and by whom (always the person).
// A file goes in only through `publishPost` or `publishProfile`, and each asks `gateFor` (./presentation.ts) first: a
// record that is not ready is refused with `not-presented`. The runner (./registry.ts) asked the person before the
// run; these functions cannot tell who approved, so they write "person" because only the person can approve a run
// that publishes. `unpublish` takes a file and its entry out. Pure: no I/O. The folder host is ./files-published.ts;
// the web app delivers the same bytes to the site's repository (web/src/server/site-repo.ts). The schemas are
// packages/core/schemas/published-index.schema.json, published-post.schema.json and published-profile.schema.json.
import indexSchema from "../schemas/published-index.schema.json" with { type: "json" };
import postSchema from "../schemas/published-post.schema.json" with { type: "json" };
import profileSchema from "../schemas/published-profile.schema.json" with { type: "json" };
import { sha256 } from "./memory.ts";
import { gateFor, type Presentation, type PresentationPolicy } from "./presentation.ts";
import { gateText, Refused } from "./registry.ts";
import { schemaProblems, type Schema } from "./schema-check.ts";
import { excerpt, isPublishable, isSlug, RESERVED_SLUGS } from "./site.ts";
import type { WorkKind } from "./works.ts";

export const PUBLISHED_DIR = "published";
export const INDEX_FILE = "index.json";
export const PROFILE_FILE = "profile.json";
export const POSTS_DIR = "posts";
const SCHEMA_DIR = "https://github.com/tchjhnsn/reflect/blob/main/packages/core/schemas";
export const SCHEMAS = { index: indexSchema as Schema, post: postSchema as Schema, profile: profileSchema as Schema };

/** One file in the manifest. `path` is inside published/. */
export type PublishedEntry = {
  path: string;
  kind: "post" | "profile";
  sha256: string;
  presentation: string;
  channel: string;
  approved_at: string;
  approved_by: "person";
};
export type PublishedIndex = { format: 1; entries: PublishedEntry[] };
export const emptyIndex = (): PublishedIndex => ({ format: 1, entries: [] });

/** A post's front matter, in the order it is written. */
export type PostFrontMatter = {
  title: string;
  date: string;
  updated?: string;
  slug: string;
  summary: string;
  kind: WorkKind;
  tags?: string[];
  presentation: string;
  channel: string;
};
export type PublishedProfile = { name: string; headline?: string; about?: string; links?: { label: string; url: string }[]; presentation: string; channel: string };

/** What a post is made from: a publishable work, its address and when it went out. */
export type PostInput = { slug: string; title: string; kind: string; body: string; date: string; updated?: string; summary?: string; tags?: readonly string[] };
export type ProfileInput = { name: string; headline?: string; about?: string; links?: readonly { label: string; url: string }[] };

/** The gate's inputs and the moment of the person's approval. */
export type Approval = { policy: PresentationPolicy; record: Presentation | null; channel: string; at: Date | string };

/** What to do to a published/ folder: files to write (index.json last) and files to remove, with the new manifest. */
export type Publication = { write: { path: string; bytes: string }[]; remove: string[]; index: PublishedIndex };

// A publication made here, through the gate (or an unpublish). A host writes only these.
const made = new WeakSet<Publication>();
/** Whether a publication came from publishPost, publishProfile or unpublish, so a host may write it. */
export const isGated = (p: Publication): boolean => made.has(p);

export const postPath = (slug: string): string => `${POSTS_DIR}/${slug}.md`;
const POST_PATH = /^posts\/([a-z0-9](?:[a-z0-9-]{0,58}[a-z0-9])?)\.md$/;
/** The slug of a post's path inside published/, or null when it is not one. */
export const slugOfPath = (path: string): string | null => POST_PATH.exec(path)?.[1] ?? null;

const iso = (at: Date | string): string => (typeof at === "string" ? new Date(at).toISOString() : at.toISOString());
const yaml = (v: unknown): string => JSON.stringify(v);

/** The record the gate passed, or a `not-presented` refusal with what it still needs. */
function passed(a: Approval): { presentation: string; channel: string; approved_at: string } {
  const g = gateFor(a.policy, a.record, a.channel);
  if (!g.ready || !a.record) throw new Refused({ reason: "not-presented", message: g.ready ? "No presentation record." : gateText(g) });
  return { presentation: a.record.id, channel: a.channel, approved_at: iso(a.at) };
}

/** A post's file: YAML front matter (each value written as JSON, which YAML reads as it is), a blank line, the body. */
export function postFile(fm: PostFrontMatter, body: string): string {
  const keys: (keyof PostFrontMatter)[] = ["title", "date", "updated", "slug", "summary", "kind", "tags", "presentation", "channel"];
  const lines = keys.filter((k) => fm[k] !== undefined).map((k) => `${k}: ${yaml(fm[k])}`);
  return `---\n${lines.join("\n")}\n---\n\n${body.replace(/\r\n?/g, "\n").trim()}\n`;
}

export const profileFile = (p: PublishedProfile): string => `${JSON.stringify({ $schema: `${SCHEMA_DIR}/published-profile.schema.json`, ...p }, null, 2)}\n`;
export const indexFile = (i: PublishedIndex): string => `${JSON.stringify({ $schema: `${SCHEMA_DIR}/published-index.schema.json`, format: i.format, entries: i.entries }, null, 2)}\n`;

const tagsOf = (t: readonly string[] | undefined): string[] | undefined => {
  const out = [...new Set((t ?? []).map((x) => x.trim()).filter(Boolean))];
  return out.length ? out : undefined;
};

/** The post's front matter and body from a work, or an error that says what is wrong with it. */
export function postFrontMatter(post: PostInput, gate: { presentation: string; channel: string }): PostFrontMatter {
  if (!isSlug(post.slug) || RESERVED_SLUGS.includes(post.slug)) throw new Error(`${post.slug} is not a post's address: lowercase letters, digits and hyphens`);
  if (!isPublishable(post.kind)) throw new Error("Only an essay, letter, plan or memoir is published. A journal entry never is.");
  const title = post.title.trim();
  if (!title) throw new Error("A post needs a title.");
  if (!post.body.trim()) throw new Error("There is nothing written yet.");
  const tags = tagsOf(post.tags);
  return {
    title,
    date: iso(post.date),
    ...(post.updated ? { updated: iso(post.updated) } : {}),
    slug: post.slug,
    summary: post.summary?.trim() || excerpt(post.body, 160),
    kind: post.kind,
    ...(tags ? { tags } : {}),
    presentation: gate.presentation,
    channel: gate.channel,
  };
}

function withFile(index: PublishedIndex, path: string, kind: PublishedEntry["kind"], bytes: string, g: ReturnType<typeof passed>, drop: readonly string[] = []): Publication {
  const entry: PublishedEntry = { path, kind, sha256: sha256(bytes), presentation: g.presentation, channel: g.channel, approved_at: g.approved_at, approved_by: "person" };
  const entries = [...index.entries.filter((e) => e.path !== path && !drop.includes(e.path)), entry].sort((a, b) => a.path.localeCompare(b.path));
  const next: PublishedIndex = { format: 1, entries };
  const pub: Publication = { write: [{ path, bytes }, { path: INDEX_FILE, bytes: indexFile(next) }], remove: drop.filter((p) => p !== path), index: next };
  made.add(pub);
  return pub;
}

/**
 * Publish a post, or a new version of one, through the gate: refused with `not-presented` unless the record passes
 * on the channel. `replaces` is the slug the work had before, when its address changed: that file and entry go.
 */
export function publishPost(index: PublishedIndex, a: Approval, post: PostInput, opts: { replaces?: string } = {}): Publication {
  const g = passed(a);
  const bytes = postFile(postFrontMatter(post, g), post.body);
  const old = opts.replaces && opts.replaces !== post.slug ? [postPath(opts.replaces)] : [];
  return withFile(index, postPath(post.slug), "post", bytes, g, old.filter((p) => index.entries.some((e) => e.path === p)));
}

/** Publish the profile facts the person approved, through the gate. */
export function publishProfile(index: PublishedIndex, a: Approval, p: ProfileInput): Publication {
  const g = passed(a);
  const name = p.name.trim();
  if (!name) throw new Error("A profile needs a name.");
  const links = (p.links ?? []).map((l) => ({ label: l.label.trim(), url: l.url.trim() })).filter((l) => l.label && l.url);
  for (const l of links) if (!/^https?:\/\//i.test(l.url)) throw new Error(`${l.url} is not a web address`);
  const profile: PublishedProfile = {
    name,
    ...(p.headline?.trim() ? { headline: p.headline.trim() } : {}),
    ...(p.about?.trim() ? { about: p.about.trim() } : {}),
    ...(links.length ? { links } : {}),
    presentation: g.presentation,
    channel: g.channel,
  };
  return withFile(index, PROFILE_FILE, "profile", profileFile(profile), g);
}

/** Take a file and its manifest entry out. Unpublishing removes content, so it needs no gate. */
export function unpublish(index: PublishedIndex, path: string): Publication {
  if (!index.entries.some((e) => e.path === path)) throw new Error(`${path} is not published`);
  const next: PublishedIndex = { format: 1, entries: index.entries.filter((e) => e.path !== path) };
  const pub: Publication = { write: [{ path: INDEX_FILE, bytes: indexFile(next) }], remove: [path], index: next };
  made.add(pub);
  return pub;
}

/** Read a manifest's JSON, or the problems that keep it from being one. */
export function parseIndex(text: string): { index: PublishedIndex | null; problems: string[] } {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { index: null, problems: ["index.json is not JSON"] };
  }
  const problems = schemaProblems(SCHEMAS.index, raw, "index.json");
  if (problems.length) return { index: null, problems };
  const r = raw as PublishedIndex;
  return { index: { format: 1, entries: r.entries }, problems: [] };
}

/**
 * The front matter of a Markdown file, as `key: value` lines between `---` lines, and the body after it. A value is
 * read as JSON when it is (Reflect writes every value so), else as plain text with its quotes taken off.
 */
export function parseFrontMatter(text: string): { front: Record<string, unknown>; body: string } {
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(text);
  if (!m) return { front: {}, body: text };
  const front: Record<string, unknown> = {};
  for (const line of m[1]!.split(/\r?\n/)) {
    const k = /^([A-Za-z_][\w-]*):\s*(.*)$/.exec(line);
    if (!k) continue;
    const raw = k[2]!.trim();
    let v: unknown = raw;
    try {
      v = JSON.parse(raw);
    } catch {
      v = raw.replace(/^'(.*)'$/, (_s, x: string) => x.replace(/''/g, "'"));
    }
    front[k[1]!] = v;
  }
  return { front, body: text.slice(m[0].length).replace(/^\r?\n/, "") };
}

/**
 * What is wrong with a published/ folder, given its files by path inside it: the manifest against its schema, each
 * entry's file there with the sha256 the manifest gives, each post's front matter and the profile against their
 * schemas and naming the entry's record and channel, and no file the manifest does not list (written outside the gate).
 */
export function publishedProblems(files: ReadonlyMap<string, string>): string[] {
  const out: string[] = [];
  const at = (p: string) => `${PUBLISHED_DIR}/${p}`;
  const text = files.get(INDEX_FILE);
  if (text === undefined) return files.size ? [`${at(INDEX_FILE)} is missing, so nothing here went through the gate`] : [];
  const r = parseIndex(text);
  if (!r.index) return r.problems.map((p) => `${PUBLISHED_DIR}/${p}`);
  const listed = new Set<string>();
  for (const e of r.index.entries) {
    if (listed.has(e.path)) out.push(`${at(INDEX_FILE)}: ${e.path} is listed twice`);
    listed.add(e.path);
    const bytes = files.get(e.path);
    if (bytes === undefined) {
      out.push(`${at(e.path)} is in the manifest and missing`);
      continue;
    }
    if (sha256(bytes) !== e.sha256) out.push(`${at(e.path)} changed since the person approved it: its sha256 is not the manifest's`);
    const slug = slugOfPath(e.path);
    if ((e.kind === "post") !== (slug !== null)) out.push(`${at(INDEX_FILE)}: ${e.path} is not a ${e.kind}`);
    let front: Record<string, unknown> | null = null;
    if (slug !== null) {
      const f = parseFrontMatter(bytes);
      front = f.front;
      out.push(...schemaProblems(SCHEMAS.post, front, at(e.path)));
      if (front.slug !== slug) out.push(`${at(e.path)}: its slug is not its file name`);
    } else if (e.path === PROFILE_FILE) {
      try {
        const { $schema: _s, ...p } = JSON.parse(bytes) as Record<string, unknown>;
        front = p;
        out.push(...schemaProblems(SCHEMAS.profile, front, at(e.path)));
      } catch {
        out.push(`${at(e.path)} is not JSON`);
      }
    }
    if (front && (front.presentation !== e.presentation || front.channel !== e.channel)) out.push(`${at(e.path)}: its presentation record or channel is not the manifest's`);
  }
  for (const p of files.keys()) if (p !== INDEX_FILE && !listed.has(p)) out.push(`${at(p)} is not in the manifest: nothing goes in published/ without the gate`);
  return out;
}
