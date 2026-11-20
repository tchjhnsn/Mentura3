// The presentation gate (Reflect framework plan, step 6): how a person appears before others, in person or in public
// view, and whether a publishing action may run. It is the personal form of Naive's publication gate (EE-025):
//   - the policy, `presentation-policy.json` in the vault, is shaped like Naive's publication policy
//     (packages/naive/src/records/publication-policy.schema.json in tchjhnsn/naive), with `role` and `end` added to
//     each channel rule, a channel kind `in-person` that has no destination, and the person as the only approver;
//   - a presentation record, `presentations/<id>.json`, holds one appearance: its channel, the six circumstances of an
//     action (Nicomachean Ethics III.1, 1111a3-6), the occasion (Rhetoric I.3), the audience with the person's relation
//     to them, the virtue at stake with its two faults (Nicomachean Ethics IV.3 and IV.6-9), and afterward how it went;
//   - `gateFor` says whether a publishing action may run: ready, or the missing items.
// Pure: it reads and writes nothing. The folder host is ./files-presentations.ts; the runner calls the gate through
// its host (./registry.ts). JSON Schemas for both files are in packages/core/schemas/.

/** The occasion kinds of Rhetoric I.3 (1358b2-8): deliberating about the future, judging the past, praise or ceremony. */
export const OCCASIONS = ["deliberative", "judicial", "ceremonial"] as const;
export type Occasion = (typeof OCCASIONS)[number];

/**
 * The virtues of social life, each a mean between two faults: friendliness, truthfulness about oneself, wit and a
 * sense of shame (Nicomachean Ethics IV.6-9), and greatness of soul (IV.3), the measure for honour.
 */
export const VIRTUES = [
  { id: "friendliness", name: "friendliness", excess: "flattery", deficiency: "quarrelsomeness", cite: "Nicomachean Ethics IV.6, 1126b11-1127a12" },
  { id: "truthfulness", name: "truthfulness about oneself", excess: "boastfulness", deficiency: "false modesty", cite: "Nicomachean Ethics IV.7, 1127a13-b32" },
  { id: "wit", name: "wit", excess: "buffoonery", deficiency: "boorishness", cite: "Nicomachean Ethics IV.8, 1127b33-1128b9" },
  { id: "shame", name: "a sense of shame", excess: "bashfulness", deficiency: "shamelessness", cite: "Nicomachean Ethics IV.9, 1128b10-35; II.7, 1108a32-35" },
  { id: "greatness-of-soul", name: "greatness of soul", excess: "vanity", deficiency: "smallness of soul", cite: "Nicomachean Ethics IV.3, 1123a34-1125a35" },
] as const;
export type VirtueId = (typeof VIRTUES)[number]["id"];
export const VIRTUE_IDS: readonly VirtueId[] = VIRTUES.map((v) => v.id);

/** Naive's channel kinds that a person has, and `profile` and `in-person`. Only `in-person` has no destination. */
export const CHANNEL_KINDS = ["website", "profile", "blog", "social", "newsletter", "email", "in-person", "other"] as const;
export type ChannelKind = (typeof CHANNEL_KINDS)[number];
/** Naive's guideline kinds, unchanged. */
export const GUIDELINE_KINDS = ["brand", "editorial", "legal", "platform", "disclosure", "security", "other"] as const;
/** Naive's platforms, unchanged. */
export const PLATFORMS = ["substack", "medium", "x", "facebook", "instagram", "threads", "linkedin", "youtube", "tiktok", "reddit", "bluesky", "mastodon", "discord", "app-store", "google-play", "github", "other"] as const;
export const REPLY_MODES = ["gated", "delegated", "none"] as const;
/** Who may draft: the person, or an agent working for them. Only the person approves. */
export const DRAFTERS = ["person", "agent"] as const;
/** The one approver a personal policy has. */
export const APPROVER = "person";

