// V14 Connectors moved to Integrations (V20, doc "Business console integrations", 2026-11-24).
import { redirect } from "next/navigation";
import { businessHref } from "@/components/studio/data";

export default async function ConnectorsPage({ params }: { params: Promise<{ team: string; slug: string }> }) {
  const { team, slug } = await params;
  redirect(businessHref(team, slug, "integrations"));
}
