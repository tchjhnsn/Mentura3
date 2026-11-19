// The rule registry. RULES is the catalog: every finding a check can produce
// has a stable id here, with its layer and severity. STRUCTURE_RULES and
// USAGE_RULES are the checks themselves; relation kinds are in relations.ts.

import type { Analysis } from "./check.ts";
import { DOMAIN_IDS, FITTING_TYPES, MECHANISMS, type Finding, type Layer, type Permutation, type Severity } from "./model.ts";
import { collapse } from "./permutations.ts";
import { selectTokens, type Resolution } from "./tokens.ts";

type RuleMeta = { layer: Layer; severity: Severity; summary: string };

export const RULES = {
  "load.invalid": { layer: "load", severity: "error", summary: "A value in virtu.json or the resolver document has the wrong shape" },
  "load.unused": { layer: "load", severity: "warning", summary: "A resolver modifier is not in resolutionOrder" },
  "L0.domain-missing": { layer: "L0", severity: "error", summary: "A domain of the medium is neither governed nor excluded" },
  "L0.cell-missing": { layer: "L0", severity: "error", summary: "A governed domain leaves a coverage cell unanswered; use null for deliberately nothing" },
  "L0.excluded-without-reason": { layer: "L0", severity: "error", summary: "An excluded domain gives no reason" },
  "L0.ref-unknown": { layer: "L0", severity: "error", summary: "A cell names nothing that is declared" },
  "L0.ref-wrong-mechanism": { layer: "L0", severity: "error", summary: "A cell names something of another mechanism" },
  "L0.ref-wrong-domain": { layer: "L0", severity: "error", summary: "A vocabulary cell names an enumerated vocabulary declared for another domain" },
  "L1.alias-unresolved": { layer: "L1", severity: "error", summary: "An alias names no token" },
  "L1.alias-cycle": { layer: "L1", severity: "error", summary: "Aliases form a cycle" },
  "L1.type-invalid": { layer: "L1", severity: "error", summary: "A token has no $type, or one DTCG does not define" },
  "L1.value-invalid": { layer: "L1", severity: "error", summary: "A token's value does not fit its $type" },
  "L1.type-unfit": { layer: "L1", severity: "error", summary: "A vocabulary holds a type that does not fit its domain" },
  "L1.vocabulary-empty": { layer: "L1", severity: "error", summary: "A vocabulary has no entries" },
  "context.modifier-undeclared": { layer: "context", severity: "error", summary: "A resolver modifier has no context in virtu.json" },
  "context.modifier-missing": { layer: "context", severity: "error", summary: "A context in virtu.json has no resolver modifier" },
  "context.unused": { layer: "context", severity: "warning", summary: "No domain's context cell names the context" },
  "context.too-few-values": { layer: "context", severity: "error", summary: "A context has fewer than two values" },
  "context.default-unknown": { layer: "context", severity: "error", summary: "A modifier's default is not one of its values" },
  "context.default-missing": { layer: "context", severity: "warning", summary: "A modifier has no default, so Virtu uses its first value" },
  "context.changes-nothing": { layer: "context", severity: "warning", summary: "A domain's context overrides no token in that domain's vocabulary" },
  "machine.initial-unknown": { layer: "machine", severity: "error", summary: "The initial state is not one of the machine's states" },
  "machine.state-unknown": { layer: "machine", severity: "error", summary: "A transition names a state the machine does not have" },
  "machine.nondeterministic": { layer: "machine", severity: "error", summary: "One state and one event lead to two states" },
  "machine.unreachable": { layer: "machine", severity: "error", summary: "A state cannot be reached from the initial state" },
  "L2.skipped": { layer: "L2", severity: "warning", summary: "Relations were not checked because an alias is missing or circular" },
  "L2.selector-empty": { layer: "L2", severity: "error", summary: "A relation's token path matches nothing" },
  "L2.selector-ungoverned": { layer: "L2", severity: "error", summary: "A relation names tokens outside every governed vocabulary" },
  "L2.contrast": { layer: "L2", severity: "error", summary: "A foreground and background fall below the minimum WCAG 2 contrast ratio, in display-p3 or in its sRGB fallback" },
  "L2.contrast-undecidable": { layer: "L2", severity: "error", summary: "Contrast cannot be decided: not a color, alpha below 1, not srgb or display-p3, or a display-p3 color outside sRGB with no hex fallback" },
  "L2.ratio": { layer: "L2", severity: "error", summary: "An entry is not the stated ratio times the one before, within the tolerance" },
  "L2.ratio-units": { layer: "L2", severity: "error", summary: "A ratio's entries are not all dimensions in one unit, or all numbers" },
  "L2.nested-radius": { layer: "L2", severity: "error", summary: "An inner radius is not the outer radius less the inset and border (never below 0), within the tolerance, so the corners are not concentric" },
  "L2.nested-radius-units": { layer: "L2", severity: "error", summary: "A nested radius's entries are not all dimensions in one unit" },
  "L2.count": { layer: "L2", severity: "error", summary: "A vocabulary has more entries than the stated maximum" },
  "L3.entry-unknown": { layer: "L3", severity: "error", summary: "A usage entry names no vocabulary entry" },
  "L3.situation-conflict": { layer: "L3", severity: "error", summary: "One situation maps to two entries in the same domain" },
} as const satisfies Record<string, RuleMeta>;

