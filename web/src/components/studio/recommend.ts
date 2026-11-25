// The integrations recommender (Torian, 2026-11-24: "recommends based on a certain set of factors, especially things
// such as the market and industry that a business exists within", with alternatives and an AI that explains why).
// Pure and deterministic: every point of a score comes from a named factor, so the explanation can only restate the
// factors (the model phrases them, it never adds one; ./explain.ts). The factors:
//   need      the business's functions, and whether their tools cannot work from files alone (./integrations.ts)
//   phase     the business's phase against the phase a category usually starts to matter
//   industry  the business's NAICS sector (venture.json `industry`)
//   regulation  how heavily regulated it is (venture.json `regulation.exposure`)
//   funding   how it is funded (venture.json `form.funding`)
// The phase, industry, regulation and funding tables are Naive-style priors: version 0, ours, and unevaluated, in the
// same spirit as departments.json's priors. They name no vendor.
import type { MarketConnector } from "@reflect/core/marketplace";
import type { FunctionId } from "./data";
import { categoryOf, forBusiness, integrationOf, membersOf, type Recommendation } from "./integrations";
import { shown, toolOf } from "./tools";

export type Phase = "discovery" | "validation" | "beachhead" | "scale" | "platform";
export const PHASES: Phase[] = ["discovery", "validation", "beachhead", "scale", "platform"];

/** What the recommender knows about a business. Everything but functions may be unknown. */
export type Profile = {
  functions: FunctionId[];
  phase?: Phase | null;
  /** A NAICS code, 2 to 6 digits. */
  industry?: { code: string; label?: string | null } | null;
  regulation?: "light" | "some" | "heavy" | null;
  funding?: "bootstrapped" | "grant" | "angel" | "venture-capital" | "debt" | "mixed" | null;
  /** Catalog ids connected and open to this business. */
  connected?: ReadonlySet<string>;
};

/** One reason a category scores what it does. `id` is stable so an explanation can cite it. */
export type Factor = { id: string; kind: "need" | "phase" | "industry" | "regulation" | "funding" | "connected"; text: string; points: number };

/** Another way to get the same work done: a tool built into the console, or something already connected. */
export type Alternative = { kind: "built-in" | "connected"; label: string; how: string; tool?: string; integration?: string };

export type Scored = Recommendation & { score: number; factors: Factor[]; later: boolean; alternatives: Alternative[] };

/** The phase from which a category usually matters. A category not named here matters from discovery. */
const FROM: Record<string, Phase> = {
  crm: "validation", analytics: "validation", payments: "validation", "help-desk": "validation", "source-control": "validation",
  hosting: "validation", databases: "validation", "project-management": "validation", accounting: "validation", "e-signature": "validation",
  monitoring: "beachhead", "payroll-hr": "beachhead", identity: "scale",
};

/** NAICS sectors (2 digits; 31 to 33, 44 to 45 and 48 to 49 are one sector each) by name. */
const SECTORS: Record<string, string> = {
  "11": "agriculture", "21": "mining", "22": "utilities", "23": "construction", "31": "manufacturing", "42": "wholesale trade",
  "44": "retail", "48": "transportation and warehousing", "51": "information and software", "52": "finance and insurance",
  "53": "real estate", "54": "professional services", "55": "management of companies", "56": "administrative and support services",
  "61": "education", "62": "health care", "71": "arts, entertainment and recreation", "72": "accommodation and food services",
  "81": "other services", "92": "public administration",
};
/** The categories businesses in a sector lean on most, beyond what their functions say. */
const SECTOR_LEANS: Record<string, string[]> = {
  "23": ["project-management", "e-signature", "accounting"],
  "31": ["accounting", "project-management"],
  "42": ["accounting", "crm", "payments"],
  "44": ["payments", "analytics", "help-desk", "email"],
  "51": ["source-control", "hosting", "databases", "monitoring", "analytics"],
  "52": ["identity", "e-signature", "accounting"],
  "53": ["e-signature", "crm", "scheduling"],
  "54": ["scheduling", "crm", "e-signature", "accounting"],
  "56": ["scheduling", "help-desk", "payroll-hr"],
  "61": ["scheduling", "knowledge", "team-chat"],
  "62": ["scheduling", "identity", "e-signature"],
  "71": ["payments", "scheduling", "email"],
  "72": ["payments", "scheduling", "payroll-hr"],
  "81": ["scheduling", "payments", "crm"],
};
const REGULATED = ["identity", "e-signature", "monitoring"];
const INVESTED = ["e-signature", "accounting"];

