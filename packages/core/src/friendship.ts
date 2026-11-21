// Friendship as a relation, and the tool for evaluating one (docs/design/REFLECT_FRIENDSHIP_2026-11-21.md; Torian,
// 2026-11-21: "a tool for evaluating and clarifying friendships", Aristotle's Nicomachean Ethics VIII and IX as the
// base, Christian and Lewis schemes mapped onto it, private first and shared after; 16:57Z "Agree, build steps 1 to 4").
//
// A friend is a person (substance). A friendship is a relation (pros ti) between the person and a friend, kept as its
// own record: its basis (useful, pleasant, good), whether it is equal, the community it lives in, and its state as a
// statechart (goodwill, friends, dormant, ended). An evaluation is one author's dated answers to the question
// catalog; like a journal entry it is a source of field values, not a life noun (Torian's ruling of 2026-11-20).
// No answer is a score: each choice reads back what the text says about it, and the judgement stays the person's.
//
// The schemes are SKOS concept schemes. Aristotle's is the base; every other concept maps to one of its concepts with
// a SKOS mapping property, and a departure is said in words. Bekker references were checked at the page and column
// against Rackham's translation (Loeb 1934, on Perseus) by `node scripts/check-bekker.ts`. Pure: no I/O.
import friendshipSchema from "../schemas/friendship.schema.json" with { type: "json" };
import evaluationSchema from "../schemas/friendship-evaluation.schema.json" with { type: "json" };
import catalogSchema from "../schemas/friendship-catalog.schema.json" with { type: "json" };
import { schemaProblems, type Schema } from "./schema-check.ts";

export const FRIENDSHIP_SCHEMA = friendshipSchema as Schema;
export const EVALUATION_SCHEMA = evaluationSchema as Schema;
export const CATALOG_SCHEMA = catalogSchema as Schema;

/** A record id: lower case letters, digits and hyphens. */
export const ID = /^[a-z0-9][a-z0-9-]*$/;

// ---------------------------------------------------------------------------------------------------------------
// The schemes

export const SCHEME_IDS = ["aristotle", "christian", "lewis"] as const;
export type FriendshipSchemeId = (typeof SCHEME_IDS)[number];

/** The SKOS mapping properties (SKOS Reference, 2009, section 10). */
export const MATCHES = ["exactMatch", "closeMatch", "broadMatch", "narrowMatch", "relatedMatch"] as const;
export type Match = (typeof MATCHES)[number];

/** How a concept of another scheme maps onto one of Aristotle's, and, when it departs from him, how. */
export type Mapping = { match: Match; to: string; departs?: string };
export type FriendshipConcept = { id: string; label: string; definition: string; cite: string; maps?: readonly Mapping[] };
export type FriendshipScheme = { id: FriendshipSchemeId; label: string; source: string; base: boolean; concepts: readonly FriendshipConcept[] };

export const ARISTOTLE: FriendshipScheme = {
  id: "aristotle",
  label: "Aristotle",
  source: "Aristotle, Nicomachean Ethics VIII and IX (Bekker pages 1155a-1172a)",
  base: true,
  concepts: [
    { id: "goodwill", label: "Goodwill", definition: "Wishing someone good for their own sake, not yet returned or not yet known to them; the beginning of friendship", cite: "NE VIII.2, 1155b32-1156a5; IX.5, 1166b30-1167a21" },
    { id: "friendship", label: "Friendship", definition: "Goodwill returned and known to both, for the sake of the useful, the pleasant or the good", cite: "NE VIII.2, 1155b27-1156a5" },
    { id: "utility", label: "Friendship of utility", definition: "Each loves the other for the good that comes to them; it ends when the use ends", cite: "NE VIII.3, 1156a10-21" },
    { id: "pleasure", label: "Friendship of pleasure", definition: "Each loves the other for the pleasure they give; common in the young, and quickly over", cite: "NE VIII.3, 1156a31-b6" },
    { id: "virtue", label: "Friendship of virtue", definition: "Good people alike in virtue wish each other good for the other's sake; complete, lasting, rare, and slow to form", cite: "NE VIII.3, 1156b7-32" },
    { id: "equal", label: "Equal friendship", definition: "Each gives and gets the same, or like for like", cite: "NE VIII.6, 1158b1-11" },
    { id: "unequal", label: "Unequal friendship", definition: "One is the greater (parent and child, elder and younger, husband and wife, ruler and ruled); love should be in proportion to worth", cite: "NE VIII.7, 1158b11-28" },
    { id: "too-far", label: "Too far apart", definition: "When one becomes very far above the other, as a god is above us, friendship can no longer go on", cite: "NE VIII.7, 1158b33-1159a5" },
    { id: "community", label: "Community", definition: "Every friendship lives in some community (koinonia): household, kin, comrades, fellow citizens", cite: "NE VIII.9, 1159b25-1160a8" },
    { id: "kin", label: "Kin friendship", definition: "The friendship of parents, children and siblings, which comes from the parents' love for their children", cite: "NE VIII.12, 1161b11-1162a33" },
    { id: "living-together", label: "Living together", definition: "Spending time together is the activity of friendship; distance stops the activity, and long absence makes it forgotten", cite: "NE VIII.5, 1157b5-24; IX.12, 1171b29-1172a15" },
    { id: "complaint", label: "Complaint", definition: "Grievances arise mostly in friendships of utility, about who gives more", cite: "NE VIII.13, 1162a34-1163a23" },
    { id: "dissolution", label: "Dissolution", definition: "A friendship ends when one pretended, when one becomes bad, or when they grow far apart", cite: "NE IX.3, 1165a36-b36" },
    { id: "marks", label: "Marks of a friend", definition: "Wishing and doing good for their sake, wishing them to live, spending time with them, choosing the same things, sharing their grief and joy", cite: "NE IX.4, 1166a1-10" },
    { id: "another-self", label: "Another self", definition: "A good person is related to a friend as to themselves, for the friend is another self", cite: "NE IX.4, 1166a31-32; IX.9, 1170b6-7" },
    { id: "concord", label: "Concord", definition: "Agreement among citizens on what is to their interest and on acting on it; political friendship. Lives in Village and polis", cite: "NE IX.6, 1167a22-b16" },
    { id: "number", label: "Number of friends", definition: "Only as many as one can live with; complete friendship with many is not possible", cite: "NE VIII.6, 1158a10-18; IX.10, 1170b20-1171a20" },
    { id: "fortune", label: "Friends in good and bad fortune", definition: "Friends are needed in both: in bad fortune for help, in good fortune for sharing", cite: "NE IX.11, 1171a21-b28" },
  ],
};

