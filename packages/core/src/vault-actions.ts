// The actions a vault offers (Reflect framework plan, step 4): the registry entries whose store has a files host in
// the core, declared here once. The web app builds its own entries for these ids from the same declarations
// (web/src/server/actions/journal.ts), with zod inputs for its surfaces and its Postgres store, so the app, the
// `reflect` CLI and an MCP server over a vault (./vault-mcp.ts) offer the same actions under the same names and words.
// Today that is the journal: the guide, listing entries, writing one and reading one.
import { acceptLocalDate, type Entry } from "./journal.ts";
import type { IsoDate } from "./person.ts";
import type { Journal } from "./store.ts";
import { int, object, str, UUID, type InputSchema, type JsonSchema } from "./input.ts";
import { checkInput, makeRunner, Refused, type Action, type ActionDecl, type ChangeLog, type Ran, type RunContext, type Source, type StandardSchema } from "./registry.ts";

/** What Reflect keeps and the rules for an AI working in it; the MCP server's instructions. */
export const GUIDE = [
  "Reflect keeps a person's journal, what they learn, their own ideas, their calendar and the plan for what survives them. You help them write and keep things; you never decide for them.",
  "",
  "Rules: save only what the person asked you to save, in their words. Never infer facts about the person beyond what they wrote, and never share their entries.",
].join("\n");

export const REFLECT_GUIDE = {
  id: "reflect_guide",
  title: "How Reflect works",
  description: "What Reflect keeps and the rules for an AI working in it.",
  tier: "read",
  on: ["mcp"],
} as const satisfies ActionDecl;

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
export type VaultContext = RunContext & { journal: Journal; changes: ChangeLog };

/** A vault action: checked by an input schema of the core's own (./input.ts), so its JSON Schema can be listed. */
export type VaultAction = Action<VaultContext, InputSchema<unknown>, unknown>;

const vault = <O, R>(a: Action<VaultContext, InputSchema<O>, R>): VaultAction => a as VaultAction;

/** Every action a vault offers, in the app's registry order. */
export const VAULT_ACTIONS: readonly VaultAction[] = [
  vault({ ...REFLECT_GUIDE, run: async () => GUIDE }),
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
