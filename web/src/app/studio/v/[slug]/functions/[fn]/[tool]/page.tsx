"use client";

// One tool of one function, under the function so the sidebar stays at that function (C5). A tool that already has a
// screen shows it; the rest show the tool's page from Naive's catalog.
import { use, useMemo } from "react";
import { notFound } from "next/navigation";
import { ToolPage } from "@/components/studio/tool-page";
import { toolOf } from "@/components/studio/tools";
import OutreachPage from "../../../outreach/page";
import StrategyPage from "../../../strategy/page";
import DeckPage from "../../../decks/[id]/page";

export default function FunctionToolPage({ params }: { params: Promise<{ slug: string; fn: string; tool: string }> }) {
  const { slug, fn, tool: id } = use(params);
  // The screens read their params with use(), so each gets one settled promise, not a new one every render.
  const venture = useMemo(() => Promise.resolve({ slug }), [slug]);
  const deck = useMemo(() => Promise.resolve({ slug, id: "investor" }), [slug]);
  const tool = toolOf(id);
  if (!tool || tool.function !== fn) notFound();
  if (id === "outreach") return <OutreachPage params={venture} />;
  if (id === "vision-and-goals") return <StrategyPage params={venture} />;
  if (id === "raise") return <DeckPage params={deck} />;
  return <ToolPage tool={tool} />;
}