/** The NAICS sector of a code: its first two digits, with 31 to 33, 44 to 45 and 48 to 49 each taken as one. */
export function sectorOf(code: string): string {
  const two = code.slice(0, 2);
  return ["32", "33"].includes(two) ? "31" : two === "45" ? "44" : two === "49" ? "48" : two;
}
export const sectorName = (code: string) => SECTORS[sectorOf(code)] ?? null;

/**
 * Built-in tools that do a category's work, by tool id. The console offers one as an alternative when the business
 * has its function turned on (or the tool is universal) and Naive has its records.
 */
const BUILT_IN: Record<string, string[]> = {
  crm: ["pipeline", "people"], "help-desk": ["support-inbox"], accounting: ["books", "spend", "cash"],
  "payroll-hr": ["payroll", "employee-records"], "project-management": ["tasks", "projects"], knowledge: ["knowledge-base"],
  files: ["files"], scheduling: ["calendar"], analytics: ["measures"], identity: ["access"], "e-signature": ["legal"],
  spreadsheets: ["records"], automation: ["processes"], design: ["brand"],
};
/** Connected kinds of software that can stand in for a category, and how. */
const STANDS_IN: Record<string, { category: string; how: string }[]> = {
  crm: [{ category: "databases", how: "Keep contacts and deals as a table in your database" }, { category: "spreadsheets", how: "Keep contacts and deals in a sheet" }],
  analytics: [{ category: "databases", how: "Query the events your app already stores" }],
  accounting: [{ category: "spreadsheets", how: "Keep simple books in a sheet until you outgrow it" }, { category: "payments", how: "Read revenue and fees straight from your payments account" }],
  "help-desk": [{ category: "email", how: "Answer customers from a shared address" }],
  knowledge: [{ category: "files", how: "Keep what you know as documents in your file storage" }],
  "project-management": [{ category: "knowledge", how: "Track work as pages in your knowledge base" }],
};

/** The alternatives to a category for this business: built-in tools it has, then what it has connected. */
export function alternativesFor(category: string, p: Profile): Alternative[] {
  const fns = new Set(p.functions);
  const built = (BUILT_IN[category] ?? []).map(toolOf).filter((t) => !!t && shown(t) && (t.function === null || fns.has(t.function)))
    .map((t): Alternative => ({ kind: "built-in", label: t!.title, how: t!.about, tool: t!.id }));
  const connected = p.connected ?? new Set<string>();
  const near = (STANDS_IN[category] ?? []).flatMap(({ category: c, how }) => {
    const have = membersOf(categoryOf(c)!).filter((m) => connected.has(m.id));
    return have.map((m): Alternative => ({ kind: "connected", label: `Your ${m.name}`, how, integration: m.id }));
  });
  return [...built, ...near];
}

/** Scores every category the business's functions reach, each point traced to a factor. Highest first; a category a
 * connection already covers goes last. */