export const CHRISTIAN: FriendshipScheme = {
  id: "christian",
  label: "Christian (Aquinas and Aelred)",
  source: "Thomas Aquinas, Summa Theologiae I-II q.26, II-II q.23 and q.26, and his commentary on the Ethics; Aelred of Rievaulx, Spiritual Friendship (c. 1164); Acts 2:42; 1 John 1:3",
  base: false,
  concepts: [
    { id: "charity", label: "Charity", definition: "The friendship of a person with God, founded on God's sharing his happiness with us", cite: "Aquinas, ST II-II q.23 a.1; John 15:15", maps: [{ match: "relatedMatch", to: "virtue", departs: "Aristotle says friendship cannot reach a god, the gap is too wide (1158b33-1159a5); Aquinas answers that grace gives the shared life." }] },
    { id: "love-of-friendship", label: "Love of friendship", definition: "Loving someone for their own sake, willing them good", cite: "Aquinas, ST I-II q.26 a.4", maps: [{ match: "closeMatch", to: "virtue" }] },
    { id: "love-of-desire", label: "Love of desire", definition: "Loving something for the good it brings to oneself or another", cite: "Aquinas, ST I-II q.26 a.4", maps: [{ match: "closeMatch", to: "utility" }, { match: "closeMatch", to: "pleasure" }] },
    { id: "order-of-charity", label: "Order of charity", definition: "Charity reaches every neighbour, enemies too, but in degrees: God first, then oneself, then those nearer", cite: "Aquinas, ST II-II q.26; Matthew 5:44", maps: [{ match: "relatedMatch", to: "number", departs: "Aristotle keeps complete friendship to a few (IX.10); charity is owed to all, in an order." }] },
    { id: "spiritual-friendship", label: "Spiritual friendship", definition: "Friendship between the good, begun in Christ, kept by Christ and ordered to Christ", cite: "Aelred, Spiritual Friendship I", maps: [{ match: "narrowMatch", to: "virtue" }] },
    { id: "selection", label: "Selection", definition: "Choosing whom to befriend, from what is seen of their character", cite: "Aelred, Spiritual Friendship III", maps: [{ match: "narrowMatch", to: "goodwill" }] },
    { id: "probation", label: "Probation", definition: "Testing a friend before trusting them", cite: "Aelred, Spiritual Friendship III", maps: [{ match: "narrowMatch", to: "goodwill" }] },
    { id: "admission", label: "Admission", definition: "Taking the tested one into friendship", cite: "Aelred, Spiritual Friendship III", maps: [{ match: "narrowMatch", to: "friendship" }] },
    { id: "harmony", label: "Harmony", definition: "Full agreement in things human and divine, with charity and goodwill", cite: "Aelred, Spiritual Friendship III", maps: [{ match: "narrowMatch", to: "virtue" }] },
    { id: "four-qualities", label: "Loyalty, intention, discretion, patience", definition: "The four qualities to test in a friend", cite: "Aelred, Spiritual Friendship III", maps: [{ match: "relatedMatch", to: "marks" }] },
    { id: "fellowship", label: "Fellowship", definition: "Koinonia: sharing a life in Christ with a community of believers", cite: "Acts 2:42; 1 John 1:3", maps: [{ match: "closeMatch", to: "community", departs: "The common end is God, not the city." }] },
  ],
};

