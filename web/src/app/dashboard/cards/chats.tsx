import Link from "next/link";
import { dashboardFacts } from "@/server/dashboard";
import { Empty, Section, type Ctx } from "../parts";

/** Recent chats with Ask Reflect. */
export async function ChatsCard({ ctx }: { ctx: Ctx }) {
  const { chats } = await dashboardFacts(ctx.userId);
  return (
    <Section title="Recent chats" href="/chat/history" more="History">
      {chats.length ? (
        <ul className="grid grid-cols-[minmax(0,1fr)] gap-1">
          {chats.slice(0, 4).map((c) => (
            <li key={c.id}><Link href={`/chat/history/${c.id}`} className="hover:bg-accent block truncate rounded-lg px-2 py-1.5 text-sm">{c.title}</Link></li>
          ))}
        </ul>
      ) : <Empty>Ask Reflect anything above.</Empty>}
    </Section>
  );
}