export type RuleId = keyof typeof RULES;

/** Findings virtu build adds after check passes. An error here also stops the build. */
export const BUILD_RULES = {
  "build.name-unsafe": { layer: "build", severity: "error", summary: "A token path or context name cannot become a CSS name without escaping" },
  "build.name-collision": { layer: "build", severity: "error", summary: "Two tokens would get the same CSS custom property or Tailwind name" },
  "build.context-interaction": {
    layer: "build",
    severity: "warning",
    summary: "A token's value depends on more than one context, so one attribute rule per context value cannot give it everywhere",
  },
  "build.shadcn-invalid": {
    layer: "build",
    severity: "error",
    summary: "shadcn.virtu.json has the wrong shape, names a variable shadcn does not define, or names a dark value the color context lacks",
  },
  "build.shadcn-token": { layer: "build", severity: "error", summary: "A shadcn variable maps to a token the system lacks, or to one of the wrong type" },
  "build.shadcn-unmapped": { layer: "build", severity: "warning", summary: "A variable every shadcn component set reads is not mapped" },
  "build.shadcn-uncovered": { layer: "build", severity: "warning", summary: "Two variables shadcn renders together are not covered by a declared contrast relation" },
} as const satisfies Record<string, RuleMeta>;

export type BuildRuleId = keyof typeof BUILD_RULES;

/** Findings virtu audit reports against an app's source files. */
export const AUDIT_RULES = {
  "audit.unknown-property": { layer: "audit", severity: "error", summary: "A --virtu- property the system does not define" },
  "audit.raw-color": { layer: "audit", severity: "warning", summary: "A color literal in app source, including inside a Tailwind arbitrary value" },
  "audit.stale-build": { layer: "audit", severity: "error", summary: "A file virtu build wrote differs from what virtu build writes now" },
} as const satisfies Record<string, RuleMeta>;

export type AuditRuleId = keyof typeof AUDIT_RULES;

/** Findings virtu color reports before it writes. Any of them stops it, and nothing is written. */
export const COLOR_RULES = {
  "color.invalid": { layer: "color", severity: "error", summary: "color.virtu.json has the wrong shape, or names a scale or step it does not declare" },
  "color.context-missing": { layer: "color", severity: "error", summary: "The color domain names no context, or its context has no resolver modifier with values" },
  "color.value-mismatch": { layer: "color", severity: "error", summary: "The output or a role names a context value the color context lacks, or lacks one it has" },
  "color.selector-outside": { layer: "color", severity: "error", summary: "A contrast relation over roles also names a token that is not a role" },
  "color.unsolvable": { layer: "color", severity: "error", summary: "No assignment of steps meets a contrast relation under a context value" },
  "color.search-limit": { layer: "color", severity: "error", summary: "The search stopped before it found an assignment or showed there is none" },
  "color.not-routed": { layer: "color", severity: "error", summary: "With the generated files in place, a role does not resolve to its step under some permutation" },
} as const satisfies Record<string, RuleMeta>;

export type ColorRuleId = keyof typeof COLOR_RULES;

/** Findings virtu background check reports on background declarations. The design is docs/design/BACKGROUNDS.md. */
export const BACKGROUND_RULES = {
  "background.invalid": {
    layer: "background",
    severity: "error",
    summary: "A background declaration has the wrong shape, a literal color, a name that is not its file name, or a name another declaration has",
  },
  "background.token-unknown": { layer: "background", severity: "error", summary: "A background names a token the system lacks under some permutation" },
  "background.token-type": { layer: "background", severity: "error", summary: "A background names a token that is not a color" },
  "background.base": { layer: "background", severity: "error", summary: "A background's first fill is not an opaque solid" },
  "background.contrast": {
    layer: "background",
    severity: "error",
    summary: "A foreground falls below its minimum WCAG 2 contrast ratio at the worst sampled point of the composited background",
  },
  "background.fallback": { layer: "background", severity: "error", summary: "A background's fallback is not opaque, or a foreground falls below its minimum on it" },
  "background.undecidable": {
    layer: "background",
    severity: "error",
    summary: "Contrast cannot be decided: a color outside srgb and display-p3, a none component, a translucent foreground, a P3 color outside sRGB with no hex fallback, or a field too large to sample",
  },
  "background.cost": { layer: "background", severity: "error", summary: "A noise fill without the filter cost class, or an animated cost class, which version 0 does not build" },
} as const satisfies Record<string, RuleMeta>;

export type BackgroundRuleId = keyof typeof BACKGROUND_RULES;