export const LEWIS: FriendshipScheme = {
  id: "lewis",
  label: "C. S. Lewis",
  source: "C. S. Lewis, The Four Loves (1960)",
  base: false,
  concepts: [
    { id: "affection", label: "Affection (storge)", definition: "The fondness that grows from familiarity, first among family", cite: "Lewis, The Four Loves, ch. 3", maps: [{ match: "closeMatch", to: "kin" }] },
    { id: "philia", label: "Friendship (philia)", definition: "Two or more side by side, about some shared interest or truth", cite: "Lewis, The Four Loves, ch. 4", maps: [{ match: "narrowMatch", to: "virtue" }, { match: "relatedMatch", to: "living-together" }] },
    { id: "eros", label: "Eros", definition: "Being in love", cite: "Lewis, The Four Loves, ch. 5", maps: [{ match: "relatedMatch", to: "pleasure", departs: "Aristotle treats lover and beloved as a friendship of pleasure that fades with the bloom (VIII.4, 1157a6-14); Lewis gives eros its own standing." }] },
    { id: "agape", label: "Charity (agape)", definition: "Gift-love from God, which loves even the unlovable", cite: "Lewis, The Four Loves, ch. 6", maps: [{ match: "relatedMatch", to: "virtue" }] },
    { id: "need-love", label: "Need-love", definition: "Love that comes from what we lack", cite: "Lewis, The Four Loves, ch. 1", maps: [{ match: "relatedMatch", to: "utility" }] },
    { id: "gift-love", label: "Gift-love", definition: "Love that gives, wanting the good of the other", cite: "Lewis, The Four Loves, ch. 1", maps: [{ match: "relatedMatch", to: "virtue" }] },
  ],
};

export const SCHEMES: readonly FriendshipScheme[] = [ARISTOTLE, CHRISTIAN, LEWIS];
export const schemeById = (id: string): FriendshipScheme | undefined => SCHEMES.find((s) => s.id === id);

/** The cross-scheme crosswalk: each mapping of a concept in another scheme, with the Aristotle concept it names. */
export function crosswalk(): { scheme: FriendshipSchemeId; concept: string; match: Match; to: string; toLabel: string; departs?: string }[] {
  const base = new Map(ARISTOTLE.concepts.map((c) => [c.id, c.label]));
  return SCHEMES.filter((s) => !s.base).flatMap((s) =>
    s.concepts.flatMap((c) => (c.maps ?? []).map((m) => ({ scheme: s.id, concept: c.id, match: m.match, to: m.to, toLabel: base.get(m.to) ?? m.to, ...(m.departs ? { departs: m.departs } : {}) }))),
  );
}

// ---------------------------------------------------------------------------------------------------------------
// The friendship record and its statechart

export const BASES = [
  { id: "utility", label: "Utility", concept: "utility" },
  { id: "pleasure", label: "Pleasure", concept: "pleasure" },
  { id: "virtue", label: "Virtue", concept: "virtue" },
] as const;
export type Basis = (typeof BASES)[number]["id"];

/** The communities a friendship lives in (NE VIII.9 and VIII.12). Concord among citizens lives in Village and polis. */
export const COMMUNITY_KINDS = [
  { id: "household", label: "Household" },
  { id: "kin", label: "Kin" },
  { id: "comrades", label: "Comrades" },
  { id: "fellow-citizens", label: "Fellow citizens" },
  { id: "fellow-travellers", label: "Fellow travellers" },
  { id: "congregation", label: "Congregation" },
  { id: "work", label: "Work" },
  { id: "other", label: "Other" },
] as const;
export type CommunityKind = (typeof COMMUNITY_KINDS)[number]["id"];

export const STATES = [
  { id: "goodwill", label: "Goodwill", means: "You wish them well; it is not yet returned or not yet known (1155b32-1156a5)" },
  { id: "friends", label: "Friends", means: "Goodwill returned and known to both (1156a3-5)" },
  { id: "dormant", label: "Dormant", means: "Apart for a long time: the state remains, the activity stops (1157b5-13)" },
  { id: "ended", label: "Ended", means: "Forgotten through absence, or broken off (1157b11-13; IX.3)" },
] as const;
export type FriendshipState = (typeof STATES)[number]["id"];

/** The statechart's transitions. Nothing leaves Ended: a renewed friendship is a new record. */
export const TRANSITIONS: Readonly<Record<FriendshipState, readonly FriendshipState[]>> = {
  goodwill: ["friends", "ended"],
  friends: ["dormant", "ended"],
  dormant: ["friends", "ended"],
  ended: [],
};

/** How the friend record's states today (packages/core/src/life.ts, kind friend) read as a friendship's state. */
export const FRIEND_STATE_MAP: Readonly<Record<string, FriendshipState>> = { acquaintance: "goodwill", friend: "friends", close: "friends", drifted: "dormant" };
/** How the friend record's `kind` field today reads as a basis. */
export const FRIEND_KIND_MAP: Readonly<Record<string, Basis>> = { utility: "utility", pleasure: "pleasure", virtue: "virtue" };

export type Equality = { kind: "equal" } | { kind: "unequal"; greater: "me" | "friend"; note?: string };
export type StateChange = { at: string; from: FriendshipState | null; to: FriendshipState; why?: string };

export type Friendship = {
  id: string;
  /** The friend: their name, and the friend note or record that holds who they are, when there is one. */
  friend: { name: string; ref?: string };
  basis?: Basis;
  equality?: Equality;
  community?: CommunityKind;
  began?: string;
  state: FriendshipState;
  history: StateChange[];
  created: string;
  updated: string;
};

export const stateOf = (f: Pick<Friendship, "history">): FriendshipState => f.history[f.history.length - 1]!.to;

