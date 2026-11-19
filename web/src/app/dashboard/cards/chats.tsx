import Link from "next/link";
import { CHAT_PROMPT, readChatPart } from "@reflect/core/chat-journal";
import { listEntries } from "@/server/journal-store";
import { distinctChats } from "../lists";
import { Empty, safe, Section, type Ctx } from "../parts";

/** Recent chats with Ask Reflect: four with different titles, so a question asked twice shows once. */
export async function ChatsCard({ ctx }: { ctx: Ctx }) {
  const entries = await safe(listEntries(ctx.userId, 60), []);
  const all = entries.filter((e) => e.promptId === CHAT_PROMPT).map((c) => ({ id: c.id, title: c.parts.map((p) => readChatPart(p.text)).find((m) => m.who === "you")?.text ?? "A chat" }));
  const chats = distinctChats(all, 4);
  return (
    <Section title="Recent chats" href="/chat/history" more="History">
      {chats.length ? (
        <ul className="grid grid-cols-[minmax(0,1fr)] gap-1">
          {chats.map((c) => (
            <li key={c.id}><Link href={`/chat/history/${c.id}`} className="hover:bg-accent block truncate rounded-lg px-2 py-1.5 text-sm">{c.title}</Link></li>
          ))}
        </ul>
      ) : <Empty>Start a new chat above.</Empty>}
    </Section>
  );
}
