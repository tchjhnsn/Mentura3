// V20 Integrations: the marketplace for one business (doc "Business console integrations", 2026-11-24).
import { Marketplace } from "@/components/studio/integrations-search";
import { integrationsContext } from "./context";

export const dynamic = "force-dynamic";

export default async function IntegrationsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const ctx = await integrationsContext(slug);
  return <Marketplace slug={slug} name={ctx.name} profile={ctx.profile} connected={[...ctx.connected]} />;
}
