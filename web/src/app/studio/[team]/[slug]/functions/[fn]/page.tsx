// V12 Function: a real business's function tools from Naive's catalog, or the prototype's sample screen (sample.tsx).
import { notFound } from "next/navigation";
import { FUNCTIONS, isSample, type FunctionId } from "@/components/studio/data";
import { FunctionTools } from "@/components/studio/function-tools";
import Sample from "./sample";

export default async function FunctionPage({ params }: { params: Promise<{ slug: string; fn: string }> }) {
  const { slug, fn } = await params;
  if (isSample(slug)) return <Sample params={params} />;
  if (!FUNCTIONS.some((f) => f.id === fn)) notFound();
  return <FunctionTools slug={slug} fn={fn as FunctionId} />;
}