/** A new friendship, in goodwill unless another state is given (an existing friend comes in as friends). */
export function newFriendship(fields: { id: string; friend: { name: string; ref?: string }; basis?: Basis; equality?: Equality; community?: CommunityKind; began?: string; state?: FriendshipState }, now: Date): Friendship {
  const at = now.toISOString();
  const state = fields.state ?? "goodwill";
  if (state === "ended") throw new Error("a friendship does not begin ended");
  const f: Friendship = {
    id: fields.id,
    friend: fields.friend.ref ? { name: fields.friend.name, ref: fields.friend.ref } : { name: fields.friend.name },
    ...(fields.basis ? { basis: fields.basis } : {}),
    ...(fields.equality ? { equality: fields.equality } : {}),
    ...(fields.community ? { community: fields.community } : {}),
    ...(fields.began ? { began: fields.began } : {}),
    state,
    history: [{ at, from: null, to: state }],
    created: at,
    updated: at,
  };
  const r = parseFriendship(f);
  if (!r.friendship) throw new Error(r.problems.join("; "));
  return r.friendship;
}

/** Move a friendship along its statechart, refusing a move the statechart does not have. */
export function moveFriendship(f: Friendship, to: FriendshipState, now: Date, why?: string): Friendship {
  const from = f.state;
  if (!TRANSITIONS[from].includes(to)) {
    const ok = TRANSITIONS[from];
    throw new Error(ok.length ? `a friendship in ${from} can move to ${ok.join(" or ")}, not ${to}` : "an ended friendship stays ended; begin a new one");
  }
  const at = now.toISOString();
  return { ...f, state: to, history: [...f.history, { at, from, to, ...(why?.trim() ? { why: why.trim() } : {}) }], updated: at };
}

/** Change what a friendship is (basis, equality, community, began, the friend's name or note). Its state moves only by `moveFriendship`. */
export function editFriendship(f: Friendship, fields: Partial<Pick<Friendship, "basis" | "equality" | "community" | "began">> & { friend?: { name: string; ref?: string } }, now: Date): Friendship {
  const next: Friendship = { ...f, ...fields, updated: now.toISOString() };
  const r = parseFriendship(next);
  if (!r.friendship) throw new Error(r.problems.join("; "));
  return r.friendship;
}

/** A friendship read from the friend record the Friends app keeps today: its kind as the basis, its state mapped. */
export function fromFriendRecord(id: string, friend: { name: string; ref?: string; kind?: string; state?: string }, now: Date): Friendship {
  const basis = friend.kind ? FRIEND_KIND_MAP[friend.kind.toLowerCase()] : undefined;
  const state = friend.state ? FRIEND_STATE_MAP[friend.state] : undefined;
  return newFriendship({ id, friend: { name: friend.name, ...(friend.ref ? { ref: friend.ref } : {}) }, ...(basis ? { basis } : {}), ...(state ? { state } : {}) }, now);
}

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);

/** A friendship from JSON, or every way it is not one: the schema, then that the history follows the statechart. */
export function parseFriendship(raw: unknown, at = "friendship"): { friendship: Friendship | null; problems: string[] } {
  const problems = schemaProblems(FRIENDSHIP_SCHEMA, raw, at);
  if (problems.length || !isObj(raw)) return { friendship: null, problems };
  const f = raw as unknown as Friendship;
  f.history.forEach((h, i) => {
    const prev = i === 0 ? null : f.history[i - 1]!.to;
    if (h.from !== prev) problems.push(`${at}.history[${i}]: from is ${prev ?? "null"}, the state before it`);
    else if (prev !== null && !TRANSITIONS[prev].includes(h.to)) problems.push(`${at}.history[${i}]: the statechart has no move from ${prev} to ${h.to}`);
    if (i === 0 && h.to === "ended") problems.push(`${at}.history[0]: a friendship does not begin ended`);
  });
  if (f.history.length && f.state !== stateOf(f)) problems.push(`${at}: state is ${f.state} but the history ends in ${stateOf(f)}`);
  return problems.length ? { friendship: null, problems } : { friendship: f, problems };
}

// ---------------------------------------------------------------------------------------------------------------
// The question catalog

export const BEARS = [
  { id: "basis", label: "Basis", means: "What the friendship is for: the useful, the pleasant or the good" },
  { id: "reciprocity", label: "Reciprocity", means: "Goodwill returned and known" },
  { id: "equality", label: "Equality", means: "Equal or unequal, and what each gives" },
  { id: "time", label: "Time and testing", means: "How long, and what it has been through" },
  { id: "state", label: "State", means: "Whether it is active, dormant or ending" },
  { id: "character", label: "Character", means: "Who each of you is, and whether you choose alike" },
] as const;
export type Bears = (typeof BEARS)[number]["id"];

/** What an answer can point at as evidence: time together and calls (the Friends app's acts), quotes, journal entries. */
export const EVIDENCE_KINDS = ["acts", "quotes", "journal"] as const;
export type EvidenceKind = (typeof EVIDENCE_KINDS)[number];

/** One choice, and what the text says about it. `reads` is never a score: it is the passage, said plainly. */
export type Choice = { id: string; label: string; reads?: string };
export type FriendshipQuestion = { id: string; text: string; scheme: FriendshipSchemeId; cite: string; bears: Bears; choices: readonly Choice[]; evidence: readonly EvidenceKind[] };

