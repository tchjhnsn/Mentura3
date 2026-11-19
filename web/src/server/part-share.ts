// Parts shared on a site (migration 0062 `part_share`; plan "Appearance, Virtu and the site editor", PR 4). A
// <Part source="..."> on a page reads its data through the same addressable part paths chat and MCP use
// (adventuresPart, householdPartOf, the ventures in the life store) and shows to visitors only when mayShowPart in
// `@reflect/core/site-page` says so: the owner shared it, and a household part also has its creator's OK. What a
// visitor sees of a part is a small card: names, places and dates, never budgets, ages, people or notes.
import { randomBytes } from "node:crypto";
import { db } from "@/db/pool";
import { mayShowPart, parseSource, type PartShare } from "@reflect/core/site-page";
import { adventuresOf, adventuresPart } from "./adventures";
import { householdOf, householdPartOf } from "./household-store";
import { lifeRecords } from "./life-store";

const newId = () => randomBytes(9).toString("base64url");

/** A part as a visitor sees it. */
export type PartCard = { title: string; lines: string[]; items: string[] };
/** A part the person may put on their site, for the library. */
export type PublishablePart = { source: string; label: string; group: "tiles" | "household" | "shared"; state: "shared" | "not shared" | "waiting" };

/** Live shares of these sources on this owner's site. */
async function sharesFor(ownerId: string, sources: readonly string[]): Promise<PartShare[]> {
  if (!sources.length) return [];
  const r = await db().query("SELECT owner_id, source, created_by FROM part_share WHERE owner_id = $1 AND source = ANY($2) AND unshared_at IS NULL", [ownerId, sources]);
  return r.rows.map((x) => ({ ownerId: x.owner_id as string, source: x.source as string, createdBy: x.created_by as string }));
}

/** Who made the person's household, whose OK a household part needs; null without a household. */
export async function householdCreatorOf(userId: string): Promise<string | null> {
  const r = await db().query("SELECT h.created_by FROM household h JOIN household_member m ON m.household_id = h.id WHERE m.user_id = $1 AND m.removed_at IS NULL", [userId]);
  return (r.rows[0]?.created_by as string | undefined) ?? null;
}

/** Which of these sources may show on the owner's site. The one access rule, asked once per page. */
export async function visibleParts(ownerId: string, sources: readonly string[]): Promise<Set<string>> {
  const [shares, creator] = await Promise.all([sharesFor(ownerId, sources), sources.some((s) => s.startsWith("household")) ? householdCreatorOf(ownerId) : Promise.resolve(null)]);
  return new Set(sources.filter((s) => mayShowPart(s, ownerId, shares, creator)));
}

