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
import type { QuotesFolder } from "./files-quotes.ts";
import { claimView, liveTags, QUOTE_SOURCE_KINDS, quoteStatus, SCHEME_IDS, type QuoteSourceKind, type SchemeId } from "./quotes.ts";
import { isPublishable, PUBLISHABLE, SLUG, slugify } from "./site.ts";
import { freshId, type FriendshipsFolder } from "./files-friendships.ts";
import {
  addQuestion,
  BASES,
  BEARS,
  COMMUNITY_KINDS,
  confirmEvaluation,
  counts,
  crosswalk,
  editFriendship,
  hideQuestion,
  ID as FRIENDSHIP_ID,
  moveFriendship,
  newEvaluation,
  newFriendship,
  questionsFor,
  readEvaluation,
  SCHEME_IDS as FRIENDSHIP_SCHEME_IDS,
  SCHEMES as FRIENDSHIP_SCHEMES,
  setScheme,
  STATES,
  suggestedBasis,
  type Answer,
  type Basis,
  type Bears,
  type CommunityKind,
  type Equality,
  type Friendship,
  type FriendshipSchemeId,
  type FriendshipState,
} from "./friendship.ts";

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

export const KEEP_QUOTE = {
  id: "keep_quote",
  title: "Keep a quote",
  description:
    "Keep words someone said or wrote, exactly as they were said, never a paraphrase: the person's own (leave speaker out) or another's (name the speaker). Optionally tag what it says (claim: an existing claim's id, or a short wording that makes a new claim) and what the words do (act, as Inference Anchoring Theory names it: asserting, agreeing, disagreeing, pure-questioning, retracting, ...). Kept by you, the quote and its tags come in proposed until the person confirms them. Keep only what the person asked you to keep.",
  tier: "own",
  on: ["mcp"],
} as const satisfies ActionDecl;

export const TAG_QUOTE = {
  id: "tag_quote",
  title: "Tag a quote or claim",
  description:
    "Add one tag to a quote or a claim (a W3C Web Annotation). On a quote: act, claim, relation (with object, the quote or claim it bears on), subject, note. On a claim: domain, kind (ideal, or practical with object the ideal it serves), origin, subject, note. Your tags come in proposed; only the person confirms or withdraws, so a status tag is refused here. Nothing is edited or deleted.",
  tier: "own",
  on: ["mcp"],
} as const satisfies ActionDecl;

export const READ_QUOTES = {
  id: "read_quotes",
  title: "Read quotes and claims",
  description:
    "The person's quotes with their tags, or, given a claim's id, what the person has said about that claim over time and who else says it. This is what was said, never what the person believes inside: show it as \"you said\".",
  tier: "read",
  on: ["mcp"],
} as const satisfies ActionDecl;

export const READ_FRIENDSHIPS = {
  id: "read_friendships",
  title: "Read friendships",
  description:
    "The person's friendships (a friendship is a relation between the person and a friend: its basis, useful, pleasant or good, equal or unequal, its community and its state, goodwill, friends, dormant or ended; Nicomachean Ethics VIII-IX). Given an id: that friendship with its evaluations, each answer read against the text. Private: never share it.",
  tier: "read",
  on: ["mcp"],
} as const satisfies ActionDecl;

export const KEEP_FRIENDSHIP = {
  id: "keep_friendship",
  title: "Keep a friendship",
  description: "Begin a friendship record with a friend, or change its basis, equality, community or when it began. The person's own: an assistant may suggest it, never write it.",
  tier: "own",
  on: ["mcp"],
} as const satisfies ActionDecl;

export const MOVE_FRIENDSHIP = {
  id: "move_friendship",
  title: "Move a friendship's state",
  description: "Move a friendship along its statechart: goodwill to friends or ended; friends to dormant or ended; dormant to friends or ended. Nothing leaves ended. The person's own.",
  tier: "own",
  on: ["mcp"],
} as const satisfies ActionDecl;