export function backgroundFinding(rule: BackgroundRuleId, message: string, entities: string[], permutation?: Permutation): Finding {
  const meta: RuleMeta = BACKGROUND_RULES[rule];
  const f: Finding = { severity: meta.severity, layer: meta.layer, rule, message, entities };
  if (permutation !== undefined && Object.keys(permutation).length > 0) f.permutation = permutation;
  return f;
}

/** Findings virtu type check reports on type declarations. The design is docs/design/TYPOGRAPHY.md. */
export const TYPE_RULES = {
  "type.invalid": {
    layer: "type",
    severity: "error",
    summary: "A type declaration has the wrong shape, a name that is not its file name, a name another declaration has, or one token bound twice",
  },
  "type.token-unknown": { layer: "type", severity: "error", summary: "A type declaration binds a token the system lacks under some permutation" },
  "type.token-type": { layer: "type", severity: "error", summary: "A bound token is not of the type its place needs: fontFamily for a role, dimension for a step" },
  "type.unbound": { layer: "type", severity: "warning", summary: "A dimension token beside the bound steps is not bound, so the app mixes the system's size with the pairing's" },
  "type.order": { layer: "type", severity: "error", summary: "The steps do not grow from smallest to largest" },
  "type.ratio": { layer: "type", severity: "error", summary: "A step is not the stated ratio times the one before, within the tolerance, at some end of a fluid scale" },
  "type.body-size": { layer: "type", severity: "error", summary: "The body step is below 16px, at its smallest" },
  "type.line-height": { layer: "type", severity: "error", summary: "The body step's line height is below 1.5 (WCAG 1.4.8)" },
  "type.fluid": { layer: "type", severity: "error", summary: "A fluid step's largest size is below its smallest, so clamp() pins it to its smallest" },
  "type.fluid-zoom": {
    layer: "type",
    severity: "error",
    summary: "A fluid step's largest size is more than 2.5 times its smallest, so zoom may not reach 200% text (WCAG 1.4.4)",
  },
  "type.measure": { layer: "type", severity: "error", summary: "The body measure is wider than 80 characters (WCAG 1.4.8)" },
  "type.license": { layer: "type", severity: "error", summary: "A font's license is not on the allowed list, which in version 0 is OFL-1.1" },
  "type.fallback": { layer: "type", severity: "error", summary: "A fallback stack does not end in a generic family, or a mono role's does not end in a monospace one" },
  "type.x-height": { layer: "type", severity: "warning", summary: "A role's x-height, as a share of its em, differs from the body's by more than 15%" },
} as const satisfies Record<string, RuleMeta>;

export type TypeRuleId = keyof typeof TYPE_RULES;

export function typeFinding(rule: TypeRuleId, message: string, entities: string[], permutation?: Permutation): Finding {
  const meta: RuleMeta = TYPE_RULES[rule];
  const f: Finding = { severity: meta.severity, layer: meta.layer, rule, message, entities };
  if (permutation !== undefined && Object.keys(permutation).length > 0) f.permutation = permutation;
  return f;
}

/** Findings virtu motion check reports on motion declarations. The design is docs/design/MOTION.md. */
export const MOTION_RULES = {
  "motion.invalid": {
    layer: "motion",
    severity: "error",
    summary: "A motion declaration has the wrong shape, a name that is not its file name, a name another declaration has, a reference to a duration or easing it lacks, or one token bound twice",
  },
  "motion.token-unknown": { layer: "motion", severity: "error", summary: "A motion declaration binds a token the system lacks under some permutation" },
  "motion.token-type": { layer: "motion", severity: "error", summary: "A bound token is not of the type its place needs: duration for a duration, cubicBezier for an easing, with a valid value" },
  "motion.unbound": { layer: "motion", severity: "warning", summary: "A token beside the bound ones, of the same type, is not bound, so the app mixes the system's motion with the set's" },
  "motion.bounds": { layer: "motion", severity: "error", summary: "A duration lies outside the bounds the declaration states" },
  "motion.easing": { layer: "motion", severity: "error", summary: "An easing is not a valid cubic-bezier: its x1 or x2 lies outside 0 to 1" },
  "motion.reduced": { layer: "motion", severity: "error", summary: "A reduced-motion variant animates movement: a change of position, size, shape, rotation, or blur (WCAG 2.3.3)" },
  "motion.reduced-extra": { layer: "motion", severity: "error", summary: "A reduced-motion variant animates a property its transition does not, or runs longer than it" },
  "motion.pausable": { layer: "motion", severity: "error", summary: "A transition runs longer than 5 seconds and is not marked pausable (WCAG 2.2.2)" },
  "motion.unused": { layer: "motion", severity: "warning", summary: "A duration or easing the declaration supplies is used by no transition" },
} as const satisfies Record<string, RuleMeta>;

export type MotionRuleId = keyof typeof MOTION_RULES;