/** "Not sure" is always a choice, and it reads nothing. */
export const NOT_SURE: Choice = { id: "not-sure", label: "Not sure" };
const q = (x: Omit<FriendshipQuestion, "choices"> & { choices: Choice[] }): FriendshipQuestion => ({ ...x, choices: [...x.choices, NOT_SURE] });

export const DEFAULT_QUESTIONS: readonly FriendshipQuestion[] = [
  q({
    id: "what-each-gets", scheme: "aristotle", bears: "basis", cite: "NE VIII.2-3, 1155b17-1156b32", evidence: ["acts", "journal"],
    text: "What does each of you get from this: help, enjoyment, or the other person themselves?",
    choices: [
      { id: "help", label: "Mostly help", reads: "A friendship of utility: each loves the other for what comes to them, and it ends when the use ends (1156a10-21)." },
      { id: "enjoyment", label: "Mostly enjoyment", reads: "A friendship of pleasure: each loves the other for the pleasure they give, and it changes as what pleases changes (1156a31-b6)." },
      { id: "themselves", label: "Each other, for who you are", reads: "A friendship of virtue: each wishes the other good for the other's sake. It is lasting, and it is also useful and pleasant (1156b7-17)." },
    ],
  }),
  q({
    id: "for-their-sake", scheme: "aristotle", bears: "reciprocity", cite: "NE VIII.2, 1155b27-31", evidence: ["journal", "quotes"],
    text: "Do you wish them well for their own sake?",
    choices: [
      { id: "yes", label: "Yes" },
      { id: "partly", label: "Partly" },
      { id: "no", label: "No", reads: "Without wishing them good for their own sake, Aristotle would not call it friendship (1155b27-31)." },
    ],
  }),
  q({
    id: "returned-and-known", scheme: "aristotle", bears: "reciprocity", cite: "NE VIII.2, 1155b32-1156a5", evidence: ["quotes", "acts"],
    text: "Do they wish you well too, and does each of you know the other does?",
    choices: [
      { id: "both-know", label: "Yes, and we both know it", reads: "Goodwill returned and known: what Aristotle calls friendship (1156a3-5)." },
      { id: "unspoken", label: "I think so, but it has not been said or shown", reads: "Aristotle adds that the goodwill must be known to both (1155b34-1156a5)." },
      { id: "not-returned", label: "Not returned", reads: "Goodwill, not yet friendship (1155b32-34)." },
    ],
  }),
  q({
    id: "if-not-useful", scheme: "aristotle", bears: "basis", cite: "NE VIII.3, 1156a14-24", evidence: ["journal"],
    text: "If they stopped being useful or fun to you, would you still wish them well?",
    choices: [
      { id: "yes", label: "Yes", reads: "You love them for who they are, not for what comes to you (1156b9-12)." },
      { id: "no", label: "No", reads: "You love them for what comes to you, not for who they are, and such a friendship is easily dissolved (1156a14-21)." },
    ],
  }),
  q({
    id: "how-long", scheme: "aristotle", bears: "time", cite: "NE VIII.3, 1156b25-32", evidence: ["acts"],
    text: "How long have you known each other, and what have you been through together?",
    choices: [
      { id: "new", label: "Less than a year", reads: "The wish to be friends comes quickly; friendship does not. It needs time and familiarity, the proverbial salt eaten together (1156b25-32)." },
      { id: "untested", label: "Some years, little tested" },
      { id: "tested", label: "Years, and tested", reads: "Time and testing are what complete friendship needs (1156b25-32)." },
    ],
  }),
  q({
    id: "bad-fortune", scheme: "aristotle", bears: "time", cite: "NE IX.11, 1171a21-b28", evidence: ["acts", "journal"],
    text: "Have they stood by you in bad fortune, and you by them?",
    choices: [
      { id: "both", label: "Both of us", reads: "Friends are needed in bad fortune for help and in good fortune for sharing (IX.11)." },
      { id: "one-way", label: "One of us has" },
      { id: "not-yet", label: "It has not come up" },
      { id: "no", label: "No" },
    ],
  }),
  q({
    id: "time-together", scheme: "aristotle", bears: "state", cite: "NE VIII.5, 1157b5-24; IX.12, 1171b29-1172a15", evidence: ["acts"],
    text: "Do you spend time doing the things each of you cares about most?",
    choices: [
      { id: "often", label: "Often", reads: "Living together is the activity of friendship (IX.12)." },
      { id: "sometimes", label: "Sometimes" },
      { id: "rarely", label: "Rarely", reads: "Distance stops the activity but not the friendship; a long absence can make it forgotten (1157b10-13)." },
    ],
  }),
  q({
    id: "same-choices", scheme: "aristotle", bears: "character", cite: "NE IX.4, 1166a6-7; IX.6, 1167a26-28", evidence: ["quotes", "acts"],
    text: "Do you agree on the choices that matter?",
    choices: [
      { id: "yes", label: "Yes", reads: "Choosing the same things is one of the marks of a friend (IX.4)." },
      { id: "mostly", label: "Mostly" },
      { id: "no", label: "No" },
    ],
  }),
  q({
    id: "grief-and-joy", scheme: "aristotle", bears: "reciprocity", cite: "NE IX.4, 1166a7-9", evidence: ["acts", "journal"],
    text: "Do you share their grief and their joy?",
    choices: [
      { id: "yes", label: "Yes", reads: "Grieving and rejoicing with a friend is one of the marks of friendship (IX.4)." },
      { id: "partly", label: "Partly" },
      { id: "no", label: "No" },
    ],
  }),
  q({
    id: "who-is-greater", scheme: "aristotle", bears: "equality", cite: "NE VIII.7, 1158b11-28", evidence: ["journal"],
    text: "Is one of you the greater in this friendship, and is what each gives in proportion?",
    choices: [
      { id: "equal", label: "We are equals", reads: "An equal friendship: each gives and gets the same, or like for like (VIII.6)." },
      { id: "i-am", label: "I am the greater", reads: "An unequal friendship: love should be in proportion to worth, so the greater is loved more than they love (1158b23-28)." },
      { id: "they-are", label: "They are the greater", reads: "An unequal friendship: love should be in proportion to worth, so the greater is loved more than they love (1158b23-28)." },
    ],
  }),
  q({
    id: "complaint", scheme: "aristotle", bears: "equality", cite: "NE VIII.13, 1162b5-21", evidence: ["quotes", "journal"],
    text: "Is there a complaint, yours or theirs, about who gives more?",
    choices: [
      { id: "none", label: "None" },
      { id: "mine", label: "Mine" },
      { id: "theirs", label: "Theirs" },
      { id: "both", label: "Both of ours", reads: "Complaints arise only or mostly in friendships of utility (1162b5-6)." },
    ],
  }),
  q({
    id: "changed", scheme: "aristotle", bears: "state", cite: "NE IX.3, 1165a36-b36", evidence: ["journal", "quotes"],
    text: "Has either of you changed since it began, and how?",
    choices: [
      { id: "neither", label: "Neither of us" },
      { id: "i-have", label: "I have", reads: "When one grows and the other does not, they may no longer be able to be friends; some regard is still owed for the past (1165b23-36)." },
      { id: "they-have", label: "They have", reads: "If a friend becomes bad, help them back while they can be helped; break off only if they cannot (1165b13-22)." },
      { id: "both", label: "Both of us" },
    ],
  }),
  q({
    id: "toward-god", scheme: "christian", bears: "basis", cite: "Aelred, Spiritual Friendship I", evidence: ["journal"],
    text: "Is this friendship helping each of you toward God?",
    choices: [
      { id: "yes", label: "Yes", reads: "Spiritual friendship, as Aelred describes it: begun in Christ and ordered to Christ." },
      { id: "partly", label: "Partly" },
      { id: "no", label: "No" },
    ],
  }),
  q({
    id: "four-qualities", scheme: "christian", bears: "character", cite: "Aelred, Spiritual Friendship III", evidence: ["acts", "journal"],
    text: "Have you seen their loyalty, intention, discretion and patience tested?",
    choices: [
      { id: "all", label: "All four" },
      { id: "some", label: "Some of them" },
      { id: "none", label: "None yet", reads: "Aelred would have a friend tested in these four before being admitted to friendship." },
    ],
  }),
  q({
    id: "aelred-stage", scheme: "christian", bears: "state", cite: "Aelred, Spiritual Friendship III", evidence: ["acts"],
    text: "Which stage is it at: selection, probation, admission or harmony?",
    choices: [
      { id: "selection", label: "Selection" },
      { id: "probation", label: "Probation" },
      { id: "admission", label: "Admission" },
      { id: "harmony", label: "Harmony" },
    ],
  }),
  q({
    id: "which-loves", scheme: "lewis", bears: "basis", cite: "Lewis, The Four Loves, ch. 3-6", evidence: ["journal"],
    text: "Which of the loves is strongest in this: affection, friendship, eros or charity?",
    choices: [
      { id: "affection", label: "Affection" },
      { id: "philia", label: "Friendship" },
      { id: "eros", label: "Eros" },
      { id: "agape", label: "Charity" },
    ],
  }),
  q({
    id: "side-by-side", scheme: "lewis", bears: "basis", cite: "Lewis, The Four Loves, ch. 4", evidence: ["acts"],
    text: "Is there something you both care about, side by side?",
    choices: [
      { id: "yes", label: "Yes", reads: "Lewis's friendship: two side by side, looking at the same thing." },
      { id: "no", label: "No" },
    ],
  }),
];

