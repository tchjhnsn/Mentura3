// The dashboard's first-party counts and the morning brief's opt-in (migration 0054).
import { db } from "@/db/pool";
import { usageOf, type DashEvent } from "./dashboard-reach";

/** Keeps one open, tap or first act of the person's. */
export async function recordDashEvent(userId: string, e: DashEvent): Promise<void> {
  await db().query("INSERT INTO dashboard_event (user_id, kind, card, ms) VALUES ($1, $2, $3, $4)", [userId, e.kind, e.card, e.ms]);
}

/** Counts across everyone over the last `days` days, for the owner: taps per card and the median time to first act. */
export async function dashUsage(days = 30) {
  const r = await db().query("SELECT kind, card, ms FROM dashboard_event WHERE at > now() - make_interval(days => $1) ORDER BY at DESC LIMIT 50000", [days]);
  const people = await db().query("SELECT count(DISTINCT user_id)::int AS n FROM dashboard_event WHERE at > now() - make_interval(days => $1)", [days]);
  return { days, people: people.rows[0]?.n ?? 0, ...usageOf(r.rows.map((x) => ({ kind: x.kind, card: x.card, ms: x.ms === null ? null : Number(x.ms) }))) };
}

/** Whether the person turned the morning brief on. */
export async function morningBriefOn(userId: string): Promise<boolean> {
  const r = await db().query("SELECT morning_brief FROM dashboard_pref WHERE user_id = $1", [userId]);
  return r.rows[0]?.morning_brief === true;
}

/** Turns the morning brief on or off; returns what it was. */
export async function setMorningBrief(userId: string, on: boolean): Promise<boolean> {
  const was = await morningBriefOn(userId);
  await db().query("INSERT INTO dashboard_pref (user_id, morning_brief) VALUES ($1, $2) ON CONFLICT (user_id) DO UPDATE SET morning_brief = $2, updated_at = now()", [userId, on]);
  return was;
}

/** Everyone who turned the morning brief on, with their name. */
export async function briefReaders(): Promise<{ id: string; name: string }[]> {
  const r = await db().query(`SELECT p.user_id, u.name FROM dashboard_pref p JOIN "user" u ON u.id = p.user_id WHERE p.morning_brief ORDER BY p.user_id LIMIT 5000`);
  return r.rows.map((x) => ({ id: x.user_id, name: typeof x.name === "string" && x.name !== "Owner" ? x.name.split(" ")[0] : "" }));
}
