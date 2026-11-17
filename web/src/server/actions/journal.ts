// The journal and the legacy release plan, as the person's own AI keeps them over MCP. Each tool* function is a
// plain function of the signed-in person, so the same calls are tested without HTTP (mcp-tools.test.ts).
import { z } from "zod";
import { acceptLocalDate, type Entry } from "@reflect/core/journal";
import type { IsoDate } from "@reflect/core/person";
import { closeEntry, createEntry, entryText, listEntries } from "../journal-store";
import { keepPlan, legacyStatus, type PlanInput } from "../legacy-store";
import { siteUrl } from "../site";
import { action } from "./types";

export const GUIDE = [
  "Reflect keeps a person's journal, what they learn, their own ideas, their calendar and the plan for what survives them. You help them write and keep things; you never decide for them.",
  "",
  "Rules: save only what the person asked you to save, in their words. Never infer facts about the person beyond what they wrote, and never share their entries.",
].join("\n");

const entryOut = (e: Entry) => ({ id: e.id, date: e.localDate, closed: e.closedAt !== null, text: e.parts.map((p) => p.text).join("\n\n") });

export async function toolListEntries(userId: string, limit: number) {
  return (await listEntries(userId, limit)).map(entryOut);
}

export async function toolWriteEntry(userId: string, entryTextIn: string, localDate: string, now = new Date()) {
  const body = entryTextIn.trim();
  if (!body) throw new Error("an entry needs words");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(localDate) || !acceptLocalDate(localDate as IsoDate, now)) throw new Error("the date must be the person's today (YYYY-MM-DD)");
  const id = await createEntry(userId, body, localDate as IsoDate, null);
  await closeEntry(userId, id);
  return { id };
}

export async function toolGetEntry(userId: string, entryId: string): Promise<{ id: string; text: string }> {
  const t = await entryText(userId, entryId);
  if (t === null) throw new Error("no such entry");
  return { id: entryId, text: t };
}

/** Keep the person's legacy release plan, as they stated it. Returns each trustee's link for the person to hand over. */
export async function toolKeepLegacyPlan(userId: string, plan: PlanInput) {
  const r = await keepPlan(userId, plan);
  return { trustees: r.trustees.map((t) => ({ name: t.name, link: `${siteUrl()}/legacy/trustee/${t.token}` })), gifts: r.gifts, see: `${siteUrl()}/legacy` };
}

export async function toolLegacyStatus(userId: string) {
  const s = await legacyStatus(userId);
  return { plan: s.plan, trustees: s.trustees.map((t) => ({ name: t.name, contact: t.contact })), gifts: s.gifts, release: s.release };
}

const legacySchema = z.object({
  confirmations: z.number().int().min(1).describe("how many trustees must confirm the death"),
  wait_days: z.number().int().min(0).max(365).describe("days after enough confirmations in which the person or any trustee can stop the release"),
  trustees: z.array(z.object({ name: z.string().min(1), contact: z.string().min(1) })).min(1),
  gifts: z.array(z.object({
    to: z.string().min(1),
    contact: z.string().min(1),
    items: z.array(z.object({ title: z.string().min(1), text: z.string() })).min(1).describe("only letters and writing the person made to survive them, word for word"),
  })),
});

export const reflectGuide = action({
  id: "reflect_guide",
  title: "How Reflect works",
  description: "What Reflect keeps and the rules for an AI working in it.",
  tier: "read",
  on: ["mcp"],
  run: async () => GUIDE,
});

export const listEntriesAction = action({
  id: "list_entries",
  title: "List journal entries",
  description: "The person's journal entries, newest first.",
  tier: "read",
  on: ["mcp"],
  input: z.object({ limit: z.number().int().min(1).max(200).default(20) }),
  run: async ({ userId }, { limit }) => toolListEntries(userId, limit),
});

export const writeEntry = action({
  id: "write_entry",
  title: "Write a journal entry",
  description: "Save an entry in the person's own words. Write only what they asked you to save, as they said it; never compose it for them.",
  tier: "own",
  on: ["mcp"],
  input: z.object({ text: z.string().min(1), local_date: z.string().describe("the person's today, YYYY-MM-DD") }),
  run: async ({ userId }, { text, local_date }) => toolWriteEntry(userId, text, local_date),
});

export const getEntry = action({
  id: "get_entry",
  title: "Read one entry",
  description: "One entry's text.",
  tier: "read",
  on: ["mcp"],
  input: z.object({ entry_id: z.string().uuid() }),
  run: async ({ userId }, { entry_id }) => toolGetEntry(userId, entry_id),
});

// What the plan gives reaches trustees and the people it names, outside Reflect, so it is an outside action.
export const keepLegacyPlan = action({
  id: "keep_legacy_plan",
  title: "Keep the person's legacy release plan",
  description: "Send the release plan the person wrote (in their vault, legacy/release.json and what it gives) to Reflect, which carries it out after their death: trustees confirm, a wait passes in which they or any trustee can stop it, then each person receives their part. Send only the legacy letters and entries marked to survive them, word for word, and only after the person says yes. A new plan replaces the old one and revokes its links. Give the person the trustee links it returns.",
  tier: "outside",
  on: ["mcp"],
  input: legacySchema,
  run: async ({ userId }, { confirmations, wait_days, trustees, gifts }) => toolKeepLegacyPlan(userId, { confirmations, waitDays: wait_days, trustees, gifts }),
});

export const legacyStatusAction = action({
  id: "legacy_status",
  title: "The legacy release plan and any release",
  description: "Who the trustees are, who receives something (not what), and whether a release is under way.",
  tier: "read",
  on: ["mcp"],
  run: async ({ userId }) => toolLegacyStatus(userId),
});
