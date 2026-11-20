// The folder host's published/ (./published.ts): the files a site reads, written only from a publication made through
// the presentation gate, each write logged in memory.jsonl like every other record. It also reads the vault's own
// Markdown works for `publish_files` and refuses the journal: an entry is never published, and the person's works by
// their end (making/, knowing/ and doing/, ./works-by-end.ts) for published/works.json.
import type { Dirent } from "node:fs";
import { readdir, rm } from "node:fs/promises";
import { join, normalize, sep } from "node:path";
import { readRecord, writeRecord } from "./record-io.ts";
import { END_IDS, workOfPath, workPath, workRecordProblems, type End, type VaultWorkRecord, type WorkRecord } from "./works-by-end.ts";
import { emptyIndex, INDEX_FILE, isGated, parseFrontMatter, parseIndex, publishedProblems, PUBLISHED_DIR, type Publication, type PublishedIndex } from "./published.ts";

/** Where a vault keeps what it published. */
export interface PublishedFolder {
  /** The manifest, or an empty one when nothing is published yet. Throws on a manifest that fails its schema. */
  index(): Promise<PublishedIndex>;
  /** One file's text, by its path inside published/, or null. */
  read(path: string): Promise<string | null>;
  /** Writes a publication made through the gate: its files (the manifest last), then removes what it takes out. */
  apply(p: Publication): Promise<void>;
  /** Every file under published/, by its path inside it. */
  files(): Promise<Map<string, string>>;
}

async function walk(root: string, dir: string): Promise<string[]> {
  let names: Dirent[];
  try {
    names = await readdir(join(root, dir), { withFileTypes: true });
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw e;
  }
  const out: string[] = [];
  for (const n of names.sort((a, b) => a.name.localeCompare(b.name))) {
    const rel = `${dir}/${n.name}`;
    if (n.isDirectory()) out.push(...(await walk(root, rel)));
    else if (n.isFile()) out.push(rel);
  }
  return out;
}

export function filesPublished(root: string, opts: { now?: () => Date } = {}): PublishedFolder {
  const now = opts.now ?? (() => new Date());
  const at = (p: string) => `${PUBLISHED_DIR}/${p}`;
  return {
    async index() {
      const text = await readRecord(root, at(INDEX_FILE));
      if (text === null) return emptyIndex();
      const r = parseIndex(text);
      if (!r.index) throw new Error(`${PUBLISHED_DIR}/${r.problems.join("; ")}`);
      return r.index;
    },
    read: (path) => readRecord(root, at(path)),
    async apply(p) {
      if (!isGated(p)) throw new Error("published/ is written only through the presentation gate");
      const when = now().toISOString();
      for (const w of p.write) {
        const old = await readRecord(root, at(w.path));
        await writeRecord(root, at(w.path), w.bytes, old === null ? "create" : "append", when);
      }
      for (const r of p.remove) await rm(join(root, at(r)), { force: true });
    },
    async files() {
      const out = new Map<string, string>();
      for (const rel of await walk(root, PUBLISHED_DIR)) out.set(rel.slice(PUBLISHED_DIR.length + 1), (await readRecord(root, rel)) ?? "");
      return out;
    },
  };
}

/** What `reflect check` finds wrong with published/: the manifest, the hashes, the front matter and stray files. */
export async function publishedFolderProblems(root: string): Promise<string[]> {
  return publishedProblems(await filesPublished(root).files());
}

/** Folders a work is never published from: the journal and everything private or already published. */
const NEVER = ["journal", "entries", "reflections", "_private", "presentations", PUBLISHED_DIR, ".git"];

/** A work in the vault as `publish_files` reads it: its front matter's title, kind and tags, and its body. */
export type VaultWork = { path: string; title?: string; kind?: string; tags?: string[]; body: string };

/**
 * Read one Markdown work from the vault by its path: a relative `.md` path inside the vault, never under the journal,
 * reflections, presentations or published/. The kind is checked by the caller (only essay, letter, plan or memoir).
 */
export async function readVaultWork(root: string, rel: string): Promise<VaultWork> {
  const p = normalize(rel).split(sep).join("/");
  if (!p.endsWith(".md") || p.startsWith("/") || p.startsWith("..") || p.split("/").includes("..")) throw new Error("name a Markdown work in the vault by its path, such as writing/on-craft.md");
  if (NEVER.includes(p.split("/")[0]!)) throw new Error(`${p.split("/")[0]}/ is never published: the journal stays private`);
  const text = await readRecord(root, p);
  if (text === null) throw new Error(`no file ${p} in the vault`);
  const { front, body } = parseFrontMatter(text);
  const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : undefined);
  const tags = Array.isArray(front.tags) ? front.tags.filter((t): t is string => typeof t === "string") : typeof front.tags === "string" ? front.tags.split(",").map((t) => t.trim()).filter(Boolean) : undefined;
  const heading = /^#\s+(.+?)\s*#*\s*$/m.exec(body)?.[1];
  const title = str(front.title) ?? str(heading);
  return { path: p, ...(title ? { title } : {}), ...(str(front.kind) ? { kind: str(front.kind) } : {}), ...(tags?.length ? { tags } : {}), body };
}

/** Every work record in the vault's making/, knowing/ and doing/ folders, with the problems of any that fail. */
export async function readWorkRecords(root: string): Promise<{ works: VaultWorkRecord[]; problems: string[] }> {
  const works: VaultWorkRecord[] = [];
  const problems: string[] = [];
  for (const end of END_IDS) {
    for (const rel of await walk(root, end)) {
      if (rel.endsWith(".draft.json")) continue;
      const w = workOfPath(rel);
      if (!w) {
        problems.push(`${rel}: a work is one file, ${end}/<id>.json, with a lowercase id`);
        continue;
      }
      let raw: unknown;
      try {
        raw = JSON.parse((await readRecord(root, rel)) ?? "");
      } catch {
        problems.push(`${rel} is not JSON`);
        continue;
      }
      const p = workRecordProblems(w.end, raw, rel);
      if (p.length) problems.push(...p);
      else works.push({ end: w.end, id: w.id, record: raw as WorkRecord });
    }
  }
  return { works, problems };
}

/** Write one work record, logged in memory.jsonl, after its check passes. It replaces a work of the same id at another end. */
export async function writeWorkRecord(root: string, end: End, id: string, record: WorkRecord, now = new Date()): Promise<{ path: string; moved?: string }> {
  const path = workPath(end, id);
  const p = workRecordProblems(end, record, path);
  if (p.length) throw new Error(p.join("; "));
  const old = await readRecord(root, path);
  await writeRecord(root, path, `${JSON.stringify(record, null, 2)}\n`, old === null ? "create" : "append", now.toISOString());
  for (const other of END_IDS) {
    if (other === end || (await readRecord(root, workPath(other, id))) === null) continue;
    await rm(join(root, workPath(other, id)), { force: true });
    return { path, moved: workPath(other, id) };
  }
  return { path };
}
