// Each venture's own storage (venture console spec, 2026-11-24, phase 2): a private `files/` folder inside the venture,
// for what is not a Naive record (decks, contracts, receipts, images, recordings). The founder lists, uploads,
// downloads, moves and deletes through the console; every change is logged in the venture's provenance by the caller.
// Paths are relative to `files/`, and nothing here reaches outside it: links out are refused, hidden names are refused.

import { createHash } from "node:crypto";
import { existsSync, lstatSync, mkdirSync, readdirSync, readFileSync, realpathSync, renameSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";

export const FILES_DIR = "files";
/** The most one upload or download carries through the bridge. */
export const MAX_FILE_BYTES = 20 * 1024 * 1024;

export type StoredFile = { name: string; path: string; kind: "file" | "folder"; size: number; modified: string; children?: StoredFile[] };

const badName = (name: string) => !name || name === "." || name === ".." || name.startsWith(".") || /[\\/\0]/.test(name) || name.length > 200;

/** The venture's files folder, made on first use. `folder` is where the venture's layout puts the logical path
 *  `files` (Naive's ventureFile: `k-base/files` in the default layout), so the folder sits beside the records. */
export function filesRoot(ventureDir: string, folder: string): string {
  if (!existsSync(folder)) mkdirSync(folder, { recursive: true });
  const real = realpathSync(folder), base = realpathSync(ventureDir);
  if (!real.startsWith(base + sep) || lstatSync(folder).isSymbolicLink()) throw new Error("the venture's files folder is a link, so it is not used");
  return real;
}

/** A path under files/, checked segment by segment. `mustExist` false allows a new name in an existing folder. */
export function within(root: string, rel: string, mustExist = true): string {
  const parts = String(rel ?? "").split("/").filter(Boolean);
  if (!parts.length) throw new Error("name a file");
  if (parts.some(badName)) throw new Error("that name is not allowed: no leading dot, slash or backslash");
  const p = resolve(root, ...parts);
  if (!p.startsWith(root + sep)) throw new Error("that path is outside the venture's files");
  const parent = dirname(p);
  if (existsSync(parent) && !realpathSync(parent).startsWith(root)) throw new Error("that path is outside the venture's files");
  if (existsSync(p)) {
    if (lstatSync(p).isSymbolicLink()) throw new Error("links are not followed");
  } else if (mustExist) throw new Error("that file is not in the venture");
  return p;
}

/** Everything under files/, folders first, as a tree. */
export function listFiles(root: string, dir = root, depth = 0): StoredFile[] {
  return readdirSync(dir, { withFileTypes: true })
    .filter((e) => !e.name.startsWith(".") && (e.isFile() || e.isDirectory()))
    .sort((a, b) => Number(b.isDirectory()) - Number(a.isDirectory()) || a.name.localeCompare(b.name))
    .map((e) => {
      const p = join(dir, e.name), s = statSync(p), path = relative(root, p).split(sep).join("/");
      return e.isDirectory()
        ? { name: e.name, path, kind: "folder" as const, size: 0, modified: s.mtime.toISOString(), children: depth < 8 ? listFiles(root, p, depth + 1) : [] }
        : { name: e.name, path, kind: "file" as const, size: s.size, modified: s.mtime.toISOString() };
    });
}

export function readStored(root: string, rel: string): { path: string; size: number; base64: string } {
  const p = within(root, rel);
  const s = statSync(p);
  if (!s.isFile()) throw new Error("that is a folder");
  if (s.size > MAX_FILE_BYTES) throw new Error(`that file is larger than ${MAX_FILE_BYTES / 1024 / 1024} MB`);
  return { path: rel, size: s.size, base64: readFileSync(p).toString("base64") };
}

/** Writes one file. An existing file is replaced only when `replace` is true, so an upload never overwrites by accident. */
export function writeStored(root: string, rel: string, base64: string, replace = false): { path: string; size: number; sha256: string } {
  const bytes = Buffer.from(String(base64 ?? ""), "base64");
  if (bytes.length > MAX_FILE_BYTES) throw new Error(`that file is larger than ${MAX_FILE_BYTES / 1024 / 1024} MB`);
  const p = within(root, rel, false);
  if (existsSync(p) && (!replace || !statSync(p).isFile())) throw new Error("a file with that name is already here");
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, bytes);
  return { path: rel, size: bytes.length, sha256: createHash("sha256").update(bytes).digest("hex") };
}

export function makeFolder(root: string, rel: string): { path: string } {
  const p = within(root, rel, false);
  if (existsSync(p)) throw new Error("something with that name is already here");
  mkdirSync(p, { recursive: true });
  return { path: rel };
}

export function moveStored(root: string, from: string, to: string): { from: string; to: string } {
  const a = within(root, from), b = within(root, to, false);
  if (existsSync(b)) throw new Error("something with that name is already here");
  if (b.startsWith(a + sep)) throw new Error("a folder cannot move inside itself");
  mkdirSync(dirname(b), { recursive: true });
  renameSync(a, b);
  return { from, to };
}

/** Deletes a file or a folder. Returns the hashes of the files it removed, for the provenance log. */
export function deleteStored(root: string, rel: string): { path: string; removed: { path: string; sha256: string }[] } {
  const p = within(root, rel);
  const removed: { path: string; sha256: string }[] = [];
  const walk = (q: string) => {
    if (statSync(q).isDirectory()) for (const e of readdirSync(q)) walk(join(q, e));
    else removed.push({ path: relative(root, q).split(sep).join("/"), sha256: createHash("sha256").update(readFileSync(q)).digest("hex") });
  };
  walk(p);
  rmSync(p, { recursive: true, force: true });
  return { path: rel, removed };
}