export function motionFinding(rule: MotionRuleId, message: string, entities: string[], permutation?: Permutation): Finding {
  const meta: RuleMeta = MOTION_RULES[rule];
  const f: Finding = { severity: meta.severity, layer: meta.layer, rule, message, entities };
  if (permutation !== undefined && Object.keys(permutation).length > 0) f.permutation = permutation;
  return f;
}

/** Findings virtu icons check reports on icon declarations. The design is docs/design/ICONOGRAPHY.md. */
export const ICON_RULES = {
  "icons.invalid": {
    layer: "icons",
    severity: "error",
    summary: "An icon declaration has the wrong shape, a name that is not its file name, a name another declaration has, or a meaning listed twice or mapped to more than one icon",
  },
  "icons.library-unknown": { layer: "icons", severity: "error", summary: "Virtu has no committed name list for the package at that version, so no name can be decided" },
  "icons.license": { layer: "icons", severity: "error", summary: "The set's license is not on the allowed list, or is not the license the package states" },
  "icons.grid": { layer: "icons", severity: "error", summary: "The grid is not the library's, or the stroke is not one the library draws" },
  "icons.name-unknown": { layer: "icons", severity: "error", summary: "A meaning maps to a name the package does not export at that version" },
  "icons.shared": { layer: "icons", severity: "warning", summary: "Two meanings map to the same icon, so a reader cannot tell them apart" },
  "icons.token-unknown": { layer: "icons", severity: "error", summary: "An icon declaration names a token the system lacks under some permutation" },
  "icons.token-type": { layer: "icons", severity: "error", summary: "A named token is not of the type its place needs: dimension for a size, color for a color or surface" },
  "icons.contrast": { layer: "icons", severity: "error", summary: "An icon color falls below 3:1 against a surface (WCAG 1.4.11)" },
  "icons.undecidable": {
    layer: "icons",
    severity: "error",
    summary: "Contrast cannot be decided: a color outside srgb and display-p3, a none component, a translucent color, or a P3 color outside sRGB with no hex fallback",
  },
  "icons.stroke-thin": { layer: "icons", severity: "warning", summary: "At some size, under some permutation, the stroke is drawn thinner than 1 CSS pixel" },
} as const satisfies Record<string, RuleMeta>;

export type IconRuleId = keyof typeof ICON_RULES;

export function iconFinding(rule: IconRuleId, message: string, entities: string[], permutation?: Permutation): Finding {
  const meta: RuleMeta = ICON_RULES[rule];
  const f: Finding = { severity: meta.severity, layer: meta.layer, rule, message, entities };
  if (permutation !== undefined && Object.keys(permutation).length > 0) f.permutation = permutation;
  return f;
}

/** Findings virtu space check reports on space declarations. The design is docs/design/SPACE.md. */
export const SPACE_RULES = {
  "space.invalid": {
    layer: "space",
    severity: "error",
    summary: "A space declaration has the wrong shape, a name that is not its file name, a name another declaration has, a value missing for a density, or one token bound twice",
  },
  "space.context": {
    layer: "space",
    severity: "error",
    summary: "The density context is not the system's, its values or default differ from the system's, or a bound token changes with a context the declaration does not vary by",
  },
  "space.token-unknown": { layer: "space", severity: "error", summary: "A space declaration binds a token the system lacks under some permutation" },
  "space.token-type": { layer: "space", severity: "error", summary: "A bound token is not a dimension with a valid value" },
  "space.unbound": { layer: "space", severity: "warning", summary: "A dimension token beside the bound ones is not bound, so it keeps the system's value" },
  "space.grid": { layer: "space", severity: "error", summary: "A step or target is not a whole multiple of the grid, within the tolerance, under some density" },
  "space.order": { layer: "space", severity: "error", summary: "The steps do not strictly increase under some density" },
  "space.count": { layer: "space", severity: "error", summary: "The scale has more steps than its maximum" },
  "space.target": { layer: "space", severity: "error", summary: "A control target is below 24px (WCAG 2.5.8), or below 44px at the enhanced level (WCAG 2.5.5), under some density" },
} as const satisfies Record<string, RuleMeta>;

export type SpaceRuleId = keyof typeof SPACE_RULES;

export function spaceFinding(rule: SpaceRuleId, message: string, entities: string[], permutation?: Permutation): Finding {
  const meta: RuleMeta = SPACE_RULES[rule];
  const f: Finding = { severity: meta.severity, layer: meta.layer, rule, message, entities };
  if (permutation !== undefined && Object.keys(permutation).length > 0) f.permutation = permutation;
  return f;
}

