"use server";

import { revalidatePath } from "next/cache";
import { cleanEntry } from "@reflect/core/openlibrary";
import { requireUser } from "@/server/session";
import { addBook } from "@/server/learn-store";
import { keepClaim } from "@/server/claims-store";
import { addItem } from "@/server/ways-store";
import { approveChange, declineChange, undoChange } from "@/server/actions/run";

/** Add to my shelves, from a library card in the chat. The person tapped it; the entry is cleaned again. */
export async function addBookFromChat(entryJson: string): Promise<void> {
  const user = await requireUser();
  let raw: unknown;
  try {
    raw = JSON.parse(String(entryJson));
  } catch {
    throw new Error("that library entry could not be read");
  }
  const clean = cleanEntry(raw);
  if (!clean) throw new Error("that library entry has no title");
  await addBook(user.id, { title: clean.title, authors: clean.authors, ...(clean.isbn ? { isbn: clean.isbn } : {}), status: "want", subjects: [], catalog: clean });
  revalidatePath("/schole");
}

/** Accept, from a proposed claim in the chat. keepClaim checks the stance and cleans the text and holders. */
export async function keepClaimFromChat(claimJson: string): Promise<void> {
  const user = await requireUser();
  let c: { text?: unknown; holders?: unknown; stance?: unknown; subject?: unknown };
  try {
    c = JSON.parse(String(claimJson)) as typeof c;
  } catch {
    throw new Error("that claim could not be read");
  }
  const holders = (Array.isArray(c.holders) ? c.holders : [])
    .map((h) => (h && typeof h === "object" ? (h as Record<string, unknown>) : {}))
    .filter((h) => typeof h.name === "string")
    .map((h) => ({ name: String(h.name), ...(typeof h.citation === "string" ? { citation: h.citation } : {}) }));
  await keepClaim(user.id, { text: String(c.text ?? ""), holders, stance: String(c.stance ?? ""), ...(typeof c.subject === "string" ? { subject: c.subject } : {}) });
  revalidatePath("/schole");
}

/** Add, from a found item in the chat: the find comes back from the page, so addItem checks it again. */
export async function addItemFromChat(itemJson: string): Promise<void> {
  const user = await requireUser();
  let f: Record<string, unknown>;
  try {
    f = JSON.parse(String(itemJson)) as Record<string, unknown>;
  } catch {
    throw new Error("that item could not be read");
  }
  const s = (k: string) => (typeof f[k] === "string" ? (f[k] as string) : undefined);
  await addItem(user.id, { medium: s("medium") ?? "", title: s("title") ?? "", ...(s("by") ? { by: s("by") } : {}), ...(s("url") ? { url: s("url") } : {}), ...(s("image") ? { image: s("image") } : {}), status: "want" });
  revalidatePath("/schole");
}

/** Undo, from the chip under a change the chat made. undoChange checks it is the person's own, own tier and under 30 days old. */
export async function undoFromChat(changeId: string): Promise<void> {
  const user = await requireUser();
  await undoChange({ userId: user.id }, String(changeId));
  revalidatePath("/", "layout");
}

/** Keep or Send, from an Approval card: runs the held change as this person. approveChange checks it is theirs, still held and under 7 days old, and runs it once. */
export async function approveFromChat(changeId: string): Promise<void> {
  const user = await requireUser();
  await approveChange({ userId: user.id }, String(changeId));
  revalidatePath("/", "layout");
}

/** Decline, from an Approval card: the held change never runs. */
export async function declineFromChat(changeId: string): Promise<void> {
  const user = await requireUser();
  await declineChange({ userId: user.id }, String(changeId));
  revalidatePath("/chat");
}