/** The person's own settings for the catalog: the schemes turned on, the questions hidden, and their own questions. */
export type FriendshipCatalog = { schemes: FriendshipSchemeId[]; hidden: string[]; added: FriendshipQuestion[] };
/** Aristotle on, the others off until the person turns them on. */
export const DEFAULT_CATALOG: FriendshipCatalog = { schemes: ["aristotle"], hidden: [], added: [] };

/** The questions to ask: the defaults of the schemes turned on and the person's own, less the hidden ones. Hidden questions are kept, not deleted. */
export function questionsFor(catalog: FriendshipCatalog): FriendshipQuestion[] {
  const on = new Set<string>(catalog.schemes);
  const hidden = new Set(catalog.hidden);
  return [...DEFAULT_QUESTIONS.filter((x) => on.has(x.scheme)), ...catalog.added].filter((x) => !hidden.has(x.id));
}

export const questionById = (catalog: FriendshipCatalog, id: string): FriendshipQuestion | undefined => [...DEFAULT_QUESTIONS, ...catalog.added].find((x) => x.id === id);

/** A catalog from JSON, or every way it is not one. */
export function parseCatalog(raw: unknown, at = "catalog"): { catalog: FriendshipCatalog | null; problems: string[] } {
  const problems = schemaProblems(CATALOG_SCHEMA, raw, at);
  if (problems.length || !isObj(raw)) return { catalog: null, problems };
  const c = raw as unknown as FriendshipCatalog;
  if (!c.schemes.includes("aristotle")) problems.push(`${at}: Aristotle is the base scheme and stays on`);
  const taken = new Set(DEFAULT_QUESTIONS.map((x) => x.id));
  for (const a of c.added) {
    if (taken.has(a.id)) problems.push(`${at}: question id ${a.id} is taken`);
    taken.add(a.id);
    if (!a.choices.some((ch) => ch.id === NOT_SURE.id)) problems.push(`${at}: question ${a.id} needs the choice not-sure`);
  }
  return problems.length ? { catalog: null, problems } : { catalog: c, problems };
}

