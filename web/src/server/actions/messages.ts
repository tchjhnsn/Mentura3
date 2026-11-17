// Messages between Reflect members as actions (Ask Reflect plan, step 10). Reading them is read tier, and only when
// the person asks about their messages. Sending reaches another person, so it is the outside tier: asked for from the
// chat or over MCP it waits for the person to tap Send on a card showing the recipient and the exact text; from the
// Friends tile's conversation page it is sent at once. A sent message cannot be taken back.
import { z } from "zod";
import { MESSAGE_MAX, cleanText, sendPreview } from "@reflect/core/messages";
import { contactFor, conversation, sendMessage, threadsOf, type Said, type Thread } from "../messages-store";
import { action } from "./types";

/** The person's conversations, or one conversation, with where each opens in Reflect. */
export type MessagesRead =
  | { kind: "threads"; threads: (Thread & { href: string })[] }
  | { kind: "conversation"; with: { name: string; via: string }; href: string; messages: Said[] };

export const hrefFor = (id: string) => `/life/friends/messages/${encodeURIComponent(id)}`;

export const messagesAction = action({
  id: "messages",
  title: "Read messages with Reflect members",
  description: "Read the person's messages with other Reflect members, only when the person asks about their messages. With no `with`, lists everyone they can message (members of their household and friends who accepted their invite) and the newest message with each; with `with` (a name), the recent messages with that person, oldest first. Messages are seen only by their two members: do not repeat them anywhere else, and never put words in the other person's mouth.",
  tier: "read",
  on: ["chat", "mcp"],
  input: z.object({
    with: z.string().max(200).optional().describe("The person's name, as they appear in Reflect"),
    limit: z.number().int().min(1).max(100).default(30),
  }),
  run: async ({ userId }, input): Promise<MessagesRead> => {
    if (!input.with?.trim()) return { kind: "threads", threads: (await threadsOf(userId)).map((t) => ({ ...t, href: hrefFor(t.id) })) };
    const c = await conversation(userId, input.with, input.limit);
    return { kind: "conversation", with: { name: c.with.name, via: c.with.via }, href: hrefFor(c.with.id), messages: c.messages };
  },
});

export const sendMessageAction = action({
  id: "send_message",
  title: "Send a message",
  description: `Send a message inside Reflect to someone the person can message (a member of their household, or a friend who accepted their invite), only with words the person asked to send. It waits for the person to tap Send on a card showing the recipient and the exact text. Once sent it can never be undone or taken back. Up to ${MESSAGE_MAX} characters.`,
  tier: "outside",
  on: ["chat", "mcp"],
  input: z.object({
    to: z.string().min(1).max(200).describe("The person's name, as they appear in Reflect"),
    text: z.string().min(1).max(MESSAGE_MAX).describe("The exact message, word for word"),
  }),
  // The recipient is found before anything is held, so a message to someone the person cannot message is refused.
  preview: async ({ userId }, { to, text }) => sendPreview((await contactFor(userId, to)).name, cleanText(text)),
  run: async ({ userId }, { to, text }) => {
    const r = await sendMessage(userId, to, text);
    return { to: r.to.name, text: r.message.text, at: r.message.at, href: hrefFor(r.to.id) };
  },
  change: (r) => ({ after: { to: r.to, at: r.at } }),
});
