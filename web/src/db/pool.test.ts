import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db, inTransaction, transaction } from "./pool";

// The transaction scope against a real Postgres: a temporary table per run, dropped at the end.
const live = Boolean(process.env.DATABASE_URL);
const T = `reflect_tx_test_${Math.random().toString(36).slice(2, 10)}`;
const rows = async () => (await db().query(`SELECT v FROM ${T} ORDER BY v`)).rows.map((r) => r.v as string);

describe.skipIf(!live)("transaction", () => {
  beforeAll(async () => {
    await db().query(`CREATE TABLE ${T} (v text PRIMARY KEY)`);
  });
  afterAll(async () => {
    await db().query(`DROP TABLE IF EXISTS ${T}`);
    await db().end();
  });

  it("commits everything written inside when it returns", async () => {
    await transaction(async () => {
      expect(inTransaction()).toBe(true);
      await db().query(`INSERT INTO ${T} VALUES ('a')`);
      await Promise.all(["b", "c"].map((v) => db().query(`INSERT INTO ${T} VALUES ($1)`, [v])));
    });
    expect(inTransaction()).toBe(false);
    expect(await rows()).toEqual(["a", "b", "c"]);
  });

  it("rolls everything back when it throws", async () => {
    await expect(transaction(async () => {
      await db().query(`INSERT INTO ${T} VALUES ('d')`);
      throw new Error("log failed");
    })).rejects.toThrow("log failed");
    expect(await rows()).toEqual(["a", "b", "c"]);
  });

  it("stays usable after a failed query is caught, as on the pool", async () => {
    await transaction(async () => {
      await db().query(`INSERT INTO ${T} VALUES ('a')`).catch(() => null);
      await db().query(`INSERT INTO ${T} VALUES ('e')`);
    });
    expect(await rows()).toEqual(["a", "b", "c", "e"]);
  });

  it("turns a store's own BEGIN and ROLLBACK into a savepoint", async () => {
    await transaction(async () => {
      const c = await db().connect();
      await c.query("BEGIN");
      await c.query(`INSERT INTO ${T} VALUES ('f')`);
      await c.query("ROLLBACK");
      c.release();
      const k = await db().connect();
      await k.query("BEGIN");
      await k.query(`INSERT INTO ${T} VALUES ('g')`);
      await k.query("COMMIT");
      k.release();
    });
    expect(await rows()).toEqual(["a", "b", "c", "e", "g"]);
  });

  it("makes a nested transaction a savepoint of the outer one", async () => {
    await transaction(async () => {
      await db().query(`INSERT INTO ${T} VALUES ('h')`);
      await transaction(async () => {
        await db().query(`INSERT INTO ${T} VALUES ('i')`);
        throw new Error("step failed");
      }).catch(() => null);
    });
    expect(await rows()).toEqual(["a", "b", "c", "e", "g", "h"]);
  });

  it("opens no connection when nothing is queried", async () => {
    await expect(transaction(async () => 7)).resolves.toBe(7);
  });
});
