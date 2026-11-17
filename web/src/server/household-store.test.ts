import { afterAll, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { db } from "@/db/pool";
import { acceptInvite, addMember, createInvite, ensureHousehold, householdOf, householdPartOf, inviteInfo, leaveHousehold, openInvites, removeMember, saveMember } from "./household-store";

const live = Boolean(process.env.DATABASE_URL && process.env.REFLECT_DATA_KEY);

async function person(name: string): Promise<string> {
  const id = randomUUID();
  await db().query(`INSERT INTO "user" (id, name, email, "emailVerified", "createdAt", "updatedAt") VALUES ($1, $2, $3, false, now(), now())`, [id, name, `${id}@example.test`]);
  return id;
}

describe.skipIf(!live)("the household, on Neon", () => {
  afterAll(() => db().end());

  it("adds members without a login, invites people to join or claim, and keeps facts sealed", async () => {
    const ann = await person("Ann");
    const ben = await person("Ben");
    const dot = await person("Dot");

    const h = await ensureHousehold(ann);
    expect(h.members).toMatchObject([{ name: "Ann", relation: "self", you: true, account: true, role: "admin" }]);

    const mom = await addMember(ann, { name: "Mom", relation: "parent", born: "1950" });
    const kid = await addMember(ann, { name: "Cal", relation: "child", born: "2019", dependent: "on" });
    const raw = await db().query("SELECT body_ct FROM household_member WHERE id = $1", [mom]);
    expect(raw.rows[0].body_ct).not.toContain("Mom");

    // Ben joins as someone new; Ben's own solo household is left behind.
    await ensureHousehold(ben);
    const t1 = await createInvite(ann);
    expect(await inviteInfo(t1)).toEqual({ inviter: "Ann", claim: null });
    await acceptInvite(ben, t1);
    await expect(acceptInvite(ben, t1)).rejects.toThrow(/expired|used/);
    const seen = await householdOf(ben);
    expect(seen!.id).toBe(h.id);
    expect(seen!.members.map((m) => m.name)).toEqual(["Ann", "Mom", "Cal", "Ben"]);

    // Ben cannot change the record Ann keeps; Ann can.
    await expect(saveMember(ben, mom, { name: "Mother", relation: "parent" })).rejects.toThrow();
    await saveMember(ann, mom, { name: "Mother", relation: "parent", born: "1950" });

    // Dot claims the record kept for her.
    const t2 = await createInvite(ann, mom);
    expect((await inviteInfo(t2))!.claim).toBe("Mother");
    expect(await openInvites(ann)).toHaveLength(1);
    await acceptInvite(dot, t2);
    const after = await householdOf(dot);
    expect(after!.members.find((m) => m.id === mom)).toMatchObject({ account: true, you: true, keptBy: null });
    await expect(removeMember(ann, mom)).rejects.toThrow(/leaves by themself/);

    expect(await householdPartOf(ann, "counts")).toEqual({ adults: 3, children: 1 });
    expect(await householdPartOf(ann, "arrangement")).toBe("Family household");

    await removeMember(ann, kid);
    await leaveHousehold(ann);
    const left = await householdOf(ben);
    expect(left!.members.map((m) => m.name)).toEqual(["Mother", "Ben"]);
    expect(left!.members.some((m) => m.role === "admin")).toBe(true);
    expect(await householdOf(ann)).toBeNull();
  });
});
