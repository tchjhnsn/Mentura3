// Scholē's crafts as actions (doc "Scholē landing design guide", 2026-11-19): keeping a craft from the catalogue
// (`@reflect/core/crafts`) on the work app's hidden kind "craft", moving it between drawn, trying, practising and let
// go, its Dreyfus stage, how it was learned, what was tried and made, who vouches, and the Discover crafts answers
// (kind "craft-likes"). The crafts pages run these same entries, so their changes are in the change log.
import { z } from "zod";
import { ACTIVITIES, CRAFT_STATES, LEARNED, STAGES, WORLDS, answersBody, craftOf } from "@reflect/core/crafts";
import { addLifeRecord, keepLifeAct, lifeRecords, removeLifeRecord, saveLifeRecord, setLifeField, setLifeState, type LifeRecord } from "../life-store";
import { friendsMet } from "../connect-store";
import { action, type ActionContext, type LoggedChange } from "./types";

const todayOf = (ctx: ActionContext) => ctx.today ?? new Date().toISOString().slice(0, 10);
const STATE_IDS = ["drawn", "trying", "practising", "let-go"] as const satisfies readonly [(typeof CRAFT_STATES)[number]["id"], ...string[]];
const STAGE_IDS = STAGES.map((s) => s.id) as [string, ...string[]];
const LEARNED_IDS = LEARNED.map((l) => l.id) as [string, ...string[]];
const ref = z.string().max(80).describe("The craft's catalogue id, such as 'baking' or 'joinery'");

/** The person's record for a craft, let go included, or undefined. */
async function recordOf(userId: string, r: string): Promise<LifeRecord | undefined> {
  return (await lifeRecords(userId, "work")).find((x) => x.kind === "craft" && x.body.ref === r);
}
/** The person's record for a kept craft, or an error when there is none. */
async function keptOf(userId: string, r: string): Promise<LifeRecord> {
  const rec = await recordOf(userId, r);
  if (!rec) throw new Error("You do not keep that craft.");
  return rec;
}

type Snap = { id: string; body: Record<string, unknown>; state: string | null } | null;
/** The craft's record as it is, for Undo to put back; null when the person does not keep it. */
const snap = async (userId: string, r: string): Promise<{ craft: Snap }> => {
  const rec = await recordOf(userId, r);
  return { craft: rec ? { id: rec.id, body: rec.body, state: rec.state } : null };
};
/** Undo of a change to one craft: put back its fields and state, or remove it when the change kept it first. */
const putCraftBack = async ({ userId }: ActionContext, c: LoggedChange) => {
  const before = c.before as { craft?: Snap } | null;
  if (!before || !("craft" in before)) throw new Error("This change cannot be undone.");
  const was = before.craft ?? null;
  const after = c.after as { id?: string } | null;
  if (!was) {
    if (after?.id) await removeLifeRecord(userId, after.id);
    return;
  }
  await saveLifeRecord(userId, was.id, was.body);
  if (was.state) await setLifeState(userId, was.id, was.state);
};

export const keepCraft = action({
  id: "keep_craft",
  title: "Keep a craft",
  description: "Keep a craft from Scholē's catalogue (by its id, from /schole/making) as one the person is drawn to, or in the state they say (drawn, trying, practising). When they keep it already, this sets its state. Only when the person says so. Its page is /schole/crafts/<id>.",
  tier: "own",
  on: ["chat", "mcp"],
  input: z.object({ ref, state: z.enum(STATE_IDS).optional() }),
  run: async ({ userId }, { ref: r, state }) => {
    const craft = craftOf(r);
    if (!craft) throw new Error("No such craft.");
    const had = await recordOf(userId, r);
    if (had) {
      const to = state ?? (had.state === "let-go" ? "drawn" : null);
      if (to) await setLifeState(userId, had.id, to);
      return { id: had.id, ref: r, state: to ?? had.state, href: `/schole/crafts/${r}` };
    }
    const id = await addLifeRecord(userId, "work", "craft", { ref: r, title: craft.label }, state ?? "drawn");
    return { id, ref: r, state: state ?? "drawn", href: `/schole/crafts/${r}` };
  },
  before: ({ userId }, { ref: r }) => snap(userId, r),
  change: (r, _i, before) => ({ before, after: r }),
  undo: putCraftBack,
});

