import { afterAll, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { db } from "@/db/pool";
import { acceptFriendInvite, contactsOf, conversation, createFriendInvite, friendInviteInfo, sendMessage, threadsOf } from "./messages-store";

// Friend invites and messages on Neon (migration 0047). Skips without DATABASE_URL and REFLECT_DATA_KEY.
const live = Boolean(process.env.DATABASE_URL && process.env.REFLECT_DATA_KEY);

async function person(name: string): Promise<string> {
  const id = randomUUID();
  await db().query(`INSERT INTO "user" (id, name, email, "emailVerified", "createdAt", "updatedAt") VALUES ($1, $2, $3, false, now(), now())`, [id, name, `${id}@example.test`]);
  return id;
}

describe.skipIf(!live)("messages between members, on Neon", () => {
  afterAll(() => db().end());

  it("connects two people by an invite link, seals their messages and keeps them from anyone else", async () => {
    const ann = await person("Ann");
    const cy = await person("Cy");
    const dot = await person("Dot");

    await expect(sendMessage(ann, cy, "Too soon")).rejects.toThrow(/not someone you can message/);
    const token = await createFriendInvite(ann);
    expect(await friendInviteInfo(token, cy)).toEqual({ inviter: "Ann", own: false });
    expect(await friendInviteInfo(token, ann)).toEqual({ inviter: "Ann", own: true });
    await expect(acceptFriendInvite(ann, token)).rejects.toThrow(/your own invite/);
    await acceptFriendInvite(cy, token);
    await expect(acceptFriendInvite(dot, token)).rejects.toThrow(/expired|used/);
    expect((await contactsOf(ann)).map((c) => [c.name, c.via])).toEqual([["Cy", "friend"]]);

    await sendMessage(ann, cy, "Dinner at six?");
    await sendMessage(cy, ann, "Yes.");
    const raw = await db().query("SELECT body_ct FROM member_message WHERE from_user = $1", [ann]);
    expect(raw.rows[0].body_ct).not.toContain("Dinner");
    expect((await conversation(cy, ann)).messages.map((m) => m.text)).toEqual(["Dinner at six?", "Yes."]);
    expect((await threadsOf(ann))[0]!.last?.text).toBe("Yes.");
    await expect(conversation(dot, ann)).rejects.toThrow(/not someone you can message/);
    await expect(db().query("UPDATE member_message SET body_ct = 'x' WHERE from_user = $1", [ann])).rejects.toThrow(/append-only/);
  });
});