export type Guideline = { id: string; title: string; kind: (typeof GUIDELINE_KINDS)[number]; owner?: string; path?: string; url?: string; checked?: string };
/** Who may present what on a channel, as whom and for what end. `approvers` is always ["person"]. */
export type ChannelRule = { content: string; role: string; end: string; drafters?: (typeof DRAFTERS)[number][]; approvers: (typeof APPROVER)[] };
export type ChannelCheck = { id: string; check: string; kind?: "conformance" | "review" };
export type Channel = {
  id: string;
  name: string;
  kind: ChannelKind;
  /** Where it lands: a URL, an account or a recipient list. Left out only for `in-person`. */
  destination?: string;
  audience?: string;
  guidelines?: string[];
  rules: ChannelRule[];
  checks: ChannelCheck[];
  preview: string;
  platform?: (typeof PLATFORMS)[number];
  replies?: { mode: (typeof REPLY_MODES)[number]; delegates?: string[]; note?: string };
};
export type PresentationPolicy = { person: string; updated?: string; note?: string; guidelines?: Guideline[]; channels: Channel[] };

/** One appearance before others. */
export type Presentation = {
  id: string;
  /** The policy channel it goes out on, or happens in. */
  channel: string;
  /** The six circumstances (Nicomachean Ethics III.1, 1111a3-6). */
  circumstances: {
    /** Who acts, and in what role (founder, friend, citizen, son). `name` left out is the person. */
    who: { name?: string; role?: string };
    /** What is done or said. */
    what?: string;
    /** About what, or to whom. */
    about?: string;
    /** By what means: the medium, the instrument, what one wears or carries. */
    means?: string;
    /** For what end: what the appearance is for. */
    end?: string;
    /** How: the manner, gently or harshly, carriage and bearing. */
    how?: string;
  };
  occasion?: Occasion;
  /** Who will see or hear it, and the person's relation to them. */
  audience?: { who: string; relation?: string };
  /** The virtue at stake and the two faults it sits between. */
  virtue?: { id: VirtueId; excess: string; deficiency: string };
  /** Afterward, how it went, in the person's words. */
  afterward?: { on: string; went: string };
  created: string;
  updated: string;
};

/** A record or channel id: lower case letters, digits and hyphens. */
export const ID = /^[a-z0-9][a-z0-9-]*$/;
/** Words the CLI reads after `reflect present`, so no channel may take them as its id. */
export const RESERVED_CHANNEL_IDS = ["check", "after"] as const;

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const isStr = (v: unknown): v is string => typeof v === "string";
const nonEmpty = (v: unknown): v is string => typeof v === "string" && v.trim().length > 0;
const isIn = <T extends string>(list: readonly T[], v: unknown): v is T => typeof v === "string" && (list as readonly string[]).includes(v);
const norm = (s: string): string => s.trim().toLowerCase().replace(/\s+/g, " ");

/** Keys a value may have; any other is a problem, as `additionalProperties: false` says in the schema. */
function onlyKeys(v: Record<string, unknown>, keys: readonly string[], where: string, problems: string[]): void {
  for (const k of Object.keys(v)) if (!keys.includes(k)) problems.push(`${where}: ${k} is not a field here`);
}

function strings(v: unknown, where: string, problems: string[]): void {
  if (v !== undefined && (!Array.isArray(v) || !v.every(isStr))) problems.push(`${where} is a list of strings`);
}

/**
 * Read a presentation policy from parsed JSON: its shape, as `presentation-policy.schema.json` gives it, then
 * `checkPresentationPolicy`. The policy is returned only when there are no problems.
 */
