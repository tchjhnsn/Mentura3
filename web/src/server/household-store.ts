// The household (migration 0042, `@reflect/core/household`). Members' facts are sealed with the household's key, so
// each member reads them and nobody else. A person is in at most one household; joining by invite moves them out of
// a household where they lived alone. Invites are links: only the token's hash is stored.
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { cleanMember, householdPart, type Household, type Member, type MemberBody } from "@reflect/core/household";
import { db } from "@/db/pool";
import { open, seal } from "./crypto";
import { tx } from "./learn-store";

const UUID = /^[0-9a-f-]{36}$/;
const keyOf = (householdId: string) => `household:${householdId}`;
const hash = (token: string) => createHash("sha256").update(token).digest("hex");
const year = () => new Date().getUTCFullYear();
const INVITE_DAYS = 14;

async function nameOf(userId: string): Promise<string> {
  const r = await db().query(`SELECT name FROM "user" WHERE id = $1`, [userId]);
  const n = typeof r.rows[0]?.name === "string" ? r.rows[0].name.trim() : "";
  return n || "You";
}

async function membershipOf(userId: string): Promise<{ householdId: string; memberId: string; role: "admin" | "member" } | null> {
  const r = await db().query("SELECT id, household_id, role FROM household_member WHERE user_id = $1 AND removed_at IS NULL", [userId]);
  return r.rows[0] ? { householdId: r.rows[0].household_id, memberId: r.rows[0].id, role: r.rows[0].role } : null;
}

/** The person's household with every member, or null when they have none. */
export async function householdOf(userId: string): Promise<Household | null> {
  const me = await membershipOf(userId);
  if (!me) return null;
  const r = await db().query("SELECT id, user_id, kept_by, role, body_ct FROM household_member WHERE household_id = $1 AND removed_at IS NULL ORDER BY created_at, id", [me.householdId]);
  const members: Member[] = r.rows.map((x) => ({
    ...(JSON.parse(open(keyOf(me.householdId), x.body_ct)) as MemberBody),
    id: x.id,
    account: Boolean(x.user_id),
    you: x.user_id === userId,
    keptBy: x.kept_by ?? null,
    role: x.role,
  }));
  return { id: me.householdId, members };
}

/** The person's household, made with them as its householder when they have none. */
export async function ensureHousehold(userId: string): Promise<Household> {
  if (!(await membershipOf(userId))) {
    const name = await nameOf(userId);
    await tx(async (c) => {
      const id = randomUUID();
      await c.query("INSERT INTO household (id, created_by) VALUES ($1, $2)", [id, userId]);
      await c.query("INSERT INTO household_member (id, household_id, user_id, role, body_ct) VALUES ($1, $2, $3, 'admin', $4)", [randomUUID(), id, userId, seal(keyOf(id), JSON.stringify({ name, relation: "self" } satisfies MemberBody))]);
    });
  }
  return (await householdOf(userId))!;
}

/** Adds a member without a login, kept by the person. */
export async function addMember(userId: string, raw: Record<string, unknown>): Promise<string> {
  const h = await ensureHousehold(userId);
  const body = cleanMember(raw, year());
  if (body.relation === "self") body.relation = "other";
  const id = randomUUID();
  await db().query("INSERT INTO household_member (id, household_id, kept_by, body_ct) VALUES ($1, $2, $3, $4)", [id, h.id, userId, seal(keyOf(h.id), JSON.stringify(body))]);
  return id;
}

/** A member the person may change: themself, one they keep, or anyone when they are the household's admin. */
async function editable(userId: string, memberId: string): Promise<{ householdId: string; member: Member }> {
  if (!UUID.test(memberId)) throw new Error("No such member.");
  const me = await membershipOf(userId);
  const h = me ? await householdOf(userId) : null;
  const m = h?.members.find((x) => x.id === memberId);
  if (!me || !h || !m) throw new Error("No such member.");
  if (!m.you && m.keptBy !== userId && me.role !== "admin") throw new Error("Only they, or whoever keeps their record, can change it.");
  return { householdId: h.id, member: m };
}

export async function saveMember(userId: string, memberId: string, raw: Record<string, unknown>): Promise<void> {
  const { householdId, member } = await editable(userId, memberId);
  const body = cleanMember(raw, year());
  if (member.relation === "self") body.relation = "self";
  else if (body.relation === "self") body.relation = member.relation;
  await db().query("UPDATE household_member SET body_ct = $2, updated_at = now() WHERE id = $1", [memberId, seal(keyOf(householdId), JSON.stringify(body))]);
}

/** Takes a member out of the household. A member with an account leaves by themself, with `leaveHousehold`. */
export async function removeMember(userId: string, memberId: string): Promise<void> {
  const { member } = await editable(userId, memberId);
  if (member.you) throw new Error("Leave the household instead.");
  if (member.account) throw new Error("A member with their own account leaves by themself.");
  await db().query("UPDATE household_member SET removed_at = now() WHERE id = $1 AND removed_at IS NULL", [memberId]);
}

