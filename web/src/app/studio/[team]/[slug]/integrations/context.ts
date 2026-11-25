// What every Integrations screen reads on the server: the signed-in person's connections (Reflect's marketplace
// sign-ins, web/src/server/mcp-connections.ts), the functions this business has, and its phase, industry, regulation
// and funding, for recommendations.
import { ventureDetail } from "@/app/studio/actions";
import { realBusiness } from "@/components/studio/business-data";
import { fnsAt } from "@/components/studio/connect-data";
import { isSample, ventureOf, type FunctionId } from "@/components/studio/data";
import { usableBy } from "@/components/studio/integrations";
import { profileOf, SAMPLE_PROFILES, type Profile } from "@/components/studio/recommend";
import { connectionsOf, type Connection } from "@/server/mcp-connections";
import { naive, studioUnavailable } from "@/server/naive";
import type { SourceMap } from "@/components/studio/integrations-sources";
import { requireUser } from "@/server/session";

/** `connected`: catalog ids connected and open to this business. `elsewhere`: connected, but kept to other businesses. */
export type IntegrationsContext = { id: string; connections: Connection[]; connected: Set<string>; elsewhere: Set<string>; functions: FunctionId[]; name: string;
  /** What the recommender weighs (./recommend.ts), without `connected`, which the screens pass as `connected`. */
  profile: Omit<Profile, "connected"> };

export { usableBy };

export async function integrationsContext(team: string, slug: string): Promise<IntegrationsContext> {
  const user = await requireUser();
  const sample = isSample(slug);
  const [connections, detail] = await Promise.all([connectionsOf(user.id), sample ? null : ventureDetail(decodeURIComponent(slug), decodeURIComponent(team))]);
  const real = detail?.ok ? realBusiness(detail.value) : null;
  const functions = sample ? fnsAt(ventureOf(slug).commitment) : real?.functions ?? [];
  const name = sample ? ventureOf(slug).name : real?.name ?? decodeURIComponent(slug);
  const id = decodeURIComponent(slug);
  const profile: Omit<Profile, "connected"> = sample ? { functions, ...SAMPLE_PROFILES[slug] } : profileOf(functions, detail?.ok ? detail.value : null);
  const live = connections.filter((c) => c.status === "connected");
  return {
    id, connections, functions, name, profile,
    connected: new Set(live.filter((c) => usableBy(c, id)).map((c) => c.connector)),
    elsewhere: new Set(live.filter((c) => !usableBy(c, id)).map((c) => c.connector)),
  };
}

/** The business's source map (knowledge/sources.json, EE-042) through the bridge. A sample business, or one with no
 * map yet, keeps every record kind in Reflect. Read-only: V27 changes it through the router, not here. */
export async function sourceMapOf(team: string, slug: string): Promise<{ map: SourceMap; error: string | null }> {
  if (isSample(slug) || studioUnavailable()) return { map: {}, error: null };
  try {
    // The bridge finds knowledge/sources.json wherever the venture's layout keeps it; a new business has none.
    return { map: await naive<SourceMap>("sources", { venture: decodeURIComponent(slug) }, decodeURIComponent(team)), error: null };
  } catch {
    return { map: {}, error: "Mentura could not read where this business keeps its records." };
  }
}