export function parsePresentationPolicy(v: unknown): { policy: PresentationPolicy | null; problems: string[] } {
  const problems: string[] = [];
  if (!isObj(v)) return { policy: null, problems: ["a presentation policy is a JSON object"] };
  onlyKeys(v, ["$schema", "person", "updated", "note", "guidelines", "channels"], "policy", problems);
  if (!nonEmpty(v.person)) problems.push("policy: person is required");
  if (v.updated !== undefined && !(isStr(v.updated) && /^\d{4}-\d{2}-\d{2}$/.test(v.updated))) problems.push("policy: updated is a date, YYYY-MM-DD");
  if (v.note !== undefined && !isStr(v.note)) problems.push("policy: note is a string");
  if (v.guidelines !== undefined) {
    if (!Array.isArray(v.guidelines)) problems.push("policy: guidelines is a list");
    else
      v.guidelines.forEach((g, i) => {
        const at = `guidelines[${i}]`;
        if (!isObj(g)) return void problems.push(`${at} is an object`);
        onlyKeys(g, ["id", "title", "kind", "owner", "path", "url", "checked"], at, problems);
        if (!nonEmpty(g.id) || !nonEmpty(g.title)) problems.push(`${at}: id and title are required`);
        if (!isIn(GUIDELINE_KINDS, g.kind)) problems.push(`${at}: kind is one of ${GUIDELINE_KINDS.join(", ")}`);
        for (const k of ["owner", "path", "url", "checked"] as const) if (g[k] !== undefined && !isStr(g[k])) problems.push(`${at}: ${k} is a string`);
      });
  }
  if (!Array.isArray(v.channels) || v.channels.length === 0) problems.push("policy: channels is a list of at least one channel");
  else
    v.channels.forEach((c, i) => {
      const at = `channels[${i}]`;
      if (!isObj(c)) return void problems.push(`${at} is an object`);
      onlyKeys(c, ["id", "name", "kind", "destination", "audience", "guidelines", "rules", "checks", "preview", "platform", "replies"], at, problems);
      if (!nonEmpty(c.id) || !nonEmpty(c.name)) problems.push(`${at}: id and name are required`);
      if (!isIn(CHANNEL_KINDS, c.kind)) problems.push(`${at}: kind is one of ${CHANNEL_KINDS.join(", ")}`);
      for (const k of ["destination", "audience", "preview"] as const) if (c[k] !== undefined && !isStr(c[k])) problems.push(`${at}: ${k} is a string`);
      if (!nonEmpty(c.preview)) problems.push(`${at}: preview is required: how to see exactly what would go out before it does`);
      strings(c.guidelines, `${at}: guidelines`, problems);
      if (c.platform !== undefined && !isIn(PLATFORMS, c.platform)) problems.push(`${at}: platform is one of ${PLATFORMS.join(", ")}`);
      if (c.replies !== undefined) {
        if (!isObj(c.replies) || !isIn(REPLY_MODES, c.replies.mode)) problems.push(`${at}: replies.mode is one of ${REPLY_MODES.join(", ")}`);
        else {
          onlyKeys(c.replies, ["mode", "delegates", "note"], `${at}.replies`, problems);
          strings(c.replies.delegates, `${at}.replies.delegates`, problems);
        }
      }
      if (!Array.isArray(c.rules) || c.rules.length === 0) problems.push(`${at}: rules is a list of at least one rule`);
      else
        c.rules.forEach((r, j) => {
          const rat = `${at}.rules[${j}]`;
          if (!isObj(r)) return void problems.push(`${rat} is an object`);
          onlyKeys(r, ["content", "role", "end", "drafters", "approvers"], rat, problems);
          if (!nonEmpty(r.content)) problems.push(`${rat}: content is required`);
          if (!nonEmpty(r.role)) problems.push(`${rat}: role is required: the speaker's role there, such as founder, friend, citizen or son`);
          if (!nonEmpty(r.end)) problems.push(`${rat}: end is required: what the appearance is for`);
          if (r.drafters !== undefined && !(Array.isArray(r.drafters) && r.drafters.every((d) => isIn(DRAFTERS, d)))) problems.push(`${rat}: drafters are person or agent`);
          if (!Array.isArray(r.approvers) || r.approvers.length === 0 || !r.approvers.every(isStr)) problems.push(`${rat}: approvers is a list of at least one`);
        });
      if (!Array.isArray(c.checks) || c.checks.length === 0) problems.push(`${at}: checks is a list of at least one check`);
      else
        c.checks.forEach((k, j) => {
          const kat = `${at}.checks[${j}]`;
          if (!isObj(k)) return void problems.push(`${kat} is an object`);
          onlyKeys(k, ["id", "check", "kind"], kat, problems);
          if (!nonEmpty(k.id) || !nonEmpty(k.check)) problems.push(`${kat}: id and check are required`);
          if (k.kind !== undefined && k.kind !== "conformance" && k.kind !== "review") problems.push(`${kat}: kind is conformance or review`);
        });
    });
  if (problems.length) return { policy: null, problems };
  const policy = v as unknown as PresentationPolicy;
  const more = checkPresentationPolicy(policy);
  return more.length ? { policy: null, problems: more } : { policy, problems: [] };
}

