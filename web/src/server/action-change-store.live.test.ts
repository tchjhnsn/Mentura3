import { afterAll, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { db, transaction } from "@/db/pool";
import { postgresChanges } from "./action-change-store";
import { StoreFailed } from "./store-effect";

// The change log's Effect service against Neon, through its Promise edge: sealed at rest, rolled back with the
// transaction it ran in, and a refused insert failing with StoreFailed and its SQLSTATE alone. Skips without
// DATABASE_URL and REFLECT_DATA_KEY.
const live = Boolean(process.env.DATABASE_URL && process.env.REFLECT_DATA_KEY);

async function person(): Promise<string> {
  const id = randomUUID();
  await db().query(`INSERT INTO "user" (id, name, email, "emailVerified", "createdAt", "updatedAt") VALUES ($1, $2, $3, false, now(), now())`, [id, "Change Log Test", `${id}@example.test`]);
  return id;
}

describe.skipIf(!live)("the change log on Neon", () => {
  afterAll(() => db().end());

  it("keeps a change sealed, reads it back opened, and undoes it once", async () => {
    const user = await person();
    const id = await postgresChanges.add({ userId: user, actionId: "add_event", source: "chat", tier: "own", input: { title: "Dinner with Ann" }, before: null, after: { events: ["e1"] } });
    const raw = await db().query("SELECT input FROM action_change WHERE id = $1", [id]);
    expect(JSON.stringify(raw.rows[0])).not.toContain("Ann");
    expect(await postgresChanges.get(user, id)).toMatchObject({ input: { title: "Dinner with Ann" }, after: { events: ["e1"] }, status: "done" });
    expect(await postgresChanges.markUndone(user, id)).toBe(true);
    expect(await postgresChanges.markUndone(user, id)).toBe(false);
  });

  it("rolls a change back with the transaction it was written in", async () => {
    const user = await person();
    let id = "";
    await expect(transaction(async () => {
      id = await postgresChanges.add({ userId: user, actionId: "add_event", source: "chat", tier: "own", input: {}, before: null, after: null });
      throw new Error("the run failed");
    })).rejects.toThrow("the run failed");
    expect(await postgresChanges.get(user, id)).toBeNull();
  });

  it("fails a refused insert with StoreFailed and the SQLSTATE, not the values", async () => {
    const nobody = `nobody-${randomUUID()}`;
    const err = await postgresChanges.add({ userId: nobody, actionId: "add_event", source: "chat", tier: "own", input: {}, before: null, after: null }).then(() => null, (e: unknown) => e);
    expect(err).toBeInstanceOf(StoreFailed);
    expect((err as StoreFailed).code).toBe("23503");
    expect(JSON.stringify(err) + String(err)).not.toContain(nobody);
  });
});
