// What a function agent is, derived from Naive's own data (EE-123). There is no list of agents here and no code per
// function: every id in Naive's departments.json is a function agent, and what the agent needs to know about its
// function comes from data Naive already ships.
//
//   departments.json                       the id, label, APQC category, governance and operations sides
//   PACKAGE_FUNCTION (core/venture-paths)  the record packages the function owns, so the write reach it should get
//   routes() (router)                      the write routes whose canonical file sits in one of those packages
//   PLANS (engine/access)                  the team-plan files, so no derived reach ever includes the team plan
//   functions/<fn>/                        the function's module: every skills/ folder under it holds its skills
//
// This module names no LangChain type, so the MCP shim can list tools without building an agent.
//
//   const spec = functionAgent("strategy");      // throws on an id departments.json does not list
//   spec.role                                    // "strategy-agent"
//   spec.writes                                  // ["decisions/*", "foundation/alignment", ..., "validation/solution"]
//   teamPlanEntry(spec, "discovery")             // the entry a person adds to the venture's team plan

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { PACKAGE_FUNCTION } from "naive-framework/src/core/venture-paths.mjs";
import { PLANS, routeGlob } from "naive-framework/src/engine/access.mjs";
import { routes } from "naive-framework/src/router/router.mjs";
import { naivePath } from "../../scripts/naive.ts";

/** Only functionAgent() makes a spec, so a spec always agrees with Naive's data. Erased at runtime. */
declare const derived: unique symbol;

/** A function id that departments.json lists. Made only by functionIds() and functionAgent(). */
export type FunctionId = string & { readonly __function: true };

/** One skill: a folder with a SKILL.md whose frontmatter name is the folder's name (deepagents' rule). */
export interface Skill {
  readonly name: string,
  /** The skill's folder as the agent sees it, under the module mounted at /function/: /function/skills/telos/. */
  readonly path: string,
}

/** What departments.json says the function is for. */
export interface Charter { readonly apqc: string, readonly governance: string, readonly operations: string }

/**
 * One function agent. Invariants, checked when the spec is derived: role is `${function}-agent`; skill names are
 * unique and each matches its folder; no write glob reaches a team-plan route (an agent that could edit the team plan
 * could widen its own reach).
 */
export interface FunctionAgentSpec {
  readonly [derived]: true,
  readonly function: FunctionId,
  readonly label: string,
  /** The team-plan role the agent acts in. One rule for every function, so a venture staffs it by adding this id. */
  readonly role: string,
  readonly charter: Charter,
  /** Record packages the function owns (PACKAGE_FUNCTION). Empty for a function that owns none yet. */
  readonly packages: readonly string[],
  /** The function's module folder in the installed Naive, mounted read-only at /function/ in the agent's files. */
  readonly module: string,
  readonly skills: readonly Skill[],
  /**
   * The write globs the agent's team-plan role should get: decisions/* (to raise a question) plus every concrete
   * write route whose canonical file (files[0]) sits in an owned package, [id] as *. Concrete routes, not
   * <prefix>/** globs: a route's first segment is not its package, so prefixes over-reach. A new Naive route
   * reaches an agent only when a person adds it to the venture's team plan.
   */
  readonly writes: readonly string[],
}

export type Phase = "discovery" | "validation" | "beachhead" | "scale" | "platform";

/** A team-plan role entry (packages/naive/src/records/team-plan.schema.json), as teamPlanEntry suggests it. */
export interface TeamPlanRole {
  readonly id: string,
  readonly name: string,
  readonly occupant: "agent",
  readonly needed_by: Phase,
  readonly status: "filled",
  readonly why: string,
  readonly routes: { readonly write: readonly string[] },
}

interface Department { id: string, label: string, apqc: { id: string, name: string }, governance: string, operations: string }
interface Route { route: string, actions?: string[], files?: string[] }

const MODULES = "packages/naive/src/functions";
const departments = (): Department[] =>
  (JSON.parse(readFileSync(naivePath(`${MODULES}/departments.json`), "utf8")) as { departments: Department[] }).departments;

/** Every function agent the installed Naive defines, in departments.json order. */
export function functionIds(): FunctionId[] {
  return departments().map((d) => d.id as FunctionId);
}

/** Whether any of these globs could write the team plan: the routes whose files include a team-plan file (PLANS). */
export function reachesTeamPlan(globs: readonly string[]): boolean {
  const plans = (routes() as Route[]).filter((r) => r.files?.some((f) => PLANS.includes(f))).map((r) => r.route);
  return globs.some((g) => plans.some((p) => routeGlob(g).test(p)));
}

