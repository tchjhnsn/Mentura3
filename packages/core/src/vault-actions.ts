// The actions a vault offers (Reflect framework plan, step 4): the registry entries whose store has a files host in
// the core, declared here once. The web app builds its own entries for these ids from the same declarations
// (web/src/server/actions/journal.ts), with zod inputs for its surfaces and its Postgres store, so the app, the
// `reflect` CLI and an MCP server over a vault (./vault-mcp.ts) offer the same actions under the same names and words.
// Today that is the guide, the life schemas (`life_schema`, a kind's shape and where the ontology places it), the
// journal (listing entries, writing one and reading one) and the presentation gate's drafting and checking
// (./presentation.ts, Reflect framework plan step 6), which the app offers over its Postgres presentations
// (web/src/server/actions/presentations.ts).
import { acceptLocalDate, type Entry } from "./journal.ts";
import type { IsoDate } from "./person.ts";
import type { Journal } from "./store.ts";
import { int, object, oneOf, optional, str, UUID, type InputSchema, type JsonSchema } from "./input.ts";
import { lifeKindRefs, lifeSchemaOf, type LifeSchema } from "./life-schemas.ts";
import { checkInput, makeRunner, Refused, type Action, type ActionDecl, type ChangeLog, type Ran, type RunContext, type Source, type StandardSchema } from "./registry.ts";
import { draftPresentation, gateFor, ID, newPresentationId, OCCASIONS, VIRTUE_IDS, type DraftFields, type GateVerdict, type Presentation } from "./presentation.ts";
import { vaultGate, type Presentations } from "./files-presentations.ts";

/** What Reflect keeps and the rules for an AI working in it; the MCP server's instructions. */
export const GUIDE = [
  "Reflect keeps a person's journal, what they learn, their own ideas, their calendar and the plan for what survives them. You help them write and keep things; you never decide for them.",
  "",
  "Rules: save only what the person asked you to save, in their words. Never infer facts about the person beyond what they wrote, and never share their entries.",
  "",
  "Before anything of the person's goes before others, draft its presentation record with them (draft_presentation) and check it (check_presentation): the channel, who speaks and in what role, for what end, to what audience. You may draft and check; only the person approves.",
].join("\n");

export const REFLECT_GUIDE = {
  id: "reflect_guide",
  title: "How Reflect works",
  description: "What Reflect keeps and the rules for an AI working in it.",
  tier: "read",
  on: ["mcp"],
} as const satisfies ActionDecl;

export const LIFE_SCHEMA = {
  id: "life_schema",
  title: "A life record kind's shape",
  description: "The JSON Schema of one kind of life record (a friend, a meal, a budget): its fields, and under x-reflect its noun, its category among Aristotle's ten, its kind of good and its community. Read it before suggesting what to keep in a record of that kind.",
  tier: "read",
  on: ["mcp"],
} as const satisfies ActionDecl;

/** How the `life_schema` action's one input is described, in the app and here. */
export const LIFE_KIND_INPUT = "the kind as app.kind (home.meal, friends.friend) or its id alone (meal)";

/** A life kind's schema for the `life_schema` action, or an error that lists the kinds. */
export function lifeSchemaIn(kind: string): LifeSchema {
  const s = lifeSchemaOf(kind);
  if (!s) throw new Error(`no life kind ${kind}. The kinds are: ${lifeKindRefs().join(", ")}`);
  return s;
}

export const LIST_ENTRIES = {
  id: "list_entries",
  title: "List journal entries",
  description: "The person's journal entries, newest first.",
  tier: "read",
  on: ["mcp"],
} as const satisfies ActionDecl;

export const WRITE_ENTRY = {
  id: "write_entry",
  title: "Write a journal entry",
  description: "Save an entry in the person's own words. Write only what they asked you to save, as they said it; never compose it for them.",
  tier: "own",
  on: ["mcp"],
} as const satisfies ActionDecl;

export const GET_ENTRY = {
  id: "get_entry",
  title: "Read one entry",
  description: "One entry's text.",
  tier: "read",
  on: ["mcp"],
} as const satisfies ActionDecl;

