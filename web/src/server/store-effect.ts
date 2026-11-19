// A store's queries as Effects (the third step of adopting Effect, after ./outside.ts): a query that Postgres or the
// driver refuses fails with StoreFailed, which names the store, the operation and the SQLSTATE code and never carries
// the driver's message, detail or values, since those can hold the person's words. `db()` is called when the Effect
// runs, not when it is built, so a query run inside `transaction(f)` (@/db/pool) uses that transaction's connection.
import { Data, Effect } from "effect";
import { db } from "@/db/pool";

/** Postgres or the driver refused a store's query. `code` is the SQLSTATE (for example 23503), or null when the
 * failure had none (the connection dropped). The message says only the store, the operation and the code. */
export class StoreFailed extends Data.TaggedError("StoreFailed")<{
  readonly store: string;
  readonly op: string;
  readonly code: string | null;
  readonly message: string;
}> {}

const SQLSTATE = /^[0-9A-Z]{5}$/;

/** The SQLSTATE of a driver error, or null. */
export function sqlstate(err: unknown): string | null {
  const code = err && typeof err === "object" ? (err as { code?: unknown }).code : undefined;
  return typeof code === "string" && SQLSTATE.test(code) ? code : null;
}

/** A StoreFailed for this store and operation from a driver error, keeping only its SQLSTATE. */
export function storeFailed(store: string, op: string, err: unknown): StoreFailed {
  const code = sqlstate(err);
  return new StoreFailed({ store, op, code, message: `${store}.${op} failed${code ? ` (SQLSTATE ${code})` : ""}` });
}

/**
 * One query as an Effect: the rows, or StoreFailed. `values` is called when the Effect runs, so sealing happens then;
 * a throw from it (no data key) is a defect, as a throw from a store was before, not a StoreFailed.
 */
export function query(store: string, op: string, text: string, values: () => unknown[] = () => []): Effect.Effect<Record<string, unknown>[], StoreFailed> {
  return Effect.suspend(() => {
    const v = values();
    return Effect.tryPromise({
      try: async () => (await db().query(text, v)).rows as Record<string, unknown>[],
      catch: (err) => storeFailed(store, op, err),
    });
  });
}