/** Findings virtu depth check reports on depth declarations. The design is docs/design/DEPTH.md. */
export const DEPTH_RULES = {
  "depth.invalid": {
    layer: "depth",
    severity: "error",
    summary: "A depth declaration has the wrong shape, a name that is not its file name, a name another declaration has, a shadow or direction missing for a theme, or one token bound twice",
  },
  "depth.context": {
    layer: "depth",
    severity: "error",
    summary: "The theme context is not the system's, its values or default differ from the system's, or a bound token changes with a context the declaration does not vary by",
  },
  "depth.token-unknown": { layer: "depth", severity: "error", summary: "A depth declaration names a token the system lacks under some permutation" },
  "depth.token-type": { layer: "depth", severity: "error", summary: "A named token is not of the type its place needs: color for a surface, border, or shadow color, shadow for a level's token" },
  "depth.unbound": { layer: "depth", severity: "warning", summary: "A shadow token beside the bound ones is not bound, so it keeps the system's value" },
  "depth.order": { layer: "depth", severity: "error", summary: "A higher level's shadow has less blur, a shorter offset, or a lower alpha than the level below, in some theme" },
  "depth.stacking": { layer: "depth", severity: "error", summary: "A surface's luminance goes against the declared stacking direction, under some permutation" },
  "depth.contrast": { layer: "depth", severity: "error", summary: "A foreground falls below its contrast floor on a level's surface, under some permutation" },
  "depth.boundary": { layer: "depth", severity: "error", summary: "A level that needs a perceivable edge reaches 3:1 against the level below with neither its surface, its border, nor its shadow (WCAG 1.4.11)" },
  "depth.ceiling": { layer: "depth", severity: "error", summary: "A declared stack of placements runs out of levels: an entry lands on or below the one it sits on, so nothing shows it is above" },
  "depth.indistinct": { layer: "depth", severity: "warning", summary: "Two neighbouring levels have the same surface, border, and shadow under some permutation, so nothing shows which is higher" },
  "depth.undecidable": {
    layer: "depth",
    severity: "error",
    summary: "Contrast cannot be decided: a color outside srgb and display-p3, a none component, a translucent surface, or a P3 color outside sRGB with no hex fallback",
  },
} as const satisfies Record<string, RuleMeta>;

export type DepthRuleId = keyof typeof DEPTH_RULES;

export function depthFinding(rule: DepthRuleId, message: string, entities: string[], permutation?: Permutation): Finding {
  const meta: RuleMeta = DEPTH_RULES[rule];
  const f: Finding = { severity: meta.severity, layer: meta.layer, rule, message, entities };
  if (permutation !== undefined && Object.keys(permutation).length > 0) f.permutation = permutation;
  return f;
}

/** Findings virtu shape check reports on shape declarations. The design is docs/design/SHAPE.md. */
export const SHAPE_RULES = {
  "shape.invalid": { layer: "shape", severity: "error", summary: "A shape declaration has the wrong shape, a name that is not its file name, a name another declaration has, or a nest naming a role it gives no radius" },
  "shape.roles": { layer: "shape", severity: "error", summary: "A shape gives no radius to a role every shape must give one: control, card, dialog, avatar" },
  "shape.order": { layer: "shape", severity: "warning", summary: "A larger surface has a smaller radius than a smaller one (control, card, dialog), so the corners read out of scale" },
  "shape.nest": { layer: "shape", severity: "error", summary: "A role nested inside another does not have the outer radius less the inset, within 1px, so the two curves are not concentric" },
  "shape.token-unknown": { layer: "shape", severity: "error", summary: "An edge names a token the system lacks under some permutation" },
  "shape.token-type": { layer: "shape", severity: "error", summary: "An edge's token is not a color" },
  "shape.edge-contrast": { layer: "shape", severity: "error", summary: "An edge that shows a component's boundary falls below 3:1 against the surface it sits on somewhere along its paint, under some permutation (WCAG 1.4.11)" },
  "shape.motion": { layer: "shape", severity: "error", summary: "A turning edge goes round faster than once a second" },
  "shape.undecidable": { layer: "shape", severity: "error", summary: "An edge's contrast cannot be decided: a color outside srgb and display-p3, a none component, or a translucent color" },
} as const satisfies Record<string, RuleMeta>;
export type ShapeRuleId = keyof typeof SHAPE_RULES;

/** Findings virtu ornament check reports on ornament declarations. The design is docs/design/ORNAMENTS.md. */
export const ORNAMENT_RULES = {
  "ornament.invalid": { layer: "ornament", severity: "error", summary: "An ornament declaration has the wrong shape, a name that is not its file name, a name another declaration has, or a motion its anchor cannot run" },
  "ornament.asset": { layer: "ornament", severity: "error", summary: "The SVG is missing, is not an SVG, or holds a script, an event handler, foreign content, or a reference outside itself" },
  "ornament.budget": { layer: "ornament", severity: "error", summary: "The SVG has more bytes than the ornament's budget" },
  "ornament.covers": { layer: "ornament", severity: "error", summary: "The part of the drawing inside the element is deeper than the gutter, so it can cover the content" },
  "ornament.flash": { layer: "ornament", severity: "error", summary: "A twinkle flashes more than three times a second (WCAG 2.3.1)" },
  "ornament.pace": { layer: "ornament", severity: "warning", summary: "A looping animation's cycle is shorter than a second, which draws the eye from the content" },
  "ornament.token-unknown": { layer: "ornament", severity: "error", summary: "The ornament's color names a token the system lacks under some permutation" },
  "ornament.token-type": { layer: "ornament", severity: "error", summary: "The ornament's color token is not a color" },
} as const satisfies Record<string, RuleMeta>;
export type OrnamentRuleId = keyof typeof ORNAMENT_RULES;