/**
 * The policy's rules across fields, which the schema alone cannot say: channel ids are unique and not a word the CLI
 * reads; an in-person channel has no destination and every other channel has one; every approver is the person, so
 * no agent approves; a guideline a channel names exists; check ids are unique within a channel.
 */
export function checkPresentationPolicy(p: PresentationPolicy): string[] {
  const problems: string[] = [];
  const guidelineIds = new Set((p.guidelines ?? []).map((g) => g.id));
  const seen = new Set<string>();
  for (const c of p.channels) {
    if (!ID.test(c.id)) problems.push(`channel ${c.id}: an id is lower case letters, digits and hyphens`);
    if ((RESERVED_CHANNEL_IDS as readonly string[]).includes(c.id)) problems.push(`channel ${c.id}: ${c.id} is a word reflect present reads; name the channel otherwise`);
    if (seen.has(c.id)) problems.push(`channel ${c.id} is listed twice`);
    seen.add(c.id);
    if (c.kind === "in-person" && c.destination !== undefined) problems.push(`channel ${c.id}: an in-person channel has no destination`);
    if (c.kind !== "in-person" && !nonEmpty(c.destination)) problems.push(`channel ${c.id}: destination is required: where it lands`);
    for (const g of c.guidelines ?? []) if (!guidelineIds.has(g)) problems.push(`channel ${c.id}: guideline ${g} is not in the policy's guidelines`);
    c.rules.forEach((r, j) => {
      const others = r.approvers.filter((a) => a !== APPROVER);
      if (others.length) problems.push(`channel ${c.id} rule ${j + 1}: the approver is always the person, not ${others.join(", ")}`);
    });
    const checks = new Set<string>();
    for (const k of c.checks) {
      if (checks.has(k.id)) problems.push(`channel ${c.id}: check ${k.id} is listed twice`);
      checks.add(k.id);
    }
  }
  return problems;
}

/** Read a presentation record from parsed JSON, or the problems that keep it from being one. */
export function parsePresentation(v: unknown): { presentation: Presentation | null; problems: string[] } {
  const problems: string[] = [];
  if (!isObj(v)) return { presentation: null, problems: ["a presentation is a JSON object"] };
  onlyKeys(v, ["$schema", "id", "channel", "circumstances", "occasion", "audience", "virtue", "afterward", "created", "updated"], "presentation", problems);
  if (!isStr(v.id) || !ID.test(v.id)) problems.push("presentation: id is lower case letters, digits and hyphens");
  if (!nonEmpty(v.channel)) problems.push("presentation: channel is required");
  if (!nonEmpty(v.created) || !nonEmpty(v.updated)) problems.push("presentation: created and updated are required");
  const c = v.circumstances;
  if (!isObj(c)) problems.push("presentation: circumstances is an object with who, what, about, means, end and how");
  else {
    onlyKeys(c, ["who", "what", "about", "means", "end", "how"], "circumstances", problems);
    if (!isObj(c.who)) problems.push("circumstances: who is an object with name and role");
    else {
      onlyKeys(c.who, ["name", "role"], "circumstances.who", problems);
      for (const k of ["name", "role"] as const) if (c.who[k] !== undefined && !isStr(c.who[k])) problems.push(`circumstances.who: ${k} is a string`);
    }
    for (const k of ["what", "about", "means", "end", "how"] as const) if (c[k] !== undefined && !isStr(c[k])) problems.push(`circumstances: ${k} is a string`);
  }
  if (v.occasion !== undefined && !isIn(OCCASIONS, v.occasion)) problems.push(`presentation: occasion is one of ${OCCASIONS.join(", ")}`);
  if (v.audience !== undefined) {
    if (!isObj(v.audience) || !isStr(v.audience.who)) problems.push("presentation: audience is an object with who and relation");
    else {
      onlyKeys(v.audience, ["who", "relation"], "audience", problems);
      if (v.audience.relation !== undefined && !isStr(v.audience.relation)) problems.push("audience: relation is a string");
    }
  }
  if (v.virtue !== undefined) {
    const vid = isObj(v.virtue) ? v.virtue.id : undefined;
    const known = VIRTUES.find((x) => x.id === vid);
    if (!isObj(v.virtue) || !known) problems.push(`presentation: virtue.id is one of ${VIRTUE_IDS.join(", ")}`);
    else {
      onlyKeys(v.virtue, ["id", "excess", "deficiency"], "virtue", problems);
      if (v.virtue.excess !== known.excess || v.virtue.deficiency !== known.deficiency) problems.push(`virtue: ${known.name} sits between ${known.excess} and ${known.deficiency}`);
    }
  }
  if (v.afterward !== undefined && !(isObj(v.afterward) && isStr(v.afterward.on) && nonEmpty(v.afterward.went))) problems.push("presentation: afterward is an object with on and went");
  return problems.length ? { presentation: null, problems } : { presentation: v as unknown as Presentation, problems: [] };
}