export const DRAFT_PRESENTATION = {
  id: "draft_presentation",
  title: "Draft a presentation",
  description:
    "Draft or update the record of one appearance before others, in person or in public view, in the person's own words: the channel (from their presentation policy), who acts and in what role, what, about what or to whom, by what means, for what end, how, the occasion (deliberative, judicial or ceremonial), the audience and their relation to them, and the virtue at stake. Give id to update a draft; a field left out stays, an empty one clears. Returns what the gate still needs. Drafting never approves.",
  tier: "own",
  on: ["chat", "mcp"],
} as const satisfies ActionDecl;

export const CHECK_PRESENTATION = {
  id: "check_presentation",
  title: "Check a presentation",
  description: "Whether a presentation record is ready to pass the gate on its channel, or what it still needs (the end, the role, the audience, a channel rule that matches), with the channel's checks and how to preview it. Checking never approves.",
  tier: "read",
  on: ["chat", "mcp"],
} as const satisfies ActionDecl;

/** A gate verdict as an action returns it. */
export const gateOut = (g: GateVerdict) =>
  g.ready
    ? { ready: true as const, rule: { role: g.rule.role, end: g.rule.end, content: g.rule.content }, preview: g.channel.preview, checks: g.channel.checks.map((c) => c.check) }
    : { ready: false as const, missing: g.missing };

/** Draft or update a presentation record in the vault, writing the default policy first when the vault has none. */
export async function draftPresentationIn(store: Presentations, f: DraftFields & { id?: string }, now = new Date()): Promise<{ id: string; presentation: Presentation; gate: ReturnType<typeof gateOut> }> {
  await store.ensurePolicy();
  const policy = await store.policy();
  const existing = f.id ? await store.get(f.id) : null;
  if (f.id && !existing) throw new Error(`no presentation ${f.id}; leave id out to draft a new one`);
  const id = existing?.id ?? newPresentationId(f.channel, now.toISOString().slice(0, 10), new Set((await store.list()).map((p) => p.id)));
  const { id: _given, ...fields } = f;
  const presentation = draftPresentation(policy, existing, fields, { id, now });
  await store.put(presentation);
  return { id, presentation, gate: gateOut(gateFor(policy, presentation, presentation.channel)) };
}

/** Check a presentation record kept in the vault against its channel. */
export async function checkPresentationIn(store: Presentations, id: string) {
  const p = await store.get(id);
  if (!p) throw new Error(`no presentation ${id}`);
  return { id, channel: p.channel, ...gateOut(gateFor(await store.policy(), p, p.channel)) };
}

/** One entry as an action returns it. */
export const entryOut = (e: Entry) => ({ id: e.id, date: e.localDate, closed: e.closedAt !== null, text: e.parts.map((p) => p.text).join("\n\n") });

export async function listEntriesIn(j: Pick<Journal, "listEntries">, limit: number) {
  return (await j.listEntries(limit)).map(entryOut);
}

/** Write an entry in the person's words, dated their today, and close it. */
export async function writeEntryIn(j: Pick<Journal, "createEntry" | "closeEntry">, entryTextIn: string, localDate: string, now = new Date()): Promise<{ id: string }> {
  const body = entryTextIn.trim();
  if (!body) throw new Error("an entry needs words");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(localDate) || !acceptLocalDate(localDate as IsoDate, now)) throw new Error("the date must be the person's today (YYYY-MM-DD)");
  const id = await j.createEntry(body, localDate as IsoDate, null);
  await j.closeEntry(id);
  return { id };
}

export async function getEntryIn(j: Pick<Journal, "entryText">, entryId: string): Promise<{ id: string; text: string }> {
  const t = await j.entryText(entryId);
  if (t === null) throw new Error("no such entry");
  return { id: entryId, text: t };
}

/** What a vault's action runs with: the person, their journal and their vault's change log. */
export type VaultContext = RunContext & { journal: Journal; changes: ChangeLog; presentations: Presentations };

/** A vault action: checked by an input schema of the core's own (./input.ts), so its JSON Schema can be listed. */
export type VaultAction = Action<VaultContext, InputSchema<unknown>, unknown>;

const vault = <O, R>(a: Action<VaultContext, InputSchema<O>, R>): VaultAction => a as VaultAction;

