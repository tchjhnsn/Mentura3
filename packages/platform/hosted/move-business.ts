// Moving a business to another team, and removing a team's businesses (doc "Mentura console: screens, navigation and
// teams", 2026-11-25: D5 Transfer business, D6 Delete team, A4 Delete account). A business is one Naive venture: a
// folder in its team's store that holds a venture.json. Its tenant is the team's id (sql/003-team-tenant.sql), so a
// transfer moves every record and file under that folder from one tenant to the other.
//
//   moveBusinessInStore(pool, { from, to, venture, by })   naive_records, in one transaction
//   removeTenantInStore(pool, { tenant, assertion, by })    a tombstone for every live path of one tenant
//   moveBusinessOnDisk(root, { from, to, venture, by })     the local workspace (next dev), one rename
//   removeTenantOnDisk(root, tenant)                        the local workspace, the team's folder
//
// In the store, the move is one transaction on one connection: the source tenant's grant (mentura_authorize on the
// source team's signed assertion), a tombstone for each path of the business, then the destination's grant and a copy
// of each path with the same content and version. Each row is chained onto its own tenant's newest hash, under the same
// per-tenant advisory locks the connector's writes take, so both tenants' chains stay valid (connectors/postgres.ts,
// verify). The venture's own provenance log is copied byte for byte, so its chain stays valid too. Either every row
// lands or none does. The workspace file of each team lists or drops the folder, and each team's meta/provenance.jsonl
// gets one line saying the business left or arrived.
//
// Who may do it is decided before this runs: the web server signs one assertion per team only for an Owner of both
// (web/src/server/moving.ts), and hosted/store-child.ts checks both again. The row policy then binds each half of the
// transaction to the team its assertion names, so a forged team id fails in the database as well.