/** One thing the gate still needs. */
export type Missing = { item: "presentation" | "channel" | "end" | "role" | "audience" | "rule"; message: string };
/** The gate's answer: ready, with the channel and the rule that matched, or the missing items. */
export type GateVerdict = { ready: true; channel: Channel; rule: ChannelRule } | { ready: false; missing: Missing[] };

/** A rule's role and end, as a person reads them. */
export const ruleLine = (r: ChannelRule): string => `as ${r.role}, to ${r.end.replace(/^to /i, "")} (${r.content})`;

/**
 * Whether a publishing action to `channelId` may run with this presentation record. It needs a record on that
 * channel, a channel the policy has, the end, the role and the audience, and a rule on the channel whose role and end
 * are the record's (compared without case or extra spaces). The person's approval is the runner's to ask.
 */
export function gateFor(policy: PresentationPolicy, record: Presentation | null, channelId: string): GateVerdict {
  const missing: Missing[] = [];
  const channel = policy.channels.find((c) => c.id === channelId);
  if (!channel) missing.push({ item: "channel", message: `the policy has no channel ${channelId}; it has ${policy.channels.map((c) => c.id).join(", ")}` });
  if (!record) {
    missing.push({ item: "presentation", message: `no presentation record; draft one with reflect present ${channelId}` });
    return { ready: false, missing };
  }
  if (record.channel !== channelId) missing.push({ item: "channel", message: `presentation ${record.id} is for ${record.channel}, not ${channelId}` });
  const end = record.circumstances.end?.trim() ?? "";
  const role = record.circumstances.who.role?.trim() ?? "";
  if (!end) missing.push({ item: "end", message: "the end: what this appearance is for" });
  if (!role) missing.push({ item: "role", message: "the role: who you speak as here, such as founder, friend, citizen or son" });
  if (!record.audience?.who.trim()) missing.push({ item: "audience", message: "the audience: who will see or hear it, and your relation to them" });
  const rule = channel && end && role ? channel.rules.find((r) => norm(r.role) === norm(role) && norm(r.end) === norm(end)) : undefined;
  if (channel && end && role && !rule) missing.push({ item: "rule", message: `no rule on ${channel.id} lets you speak as ${role} for that end; its rules: ${channel.rules.map(ruleLine).join("; ")}` });
  if (missing.length || !channel || !rule) return { ready: false, missing };
  return { ready: true, channel, rule };
}

