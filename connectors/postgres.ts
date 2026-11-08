// The Postgres connector: a tenant's records in a Postgres database, Neon in production (EE-118 step 9,
// Torian 2026-11-06: "It will go in a neon database"). It names a vendor's service and reaches it over the
// network, so it is platform, not framework (EE-041), and proves itself against Naive's contract suite.
//
//   url      the name of the environment variable holding the connection string (default
//            MENTURA_DATABASE_URL); the string itself is never stored or printed
//   tenant   whose records these are (one tenant's store holds its ventures)
//   root     the folder inside the tenant the source covers, such as ventures/acme (default all of it)
//   writes   direct (default) or none
//   client   anything with query(text, params), such as a pg Pool; the evals pass one to a local
//            database. Without it, a pg Pool is opened on the connection string.
//
// The table is append-only, as Polity's are: every write is a new row, a database trigger refuses UPDATE
// and DELETE, and each row carries a hash chained to the tenant's previous row, so history is never lost
// and a changed row is caught (verify). A read gives the newest row for a path. version is the git blob
// SHA-1 of the content, as every connector gives it.

import { createHash } from "node:crypto";
import pg from "pg";
import { blobSha, checkWrite, isText, matches, safePath } from "naive-framework/src/store/connectors/contract.mjs";

export interface Client {
  query(text: string, params?: unknown[]): Promise<{ rows: Record<string, unknown>[] }>
  /** A pool hands out one connection for a transaction; a single client is its own. */
  connect?(): Promise<Client & { release(): void }>
}
export interface Options {
  id?: string
  url?: string
  tenant?: string
  root?: string
  writes?: string
  client?: Client
  /** When false, the table must already exist. A runtime role with only select and insert uses this. */
  schema?: boolean
}
interface Row { path: string, content: string, version: string, seq: string, hash: string }

export const TABLE = "naive_records";

/** The table, its index and the trigger that keeps it append-only. Safe to run more than once. */
export const SCHEMA = `
create table if not exists ${TABLE} (
  seq bigserial primary key,
  tenant text not null,
  path text not null,
  content text not null,
  version text not null,
  prev_hash text,
  hash text not null,
  written_at timestamptz not null default now()
);
create index if not exists ${TABLE}_latest on ${TABLE} (tenant, path, seq desc);
create or replace function ${TABLE}_append_only() returns trigger language plpgsql as $$
begin raise exception '${TABLE} is append-only: % refused', tg_op; end $$;
drop trigger if exists ${TABLE}_append_only on ${TABLE};
create trigger ${TABLE}_append_only before update or delete on ${TABLE} for each row execute function ${TABLE}_append_only();
`;

/** The chain: each row's hash covers the tenant's previous hash, the path and the content's version. */
export const chainHash = (prev: string | null, path: string, version: string): string =>
  createHash("sha256").update(`${prev ?? ""}\n${path}\n${version}`).digest("hex");

/** The drivers poolFrom can open: node-postgres over TCP, or Neon's serverless driver over a WebSocket on 443. */
export const DRIVERS = ["pg", "neon-ws"] as const;
export type Driver = typeof DRIVERS[number];

/** The driver MENTURA_DB_DRIVER names, else pg. */
export function driverFrom(value = process.env.MENTURA_DB_DRIVER): Driver {
  if (!value) return "pg";
  const d = DRIVERS.find((x) => x === value);
  if (!d) throw new Error(`MENTURA_DB_DRIVER is ${value}; it must be one of ${DRIVERS.join(", ")}`);
  return d;
}

/** Any pg-shaped pool: query, connect for a transaction, end. Both drivers give one. */
interface PgPool {
  query(text: string, params?: unknown[]): Promise<{ rows: Record<string, unknown>[] }>
  connect(): Promise<{ query(text: string, params?: unknown[]): Promise<{ rows: Record<string, unknown>[] }>, release(): void }>
  end(): Promise<void>
}

