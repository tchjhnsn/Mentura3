// Get to know you as actions (design guide "Get to know you: person dashboard", 2026-11-19): picking a real book,
// podcast from `@reflect/core/interest-catalogue` keeps it as an interest (work app's hidden kind
// "interest"), Sort sets its modes (Make, Do, Know) and each mode's levels from `@reflect/core/interests`, and the
// dashboard card's areas are marked done, skipped or put off (kind "interest-areas"). The pages run these same
// entries, so every change is in the change log and can be undone.
import { z } from "zod";
import { COMMITMENT, DEPTH, MODES, SKILL } from "@reflect/core/interests";
import { AREAS, firstMode, itemOf } from "@reflect/core/interest-catalogue";
import { addLifeRecord, lifeRecords, removeLifeRecord, saveLifeRecord, setLifeField, setLifeState, type LifeRecord } from "../life-store";
import { interestsPart } from "../interests-store";
import { action, type ActionContext, type LoggedChange } from "./types";

const ids = <T extends { id: string }>(xs: readonly T[]) => xs.map((x) => x.id) as [T["id"], ...T["id"][]];
const MODE_IDS = ids(MODES), COMMIT_IDS = ids(COMMITMENT), DEPTH_IDS = ids(DEPTH), SKILL_IDS = ids(SKILL), AREA_IDS = ids(AREAS);
const ref = z.string().max(80).describe("The thing's catalogue id from Get to know you, such as 'b-meditations' or 'm-nina-simone'");

async function recordOf(userId: string, r: string): Promise<LifeRecord | undefined> {
  return (await lifeRecords(userId, "work")).find((x) => x.kind === "interest" && x.body.ref === r);
}
async function keptOf(userId: string, r: string): Promise<LifeRecord> {
  const rec = await recordOf(userId, r);
  if (!rec || rec.state === "let-go") throw new Error("That is not one of your interests.");
  return rec;
}

type Snap = { id: string; body: Record<string, unknown>; state: string | null } | null;
const snap = async (userId: string, r: string): Promise<{ interest: Snap }> => {
  const rec = await recordOf(userId, r);
  return { interest: rec ? { id: rec.id, body: rec.body, state: rec.state } : null };
};
const putBack = async ({ userId }: ActionContext, c: LoggedChange) => {
  const before = c.before as { interest?: Snap } | null;
  if (!before || !("interest" in before)) throw new Error("This change cannot be undone.");
  const was = before.interest ?? null;
  const after = c.after as { id?: string } | null;
  if (!was) {
    if (after?.id) await removeLifeRecord(userId, after.id);
    return;
  }
  await saveLifeRecord(userId, was.id, was.body);
  await setLifeState(userId, was.id, was.state ?? "kept");
};

export const pickInterest = action({
  id: "pick_interest",
  title: "Pick or unpick a book or podcast",
  description: "Keep a real book or podcast show from Get to know you (by catalogue id) as one of the person's interests, or let it go with picked false. A new pick starts as something they follow (Know). Only the person's own picks.",
  tier: "own",
  on: ["chat", "mcp"],
  input: z.object({ ref, picked: z.boolean().default(true) }),
  run: async ({ userId }, { ref: r, picked }) => {
    const item = itemOf(r);
    if (!item) throw new Error("No such thing in the catalogue.");
    const had = await recordOf(userId, r);
    if (!picked) {
      if (had && had.state !== "let-go") await setLifeState(userId, had.id, "let-go");
      return { id: had?.id ?? null, ref: r, picked: false };
    }
    if (had) {
      if (had.state === "let-go") await setLifeState(userId, had.id, "kept");
      return { id: had.id, ref: r, picked: true, href: `/me/interests/${r}` };
    }
    const id = await addLifeRecord(userId, "work", "interest", { ref: r, title: item.title, area: item.area, modes: firstMode(item), source: "told" }, "kept");
    return { id, ref: r, picked: true, href: `/me/interests/${r}` };
  },
  before: ({ userId }, { ref: r }) => snap(userId, r),
  change: (r, _i, before) => ({ before, after: r }),
  undo: putBack,
});

const level = <T extends [string, ...string[]]>(xs: T) => z.enum(xs).nullable().optional();

