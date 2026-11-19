// The journal and the legacy release plan, as the person's own AI keeps them over MCP. Each tool* function is a
// plain function of the signed-in person, so the same calls are tested without HTTP (mcp-tools.test.ts).
// The journal's entries are declared in the core (@reflect/core/vault-actions), which a vault's CLI and MCP server
// run too; here they get the app's zod inputs and its Postgres journal.
import { z } from "zod";
import { GET_ENTRY, getEntryIn, GUIDE, LIST_ENTRIES, listEntriesIn, REFLECT_GUIDE, WRITE_ENTRY, writeEntryIn } from "@reflect/core/vault-actions";
import { closeEntry, createEntry, entryText, listEntries } from "../journal-store";
import { keepPlan, legacyStatus, type PlanInput } from "../legacy-store";
import { siteUrl } from "../site";
import { action } from "./types";

export { GUIDE };

export async function toolListEntries(userId: string, limit: number) {
  return listEntriesIn({ listEntries: (n) => listEntries(userId, n) }, limit);
}

export async function toolWriteEntry(userId: string, entryTextIn: string, localDate: string, now = new Date()) {
  return writeEntryIn({ createEntry: (t, d, p) => createEntry(userId, t, d, p), closeEntry: (id) => closeEntry(userId, id) }, entryTextIn, localDate, now);
}

export async function toolGetEntry(userId: string, entryId: string): Promise<{ id: string; text: string }> {
  return getEntryIn({ entryText: (id) => entryText(userId, id) }, entryId);
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
  ...REFLECT_GUIDE,
  run: async () => GUIDE,
});

export const listEntriesAction = action({
  ...LIST_ENTRIES,
  input: z.object({ limit: z.number().int().min(1).max(200).default(20) }),
  run: async ({ userId }, { limit }) => toolListEntries(userId, limit),
});

export const writeEntry = action({
  ...WRITE_ENTRY,
  input: z.object({ text: z.string().min(1), local_date: z.string().describe("the person's today, YYYY-MM-DD") }),
  run: async ({ userId }, { text, local_date }) => toolWriteEntry(userId, text, local_date),
});

export const getEntry = action({
  ...GET_ENTRY,
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
  preview: (_ctx, { confirmations, wait_days, trustees, gifts }) => [
    "Keep your legacy release plan. It replaces the plan you kept before and that plan's trustee links stop working.",
    `Trustees: ${trustees.map((t) => `${t.name} (${t.contact})`).join("; ")}. After your death, ${confirmations} of them must confirm it; then ${wait_days} ${wait_days === 1 ? "day passes" : "days pass"} in which you or any trustee can stop the release.`,
    ...(gifts.length ? gifts.flatMap((g) => [`${g.to} (${g.contact}) receives:`, ...g.items.map((i) => `${i.title}: ${i.text}`)]) : ["No one receives anything yet."]),
  ].join("\n"),
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