/**
 * Neon's serverless Pool. It speaks the Postgres protocol over a WebSocket on port 443, so it works where raw
 * TCP to 5432 is blocked (a cloud container behind an HTTPS proxy). With HTTPS_PROXY set, the WebSocket goes
 * through that proxy. The packages load only when this driver is chosen.
 */
async function neonPool(conn: string): Promise<PgPool> {
  const { Pool, neonConfig } = await import("@neondatabase/serverless");
  const { default: WebSocket } = await import("ws");
  const proxy = process.env.HTTPS_PROXY ?? process.env.https_proxy;
  if (proxy) {
    const { HttpsProxyAgent } = await import("https-proxy-agent");
    const agent = new HttpsProxyAgent(proxy);
    neonConfig.webSocketConstructor = class extends WebSocket {
      constructor(address: string | URL, protocols?: string | string[]) { super(address, protocols, { agent }); }
    };
  } else neonConfig.webSocketConstructor = WebSocket;
  return new Pool({ connectionString: conn, max: 4 });
}

/** Opens a pool on the connection string the named variable holds, with the driver MENTURA_DB_DRIVER names (default pg). */
export function poolFrom(url = "MENTURA_DATABASE_URL", driver: Driver = driverFrom()): Client & { end(): Promise<void> } {
  const conn = process.env[url];
  if (!conn) throw new Error(`no connection string in ${url}: set it to the database's URL`);
  if (driver === "neon-ws") {
    const ready = neonPool(conn);
    return {
      query: async (text, params) => (await ready).query(text, params),
      connect: async () => { const c = await (await ready).connect(); return { query: (text, params) => c.query(text, params), release: () => c.release() }; },
      end: async () => (await ready).end(),
    };
  }
  const pool = new pg.Pool({ connectionString: conn, max: 4 });
  return {
    query: (text, params) => pool.query(text, params),
    connect: async () => { const c = await pool.connect(); return { query: (text, params) => c.query(text, params), release: () => c.release() }; },
    end: () => pool.end(),
  };
}

/** Creates the table if it is not there. */
export async function ensureSchema(client: Client): Promise<void> { await client.query(SCHEMA); }

/** Checks a tenant's chain row by row: every hash recomputes, and every row names the hash before it. */
export async function verify(client: Client, tenant: string): Promise<{ rows: number, broken: string[] }> {
  const { rows } = await client.query(`select seq, path, version, prev_hash, hash from ${TABLE} where tenant = $1 order by seq`, [tenant]);
  const broken: string[] = [];
  let prev: string | null = null;
  for (const r of rows) {
    const rp = (r.prev_hash as string | null) ?? null;
    if (rp !== prev) broken.push(`row ${r.seq} (${r.path}) names ${rp ?? "nothing"} before it, not ${prev ?? "nothing"}`);
    if (chainHash(rp, String(r.path), String(r.version)) !== r.hash) broken.push(`row ${r.seq} (${r.path}) does not hash to what it stores`);
    prev = String(r.hash);
  }
  return { rows: rows.length, broken };
}

