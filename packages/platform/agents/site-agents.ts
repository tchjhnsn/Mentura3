// The agents that build a business's site and docs, and the guard that keeps each one inside what it owns
// (containers.ts). A function's IT specialist (`<function>-it`) builds its function's containers from approved copy;
// the design-system agent alone changes tokens, shared components and the grid; a capability agent writes the copy of
// one capability and is started only by its category agent. The repository is mounted at /site/ through
// ContainerGuardBackend, which refuses a write, edit, delete or upload the manifest does not give the agent, before
// anything touches the disk, and refuses a container file that would change the look outside the design system.
//
//   const guard = new ContainerGuardBackend({ rootDir: siteDir, manifest: loadManifest(`${siteDir}/containers.json`), agent: "products-it" });
//   await guard.write("/components/button.tsx", "...");   // { error: "components/button.tsx is the design system: only design-system-agent changes it. Next: ..." }

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { FilesystemBackend } from "deepagents";
import { checkChange, DESIGN_SYSTEM_AGENT, itSpecialist, reachOf, type Manifest } from "./containers.ts";

type WriteResult = Awaited<ReturnType<FilesystemBackend["write"]>>;
type EditResult = Awaited<ReturnType<FilesystemBackend["edit"]>>;
type DeleteResult = Awaited<ReturnType<FilesystemBackend["delete"]>>;
type UploadResult = Awaited<ReturnType<FilesystemBackend["uploadFiles"]>>;

/** Where the site or docs repository is mounted for a site agent. */
export const SITE_MOUNT = "/site/";

const rel = (p: string): string => p.replace(/^\/+/, "");

/** A FilesystemBackend over a site repository that writes only what the manifest gives the agent. Reads are open. */
export class ContainerGuardBackend extends FilesystemBackend {
  readonly manifest: Manifest;
  readonly agent: string;
  readonly root: string;

  constructor(o: { rootDir: string, manifest: Manifest, agent: string }) {
    super({ rootDir: o.rootDir, virtualMode: true });
    this.manifest = o.manifest; this.agent = o.agent; this.root = o.rootDir;
  }

  /** The refusal for a change, or null when the agent may make it. */
  refusal(path: string, content?: string): string | null {
    const problems = checkChange(this.manifest, this.agent, [{ path: rel(path), content }]);
    return problems.length ? problems.map((p) => `${p.path}: ${p.why}.${p.fix ? ` Next: ${p.fix}.` : ""}`).join(" ") : null;
  }

  override async write(filePath: string, content: string): Promise<WriteResult> {
    const no = this.refusal(filePath, content);
    return no ? { error: no } : await super.write(filePath, content);
  }

  override async edit(filePath: string, oldString: string, newString: string, replaceAll = false): Promise<EditResult> {
    const file = join(this.root, rel(filePath));
    const before = existsSync(file) ? readFileSync(file, "utf8") : "";
    const after = replaceAll ? before.split(oldString).join(newString) : before.replace(oldString, newString);
    const no = this.refusal(filePath, after);
    return no ? { error: no } : await super.edit(filePath, oldString, newString, replaceAll);
  }

  override async delete(filePath: string): Promise<DeleteResult> {
    const no = this.refusal(filePath);
    return no ? { error: no } : await super.delete(filePath);
  }

  override async uploadFiles(files: Array<[string, Uint8Array]>): Promise<UploadResult> {
    const refused = files.map(([p]) => this.refusal(p)).find((r) => r !== null);
    if (refused) throw new Error(refused);
    return await super.uploadFiles(files);
  }
}

/** The kinds of site agent, by role id. */
export type SiteRole = { kind: "it", function: string } | { kind: "design-system" } | { kind: "capability", capability: string };

/** What a role id names. A capability agent is `<capability>-agent` and is not a function agent. Pure. */
export function siteRoleOf(role: string, functions: readonly string[]): SiteRole | null {
  if (role === DESIGN_SYSTEM_AGENT) return { kind: "design-system" };
  const it = /^(.+)-it$/.exec(role);
  if (it && functions.includes(it[1])) return { kind: "it", function: it[1] };
  const cap = /^(.+)-agent$/.exec(role);
  if (cap && !functions.includes(cap[1])) return { kind: "capability", capability: cap[1] };
  return null;
}

/** How a site agent works, with its own reach named from the manifest. Pure. */
export function siteRules(role: string, m: Manifest, functions: readonly string[]): string[] {
  const kind = siteRoleOf(role, functions);
  const reach = reachOf(m, role);
  const common = [
    `The site or docs repository is mounted at ${SITE_MOUNT}. You may read all of it. You may change only what containers.json gives your role; any other write is refused before it lands.`,
    "Read the ownership and documents skills before you start. Nothing is built from words a person has not approved as a print copy.",
    "Before you hand back, run your gates: every changed path is yours, the built words match the approved copy, no raw colour or stylesheet in a container, and no internal term on a public page.",
  ];
  if (kind?.kind === "design-system") return [...common,
    "You alone change the design system: tokens, shared components, the grid and type. A container owner asks you for a token, component or variant through a handoff; you add it for the whole site, never for one container.",
    "You build no container and write no copy."];
  if (kind?.kind === "it") return [...common,
    `You build the containers of ${kind.function}: ${reach.builds.join(", ") || "none yet"}. You build them from approved copy that their owners hand off to you, using only the design system's components and their editable props.`,
    `You write no copy. A container you need that does not exist is the category agent's to add. A component you need is ${DESIGN_SYSTEM_AGENT}'s to make: hand off to it.`];
  if (kind?.kind === "capability") return [...common,
    `You write the copy of one capability, ${kind.capability}: ${reach.owns.join(", ") || "no container yet"}. Keep it current when the capability changes. Your function's IT specialist builds it from your approved copy.`,
    "You were started by your category agent, which has authority over your containers and may send your work back."];
  return common;
}

/** The roles a manifest needs staffed: one IT specialist per function with a container, the design-system agent, every owner. Pure. */
export function rolesNeeded(m: Manifest): string[] {
  const out = new Set<string>([DESIGN_SYSTEM_AGENT]);
  for (const c of m.containers) { out.add(itSpecialist(c.function)); out.add(c.owner); if (c.category) out.add(c.category); }
  return [...out].sort();
}
