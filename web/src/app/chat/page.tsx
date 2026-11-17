import type { Metadata } from "next";
import { requireUser } from "@/server/session";
import { pendingChanges } from "@/server/actions/run";
import { Chat, type Waiting } from "./chat";
import { approvalCard } from "./spec";

export const metadata: Metadata = { title: "Ask" };
export const dynamic = "force-dynamic";

/** The plus button's chat (docs/design/REFLECT_UI_2026-11-12.md section 5), in shadcn's look with AI Elements. It is not saved to the journal yet. */
export default async function ChatPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireUser();
  // Changes held for the person's Keep or Send (Ask Reflect plan, step 3), most of all those their own AI asked for
  // over MCP, which have no chat to show them in: they wait at the top of Ask.
  const pending: Waiting[] = await pendingChanges({ userId: user.id })
    .then((list) => list.map((p) => ({ ...approvalCard({ change: p.id, title: p.title, preview: p.preview, tier: p.tier === "outside" ? "outside" : "shared" }), from: p.source === "mcp" ? "from your AI" : "from Ask" })))
    .catch((err: Error) => {
      console.error(`reflect: could not read held changes: ${err.message}`);
      return [];
    });
  const q = (await searchParams).q;
  // A page can hand the chat a question to ask (a quiz on a lecture, say); it shows as the first suggestion, sent only on a tap.
  const ask = (Array.isArray(q) ? q[0] : q)?.trim().slice(0, 500) || undefined;
  return <Chat ask={ask} pending={pending} />;
}