export const setInterest = action({
  id: "set_interest",
  title: "Sort an interest into Make, Do, Know and set its levels",
  description: `Set how the person holds one of their interests: modes (any of ${MODE_IDS.join(", ")}), and for each mode its commitment (${COMMIT_IDS.join(", ")}), plus skill for make and do (${SKILL_IDS.join(", ")}) or depth for know (${DEPTH_IDS.join(", ")}). Only fields given change; null clears one. Only the person's own word.`,
  tier: "own",
  on: ["chat", "mcp"],
  input: z.object({
    ref,
    modes: z.array(z.enum(MODE_IDS)).max(3).optional(),
    make_commitment: level(COMMIT_IDS), make_skill: level(SKILL_IDS),
    do_commitment: level(COMMIT_IDS), do_skill: level(SKILL_IDS),
    know_commitment: level(COMMIT_IDS), know_depth: level(DEPTH_IDS),
  }),
  run: async ({ userId }, { ref: r, modes, ...levels }) => {
    const rec = await keptOf(userId, r);
    const body: Record<string, unknown> = { ...rec.body };
    if (modes) body.modes = MODE_IDS.filter((m) => modes.includes(m)).join(",");
    for (const [k, v] of Object.entries(levels)) {
      if (v === undefined) continue;
      if (v === null) delete body[k]; else body[k] = v;
    }
    await saveLifeRecord(userId, rec.id, body);
    return { id: rec.id, ref: r, modes: String(body.modes ?? "").split(",").filter(Boolean) };
  },
  before: ({ userId }, { ref: r }) => snap(userId, r),
  change: (r, _i, before) => ({ before, after: r }),
  undo: putBack,
});

const AREA_KEYS = ["done", "skipped", "sorted", "later"] as const;
const areasSnap = async (userId: string) => {
  const r = (await lifeRecords(userId, "work")).find((x) => x.kind === "interest-areas");
  return { areas: Object.fromEntries(AREA_KEYS.map((k) => [k, r?.body[k] ? String(r.body[k]) : null])) as Record<(typeof AREA_KEYS)[number], string | null> };
};
const csv = (v: string | null) => (v ?? "").split(",").filter(Boolean);

export const setInterestArea = action({
  id: "set_interest_area",
  title: "Mark a Get to know you area done, skipped or open",
  description: `Mark one area of the Get to know you card (${AREA_IDS.join(", ")}) as done, skipped or open again; mark sorting done with sorted; or put the whole card off until a date (later, YYYY-MM-DD; null brings it back).`,
  tier: "own",
  on: ["chat", "mcp"],
  input: z.object({
    area: z.enum(AREA_IDS).optional(),
    as: z.enum(["done", "skipped", "open"]).optional(),
    sorted: z.boolean().optional(),
    later: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  }),
  run: async ({ userId }, { area, as, sorted, later }) => {
    const { areas } = await areasSnap(userId);
    let done = csv(areas.done), skipped = csv(areas.skipped);
    if (area && as) {
      done = done.filter((a) => a !== area); skipped = skipped.filter((a) => a !== area);
      if (as === "done") done.push(area);
      if (as === "skipped") skipped.push(area);
      await setLifeField(userId, "work", "interest-areas", "done", done.join(",") || null);
      await setLifeField(userId, "work", "interest-areas", "skipped", skipped.join(",") || null);
    }
    if (sorted !== undefined) await setLifeField(userId, "work", "interest-areas", "sorted", sorted ? "yes" : null);
    if (later !== undefined) await setLifeField(userId, "work", "interest-areas", "later", later);
    return { done, skipped, sorted: sorted ?? areas.sorted === "yes", later: later === undefined ? areas.later : later };
  },
  before: ({ userId }) => areasSnap(userId),
  change: (r, _i, before) => ({ before, after: r }),
  undo: async ({ userId }, c) => {
    const before = c.before as { areas?: Record<string, string | null> } | null;
    if (!before?.areas) throw new Error("This change cannot be undone.");
    for (const k of AREA_KEYS) await setLifeField(userId, "work", "interest-areas", k, before.areas[k] ?? null);
  },
});

const INTERESTS_PATHS = "'' (all, with Get to know you progress), 'make', 'do', 'know', 'books', 'podcasts', or one thing's id such as 'b-meditations'";
export const interests = action({
  id: "interests",
  title: "Read what the person loves",
  description: `Fetch the person's interests from Get to know you: each thing, whether they make, do or follow it, its levels, and a plain sentence for each. Fetch the smallest part that answers. Paths: ${INTERESTS_PATHS}.`,
  tier: "read",
  on: ["chat", "mcp"],
  input: z.object({ path: z.string().max(120).default("").describe("Such as 'know' or 'b-meditations'") }),
  run: async ({ userId }, { path }) => (await interestsPart(userId, path)) ?? { error: `Nothing at '${path}'. Paths: ${INTERESTS_PATHS}.` },
});
