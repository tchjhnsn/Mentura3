import { pendingChanges } from "@/server/actions/run";
import { Approval } from "@/app/chat/registry";
import { Section, type Ctx } from "../parts";

/**
 * What waits on the person (Ask Reflect plan, step 3; migration 0046): sends, plan steps and changes held for their
 * Keep or Send, asked for in Ask, by a plan or by their own AI over MCP. Each tap runs the held change exactly as the
 * card in Ask does (approveFromChat and declineFromChat, the person's own tap). Nothing shows when none wait.
 */
export async function ApprovalsCard({ ctx }: { ctx: Ctx }) {
  const list = await pendingChanges({ userId: ctx.userId }, 10).catch(() => []);
  if (!list.length) return null;
  return (
    <Section title="Waiting for you" href="/chat" more="New Chat">
      <div className="grid grid-cols-[minmax(0,1fr)] gap-2">
        {list.map((p) => (
          <Approval
            key={p.id}
            quiet
            change={p.id}
            title={p.title}
            preview={p.preview}
            tap={p.tier === "outside" ? "Send" : "Keep"}
            from={p.source === "mcp" ? "from your AI" : p.source === "workflow" ? "from a plan" : "from a chat"}
          />
        ))}
      </div>
    </Section>
  );
}
