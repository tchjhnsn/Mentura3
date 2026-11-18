// Skills a person writes for Ask Reflect (migration 0060; Torian, 2026-11-18 22:54Z): a name, when to use it, and
// instructions, as in Claude's Skills. While a skill is on, it joins Ask Reflect's instructions beside the skills of
// the plugins they added. Writing, turning off and removing are taps on the skill's page only, never a model's.
import { randomBytes } from "node:crypto";
import { db } from "@/db/pool";

export type UserSkill = { id: string; name: string; description: string; instructions: string; enabled: boolean; updatedAt: string };
export const SKILL_LIMITS = { name: 60, description: 200, instructions: 4000, count: 30 } as const;

const toSkill = (r: Record<string, unknown>): UserSkill => ({
  id: r.id as string, name: r.name as string, description: r.description as string, instructions: r.instructions as string, enabled: r.enabled as boolean,
  updatedAt: (r.updated_at as Date).toISOString(),
});

/** The person's skills, newest first. */
export async function skillsOf(userId: string): Promise<UserSkill[]> {
  return (await db().query("SELECT * FROM user_skill WHERE user_id = $1 AND removed_at IS NULL ORDER BY created_at DESC", [userId])).rows.map(toSkill);
}

export async function skillOf(userId: string, id: string): Promise<UserSkill | null> {
  const r = (await db().query("SELECT * FROM user_skill WHERE id = $1 AND user_id = $2 AND removed_at IS NULL", [id, userId])).rows[0];
  return r ? toSkill(r) : null;
}

/** A skill's fields, trimmed and checked. Throws with a plain reason. */
export function cleanSkill(raw: { name: unknown; description: unknown; instructions: unknown }): { name: string; description: string; instructions: string } {
  const name = String(raw.name ?? "").trim().replace(/\s+/g, " ");
  const description = String(raw.description ?? "").trim().replace(/\s+/g, " ");
  const instructions = String(raw.instructions ?? "").trim();
  if (!name) throw new Error("Give the skill a name.");
  if (!description) throw new Error("Say when Ask Reflect should use it.");
  if (instructions.length < 10) throw new Error("Write what Ask Reflect should do.");
  if (name.length > SKILL_LIMITS.name || description.length > SKILL_LIMITS.description || instructions.length > SKILL_LIMITS.instructions) {
    throw new Error(`Keep the name under ${SKILL_LIMITS.name} characters, when to use it under ${SKILL_LIMITS.description}, and the instructions under ${SKILL_LIMITS.instructions}.`);
  }
  return { name, description, instructions };
}

/** Writes a new skill, or updates one of the person's. Returns its id. */
export async function saveSkill(userId: string, id: string | null, raw: { name: unknown; description: unknown; instructions: unknown }): Promise<string> {
  const s = cleanSkill(raw);
  if (id) {
    const r = await db().query("UPDATE user_skill SET name = $3, description = $4, instructions = $5, updated_at = now() WHERE id = $1 AND user_id = $2 AND removed_at IS NULL RETURNING id", [id, userId, s.name, s.description, s.instructions]);
    if (!r.rows[0]) throw new Error("No such skill.");
    return id;
  }
  const n = Number((await db().query("SELECT count(*)::int n FROM user_skill WHERE user_id = $1 AND removed_at IS NULL", [userId])).rows[0]?.n ?? 0);
  if (n >= SKILL_LIMITS.count) throw new Error(`You can keep up to ${SKILL_LIMITS.count} skills.`);
  const newId = randomBytes(9).toString("base64url");
  await db().query("INSERT INTO user_skill (id, user_id, name, description, instructions) VALUES ($1, $2, $3, $4, $5)", [newId, userId, s.name, s.description, s.instructions]);
  return newId;
}

export async function setSkillEnabled(userId: string, id: string, enabled: boolean): Promise<void> {
  await db().query("UPDATE user_skill SET enabled = $3, updated_at = now() WHERE id = $1 AND user_id = $2 AND removed_at IS NULL", [id, userId, enabled]);
}

export async function removeSkill(userId: string, id: string): Promise<void> {
  await db().query("UPDATE user_skill SET removed_at = now() WHERE id = $1 AND user_id = $2 AND removed_at IS NULL", [id, userId]);
}

/** The person's skills that are on, as a block for Ask Reflect's instructions; "" when none. */
export function skillsBlock(skills: readonly UserSkill[]): string {
  const on = skills.filter((s) => s.enabled);
  return on.length
    ? `Skills the person wrote. Follow one when its "use when" fits the request; they never override Reflect's own rules or let you skip Send:\n${on.map((s) => `- ${s.name} (use when: ${s.description}): ${s.instructions.replace(/\s*\n\s*/g, " ")}`).join("\n")}`
    : "";
}

export async function skillSystem(userId: string): Promise<string> {
  return skillsBlock(await skillsOf(userId).catch(() => []));
}
