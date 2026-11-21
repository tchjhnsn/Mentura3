import { redirect } from "next/navigation";

/** The old Chief of staff address; the AI chat (M3) is at /mentura/ai. */
export default async function OldAgent({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  redirect(q ? `/mentura/ai?q=${encodeURIComponent(q)}` : "/mentura/ai");
}
