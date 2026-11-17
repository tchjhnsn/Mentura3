// The journal's works and the book of beliefs as actions (Ask Reflect plan, step 4): start a work, save it, file it,
// and turn passages into beliefs or claims. The journal is never published; every word is the person's own, so these
// save only what the person wrote or dictated. /journal runs these same entries, so its changes are in the change log.
import { z } from "zod";
import { DOMAINS } from "@reflect/core/book";
import { createWork, fileWork, getWork, saveWork } from "../work-store";
import { placeSubject } from "../subject-domain-store";
import { beliefFromWork, claimFromWork, compileEdition, markBelief, placeClaim } from "../book-store";
import { action } from "./types";

const domain = z.enum(DOMAINS.map((d) => d.id) as [string, ...string[]]);
const domains = DOMAINS.map((d) => d.id).join(", ");
const marking = z.object({
  kind: z.string().max(40).describe("ideal or practical"),
  serves: z.union([z.object({ id: z.string().max(60) }), z.object({ text: z.string().max(400) })]).nullable().optional().describe("For a practical belief, the ideal it serves"),
  circumstances: z.string().max(1000).nullable().optional(),
  origins: z.array(z.string().max(60)).max(20).readonly().optional(),
});
const holders = z.array(z.object({ name: z.string().max(200), citation: z.string().max(300).optional() })).max(20);

export const startWork = action({
  id: "start_work",
  title: "Start a journal work",
  description: `Start a new work in the person's journal from a template of the prompt library ('blank' for none), about a thing when named, filed in a part of life (${domains}) when given. Returns its id; the person writes it in /journal/w/<id>. Never write it for them.`,
  tier: "own",
  on: ["chat", "mcp"],
  input: z.object({ template: z.string().max(80).default("blank"), about: z.string().max(200).nullable().default(null), domain: domain.nullable().default(null) }),
  run: async ({ userId }, { template, about, domain }) => {
    const id = await createWork(userId, template, about, domain);
    return { id, href: `/journal/w/${id}` };
  },
  change: (r) => ({ after: r }),
});

export const saveWorkAction = action({
  id: "save_work",
  title: "Save a journal work",
  description: "Save a work of the person's journal (by id) with its title and text, only as the person wrote or dictated it; never compose it. Every version is kept; Undo saves the one before.",
  tier: "own",
  on: ["chat", "mcp"],
  input: z.object({ id: z.string().max(60), title: z.string().max(300), body: z.string().max(400_000) }),
  run: async ({ userId }, { id, title, body }) => ({ id, ...(await saveWork(userId, id, title, body)) }),
  before: async ({ userId }, { id }) => {
    const w = await getWork(userId, id);
    return w ? { id, title: w.title, body: w.body } : null;
  },
  // The change log is sealed with the person's key (../action-change-store.ts), so it can keep the version before.
  change: (r, _i, before) => ({ before, after: { id: r.id, saved: r.saved } }),
  undo: async ({ userId }, c) => {
    const b = c.before as { id?: unknown; title?: unknown; body?: unknown } | null;
    if (typeof b?.id !== "string") throw new Error("This change cannot be undone.");
    await saveWork(userId, b.id, b.title, b.body);
  },
});

export const fileWorkAction = action({
  id: "file_work",
  title: "File a journal work in a part of life",
  description: `File a work of the person's journal (by id) in a part of life (${domains}), or in none (null).`,
  tier: "own",
  on: ["chat", "mcp"],
  input: z.object({ id: z.string().max(60), domain: domain.nullable() }),
  run: async ({ userId }, { id, domain }) => {
    await fileWork(userId, id, domain);
    return { id, domain };
  },
  before: async ({ userId }, { id }) => ({ id, domain: (await getWork(userId, id))?.domain ?? null }),
  change: (r, _i, before) => ({ before, after: r }),
  undo: async ({ userId }, c) => {
    const b = c.before as { id?: unknown; domain?: unknown } | null;
    if (typeof b?.id !== "string") throw new Error("This change cannot be undone.");
    await fileWork(userId, b.id, typeof b.domain === "string" ? b.domain : null);
  },
});

export const beliefFromWorkAction = action({
  id: "belief_from_work",
  title: "Keep a passage of a work as a belief",
  description: `Keep a passage the person selected in a work of their journal as a belief in their book: an ideal or a practical belief, in a part of life (${domains}), with its origins and holders. Only the person's words and marking.`,
  tier: "own",
  on: ["chat", "mcp"],
  input: z.object({ work_id: z.string().max(60), passage: z.string().min(1).max(4000), domain, marking: marking.extend({ holders: holders.optional() }) }),
  run: async ({ userId }, { work_id, passage, domain, marking }) => ({ claim_id: await beliefFromWork(userId, work_id, passage, domain, marking) }),
  change: (r) => ({ after: r }),
});

export const sendToLearnAction = action({
  id: "send_to_learn",
  title: "Send a passage of a work to Learn as a claim",
  description: "Send a passage the person selected in a work of their journal to Learn as a claim under a subject, with their stance.",
  tier: "own",
  on: ["chat", "mcp"],
  input: z.object({ work_id: z.string().max(60), passage: z.string().min(1).max(4000), subject: z.string().max(200), stance: z.string().max(40) }),
  run: async ({ userId }, { work_id, passage, subject, stance }) => ({ claim_id: await claimFromWork(userId, work_id, passage, subject, stance) }),
  change: (r) => ({ after: r }),
});

export const markBeliefAction = action({
  id: "mark_belief",
  title: "Mark a belief ideal or practical",
  description: "Mark a belief the person keeps (by its claim id) an ideal or a practical belief, with what it serves, its circumstances and origins, as the person says.",
  tier: "own",
  on: ["chat", "mcp"],
  input: z.object({ claim_id: z.string().max(60), marking }),
  run: async ({ userId }, { claim_id, marking }) => {
    await markBelief(userId, claim_id, marking);
    return { claim_id };
  },
  change: (r) => ({ after: r }),
});

export const placeSubjectAction = action({
  id: "place_subject",
  title: "Place a Learn subject in a part of life",
  description: `Place one of the person's Learn subjects (by id) in a part of life (${domains}), or take it out of every one (null).`,
  tier: "own",
  on: ["chat", "mcp"],
  input: z.object({ subject_id: z.string().max(60), domain: domain.nullable() }),
  run: async ({ userId }, { subject_id, domain }) => {
    await placeSubject(userId, subject_id, domain);
    return { subject_id, domain };
  },
  change: (r) => ({ after: r }),
});

export const placeBeliefAction = action({
  id: "place_belief",
  title: "Place a belief in a chapter of the book",
  description: `Place a belief the person keeps (by its claim id) in a chapter of their book, a part of life (${domains}).`,
  tier: "own",
  on: ["chat", "mcp"],
  input: z.object({ claim_id: z.string().max(60), domain }),
  run: async ({ userId }, { claim_id, domain }) => {
    await placeClaim(userId, claim_id, domain);
    return { claim_id, domain };
  },
  change: (r) => ({ after: r }),
});

export const compileEditionAction = action({
  id: "compile_edition",
  title: "Keep the book as an edition",
  description: "Keep the person's book of beliefs as it stands as a dated edition in their journal. Never published.",
  tier: "own",
  on: ["chat", "mcp"],
  input: z.object({}),
  run: async ({ userId }) => {
    const id = await compileEdition(userId);
    return { id, href: `/journal/w/${id}` };
  },
  change: (r) => ({ after: r }),
});
