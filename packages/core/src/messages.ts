// Messages between Reflect members (Ask Reflect plan, step 10). A person messages only people already connected to
// them in Reflect: members of their household with their own login, and friends who accepted their invite link. A
// message is seen only by its two members, and once sent it cannot be taken back. Pure rules and words only.

/** The longest message, in characters. */
export const MESSAGE_MAX = 2000;

/** How a person is connected to someone they can message. */
export type Via = "household" | "friend";

/** Someone the person can message. */
export type Contact = { id: string; name: string; via: Via };

/** One message as its reader sees it. */
export type Message = { id: string; from: string; to: string; text: string; at: string };

/** The two members of a conversation in one order, so both find the same thread (and the same sealing key). */
export function pairOf(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

/** A message's text as it will be sent: trimmed, not empty, and no longer than MESSAGE_MAX. */
export function cleanText(raw: unknown): string {
  const text = typeof raw === "string" ? raw.replace(/\r\n?/g, "\n").trim() : "";
  if (!text) throw new Error("Write the message first.");
  if (text.length > MESSAGE_MAX) throw new Error(`A message holds up to ${MESSAGE_MAX} characters; this one has ${text.length}.`);
  return text;
}

/** What a send will do, word for word, as the Send card shows it. */
export const sendPreview = (name: string, text: string) => `To ${name}: ${text}`;

export const NOT_CONNECTED = "You can message only people connected to you in Reflect: members of your household, and friends who accepted your invite.";

/**
 * The one contact `to` names: their id, or their name (any case; a unique first word or start of the name will do).
 * Throws when it names no one the person can message, or more than one.
 */
export function findContact(list: readonly Contact[], to: string): Contact {
  const want = to.trim().toLowerCase();
  if (!want) throw new Error("Say who the message is to.");
  const byId = list.find((c) => c.id === to.trim());
  if (byId) return byId;
  const exact = list.filter((c) => c.name.toLowerCase() === want);
  const found = exact.length ? exact : list.filter((c) => c.name.toLowerCase().startsWith(want) || c.name.toLowerCase().split(/\s+/).includes(want));
  if (found.length === 1) return found[0]!;
  if (found.length > 1) throw new Error(`More than one person you can message is called ${to.trim()}: ${found.map((c) => c.name).join(", ")}. Say which.`);
  throw new Error(`${to.trim()} is not someone you can message. ${NOT_CONNECTED}`);
}