export function recommend(p: Profile): Scored[] {
  const connected = p.connected ?? new Set<string>();
  const sector = p.industry ? sectorOf(p.industry.code) : null;
  const industryName = p.industry ? (p.industry.label ?? sectorName(p.industry.code)) : null;
  const at = p.phase ? PHASES.indexOf(p.phase) : -1;
  return forBusiness(p.functions, connected).map((r): Scored => {
    const id = r.category.id;
    const factors: Factor[] = [];
    factors.push(r.fit === "needed"
      ? { id: "need", kind: "need", text: `${r.why}.`, points: 3 }
      : { id: "need", kind: "need", text: `It serves work your ${r.functions.length > 1 ? "functions do" : "function does"}: ${r.groups.slice(0, 2).map((g) => g.name.toLowerCase()).join("; ")}.`, points: 1 });
    if (r.functions.length > 1) factors.push({ id: "reach", kind: "need", text: `${r.functions.length} of your functions use it.`, points: 0.5 * (r.functions.length - 1) });
    const from = FROM[id] ?? "discovery";
    let later = false;
    if (at >= 0) {
      if (at < PHASES.indexOf(from)) {
        later = true;
        factors.push({ id: "phase", kind: "phase", text: `It usually matters from ${from}; you are in ${p.phase}.`, points: -2 });
      } else if (from !== "discovery") {
        factors.push({ id: "phase", kind: "phase", text: `It usually starts to matter in ${from}, and you are in ${p.phase}.`, points: 0.5 });
      }
    }
    if (sector && SECTOR_LEANS[sector]?.includes(id)) factors.push({ id: "industry", kind: "industry", text: `Businesses in ${industryName} lean on it.`, points: 2 });
    if (p.regulation === "heavy" && REGULATED.includes(id)) factors.push({ id: "regulation", kind: "regulation", text: "Heavily regulated businesses must show who did what, and when.", points: 1.5 });
    if ((p.funding === "angel" || p.funding === "venture-capital") && INVESTED.includes(id)) factors.push({ id: "funding", kind: "funding", text: "Investors expect signed documents and clean books.", points: 1 });
    if (r.connected) factors.push({ id: "connected", kind: "connected", text: "You already have it connected.", points: 0 });
    const score = factors.reduce((s, f) => s + f.points, 0);
    return { ...r, score, factors, later, alternatives: alternativesFor(id, p) };
  }).sort((a, b) => Number(a.connected) - Number(b.connected) || b.score - a.score || a.category.name.localeCompare(b.category.name));
}

/** One category's score for this business, or null when none of its functions reach the category. */
export const recommendationFor = (category: string, p: Profile): Scored | null => recommend(p).find((r) => r.category.id === category) ?? null;

/** The prototype's sample businesses, as venture.json would describe them. */
export const SAMPLE_PROFILES: Record<string, Omit<Profile, "functions" | "connected">> = {
  "haptic-plays": { phase: "validation", industry: { code: "334", label: "electronics manufacturing" }, regulation: "some", funding: "bootstrapped" },
  "pattern-language": { phase: "discovery", industry: { code: "513210", label: "software publishing" }, regulation: "light", funding: "bootstrapped" },
  "founder-raise": { phase: "beachhead", industry: { code: "523", label: "investment services" }, regulation: "heavy", funding: "angel" },
};

const as = <T extends string>(v: unknown, all: readonly T[]): T | null => (all.includes(v as T) ? (v as T) : null);
/** A profile from what the bridge says of a real business; anything it does not know stays unknown. */
export function profileOf(functions: FunctionId[], v: { phase?: unknown; industry?: { code: string; label: string | null } | null; regulation?: unknown; funding?: unknown } | null): Profile {
  return {
    functions,
    phase: as(v?.phase, PHASES),
    industry: v?.industry && /^\d{2,6}$/.test(v.industry.code) ? v.industry : null,
    regulation: as(v?.regulation, ["light", "some", "heavy"] as const),
    funding: as(v?.funding, ["bootstrapped", "grant", "angel", "venture-capital", "debt", "mixed"] as const),
  };
}

/** What the recommender knew, in words, for the line under "Recommended for": "information and software, validation". */
export function profileLine(p: Profile): string[] {
  const out: string[] = [];
  if (p.industry) out.push(p.industry.label ?? sectorName(p.industry.code) ?? `NAICS ${p.industry.code}`);
  if (p.phase) out.push(`${p.phase} phase`);
  if (p.regulation === "heavy") out.push("heavily regulated");
  if (p.funding && p.funding !== "mixed") out.push(p.funding === "venture-capital" ? "venture funded" : p.funding === "angel" ? "angel funded" : p.funding === "grant" ? "grant funded" : p.funding === "debt" ? "funded by debt" : "bootstrapped");
  return out;
}

/** Featured: the best integrations across categories, one per category, from the top-scored categories that have
 * something in the catalog and are neither connected nor for a later phase. */
export function featured(p: Profile, n = 4): { integration: MarketConnector; rec: Scored }[] {
  return recommend(p).filter((r) => !r.connected && !r.later && r.category.members.length).slice(0, n)
    .map((rec) => ({ integration: integrationOf(rec.category.members[0]!)!, rec }));
}
