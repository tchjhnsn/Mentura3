import type { Metadata } from "next";
import { requireUser } from "@/server/session";
import { Chat } from "./chat";

export const metadata: Metadata = { title: "Ask" };
export const dynamic = "force-dynamic";

/** The plus button's chat (docs/design/REFLECT_UI_2026-11-12.md section 5), in shadcn's look with AI Elements. It is not saved to the journal yet. */
export default async function ChatPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireUser();
  const q = (await searchParams).q;
  // A page can hand the chat a question to ask (a quiz on a lecture, say); it shows as the first suggestion, sent only on a tap.
  const ask = (Array.isArray(q) ? q[0] : q)?.trim().slice(0, 500) || undefined;
  return <Chat ask={ask} />;
}