/** Findings virtu season check reports on season declarations. The design is docs/design/SEASONS.md. */
export const SEASON_RULES = {
  "season.invalid": { layer: "season", severity: "error", summary: "A season declaration has the wrong shape, a name that is not its file name, a name another declaration has, a day that is not MM-DD, or two seasons of one name" },
  "season.overlap": { layer: "season", severity: "error", summary: "Two seasons share a day, so which one shows depends on the order they are listed" },
  "season.unknown": { layer: "season", severity: "error", summary: "A season puts an ornament on a slot, but no ornament declaration of that name is found" },
  "season.member": { layer: "season", severity: "error", summary: "An ornament a season wears does not pass virtu ornament check, so the season does not pass either" },
} as const satisfies Record<string, RuleMeta>;
export type SeasonRuleId = keyof typeof SEASON_RULES;

function make(meta: RuleMeta, rule: string, message: string, entities: string[], permutation?: Permutation): Finding {
  const f: Finding = { severity: meta.severity, layer: meta.layer, rule, message, entities };
  if (permutation !== undefined && Object.keys(permutation).length > 0) f.permutation = permutation;
  return f;
}
export const shapeFinding = (rule: ShapeRuleId, message: string, entities: string[], permutation?: Permutation): Finding => make(SHAPE_RULES[rule], rule, message, entities, permutation);
export const ornamentFinding = (rule: OrnamentRuleId, message: string, entities: string[], permutation?: Permutation): Finding => make(ORNAMENT_RULES[rule], rule, message, entities, permutation);
export const seasonFinding = (rule: SeasonRuleId, message: string, entities: string[], permutation?: Permutation): Finding => make(SEASON_RULES[rule], rule, message, entities, permutation);

export function colorFinding(rule: ColorRuleId, message: string, entities: string[], permutation?: Permutation): Finding {
  const meta: RuleMeta = COLOR_RULES[rule];
  const f: Finding = { severity: meta.severity, layer: meta.layer, rule, message, entities };
  if (permutation !== undefined && Object.keys(permutation).length > 0) f.permutation = permutation;
  return f;
}

export function buildFinding(rule: BuildRuleId, message: string, entities: string[], permutation?: Permutation): Finding {
  const meta: RuleMeta = BUILD_RULES[rule];
  const f: Finding = { severity: meta.severity, layer: meta.layer, rule, message, entities };
  if (permutation !== undefined && Object.keys(permutation).length > 0) f.permutation = permutation;
  return f;
}

export function finding(rule: RuleId, message: string, entities: string[], permutation?: Permutation): Finding {
  const meta: RuleMeta = RULES[rule];
  const f: Finding = { severity: meta.severity, layer: meta.layer, rule, message, entities };
  if (permutation !== undefined && Object.keys(permutation).length > 0) f.permutation = permutation;
  return f;
}

/**
 * Runs a check under every permutation and merges identical findings, so each
 * finding carries only the contexts it depends on (see collapse).
 */
export function perPermutation(a: Analysis, run: (p: Permutation, r: Resolution) => Finding[]): Finding[] {
  const groups = new Map<string, { finding: Finding; perms: Permutation[] }>();
  for (const p of a.permutations) {
    for (const f of run(p, a.resolution(p))) {
      const key = `${f.rule}\u0000${f.message}\u0000${f.entities.join("\u0000")}`;
      const group = groups.get(key) ?? { finding: f, perms: [] };
      group.perms.push(p);
      groups.set(key, group);
    }
  }
  const out: Finding[] = [];
  for (const { finding: f, perms } of groups.values()) {
    for (const p of collapse(perms, a.loaded.resolver)) {
      const copy: Finding = { severity: f.severity, layer: f.layer, rule: f.rule, message: f.message, entities: f.entities };
      if (Object.keys(p).length > 0) copy.permutation = p;
      out.push(copy);
    }
  }
  return out;
}

export type Rule = { ids: readonly RuleId[]; run(a: Analysis): Finding[] };