/** Every action a vault offers, in the app's registry order. */
export const VAULT_ACTIONS: readonly VaultAction[] = [
  vault({ ...REFLECT_GUIDE, run: async () => GUIDE }),
  vault({
    ...LIFE_SCHEMA,
    input: object({ kind: str({ min: 1, describe: LIFE_KIND_INPUT }) }),
    run: async (_ctx, { kind }) => lifeSchemaIn(kind),
  }),
  vault({
    ...LIST_ENTRIES,
    input: object({ limit: int({ min: 1, max: 200, default: 20 }) }),
    run: async ({ journal }, { limit }) => listEntriesIn(journal, limit),
  }),
  vault({
    ...WRITE_ENTRY,
    input: object({ text: str({ min: 1 }), local_date: str({ describe: "the person's today, YYYY-MM-DD" }) }),
    run: async ({ journal, now }, { text, local_date }) => writeEntryIn(journal, text, local_date, now),
    // The text is in the entry's own file and memory.jsonl already; the vault's change log keeps only the date.
    logged: ({ local_date }) => ({ local_date }),
    change: (r) => ({ after: r }),
  }),
  vault({
    ...GET_ENTRY,
    input: object({ entry_id: str({ pattern: UUID, format: "uuid" }) }),
    run: async ({ journal }, { entry_id }) => getEntryIn(journal, entry_id),
  }),
  vault({
    ...DRAFT_PRESENTATION,
    input: object({
      channel: str({ min: 1, describe: "a channel id from the presentation policy, such as personal-site, reflect-profile, social, email or in-person" }),
      id: optional(str({ pattern: ID, describe: "a draft's id, to update it" })),
      who: optional(str({ describe: "who acts, when not the person" })),
      role: optional(str({ describe: "the role they speak in, such as founder, friend, citizen or son" })),
      what: optional(str({ describe: "what is done or said" })),
      about: optional(str({ describe: "about what, or to whom" })),
      means: optional(str({ describe: "by what means: the medium, what one wears or carries" })),
      end: optional(str({ describe: "for what end: what the appearance is for" })),
      how: optional(str({ describe: "how: the manner and bearing" })),
      occasion: optional(oneOf(OCCASIONS, { describe: "Rhetoric I.3" })),
      audience: optional(str({ describe: "who will see or hear it" })),
      relation: optional(str({ describe: "the person's relation to the audience" })),
      virtue: optional(oneOf(VIRTUE_IDS, { describe: "the virtue at stake (Nicomachean Ethics IV.3, IV.6-9)" })),
    }),
    run: async ({ presentations, now }, input) => draftPresentationIn(presentations, input, now),
    change: (r) => ({ after: { id: r.id } }),
  }),
  vault({
    ...CHECK_PRESENTATION,
    input: object({ id: str({ pattern: ID }) }),
    run: async ({ presentations }, { id }) => checkPresentationIn(presentations, id),
  }),
];

export const vaultActionById = (id: string): VaultAction | undefined => VAULT_ACTIONS.find((a) => a.id === id);

/** An action as the CLI lists it and an MCP server offers it: its declaration and its input's JSON Schema. */
export type Listed = ActionDecl & { input: JsonSchema };
export const listed = (a: VaultAction): Listed => ({ id: a.id, title: a.title, description: a.description, tier: a.tier, on: a.on, input: a.input?.json ?? { type: "object", properties: {}, required: [] } });

/** The runner over a vault: no transactions (a folder has none), the vault's change log, the vault's actions. */
export const vaultRunner = makeRunner<VaultContext, VaultAction>({
  changes: (ctx) => ctx.changes,
  transaction: (f) => f(),
  actionById: vaultActionById,
  // A publishing action names its presentation record by id in its input's `presentation` field.
  gate: (ctx, channel, input) => vaultGate(ctx.presentations, input && typeof input === "object" ? (input as { presentation?: unknown }).presentation : undefined, channel),
});

/**
 * Run a vault action by id from a raw input (JSON from the command line or an MCP client): check the input against
 * the action's schema, refuse a change to a vault that moved to another host, and run it. A CLI run is the person's
 * own (source `cli`); an MCP client's is a model's (source `mcp`).
 */
export async function runVaultAction(ctx: VaultContext & { movedTo?: string }, id: string, raw: unknown, source: Source): Promise<Ran<unknown>> {
  const a = vaultActionById(id);
  if (!a) throw new Refused({ reason: "not-offered", message: `No action ${id} here. A vault offers: ${VAULT_ACTIONS.map((x) => x.id).join(", ")}.` });
  const input = await checkInput<StandardSchema>(a, raw);
  if (ctx.movedTo && a.tier !== "read") throw new Error(`this instance moved to ${ctx.movedTo}; write there`);
  return vaultRunner.runAction(a, ctx, input, source);
}
