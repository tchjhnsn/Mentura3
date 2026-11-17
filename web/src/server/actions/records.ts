// The records behind the home screen's tiles (`@reflect/core/life`, ../life-store.ts) as actions (Ask Reflect plan,
// step 4): whatever a tile's page does to a record, the chat and the person's own AI can do too. The pages call these
// same entries through runAction with source "page", so a change made on a page is in the change log and can be undone.
import { z } from "zod";
import { APPS, LIFE_APPS, isLifeApp, kindOf, titleOf, type LifeAppId } from "@reflect/core/life";
import { addLifeRecord, keepLifeAct, lifeRecord, lifeRecords, removeLifeRecord, restoreLifeRecord, saveLifeRecord, setLifeField, setLifeState } from "../life-store";
import { action, idsIn, type ActionContext, type LoggedChange } from "./types";

const todayOf = (ctx: ActionContext) => ctx.today ?? new Date().toISOString().slice(0, 10);
const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const value = z.union([z.string().max(100_000), z.number(), z.boolean(), z.null()]);
/** A record's fields as the page or the model sends them: a key to a value, null to clear it. */
export const fieldsSchema = z.record(z.string().max(60), value);
const app = z.enum(LIFE_APPS as unknown as [LifeAppId, ...LifeAppId[]]);

/** A body as fields to send whole: values kept as they are, undefined and null left out. */
export function bodyFields(body: Record<string, unknown>): Record<string, string | number | boolean> {
  const out: Record<string, string | number | boolean> = {};
  for (const [k, v] of Object.entries(body)) if (v !== undefined && v !== null) out[k] = typeof v === "number" || typeof v === "boolean" ? v : String(v);
  return out;
}

/** A body with the fields merged in, null removing a field. */
export function merged(body: Record<string, unknown>, fields: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = { ...body };
  for (const [k, v] of Object.entries(fields)) {
    if (v === null || v === undefined) delete out[k];
    else out[k] = v;
  }
  return out;
}

const mine = async (userId: string, id: string) => {
  const r = await lifeRecord(userId, id);
  if (!r) throw new Error("No such record.");
  return r;
};
/** What a record was before a change, for Undo to put back. */
export const bodyBefore = async ({ userId }: ActionContext, { id }: { id: string }) => {
  const r = await lifeRecord(userId, id);
  return r ? { id: r.id, body: r.body } : null;
};
/** Undo of a change to a record's fields: save the fields it had. */
export const putBodyBack = async ({ userId }: ActionContext, c: LoggedChange) => {
  const b = c.before as { id?: unknown; body?: unknown } | null;
  if (typeof b?.id !== "string" || !b.body || typeof b.body !== "object") throw new Error("This change cannot be undone.");
  await saveLifeRecord(userId, b.id, b.body as Record<string, unknown>);
};
/** Undo of a record a run kept: remove it, kept with its removal time as Remove on its page does. */
export const removeKept = async ({ userId }: ActionContext, c: LoggedChange) => {
  for (const id of idsIn(c.after, "id")) await removeLifeRecord(userId, id);
};

export const lifeAction = action({
  id: "life",
  title: "Read the records of a tile",
  description: `List the records the person keeps in one tile's app (${LIFE_APPS.join(", ")}): each with its id, kind, state and fields, and the kinds that app keeps, with their fields, states and acts. Read it before changing a record, to use real ids and keys.`,
  tier: "read",
  on: ["chat", "mcp"],
  input: z.object({ app }),
  run: async ({ userId }, { app }) => {
    const a = APPS.find((x) => x.id === app)!;
    const records = (await lifeRecords(userId, app)).map((r) => {
      const k = kindOf(r.app, r.kind);
      return { id: r.id, kind: r.kind, state: r.state, title: k ? titleOf(k, r.body) : r.kind, fields: r.body };
    });
    const kinds = a.kinds.map((k) => ({ kind: k.id, label: k.label, one: Boolean(k.one), fields: k.fields.map((f) => ({ key: f.key, label: f.label, kind: f.kind, ...(f.options ? { options: f.options.map((o) => o.id) } : {}) })), states: (k.states ?? []).map((s) => s.id), acts: (k.acts ?? []).map((x) => ({ id: x.id, minutes: Boolean(x.minutes), amount: Boolean(x.amount) })) }));
    return { app: a.id, label: a.label, records, kinds };
  },
});

export const addRecord = action({
  id: "add_record",
  title: "Keep a new record on a tile",
  description: "Keep a new record of a kind in one tile's app (from `life`), only with what the person stated: a friend, a goal, a role, a venture, a step, a need. Fields by key; a kind kept once (one) is set with set_record_field instead. Returns its id.",
  tier: "own",
  on: ["chat", "mcp"],
  input: z.object({ app, kind: z.string().max(60), fields: fieldsSchema.default({}), state: z.string().max(40).optional() }),
  run: async ({ userId }, { app, kind, fields, state }) => ({ id: await addLifeRecord(userId, app, kind, fields, state) }),
  change: (r) => ({ after: r }),
  undo: removeKept,
});

