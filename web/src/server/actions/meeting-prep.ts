// Meeting prep (design guide "Meeting prep", 2026-11-19): the host's private prep for a meeting they host, read and
// kept whole. Key points, questions with the host's answers (each marked once rehearsed), assets with presenter notes,
// facts about the other person (each with its source link; an unsourced fact is never kept) and the checklist. The
// prep page (web/src/app/meetings/[id]/prep/actions.ts) runs set_meeting_prep for every change, so each is in the
// change log and can be undone. Only the host ever reads or changes it.
import { z } from "zod";
import { rehearsedCount, type MeetingPrep } from "@reflect/core/meetings";
import { prepOf, setPrep } from "../meetings-store";
import { action } from "./types";

const meetingId = z.string().uuid().describe("The meeting's id");
const itemId = z.string().min(1).max(64);
const https = z.string().max(2000).regex(/^https:\/\/\S+$/, "Give an https:// link");

/** A prep as the model writes it whole: every part is replaced, so read it first with meeting_prep. */
export const prepInput = z.object({
  keyPoints: z.array(z.string().trim().min(1).max(500)).max(10).describe("The three to five points the host must make, in order"),
  questions: z.array(z.object({ id: itemId, question: z.string().trim().min(1).max(1000), answer: z.string().max(4000), rehearsed: z.boolean() })).max(100)
    .describe("Questions and objections the host expects, each with the host's answer and whether it is rehearsed"),
  assets: z.array(z.object({ id: itemId, name: z.string().trim().min(1).max(200), url: https.nullable(), notes: z.string().max(4000) })).max(30)
    .describe("Things the host will show (deck, one-pager, use of funds, demo), each with an optional https link and presenter notes"),
  about: z.array(z.object({ id: itemId, fact: z.string().trim().min(1).max(1000), source: https })).max(50)
    .describe("Facts about the other person, each with the https link it comes from. Never add a fact without a real source"),
  checklist: z.array(z.object({ id: itemId, text: z.string().trim().min(1).max(200), done: z.boolean() })).max(30).describe("The prep checklist"),
});

const brief = (id: string, prep: MeetingPrep) => {
  const { done, of } = rehearsedCount(prep);
  return { id, prep, rehearsed: `${done} of ${of} rehearsed`, href: `/meetings/${id}/prep` };
};

export const meetingPrepAction = action({
  id: "meeting_prep",
  title: "Read the prep of a meeting you host",
  description: "The host's private prep for a meeting they host: key points, questions and objections with their answers and which are rehearsed, assets with links and presenter notes, sourced facts about the other person, and the checklist. Only for a meeting the person hosts.",
  tier: "read",
  on: ["chat", "mcp"],
  input: z.object({ id: meetingId }),
  run: async ({ userId }, { id }) => brief(id, await prepOf(userId, id)),
});

export const setMeetingPrepAction = action({
  id: "set_meeting_prep",
  title: "Keep the prep of a meeting you host",
  description: "Replace the whole prep of a meeting the person hosts (read it first with meeting_prep and change only what they ask). Keep their own words; never add a fact about the other person without a real https source; never mark a question rehearsed unless they say so. Only when they ask.",
  tier: "own",
  on: ["chat", "mcp"],
  input: z.object({ id: meetingId, prep: prepInput }),
  run: async ({ userId }, { id, prep }) => {
    const { before, after } = await setPrep(userId, id, prep);
    return { ...brief(id, after), before };
  },
  change: (res) => ({ before: { id: res.id, prep: res.before }, after: { id: res.id, prep: res.prep } }),
  undo: async ({ userId }, c) => {
    const b = c.before as { id?: unknown; prep?: unknown } | null;
    if (typeof b?.id !== "string" || !b.prep || typeof b.prep !== "object") throw new Error("This change cannot be undone.");
    await setPrep(userId, b.id, b.prep);
  },
});
