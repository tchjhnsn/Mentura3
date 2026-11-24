// V14 Connectors moved to Integrations (V20, doc "Business console integrations", 2026-11-24).
import { redirect } from "next/navigation";
import { ventureHref } from "@/components/studio/data";

export default async function ConnectorsPage({ params }: { params: Promise<{ slug: string }> }) {
  redirect(ventureHref((await params).slug, "integrations"));
}