export const changeRecord = action({
  id: "change_record",
  title: "Change a record's fields",
  description: "Change some fields of one of the person's records (by id from `life`), keeping the rest; a field set to null is cleared. With whole, the fields replace all the record's fields. Only what the person said.",
  tier: "own",
  on: ["chat", "mcp"],
  input: z.object({ id: z.string().max(60), fields: fieldsSchema, whole: z.boolean().default(false) }),
  run: async ({ userId }, { id, fields, whole }) => {
    const r = await mine(userId, id);
    await saveLifeRecord(userId, id, whole ? merged({}, fields) : merged(r.body, fields));
    return { id };
  },
  before: bodyBefore,
  change: (r, _i, before) => ({ before, after: r }),
  undo: putBodyBack,
});

export const setRecordState = action({
  id: "set_record_state",
  title: "Set where a record stands",
  description: "Set the state of one of the person's records (by id), such as a goal reached, a step happened or an adventure done; the states each kind has are in `life`. Only when the person says so.",
  tier: "own",
  on: ["chat", "mcp"],
  input: z.object({ id: z.string().max(60), state: z.string().max(40) }),
  run: async ({ userId }, { id, state }) => {
    await setLifeState(userId, id, state);
    return { id, state };
  },
  before: async ({ userId }, { id }) => ({ id, state: (await lifeRecord(userId, id))?.state ?? null }),
  change: (r, _i, before) => ({ before, after: r }),
  // Undo sets the state it had; the record's state history keeps both changes.
  undo: async ({ userId }, c) => {
    const b = c.before as { id?: unknown; state?: unknown } | null;
    if (typeof b?.id !== "string" || typeof b.state !== "string") throw new Error("This change cannot be undone.");
    await setLifeState(userId, b.id, b.state);
  },
});

export const removeRecord = action({
  id: "remove_record",
  title: "Remove a record",
  description: "Remove one of the person's records by its id, only when they ask. It is kept with its removal time, so Undo restores it.",
  tier: "own",
  on: ["chat", "mcp"],
  input: z.object({ id: z.string().max(60) }),
  run: async ({ userId }, { id }) => {
    const r = await mine(userId, id);
    await removeLifeRecord(userId, id);
    return { id, app: r.app, kind: r.kind };
  },
  change: (r) => ({ after: r }),
  undo: async ({ userId }, c) => {
    for (const id of idsIn(c.after, "id")) await restoreLifeRecord(userId, id);
  },
});

export const restoreRecord = action({
  id: "restore_record",
  title: "Restore a removed record",
  description: "Restore a record the person removed, by its id.",
  tier: "own",
  on: ["chat", "mcp"],
  input: z.object({ id: z.string().max(60) }),
  run: async ({ userId }, { id }) => {
    await restoreLifeRecord(userId, id);
    return { id };
  },
  change: (r) => ({ after: r }),
  undo: removeKept,
});

export const setRecordField = action({
  id: "set_record_field",
  title: "Set one fact of a kind kept once",
  description: "Set one field of a kind the person keeps once (one, in `life`), such as what food costs a month, gallons of water stored, a doctor's name or how they like to eat; the record is kept first when there is none. null or false clears it. Only what the person stated.",
  tier: "own",
  on: ["chat", "mcp"],
  input: z.object({ app, kind: z.string().max(60), key: z.string().max(60), value }),
  run: async ({ userId }, { app, kind, key, value }) => {
    await setLifeField(userId, app, kind, key, value);
    return { app, kind, key, value };
  },
  before: async ({ userId }, { app, kind }) => {
    const r = (await lifeRecords(userId, app)).find((x) => x.kind === kind);
    return r ? { id: r.id, body: r.body } : { app, kind, none: true };
  },
  change: (r, _i, before) => ({ before, after: r }),
  // Undo puts back the record's fields, or removes the record the run kept first.
  undo: async (ctx, c) => {
    const b = c.before as { id?: unknown; app?: unknown; kind?: unknown; none?: unknown } | null;
    if (b?.none === true && typeof b.app === "string" && isLifeApp(b.app) && typeof b.kind === "string") {
      const r = (await lifeRecords(ctx.userId, b.app)).find((x) => x.kind === b.kind);
      if (r) await removeLifeRecord(ctx.userId, r.id);
      return;
    }
    await putBodyBack(ctx, c);
  },
});