export function connect({ id = "postgres", url = "MENTURA_DATABASE_URL", tenant, root = "", writes = "direct", client, schema = true }: Options = {}) {
  if (!tenant || !/^[\w.-]+$/.test(tenant)) throw new Error(`the postgres connector needs a tenant id (letters, digits, . _ -), not ${tenant}`);
  if (writes === "pull-request") throw new Error("the postgres connector writes direct or none");
  const base = root ? safePath(root) : "";
  const full = (p: string) => (base ? `${base}/${safePath(p)}` : safePath(p));
  const rel = (p: string) => (base ? p.slice(base.length + 1) : p);
  let db: Client | null = client ?? null;
  let ready: Promise<void> | null = null;
  const q = async (text: string, params: unknown[]) => {
    db ??= poolFrom(url);
    const c = db;
    ready ??= schema ? ensureSchema(c) : Promise.resolve();
    await ready;
    return (await c.query(text, params)).rows as unknown as Row[];
  };
  // A transaction runs on one connection: a pool's own, or the single client itself.
  const tx = async <T>(fn: (run: (text: string, params: unknown[]) => Promise<Row[]>) => Promise<T>): Promise<T> => {
    await q("select 1", []);
    const pool = db as Client;
    const conn = pool.connect ? await pool.connect() : null;
    const c = conn ?? pool;
    const run = async (text: string, params: unknown[]) => (await c.query(text, params)).rows as unknown as Row[];
    await run("begin", []);
    try { const out = await fn(run); await run("commit", []); return out; }
    catch (e) { await run("rollback", []); throw e; }
    finally { conn?.release(); }
  };
  // The newest row of each path under the root. LIKE is escaped so a path's own % and _ match only themselves.
  const latest = (prefix: string) => {
    const like = prefix ? `${prefix.replace(/[\\%_]/g, (m) => `\\${m}`)}/%` : "%";
    return q(`select distinct on (path) path, content, version, seq::text as seq, hash from ${TABLE} where tenant = $1 and (path like $2 or path = $3) order by path, ${TABLE}.seq desc`, [tenant, like, prefix]);
  };
  const one = async (p: string) => (await q(`select path, content, version, seq::text as seq, hash from ${TABLE} where tenant = $1 and path = $2 order by ${TABLE}.seq desc limit 1`, [tenant, full(p)]))[0] ?? null;

  return {
    id, kind: "postgres", writes, tenant, root: base,
    async list(prefix = "") {
      const pre = prefix ? full(prefix) : base;
      return (await latest(pre)).map((r) => ({ path: rel(r.path), version: r.version })).sort((a, b) => a.path.localeCompare(b.path));
    },
    async read(p: string) {
      const r = await one(p);
      return r ? { path: safePath(p), content: r.content, version: r.version, seq: Number(r.seq), hash: r.hash } : null;
    },
    async version(p: string) { return (await one(p))?.version ?? null; },
    async search(query: string, { limit = 50 } = {}) {
      const out: { path: string, version: string }[] = [];
      for (const r of (await latest(base)).sort((a, b) => a.path.localeCompare(b.path))) {
        if (out.length >= limit) break;
        if (isText(r.path, r.content) && matches(`${rel(r.path)}\n${r.content}`, query)) out.push({ path: rel(r.path), version: r.version });
      }
      return out;
    },
    /**
     * Appends a row unless the newest row already holds this content; the chain is extended under a per-tenant lock.
     * `base` (a version, or null for "not there yet") refuses the write with a VersionConflict when the item moved;
     * `append` adds whole lines to the stored content. Both are checked inside the lock, by Naive's checkWrite.
     */
    async write(p: string, content: string, opts: { base?: string | null, append?: boolean } = {}) {
      if (writes === "none") throw new Error(`${id} is read-only`);
      const path = full(p);
      const out = await tx(async (run) => {
        await run("select pg_advisory_xact_lock(hashtext($1))", [`${TABLE}/${tenant}`]);
        const head = (await run(`select hash from ${TABLE} where tenant = $1 order by seq desc limit 1`, [tenant]))[0] ?? null;
        const now = (await run(`select content, version from ${TABLE} where tenant = $1 and path = $2 order by seq desc limit 1`, [tenant, path]))[0];
        if (opts.base !== undefined || opts.append) checkWrite(safePath(p), now?.version ?? null, now?.content ?? null, content, opts);
        const whole = opts.append ? (now?.content ?? "") + content : content;
        const version = blobSha(whole);
        if (now?.version === version) return { version, seq: null };
        const hash = chainHash(head?.hash ?? null, path, version);
        const seq = Number((await run(`insert into ${TABLE} (tenant, path, content, version, prev_hash, hash) values ($1, $2, $3, $4, $5, $6) returning seq::text as seq`, [tenant, path, whole, version, head?.hash ?? null, hash]))[0].seq);
        return { version, seq };
      });
      return { path: safePath(p), version: out.version, ...(out.seq !== null ? { seq: out.seq } : { unchanged: true }) };
    },
  };
}