import { existsSync, mkdirSync, readdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { blobSha } from "naive-framework/src/store/connectors/contract.mjs";
import { chainHash, REMOVED, TABLE, type Client } from "../connectors/postgres.ts";

/** The workspace file Naive keeps at the top of each team's workspace (Naive's engine/workspace.mjs). */
export const WORKSPACE_FILE = "naive-workspace.json";
/** The workspace's own log, one plain JSON line per event. */
export const WORKSPACE_LOG = "meta/provenance.jsonl";

export const NO_SUCH_BUSINESS = "That business is not in this team any more. Refresh the page.";
export const NESTED_BUSINESS = "This business holds another business inside it, or sits inside one, so it cannot move on its own.";

export type MoveReport = { venture: string; folder: string; moved: number };
export type Side = { tenant: string; assertion: string };
type Entry = { path: string; content: string; version: string };

/** Whether Naive's walk of a workspace reaches this path: it skips node_modules and folders that start with . or _. */
const walked = (path: string) => path.split("/").slice(0, -1).every((part) => part !== "node_modules" && !part.startsWith(".") && !part.startsWith("_"));

const ventureId = (content: string): string | null => {
  try {
    const v = JSON.parse(content) as { id?: unknown };
    return typeof v.id === "string" ? v.id : null;
  } catch { return null; }
};

/** The folder (relative to the team's workspace) of the business with this id, or why it cannot move. */
export function businessFolder(entries: { path: string; content: string }[], venture: string): string {
  const ventures = entries.filter((e) => (e.path === "venture.json" || e.path.endsWith("/venture.json")) && walked(e.path));
  const found = ventures.filter((e) => ventureId(e.content) === venture);
  if (found.length !== 1) throw new Error(NO_SUCH_BUSINESS);
  const folder = dirname(found[0]!.path);
  if (folder === "." || folder === "") throw new Error(NESTED_BUSINESS);
  // Another venture inside this one, or this one inside another, would be split by the move.
  for (const v of ventures) {
    const other = dirname(v.path);
    if (other === folder) continue;
    if (other.startsWith(`${folder}/`) || folder.startsWith(`${other}/`)) throw new Error(NESTED_BUSINESS);
  }
  return folder;
}

/** The paths of the business: everything under its folder. */
export const underFolder = (path: string, folder: string) => path.startsWith(`${folder}/`);

/** The folder in the destination: the same name, or the name with -2, -3 and so on when the team already uses it. */
export function freeFolder(paths: string[], folder: string): string {
  const used = (f: string) => paths.some((p) => p === f || underFolder(p, f));
  if (!used(folder)) return folder;
  for (let n = 2; ; n++) if (!used(`${folder}-${n}`)) return `${folder}-${n}`;
}

/** Why the destination cannot take this business, or null: a business there already has the same id, and the
 * console's address for a business is its id. */
export function idProblem(entries: { path: string; content: string }[], venture: string, teamName = "That team"): string | null {
  const taken = entries.some((e) => (e.path === "venture.json" || e.path.endsWith("/venture.json")) && walked(e.path) && ventureId(e.content) === venture);
  return taken ? `${teamName} already has a business with the address ${venture}. Rename one of them before you move it.` : null;
}

type Workspace = { schema?: string; schema_version?: string; name?: string; timeZone?: string; settings?: unknown; ventures?: string[]; [k: string]: unknown };

const parse = (content: string | undefined): Workspace | null => {
  if (content === undefined) return null;
  try {
    const ws = JSON.parse(content) as unknown;
    return ws && typeof ws === "object" && !Array.isArray(ws) ? ws as Workspace : null;
  } catch { return null; }
};
const print = (ws: Workspace) => JSON.stringify(ws, null, 2) + "\n";

/** The source's workspace file without the folder, or null when there is nothing to change (no file, a file that does
 * not parse, which Naive leaves to the person to fix, or a file that never listed it). */
export function withoutVenture(content: string | undefined, folder: string): string | null {
  const ws = parse(content);
  if (!ws || !Array.isArray(ws.ventures) || !ws.ventures.includes(folder)) return null;
  return print({ ...ws, ventures: ws.ventures.filter((v) => v !== folder) });
}

/** The destination's workspace file listing the folder once. A team with no workspace file yet gets one made from the
 * source's schema, version, time zone and settings; Naive fills in the rest (its calendar, AGENTS.md) on its next write. */
export function withVenture(content: string | undefined, folder: string, source: string | undefined): string | null {
  const ws = parse(content);
  if (ws) {
    const list = Array.isArray(ws.ventures) ? ws.ventures : [];
    return list.includes(folder) ? null : print({ ...ws, ventures: [...list, folder] });
  }
  if (content !== undefined) return null;
  const from = parse(source) ?? {};
  const made: Workspace = { schema: from.schema ?? "everything-ecosystem", ...(from.schema_version ? { schema_version: from.schema_version } : {}), name: "Naive workspace", ...(from.timeZone ? { timeZone: from.timeZone } : {}), ventures: [folder], settings: from.settings ?? { cross_venture_reads: true, route_threshold: 0.8 } };
  return print(made);
}

/** One line for a workspace's meta/provenance.jsonl, in the shape Naive's own workspace events take. */
export const logLine = (entry: Record<string, unknown>, at: Date) => JSON.stringify({ at: at.toISOString(), ...entry }) + "\n";

// ---- naive_records -----------------------------------------------------------------------------------------------

type Run = (text: string, params?: unknown[]) => Promise<Record<string, unknown>[]>;

async function onOneConnection<T>(pool: Client, fn: (run: Run) => Promise<T>): Promise<T> {
  if (!pool.connect) throw new Error("the business store needs a pool that hands out one connection for a transaction");
  const conn = await pool.connect();
  const run: Run = async (text, params) => (await conn.query(text, params)).rows;
  try {
    await run("begin");
    const out = await fn(run);
    await run("commit");
    return out;
  } catch (error) {
    try { await run("rollback"); } catch { /* the connection may already be closed */ }
    throw error;
  } finally {
    conn.release();
  }
}

/** Binds the transaction to the team the assertion names. The database checks the signature and returns that team. */
async function grant(run: Run, side: Side): Promise<void> {
  const rows = await run("select mentura_authorize($1) as account", [side.assertion]);
  if (String(rows[0]?.account ?? "") !== side.tenant) throw new Error("The console refused this request: it carries no signed identity.");
}

const lock = (run: Run, tenant: string) => run("select pg_advisory_xact_lock(hashtext($1))", [`${TABLE}/${tenant}`]);

async function live(run: Run, tenant: string): Promise<Entry[]> {
  const rows = await run(
    `select * from (select distinct on (path) path, content, version from ${TABLE} where tenant = $1 order by path, seq desc) l where l.version <> $2`,
    [tenant, REMOVED],
  );
  return rows.map((r) => ({ path: String(r.path), content: String(r.content), version: String(r.version) }));
}

/** Appends rows to one tenant's chain, each hashed onto the one before. */
async function append(run: Run, tenant: string, rows: { path: string; content: string; version: string }[]): Promise<void> {
  if (!rows.length) return;
  let head = String((await run(`select hash from ${TABLE} where tenant = $1 order by seq desc limit 1`, [tenant]))[0]?.hash ?? "") || null;
  for (const r of rows) {
    const hash = chainHash(head, r.path, r.version);
    await run(`insert into ${TABLE} (tenant, path, content, version, prev_hash, hash) values ($1, $2, $3, $4, $5, $6)`, [tenant, r.path, r.content, r.version, head, hash]);
    head = hash;
  }
}

const contentOf = (entries: Entry[], path: string) => entries.find((e) => e.path === path)?.content;
const fileRow = (path: string, content: string) => ({ path, content, version: blobSha(content) });

/** D5 in the hosted store: every live path of the business leaves `from` (a tombstone each) and arrives in `to` (the
 * same content and version), in one transaction. */
export async function moveBusinessInStore(pool: Client, input: { from: Side; to: Side; venture: string; by: string; toName?: string; now?: Date }): Promise<MoveReport> {
  const { from, to, venture, by } = input;
  if (from.tenant === to.tenant) throw new Error("The business is already in that team.");
  const at = input.now ?? new Date();
  return onOneConnection(pool, async (run) => {
    // Both tenants are locked first, in one order, so two moves the other way round cannot deadlock.
    for (const t of [from.tenant, to.tenant].sort()) await lock(run, t);

    await grant(run, from);
    const source = await live(run, from.tenant);
    const folder = businessFolder(source, venture);
    const moving = source.filter((e) => underFolder(e.path, folder));
    const sourceWs = contentOf(source, WORKSPACE_FILE);
    const out: { path: string; content: string; version: string }[] = moving.map((e) => ({ path: e.path, content: "", version: REMOVED }));
    const listed = withoutVenture(sourceWs, folder);
    if (listed !== null) out.push(fileRow(WORKSPACE_FILE, listed));
    out.push(fileRow(WORKSPACE_LOG, (contentOf(source, WORKSPACE_LOG) ?? "") + logLine({ action: "venture-transfer-out", venture, folder, to: to.tenant, by }, at)));
    await append(run, from.tenant, out);

    await grant(run, to);
    const dest = await live(run, to.tenant);
    const why = idProblem(dest, venture, input.toName);
    if (why) throw new Error(why);
    const landing = freeFolder(dest.map((e) => e.path), folder);
    const rows = moving.map((e) => ({ path: `${landing}/${e.path.slice(folder.length + 1)}`, content: e.content, version: e.version }));
    const destWs = withVenture(contentOf(dest, WORKSPACE_FILE), landing, sourceWs);
    if (destWs !== null) rows.push(fileRow(WORKSPACE_FILE, destWs));
    rows.push(fileRow(WORKSPACE_LOG, (contentOf(dest, WORKSPACE_LOG) ?? "") + logLine({ action: "venture-transfer-in", venture, folder: landing, from: from.tenant, by }, at)));
    await append(run, to.tenant, rows);
    return { venture, folder: landing, moved: moving.length };
  });
}

/** D6 and A4 in the hosted store: a tombstone for every live path of the team, in one transaction. The history stays in
 * the append-only table; no one can read it, since the team is deleted from the identity store right after. */
export async function removeTenantInStore(pool: Client, input: { tenant: string; assertion: string }): Promise<{ removed: number }> {
  return onOneConnection(pool, async (run) => {
    await lock(run, input.tenant);
    await grant(run, { tenant: input.tenant, assertion: input.assertion });
    const paths = (await live(run, input.tenant)).map((e) => e.path);
    await append(run, input.tenant, paths.map((path) => ({ path, content: "", version: REMOVED })));
    return { removed: paths.length };
  });
}

// ---- the local workspace (next dev, next start) -------------------------------------------------------------------

const tenantDir = (root: string, tenant: string) => {
  if (!/^[A-Za-z0-9_-]+$/.test(tenant)) throw new Error("The console refused this request: it carries no usable account.");
  return join(root, ".accounts", tenant);
};

/** Every file under dir as a path relative to it, with the content of venture.json files only (the rest are not read). */
function filesOf(dir: string, rel = ""): { path: string; content: string }[] {
  if (!existsSync(join(dir, rel))) return [];
  return readdirSync(join(dir, rel), { withFileTypes: true }).flatMap((e) => {
    const r = rel ? `${rel}/${e.name}` : e.name;
    if (e.isDirectory()) return filesOf(dir, r);
    if (!e.isFile()) return [];
    return [{ path: r, content: e.name === "venture.json" ? readFileSync(join(dir, r), "utf8") : "" }];
  });
}

const readIf = (file: string) => (existsSync(file) ? readFileSync(file, "utf8") : undefined);
const writeFile = (file: string, content: string) => { mkdirSync(dirname(file), { recursive: true }); writeFileSync(file, content); };

/** D5 on disk: the business's folder is renamed into the other team's workspace, which is one step on one disk. */
export function moveBusinessOnDisk(root: string, input: { from: string; to: string; venture: string; by: string; toName?: string; now?: Date }): MoveReport {
  if (input.from === input.to) throw new Error("The business is already in that team.");
  const at = input.now ?? new Date();
  const src = tenantDir(root, input.from), dst = tenantDir(root, input.to);
  const source = filesOf(src);
  const folder = businessFolder(source, input.venture);
  const dest = filesOf(dst);
  const why = idProblem(dest, input.venture, input.toName);
  if (why) throw new Error(why);
  const landing = freeFolder(dest.map((e) => e.path), folder);
  const moved = source.filter((e) => underFolder(e.path, folder)).length;
  mkdirSync(dirname(join(dst, landing)), { recursive: true, mode: 0o700 });
  renameSync(join(src, folder), join(dst, landing));
  const sourceWs = readIf(join(src, WORKSPACE_FILE));
  const left = withoutVenture(sourceWs, folder);
  if (left !== null) writeFile(join(src, WORKSPACE_FILE), left);
  const arrived = withVenture(readIf(join(dst, WORKSPACE_FILE)), landing, sourceWs);
  if (arrived !== null) writeFile(join(dst, WORKSPACE_FILE), arrived);
  writeFile(join(src, WORKSPACE_LOG), (readIf(join(src, WORKSPACE_LOG)) ?? "") + logLine({ action: "venture-transfer-out", venture: input.venture, folder, to: input.to, by: input.by }, at));
  writeFile(join(dst, WORKSPACE_LOG), (readIf(join(dst, WORKSPACE_LOG)) ?? "") + logLine({ action: "venture-transfer-in", venture: input.venture, folder: landing, from: input.from, by: input.by }, at));
  return { venture: input.venture, folder: landing, moved };
}

/** D6 and A4 on disk: the team's workspace folder goes. */
export function removeTenantOnDisk(root: string, tenant: string): { removed: number } {
  const dir = tenantDir(root, tenant);
  const removed = filesOf(dir).length;
  rmSync(dir, { recursive: true, force: true });
  return { removed };
}
