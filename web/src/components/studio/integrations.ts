// Integrations in the business console (doc "Business console integrations", 2026-11-24). The catalog is Reflect's MCP
// marketplace (@reflect/core/marketplace): real services each person signs in to with their own account. This file adds
// categories and the rules that recommend them. A category names a kind of software, never a vendor, and records the
// APQC process groups (level 2) it serves and the Naive capability cluster it fills, if any. Categories carry no vendor,
// so they belong in Naive beside capability-clusters.json; until they move there they live here, as naive-tools.json
// does. naive-clusters.json is a copy of naive packages/naive/src/functions/it/capability-clusters.json at 7f9277e3f.
import { MARKET, type MarketConnector } from "@reflect/core/marketplace";
import clusterFile from "./naive-clusters.json";
import { groupOf, PROCESS_GROUPS, shown, TOOLS, type ProcessGroup } from "./tools";
import type { FunctionId } from "./data";

export type Cluster = { id: string; title: string; functions: string[]; gaps: string[]; why: string };
export const CLUSTERS = clusterFile.clusters as Cluster[];
export const clusterOf = (id: string): Cluster | undefined => CLUSTERS.find((c) => c.id === id);

export type Category = {
  id: string;
  name: string;
  /** What the category is for, in one line. */
  line: string;
  /** APQC process group ids (level 2) whose work it serves. */
  groups: string[];
  /** The capability cluster it fills: the work cannot stay in files without it. */
  cluster?: string;
  /** Catalog connector ids in the category. */
  members: string[];
};

export const CATEGORIES: Category[] = [
  { id: "email", name: "Email", line: "Send and receive email from your own address.", groups: ["3.3", "3.5", "6.2", "7.8", "12.5"], cluster: "messaging-delivery", members: ["resend", "gmail"] },
  { id: "team-chat", name: "Team chat", line: "Talk with your team in channels and threads.", groups: ["6.2", "7.8", "13.4"], members: ["slack"] },
  { id: "crm", name: "CRM", line: "Keep contacts, companies and deals in one place.", groups: ["3.1", "3.5", "6.2", "12.1"], cluster: "private-contact-records", members: [] },
  { id: "help-desk", name: "Help desk", line: "Answer customers' questions and keep each conversation.", groups: ["6.2", "6.3", "6.5"], cluster: "private-contact-records", members: ["intercom"] },
  { id: "scheduling", name: "Calendar and scheduling", line: "Find times and book calls.", groups: ["3.5", "6.2", "7.2"], members: [] },
  { id: "files", name: "File storage and documents", line: "Store and write files and documents.", groups: ["8.4", "13.5"], members: ["google-drive", "google-docs"] },
  { id: "spreadsheets", name: "Spreadsheets", line: "Model numbers and keep lists in sheets.", groups: ["1.4", "9.1", "13.7"], members: ["google-sheets"] },
  { id: "knowledge", name: "Knowledge base", line: "Write down what the business knows so anyone can find it.", groups: ["2.2", "6.1", "13.5"], members: ["notion", "atlassian"] },
  { id: "project-management", name: "Project management", line: "Plan work as issues, projects and boards.", groups: ["2.1", "2.3", "5.2", "13.2"], members: ["linear", "atlassian", "monday"] },
  { id: "design", name: "Design", line: "Design screens, graphics and brand assets.", groups: ["2.2", "2.3", "3.3"], members: ["figma", "canva"] },
  { id: "source-control", name: "Source control", line: "Keep code and its history, and review changes.", groups: ["2.3", "8.5", "8.6"], members: ["github"] },
  { id: "hosting", name: "Hosting and deployment", line: "Put sites and apps online and keep them running.", groups: ["2.3", "8.5", "8.6"], cluster: "runtime-and-data", members: ["vercel", "cloudflare"] },
  { id: "databases", name: "Databases", line: "Store an app's data and query it.", groups: ["8.4", "13.7"], cluster: "runtime-and-data", members: ["supabase", "neon"] },
  { id: "monitoring", name: "Error monitoring", line: "Find out when an app breaks and why.", groups: ["8.3", "8.7"], cluster: "runtime-and-data", members: ["sentry"] },
  { id: "analytics", name: "Analytics", line: "Measure visitors, customers and what they do.", groups: ["3.1", "6.5", "13.6", "13.7"], members: [] },
  { id: "ai-models", name: "AI models", line: "Find and run models and datasets.", groups: ["2.3", "13.7"], members: ["huggingface"] },
  { id: "automation", name: "Automation", line: "Run steps across apps without writing code.", groups: ["13.1", "13.2"], members: ["zapier"] },
  { id: "payments", name: "Payments", line: "Take payments and see your balance.", groups: ["3.5", "9.2", "9.7"], cluster: "money-and-books", members: ["stripe"] },
  { id: "accounting", name: "Accounting", line: "Keep the books, pay bills and file taxes.", groups: ["9.1", "9.3", "9.6", "9.7", "9.9"], cluster: "money-and-books", members: [] },
  { id: "payroll-hr", name: "Payroll and HR", line: "Pay people and keep their records.", groups: ["7.3", "7.5", "7.7", "9.5"], cluster: "money-and-books", members: [] },
  { id: "e-signature", name: "E-signature", line: "Send agreements and get them signed.", groups: ["7.2", "11.2", "12.1", "12.4"], cluster: "signatures-and-privileged-records", members: [] },
  { id: "identity", name: "Identity and access", line: "Manage who can sign in to what.", groups: ["7.7", "8.3", "8.6"], cluster: "identity-and-secrets", members: [] },
];