/** What a draft may set; a field left out keeps what the record had. */
export type DraftFields = {
  channel: string;
  who?: string;
  role?: string;
  what?: string;
  about?: string;
  means?: string;
  end?: string;
  how?: string;
  occasion?: string;
  audience?: string;
  relation?: string;
  virtue?: string;
};

const given = (v: string | undefined): string | undefined => (v === undefined ? undefined : v.trim() || undefined);
function set<T extends object, K extends keyof T>(o: T, k: K, v: T[K] | undefined): void {
  if (v === undefined) delete o[k];
  else o[k] = v;
}

/**
 * Draft a presentation record, or a new version of one: fields given replace the record's, an empty string clears a
 * field, and the rest stay. Refuses a channel the policy lacks, an occasion or a virtue it does not know, and a
 * relation with no audience. Drafting never approves.
 */
export function draftPresentation(policy: PresentationPolicy, existing: Presentation | null, f: DraftFields, made: { id: string; now: Date }): Presentation {
  if (!policy.channels.some((c) => c.id === f.channel)) throw new Error(`the policy has no channel ${f.channel}; it has ${policy.channels.map((c) => c.id).join(", ")}`);
  if (existing && existing.channel !== f.channel) throw new Error(`presentation ${existing.id} is for ${existing.channel}; draft a new one for ${f.channel}`);
  if (!ID.test(made.id)) throw new Error("a presentation id is lower case letters, digits and hyphens");
  const occasion = given(f.occasion);
  if (occasion !== undefined && !isIn(OCCASIONS, occasion)) throw new Error(`the occasion is one of ${OCCASIONS.join(", ")} (Rhetoric I.3)`);
  const virtueId = given(f.virtue);
  const virtue = virtueId === undefined ? undefined : VIRTUES.find((v) => v.id === virtueId);
  if (virtueId !== undefined && !virtue) throw new Error(`the virtue is one of ${VIRTUE_IDS.join(", ")}`);
  const at = made.now.toISOString();
  const p: Presentation = existing ? structuredClone(existing) : { id: made.id, channel: f.channel, circumstances: { who: {} }, created: at, updated: at };
  p.updated = at;
  const who = p.circumstances.who;
  if (f.who !== undefined) set(who, "name", given(f.who));
  if (f.role !== undefined) set(who, "role", given(f.role));
  for (const k of ["what", "about", "means", "end", "how"] as const) if (f[k] !== undefined) set(p.circumstances, k, given(f[k]));
  if (f.occasion !== undefined) set(p, "occasion", occasion as Occasion | undefined);
  if (f.audience !== undefined) set(p, "audience", given(f.audience) === undefined ? undefined : { who: given(f.audience)!, ...(p.audience?.relation ? { relation: p.audience.relation } : {}) });
  if (f.relation !== undefined) {
    if (!p.audience) throw new Error("name the audience before your relation to them");
    set(p.audience, "relation", given(f.relation));
  }
  if (f.virtue !== undefined) set(p, "virtue", virtue ? { id: virtue.id, excess: virtue.excess, deficiency: virtue.deficiency } : undefined);
  return p;
}

/** Keep how it went, afterward, in the person's words. */
export function recordAfterward(p: Presentation, went: string, on: string, now: Date): Presentation {
  const w = went.trim();
  if (!w) throw new Error("say how it went");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(on)) throw new Error("the date is YYYY-MM-DD");
  return { ...structuredClone(p), afterward: { on, went: w }, updated: now.toISOString() };
}

/** A new record's id: the date and the channel, with a number when that is taken. */
export function newPresentationId(channel: string, date: string, taken: ReadonlySet<string>): string {
  const base = `${date}-${channel}`;
  if (!taken.has(base)) return base;
  for (let n = 2; ; n++) if (!taken.has(`${base}-${n}`)) return `${base}-${n}`;
}

