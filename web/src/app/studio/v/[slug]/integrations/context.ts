// What every Integrations screen reads on the server: the signed-in person's connections (Reflect's marketplace
// sign-ins, web/src/server/mcp-connections.ts) and the functions this business has, for recommendations.
import { ventureDetail } from "@/app/studio/actions";
import { realBusiness } from "@/components/studio/business-data";
import { fnsAt } from "@/components/studio/connect-data";
import { isSample, ventureOf, type FunctionId } from "@/components/studio/data";
import { connectionsOf, type Connection } from "@/server/mcp-connections";
import { requireUser } from "@/server/session";

export type IntegrationsContext = { connections: Connection[]; connected: Set<string>; functions: FunctionId[]; name: string };

export async function integrationsContext(slug: string): Promise<IntegrationsContext> {
  const user = await requireUser();
  const sample = isSample(slug);
  const [connections, detail] = await Promise.all([connectionsOf(user.id), sample ? null : ventureDetail(decodeURIComponent(slug))]);
  const real = detail?.ok ? realBusiness(detail.value) : null;
  const functions = sample ? fnsAt(ventureOf(slug).commitment) : real?.functions ?? [];
  const name = sample ? ventureOf(slug).name : real?.name ?? decodeURIComponent(slug);
  return { connections, connected: new Set(connections.filter((c) => c.status === "connected").map((c) => c.connector)), functions, name };
}