/** The person adds a question of their own. Its scheme is the one it draws on; "not sure" is added to its choices. */
export function addQuestion(c: FriendshipCatalog, x: { id: string; text: string; bears: Bears; choices: { id: string; label: string }[]; scheme?: FriendshipSchemeId; cite?: string }): FriendshipCatalog {
  if (!ID.test(x.id)) throw new Error("a question id is lower case letters, digits and hyphens");
  if (questionById(c, x.id)) throw new Error(`question ${x.id} is taken`);
  if (x.choices.length < 1) throw new Error("a question needs at least one choice");
  const question = q({ id: x.id, text: x.text, bears: x.bears, scheme: x.scheme ?? "aristotle", cite: x.cite ?? "the person's own", evidence: ["acts", "quotes", "journal"], choices: x.choices.filter((ch) => ch.id !== NOT_SURE.id) });
  const next = { ...c, added: [...c.added, question] };
  const r = parseCatalog(next);
  if (!r.catalog) throw new Error(r.problems.join("; "));
  return r.catalog;
}

export function hideQuestion(c: FriendshipCatalog, id: string, hide: boolean): FriendshipCatalog {
  if (!questionById(c, id)) throw new Error(`no question ${id}`);
  const hidden = hide ? [...new Set([...c.hidden, id])] : c.hidden.filter((h) => h !== id);
  return { ...c, hidden };
}

export function setScheme(c: FriendshipCatalog, scheme: FriendshipSchemeId, on: boolean): FriendshipCatalog {
  if (scheme === "aristotle" && !on) throw new Error("Aristotle is the base scheme and stays on");
  const schemes = on ? [...new Set([...c.schemes, scheme])] : c.schemes.filter((s) => s !== scheme);
  return { ...c, schemes: SCHEME_IDS.filter((s) => schemes.includes(s)) };
}

// ---------------------------------------------------------------------------------------------------------------
// The evaluation

export type Answer = { question: string; choice: string; words?: string; evidence?: string[] };
export type FriendshipEvaluation = {
  id: string;
  friendship: string;
  date: string;
  /** Who wrote it: the person, or an assistant whose answers wait for the person to confirm them. */
  by: "person" | "assistant";
  status: "stated" | "proposed" | "confirmed";
  /** Private in this version. Sharing with the friend after private reflection is build step 6. */
  audience: "private";
  schemes: FriendshipSchemeId[];
  answers: Answer[];
  created: string;
};

/** A new evaluation, each answer checked against the catalog. An assistant's comes in proposed. */
export function newEvaluation(catalog: FriendshipCatalog, f: { id: string; friendship: string; date: string; answers: Answer[] }, by: "person" | "assistant", now: Date): FriendshipEvaluation {
  const problems: string[] = [];
  const seen = new Set<string>();
  for (const a of f.answers) {
    const question = questionById(catalog, a.question);
    if (!question) problems.push(`no question ${a.question}`);
    else if (!question.choices.some((ch) => ch.id === a.choice)) problems.push(`${a.question}: the choices are ${question.choices.map((ch) => ch.id).join(", ")}`);
    if (seen.has(a.question)) problems.push(`${a.question} is answered twice`);
    seen.add(a.question);
  }
  if (!f.answers.length) problems.push("an evaluation answers at least one question");
  if (problems.length) throw new Error(problems.join("; "));
  const e: FriendshipEvaluation = {
    id: f.id,
    friendship: f.friendship,
    date: f.date,
    by,
    status: by === "person" ? "stated" : "proposed",
    audience: "private",
    schemes: [...catalog.schemes],
    answers: f.answers.map((a) => ({ question: a.question, choice: a.choice, ...(a.words?.trim() ? { words: a.words.trim() } : {}), ...(a.evidence?.length ? { evidence: a.evidence } : {}) })),
    created: now.toISOString(),
  };
  const r = parseEvaluation(e);
  if (!r.evaluation) throw new Error(r.problems.join("; "));
  return r.evaluation;
}

/** The person confirms an assistant's evaluation. Only a proposed one can be confirmed. */
export function confirmEvaluation(e: FriendshipEvaluation): FriendshipEvaluation {
  if (e.status !== "proposed") throw new Error(`evaluation ${e.id} is ${e.status}; only a proposed one is confirmed`);
  return { ...e, status: "confirmed" };
}