const domainRules: Rule = {
  ids: ["L0.domain-missing", "L0.cell-missing", "L0.excluded-without-reason", "L0.ref-unknown", "L0.ref-wrong-mechanism", "L0.ref-wrong-domain"],
  run(a) {
    const out: Finding[] = [];
    for (const id of DOMAIN_IDS) {
      const decl = a.loaded.domains[id];
      if (!decl) {
        out.push(finding("L0.domain-missing", `domain ${id} is neither governed nor excluded`, [id]));
        continue;
      }
      if (decl.kind === "excluded") {
        if (decl.reason.trim() === "") out.push(finding("L0.excluded-without-reason", `domain ${id} is excluded without a reason`, [id]));
        continue;
      }
      for (const m of MECHANISMS) {
        const cell = decl.cells[m];
        if (cell === undefined) {
          out.push(finding("L0.cell-missing", `domain ${id} does not answer its ${m} cell; use null for deliberately nothing`, [id, m]));
          continue;
        }
        if (cell === null) continue;
        const found = a.lookup(cell);
        if (found.length === 0) {
          out.push(finding("L0.ref-unknown", `domain ${id}'s ${m} cell names "${cell}", which is not declared`, [id, m, cell]));
        } else if (!found.includes(m)) {
          out.push(finding("L0.ref-wrong-mechanism", `domain ${id}'s ${m} cell names "${cell}", which is a ${found.join(" and a ")}`, [id, m, cell]));
        } else if (m === "vocabulary") {
          const enumerated = a.loaded.vocabularies[cell];
          if (enumerated && enumerated.domain !== id) {
            out.push(finding("L0.ref-wrong-domain", `domain ${id}'s vocabulary cell names "${cell}", which is declared for ${enumerated.domain}`, [id, cell]));
          }
        }
      }
    }
    return out;
  },
};

const tokenRules: Rule = {
  ids: ["L1.alias-unresolved", "L1.alias-cycle", "L1.type-invalid", "L1.value-invalid"],
  run(a) {
    return perPermutation(a, (_p, r) => r.problems.map((pr) => finding(pr.rule, pr.message, pr.entities)));
  },
};

const vocabularyRules: Rule = {
  ids: ["L1.type-unfit", "L1.vocabulary-empty"],
  run(a) {
    const out: Finding[] = [];
    for (const id of DOMAIN_IDS) {
      const decl = a.loaded.domains[id];
      if (decl?.kind !== "governed") continue;
      const ref = decl.cells.vocabulary;
      if (typeof ref !== "string" || !a.lookup(ref).includes("vocabulary")) continue;
      const fit = FITTING_TYPES[id];
      const enumerated = a.loaded.vocabularies[ref];
      if (enumerated) {
        if (!fit.members) {
          out.push(finding("L1.type-unfit", `vocabulary ${ref} lists enumerated members, but ${id} takes tokens of type ${fit.types.join(", ")}`, [ref, id]));
        }
        if (Object.keys(enumerated.members).length === 0) out.push(finding("L1.vocabulary-empty", `vocabulary ${ref} has no members`, [ref]));
        continue;
      }
      out.push(
        ...perPermutation(a, (_p, r) => {
          const tokens = selectTokens(r, ref);
          if (tokens.length === 0) return [finding("L1.vocabulary-empty", `vocabulary ${ref} has no tokens`, [ref])];
          const found: Finding[] = [];
          for (const t of tokens) {
            if (t.type === null || fit.types.includes(t.type)) continue;
            const allowed = fit.types.length > 0 ? `takes ${fit.types.join(", ")}` : "takes enumerated members only";
            found.push(finding("L1.type-unfit", `${t.path} is a ${t.type} token in the ${id} vocabulary, which ${allowed}`, [t.path, id]));
          }
          return found;
        }),
      );
    }
    return out;
  },
};

const contextRules: Rule = {
  ids: [
    "context.modifier-undeclared",
    "context.modifier-missing",
    "context.unused",
    "context.too-few-values",
    "context.default-unknown",
    "context.default-missing",
    "context.changes-nothing",
  ],
  run(a) {
    const out: Finding[] = [];
    const { contexts, resolver } = a.loaded;
    const cited = new Map<string, string[]>();
    for (const id of DOMAIN_IDS) {
      const decl = a.loaded.domains[id];
      if (decl?.kind === "governed" && typeof decl.cells.context === "string") {
        cited.set(decl.cells.context, [...(cited.get(decl.cells.context) ?? []), id]);
      }
    }
    for (const [name, modifier] of Object.entries(resolver.modifiers)) {
      if (!(name in contexts)) {
        out.push(finding("context.modifier-undeclared", `resolver modifier ${name} has no context in virtu.json, so its dialect is unknown`, [name]));
      }
      const values = modifier.values.map((v) => v.name);
      if (values.length < 2) {
        out.push(finding("context.too-few-values", `context ${name} has ${values.length} value${values.length === 1 ? "" : "s"}; a context needs at least two`, [name]));
      }
      if (modifier.default === null) {
        if (values.length > 0) out.push(finding("context.default-missing", `modifier ${name} has no default, so Virtu uses its first value, ${values[0]}`, [name]));
      } else if (!values.includes(modifier.default)) {
        out.push(finding("context.default-unknown", `modifier ${name}'s default "${modifier.default}" is not one of ${values.join(", ")}`, [name]));
      }
    }
    for (const name of Object.keys(contexts)) {
      if (!(name in resolver.modifiers)) {
        out.push(finding("context.modifier-missing", `context ${name} has no modifier in the resolver document, so it has no values`, [name]));
      }
      if (!cited.has(name)) out.push(finding("context.unused", `context ${name} is not named by any domain's context cell`, [name]));
    }
    // A context cited by a domain must change at least one token in that domain's vocabulary.
    for (const id of DOMAIN_IDS) {
      const decl = a.loaded.domains[id];
      if (decl?.kind !== "governed" || typeof decl.cells.context !== "string") continue;
      const ctx = decl.cells.context;
      const values = resolver.modifiers[ctx]?.values.map((v) => v.name) ?? [];
      if (values.length < 2) continue;
      const vocab = decl.cells.vocabulary;
      if (typeof vocab !== "string" || vocab in a.loaded.vocabularies || !a.lookup(vocab).includes("vocabulary")) {
        out.push(finding("context.changes-nothing", `domain ${id} names context ${ctx}, but has no token vocabulary for it to change`, [id, ctx]));
        continue;
      }
      if (!changesVocabulary(a, ctx, vocab)) {
        out.push(finding("context.changes-nothing", `context ${ctx} overrides no token in ${id}'s vocabulary ${vocab}`, [id, ctx, vocab]));
      }
    }
    return out;
  },
};