const cache = new Map<string, FunctionAgentSpec>();

/**
 * The function agent for one function id. Throws an Error naming the valid ids when departments.json does not list
 * id, and an Error naming the files when Naive's data breaks an invariant above. The installed Naive does not change
 * while a process runs, so each spec is derived once.
 */
export function functionAgent(id: string): FunctionAgentSpec {
  const hit = cache.get(id);
  if (hit) return hit;
  const all = departments();
  const dept = all.find((d) => d.id === id);
  if (!dept) throw new Error(`no function ${id}: departments.json lists ${all.map((d) => d.id).join(", ")}`);
  const packages = Object.entries(PACKAGE_FUNCTION as Record<string, string>).filter(([, f]) => f === id).map(([p]) => p).sort();
  const module = naivePath(`${MODULES}/${id}`);
  const skills = skillsUnder(module);
  const writes = ["decisions/*", ...ownedRoutes(packages)];
  if (reachesTeamPlan(writes)) throw new Error(`${id}'s derived write routes reach the team plan: ${writes.join(", ")}`);
  const fields: Omit<FunctionAgentSpec, typeof derived> = {
    function: id as FunctionId, label: dept.label, role: `${id}-agent`,
    charter: { apqc: `${dept.apqc.id} ${dept.apqc.name}`, governance: dept.governance, operations: dept.operations },
    packages, module, skills, writes,
  };
  const spec = fields as FunctionAgentSpec;
  cache.set(id, spec);
  return spec;
}

/**
 * The team-plan entry a person adds so the venture staffs this agent. The CLI prints it in its refusal when the role
 * is missing; the agent never writes the team plan itself, because reach is the venture's decision, a person's.
 */
export function teamPlanEntry(spec: FunctionAgentSpec, phase: Phase): TeamPlanRole {
  return { id: spec.role, name: `${spec.label} agent`, occupant: "agent", needed_by: phase, status: "filled",
    why: `${spec.charter.apqc}: ${spec.charter.governance}`, routes: { write: [...spec.writes] } };
}

/** Every skills/ folder at any depth under the module (skills/, kits/<kit>/skills/), one Skill per child with a SKILL.md. */
function skillsUnder(module: string): Skill[] {
  const found: Skill[] = [];
  const walk = (dir: string): void => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      if (!e.isDirectory() || e.name.startsWith(".") || e.name === "node_modules") continue;
      const sub = join(dir, e.name);
      if (e.name === "skills") {
        for (const s of readdirSync(sub, { withFileTypes: true })) {
          const md = join(sub, s.name, "SKILL.md");
          if (s.isDirectory() && existsSync(md)) found.push({ name: skillName(md, s.name), path: `/function/${relative(module, join(sub, s.name))}/` });
        }
      }
      else walk(sub);
    }
  };
  if (existsSync(module)) walk(module);
  const seen = new Map<string, string>();
  for (const s of found) {
    const prior = seen.get(s.name);
    if (prior) throw new Error(`two skills named ${s.name}: ${prior} and ${s.path}`);
    seen.set(s.name, s.path);
  }
  return found.sort((a, b) => a.path.localeCompare(b.path));
}

/** The SKILL.md frontmatter name, which deepagents requires to equal the folder name and to be lowercase with hyphens. */
function skillName(file: string, folder: string): string {
  const front = /^---\n([\s\S]*?)\n---/.exec(readFileSync(file, "utf8"))?.[1] ?? "";
  const name = /^name:\s*["']?([^"'\n]+?)["']?\s*$/m.exec(front)?.[1];
  if (name !== folder) throw new Error(`${file}: its frontmatter name (${name ?? "none"}) must be its folder's name, ${folder}`);
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(name) || name.length > 64) throw new Error(`${file}: a skill name is lowercase letters, digits and single hyphens, at most 64 characters`);
  return name;
}

/**
 * The write routes an owned package holds: every route with a write action whose canonical file (files[0]) starts
 * with an owned package, [id] as *, minus any route whose files include a team-plan file (PLANS).
 */
function ownedRoutes(packages: readonly string[]): string[] {
  const owned = (routes() as Route[]).filter((r) => r.actions?.includes("write") && r.files?.length
    && packages.includes(r.files[0].split("/")[0]) && !r.files.some((f) => PLANS.includes(f)));
  return [...new Set(owned.map((r) => r.route.replace("[id]", "*")))].sort();
}
