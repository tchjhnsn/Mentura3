"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/server/session";
import { fromPage } from "@/server/actions/page";
import { keepClaimAction, keepLibraryBook } from "@/server/actions/learn-page";
import { addItemAction } from "@/server/actions/learning";
import { undoChangeAction } from "@/server/actions/changes";

// A tap on a card in the chat runs the same registry entry the chat would (Ask Reflect plan, step 4), as the person's
// own act from the page, so it is in the change log too.

const parsed = (json: string, what: string): Record<string, unknown> => {
  let v: unknown;
  try {
    v = JSON.parse(String(json));
  } catch {
    throw new Error(`that ${what} could not be read`);
  }
  if (!v || typeof v !== "object") throw new Error(`that ${what} could not be read`);
  return v as Record<string, unknown>;
};

/** Add to my shelves, from a library card in the chat. The person tapped it; the entry is cleaned again. */
export async function addBookFromChat(entryJson: string): Promise<void> {
  const user = await requireUser();
  await fromPage(keepLibraryBook, user.id, { entry: parsed(entryJson, "library entry"), status: "want" });
  revalidatePath("/schole");
}

/** Accept, from a proposed claim in the chat. keepClaim checks the stance and cleans the text and holders. */
export async function keepClaimFromChat(claimJson: string): Promise<void> {
  const user = await requireUser();
  const c = parsed(claimJson, "claim");
  const holders = (Array.isArray(c.holders) ? c.holders : [])
    .map((h) => (h && typeof h === "object" ? (h as Record<string, unknown>) : {}))
    .filter((h) => typeof h.name === "string" && h.name)
    .map((h) => ({ name: String(h.name), ...(typeof h.citation === "string" ? { citation: h.citation } : {}) }));
  await fromPage(keepClaimAction, user.id, { text: String(c.text ?? ""), holders, stance: String(c.stance ?? ""), ...(typeof c.subject === "string" ? { subject: c.subject } : {}) });
  revalidatePath("/schole");
}

/** Add, from a found item in the chat: the find comes back from the page, so addItem checks it again. */
export async function addItemFromChat(itemJson: string): Promise<void> {
  const user = await requireUser();
  const f = parsed(itemJson, "item");
  const s = (k: string) => (typeof f[k] === "string" && f[k] ? (f[k] as string) : undefined);
  await fromPage(addItemAction, user.id, { medium: s("medium") ?? "", title: s("title") ?? "", ...(s("by") ? { by: s("by") } : {}), ...(s("url") ? { url: s("url") } : {}), ...(s("image") ? { image: s("image") } : {}), status: "want" });
  revalidatePath("/schole");
}

/** Undo, from the chip under a change the chat made. undoChange checks it is the person's own, own tier and under 30 days old. */
export async function undoFromChat(changeId: string): Promise<void> {
  const user = await requireUser();
  await fromPage(undoChangeAction, user.id, { change_id: String(changeId) });
  revalidatePath("/", "layout");
}
