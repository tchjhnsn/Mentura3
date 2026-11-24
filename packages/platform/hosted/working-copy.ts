// The host side of Naive's hosted working copy (Naive docs/design/HOSTED_WORKING_COPY_2026-11-07.md, candidate B):
// check a tenant's records out of its store into a folder, run Naive on that folder unchanged with
// NAIVE_RUNTIME=hosted, and commit what changed back, each write carrying the version it was checked out at.
// If the store moved underneath the run, the commit is refused with a VersionConflict and the whole request runs
// again on a fresh copy, up to a cap.
//
//   checkout(store, dir)            writes every record into dir (missing or empty) and returns the base versions
//   refresh(store, dir, bases)      brings a kept copy up to date, fetching only paths whose version changed
//   commit(store, dir, bases)       writes back what the run changed: a record with base, a log by appending its new
//                                   lines, a derived file never; a removed record is refused (the contract has no delete)
//   withWorkingCopy(store, dir, run, { retries })   check out, run, commit, and on a conflict start again
//
// What each path is comes from Naive's data model (pathKind), read relative to the venture folder that holds it,
// the nearest folder above it with a venture.json. A path in no venture, or one the data model does not name, is
// a record. Derived files are rebuilt by each run and never committed (the design's first open question).
//
// The store is any connector that passes Naive's contract with base and append: the Postgres connector in
// production, Naive's filesystem connector in the tests.

import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { blobSha, VersionConflict } from "naive-framework/src/store/connectors/contract.mjs";
import { pathKind } from "naive-framework/src/records/index.mjs";

export interface Store {
  list(prefix?: string): Promise<{ path: string, version: string }[]>;
  read(path: string): Promise<{ path: string, content: string, version: string } | null>;
  write(path: string, content: string, opts?: { base?: string | null, append?: boolean }): Promise<{ path: string, version: string }>;
}

/** Each path's version as checked out. */
export type Bases = Map<string, string>;

export type Kind = "record" | "log" | "derived";

export interface CommitReport { wrote: string[], appended: string[], skipped: string[] }

/** The files under dir, relative and with forward slashes. Dot folders count (.naive holds logs); .git and node_modules do not. */
function filesUnder(dir: string, rel = ""): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(join(dir, rel), { withFileTypes: true }).flatMap((e) => {
    if (e.name === ".git" || e.name === "node_modules") return [];
    const r = rel ? `${rel}/${e.name}` : e.name;
    return e.isDirectory() ? filesUnder(dir, r) : e.isFile() ? [r] : [];
  }).sort();
}

/** What kind of file a tenant path is: looked up relative to the venture folder that holds it. */
export function kindOf(dir: string, path: string): Kind {
  const parts = path.split("/");
  for (let i = parts.length - 1; i > 0; i--) {
    if (existsSync(join(dir, ...parts.slice(0, i), "venture.json"))) return pathKind(parts.slice(i).join("/")) ?? "record";
  }
  return pathKind(path) ?? "record";
}

async function fetchInto(store: Store, dir: string, path: string, bases: Bases): Promise<void> {
  const r = await store.read(path);
  if (!r) { rmSync(join(dir, path), { force: true }); bases.delete(path); return; }
  const file = join(dir, path);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, r.content);
  bases.set(path, r.version);
}

/** Writes every record of the store into dir, which must be missing or empty. */
export async function checkout(store: Store, dir: string): Promise<Bases> {
  if (existsSync(dir) && readdirSync(dir).length) throw new Error(`${dir} is not empty: check out into a missing or empty folder`);
  mkdirSync(dir, { recursive: true });
  const bases: Bases = new Map();
  for (const { path } of await store.list()) await fetchInto(store, dir, path, bases);
  return bases;
}

/**
 * Brings a kept working copy up to date with the store: only paths whose version changed are fetched, paths the
 * store no longer has are removed, and anything the last run left uncommitted is put back as the store has it.
 */
export async function refresh(store: Store, dir: string, bases: Bases): Promise<{ fetched: string[], removed: string[] }> {
  const now = new Map((await store.list()).map((e) => [e.path, e.version]));
  const fetched: string[] = [], removed: string[] = [];
  for (const [path, version] of now) {
    const file = join(dir, path);
    const local = existsSync(file) && statSync(file).isFile() ? blobSha(readFileSync(file)) : null;
    if (bases.get(path) !== version || local !== version) { await fetchInto(store, dir, path, bases); fetched.push(path); }
  }
  for (const path of filesUnder(dir)) if (!now.has(path)) { rmSync(join(dir, path), { force: true }); bases.delete(path); removed.push(path); }
  return { fetched, removed };
}