export const categoryOf = (id: string): Category | undefined => CATEGORIES.find((c) => c.id === id);
export const integrationOf = (id: string): MarketConnector | undefined => MARKET.find((c) => c.id === id);
export const membersOf = (c: Category): MarketConnector[] => c.members.map(integrationOf).filter((m): m is MarketConnector => !!m);
export const categoriesOf = (integration: string): Category[] => CATEGORIES.filter((c) => c.members.includes(integration));
/** The functions whose work a category serves, in APQC order. */
export const functionsOf = (c: Category): FunctionId[] => [...new Set(c.groups.map((g) => groupOf(g)?.function).filter((f): f is FunctionId => !!f))];

/** Needed: the work cannot stay in files without it. Helpful: it serves the work, and files would do. */
export type Fit = "needed" | "helpful";
export type Recommendation = { category: Category; fit: Fit; why: string; groups: ProcessGroup[]; functions: FunctionId[]; connected: boolean };

const groupsOfFunction = (fn: FunctionId) => PROCESS_GROUPS.filter((g) => g.function === fn);
const clustersOfFunction = (fn: FunctionId) => new Set(TOOLS.filter((t) => t.function === fn && shown(t) && t.cluster).map((t) => t.cluster!));

/** The categories that serve one process group. */
export const forGroup = (group: string): Category[] => CATEGORIES.filter((c) => c.groups.includes(group));

/**
 * One function's categories: each that serves any of its process groups, Needed when it fills a capability cluster
 * one of the function's shown tools names (the cluster's own reason is the why), Helpful otherwise. Needed first,
 * then by how many of the function's groups it covers.
 */
export function forFunction(fn: FunctionId, connected: ReadonlySet<string> = new Set()): Recommendation[] {
  const groups = groupsOfFunction(fn);
  const clusters = clustersOfFunction(fn);
  return CATEGORIES.flatMap((category): Recommendation[] => {
    const hit = groups.filter((g) => category.groups.includes(g.id));
    if (!hit.length) return [];
    const needed = !!category.cluster && clusters.has(category.cluster);
    const why = needed ? clusterOf(category.cluster!)!.why : `Serves ${hit.map((g) => g.name.charAt(0).toLowerCase() + g.name.slice(1)).join("; ")}.`;
    return [{ category, fit: needed ? "needed" : "helpful", why, groups: hit, functions: [fn], connected: category.members.some((m) => connected.has(m)) }];
  }).sort((a, b) => rank(a) - rank(b) || b.groups.length - a.groups.length);
}

/**
 * A business's categories: the union over its functions, a category Needed when it is Needed for any of them. Needed
 * first, then by the number of functions served; a category a connection already covers goes last.
 */
export function forBusiness(fns: readonly FunctionId[], connected: ReadonlySet<string> = new Set()): Recommendation[] {
  const by = new Map<string, Recommendation>();
  for (const fn of fns) {
    for (const r of forFunction(fn, connected)) {
      const was = by.get(r.category.id);
      if (!was) by.set(r.category.id, { ...r });
      else {
        was.functions.push(fn);
        was.groups.push(...r.groups);
        if (r.fit === "needed" && was.fit !== "needed") Object.assign(was, { fit: "needed", why: r.why });
      }
    }
  }
  return [...by.values()].sort((a, b) => Number(a.connected) - Number(b.connected) || rank(a) - rank(b) || b.functions.length - a.functions.length);
}

const rank = (r: Recommendation) => (r.fit === "needed" ? 0 : 1);

/** Search the catalog by name, line, category or the work it does. */
export function search(q: string, list: readonly MarketConnector[] = MARKET): MarketConnector[] {
  const n = q.trim().toLowerCase();
  if (!n) return [...list];
  return list.filter((c) => [c.name, c.by, c.line, ...c.does, ...categoriesOf(c.id).map((k) => k.name)].some((s) => s.toLowerCase().includes(n)));
}

/** Whether a business may use a connection: every business when none are named (null), else only those named. */
export const usableBy = (c: { businesses: readonly string[] | null }, business: string): boolean => c.businesses === null || c.businesses.includes(business);