/** The person leaves their household; the members they kept stay, kept by the household's admin. */
export async function leaveHousehold(userId: string): Promise<void> {
  const me = await membershipOf(userId);
  if (!me) return;
  await tx(async (c) => {
    await c.query("UPDATE household_member SET removed_at = now() WHERE id = $1", [me.memberId]);
    const next = await c.query("SELECT user_id FROM household_member WHERE household_id = $1 AND user_id IS NOT NULL AND removed_at IS NULL ORDER BY role = 'admin' DESC, created_at LIMIT 1", [me.householdId]);
    const heir = next.rows[0]?.user_id as string | undefined;
    if (heir) {
      await c.query("UPDATE household_member SET role = 'admin' WHERE household_id = $1 AND user_id = $2", [me.householdId, heir]);
      await c.query("UPDATE household_member SET kept_by = $3 WHERE household_id = $1 AND kept_by = $2 AND removed_at IS NULL", [me.householdId, userId, heir]);
    } else {
      await c.query("UPDATE household_member SET removed_at = now() WHERE household_id = $1 AND removed_at IS NULL", [me.householdId]);
    }
  });
}

export type Invite = { id: string; memberId: string | null; createdAt: string; expiresAt: string };

/** Makes an invite link's token, for a new member or for one already kept who will claim their record. */
export async function createInvite(userId: string, memberId?: string): Promise<string> {
  const h = await ensureHousehold(userId);
  if (memberId) {
    const m = h.members.find((x) => x.id === memberId);
    if (!m || m.account) throw new Error("No such member to invite.");
  }
  const token = randomBytes(24).toString("base64url");
  const expires = new Date(Date.now() + INVITE_DAYS * 86_400_000).toISOString();
  await db().query("INSERT INTO household_invite (id, household_id, token_hash, invited_by, member_id, expires_at) VALUES ($1, $2, $3, $4, $5, $6)", [randomUUID(), h.id, hash(token), userId, memberId ?? null, expires]);
  return token;
}

/** The household's invites still open. */
export async function openInvites(userId: string): Promise<Invite[]> {
  const me = await membershipOf(userId);
  if (!me) return [];
  const r = await db().query("SELECT id, member_id, created_at, expires_at FROM household_invite WHERE household_id = $1 AND accepted_at IS NULL AND revoked_at IS NULL AND expires_at > now() ORDER BY created_at DESC", [me.householdId]);
  return r.rows.map((x) => ({ id: x.id, memberId: x.member_id ?? null, createdAt: new Date(x.created_at).toISOString(), expiresAt: new Date(x.expires_at).toISOString() }));
}

export async function revokeInvite(userId: string, inviteId: string): Promise<void> {
  if (!UUID.test(inviteId)) return;
  const me = await membershipOf(userId);
  if (!me) return;
  await db().query("UPDATE household_invite SET revoked_at = now() WHERE id = $1 AND household_id = $2 AND accepted_at IS NULL", [inviteId, me.householdId]);
}

type Found = { id: string; householdId: string; inviter: string; memberId: string | null };

async function findInvite(token: string): Promise<Found | null> {
  if (!/^[A-Za-z0-9_-]{20,64}$/.test(token)) return null;
  const r = await db().query("SELECT id, household_id, invited_by, member_id FROM household_invite WHERE token_hash = $1 AND accepted_at IS NULL AND revoked_at IS NULL AND expires_at > now()", [hash(token)]);
  const x = r.rows[0];
  return x ? { id: x.id, householdId: x.household_id, inviter: await nameOf(x.invited_by), memberId: x.member_id ?? null } : null;
}

/** What an invite link offers, for its page: who invited and, when claiming, the record's name. */
export async function inviteInfo(token: string): Promise<{ inviter: string; claim: string | null } | null> {
  const f = await findInvite(token);
  if (!f) return null;
  let claim: string | null = null;
  if (f.memberId) {
    const r = await db().query("SELECT body_ct FROM household_member WHERE id = $1 AND removed_at IS NULL", [f.memberId]);
    if (r.rows[0]) claim = (JSON.parse(open(keyOf(f.householdId), r.rows[0].body_ct)) as MemberBody).name;
  }
  return { inviter: f.inviter, claim };
}

/** Joins the household an invite is for. Someone who lives with others must leave their household first. */
export async function acceptInvite(userId: string, token: string): Promise<void> {
  const f = await findInvite(token);
  if (!f) throw new Error("This invite has expired or was already used.");
  const mine = await householdOf(userId);
  if (mine?.id === f.householdId) throw new Error("You are already in this household.");
  if (mine && mine.members.length > 1) throw new Error("Leave your current household first, in Settings.");
  const name = await nameOf(userId);
  await tx(async (c) => {
    if (mine) await c.query("UPDATE household_member SET removed_at = now() WHERE household_id = $1 AND removed_at IS NULL", [mine.id]);
    let memberId = f.memberId;
    if (memberId) {
      const claimed = await c.query("UPDATE household_member SET user_id = $2, kept_by = NULL, updated_at = now() WHERE id = $1 AND user_id IS NULL AND removed_at IS NULL", [memberId, userId]);
      if (!claimed.rowCount) memberId = null;
    }
    if (!memberId) {
      memberId = randomUUID();
      await c.query("INSERT INTO household_member (id, household_id, user_id, body_ct) VALUES ($1, $2, $3, $4)", [memberId, f.householdId, userId, seal(keyOf(f.householdId), JSON.stringify({ name, relation: "other" } satisfies MemberBody))]);
    }
    await c.query("UPDATE household_invite SET accepted_by = $2, accepted_at = now() WHERE id = $1", [f.id, userId]);
  });
}

/** One part of the person's household by its path (`HOUSEHOLD_PATHS`), or null. */
export async function householdPartOf(userId: string, path: string): Promise<unknown> {
  return householdPart(await householdOf(userId), path, year());
}
