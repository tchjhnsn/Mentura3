// The person's claims (in the chat) and their own ideas (over MCP).
import { z } from "zod";
import { STANCES as CLAIM_STANCES } from "@reflect/core/claims";
import { STANCES, type Stance, type Target } from "@reflect/core/ideas";
import { cleanProposal } from "@reflect/core/ask";
import { keepIdea, listIdeas, resolveByTitle } from "../ideas-store";
import { action } from "./types";
import { claimsOf } from "./loaded";

export const showClaims = action({
  id: "show_claims",
  title: "Show the person's claims",
  description: "Show the claims the person keeps, with their stance on each.",
  tier: "read",
  on: ["chat"],
  input: z.object({}),
  /** Null when claims are not set up here. */
  run: async (ctx) => claimsOf(ctx),
});

// Nothing is kept: the claim is shown for the person to accept or ignore, so it reads and changes nothing.
export const proposeClaim = action({
  id: "propose_claim",
  title: "Propose a claim for the person to keep",
  description: "Propose a claim for the person to keep, only when they stated it and their stance in this conversation. They accept or ignore it.",
  tier: "read",
  on: ["chat"],
  input: z.object({
    text: z.string().min(1).max(500),
    subject: z.string().max(120).optional(),
    holders: z.array(z.object({ name: z.string(), citation: z.string().optional() })).max(10).default([]),
    stance: z.enum(CLAIM_STANCES.map((s) => s.id) as [string, ...string[]]),
  }),
  /** The proposal as Reflect can keep it, or null when it cannot be proposed. */
  run: async (_ctx, input) => cleanProposal(input),
});

export const ideas = action({
  id: "ideas",
  title: "The person's own ideas",
  description: "Each idea in the person's latest words, what it came from (and maybe from), and recommendations placed from supports to opposes. Ideas are outputs; what the person took in is under learning.",
  tier: "read",
  on: ["mcp"],
  run: async ({ userId }) => (await listIdeas(userId)).map(({ labels, ...i }) => {
    const named = (t: Target) => ({ ...(t.ref ? { ref: t.ref, title: labels[t.ref] } : { text: t.text }), ...(t.url ? { url: t.url } : {}) });
    return { id: i.id, title: i.title, statement: i.statement, from: i.from.map((x) => ({ ...named(x), how: x.how })), maybe_from: i.maybe.map((x) => ({ ...named(x), how: x.how })), recommendations: i.related.map((r) => ({ ...named(r), stance: r.stance, by: r.by, note: r.note })) };
  }),
});

export const keepIdeaAction = action({
  id: "keep_idea",
  title: "Keep one of the person's ideas",
  description: `An idea of the person's own: a framing, thesis or hybrid ("X applied to Y"). Say it in their words. Name inputs by title (a book, film, talk, conversation or link they kept, matched by title, else kept as their words): from when the person says it fed the idea, maybe_from when they are not sure. Recommendations are things to study, not inputs, each with a stance: ${STANCES.map((x) => `${x.id} (${x.text})`).join(", ")}. A new line each time; the latest line about a thing decides where it stands. Send only what the person said yes to.`,
  tier: "own",
  on: ["mcp"],
  input: z.object({
    title: z.string().min(1).max(200),
    statement: z.string().optional().describe("required for a new idea; a restatement otherwise"),
    from: z.array(z.object({ title: z.string().min(1), how: z.string().optional() })).max(50).optional(),
    maybe_from: z.array(z.object({ title: z.string().min(1), how: z.string().optional() })).max(50).optional(),
    recommendations: z.array(z.object({ title: z.string().min(1), url: z.string().url().optional(), stance: z.enum(STANCES.map((x) => x.id) as [Stance, ...Stance[]]), by: z.string().min(1), note: z.string().optional() })).max(50).optional(),
  }),
  run: async ({ userId }, { title, statement, from, maybe_from, recommendations }) => {
    const t = async (x: { title: string; url?: string }) => ({ ...(await resolveByTitle(userId, x.title)), ...(x.url ? { url: x.url } : {}) });
    const id = await keepIdea(userId, title, {
      ...(statement ? { statement } : {}),
      from: await Promise.all((from ?? []).map(async (x) => ({ target: await t(x), ...(x.how ? { how: x.how } : {}) }))),
      maybe: await Promise.all((maybe_from ?? []).map(async (x) => ({ target: await t(x), ...(x.how ? { how: x.how } : {}) }))),
      related: await Promise.all((recommendations ?? []).map(async (r) => ({ target: await t(r), stance: r.stance, by: r.by, ...(r.note ? { note: r.note } : {}) }))),
    });
    return { idea_id: id };
  },
});