export const setCraftState = action({
  id: "set_craft_state",
  title: "Move a craft between drawn, trying, practising and let go",
  description: "Set where a craft the person keeps stands: drawn (drawn to it), trying (trying it), practising (they practise it already) or let-go. Only when the person says so.",
  tier: "own",
  on: ["chat", "mcp"],
  input: z.object({ ref, state: z.enum(STATE_IDS) }),
  run: async ({ userId }, { ref: r, state }) => {
    const rec = await keptOf(userId, r);
    await setLifeState(userId, rec.id, state);
    return { id: rec.id, ref: r, state };
  },
  before: ({ userId }, { ref: r }) => snap(userId, r),
  change: (r, _i, before) => ({ before, after: r }),
  undo: putCraftBack,
});

export const setCraftStage = action({
  id: "set_craft_stage",
  title: "Set how far along the person is in a craft",
  description: `Set the stage the person says they have reached in a craft they keep, on the Dreyfus five steps: ${STAGE_IDS.join(", ")}. Only their own word for it.`,
  tier: "own",
  on: ["chat", "mcp"],
  input: z.object({ ref, stage: z.enum(STAGE_IDS) }),
  run: async ({ userId }, { ref: r, stage }) => {
    const rec = await keptOf(userId, r);
    await saveLifeRecord(userId, rec.id, { ...rec.body, stage });
    return { id: rec.id, ref: r, stage };
  },
  before: ({ userId }, { ref: r }) => snap(userId, r),
  change: (r, _i, before) => ({ before, after: r }),
  undo: putCraftBack,
});

export const setCraftLearned = action({
  id: "set_craft_learned",
  title: "Set how the person learned a craft",
  description: `Set how the person learned a craft they keep, any of: ${LEARNED_IDS.join(", ")} (all count equally). The list replaces what was there; an empty list clears it.`,
  tier: "own",
  on: ["chat", "mcp"],
  input: z.object({ ref, how: z.array(z.enum(LEARNED_IDS)).max(LEARNED_IDS.length) }),
  run: async ({ userId }, { ref: r, how }) => {
    const rec = await keptOf(userId, r);
    const kept = LEARNED_IDS.filter((l) => how.includes(l));
    const body: Record<string, unknown> = { ...rec.body, how: kept.join(",") };
    if (!kept.length) delete body.how;
    await saveLifeRecord(userId, rec.id, body);
    return { id: rec.id, ref: r, how: kept };
  },
  before: ({ userId }, { ref: r }) => snap(userId, r),
  change: (r, _i, before) => ({ before, after: r }),
  undo: putCraftBack,
});

export const craftAct = action({
  id: "craft_act",
  title: "Keep that the person tried a craft or made something",
  description: "Keep an act on a craft the person keeps: tried (they tried it once; a craft they were only drawn to, or did not keep yet, is kept as trying) or made (they made something, with a short note naming it). Only what the person said they did. Acts are kept as they happened and are not undone.",
  tier: "own",
  on: ["chat", "mcp"],
  input: z.object({ ref, kind: z.enum(["tried", "made"]), note: z.string().max(300).optional() }),
  run: async (ctx, { ref: r, kind, note }) => {
    const craft = craftOf(r);
    if (!craft) throw new Error("No such craft.");
    // Trying a craft not kept yet keeps it, as one being tried.
    const had = await recordOf(ctx.userId, r);
    if (!had && kind === "made") throw new Error("You do not keep that craft.");
    const id = had?.id ?? await addLifeRecord(ctx.userId, "work", "craft", { ref: r, title: craft.label }, "trying");
    const act = await keepLifeAct(ctx.userId, id, { kind, day: todayOf(ctx), note });
    if (had && kind === "tried" && (had.state === "drawn" || had.state === "let-go")) await setLifeState(ctx.userId, id, "trying");
    return { id, ref: r, act };
  },
  change: (r) => ({ after: r }),
});

export const setCraftVouch = action({
  id: "set_craft_vouch",
  title: "Set which friends vouch for a craft",
  description: "Set which of the person's Reflect friends (their ids, from connect_requests) vouch for a craft they keep. The list replaces what was there; an empty list clears it. Only friends, and only when the person says so.",
  tier: "own",
  on: ["chat", "mcp"],
  input: z.object({ ref, friends: z.array(z.string().max(80)).max(50) }),
  run: async ({ userId }, { ref: r, friends }) => {
    const rec = await keptOf(userId, r);
    const mine = new Set((await friendsMet(userId)).map((f) => f.id));
    const kept = [...new Set(friends)].filter((f) => mine.has(f));
    if (kept.length !== new Set(friends).size) throw new Error("Only your Reflect friends can vouch.");
    const body: Record<string, unknown> = { ...rec.body, vouch: kept.join(",") };
    if (!kept.length) delete body.vouch;
    await saveLifeRecord(userId, rec.id, body);
    return { id: rec.id, ref: r, friends: kept };
  },
  before: ({ userId }, { ref: r }) => snap(userId, r),
  change: (r, _i, before) => ({ before, after: r }),
  undo: putCraftBack,
});

