// V15 Decisions: a real business's open decisions from Naive's docket, or the prototype's sample screen (sample.tsx).
import { isSample } from "@/components/studio/data";
import { RealDecisions } from "@/components/studio/real-business";
import Sample from "./sample";

export const dynamic = "force-dynamic";

export default async function Decisions({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return isSample(slug) ? <Sample params={params} /> : <RealDecisions id={decodeURIComponent(slug)} />;
}
