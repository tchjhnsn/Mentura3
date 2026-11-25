// V12 Function: a real business's briefing for the function and its activities (round 5, ./needs.tsx), then its tools
// from Naive's catalog; or the prototype's sample screen (sample.tsx).
import { notFound } from "next/navigation";
import { FUNCTIONS, isSample, type FunctionId } from "@/components/studio/data";
import { FunctionTools } from "@/components/studio/function-tools";
import { FunctionBrief } from "@/components/studio/needs";
import Sample from "./sample";

export const dynamic = "force-dynamic";

export default async function FunctionPage({ params }: { params: Promise<{ team: string; slug: string; fn: string }> }) {
  const { team, slug, fn } = await params;
  if (isSample(slug)) return <Sample params={params} />;
  if (!FUNCTIONS.some((f) => f.id === fn)) notFound();
  return (
    <FunctionTools slug={slug} fn={fn as FunctionId}>
      <FunctionBrief id={decodeURIComponent(slug)} team={decodeURIComponent(team)} fn={fn as FunctionId} />
    </FunctionTools>
  );
}