const ANSWER_KEYS = ["likes", "unsure", "nots"] as const;
/** The Discover crafts answers record's lists as they are, for Undo. */
const answersSnap = async (userId: string) => {
  const r = (await lifeRecords(userId, "work")).find((x) => x.kind === "craft-likes");
  return { answers: r ? Object.fromEntries(ANSWER_KEYS.map((k) => [k, String(r.body[k] ?? "")])) : null };
};

export const saveCraftAnswers = action({
  id: "save_craft_answers",
  title: "Keep the person's Discover crafts answers",
  description: `Keep the person's answers to Discover crafts activities (activity ids such as ${ACTIVITIES.slice(0, 3).map((a) => a.id).join(", ")}), each like, unsure or not. The answers given are merged over those kept. Only the person's own answers.`,
  tier: "own",
  on: ["chat", "mcp"],
  input: z.object({ answers: z.record(z.string().max(60), z.enum(["like", "unsure", "not"])) }),
  run: async ({ userId }, { answers }) => {
    const had = (await answersSnap(userId)).answers;
    const merged: Record<string, "like" | "unsure" | "not"> = {};
    if (had) {
      for (const id of had.likes!.split(",").filter(Boolean)) merged[id] = "like";
      for (const id of had.unsure!.split(",").filter(Boolean)) merged[id] = "unsure";
      for (const id of had.nots!.split(",").filter(Boolean)) merged[id] = "not";
    }
    Object.assign(merged, answers);
    const body = answersBody(merged);
    for (const k of ANSWER_KEYS) await setLifeField(userId, "work", "craft-likes", k, body[k] || null);
    return { answered: Object.keys(merged).filter((k) => ACTIVITIES.some((a) => a.id === k)).length };
  },
  before: ({ userId }) => answersSnap(userId),
  change: (r, _i, before) => ({ before, after: r }),
  undo: async ({ userId }, c) => {
    const before = c.before as { answers?: Record<string, string> | null } | null;
    if (!before || !("answers" in before)) throw new Error("This change cannot be undone.");
    for (const k of ANSWER_KEYS) await setLifeField(userId, "work", "craft-likes", k, before.answers?.[k] || null);
  },
});

/** The picker's record fields as they are, for Undo. */
const picksSnap = async (userId: string) => {
  const r = (await lifeRecords(userId, "work")).find((x) => x.kind === "craft-likes");
  return { picks: r ? { worlds: String(r.body.worlds ?? ""), picks: String(r.body.picks ?? "") } : null };
};

export const saveCraftPicks = action({
  id: "save_craft_picks",
  title: "Keep the person's craft picks",
  description: `Keep what the person picked in Scholē's photo picker (/schole/discover): worlds (craft group ids: ${WORLDS.map((w) => w.id).join(", ")}) and crafts (catalogue ids such as 'carpentry'). Both lists replace what was there, in the order picked. Only the person's own picks.`,
  tier: "own",
  on: ["chat", "mcp"],
  input: z.object({ worlds: z.array(z.string().max(40)).max(WORLDS.length), picks: z.array(z.string().max(80)).max(200) }),
  run: async ({ userId }, { worlds, picks }) => {
    const w = [...new Set(worlds)].filter((x) => WORLDS.some((y) => y.id === x));
    const p = [...new Set(picks)].filter((x) => craftOf(x));
    await setLifeField(userId, "work", "craft-likes", "worlds", w.join(",") || null);
    await setLifeField(userId, "work", "craft-likes", "picks", p.join(",") || null);
    return { worlds: w, picks: p };
  },
  before: ({ userId }) => picksSnap(userId),
  change: (r, _i, before) => ({ before, after: r }),
  undo: async ({ userId }, c) => {
    const before = c.before as { picks?: { worlds: string; picks: string } | null } | null;
    if (!before || !("picks" in before)) throw new Error("This change cannot be undone.");
    await setLifeField(userId, "work", "craft-likes", "worlds", before.picks?.worlds || null);
    await setLifeField(userId, "work", "craft-likes", "picks", before.picks?.picks || null);
  },
});
