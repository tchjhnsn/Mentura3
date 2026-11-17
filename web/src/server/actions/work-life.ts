// Work's and the qualities lens's page acts as actions (Ask Reflect plan, step 4): the qualities a person keeps from
// the people they admire, journal entries started on a quality or toward work, and the main aim. The other changes on
// these pages are the tiles' record actions (./records.ts). The pages run these same entries, so their changes are
// in the change log.
import { z } from "zod";
import { EXEMPLARS, TRAITS, exemplarById, traitById } from "@reflect/core/formation";
import { addLifeRecord, keepLifeAct, lifeRecord, lifeRecords, removeLifeRecord, restoreLifeRecord, saveLifeRecord } from "../life-store";
import { createWork } from "../work-store";
import { qualityRecord } from "../qualities";
import { WANTED_KINDS } from "../work-space";
import { action, type ActionContext, type LoggedChange } from "./types";

const todayOf = (ctx: ActionContext) => ctx.today ?? new Date().toISOString().slice(0, 10);
type Snap = { id: string; body: Record<string, unknown> };
/** The admired records as they are, for Undo to put back. */
const admired = async (userId: string): Promise<Snap[]> => (await lifeRecords(userId, "work")).filter((x) => x.kind === "admired").map((r) => ({ id: r.id, body: r.body }));
/** Undo of a change to the admired records: put back each one's fields, restore the ones removed, remove the ones added. */
const putAdmiredBack = async ({ userId }: ActionContext, c: LoggedChange) => {
  const was = (c.before as { admired?: Snap[] } | null)?.admired;
  if (!Array.isArray(was)) throw new Error("This change cannot be undone.");
  const ids = new Set(was.map((x) => x.id));
  for (const r of await admired(userId)) if (!ids.has(r.id)) await removeLifeRecord(userId, r.id);
  for (const r of was) {
    await restoreLifeRecord(userId, r.id);
    await saveLifeRecord(userId, r.id, r.body);
  }
};

export const toggleQuality = action({
  id: "toggle_quality",
  title: "Keep or take off a quality seen in a person",
  description: `Keep one quality (${TRAITS.map((t) => t.id).join(", ")}) as seen in a person the person admires (an exemplar id, such as ${EXEMPLARS.slice(0, 3).map((e) => e.id).join(", ")}), or take it off when it is kept. Only the qualities that person is known for, and only when the person says so.`,
  tier: "own",
  on: ["chat", "mcp"],
  input: z.object({ exemplar: z.string().max(80), trait: z.string().max(60) }),
  run: async ({ userId }, { exemplar, trait }) => {
    const e = exemplarById(exemplar);
    if (!e || !e.traits.some((t) => t.trait === trait)) throw new Error("No such quality.");
    const had = (await lifeRecords(userId, "work")).find((x) => x.kind === "admired" && x.body.ref === exemplar);
    const traits = new Set(String(had?.body.traits ?? "").split(",").filter(Boolean));
    const kept = !traits.has(trait);
    if (kept) traits.add(trait); else traits.delete(trait);
    const body = { ref: exemplar, title: e.name, traits: [...traits].join(",") };
    if (!traits.size) { if (had) await removeLifeRecord(userId, had.id); }
    else if (had) await saveLifeRecord(userId, had.id, body);
    else await addLifeRecord(userId, "work", "admired", body);
    return { exemplar, trait, kept };
  },
  before: async ({ userId }) => ({ admired: await admired(userId) }),
  change: (r, _i, before) => ({ before, after: r }),
  undo: putAdmiredBack,
});

