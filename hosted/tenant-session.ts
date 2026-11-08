// Binds one pooled connection to the account inside a signed assertion.
// The database checks that signature. A tenant id, a session variable, or SET ROLE does not.

import type { Client } from "../connectors/postgres.ts";

type Query = (text: string, params?: unknown[]) => Promise<{ rows: Record<string, unknown>[] }>;

/** One connection whose transactions see only the account named by this assertion. */
export function accountClient(pool: Client, assertion: string): Client {
  const authorize = (query: Query) => query("select mentura_authorize($1)", [assertion]);
  return {
    async query(text, params) {
      const conn = await pool.connect!();
      try {
        await conn.query("begin");
        await authorize(conn.query.bind(conn));
        const result = await conn.query(text, params);
        await conn.query("commit");
        return result;
      } catch (error) {
        try { await conn.query("rollback"); } catch { /* the transaction may already be closed */ }
        throw error;
      } finally {
        conn.release();
      }
    },
    async connect() {
      const conn = await pool.connect!();
      let open = false;
      return {
        async query(text, params) {
          const word = text.trim().split(/\s+/)[0]?.toLowerCase() ?? "";
          if (word === "begin") {
            if (!open) {
              await conn.query("begin");
              await authorize(conn.query.bind(conn));
              open = true;
            }
            return { rows: [] };
          }
          if (word === "commit" || word === "rollback") {
            if (open) {
              await conn.query(word);
              open = false;
            }
            return { rows: [] };
          }
          return conn.query(text, params);
        },
        release() {
          if (open) void conn.query("rollback").finally(() => conn.release());
          else conn.release();
        },
      };
    },
  };
}
