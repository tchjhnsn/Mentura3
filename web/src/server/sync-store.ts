import "server-only";
// The business store behind the sync API: `naive_records` in the account's tenant database (the hosted store,
// packages/platform/README.md "Tenant boundary"). Reads come straight from here; writes go the way the console's
// own writes go, so a push meets the same schema, gate, decision rights and provenance log.
//
//   pull   index and content of the account's rows, bound to the account by the database itself
//   push   the bridge operation `syncPush` through the hosted workspace, as the token's person
//
// The account is not chosen by this process alone. Every query runs in a transaction that first calls
// `mentura_authorize(<signed assertion>)`, and the row policy on `naive_records` then shows only that account's
// rows. That is the same rule as packages/platform/hosted/tenant-session.ts, written out here so the web app's
// type-check does not have to resolve the framework. The tenant is still named in each query as well, so a
// database without the policy applied is scoped too.
//
// The connection string is read from MENTURA_DATABASE_URL by name. Its value is never logged or returned.

import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import { db } from "@/db/pool";
import { signAssertion } from "../../../packages/platform/bridge/assertion.ts";
import { bridgeKey, naiveAs, type Identity } from "./naive";
import { SyncRefusal, type PushOutcome, type SyncBackend } from "./sync-api";
import { changesSince, type RecordStore, type StoredPath } from "./sync-records";
import type { TokenHolder } from "./sync-token";

neonConfig.webSocketConstructor = ws;

const TABLE = "naive_records";
/** The newest row of each path the account holds. */
const INDEX = `select distinct on (path) path, version, seq::text as seq, written_at
  from ${TABLE} where tenant = $1 order by path, seq desc`;
const HEAD = `select coalesce(max(seq), 0)::text as seq from ${TABLE} where tenant = $1`;
const CONTENTS = `select distinct on (path) path, content
  from ${TABLE} where tenant = $1 and path = any($2) order by path, seq desc`;

let pool: Pool | null = null;

/** The tenant database, or null when this site keeps no business store. */
function tenants(): Pool | null {
  const url = process.env.MENTURA_DATABASE_URL;
  if (!url) return null;
  pool ??= new Pool({ connectionString: url });
  return pool;
}

/** The identity a token's person acts under, before their name is read. The person's account is the tenant, so it
 *  is the `userId` the database reads out of the assertion. */
export const identityOf = (who: TokenHolder, profile: Profile = { name: "", email: "" }): Identity => ({
  userId: who.person,
  name: profile.name || "Founder",
  email: profile.email,
  organizationId: who.person,
  organizationRole: "owner",
});

/** The name and email a push is written under. Read here rather than carried in the token, so device sign-in
 *  keeps no copy of a person's profile. */
export interface Profile { name: string; email: string }

export async function profileOf(person: string): Promise<Profile> {
  const r = await db().query(`SELECT name, email FROM "user" WHERE id = $1`, [person]);
  const row = r.rows[0] as { name?: string; email?: string } | undefined;
  return { name: (row?.name ?? "").trim(), email: row?.email ?? "" };
}

const NO_STORE = "this site keeps no business store yet";

/** Runs one query in a transaction the database has bound to this person's account. */
async function asAccount(tenant: Pool, who: TokenHolder, text: string, params: unknown[]): Promise<Record<string, unknown>[]> {
  const assertion = signAssertion(identityOf(who), { op: "sync" }, bridgeKey());
  const conn = await tenant.connect();
  try {
    await conn.query("begin");
    await conn.query("select mentura_authorize($1)", [assertion]);
    const result = await conn.query(text, params);
    await conn.query("commit");
    return result.rows as Record<string, unknown>[];
  } catch (error) {
    await conn.query("rollback").catch(() => undefined);
    throw error;
  } finally {
    conn.release();
  }
}

/** A timestamp from the database as the contract writes it. */
const isoOf = (value: unknown): string =>
  value instanceof Date ? value.toISOString() : typeof value === "string" ? value : new Date(0).toISOString();

/** The account's rows as a store a pull can read. */
export function tenantRecords(tenant: Pool, who: TokenHolder): RecordStore {
  const run = (text: string, params: unknown[]) => asAccount(tenant, who, text, params);
  return {
    head: async () => String((await run(HEAD, [who.person]))[0]?.seq ?? "0"),
    index: async () => (await run(INDEX, [who.person])).map((r): StoredPath => ({
      path: String(r.path),
      version: String(r.version),
      seq: String(r.seq),
      writtenAt: isoOf(r.written_at),
    })),
    contents: async (paths) => new Map((paths.length ? await run(CONTENTS, [who.person, [...paths]]) : [])
      .map((r) => [String(r.path), String(r.content)])),
  };
}

/** Why this site cannot serve sync, or null when it can. */
export function syncUnavailable(): string | null {
  return tenants() ? null : NO_STORE;
}

/** The tenant database, or a refusal naming no host. */
function storeOrRefuse(): Pool {
  const tenant = tenants();
  if (!tenant) throw new Error(NO_STORE);
  return tenant;
}

// A store that could not answer is not the same as a store that refused what was sent. Naive's own "did not finish"
// wording, and this site having no store at all, are the first; everything else the push comes back with is Naive
// refusing the content (a schema, the gate, a path no record owns), which is the client's to fix, so it is a 422.
const UNREACHABLE = /did not finish|keeps no business store|not connected to a venture store/i;

/** A push refusal as the client should read it. */
function pushRefusal(error: unknown): SyncRefusal {
  const message = error instanceof Error && error.message ? error.message : "the business store did not answer";
  return new SyncRefusal(UNREACHABLE.test(message) ? 502 : 422, message);
}

/** The hosted business store as the sync API's backend. */
export function hostedSyncBackend(): SyncBackend {
  return {
    async changes(who, since) {
      return await changesSince(tenantRecords(storeOrRefuse(), who), who.business, since);
    },
    async push(who, input) {
      // The point comes from before the push. A point read after the commit would sit above a write that landed
      // in the store beside this push, and the client's next pull would skip it.
      const point = await tenantRecords(storeOrRefuse(), who).head();
      const out = await naiveAs<{ stale?: { path: string; current: string | null }[]; accepted?: { path: string; version: string }[] }>(
        identityOf(who, await profileOf(who.person)), "syncPush",
        { venture: who.business, changes: input.changes, provenance: input.provenance, working_copy: input.working_copy },
      ).catch((error: unknown) => { throw pushRefusal(error); });
      // A 409 always carries the paths that moved, so the client has something to pull against. A refusal with
      // nothing stale is not a 409: pushRefusal has already made it a 422 or a 502.
      if (out.stale?.length) return { stale: out.stale } satisfies PushOutcome;
      const accepted = out.accepted ?? [];
      if (accepted.length !== input.changes.length) throw new SyncRefusal(502, "the business store did not say what it wrote");
      return { point, accepted } satisfies PushOutcome;
    },
  };
}