export const FRIENDSHIP_QUESTIONS = {
  id: "friendship_questions",
  title: "The friendship questions",
  description:
    "The questions for evaluating a friendship, from the schemes the person turned on (Aristotle always; Christian, from Aquinas and Aelred, and C. S. Lewis when on), less the hidden ones, plus the person's own. Each has its passage and its choices, and each choice what the text says about it. Also the schemes and how each maps onto Aristotle's. Ask them one at a time; never answer for the person.",
  tier: "read",
  on: ["mcp"],
} as const satisfies ActionDecl;

export const EVALUATE_FRIENDSHIP = {
  id: "evaluate_friendship",
  title: "Evaluate a friendship",
  description:
    "Keep the person's answers to the friendship questions, dated, for one friendship. Only answers the person gave, in their words. Kept by an assistant, the evaluation comes in proposed until the person confirms it. Private. No answer is a score.",
  tier: "own",
  on: ["mcp"],
} as const satisfies ActionDecl;

export const FRIENDSHIP_CATALOG = {
  id: "friendship_catalog",
  title: "Change the friendship questions",
  description: "Turn a scheme on or off (Aristotle stays on), hide or show a question (hidden ones are kept), or add a question of the person's own. The person's own.",
  tier: "own",
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

/** The vault's quotes folder, refused when the host has none. */
function quotesOf(ctx: VaultContext): QuotesFolder {
  if (!ctx.quotes) throw new Error("this vault has no quotes/ and claims/ folders here");
  return ctx.quotes;
}

/** The quotes with their live tags, or what the person said about one claim. */
export async function readQuotesIn(ctx: VaultContext, claim?: string) {
  const { quotes, claims, problems } = await quotesOf(ctx).read();
  if (claim) {
    const c = claims.find((x) => x.id === claim);
    if (!c) throw new Error(`no claim ${claim}; claims: ${claims.map((x) => x.id).join(", ") || "none yet"}`);
    return { ...claimView(c.id, c.record, quotes), tags: liveTags(c.record).map(({ id, scheme, value, object, status }) => ({ id, scheme, value, ...(object ? { object } : {}), status })) };
  }
  return {
    quotes: quotes.map(({ id, record: q }) => ({ id, text: q.text, speaker: "self" in q.speaker ? "the person" : q.speaker.name, source: q.source, said_at: q.said_at ?? null, status: quoteStatus(q), tags: liveTags(q).map(({ id: t, scheme, value, object, status }) => ({ id: t, scheme, value, ...(object ? { object } : {}), status })) })),
    claims: claims.map(({ id, record }) => ({ id, text: record.text })),
    problems,
  };
}

/** The vault's friendships folder, refused when the host has none. */
function friendshipsOf(ctx: VaultContext): FriendshipsFolder {
  if (!ctx.friendships) throw new Error("this vault has no friendships/ folder here");
  return ctx.friendships;
}

/** Friendship records are the person's: an assistant suggests, the person writes (Reflect's standing rule). */
function personOnly(ctx: VaultContext, what: string) {
  if (ctx.origin !== "cli") throw new Error(`${what} is the person's to do; suggest it to them instead`);
}

const friendshipOut = (f: Friendship) => ({ id: f.id, friend: f.friend, basis: f.basis ?? null, equality: f.equality ?? null, community: f.community ?? null, began: f.began ?? null, state: f.state, since: f.history[f.history.length - 1]!.at });

/** Every friendship, or one with its evaluations read against the text. */
export async function readFriendshipsIn(ctx: VaultContext, id?: string) {
  const store = friendshipsOf(ctx);
  if (!id) {
    const all = await store.list();
    const evals = await store.evaluations();
    return { friendships: all.map((f) => ({ ...friendshipOut(f), evaluations: evals.filter((e) => e.friendship === f.id).length })) };
  }
  const f = await store.get(id);
  if (!f) throw new Error(`no friendship ${id}`);
  const catalog = await store.catalog();
  const evals = await store.evaluations(id);
  return {
    friendship: { ...friendshipOut(f), history: f.history },
    evaluations: evals.map((e) => ({ id: e.id, date: e.date, status: e.status, counts: counts(e), suggested_basis: suggestedBasis(e), answers: readEvaluation(catalog, e) })),
  };
}

export type KeepFriendshipInput = { id?: string; friend?: string; ref?: string; basis?: Basis; equality?: "equal" | "unequal"; greater?: "me" | "friend"; note?: string; community?: CommunityKind; began?: string; state?: FriendshipState };

function equalityOf(input: KeepFriendshipInput): Equality | undefined {
  if (!input.equality) return undefined;
  if (input.equality === "equal") return { kind: "equal" };
  if (!input.greater) throw new Error("an unequal friendship says who is the greater: me or friend");
  return { kind: "unequal", greater: input.greater, ...(input.note?.trim() ? { note: input.note.trim() } : {}) };
}

export async function keepFriendshipIn(ctx: VaultContext, input: KeepFriendshipInput, now = new Date()): Promise<{ id: string; created: boolean; friendship: ReturnType<typeof friendshipOut> }> {
  personOnly(ctx, "keeping a friendship");
  const store = friendshipsOf(ctx);
  const equality = equalityOf(input);
  if (input.id) {
    const f = await store.get(input.id);
    if (!f) throw new Error(`no friendship ${input.id}; leave id out to begin one`);
    if (input.state) throw new Error("a friendship's state moves with move_friendship");
    const next = editFriendship(f, { ...(input.basis ? { basis: input.basis } : {}), ...(equality ? { equality } : {}), ...(input.community ? { community: input.community } : {}), ...(input.began ? { began: input.began } : {}), ...(input.friend ? { friend: { name: input.friend, ...(input.ref ?? f.friend.ref ? { ref: input.ref ?? f.friend.ref } : {}) } } : {}) }, now);
    await store.put(next);
    return { id: next.id, created: false, friendship: friendshipOut(next) };
  }
  if (!input.friend?.trim()) throw new Error("name the friend");
  const id = freshId(input.friend, new Set((await store.list()).map((f) => f.id)));
  const f = newFriendship({ id, friend: { name: input.friend.trim(), ...(input.ref ? { ref: input.ref } : {}) }, ...(input.basis ? { basis: input.basis } : {}), ...(equality ? { equality } : {}), ...(input.community ? { community: input.community } : {}), ...(input.began ? { began: input.began } : {}), ...(input.state ? { state: input.state } : {}) }, now);
  await store.put(f);
  return { id, created: true, friendship: friendshipOut(f) };
}

export async function moveFriendshipIn(ctx: VaultContext, id: string, to: FriendshipState, why: string | undefined, now = new Date()) {
  personOnly(ctx, "moving a friendship");
  const store = friendshipsOf(ctx);
  const f = await store.get(id);
  if (!f) throw new Error(`no friendship ${id}`);
  const next = moveFriendship(f, to, now, why);
  await store.put(next);
  return { id, from: f.state, to: next.state };
}

export async function friendshipQuestionsIn(ctx: VaultContext) {
  const catalog = await friendshipsOf(ctx).catalog();
  return {
    schemes: FRIENDSHIP_SCHEMES.map((s) => ({ id: s.id, label: s.label, source: s.source, on: catalog.schemes.includes(s.id) })),
    questions: questionsFor(catalog),
    hidden: catalog.hidden,
    crosswalk: crosswalk(),
  };
}

/** Answers as the CLI and an MCP client give them: a JSON list, or question=choice pairs separated by commas. */
export function parseAnswers(text: string): Answer[] {
  const t = text.trim();
  if (t.startsWith("[")) {
    let raw: unknown;
    try {
      raw = JSON.parse(t);
    } catch {
      throw new Error("answers is not JSON");
    }
    if (!Array.isArray(raw)) throw new Error("answers is a list");
    return raw.map((a, i) => {
      if (!a || typeof a !== "object" || typeof (a as Answer).question !== "string" || typeof (a as Answer).choice !== "string") throw new Error(`answers[${i}] needs question and choice`);
      const x = a as Answer;
      return { question: x.question, choice: x.choice, ...(typeof x.words === "string" ? { words: x.words } : {}), ...(Array.isArray(x.evidence) ? { evidence: x.evidence.map(String) } : {}) };
    });
  }
  return t.split(",").map((pair) => {
    const [question, choice] = pair.split("=").map((x) => x.trim());
    if (!question || !choice) throw new Error(`"${pair}" is not question=choice`);
    return { question, choice };
  });
}

export async function evaluateFriendshipIn(ctx: VaultContext, input: { friendship: string; answers: string; date?: string }, now = new Date()) {
  const store = friendshipsOf(ctx);
  const f = await store.get(input.friendship);
  if (!f) throw new Error(`no friendship ${input.friendship}`);
  const catalog = await store.catalog();
  const date = input.date ?? now.toISOString().slice(0, 10);
  const id = freshId(`${date}-${f.id}`, new Set((await store.evaluations()).map((e) => e.id)));
  const e = newEvaluation(catalog, { id, friendship: f.id, date, answers: parseAnswers(input.answers) }, ctx.origin === "cli" ? "person" : "assistant", now);
  await store.putEvaluation(e);
  return { id, status: e.status, suggested_basis: suggestedBasis(e), answers: readEvaluation(catalog, e) };
}

export async function confirmFriendshipEvaluationIn(ctx: VaultContext, id: string) {
  personOnly(ctx, "confirming an evaluation");
  const store = friendshipsOf(ctx);
  const e = await store.getEvaluation(id);
  if (!e) throw new Error(`no evaluation ${id}`);
  const next = confirmEvaluation(e);
  await store.putEvaluation(next);
  return { id, status: next.status };
}

export type FriendshipCatalogInput = { scheme?: FriendshipSchemeId; on?: "on" | "off"; hide?: string; show?: string; add?: string; text?: string; bears?: Bears; choices?: string; cite?: string };

export async function friendshipCatalogIn(ctx: VaultContext, input: FriendshipCatalogInput) {
  personOnly(ctx, "changing the friendship questions");
  const store = friendshipsOf(ctx);
  let c = await store.catalog();
  if (input.scheme) c = setScheme(c, input.scheme, input.on !== "off");
  if (input.hide) c = hideQuestion(c, input.hide, true);
  if (input.show) c = hideQuestion(c, input.show, false);
  if (input.add) {
    if (!input.text?.trim() || !input.bears || !input.choices?.trim()) throw new Error("a new question needs text, bears and choices (labels separated by commas)");
    const choices = input.choices.split(",").map((l) => l.trim()).filter(Boolean).map((label) => ({ id: freshId(label, new Set()), label }));
    c = addQuestion(c, { id: input.add, text: input.text.trim(), bears: input.bears, choices, ...(input.scheme ? { scheme: input.scheme } : {}), ...(input.cite ? { cite: input.cite } : {}) });
  }
  await store.putCatalog(c);
  return { schemes: c.schemes, hidden: c.hidden, added: c.added.map((x) => x.id), asked: questionsFor(c).length };
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
  /** The vault's quotes/ and claims/ folders (./files-quotes.ts). */
  quotes?: QuotesFolder;
  /** The vault's friendships/ folder (./files-friendships.ts). */
  friendships?: FriendshipsFolder;
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
  }),  vault({
    ...KEEP_QUOTE,
    input: object({
      text: str({ min: 1, describe: "the exact words" }),
      speaker: optional(str({ min: 1, describe: "who said it, when not the person" })),
      source: optional(oneOf(QUOTE_SOURCE_KINDS.map((k) => k.id) as unknown as readonly QuoteSourceKind[], { describe: "where it was said; journal when left out" })),
      ref: optional(str({ min: 1, describe: "the source record or work, such as a journal file or a book" })),
      title: optional(str({ min: 1, describe: "the source's title" })),
      locator: optional(str({ min: 1, describe: "the place in the source: page, paragraph, timestamp" })),
      said_at: optional(str({ pattern: /^\d{4}-\d{2}-\d{2}$/, describe: "when it was said, YYYY-MM-DD" })),
      claim: optional(str({ min: 1, describe: "what it says: an existing claim's id, or a short wording for a new claim" })),
      act: optional(str({ min: 1, describe: "what the words do: asserting, agreeing, disagreeing, pure-questioning, assertive-questioning, rhetorical-questioning, challenging, restating, retracting, none" })),
    }),
    run: async (ctx, input) => quotesOf(ctx).keep(input, ctx.origin === "cli" ? "person" : "assistant", ctx.now ?? new Date()),
    change: (r) => ({ after: r }),
  }),
  vault({
    ...TAG_QUOTE,
    input: object({
      id: str({ min: 1, describe: "the quote's or claim's id" }),
      scheme: oneOf(SCHEME_IDS, { describe: "the vocabulary: act, claim, relation, subject, domain, kind, origin, note (status is the person's)" }),
      value: str({ min: 1, describe: "a concept of the scheme, a claim's id for a claim tag, or the note's words" }),
      object: optional(str({ min: 1, describe: "for relation, the quote or claim it bears on; for kind practical, the ideal it serves" })),
      exact: optional(str({ min: 1, describe: "the exact words of the quote the tag is about; left out, the whole quote" })),
      prefix: optional(str({ describe: "the words just before exact" })),
      suffix: optional(str({ describe: "the words just after exact" })),
    }),
    run: async (ctx, { id, scheme, value, object: obj, exact, prefix, suffix }) =>
      quotesOf(ctx).tag(id, { scheme: scheme as SchemeId, value, creator: ctx.origin === "cli" ? "person" : "assistant", ...(obj ? { object: obj } : {}), ...(exact ? { selector: { exact, ...(prefix ? { prefix } : {}), ...(suffix ? { suffix } : {}) } } : {}) }, ctx.now ?? new Date()),
    change: (r) => ({ after: r }),
  }),
  vault({
    ...READ_QUOTES,
    input: object({ claim: optional(str({ min: 1, describe: "a claim's id, for what the person said about it" })) }),
    run: async (ctx, { claim }) => readQuotesIn(ctx, claim),
  }),
  vault({
    ...READ_FRIENDSHIPS,
    input: object({ id: optional(str({ pattern: FRIENDSHIP_ID, describe: "a friendship's id, for it with its evaluations" })) }),
    run: async (ctx, { id }) => readFriendshipsIn(ctx, id),
  }),
  vault({
    ...KEEP_FRIENDSHIP,
    input: object({
      id: optional(str({ pattern: FRIENDSHIP_ID, describe: "a friendship's id, to change it; left out, a new one" })),
      friend: optional(str({ min: 1, describe: "the friend's name" })),
      ref: optional(str({ min: 1, describe: "the friend note that holds who they are, such as belonging/friends/ana.md" })),
      basis: optional(oneOf(BASES.map((b) => b.id), { describe: "utility, pleasure or virtue (Nicomachean Ethics VIII.3)" })),
      equality: optional(oneOf(["equal", "unequal"] as const, { describe: "equal, or unequal (VIII.6-7)" })),
      greater: optional(oneOf(["me", "friend"] as const, { describe: "in an unequal friendship, who is the greater" })),
      note: optional(str({ describe: "in an unequal friendship, what each gives" })),
      community: optional(oneOf(COMMUNITY_KINDS.map((k) => k.id), { describe: "the community it lives in (VIII.9, VIII.12)" })),
      began: optional(str({ pattern: /^\d{4}-\d{2}-\d{2}$/, describe: "when it began, YYYY-MM-DD" })),
      state: optional(oneOf(STATES.map((x) => x.id), { describe: "for a new one: goodwill (the default) or friends, or dormant" })),
    }),
    run: async (ctx, input) => keepFriendshipIn(ctx, input, ctx.now ?? new Date()),
    change: (r) => ({ after: { id: r.id } }),
  }),
  vault({
    ...MOVE_FRIENDSHIP,
    input: object({
      id: str({ pattern: FRIENDSHIP_ID, describe: "the friendship's id" }),
      to: oneOf(STATES.map((x) => x.id), { describe: "the state it moves to" }),
      why: optional(str({ describe: "why, in the person's words" })),
    }),
    run: async (ctx, { id, to, why }) => moveFriendshipIn(ctx, id, to, why, ctx.now ?? new Date()),
    change: (r) => ({ after: r }),
  }),
  vault({ ...FRIENDSHIP_QUESTIONS, run: async (ctx) => friendshipQuestionsIn(ctx) }),
  vault({
    ...EVALUATE_FRIENDSHIP,
    input: object({
      friendship: str({ pattern: FRIENDSHIP_ID, describe: "the friendship's id" }),
      answers: str({ min: 1, describe: "the person's answers: question=choice pairs separated by commas, or a JSON list of {question, choice, words, evidence}" }),
      date: optional(str({ pattern: /^\d{4}-\d{2}-\d{2}$/, describe: "the day of the evaluation, YYYY-MM-DD; today when left out" })),
    }),
    run: async (ctx, input) => evaluateFriendshipIn(ctx, input, ctx.now ?? new Date()),
    // The answers are in the evaluation's own file; the change log keeps only its id.
    logged: ({ friendship }) => ({ friendship }),
    change: (r) => ({ after: { id: r.id, status: r.status } }),
  }),
  vault({
    ...FRIENDSHIP_CATALOG,
    input: object({
      scheme: optional(oneOf(FRIENDSHIP_SCHEME_IDS, { describe: "a scheme to turn on or off, or the scheme a new question draws on" })),
      on: optional(oneOf(["on", "off"] as const, { describe: "with scheme: on (the default) or off" })),
      hide: optional(str({ pattern: FRIENDSHIP_ID, describe: "a question to hide" })),
      show: optional(str({ pattern: FRIENDSHIP_ID, describe: "a hidden question to show again" })),
      add: optional(str({ pattern: FRIENDSHIP_ID, describe: "the id of a new question of the person's own" })),
      text: optional(str({ min: 1, describe: "the new question's words" })),
      bears: optional(oneOf(BEARS.map((b) => b.id), { describe: "what the new question bears on" })),
      choices: optional(str({ min: 1, describe: "the new question's choices, separated by commas; not sure is added" })),
      cite: optional(str({ min: 1, describe: "the passage the new question comes from" })),
    }),
    run: async (ctx, input) => friendshipCatalogIn(ctx, input),
    change: (r) => ({ after: r }),
  }),
];

export const vaultActionById = (id: string): VaultAction | undefined => VAULT_ACTIONS.find((a) => a.id === id);

/**
 * The vault's actions the app does not offer under the same name: the app keeps works in Postgres and publishes one
 * with publish_to_site (web/src/server/actions/presentations.ts), which writes the same bytes through the same core
 * functions (./published.ts).
 */
export const VAULT_ONLY: readonly string[] = [PUBLISH_FILES.id, UNPUBLISH_FILES.id, READ_FRIENDSHIPS.id, KEEP_FRIENDSHIP.id, MOVE_FRIENDSHIP.id, FRIENDSHIP_QUESTIONS.id, EVALUATE_FRIENDSHIP.id, FRIENDSHIP_CATALOG.id];

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
