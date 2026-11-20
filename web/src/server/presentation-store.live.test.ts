import { afterAll, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { draftPresentation, defaultPolicy } from "@reflect/core/presentation";
import { db } from "@/db/pool";
import { postgresPresentations, presentationGate } from "./presentation-store";

// The app's presentations in person_fact against Neon: the policy written once, each record sealed, a new version
// closing the old row, and the gate over a stored record. Skips without DATABASE_URL and REFLECT_DATA_KEY.
const live = Boolean(process.env.DATABASE_URL && process.env.REFLECT_DATA_KEY);

async function person(): Promise<string> {
  const id = randomUUID();
  await db().query(`INSERT INTO "user" (id, name, email, "emailVerified", "createdAt", "updatedAt") VALUES ($1, $2, $3, false, now(), now())`, [id, "Presentation Test", `${id}@example.test`]);
  return id;
}

describe.skipIf(!live)("presentations on Neon", () => {
  afterAll(() => db().end());

  it("keeps the policy and records sealed, every version, and gates on the open one", async () => {
    const user = await person();
    const store = postgresPresentations(user);
    expect(await store.ensurePolicy()).toEqual({ written: true });
    expect(await store.ensurePolicy()).toEqual({ written: false });
    const policy = await store.policy();
    expect(policy.channels.map((c) => c.id)).toEqual(defaultPolicy("x").channels.map((c) => c.id));
    const first = draftPresentation(policy, null, { channel: "personal-site", role: "writer", end: "share what I have thought through" }, { id: "2026-11-19-personal-site", now: new Date() });
    await store.put(first);
    expect(await presentationGate(store, first.id, "personal-site")).toMatchObject({ ready: false, missing: [{ item: "audience" }] });
    await store.put(draftPresentation(policy, first, { channel: "personal-site", audience: "readers of my site" }, { id: first.id, now: new Date() }));
    expect(await presentationGate(store, first.id, "personal-site")).toMatchObject({ ready: true });
    expect((await store.list()).map((p) => p.id)).toEqual([first.id]);
    const rows = await db().query("SELECT value_ct, valid_to FROM person_fact WHERE user_id = $1 AND key = $2 ORDER BY id", [user, `presentation/${first.id}`]);
    expect(rows.rows).toHaveLength(2);
    expect(rows.rows[0].valid_to).not.toBeNull();
    expect(JSON.stringify(rows.rows)).not.toContain("readers of my site");
  });
});