/** An evaluation counts once the person wrote or confirmed it. */
export const counts = (e: Pick<FriendshipEvaluation, "status">): boolean => e.status !== "proposed";

export function parseEvaluation(raw: unknown, at = "evaluation"): { evaluation: FriendshipEvaluation | null; problems: string[] } {
  const problems = schemaProblems(EVALUATION_SCHEMA, raw, at);
  if (problems.length || !isObj(raw)) return { evaluation: null, problems };
  const e = raw as unknown as FriendshipEvaluation;
  if ((e.by === "person") !== (e.status === "stated")) problems.push(`${at}: the person's own evaluation is stated, an assistant's proposed or confirmed`);
  return problems.length ? { evaluation: null, problems } : { evaluation: e, problems };
}

/** What an evaluation's answers say against the text: each answered question with its choice and its reading. No score. */
export function readEvaluation(catalog: FriendshipCatalog, e: FriendshipEvaluation): { question: string; text: string; bears: Bears; scheme: FriendshipSchemeId; cite: string; choice: string; label: string; reads?: string; words?: string; evidence?: string[] }[] {
  return e.answers.flatMap((a) => {
    const question = questionById(catalog, a.question);
    const choice = question?.choices.find((ch) => ch.id === a.choice);
    if (!question || !choice) return [];
    return [{ question: question.id, text: question.text, bears: question.bears, scheme: question.scheme, cite: question.cite, choice: choice.id, label: choice.label, ...(choice.reads ? { reads: choice.reads } : {}), ...(a.words ? { words: a.words } : {}), ...(a.evidence ? { evidence: a.evidence } : {}) }];
  });
}

/** What the person's answers suggest about the basis, if they answered the basis questions, as a suggestion only: the person sets the basis. */
export function suggestedBasis(e: Pick<FriendshipEvaluation, "answers">): Basis | null {
  const get = (id: string) => e.answers.find((a) => a.question === id)?.choice;
  const gets = get("what-each-gets");
  const ifNot = get("if-not-useful");
  if (gets === "themselves" && ifNot !== "no") return "virtue";
  if (gets === "help") return "utility";
  if (gets === "enjoyment") return "pleasure";
  return null;
}

// ---------------------------------------------------------------------------------------------------------------
// The check

/**
 * Every problem with the schemes and the catalog's defaults: ids unique, only Aristotle's scheme is the base, every
 * concept of another scheme maps onto a concept of Aristotle's, every question names a scheme that exists, a passage,
 * unique choices and "not sure", and every Aristotle question cites the Ethics by Bekker number.
 */
export function checkFriendshipSchemes(schemes: readonly FriendshipScheme[] = SCHEMES, questions: readonly FriendshipQuestion[] = DEFAULT_QUESTIONS): string[] {
  const out: string[] = [];
  const bases = schemes.filter((s) => s.base);
  if (bases.length !== 1 || bases[0]!.id !== "aristotle") out.push("Aristotle's scheme is the one base scheme");
  const base = new Set((schemes.find((s) => s.id === "aristotle")?.concepts ?? []).map((c) => c.id));
  for (const s of schemes) {
    const ids = new Set<string>();
    for (const c of s.concepts) {
      if (ids.has(c.id)) out.push(`${s.id}: concept ${c.id} twice`);
      ids.add(c.id);
      if (!c.cite.trim()) out.push(`${s.id}:${c.id} cites nothing`);
      if (s.base && c.maps?.length) out.push(`${s.id}:${c.id}: the base scheme maps onto nothing`);
      if (!s.base && !c.maps?.length) out.push(`${s.id}:${c.id} maps onto no concept of Aristotle's`);
      for (const m of c.maps ?? []) {
        if (!base.has(m.to)) out.push(`${s.id}:${c.id} maps to ${m.to}, which is not a concept of Aristotle's`);
        if (!(MATCHES as readonly string[]).includes(m.match)) out.push(`${s.id}:${c.id}: ${m.match} is not a SKOS mapping property`);
      }
    }
  }
  const qids = new Set<string>();
  const schemeIds = new Set(schemes.map((s) => s.id));
  for (const x of questions) {
    if (qids.has(x.id)) out.push(`question ${x.id} twice`);
    qids.add(x.id);
    if (!schemeIds.has(x.scheme)) out.push(`question ${x.id}: no scheme ${x.scheme}`);
    if (!x.cite.trim()) out.push(`question ${x.id} cites nothing`);
    if (x.scheme === "aristotle" && !/^NE [IVX]+\.\d+.*\b11[5-7]\d[ab]\d/.test(x.cite)) out.push(`question ${x.id} cites the Ethics without a Bekker number`);
    const cids = x.choices.map((c) => c.id);
    if (new Set(cids).size !== cids.length) out.push(`question ${x.id} has a choice twice`);
    if (!cids.includes(NOT_SURE.id)) out.push(`question ${x.id} lacks not-sure`);
    if (!(BEARS as readonly { id: string }[]).some((b) => b.id === x.bears)) out.push(`question ${x.id}: ${x.bears} is not one of the bearings`);
  }
  return out;
}
