// The actions a vault offers (Reflect framework plan, step 4): the registry entries whose store has a files host in
// the core, declared here once. The web app builds its own entries for these ids from the same declarations
// (web/src/server/actions/journal.ts), with zod inputs for its surfaces and its Postgres store, so the app, the
// `reflect` CLI and an MCP server over a vault (./vault-mcp.ts) offer the same actions under the same names and words.
// Today that is the guide, the life schemas (`life_schema`, a kind's shape and where the ontology places it), the
// journal (listing entries, writing one and reading one) and the presentation gate's drafting and checking
// (./presentation.ts, Reflect framework plan step 6), which the app offers over its Postgres presentations
// (web/src/server/actions/presentations.ts), and the published/ folder a site reads (./published.ts): `publish_files`
// writes a post, the profile or the works (by their end: making/, knowing/, doing/) there through the gate, and `unpublish_files` takes one out.
import { acceptLocalDate, type Entry } from "./journal.ts";
import type { IsoDate } from "./person.ts";
import type { Journal } from "./store.ts";
import { int, object, oneOf, optional, str, UUID, type InputSchema, type JsonSchema } from "./input.ts";
import { lifeKindRefs, lifeSchemaOf, type LifeSchema } from "./life-schemas.ts";
import { checkInput, makeRunner, Refused, type Action, type ActionDecl, type ChangeLog, type Ran, type RunContext, type Source, type StandardSchema } from "./registry.ts";
import { draftPresentation, gateFor, ID, newPresentationId, OCCASIONS, VIRTUE_IDS, type DraftFields, type GateVerdict, type Presentation } from "./presentation.ts";
import { vaultGate, type Presentations } from "./files-presentations.ts";
import type { PublishedFolder, VaultWork } from "./files-published.ts";
import { PROFILE_FILE, postPath, PUBLISHED_DIR, publishPost, publishProfile, publishWorks, parseFrontMatter, unpublish, WORKS_FILE, type Publication } from "./published.ts";
import { shownWorks, type VaultWorkRecord } from "./works-by-end.ts";
import { isPublishable, PUBLISHABLE, SLUG, slugify } from "./site.ts";

