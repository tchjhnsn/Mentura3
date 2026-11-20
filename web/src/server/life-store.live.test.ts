import { afterAll, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { db } from "@/db/pool";
import { addLifeRecord, auditLifeRecords, lifeRecords } from "./life-store";

// Life records against Neon: a write the kind's schema refuses leaves no row, a valid one is kept and sealed, and the
// read-only audit reads every stored body and counts it. Skips without DATABASE_URL and REFLECT_DATA_KEY.
const live = Boolean(process.env.DATABASE_URL && process.env.REFLECT_DATA_KEY);

async function person(): Promise<string> {
  const id = randomUUID();
  await db().query(`INSERT INTO "user" (id, name, email, "emailVerified", "createdAt", "updatedAt") VALUES ($1, $2, $3, false, now(), now())`, [id, "Life Check Test", `${id}@example.test`]);
  return id;
}

describe.skipIf(!live)("life records on Neon", () => {
  afterAll(() => db().end());

  it("refuses a body its schema refuses, keeps a valid one, and the audit counts it", async () => {
    const user = await person();
    await expect(addLifeRecord(user, "home", "belonging", { name: "Bike", value: "about four hundred" })).rejects.toMatchObject({ reason: "bad-input" });
    expect(await lifeRecords(user, "home")).toEqual([]);
    const before = (await auditLifeRecords()).find((k) => k.app === "home" && k.kind === "belonging")!;
    await addLifeRecord(user, "home", "belonging", { name: "Bike", value: "400" });
    const rows = await db().query("SELECT body_ct FROM life_record WHERE user_id = $1", [user]);
    expect(JSON.stringify(rows.rows)).not.toContain("Bike");
    const after = (await auditLifeRecords()).find((k) => k.app === "home" && k.kind === "belonging")!;
    expect(after.records).toBe(before.records + 1);
    expect(after.pass).toBe(before.pass + 1);
  });
});
