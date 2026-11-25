// V2 Files: a real business's own storage, or the prototype's sample screen (sample.tsx).
import { isSample } from "@/components/studio/data";
import { RealFiles } from "@/components/studio/real-files";
import Sample from "./sample";

export default async function Files({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return isSample(slug) ? <Sample params={params} /> : <RealFiles id={decodeURIComponent(slug)} />;
}