/** What Reflect keeps and the rules for an AI working in it; the MCP server's instructions. */
export const GUIDE = [
  "Reflect keeps a person's journal, what they learn, their own ideas, their calendar and the plan for what survives them. You help them write and keep things; you never decide for them.",
  "",
  "Rules: save only what the person asked you to save, in their words. Never infer facts about the person beyond what they wrote, and never share their entries.",
  "",
  "Before anything of the person's goes before others, draft its presentation record with them (draft_presentation) and check it (check_presentation): the channel, who speaks and in what role, for what end, to what audience. You may draft and check; only the person approves.",
  "",
  "Reflect writes files, never a website's code. What passes the gate goes to the vault's published/ folder (publish_files), which the person's own site reads; the site's code lives in its own repository.",
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

/** The channel a vault's published/ folder goes out on: the person's own site. */
export const SITE_CHANNEL = "personal-site";

export const PUBLISH_FILES = {
  id: "publish_files",
  title: "Publish to the published folder",
  description:
    "Ask to write a post, the profile or the works to the vault's published/ folder, which the person's own site reads (Reflect writes files and never the site's code). The works are published/works.json, the person's works by their end (Making, Knowing, Doing) from making/, knowing/ and doing/: a public work in full, a foreshadowed one as one line without its name, a private one never. A post comes from one of the person's Markdown works in the vault (an essay, letter, plan or memoir, from its front matter or kind), never from the journal. Draft its presentation record first with draft_presentation on channel personal-site (the role, the end, the audience) and name it in presentation. It always waits: only the person approves, with reflect approve, and only once the record passes the gate.",
  tier: "outside",
  on: ["mcp"],
  publishes: SITE_CHANNEL,
} as const satisfies ActionDecl;

export const UNPUBLISH_FILES = {
  id: "unpublish_files",
  title: "Take a file out of the published folder",
  description: "Take a post (by its slug), the profile or the works out of the vault's published/ folder and its manifest. Only when the person asks; asked for by a model, it waits for the person.",
  tier: "outside",
  on: ["mcp"],
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

/** What `publish_files` takes: a post from a work in the vault, the profile, or the works by their end. */
export type PublishFilesInput = {
  what: "post" | "profile" | "works";
  presentation: string;
  file?: string;
  slug?: string;
  title?: string;
  kind?: string;
  tags?: string;
  name?: string;
  headline?: string;
  about?: string;
};

/** The vault's published/ folder and how to read a work, which only a vault opened from a folder has. */
function siteOf(ctx: VaultContext): { published: PublishedFolder; readWork: (path: string) => Promise<VaultWork> } {
  if (!ctx.published || !ctx.readWork) throw new Error("this vault has no published/ folder here");
  return { published: ctx.published, readWork: ctx.readWork };
}

/** The post a work makes: its kind, title, slug, tags, and its first date kept when it was published before. */
async function postFrom(ctx: VaultContext, input: PublishFilesInput, now: Date) {
  if (!input.file) throw new Error("name the work to publish by its path in the vault, such as writing/on-craft.md");
  const { published, readWork } = siteOf(ctx);
  const work = await readWork(input.file);
  const kind = input.kind?.trim() || work.kind;
  if (!kind) throw new Error(`say the kind of ${work.path}: ${PUBLISHABLE.join(", ")} (kind: in its front matter, or --kind)`);
  if (!isPublishable(kind)) throw new Error(`${kind} is a kind that is never published; only ${PUBLISHABLE.join(", ")}. The journal stays private.`);
  const title = input.title?.trim() || work.title;
  if (!title) throw new Error(`give ${work.path} a title (title: in its front matter, or --title)`);
  const slug = input.slug?.trim() || slugify(title);
  const before = await published.read(postPath(slug));
  const first = before === null ? null : parseFrontMatter(before).front.date;
  const tags = input.tags !== undefined ? input.tags.split(",") : work.tags;
  const at = now.toISOString();
  return { slug, title, kind, body: work.body, date: typeof first === "string" ? first : at, updated: at, ...(tags ? { tags } : {}) };
}

/** Write a post or the profile to published/ through the gate, and say what was written. */
export async function publishFilesIn(ctx: VaultContext, input: PublishFilesInput, now = new Date()): Promise<{ written: string[]; removed: string[]; presentation: string }> {
  const { published } = siteOf(ctx);
  const policy = await ctx.presentations.policy();
  const record = ID.test(input.presentation) ? await ctx.presentations.get(input.presentation) : null;
  const index = await published.index();
  const approval = { policy, record, channel: SITE_CHANNEL, at: now };
  const pub: Publication =
    input.what === "works"
      ? publishWorks(index, approval, await worksOf(ctx))
      : input.what === "profile"
      ? publishProfile(index, approval, { name: input.name?.trim() || ctx.personName || ctx.userId, ...(input.headline ? { headline: input.headline } : {}), ...(input.about ? { about: input.about } : {}) })
      : publishPost(index, approval, await postFrom(ctx, input, now));
  await published.apply(pub);
  return { written: pub.write.map((w) => `${PUBLISHED_DIR}/${w.path}`), removed: pub.remove.map((r) => `${PUBLISHED_DIR}/${r}`), presentation: input.presentation };
}

/** The vault's works by their end, refused when any record fails its check. */
async function worksOf(ctx: VaultContext): Promise<VaultWorkRecord[]> {
  if (!ctx.readWorks) throw new Error("this vault has no making/, knowing/ or doing/ folders here");
  const { works, problems } = await ctx.readWorks();
  if (problems.length) throw new Error(problems.join("; "));
  return works;
}

/** What `publish_files` will write, for the person to read before they approve. Throws for a work never published. */
async function publishFilesPreview(ctx: VaultContext, input: PublishFilesInput): Promise<string> {
  if (input.what === "works") {
    const works = await worksOf(ctx);
    const shown = shownWorks(works);
    if (!shown.length) throw new Error("There is no work to publish: add one to making/, knowing/ or doing/, and make it public or foreshadowed.");
    const n = (d: string) => shown.filter((w) => w.disclosure === d).length;
    const kept = works.length - shown.length;
    return `Write ${PUBLISHED_DIR}/${WORKS_FILE} (${n("public")} public, ${n("foreshadow")} foreshadowed as one line without a name${kept ? `; ${kept} private kept out` : ""}) and its line in ${PUBLISHED_DIR}/index.json, as the works read when you approve. Your site reads them from there.`;
  }
  if (input.what === "profile") {
    const facts = [`name: ${input.name?.trim() || ctx.personName || ctx.userId}`, input.headline ? `headline: ${input.headline}` : null, input.about ? `about: ${input.about}` : null].filter(Boolean);
    return `Write ${PUBLISHED_DIR}/${PROFILE_FILE} (${facts.join("; ")}) and its line in ${PUBLISHED_DIR}/index.json. Your site reads them from there.`;
  }
  // A work that can never be published (the journal, a kind that is not published, no title) is refused here, so
  // nothing waits for an approval that could never run.
  const p = await postFrom(ctx, input, ctx.now ?? new Date());
  return `Write ${PUBLISHED_DIR}/${postPath(p.slug)} ("${p.title}", ${p.kind}, from ${input.file}) and its line in ${PUBLISHED_DIR}/index.json, as the work reads when you approve. Your site reads them from there.`;
}

/** Take a post or the profile out of published/ and its manifest. */
export async function unpublishFilesIn(ctx: VaultContext, input: { what?: "post" | "profile" | "works"; slug?: string }): Promise<{ removed: string[] }> {
  const { published } = siteOf(ctx);
  if (input.what !== "profile" && input.what !== "works" && !input.slug) throw new Error("name the post to take out by its slug");
  const pub = unpublish(await published.index(), input.what === "profile" ? PROFILE_FILE : input.what === "works" ? WORKS_FILE : postPath(input.slug!));
  await published.apply(pub);
  return { removed: pub.remove.map((r) => `${PUBLISHED_DIR}/${r}`) };
}

/**
 * What a vault's action runs with: the person, their journal, their vault's change log and presentations, and, for a
 * vault opened from a folder, its published/ folder and how to read a work in it.
 */
export type VaultContext = RunContext & {
  journal: Journal;
  changes: ChangeLog;
  presentations: Presentations;
  published?: PublishedFolder;
  readWork?: (path: string) => Promise<VaultWork>;
  /** The person's works by their end, from making/, knowing/ and doing/, with the problems of any that fail. */
  readWorks?: () => Promise<{ works: VaultWorkRecord[]; problems: string[] }>;
  /** The person's name from person.json, which a published profile shows unless another is given. */
  personName?: string;
};

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
  vault({
    ...PUBLISH_FILES,
    input: object({
      what: oneOf(["post", "profile", "works"] as const, { describe: "a post from a work in the vault, the profile, or the works by their end (making/, knowing/ and doing/: public in full, foreshadowed as one line, private never)" }),
      presentation: str({ pattern: ID, describe: "the id of the presentation record on channel personal-site, from draft_presentation" }),
      file: optional(str({ min: 1, describe: "for a post: the work's path in the vault, such as writing/on-craft.md; never the journal" })),
      slug: optional(str({ pattern: SLUG, describe: "the post's address; left out, one made from the title" })),
      title: optional(str({ describe: "the post's title, when the work's front matter has none" })),
      kind: optional(oneOf(PUBLISHABLE, { describe: "the work's kind, when its front matter has none" })),
      tags: optional(str({ describe: "the post's tags, separated by commas" })),
      name: optional(str({ describe: "for the profile: the name shown; left out, the vault's person" })),
      headline: optional(str({ describe: "for the profile: one line on who the person is" })),
      about: optional(str({ describe: "for the profile: a few sentences, in the person's words" })),
    }),
    preview: (ctx, input) => publishFilesPreview(ctx, input),
    run: async (ctx, input) => publishFilesIn(ctx, input, ctx.now ?? new Date()),
    change: (r) => ({ after: r }),
  }),
  vault({
    ...UNPUBLISH_FILES,
    input: object({
      what: optional(oneOf(["post", "profile", "works"] as const, { describe: "a post (the default), the profile or the works" })),
      slug: optional(str({ pattern: SLUG, describe: "the post's slug" })),
    }),
    run: async (ctx, input) => unpublishFilesIn(ctx, input),
    change: (r) => ({ before: r }),
  }),
];

export const vaultActionById = (id: string): VaultAction | undefined => VAULT_ACTIONS.find((a) => a.id === id);

/**
 * The vault's actions the app does not offer under the same name: the app keeps works in Postgres and publishes one
 * with publish_to_site (web/src/server/actions/presentations.ts), which writes the same bytes through the same core
 * functions (./published.ts).
 */
export const VAULT_ONLY: readonly string[] = [PUBLISH_FILES.id, UNPUBLISH_FILES.id];

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
