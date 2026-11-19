// The shadcn/ui adapter: checks shadcn.virtu.json against the system and
// plans virtu.shadcn.css, which build writes. Each shadcn variable becomes an
// alias of a --virtu- property, so shadcn's components take the system's
// values under every context. Pairs shadcn renders together must be covered
// by a declared contrast relation, which check proves under every
// permutation. The design is docs/design/SHADCN_ADAPTER.md.

import type { Analysis } from "./check.ts";
import { SHADCN_CORE, type Finding, type ShadcnMap } from "./model.ts";
import { buildFinding } from "./rules.ts";

/**
 * The pairs shadcn/ui renders as text on a surface, foreground first: each
 * surface with its -foreground, muted text on the page and in cards and menus,
 * destructive text in forms, and the link button's primary text on the page.
 */
export const SHADCN_PAIRS: ReadonlyArray<readonly [string, string]> = [
  ["foreground", "background"],
  ["card-foreground", "card"],
  ["popover-foreground", "popover"],
  ["primary-foreground", "primary"],
  ["secondary-foreground", "secondary"],
  ["muted-foreground", "muted"],
  ["accent-foreground", "accent"],
  ["sidebar-foreground", "sidebar"],
  ["sidebar-primary-foreground", "sidebar-primary"],
  ["sidebar-accent-foreground", "sidebar-accent"],
  ["muted-foreground", "background"],
  ["muted-foreground", "card"],
  ["muted-foreground", "popover"],
  ["destructive", "background"],
  ["destructive", "card"],
  ["primary", "background"],
];

export type ShadcnPlan =
  | { ok: true; variables: ShadcnMap["variables"]; dark: { context: string; value: string } | null; findings: Finding[] }
  | { ok: false; findings: Finding[] };

/** Checks the map against the system: tokens, types, the dark value, unmapped core variables, and contrast coverage. */
export function planShadcn(a: Analysis, map: ShadcnMap): ShadcnPlan {
  const errors: Finding[] = [];
  const warnings: Finding[] = [];

  // Every mapped token must exist, and be a color (radius: a dimension), under every permutation.
  for (const { name, token } of map.variables) {
    const want = name === "radius" ? "dimension" : "color";
    for (const p of a.permutations) {
      const t = a.resolution(p).tokens.get(token);
      const why = t === undefined ? "which the system does not have" : t.value?.type !== want ? `which is a ${t.value?.type ?? "token with no valid value"}, not a ${want}` : null;
      if (why === null) continue;
      errors.push(buildFinding("build.shadcn-token", `${name} maps to ${token}, ${why}`, [name, token]));
      break;
    }
  }

  // dark names a value of the color domain's context.
  let dark: { context: string; value: string } | null = null;
  if (map.dark !== null) {
    const decl = a.loaded.domains.color;
    const context = decl?.kind === "governed" && typeof decl.cells.context === "string" ? decl.cells.context : null;
    const values = context === null ? [] : (a.loaded.resolver.modifiers[context]?.values ?? []).map((v) => v.name);
    if (context === null) {
      errors.push(buildFinding("build.shadcn-invalid", `shadcn.virtu.json dark: names "${map.dark}", but the color domain names no context`, ["dark"]));
    } else if (!values.includes(map.dark)) {
      errors.push(buildFinding("build.shadcn-invalid", `shadcn.virtu.json dark: names "${map.dark}", which ${context} does not have; its values are ${values.join(", ")}`, ["dark", context]));
    } else dark = { context, value: map.dark };
  }
  if (errors.length > 0) return { ok: false, findings: errors };

  const mapped = new Map(map.variables.map((v) => [v.name, v.token]));
  const unmapped = SHADCN_CORE.filter((n) => !mapped.has(n));
  if (unmapped.length > 0) {
    warnings.push(
      buildFinding(
        "build.shadcn-unmapped",
        `${unmapped.join(", ")} ${unmapped.length === 1 ? "is" : "are"} not mapped, so shadcn components that read ${unmapped.length === 1 ? "it" : "them"} get no color from the system`,
        [...unmapped],
      ),
    );
  }

  // Coverage: a contrast relation whose foreground matches one token and background the other, in either order.
  const expand = (selectors: string[]): Set<string> => {
    const out = new Set<string>();
    for (const sel of selectors) for (const path of a.allPaths) if (path === sel || path.startsWith(`${sel}.`)) out.add(path);
    return out;
  };
  const relations = a.loaded.relations.flatMap((rel) => (rel.kind === "contrast" ? [{ fg: expand(rel.foreground), bg: expand(rel.background) }] : []));
  for (const [fgName, bgName] of SHADCN_PAIRS) {
    const fg = mapped.get(fgName);
    const bg = mapped.get(bgName);
    if (fg === undefined || bg === undefined) continue;
    if (fg === bg) {
      warnings.push(buildFinding("build.shadcn-uncovered", `${fgName} and ${bgName} both map to ${fg}, and shadcn draws one on the other, at 1:1`, [fgName, bgName, fg]));
      continue;
    }
    const covered = relations.some((r) => (r.fg.has(fg) && r.bg.has(bg)) || (r.fg.has(bg) && r.bg.has(fg)));
    if (!covered) {
      warnings.push(
        buildFinding(
          "build.shadcn-uncovered",
          `shadcn draws ${fgName} (${fg}) on ${bgName} (${bg}), and no contrast relation covers that pair, so nothing proves it is readable; declare one in virtu.json`,
          [fgName, bgName, fg, bg],
        ),
      );
    }
  }
  return { ok: true, variables: map.variables, dark, findings: warnings };
}
