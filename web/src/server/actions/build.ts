// People to build with (doc "Events and connections design guide", 2026-11-18): on one of the person's ventures, the
// people who want to build, ranked by shared interests (@reflect/core/build); asking one of them to build it; and
// answering a request someone made of the person. The venture page and the Ventures tile run the same entries.
import { z } from "zod";
import { metLine, rankBuilders } from "@reflect/core/build";
import { answerBuildRequest, askToBuild, buildCandidates, buildStatuses, reopenBuildRequest, withdrawBuildRequest } from "../build-store";
import { action, idsIn } from "./types";
import { ventureOf } from "./ventures";

const ventureInput = z.object({ venture: z.string().uuid().describe("The venture's record id, from `life` with app 'ventures'") });

/** The people shown on one of the person's ventures, ranked, with where the person stands with each. */
export async function peopleToBuildWith(userId: string, venture: string) {
  const r = await ventureOf(userId, venture);
  const [{ interests, list }, status] = await Promise.all([buildCandidates(userId), buildStatuses(userId, r.id)]);
  return { venture: r, people: rankBuilders(userId, interests, list, status) };
}

export const peopleToBuildWithAction = action({
  id: "people_to_build_with",
  title: "People to build with",
  description: "The people who want to build something, for one of the person's ventures: from their connections and from people checked in at the same events, ranked by the interests they share with the person. Each with why they are shown, where they met, and whether the person asked them (requested) or they said yes. Empty until the person goes to an event or connects with someone who builds.",
  tier: "read",
  on: ["chat", "mcp"],
  input: ventureInput,
  run: async ({ userId }, { venture }) => {
    const { venture: r, people } = await peopleToBuildWith(userId, venture);
    return {
      venture: r.id,
      people: people.map((p) => ({ id: p.id, name: p.name, shared_interests: p.shared, why: p.why, met: p.met ? metLine(p.met) : null, status: p.status })),
      ...(people.length ? {} : { note: "No one yet. Going to an event (/events) is how the person meets people to build with." }),
    };
  },
});

export const askToBuildAction = action({
  id: "ask_to_build",
  title: "Ask to build",
  description: "Ask someone shown under people_to_build_with to build one of the person's ventures with them. They see the venture's name and what it sells, and answer Yes or Not now; on Yes the two can message. Only when the person asks. Undo takes the request back while it is unanswered.",
  tier: "own",
  on: ["chat", "mcp"],
  input: ventureInput.extend({ person: z.string().min(1).max(200).describe("The person's id, from people_to_build_with") }),
  run: async ({ userId }, { venture, person }) => {
    const { venture: r, people } = await peopleToBuildWith(userId, venture);
    const p = people.find((x) => x.id === person);
    if (!p) throw new Error("You can ask only someone shown under People to build with on this venture.");
    if (p.status !== "none") throw new Error(`You already asked ${p.name} to build this venture.`);
    const { id } = await askToBuild(userId, r.id, p.id);
    return { request: id, venture: r.id, to: p.name, status: "requested" as const };
  },
  change: (res) => ({ after: { request: res.request } }),
  undo: async ({ userId }, c) => {
    const [id] = idsIn(c.after, "request");
    if (!id || !(await withdrawBuildRequest(userId, id))) throw new Error("They answered already, so the request cannot be taken back.");
  },
});

export const answerBuildRequestAction = action({
  id: "answer_build_request",
  title: "Answer a request to build",
  description: "Answer a request someone made of the person to build one of their ventures: yes or no (Not now). Yes connects the two so they can message, and cannot be undone; Undo puts back only a Not now. Only the person's own answer, when they give it.",
  tier: "own",
  on: ["chat", "mcp"],
  input: z.object({ request: z.string().uuid().describe("The request's id"), answer: z.enum(["yes", "no"]) }),
  run: async ({ userId }, { request, answer }) => {
    const r = await answerBuildRequest(userId, request, answer === "yes");
    return { request: r.id, answer, ...(answer === "yes" ? { message_href: `/life/friends/messages/${encodeURIComponent(r.from)}` } : {}) };
  },
  change: (res) => ({ after: { request: res.request, answer: res.answer } }),
  undo: async ({ userId }, c) => {
    const a = c.after as { request?: unknown; answer?: unknown } | null;
    if (a?.answer !== "no" || typeof a.request !== "string") throw new Error("A yes cannot be undone; only a Not now can be put back.");
    if (!(await reopenBuildRequest(userId, a.request))) throw new Error("This answer cannot be put back.");
  },
});