export const takeOffQuality = action({
  id: "take_off_quality",
  title: "Take a quality off the lens",
  description: "Take a quality off the person's qualities lens: no person they admire keeps it any more. What they wrote about it stays in their journal.",
  tier: "own",
  on: ["chat", "mcp"],
  input: z.object({ trait: z.string().max(60) }),
  run: async ({ userId }, { trait }) => {
    for (const r of (await lifeRecords(userId, "work")).filter((x) => x.kind === "admired")) {
      const traits = String(r.body.traits ?? "").split(",").filter(Boolean);
      if (!traits.includes(trait)) continue;
      const left = traits.filter((t) => t !== trait);
      if (left.length) await saveLifeRecord(userId, r.id, { ...r.body, traits: left.join(",") });
      else await removeLifeRecord(userId, r.id);
    }
    return { trait };
  },
  before: async ({ userId }) => ({ admired: await admired(userId) }),
  change: (r, _i, before) => ({ before, after: r }),
  undo: putAdmiredBack,
});

export const writeQuality = action({
  id: "write_quality",
  title: "Start a journal entry on a quality",
  description: "Start a journal entry about one of the qualities (by its id), kept on that quality. Returns the entry's id; the person writes it in /journal/w/<id>. Never write it for them.",
  tier: "own",
  on: ["chat", "mcp"],
  input: z.object({ trait: z.string().max(60) }),
  run: async (ctx, { trait }) => {
    const t = traitById(trait);
    if (!t) throw new Error("No such quality.");
    const id = (await qualityRecord(ctx.userId, t.id))?.id ?? await addLifeRecord(ctx.userId, "work", "quality", { ref: t.id, title: t.name });
    const work = await createWork(ctx.userId, "blank", `On ${t.name.toLowerCase()}`);
    await keepLifeAct(ctx.userId, id, { kind: "wrote", day: todayOf(ctx), note: work });
    return { id: work, href: `/journal/w/${work}` };
  },
  change: (r) => ({ after: r }),
});

export const writeToward = action({
  id: "write_toward",
  title: "Start a journal entry toward work the person wants",
  description: "Start a journal entry on what moved the person toward work they want (a Work record's id, from life with app 'work'), kept on that work. Returns the entry's id. Never write it for them.",
  tier: "own",
  on: ["chat", "mcp"],
  input: z.object({ id: z.string().max(60) }),
  run: async (ctx, { id }) => {
    const r = await lifeRecord(ctx.userId, id);
    if (!r || r.app !== "work") throw new Error("No such work.");
    const title = String(r.kind === "imagined" ? r.body.name ?? "" : r.body.title ?? "");
    const work = await createWork(ctx.userId, "blank", `What moved me toward ${title}`);
    await keepLifeAct(ctx.userId, id, { kind: "wrote", day: todayOf(ctx), note: work });
    return { id: work, href: `/journal/w/${work}` };
  },
  change: (r) => ({ after: r }),
});

export const mainAim = action({
  id: "main_aim",
  title: "Star the main aim",
  description: "Star one of the work the person wants (a Work inspiration or imagined record's id) as their main aim; the others lose the star. Only when they say so.",
  tier: "own",
  on: ["chat", "mcp"],
  input: z.object({ id: z.string().max(60) }),
  run: async ({ userId }, { id }) => {
    const aims = (await lifeRecords(userId, "work")).filter((r) => WANTED_KINDS.has(r.kind));
    if (!aims.some((r) => r.id === id)) throw new Error("No such aim.");
    for (const r of aims) {
      const main = r.id === id ? "1" : undefined;
      if ((r.body.main === "1") !== Boolean(main)) await saveLifeRecord(userId, r.id, { ...r.body, main });
    }
    return { id };
  },
  before: async ({ userId }) => ({ aims: (await lifeRecords(userId, "work")).filter((r) => WANTED_KINDS.has(r.kind)).map((r) => ({ id: r.id, body: r.body })) }),
  change: (r, _i, before) => ({ before, after: r }),
  undo: async ({ userId }, c) => {
    const was = (c.before as { aims?: Snap[] } | null)?.aims;
    if (!Array.isArray(was)) throw new Error("This change cannot be undone.");
    for (const r of was) await saveLifeRecord(userId, r.id, r.body);
  },
});