/**
 * Writes back what the run changed. A record is written whole with its base version; a log only by appending the
 * lines after what was checked out, with its base, so a log another request appended to is refused rather than
 * overwritten; a derived file is skipped. A record the run removed is refused: the connector contract has no
 * delete, and a hosted run never removes a record. Throws VersionConflict when the store moved.
 */
export async function commit(store: Store, dir: string, bases: Bases): Promise<CommitReport> {
  const report: CommitReport = { wrote: [], appended: [], skipped: [] };
  const local = filesUnder(dir);
  const gone = [...bases.keys()].filter((p) => !local.includes(p) && kindOf(dir, p) !== "derived");
  if (gone.length) throw new Error(`the run removed ${gone.join(", ")}: a hosted run never removes a record, and nothing was committed`);
  // Work out every write before sending any, so a log rewritten in place refuses the commit before it starts.
  const plan: { path: string, content: string, base: string | null, append: boolean }[] = [];
  for (const path of local) {
    const bytes = readFileSync(join(dir, path));
    const version = blobSha(bytes);
    const base = bases.get(path) ?? null;
    if (version === base) continue;
    const kind = kindOf(dir, path);
    if (kind === "derived") { report.skipped.push(path); continue; }
    const content = bytes.toString("utf8");
    if (kind === "log" && base !== null) {
      const before = await store.read(path);
      // The log as checked out is the store's content at base; if the store moved, the base check refuses below.
      const old = before && before.version === base ? before.content : null;
      if (old !== null && !content.startsWith(old)) throw new Error(`${path} is a log, and the run changed lines it had already: a log is only appended to, and nothing was committed`);
      plan.push({ path, content: old === null ? content : content.slice(old.length), base, append: old !== null });
      continue;
    }
    plan.push({ path, content, base, append: false });
  }
  // Check every base before the first write, so a store that moved refuses the commit while nothing is written.
  // Each write still carries its base, which closes the gap for a path that moves between this check and its write;
  // the store has no transaction across paths, so such a commit can land in part, and the retry starts from there.
  if (plan.length) {
    const now = new Map((await store.list()).map((e) => [e.path, e.version]));
    for (const w of plan) if ((now.get(w.path) ?? null) !== w.base) throw new VersionConflict(w.path, w.base, now.get(w.path) ?? null);
  }
  for (const w of plan) {
    const out = await store.write(w.path, w.content, { base: w.base, ...(w.append ? { append: true } : {}) });
    bases.set(w.path, out.version);
    (w.append ? report.appended : report.wrote).push(w.path);
  }
  return report;
}

/** Runs fn with NAIVE_RUNTIME=hosted for this process and the processes it starts, then restores the variable. */
export async function hosted<T>(fn: () => Promise<T> | T): Promise<T> {
  const was = process.env.NAIVE_RUNTIME;
  process.env.NAIVE_RUNTIME = "hosted";
  try { return await fn(); } finally { if (was === undefined) delete process.env.NAIVE_RUNTIME; else process.env.NAIVE_RUNTIME = was; }
}

/**
 * One request for one tenant: check out (or refresh a kept copy), run in hosted mode, commit. On a VersionConflict
 * the copy is refreshed and the request runs again, at most `retries` more times; then the conflict is thrown.
 * Writes from a refused attempt are discarded by the refresh, so a retried run starts from the store as it is.
 */
export async function withWorkingCopy<T>(store: Store, dir: string, run: (dir: string) => Promise<T> | T, { retries = 2, bases }: { retries?: number, bases?: Bases } = {}): Promise<{ result: T, commit: CommitReport, attempts: number, bases: Bases }> {
  const b = bases ?? await checkout(store, dir);
  if (bases) await refresh(store, dir, b);
  for (let attempt = 1; ; attempt++) {
    const result = await hosted(() => run(dir));
    try {
      return { result, commit: await commit(store, dir, b), attempts: attempt, bases: b };
    } catch (e) {
      if (!(e instanceof VersionConflict) || attempt > retries) throw e;
      await refresh(store, dir, b);
    }
  }
}
