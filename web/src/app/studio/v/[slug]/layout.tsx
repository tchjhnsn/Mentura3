import type { ReactNode } from "react";
import { StudioFrame } from "@/components/studio/shell";
import { AgentChat } from "@/components/studio/agent-chat";

/** Screens inside one venture (V1 to V16): the venture nav (C4) and the agent chat panel (C5). */
export default async function VenturePages({ children, params }: { children: ReactNode; params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <StudioFrame chat={<AgentChat slug={slug} />}>{children}</StudioFrame>;
}
