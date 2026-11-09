// Raw intake: wakes triage when a raw entry lands in a tenant's store (Naive docs/design/RAW_TRIAGE_2026-11-09.md,
// item 5). A raw entry is an ordinary record row in naive_records (platform/connectors/postgres.ts), so it is already
// append-only and hash-chained. This file adds three things on the same database:
//
//   a claims table   naive_triage_claims, one row per (tenant, raw path), inserted once and never changed, so exactly
//                    one worker triages an entry, however many are listening
//   a trigger        after insert on naive_records, pg_notify('naive_raw', '<tenant>:<path>') for a raw entry's path
//   a worker         sweeps every unclaimed entry at start, then claims each notified one and hands it to triage
//
// Triage itself is injected (the LangGraph graph, item 4), so this file never calls a model.
//
//   import { ensureIntake, claim, unclaimed, startWorker } from "./raw-intake.ts"

import pg from "pg";
import type { Client } from "../connectors/postgres.ts";
import { TABLE } from "../connectors/postgres.ts";

export const CLAIMS = "naive_triage_claims";
export const CHANNEL = "naive_raw";

/**
 * A raw entry's path, anywhere under the tenant: a capture in the founder's words (raw/dump/<id>.md) or a
 * reference's text (raw/sources/<id>/text.md). source.json is not an entry: its text.md is, and it is written
 * with it. The same pattern is in the trigger below.
 */
export const RAW_ENTRY = /(^|\/)raw\/(dump\/[a-z0-9][a-z0-9-]*\.md|sources\/[a-z0-9][a-z0-9-]*\/text\.md)$/;
const RAW_ENTRY_SQL = "(^|/)raw/(dump/[a-z0-9][a-z0-9-]*\\.md|sources/[a-z0-9][a-z0-9-]*/text\\.md)$";

export const isRawEntry = (path: string): boolean => RAW_ENTRY.test(path);

/** The claims table, kept append-only like naive_records, and the trigger that notifies. Safe to run more than once. */
export const INTAKE_SCHEMA = `
create table if not exists ${CLAIMS} (
  tenant text not null,
  raw_path text not null,
  worker text not null,
  claimed_at timestamptz not null default now(),
  primary key (tenant, raw_path)
);
create or replace function ${CLAIMS}_append_only() returns trigger language plpgsql as $$
begin raise exception '${CLAIMS} is append-only: % refused', tg_op; end $$;
drop trigger if exists ${CLAIMS}_append_only on ${CLAIMS};
create trigger ${CLAIMS}_append_only before update or delete on ${CLAIMS} for each row execute function ${CLAIMS}_append_only();
create or replace function ${TABLE}_notify_raw() returns trigger language plpgsql as $$
begin
  if new.path ~ '${RAW_ENTRY_SQL}' then perform pg_notify('${CHANNEL}', new.tenant || ':' || new.path); end if;
  return new;
end $$;
drop trigger if exists ${TABLE}_notify_raw on ${TABLE};
create trigger ${TABLE}_notify_raw after insert on ${TABLE} for each row execute function ${TABLE}_notify_raw();
`;

/** Creates the claims table and the trigger. naive_records must exist (ensureSchema in connectors/postgres.ts). */
export async function ensureIntake(client: Client): Promise<void> { await client.query(INTAKE_SCHEMA); }

/** Claims one entry for a worker. True for exactly one caller per (tenant, path); every later caller gets false. */
export async function claim(client: Client, tenant: string, path: string, worker: string): Promise<boolean> {
  if (!isRawEntry(path)) return false;
  const { rows } = await client.query(
    `insert into ${CLAIMS} (tenant, raw_path, worker) values ($1, $2, $3) on conflict do nothing returning raw_path`,
    [tenant, path, worker]);
  return rows.length === 1;
}

/** Every raw entry with no claim, oldest first: what a worker triages at start so a missed notification is never lost. */
export async function unclaimed(client: Client, tenant?: string): Promise<{ tenant: string, path: string }[]> {
  const { rows } = await client.query(
    `select r.tenant, r.path, min(r.seq) as first from ${TABLE} r
       left join ${CLAIMS} c on c.tenant = r.tenant and c.raw_path = r.path
      where c.raw_path is null and r.path ~ $1 and ($2::text is null or r.tenant = $2)
      group by r.tenant, r.path order by first`,
    [RAW_ENTRY_SQL, tenant ?? null]);
  return rows.map((r) => ({ tenant: String(r.tenant), path: String(r.path) }));
}

/** Splits a notification payload, '<tenant>:<path>'. Tenant ids never hold a colon (connectors/postgres.ts). */
export function parsePayload(payload: string): { tenant: string, path: string } | null {
  const i = payload.indexOf(":");
  if (i <= 0) return null;
  return { tenant: payload.slice(0, i), path: payload.slice(i + 1) };
}

export interface Listener {
  /** Subscribes to the channel and calls back with each payload. */
  listen(channel: string, onPayload: (payload: string) => void): Promise<void>
  close(): Promise<void>
}

/** A LISTEN on one dedicated node-postgres connection. Neon's pooled endpoint does not keep a session; use the direct one. */
export async function pgListener(url = "MENTURA_DATABASE_URL"): Promise<Listener> {
  const conn = process.env[url];
  if (!conn) throw new Error(`no connection string in ${url}: set it to the database's direct (unpooled) URL`);
  const c = new pg.Client({ connectionString: conn });
  await c.connect();
  return {
    async listen(channel, onPayload) {
      c.on("notification", (m) => { if (m.channel === channel && m.payload) onPayload(m.payload); });
      await c.query(`listen ${channel}`);
    },
    close: () => c.end(),
  };
}

export type Triage = (entry: { tenant: string, path: string }) => Promise<void>;

export interface Worker {
  /** Resolves when every entry handed over so far has been triaged. */
  idle(): Promise<void>
  stop(): Promise<void>
  /** What this worker claimed, in order. */
  claimed: { tenant: string, path: string }[]
}

/**
 * Starts a worker: listens first (so nothing written during the sweep is missed), sweeps the unclaimed entries,
 * then claims and triages each notified one. Entries are triaged one at a time. A triage that throws is reported
 * through onError and its claim stays; the graph's checkpoint is how such a run resumes.
 */
export async function startWorker(opts: { client: Client, listener: Listener, triage: Triage, worker: string, tenant?: string,
  onError?: (entry: { tenant: string, path: string }, e: unknown) => void }): Promise<Worker> {
  const { client, listener, triage, worker, tenant } = opts;
  const onError = opts.onError ?? ((entry, e) => console.error(`triage of ${entry.tenant}:${entry.path} failed: ${e instanceof Error ? e.message : String(e)}`));
  const claimed: { tenant: string, path: string }[] = [];
  let chain: Promise<void> = Promise.resolve();
  let stopped = false;
  const take = (entry: { tenant: string, path: string }) => {
    chain = chain.then(async () => {
      if (stopped || (tenant && entry.tenant !== tenant)) return;
      if (!(await claim(client, entry.tenant, entry.path, worker))) return;
      claimed.push(entry);
      try { await triage(entry); } catch (e) { onError(entry, e); }
    });
  };
  await listener.listen(CHANNEL, (payload) => { const e = parsePayload(payload); if (e) take(e); });
  for (const e of await unclaimed(client, tenant)) take(e);
  return {
    idle: async () => { let seen: Promise<void>; do { seen = chain; await seen; } while (seen !== chain); },
    stop: async () => { stopped = true; await chain; await listener.close(); },
    claimed,
  };
}
