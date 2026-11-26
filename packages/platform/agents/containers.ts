// Who may change which part of a business's site and docs. A site or docs repository keeps one manifest,
// containers.json, beside its template: every section (a container) has exactly one owning agent that writes its copy,
// a category agent above it, the function it belongs to, and that function's IT specialist, the one agent that builds
// it. The design system (tokens, shared components, the grid) has one owner, the design-system agent, and nobody else
// changes it. A page is a container that holds other containers, owned by the function that owns the page.
//
//   const m = loadManifest("site/containers.json");
//   mayWrite(m, "products-it", "app/(site)/features/time-travel/page.tsx");   // { ok: true, container: "features/time-travel" }
//   checkChange(m, "products-it", [{ path: "components/button.tsx" }]);       // [{ path, why: "only design-system-agent ..." }]
//
// It fails closed: a path no container claims is written by nobody but a person, and a path two containers claim is a
// broken manifest. A person (no agent id) may change anything; the design-system lint is for agents only.

import { readFileSync } from "node:fs";

/** What a container's owner may change through its builder: the words, the order of blocks, a component's editable props. */
export type May = "copy" | "order" | "props";
export const MAY: readonly May[] = ["copy", "order", "props"];

export interface Container {
  id: string,
  /** Globs relative to the repository root (`*` within one folder, `**` across folders). */
  paths: string[],
  /** The agent that writes its copy: a capability, category or function agent. Never its builder. */
  owner: string,
  /** The category agent with authority over the owner. */
  category?: string,
  /** The function it belongs to, a departments.json id. */
  function: string,
  /** The one agent that builds it: `<function>-it`. */
  builder: string,
  may: May[],
  /** For a page: the containers it holds, in order. */
  holds?: string[],
}

export interface DesignSystem { paths: string[], owner: string }
export interface Manifest { design_system: DesignSystem, containers: Container[] }

export const DESIGN_SYSTEM_AGENT = "design-system-agent";
/** The IT specialist of a function, the one agent that builds that function's containers. */
export const itSpecialist = (fn: string): string => `${fn}-it`;

/** A glob as a regular expression: `**` crosses folders, `*` and `?` stay inside one. Pure. */
export function globToRegExp(glob: string): RegExp {
  let re = "";
  for (let i = 0; i < glob.length; i++) {
    const c = glob[i];
    if (c === "*" && glob[i + 1] === "*") { re += glob[i + 2] === "/" ? "(?:.*/)?" : ".*"; i += glob[i + 2] === "/" ? 2 : 1; }
    else if (c === "*") re += "[^/]*";
    else if (c === "?") re += "[^/]";
    else re += c.replace(/[.+^${}()|[\]\\]/g, "\\$&");
  }
  return new RegExp(`^${re}$`);
}

