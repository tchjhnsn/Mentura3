// What every Integrations screen reads on the server: the signed-in person's connections (Reflect's marketplace
// sign-ins, web/src/server/mcp-connections.ts) and the functions this business has, for recommendations.
import { ventureDetail } from "@/app/studio/actions";
import { realBusiness } from "@/components/studio/business-data";
import { fnsAt } from "@/components/studio/connect-data";
import { isSample, ventureOf, type FunctionId } from "@/components/studio/data";
import { usableBy } from "@/components/studio/integrations";
import { connectionsOf, type Connection } from "@/server/mcp-connections";
import { requireUser } from "@/server/session";

/** `connected`: catalog ids connected and open to this business. `elsewhere`: connected, but kept to other businesses. */
export type IntegrationsContext = { id: string; connections: Connection[]; connected: Set<string>; elsewhere: Set<string>; functions: FunctionId[]; name: string };

export { usableBy };

export async function integrationsContext(slug: string): Promise<IntegrationsContext> {
  const user = await requireUser();
  const sample = isSample(slug);
  const [connections, detail] = await Promise.all([connectionsOf(user.id), sample ? null : ventureDetail(decodeURIComponent(slug))]);
  const real = detail?.ok ? realBusiness(detail.value) : null;
  const functions = sample ? fnsAt(ventureOf(slug).commitment) : real?.functions ?? [];
  const name = sample ? ventureOf(slug).name : real?.name ?? decodeURIComponent(slug);
  const id = decodeURIComponent(slug);
  const live = connections.filter((c) => c.status === "connected");
  return {
    id, connections, functions, name,
    connected: new Set(live.filter((c) => usableBy(c, id)).map((c) => c.connector)),
    elsewhere: new Set(live.filter((c) => !usableBy(c, id)).map((c) => c.connector)),
  };
}