function changesVocabulary(a: Analysis, ctx: string, vocab: string): boolean {
  const byRest = new Map<string, Map<string, string>>();
  for (const p of a.permutations) {
    const rest = Object.entries(p)
      .filter(([k]) => k !== ctx)
      .map(([k, v]) => `${k}=${v}`)
      .join(" ");
    const values = byRest.get(rest) ?? new Map<string, string>();
    for (const t of selectTokens(a.resolution(p), vocab)) {
      const value = JSON.stringify(t.raw);
      const prev = values.get(t.path);
      if (prev !== undefined && prev !== value) return true;
      values.set(t.path, value);
    }
    byRest.set(rest, values);
  }
  return false;
}

const machineRules: Rule = {
  ids: ["machine.initial-unknown", "machine.state-unknown", "machine.nondeterministic", "machine.unreachable"],
  run(a) {
    const out: Finding[] = [];
    for (const [name, m] of Object.entries(a.loaded.machines)) {
      const states = new Set(m.states);
      const initialKnown = states.has(m.initial);
      if (!initialKnown) out.push(finding("machine.initial-unknown", `machine ${name}'s initial state ${m.initial} is not one of its states`, [name, m.initial]));
      const next = new Map<string, string>();
      for (const t of m.transitions) {
        for (const s of [t.from, t.to]) {
          if (!states.has(s)) out.push(finding("machine.state-unknown", `machine ${name} has a transition ${t.from} --${t.event}--> ${t.to}, but no state ${s}`, [name, s]));
        }
        const key = `${t.from}\u0000${t.event}`;
        const prev = next.get(key);
        if (prev !== undefined && prev !== t.to) {
          out.push(finding("machine.nondeterministic", `machine ${name}: ${t.from} on ${t.event} leads to both ${prev} and ${t.to}`, [name, t.from, t.event]));
        } else next.set(key, t.to);
      }
      if (!initialKnown) continue;
      const reached = new Set([m.initial]);
      const queue = [m.initial];
      for (let s = queue.shift(); s !== undefined; s = queue.shift()) {
        for (const t of m.transitions) {
          if (t.from === s && states.has(t.to) && !reached.has(t.to)) {
            reached.add(t.to);
            queue.push(t.to);
          }
        }
      }
      for (const s of m.states) {
        if (!reached.has(s)) out.push(finding("machine.unreachable", `machine ${name}: state ${s} cannot be reached from ${m.initial}`, [name, s]));
      }
    }
    return out;
  },
};

export const STRUCTURE_RULES: readonly Rule[] = [domainRules, tokenRules, vocabularyRules, contextRules, machineRules];

const usageRules: Rule = {
  ids: ["L3.entry-unknown", "L3.situation-conflict"],
  run(a) {
    const out: Finding[] = [];
    const bySituation = new Map<string, { situation: string; entry: string }>();
    for (const u of a.loaded.usage) {
      const e = a.entry(u.entry);
      if (!e.ok) {
        out.push(finding("L3.entry-unknown", `usage "${u.situation}" maps to ${u.entry}: ${e.why}`, [u.situation, u.entry]));
        continue;
      }
      const key = `${u.situation.trim().toLowerCase().replace(/\s+/g, " ")}\u0000${e.domain}`;
      const prev = bySituation.get(key);
      if (prev && prev.entry !== u.entry) {
        out.push(
          finding("L3.situation-conflict", `usage "${u.situation}" maps to both ${prev.entry} and ${u.entry} in domain ${e.domain}`, [u.situation, prev.entry, u.entry]),
        );
      } else if (!prev) bySituation.set(key, u);
    }
    return out;
  },
};

export const USAGE_RULES: readonly Rule[] = [usageRules];
