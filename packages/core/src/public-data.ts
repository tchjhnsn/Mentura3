// Public data read for the place a household lives (doc "Tiles and their connections"): FEMA's National Risk Index
// for the Safety tile, and EPA's Safe Drinking Water Information System (SDWIS, through Envirofacts) for the Water
// tile. Pure: the parsing and the parts by path. The fetching is in web/src/server/public-data.ts.

export const NRI_SOURCE = { name: "FEMA National Risk Index", url: "https://hazards.fema.gov/nri/" };
export const SDWIS_SOURCE = { name: "EPA Safe Drinking Water Information System", url: "https://enviro.epa.gov/facts/sdwis/search.html" };

/** The National Risk Index's hazards, by the code its fields use. */
export const HAZARDS: Record<string, string> = {
  AVLN: "Avalanche", CFLD: "Coastal flooding", CWAV: "Cold wave", DRGT: "Drought", ERQK: "Earthquake", HAIL: "Hail",
  HWAV: "Heat wave", HRCN: "Hurricane", ISTM: "Ice storm", LNDS: "Landslide", LTNG: "Lightning", IFLD: "Inland flooding",
  SWND: "Strong wind", TRND: "Tornado", TSUN: "Tsunami", VLCN: "Volcanic activity", WFIR: "Wildfire", WNTW: "Winter weather",
};
/** The Index's ratings, highest first. */
export const RATINGS = ["Very High", "Relatively High", "Relatively Moderate", "Relatively Low", "Very Low"] as const;

export type CountyRisk = { fips: string; county: string; state: string; rating: string | null; score: number | null; hazards: { id: string; name: string; rating: string }[] };

/** A county's overall rating and its hazards rated relatively high or above, highest first, from one Index row. */
export function parseNri(a: Record<string, unknown>): CountyRisk {
  const str = (k: string) => (typeof a[k] === "string" && a[k] ? (a[k] as string) : null);
  const rank = (r: string) => RATINGS.indexOf(r as (typeof RATINGS)[number]);
  const hazards = Object.entries(HAZARDS)
    .map(([id, name]) => ({ id, name, rating: str(`${id}_RISKR`) ?? "" }))
    .filter((h) => rank(h.rating) >= 0 && rank(h.rating) <= 1)
    .sort((x, y) => rank(x.rating) - rank(y.rating) || x.name.localeCompare(y.name));
  return { fips: str("STCOFIPS") ?? "", county: str("COUNTY") ?? "", state: str("STATEABBRV") ?? "", rating: str("RISK_RATNG"), score: typeof a.RISK_SCORE === "number" ? Math.round(a.RISK_SCORE * 10) / 10 : null, hazards };
}

/** SDWIS violation categories, in EPA's words. */
export const VIOLATION_KIND: Record<string, string> = {
  MCL: "Maximum contaminant level", MRDL: "Maximum residual disinfectant level", TT: "Treatment technique",
  MR: "Monitoring and reporting", MON: "Monitoring", RPT: "Reporting", Other: "Other",
};

export type WaterSystem = { pwsid: string; name: string; served: number | null };
export type WaterRecord = WaterSystem & { healthBased: number; latest: { day: string; kind: string } | null; years: number };

/** A water system's health-based violations that began in the last `years` years, and the latest of them. */
export function waterRecord(system: WaterSystem, violations: readonly Record<string, unknown>[], today: string, years = 10): WaterRecord {
  const since = `${Number(today.slice(0, 4)) - years}${today.slice(4, 10)}`;
  const hb = violations
    .filter((v) => v.is_health_based_ind === "Y" && typeof v.compl_per_begin_date === "string" && v.compl_per_begin_date.slice(0, 10) >= since)
    .map((v) => ({ day: (v.compl_per_begin_date as string).slice(0, 10), kind: VIOLATION_KIND[String(v.violation_category_code)] ?? "Other" }))
    .sort((x, y) => y.day.localeCompare(x.day));
  // One problem is often reported as several rows (one per rule or period); count distinct start days and kinds.
  const distinct = new Set(hb.map((v) => `${v.day}|${v.kind}`));
  return { ...system, healthBased: distinct.size, latest: hb[0] ?? null, years };
}

export type Place = { county: CountyRisk | null; water: WaterRecord | null };
export const PLACE_PATHS = "'' (both in brief), 'hazards' (the county's FEMA National Risk Index rating and highest hazards), 'water' (the household's water system and its health-based violations in 10 years)";

/** One part of what public data says about where the household lives, by path, or null. */
export function placePart(p: Place, path: string): unknown {
  const head = path.split("/").filter(Boolean);
  if (head.length > 1) return null;
  const hazards = p.county ? { county: `${p.county.county}, ${p.county.state}`, rating: p.county.rating, highest: p.county.hazards.map((h) => `${h.name} (${h.rating})`), source: NRI_SOURCE.name } : null;
  const water = p.water ? { system: p.water.name, served: p.water.served, healthBasedViolations: p.water.healthBased, inYears: p.water.years, latest: p.water.latest, source: SDWIS_SOURCE.name } : null;
  if (!head[0]) return { hazards, water };
  if (head[0] === "hazards") return hazards;
  if (head[0] === "water") return water;
  return null;
}

/** EPA's names are in capitals; this writes them in title case, keeping short joining words lower. */
export function tidyName(s: string): string {
  if (s !== s.toUpperCase()) return s;
  const small = new Set(["of", "and", "the", "at", "in", "on", "for", "de"]);
  return s.toLowerCase().split(/\s+/).map((w, i) => (i > 0 && small.has(w) ? w : w.replace(/^[a-z]/, (c) => c.toUpperCase()))).join(" ").replace(/\b(Wsc|Mud|Sud|Pud|Wcid|Fwsd|Usa|Us)\b/g, (m) => m.toUpperCase());
}

/** US states and DC by postal abbreviation, for choosing where you live. */
export const STATES: readonly [string, string][] = [
  ["AL", "Alabama"], ["AK", "Alaska"], ["AZ", "Arizona"], ["AR", "Arkansas"], ["CA", "California"], ["CO", "Colorado"], ["CT", "Connecticut"], ["DE", "Delaware"], ["DC", "District of Columbia"], ["FL", "Florida"], ["GA", "Georgia"], ["HI", "Hawaii"], ["ID", "Idaho"], ["IL", "Illinois"], ["IN", "Indiana"], ["IA", "Iowa"], ["KS", "Kansas"], ["KY", "Kentucky"], ["LA", "Louisiana"], ["ME", "Maine"], ["MD", "Maryland"], ["MA", "Massachusetts"], ["MI", "Michigan"], ["MN", "Minnesota"], ["MS", "Mississippi"], ["MO", "Missouri"], ["MT", "Montana"], ["NE", "Nebraska"], ["NV", "Nevada"], ["NH", "New Hampshire"], ["NJ", "New Jersey"], ["NM", "New Mexico"], ["NY", "New York"], ["NC", "North Carolina"], ["ND", "North Dakota"], ["OH", "Ohio"], ["OK", "Oklahoma"], ["OR", "Oregon"], ["PA", "Pennsylvania"], ["RI", "Rhode Island"], ["SC", "South Carolina"], ["SD", "South Dakota"], ["TN", "Tennessee"], ["TX", "Texas"], ["UT", "Utah"], ["VT", "Vermont"], ["VA", "Virginia"], ["WA", "Washington"], ["WV", "West Virginia"], ["WI", "Wisconsin"], ["WY", "Wyoming"],
];
export const isState = (s: unknown): s is string => typeof s === "string" && STATES.some(([a]) => a === s);
