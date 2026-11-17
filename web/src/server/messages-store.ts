// Messages between Reflect members (Ask Reflect plan, step 10): who the person can message, their conversations, and
// sending. A person messages only someone already connected to them (their household, or a friend who accepted an
// invite link), reads only their own conversations, and a sent message cannot be taken back. Messages reach a model
// only when the person asks Ask Reflect about them (the `messages` action). Rows are in ./messages-db.ts.
import { cleanText, findContact, type Contact, type Message } from "@reflect/core/messages";
import { postgresMessages } from "./messages-db";

export { acceptFriendInvite, createFriendInvite, friendInviteInfo } from "./messages-db";

/** Everyone the person can message, by name. */
export const contactsOf = (userId: string): Promise<Contact[]> => postgresMessages.contacts(userId);

/** The one person the person can message that `to` names (an id or a name); throws for anyone else. */
export async function contactFor(userId: string, to: string): Promise<Contact> {
  return findContact(await contactsOf(userId), to);
}

/** One conversation as its reader sees it: who sent each message, in words. */
export type Said = { id: string; from: string; you: boolean; text: string; at: string };
const said = (m: Message, userId: string, other: Contact): Said => ({ id: m.id, from: m.from === userId ? "You" : other.name, you: m.from === userId, text: m.text, at: m.at });

/** Each person the person can message, with the newest message between them, those with the latest message first. */
export type Thread = Contact & { last: Said | null };
export async function threadsOf(userId: string): Promise<Thread[]> {
  const [people, latest] = await Promise.all([contactsOf(userId), postgresMessages.latest(userId)]);
  const lastWith = new Map(latest.map((m) => [m.from === userId ? m.to : m.from, m]));
  const list = people.map((c): Thread => { const m = lastWith.get(c.id); return { ...c, last: m ? said(m, userId, c) : null }; });
  return list.sort((p, q) => (q.last?.at ?? "").localeCompare(p.last?.at ?? "") || p.name.localeCompare(q.name));
}

/** The person's conversation with one person they can message, oldest first. Nobody else's conversation is read. */
export async function conversation(userId: string, to: string, limit = 50): Promise<{ with: Contact; messages: Said[] }> {
  const other = await contactFor(userId, to);
  const list = await postgresMessages.between(userId, other.id, limit);
  return { with: other, messages: list.map((m) => said(m, userId, other)) };
}

/** Sends a message to someone the person can message. It cannot be taken back. */
export async function sendMessage(userId: string, to: string, raw: unknown): Promise<{ to: Contact; message: Said }> {
  const other = await contactFor(userId, to);
  const text = cleanText(raw);
  const m = await postgresMessages.insert({ from: userId, to: other.id, text });
  return { to: other, message: said(m, userId, other) };
}