const rulesOf = (...rules: [string, string, string][]): ChannelRule[] => rules.map(([role, end, content]) => ({ content, role, end, drafters: ["person", "agent"], approvers: [APPROVER] }));
const CHECKS: ChannelCheck[] = [
  { id: "six-circumstances", check: "The record names who acts and in what role, what, about what or to whom, by what means, for what end and how (Nicomachean Ethics III.1).", kind: "review" },
  { id: "fitting", check: "What is said, and how, fits the speaker, the subject and the audience (Rhetoric III.7).", kind: "review" },
  { id: "the-mean", check: "It is neither of the two faults the virtue at stake sits between (Nicomachean Ethics IV.3, IV.6-9).", kind: "review" },
];
const GUIDES = ["to-prepon", "social-virtues", "goodwill", "pride"];

/** The policy a vault starts with: the person's own site, their Reflect profile, social, email and in person. */
export function defaultPolicy(person: string): PresentationPolicy {
  return {
    person,
    note: "Where you appear before others and as whom, for what end. The approver is always you: an agent may draft and check, and never approves. Edit the channels, roles and ends to your own.",
    guidelines: [
      { id: "to-prepon", title: "Fittingness: what is said and how fits the speaker, the subject and the audience (Aristotle, Rhetoric III.7)", kind: "editorial" },
      { id: "social-virtues", title: "The virtues of social life, each a mean (Aristotle, Nicomachean Ethics IV.3 and IV.6-9)", kind: "editorial" },
      { id: "goodwill", title: "Goodwill toward those one meets (Dale Carnegie, How to Win Friends and Influence People)", kind: "editorial" },
      { id: "pride", title: "Pride, the boaster seen from the other side (C. S. Lewis, Mere Christianity, The Great Sin)", kind: "editorial" },
    ],
    channels: [
      {
        id: "personal-site",
        name: "Your own site",
        kind: "website",
        destination: "your own site, saved to GitHub (Settings, Your site, Your own site on GitHub)",
        audience: "anyone who looks you up",
        guidelines: GUIDES,
        // Reflect writes files to the site (posts, the profile and the manifest), never the site's code.
        rules: rulesOf(["founder", "show what I make and whom it serves", "pages about your work"], ["writer", "share what I have thought through", "essays and notes"]),
        checks: CHECKS,
        preview: "The page as built, before it is saved",
        platform: "github",
      },
      {
        id: "reflect-profile",
        name: "Your Reflect profile",
        kind: "profile",
        destination: "your public profile on Reflect",
        audience: "people who find you on Reflect",
        guidelines: GUIDES,
        rules: rulesOf(["self", "be known truly by those who look", "what your profile shows"]),
        checks: CHECKS,
        preview: "Your profile as a visitor sees it",
      },
      {
        id: "social",
        name: "Social accounts",
        kind: "social",
        destination: "your social accounts",
        audience: "those who follow you, and whoever they pass it to",
        guidelines: GUIDES,
        rules: rulesOf(["founder", "show what I make and whom it serves", "posts about your work"], ["citizen", "speak to a public question", "posts on public questions"], ["friend", "keep up with friends", "posts for friends"]),
        checks: CHECKS,
        preview: "The post's exact text and images",
        replies: { mode: "gated", note: "A reply speaks for you in public, so it passes the gate like any post." },
      },
      {
        id: "email",
        name: "Email",
        kind: "email",
        destination: "the recipients you name",
        guidelines: GUIDES,
        rules: rulesOf(["founder", "ask for help or offer it", "letters about your work"], ["friend", "keep up with friends", "letters to friends"]),
        checks: CHECKS,
        preview: "The exact message and its recipients",
      },
      {
        id: "in-person",
        name: "In person",
        kind: "in-person",
        audience: "whoever is in the room",
        guidelines: GUIDES,
        rules: rulesOf(
          ["friend", "keep up with friends", "a meeting with friends"],
          ["founder", "ask for help or offer it", "a meeting about your work"],
          ["citizen", "speak to a public question", "a public meeting"],
          ["son", "honour my parents", "time with family"],
        ),
        checks: [...CHECKS, { id: "bearing", check: "How you will carry yourself and what you will wear or carry (the categories of position and having).", kind: "review" }],
        preview: "Say aloud what you mean to say, and picture the room",
      },
    ],
  };
}
