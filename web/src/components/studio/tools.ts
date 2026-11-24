// The business console's tools, from Naive's tool catalog (naive packages/naive/src/functions/tools.json, EE-163):
// function (APQC level 1) > process group (APQC level 2) > tool, plus the universal tools every business gets.
// naive-tools.json is a copy of that file at tchjhnsn/naive 49e96064e; copy it again when the catalog changes.
// The sidebar (src/components/sidebar.tsx) is drawn from it in three levels, after Vercel (doc "Where actions live in
// the business console", 2026-11-24): the Studio, one business, and one function, each replacing the whole sidebar.
import catalog from "./naive-tools.json";
import type { FunctionId } from "./data";

export type Phase = "discovery" | "validation" | "beachhead" | "scale" | "platform";
export type ToolKind = "view" | "editor" | "workflow" | "storage" | "connection";
export type Tool = {
  id: string; function: FunctionId | null; title: string; kind: ToolKind; phase: Phase; about: string;
  process_groups: string[]; reads: string[]; writes: string[]; proposes?: string[]; paths?: string[]; cluster?: string;
};
export type ProcessGroup = { id: string; function: FunctionId; name: string; pcf: number };
/** Derived, never written, as Naive's check-tools derives it: ready when Naive has every record type the tool needs. */
export type Status = "ready" | "partial" | "proposed";

export const TOOLS = catalog.tools as Tool[];
export const PROCESS_GROUPS = catalog.process_groups as ProcessGroup[];
const PHASES: Phase[] = ["discovery", "validation", "beachhead", "scale", "platform"];

export const statusOf = (t: Tool): Status =>
  !t.proposes?.length ? "ready" : t.reads.length || t.writes.length || t.paths?.length ? "partial" : "proposed";

/** A tool the console shows: one whose records Naive has, at least in part. A proposed tool would open an empty page. */
export const shown = (t: Tool) => statusOf(t) !== "proposed";

export const toolOf = (id: string): Tool | undefined => TOOLS.find((t) => t.id === id);
export const groupOf = (id: string): ProcessGroup | undefined => PROCESS_GROUPS.find((g) => g.id === id);
export const universalTools = (): Tool[] => TOOLS.filter((t) => t.function === null && shown(t));

/** One function's shown tools under the process group each lists first, groups in APQC order, tools in phase order. */
export function functionGroups(fn: FunctionId): { group: ProcessGroup; tools: Tool[] }[] {
  const tools = TOOLS.filter((t) => t.function === fn && shown(t));
  return PROCESS_GROUPS.filter((g) => g.function === fn)
    .map((group) => ({ group, tools: tools.filter((t) => t.process_groups[0] === group.id).sort((a, b) => PHASES.indexOf(a.phase) - PHASES.indexOf(b.phase)) }))
    .filter((g) => g.tools.length > 0);
}

/** Universal tools that already have a page of their own in a business, by the page's path under /studio/v/<slug>/. */
const UNIVERSAL_PAGES: Record<string, string> = {
  home: "", decisions: "decisions", agents: "agents", files: "files", activity: "activity", connections: "integrations", settings: "settings",
};

/** Universal tools whose page reads a real business from Naive. The other pages are still the prototype's samples. */
const REAL_PAGES = new Set(["home", "decisions", "files", "connections"]);

/** Where a tool opens inside one business: its page, under its function so the sidebar stays at that function. A real
 * business opens only pages that read it; any other universal tool shows its catalog page. */
export const toolPath = (t: Tool, real = false): string =>
  t.function !== null ? `functions/${t.function}/${t.id}`
    : real && !REAL_PAGES.has(t.id) ? `tools/${t.id}` : UNIVERSAL_PAGES[t.id] ?? `tools/${t.id}`;

/** Where the sidebar is, read from the path: the Studio, one business, or one function of a business. */
export type Level = { kind: "studio" } | { kind: "business"; slug: string } | { kind: "function"; slug: string; fn: string; tool: string | null }
  | { kind: "integrations"; slug: string };
export function levelOf(path: string): Level {
  const i = path.match(/^\/studio\/v\/([^/]+)\/integrations(?:\/|$)/);
  if (i) return { kind: "integrations", slug: i[1]! };
  const f = path.match(/^\/studio\/v\/([^/]+)\/functions\/([^/]+)(?:\/([^/]+))?/);
  if (f) return { kind: "function", slug: f[1]!, fn: f[2]!, tool: f[3] ?? null };
  const b = path.match(/^\/studio\/v\/([^/]+)/);
  return b ? { kind: "business", slug: b[1]! } : { kind: "studio" };
}
