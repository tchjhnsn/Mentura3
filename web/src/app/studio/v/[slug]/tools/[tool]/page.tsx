"use client";

// A universal tool with no screen of its own yet (Tasks, People, Calendar, Records), from Naive's catalog.
import { use } from "react";
import { notFound } from "next/navigation";
import { ToolPage } from "@/components/studio/tool-page";
import { toolOf } from "@/components/studio/tools";

export default function UniversalToolPage({ params }: { params: Promise<{ tool: string }> }) {
  const tool = toolOf(use(params).tool);
  if (!tool || tool.function !== null) notFound();
  return <ToolPage tool={tool} />;
}