const norm = (p: string): string => p.replace(/\\/g, "/").replace(/^\.?\//, "");
const claims = (globs: string[], path: string): boolean => globs.some((g) => globToRegExp(norm(g)).test(norm(path)));

/** Everything wrong with a manifest's shape and rules, one line each. Empty when it is sound. Pure. */
export function validateManifest(m: unknown, functions?: readonly string[]): string[] {
  const out: string[] = [];
  if (!m || typeof m !== "object") return ["containers.json is not an object"];
  const { design_system: ds, containers } = m as Partial<Manifest>;
  if (!ds || !Array.isArray(ds.paths) || !ds.paths.length || typeof ds.owner !== "string") out.push("design_system needs paths and an owner");
  else if (ds.owner !== DESIGN_SYSTEM_AGENT) out.push(`design_system is owned by ${DESIGN_SYSTEM_AGENT}, not ${ds.owner}`);
  if (!Array.isArray(containers)) return [...out, "containers is not a list"];
  const ids = new Set<string>();
  for (const c of containers) {
    const at = typeof c?.id === "string" ? c.id : "a container";
    if (typeof c?.id !== "string" || !c.id) { out.push("a container has no id"); continue; }
    if (ids.has(c.id)) out.push(`${at} is listed twice`);
    ids.add(c.id);
    if (!Array.isArray(c.paths) || !c.paths.length) out.push(`${at} claims no paths`);
    if (typeof c.owner !== "string" || !c.owner) out.push(`${at} has no owner`);
    if (typeof c.function !== "string" || !c.function) out.push(`${at} names no function`);
    else if (functions && !functions.includes(c.function)) out.push(`${at}: ${c.function} is not a function the business has`);
    if (c.builder !== itSpecialist(c.function)) out.push(`${at} is built by ${itSpecialist(c.function)}, its function's IT specialist, not ${c.builder}`);
    if (c.owner === c.builder) out.push(`${at}: the agent that writes the copy is not the agent that builds it`);
    if (c.owner === DESIGN_SYSTEM_AGENT || c.builder === DESIGN_SYSTEM_AGENT) out.push(`${at}: ${DESIGN_SYSTEM_AGENT} owns only the design system`);
    if (!Array.isArray(c.may) || c.may.some((x) => !MAY.includes(x))) out.push(`${at}: may lists only ${MAY.join(", ")}`);
  }
  for (const c of containers) for (const h of c?.holds ?? []) if (!ids.has(h)) out.push(`${c.id} holds ${h}, which no container is`);
  return out;
}

/** Reads and checks a manifest. Throws with every problem, so a caller fails closed. */
export function loadManifest(file: string, functions?: readonly string[]): Manifest {
  const m: unknown = JSON.parse(readFileSync(file, "utf8"));
  const problems = validateManifest(m, functions);
  if (problems.length) throw new Error(`${file} is not a sound manifest:\n- ${problems.join("\n- ")}`);
  return m as Manifest;
}

/** Who claims a path: the design system, one container, or nobody. More than one claim is a broken manifest. Pure. */
export function claimsOf(m: Manifest, path: string): ("design-system" | Container)[] {
  const out: ("design-system" | Container)[] = claims(m.design_system.paths, path) ? ["design-system"] : [];
  for (const c of m.containers) if (claims(c.paths, path)) out.push(c);
  return out;
}

/** ok with the container that claims the path, or not ok with why and what to do next. */
export interface Verdict { ok: boolean, container?: string, why?: string, fix?: string }

/** Whether an agent may write a file. A person (no agent id) may write anything. Pure. */
export function mayWrite(m: Manifest, agent: string | null, path: string): Verdict {
  const found = claimsOf(m, path);
  if (agent === null) return { ok: true, container: found.length === 1 ? idOf(found[0]) : "(a person)" };
  if (found.length === 0) return { ok: false, why: `no container claims ${path}, so no agent may write it`, fix: "ask the category agent to add a container for it to containers.json, with an owner and a builder" };
  if (found.length > 1) return { ok: false, why: `${path} is claimed by ${found.map(idOf).join(" and ")}`, fix: "fix containers.json so one container claims each path" };
  const [c] = found;
  if (c === "design-system") return agent === m.design_system.owner ? { ok: true, container: "design-system" }
    : { ok: false, why: `${path} is the design system: only ${m.design_system.owner} changes it`, fix: `hand off to ${m.design_system.owner} with what you need (a token, a component, a variant)` };
  if (agent === c.builder) return { ok: true, container: c.id };
  if (agent === c.owner || agent === c.category) return { ok: false, why: `${agent} writes ${c.id}'s copy; ${c.builder} builds it`, fix: `hand off the approved copy to ${c.builder}` };
  return { ok: false, why: `${path} is ${c.id}, built only by ${c.builder}`, fix: `hand off to ${c.owner}, who owns ${c.id}` };
}

const idOf = (c: "design-system" | Container): string => c === "design-system" ? "design-system" : c.id;

/** What a container file an agent built may not do: change the look outside the design system. Pure. */
export function lintContainerFile(path: string, content: string): string[] {
  const out: string[] = [];
  if (/\.(css|scss|sass|less)$/.test(path)) out.push("a container adds no stylesheet; styles come from the design system");
  const code = content.replace(/^\s*\/\/.*$/gm, "");
  const hex = code.match(/#[0-9a-fA-F]{3,8}\b(?![\w-])/);
  if (hex && !/\.(md|mdx)$/.test(path)) out.push(`a raw colour (${hex[0]}): use a design-system token`);
  if (/\b(?:rgb|rgba|hsl|hsla|oklch)\(/.test(code)) out.push("a raw colour function: use a design-system token");
  if (/<style[\s>]/.test(code)) out.push("an inline <style> block: styles come from the design system");
  return out;
}

export interface Problem { path: string, why: string, fix?: string }

/** Everything wrong with one agent's change: paths it may not write, and container files that break the look. Pure. */
export function checkChange(m: Manifest, agent: string | null, files: { path: string, content?: string }[]): Problem[] {
  const out: Problem[] = [];
  for (const f of files) {
    const v = mayWrite(m, agent, f.path);
    if (!v.ok) { out.push({ path: f.path, why: v.why, fix: v.fix }); continue; }
    if (agent !== null && v.container !== "design-system" && f.content !== undefined) for (const why of lintContainerFile(f.path, f.content)) out.push({ path: f.path, why });
  }
  return out;
}

/** The containers an agent builds, and the ones it owns the copy of, for its prompt. Pure. */
export function reachOf(m: Manifest, agent: string): { builds: string[], owns: string[], design_system: boolean } {
  return {
    builds: m.containers.filter((c) => c.builder === agent).map((c) => c.id),
    owns: m.containers.filter((c) => c.owner === agent || c.category === agent).map((c) => c.id),
    design_system: m.design_system.owner === agent,
  };
}
