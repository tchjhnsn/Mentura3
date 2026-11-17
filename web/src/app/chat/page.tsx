import type { Metadata } from "next";
import { requireUser } from "@/server/session";
import { pendingChanges } from "@/server/actions/run";
import { plansAction } from "@/server/actions/workflows";
import { Chat, type Waiting } from "./chat";
import { approvalCard, planCard } from "./spec";

export const metadata: Metadata = { title: "Ask" };
export const dynamic = "force-dynamic";

/** The plus button's chat (docs/design/REFLECT_UI_2026-11-12.md section 5), in shadcn's look with AI Elements. It is not saved to the journal yet. */
export default async function ChatPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireUser();
  // Changes held for the person's Keep or Send (Ask Reflect plan, step 3), most of all those their own AI asked for
  // over MCP, which have no chat to show them in: they wait at the top of Ask.
  const pending: Waiting[] = await pendingChanges({ userId: user.id })
    .then((list) => list.map((p) => ({ ...approvalCard({ change: p.id, title: p.title, preview: p.preview, tier: p.tier === "outside" ? "outside" : "shared" }), from: p.source === "mcp" ? "from your AI" : p.source === "workflow" ? "from a plan" : "from Ask" })))
    .catch((err: Error) => {
      console.error(`reflect: could not read held changes: ${err.message}`);
      return [];
    });
  // Plans running or waiting for a tap (step 9), read from the store, so a reload shows how far each got.
  const plans = await plansAction
    .run({ userId: user.id }, { limit: 5 })
    .then((list) => list.map(planCard))
    .catch((err: Error) => {
      console.error(`reflect: could not read plans: ${err.message}`);
      return [];
    });
  const q = (await searchParams).q;
  // A page can hand the chat a question to ask (a quiz on a lecture, say); it shows as the first suggestion, sent only on a tap.
  const ask = (Array.isArray(q) ? q[0] : q)?.trim().slice(0, 500) || undefined;
  return <Chat ask={ask} pending={pending} plans={plans} />;
}
