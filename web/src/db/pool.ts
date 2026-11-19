import { AsyncLocalStorage } from "node:async_hooks";
import { Pool, neonConfig, type PoolClient } from "@neondatabase/serverless";
import ws from "ws";

neonConfig.webSocketConstructor = ws;

let pool: Pool | null = null;

function shared(): Pool {
  if (!pool) {
    const url = process.env.DATABASE_URL;
    if (!url && process.env.NEXT_PHASE !== "phase-production-build") throw new Error("DATABASE_URL is not set");
    pool = new Pool({ connectionString: url });
  }
  return pool;
}

// One transaction around a unit of work (an action's run and its change log, ../server/actions/run.ts). Inside
// `transaction(f)`, every `db()` call goes to one connection holding BEGIN, opened on the first query, so a run that
// never touches Postgres opens nothing. Each query runs in its own savepoint, so code that catches a failed query and
// goes on (many stores do) leaves the transaction usable, as it would on the pool. A store's own BEGIN, COMMIT and
// ROLLBACK on a client from `db().connect()` become a savepoint, its release and a rollback to it, and release() does
// nothing. A nested `transaction(f)` is a savepoint too. Operations on the connection run one at a time (the queue),
// so Promise.all over queries keeps each savepoint whole. Two store transactions open at once on one connection
// cannot keep savepoint order; that is refused with an error rather than committed out of order.

type Savepoint = { name: string; issued: boolean };
type Scope = {
  client: Promise<PoolClient> | null;
  queue: Promise<unknown>;
  stack: Savepoint[];
  n: number;
};

const scopes = new AsyncLocalStorage<Scope>();

/** Runs `f` after everything queued before it on the scope, one at a time. */
function serial<T>(s: Scope, f: () => Promise<T>): Promise<T> {
  const next = s.queue.then(f);
  s.queue = next.catch(() => undefined);
  return next;
}

/**
 * The scope's connection, opened with BEGIN on first use. Savepoints opened before anything touched Postgres are
 * issued here, just before the first query that needs them, so a nested transaction that queries nothing costs nothing.
 */
async function connection(s: Scope): Promise<PoolClient> {
  s.client ??= shared().connect().then(async (c) => {
    await c.query("BEGIN");
    return c;
  });
  const c = await s.client;
  for (const sp of s.stack) {
    if (sp.issued) continue;
    await c.query(`SAVEPOINT ${sp.name}`);
    sp.issued = true;
  }
  return c;
}

/** Runs `f` on the scope's connection, after everything queued before it. */
const queued = <T>(s: Scope, f: (c: PoolClient) => Promise<T>): Promise<T> => serial(s, async () => f(await connection(s)));

const open = (s: Scope): Promise<string> =>
  serial(s, async () => {
    const name = `reflect_sp_${++s.n}`;
    s.stack.push({ name, issued: false });
    return name;
  });

function close(s: Scope, name: string, keep: boolean): Promise<void> {
  return serial(s, async () => {
    const top = s.stack[s.stack.length - 1];
    if (top?.name !== name) throw new Error("Two transactions were open at once on one connection.");
    s.stack.pop();
    if (!top.issued || !s.client) return;
    const c = await s.client;
    if (!keep) await c.query(`ROLLBACK TO SAVEPOINT ${name}`);
    await c.query(`RELEASE SAVEPOINT ${name}`);
  });
}

type Query = (text: string, values?: unknown[]) => Promise<unknown>;

/** One query in its own savepoint: a failure rolls back that query alone and is thrown. */
const scopedQuery = (s: Scope): Query => (text, values) =>
  queued(s, async (c) => {
    const name = `reflect_q_${++s.n}`;
    await c.query(`SAVEPOINT ${name}`);
    try {
      const r = await c.query(text, values);
      await c.query(`RELEASE SAVEPOINT ${name}`);
      return r;
    } catch (err) {
      await c.query(`ROLLBACK TO SAVEPOINT ${name}`);
      await c.query(`RELEASE SAVEPOINT ${name}`);
      throw err;
    }
  });

/** A client from `db().connect()` inside a scope: its BEGIN, COMMIT and ROLLBACK become one savepoint. */
function scopedClient(s: Scope) {
  const query = scopedQuery(s);
  let name: string | null = null;
  return {
    async query(text: string, values?: unknown[]) {
      const word = text.trim().toUpperCase();
      if (word === "BEGIN") return void (name = await open(s));
      if (word === "COMMIT" || word === "ROLLBACK") {
        if (!name) return;
        const n = name;
        name = null;
        return void (await close(s, n, word === "COMMIT"));
      }
      return query(text, values);
    },
    release() {},
  };
}

/** The database. Inside `transaction(f)` it is that transaction's connection; elsewhere it is the shared pool. */
export function db(): Pool {
  const s = scopes.getStore();
  if (!s) return shared();
  const facade = { query: scopedQuery(s), connect: async () => scopedClient(s), end: () => shared().end() };
  // The facade answers the three calls the app makes on db() (query, connect, end); Pool's overloads cannot be
  // written out for it, so it is typed as the Pool it stands in for.
  return facade as unknown as Pool;
}

/** Whether the caller is inside `transaction(f)`. */
export const inTransaction = (): boolean => scopes.getStore() !== undefined;

/**
 * Run `f` in one transaction: everything it writes through `db()` commits together when it returns and rolls back
 * when it throws. Inside another transaction it is a savepoint of that one.
 */
export async function transaction<T>(f: () => Promise<T>): Promise<T> {
  const outer = scopes.getStore();
  if (outer) {
    const name = await open(outer);
    try {
      const r = await f();
      await close(outer, name, true);
      return r;
    } catch (err) {
      await close(outer, name, false).catch(() => undefined);
      throw err;
    }
  }
  const s: Scope = { client: null, queue: Promise.resolve(), stack: [], n: 0 };
  let result: T;
  try {
    result = await scopes.run(s, f);
  } catch (err) {
    await finish(s, false).catch(() => undefined);
    throw err;
  }
  await finish(s, true);
  return result;
}

/** Commits or rolls back after everything queued, and gives the connection back. */
async function finish(s: Scope, keep: boolean): Promise<void> {
  if (!s.client) return;
  const conn = s.client;
  await s.queue;
  const c = await conn;
  try {
    await c.query(keep ? "COMMIT" : "ROLLBACK");
  } catch (err) {
    if (keep) await c.query("ROLLBACK").catch(() => undefined);
    throw err;
  } finally {
    c.release();
  }
}
