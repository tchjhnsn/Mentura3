// Fetching public data about where the household lives (`@reflect/core/public-data`): FEMA's National Risk Index by
// county from FEMA's ArcGIS service, and EPA's Safe Drinking Water Information System through Envirofacts. Both are
// free and need no key. Answers are cached for a day; a failed fetch gives null, never a guess.
import { parseNri, tidyName, waterRecord, type CountyRisk, type Place, type WaterSystem } from "@reflect/core/public-data";
import { lifeRecords } from "./life-store";
import { outsideFetch } from "@/server/outside";

const NRI = "https://services.arcgis.com/XG15cJAlne2vxtgt/arcgis/rest/services/National_Risk_Index_Counties/FeatureServer/0/query";
const EF = "https://data.epa.gov/efservice";
const DAY = 86_400;
const HAZARD_FIELDS = ["AVLN", "CFLD", "CWAV", "DRGT", "ERQK", "HAIL", "HWAV", "HRCN", "ISTM", "LNDS", "LTNG", "IFLD", "SWND", "TRND", "TSUN", "VLCN", "WFIR", "WNTW"].map((h) => `${h}_RISKR`);

async function getJson(url: string): Promise<unknown> {
  try {
    const r = await outsideFetch({ timeoutMs: 15_000 })(url, { next: { revalidate: DAY } });
    return r.ok ? await r.json() : null;
  } catch {
    return null;
  }
}

/** The county's row in the National Risk Index, or null when no county by that name is in the state. */
export async function countyRisk(state: string, county: string): Promise<CountyRisk | null> {
  const name = county.trim().replace(/\s+(county|parish|borough|census area)$/i, "").replace(/'/g, "''").toUpperCase();
  if (!/^[A-Z]{2}$/.test(state) || !name) return null;
  const q = new URLSearchParams({
    where: `STATEABBRV='${state}' AND UPPER(COUNTY)='${name}'`,
    outFields: ["STCOFIPS", "COUNTY", "STATEABBRV", "RISK_RATNG", "RISK_SCORE", ...HAZARD_FIELDS].join(","),
    returnGeometry: "false",
    f: "json",
  });
  const j = (await getJson(`${NRI}?${q}`)) as { features?: { attributes: Record<string, unknown> }[] } | null;
  const a = j?.features?.[0]?.attributes;
  return a ? parseNri(a) : null;
}

/** Active community water systems that serve the county, largest first. */
export async function waterSystems(state: string, county: string): Promise<WaterSystem[]> {
  const name = county.trim().replace(/\s+county$/i, "");
  if (!/^[A-Z]{2}$/.test(state) || !name || /[/\\]/.test(name)) return [];
  const url = `${EF}/WATER_SYSTEM/PWS_TYPE_CODE/CWS/PWS_ACTIVITY_CODE/A/GEOGRAPHIC_AREA/PRIMACY_AGENCY_CODE/${state}/COUNTY_SERVED/${encodeURIComponent(name)}/JSON`;
  const rows = (await getJson(url)) as Record<string, unknown>[] | null;
  const seen = new Map<string, WaterSystem>();
  for (const r of Array.isArray(rows) ? rows : []) {
    const pwsid = String(r.pwsid ?? "");
    if (!pwsid || seen.has(pwsid)) continue;
    seen.set(pwsid, { pwsid, name: tidyName(String(r.pws_name ?? pwsid)), served: typeof r.population_served_count === "number" ? r.population_served_count : null });
  }
  return [...seen.values()].sort((x, y) => (y.served ?? 0) - (x.served ?? 0));
}

/** A water system's violations, as EPA reports them. */
export async function waterViolations(pwsid: string): Promise<Record<string, unknown>[] | null> {
  if (!/^[A-Z0-9]{9}$/.test(pwsid)) return null;
  const rows = await getJson(`${EF}/VIOLATION/PWSID/${pwsid}/JSON`);
  return Array.isArray(rows) ? (rows as Record<string, unknown>[]) : null;
}

/** Where the person said they live, as kept in their Home records. */
export async function placeRecord(userId: string): Promise<{ id: string; county?: string; state?: string; pwsid?: string; water?: string; served?: number } | null> {
  const r = (await lifeRecords(userId, "home")).find((x) => x.kind === "place");
  return r ? { id: r.id, ...(r.body as Record<string, string & number>) } : null;
}

/** What public data says about where the person lives: the county's risk and the water system's record. */
export async function placeFacts(userId: string, today = new Date().toISOString().slice(0, 10)): Promise<Place & { set: boolean }> {
  const p = await placeRecord(userId);
  if (!p?.state || !p.county) return { county: null, water: null, set: false };
  const [county, violations] = await Promise.all([countyRisk(p.state, p.county), p.pwsid ? waterViolations(p.pwsid) : Promise.resolve(null)]);
  const water = p.pwsid && violations ? waterRecord({ pwsid: p.pwsid, name: tidyName(p.water ?? p.pwsid), served: p.served ?? null }, violations, today) : null;
  return { county, water, set: true };
}
