// V1 Home: a real business's from Naive, or the prototype's sample screen (sample.tsx).
import { isSample } from "@/components/studio/data";
import { RealHome } from "@/components/studio/real-business";
import Sample from "./sample";

export const dynamic = "force-dynamic";

export default async function Home({ params }: { params: Promise<{ team: string; slug: string }> }) {
  const { team, slug } = await params;
  return isSample(slug) ? <Sample params={params} /> : <RealHome id={decodeURIComponent(slug)} team={decodeURIComponent(team)} />;
}