export const logAct = action({
  id: "log_act",
  title: "Keep something the person did on a record",
  description: "Keep an act on one of the person's records (by id): what they did (an act of its kind, from `life`), on what day, for how many minutes or what amount, with a note. Only what the person said they did. Acts are kept as they happened and are not undone.",
  tier: "own",
  on: ["chat", "mcp"],
  input: z.object({ id: z.string().max(60), kind: z.string().max(40), day: day.optional().describe("YYYY-MM-DD, today when left out"), minutes: z.number().min(1).max(1440).optional(), amount: z.number().min(0).optional(), note: z.string().max(4000).optional() }),
  run: async (ctx, { id, kind, day, minutes, amount, note }) => ({ id, act: await keepLifeAct(ctx.userId, id, { kind, day: day ?? todayOf(ctx), minutes, amount, note }) }),
  change: (r) => ({ after: r }),
});

/** The person's Health record, kept first when there is none. */
async function healthId(userId: string): Promise<string> {
  const h = (await lifeRecords(userId, "body")).find((r) => r.kind === "health");
  return h?.id ?? (await addLifeRecord(userId, "body", "health", {}));
}

const QUICK = ["health", "fitness", "friend", "polis", "ventures", "home"] as const;

/**
 * The tiles' quick log (QuickLog on each tile's dashboard): one tap keeps an act on the record it belongs to, keeping
 * that record first when there is none. The page's logs and the chat's go through this one entry.
 */
export const quickLog = action({
  id: "quick_log",
  title: "Quick log on a tile",
  description: "Log what the person says they did today, as a tile's quick log does: health (slept, with hours as amount; appointment), fitness (moderate, vigorous or strength, with minutes as amount), friend (saw or called, with the friend's record id and minutes if given), polis (minutes served in a role, with its record id), ventures (minutes worked on a venture, with its record id), home (checked a need's standard today, with the need's kind such as 'water'). Acts are kept as they happened and are not undone.",
  tier: "own",
  on: ["chat", "mcp"],
  input: z.object({
    tile: z.enum(QUICK),
    kind: z.string().max(60).describe("What was done (slept, appointment, moderate, vigorous, strength, saw, called), or for home the need's kind"),
    amount: z.number().min(0).max(1440).nullable().default(null).describe("Hours slept, or minutes"),
    id: z.string().max(60).optional().describe("The record's id, for a friend, a role or a venture"),
    day: day.optional().describe("YYYY-MM-DD, today when left out"),
  }),
  run: async (ctx, { tile, kind, amount, id, day: on }) => {
    const { userId } = ctx;
    const d = on ?? todayOf(ctx);
    if (tile === "health") {
      const rec = await healthId(userId);
      if (kind === "slept") {
        if (!(amount && amount > 0 && amount <= 24)) throw new Error("Pick the hours you slept.");
        return { record: rec, act: await keepLifeAct(userId, rec, { kind: "slept", day: d, minutes: Math.round(amount * 60) }) };
      }
      if (kind === "appointment") return { record: rec, act: await keepLifeAct(userId, rec, { kind: "appointment", day: d }) };
      throw new Error("No such thing to log.");
    }
    if (tile === "fitness") {
      if (!["moderate", "vigorous", "strength"].includes(kind)) throw new Error("No such activity.");
      if (!(amount && amount > 0 && amount <= 600)) throw new Error("Pick the minutes.");
      // It counts toward the guidelines whatever goal it goes to: the goal under way, else "Meet the activity guidelines".
      const goals = (await lifeRecords(userId, "body")).filter((r) => r.kind === "fitness" && r.state !== "reached" && r.state !== "lapsed");
      const rec = goals[0]?.id ?? (await addLifeRecord(userId, "body", "fitness", { goal: "Meet the activity guidelines" }, "in-progress"));
      return { record: rec, act: await keepLifeAct(userId, rec, { kind, day: d, minutes: amount }) };
    }
    if (tile === "friend") {
      const r = id ? await lifeRecord(userId, id) : null;
      if (!r || r.app !== "friends" || r.kind !== "friend") throw new Error("No such friend.");
      if (kind !== "saw" && kind !== "called") throw new Error("No such thing to log.");
      return { record: r.id, act: await keepLifeAct(userId, r.id, { kind, day: d, minutes: amount ?? undefined }) };
    }
    if (tile === "home") {
      let r = (await lifeRecords(userId, "home")).find((x) => x.kind === kind);
      if (!r) {
        await addLifeRecord(userId, "home", kind, {});
        r = (await lifeRecords(userId, "home")).find((x) => x.kind === kind);
      }
      return { record: r!.id, act: await keepLifeAct(userId, r!.id, { kind: "checked", day: d }) };
    }
    const r = id ? await lifeRecord(userId, id) : null;
    if (!r || r.app !== tile || r.kind !== (tile === "polis" ? "standing" : "venture")) throw new Error("No such record.");
    if (!(amount && amount > 0 && amount <= 1440)) throw new Error("Pick the minutes.");
    return { record: r.id, act: await keepLifeAct(userId, r.id, { kind: tile === "polis" ? "served" : "worked", day: d, minutes: amount }) };
  },
  change: (r) => ({ after: r }),
});