const day = (s: string | null) => (s ? new Date(`${s}T12:00:00Z`).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" }) : null);

/** The card of one part, read through its part path; null when the part is gone. Call only after visibleParts allows it, or for the owner. */
export async function partCard(ownerId: string, source: string): Promise<PartCard | null> {
  const s = parseSource(source);
  if (!s) return null;
  if (s.domain === "adventures") {
    const a = s.path ? await adventuresPart(ownerId, s.path) : null;
    if (!a || Array.isArray(a) || typeof a !== "object" || !("name" in a)) return null;
    const adv = a as Awaited<ReturnType<typeof adventuresOf>>[number];
    const when = [day(adv.start), day(adv.end)].filter(Boolean).join(" to ");
    return { title: adv.name, lines: [adv.place, when || null, adv.done ? "Done" : "Not yet"].filter((x): x is string => !!x), items: adv.plan.map((d) => d.title ?? d.day ?? "").filter(Boolean).slice(0, 14) };
  }
  if (s.domain === "ventures") {
    const v = (await lifeRecords(ownerId, "ventures")).find((r) => r.kind === "venture" && r.id === s.path && r.state !== "closed");
    if (!v) return null;
    return { title: String(v.body.name ?? "Venture"), lines: typeof v.body.what === "string" && v.body.what.trim() ? [v.body.what.trim()] : [], items: [] };
  }
  const h = await householdPartOf(ownerId, s.path);
  if (h === null || h === undefined) return null;
  if (s.path === "members") {
    const ms = h as { name: string; relation: string }[];
    return { title: "Our household", lines: [], items: ms.map((m) => `${m.name}, ${m.relation.toLowerCase()}`) };
  }
  if (s.path === "counts" || s.path === "") {
    const c = h as { adults: number; children: number; arrangement?: string };
    const n = (k: number, one: string, many: string) => `${k} ${k === 1 ? one : many}`;
    return { title: "Our household", lines: [c.arrangement, `${n(c.adults, "adult", "adults")}, ${n(c.children, "child", "children")}`].filter((x): x is string => !!x), items: [] };
  }
  return null;
}

/** What the person may put on their site, with whether each is shared: their adventures and ventures, and their household. */
export async function publishableParts(userId: string): Promise<PublishablePart[]> {
  const [advs, ventures, house, creator] = await Promise.all([
    adventuresOf(userId).catch(() => []),
    lifeRecords(userId, "ventures").catch(() => []),
    householdOf(userId).catch(() => null),
    householdCreatorOf(userId).catch(() => null),
  ]);
  const parts: Omit<PublishablePart, "state">[] = [
    ...advs.map((a) => ({ source: `adventures/${a.id}`, label: `Adventure: ${a.name}`, group: "tiles" as const })),
    ...ventures.filter((v) => v.kind === "venture" && v.state !== "closed").map((v) => ({ source: `ventures/${v.id}`, label: `Venture: ${String(v.body.name ?? "Venture")}`, group: "tiles" as const })),
    ...(house && house.members.length > 1 ? [
      { source: "household/members", label: "Household members", group: "household" as const },
      { source: "household/counts", label: "Household size", group: "household" as const },
    ] : []),
  ];
  const shares = await sharesFor(userId, parts.map((p) => p.source));
  return parts.map((p) => {
    const mine = shares.some((x) => x.source === p.source && x.createdBy === userId);
    const ok = mayShowPart(p.source, userId, shares, creator);
    return { ...p, state: ok ? "shared" : mine ? "waiting" : "not shared" };
  });
}

/** The owner shares a part on their own site. Only a part they may publish. */
export async function shareOnSite(userId: string, source: string): Promise<void> {
  if (!(await publishableParts(userId)).some((p) => p.source === source)) throw new Error("You cannot share that part.");
  await db().query("INSERT INTO part_share (id, owner_id, source, created_by) VALUES ($1, $2, $3, $2) ON CONFLICT (owner_id, source, created_by) WHERE unshared_at IS NULL DO NOTHING", [newId(), userId, source]);
}

/** The owner stops sharing a part; it leaves their pages at once. */
export async function unshareOnSite(userId: string, source: string): Promise<void> {
  await db().query("UPDATE part_share SET unshared_at = now() WHERE owner_id = $1 AND source = $2 AND unshared_at IS NULL", [userId, source]);
}

/** Household parts members asked to put on their sites, waiting for this person's OK as the household's creator. */
export async function householdAsks(creatorId: string): Promise<{ ownerId: string; ownerName: string; source: string }[]> {
  const r = await db().query(
    `SELECT s.owner_id, s.source, u.name FROM part_share s
       JOIN household_member m ON m.user_id = s.owner_id AND m.removed_at IS NULL
       JOIN household h ON h.id = m.household_id AND h.created_by = $1
       JOIN "user" u ON u.id = s.owner_id
      WHERE s.source LIKE 'household%' AND s.created_by = s.owner_id AND s.owner_id <> $1 AND s.unshared_at IS NULL
        AND NOT EXISTS (SELECT 1 FROM part_share c WHERE c.owner_id = s.owner_id AND c.source = s.source AND c.created_by = $1 AND c.unshared_at IS NULL)`,
    [creatorId],
  );
  return r.rows.map((x) => ({ ownerId: x.owner_id as string, ownerName: String(x.name ?? "A member"), source: x.source as string }));
}

/** The household's creator gives their OK for a member's household part. */
export async function okHouseholdPart(creatorId: string, ownerId: string, source: string): Promise<void> {
  if (!(await householdAsks(creatorId)).some((a) => a.ownerId === ownerId && a.source === source)) throw new Error("Nothing is waiting for your OK there.");
  await db().query("INSERT INTO part_share (id, owner_id, source, created_by) VALUES ($1, $2, $3, $4) ON CONFLICT (owner_id, source, created_by) WHERE unshared_at IS NULL DO NOTHING", [newId(), ownerId, source, creatorId]);
}

/** A part's label for the household's page. */
export const householdPartLabel = (source: string) => (source === "household/members" ? "Household members" : source === "household/counts" ? "Household size" : "The household");
