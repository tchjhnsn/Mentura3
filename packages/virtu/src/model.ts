// Types for the whole system. The shapes of virtu.json follow
// schema/virtu.schema.json, which owns them. load.ts is the only module that
// builds these values from files; every other module trusts them.

export const DOMAIN_IDS = [
  "color",
  "typography",
  "iconography",
  "space",
  "depth",
  "motion",
  "semantics",
  "state",
  "time",
] as const;
export type DomainId = (typeof DOMAIN_IDS)[number];

export const MECHANISMS = ["vocabulary", "context", "machine"] as const;
export type Mechanism = (typeof MECHANISMS)[number];

/** A reference to something declared, or null for deliberately nothing. */
export type Cell = string | null;

/** Cells are partial because a missing cell is a finding (L0.cell-missing), not a load failure. */
export type DomainDecl =
  | { kind: "governed"; cells: Partial<Record<Mechanism, Cell>> }
  | { kind: "excluded"; reason: string };

export type Dialect = "ambient" | "propagating";

export type ContextDecl = { dialect: Dialect; description: string | null };

export type VocabularyDecl = {
  domain: DomainId;
  description: string | null;
  members: Record<string, string>;
};

export type Transition = { from: string; event: string; to: string };

export type Machine = {
  description: string | null;
  initial: string;
  states: string[];
  transitions: Transition[];
};

export type RelationKind = "contrast" | "ratio" | "count";
export type Subkind = "stated" | "compiled";

export type Relation = { id: string; subkind: Subkind; description: string | null } & (
  | { kind: "contrast"; foreground: string[]; background: string[]; min: number }
  | { kind: "ratio"; tokens: string[]; ratio: number; tolerance: number }
  | { kind: "count"; group: string; max: number }
);

export type UsageEntry = { situation: string; entry: string };

// JSON as read from disk.
export type Json = null | boolean | number | string | Json[] | JsonObject;
export type JsonObject = { [key: string]: Json };

/** One token source: a DTCG token tree, read from a file or written inline in the resolver. */
export type Source = { origin: string; tree: JsonObject };

export type Modifier = {
  /** Context values in declaration order, each with its token sources. */
  values: Array<{ name: string; sources: Source[] }>;
  default: string | null;
};

export type OrderItem = { kind: "set"; name: string; sources: Source[] } | { kind: "modifier"; name: string };

export type Resolver = {
  path: string;
  modifiers: Record<string, Modifier>;
  order: OrderItem[];
};

/** One assignment of a value to every context: context name to value. */
export type Permutation = Readonly<Record<string, string>>;

export type Layer = "load" | "L0" | "L1" | "context" | "machine" | "L2" | "L3" | "build" | "audit" | "color" | "background" | "type" | "motion" | "icons" | "space" | "depth";
export type Severity = "error" | "warning";

export type Finding = {
  severity: Severity;
  layer: Layer;
  /** Stable id, such as "L0.domain-missing". */
  rule: string;
  message: string;
  /** The names, paths, or ids the finding is about. */
  entities: string[];
  /** The contexts the finding depends on. Absent when it holds under every permutation. */
  permutation?: Permutation;
};

export type Loaded = {
  dir: string;
  name: string;
  description: string | null;
  medium: "screen";
  domains: Partial<Record<DomainId, DomainDecl>>;
  vocabularies: Record<string, VocabularyDecl>;
  contexts: Record<string, ContextDecl>;
  machines: Record<string, Machine>;
  relations: Relation[];
  usage: UsageEntry[];
  resolver: Resolver;
  /** Shape problems found while reading. Malformed items are dropped and reported here. */
  findings: Finding[];
};

export type LoadResult = { ok: true; loaded: Loaded } | { ok: false; error: string };

// The color generator's file, color.virtu.json. Its shape follows
// schema/color.schema.json. Scale, step, and role names are checked against
// each other in load.ts; context values are checked against the system in
// color.ts, because they belong to the resolver.

/** The ladder: step names from lightest to darkest, spaced geometrically in Y + 0.05 between two relative luminances. */
export type ColorLadder = { steps: string[]; lightest: number; darkest: number };

/** A hue in OKLCH degrees and the most chroma any step may have. */
export type ColorScale = { name: string; hue: number; chroma: number };

/** A color token path, its scale, and its preferred step (a ladder step name) for each context value. */
export type ColorRole = { path: string; scale: string; steps: Record<string, string> };

export type ColorSpec = {
  /** Absolute path of color.virtu.json. */
  path: string;
  /** Where steps may lie: sRGB only, or Display P3 with an sRGB fallback for each step that gains chroma. */
  gamut: "srgb" | "p3";
  ladder: ColorLadder;
  /** How far above each relation's minimum the generator places every pair. */
  margin: number;
  scales: ColorScale[];
  /** Paths relative to the system folder. roles is keyed by context value. */
  output: { scales: { file: string; group: string }; roles: Record<string, string> };
  roles: ColorRole[];
};

export type ColorSpecResult = { ok: true; spec: ColorSpec; findings: Finding[] } | { ok: false; error: string };

// The shadcn/ui adapter's file, shadcn.virtu.json. Its shape follows
// schema/shadcn.schema.json. Names are checked in load.ts; token paths and
// the dark value are checked against the system in shadcn.ts.

/** The variables every shadcn/ui component set reads, in the order shadcn's theming docs list them. Build warns for each one left unmapped. */
export const SHADCN_CORE = [
  "background",
  "foreground",
  "card",
  "card-foreground",
  "popover",
  "popover-foreground",
  "primary",
  "primary-foreground",
  "secondary",
  "secondary-foreground",
  "muted",
  "muted-foreground",
  "accent",
  "accent-foreground",
  "destructive",
  "border",
  "input",
  "ring",
] as const;

/** Variables for opt-in components (charts, the sidebar) and the radius. Leaving them out is silent. */
export const SHADCN_OPTIONAL = [
  "chart-1",
  "chart-2",
  "chart-3",
  "chart-4",
  "chart-5",
  "sidebar",
  "sidebar-foreground",
  "sidebar-primary",
  "sidebar-primary-foreground",
  "sidebar-accent",
  "sidebar-accent-foreground",
  "sidebar-border",
  "sidebar-ring",
  "radius",
] as const;

export const SHADCN_VARIABLES: readonly string[] = [...SHADCN_CORE, ...SHADCN_OPTIONAL];

export type ShadcnMap = {
  /** Absolute path of shadcn.virtu.json. */
  path: string;
  /** The value of the color domain's context that shadcn's dark variant means, or null for none. */
  dark: string | null;
  /** shadcn variable name, without the leading --, to a token path. In SHADCN_VARIABLES order. */
  variables: Array<{ name: string; token: string }>;
};

export type ShadcnMapResult = { ok: true; map: ShadcnMap; findings: Finding[] } | { ok: false; error: string };

// A background declaration, <name>.background.json. Its shape follows
// schema/background.schema.json. Token paths are checked against the system
// in background.ts. The design is docs/design/BACKGROUNDS.md.

/** The cost classes, a closed list. The animated ones (Tier 3) are refused in version 0. */
export const BACKGROUND_COSTS = ["static-css", "static-asset", "filter", "composited-animation", "canvas", "webgl"] as const;
export type BackgroundCost = (typeof BACKGROUND_COSTS)[number];
export const ANIMATED_COSTS: readonly BackgroundCost[] = ["composited-animation", "canvas", "webgl"];

/** The spaces a gradient may interpolate in. oklch takes the shorter hue arc. */
export const INTERPOLATIONS = ["srgb", "srgb-linear", "oklab", "oklch"] as const;
export type Interpolation = (typeof INTERPOLATIONS)[number];

export const FILL_TYPES = ["solid", "gradient", "pattern", "noise"] as const;

/** A token path and the opacity it is painted at, 0 to 1. */
export type BackgroundPaint = { color: string; opacity: number };

/** One fill. Fills are painted bottom first; the first is the base. A pattern or noise paints its color at any opacity up to the stated one. */
export type BackgroundFill =
  | ({ type: "solid" } & BackgroundPaint)
  | { type: "gradient"; interpolation: Interpolation; stops: BackgroundPaint[]; opacity: number }
  | ({ type: "pattern" | "noise" } & BackgroundPaint);

export type Background = {
  /** Absolute path of the declaration. */
  path: string;
  name: string;
  description: string | null;
  cost: BackgroundCost;
  fills: BackgroundFill[];
  /** Each token that may be drawn on the background, with its WCAG 2 minimum ratio. */
  foreground: Array<{ token: string; min: number }>;
  fallback: string;
};

export type BackgroundsResult = { ok: true; backgrounds: Background[]; findings: Finding[] } | { ok: false; error: string };

/** The DTCG $type values a vocabulary may hold in each domain, and whether enumerated members fit. */
export const FITTING_TYPES: Record<DomainId, { types: readonly string[]; members: boolean }> = {
  color: { types: ["color"], members: false },
  typography: { types: ["typography", "fontFamily", "fontWeight", "dimension", "number"], members: false },
  iconography: { types: ["dimension"], members: true },
  space: { types: ["dimension"], members: false },
  depth: { types: ["shadow", "number"], members: false },
  motion: { types: ["duration", "cubicBezier", "transition"], members: false },
  semantics: { types: [], members: true },
  state: { types: [], members: true },
  time: { types: ["duration"], members: true },
};

// A type declaration, <name>.type.json: a font pairing and the scale it
// supplies. Its shape follows schema/type.schema.json. Token paths are checked
// against the system in type.ts. The design is docs/design/TYPOGRAPHY.md.

/** The roles a pairing names. display and body are required; mono is optional. */
export const TYPE_ROLES = ["display", "body", "mono"] as const;
export type TypeRole = (typeof TYPE_ROLES)[number];

/** The licenses version 0 allows, as SPDX ids: the SIL Open Font License 1.1 only. */
export const TYPE_LICENSES = ["OFL-1.1"] as const;

/** CSS generic font families (CSS Fonts 4). A fallback stack ends in one. */
export const GENERIC_FAMILIES = [
  "serif",
  "sans-serif",
  "monospace",
  "cursive",
  "fantasy",
  "system-ui",
  "ui-serif",
  "ui-sans-serif",
  "ui-monospace",
  "ui-rounded",
  "math",
  "emoji",
  "fangsong",
] as const;

/** Font metrics in font units, as the font's head, OS/2, and hhea tables give them. descender is at most 0. */
export type FontMetrics = { unitsPerEm: number; capHeight: number; xHeight: number; ascender: number; descender: number };

export type TypeFace = {
  family: string;
  /** The families that stand in until the font loads or where it cannot, ending in a generic family. */
  fallback: string[];
  /** An SPDX license id. */
  license: string;
  /** The next/font/google import name and the Fontsource package. */
  source: { google: string; fontsource: string };
  weights: number[];
  metrics: FontMetrics;
  /** The fontFamily token whose property the implementation sets, or null when the system has none for the role. */
  token: string | null;
};

/** A size in px: one value, or for a fluid scale the value at the smallest and at the largest viewport. */
export type TypeSize = number | { min: number; max: number };

export type TypeStep = { name: string; size: TypeSize; lineHeight: number; token: string | null };

export type TypeScale = {
  /** The ratio between neighbouring steps, or for a fluid scale one ratio at each end. Null when the steps follow none. */
  ratio: number | { min: number; max: number } | null;
  tolerance: number;
  /** For a fluid scale, the viewport widths in px between which sizes grow. */
  viewport: { min: number; max: number } | null;
  /** The name of the step body text is set in. */
  body: string;
  /** The widest line of body text, in ch, or null when the pairing does not set one. */
  measure: number | null;
  /** From smallest to largest. */
  steps: TypeStep[];
};

export type TypeDecl = {
  /** Absolute path of the declaration. */
  path: string;
  name: string;
  description: string | null;
  roles: Partial<Record<TypeRole, TypeFace>>;
  scale: TypeScale;
};

export type TypesResult = { ok: true; types: TypeDecl[]; findings: Finding[] } | { ok: false; error: string };

// A motion declaration, <name>.motion.json: a named set of transitions, the
// durations and easings they use, and a reduced-motion variant of each. Its
// shape follows schema/motion.schema.json. Token paths are checked against the
// system in motion.ts. The design is docs/design/MOTION.md.

/** The CSS properties a transition may animate. */
export const MOTION_PROPERTIES = [
  "opacity",
  "color",
  "background-color",
  "border-color",
  "outline-color",
  "box-shadow",
  "filter",
  "transform",
  "translate",
  "rotate",
  "scale",
  "top",
  "right",
  "bottom",
  "left",
  "inset",
  "width",
  "height",
  "max-height",
  "clip-path",
  "background-position",
] as const;
export type MotionProperty = (typeof MOTION_PROPERTIES)[number];

/**
 * The properties whose animation is movement: a change of position, size,
 * shape, or rotation (WCAG 2.3.3's motion animation). filter is here because
 * the WCAG errata no longer exclude blurring. A reduced variant animates none
 * of them.
 */
export const MOVEMENT_PROPERTIES: readonly MotionProperty[] = [
  "filter",
  "transform",
  "translate",
  "rotate",
  "scale",
  "top",
  "right",
  "bottom",
  "left",
  "inset",
  "width",
  "height",
  "max-height",
  "clip-path",
  "background-position",
];

/** A duration the declaration supplies, in ms, and the duration token it sets, if any. */
export type MotionDuration = { name: string; ms: number; token: string | null };
/** An easing the declaration supplies, as a CSS cubic-bezier's four numbers, and the cubicBezier token it sets, if any. */
export type MotionEasing = { name: string; points: [number, number, number, number]; token: string | null };

/** What a transition becomes under prefers-reduced-motion: reduce. No properties means it does not animate at all. */
export type MotionVariant = { duration: string | null; easing: string | null; properties: MotionProperty[] };

export type MotionTransition = {
  name: string;
  /** The name of one of the declaration's durations. */
  duration: string;
  /** The name of one of the declaration's easings. */
  easing: string;
  properties: MotionProperty[];
  /** How many times it runs: 1 for a transition between two states, more or infinite for a repeating animation. */
  iterations: number | "infinite";
  /** Whether the implementation gives the reader a way to pause it (WCAG 2.2.2). */
  pausable: boolean;
  reduced: MotionVariant;
};

export type MotionDecl = {
  /** Absolute path of the declaration. */
  path: string;
  name: string;
  description: string | null;
  /** The shortest and longest duration the set allows, in ms. */
  bounds: { min: number; max: number };
  durations: MotionDuration[];
  easings: MotionEasing[];
  transitions: MotionTransition[];
};

export type MotionResult = { ok: true; motions: MotionDecl[]; findings: Finding[] } | { ok: false; error: string };

// An icon declaration, <name>.icons.json: an icon set, its grid and stroke,
// the sizes and colors icons take from the system, and the meanings it maps
// to icon names. Its shape follows schema/icons.schema.json. Token paths are
// checked against the system, and names against the package's committed name
// list, in icons.ts. The design is docs/design/ICONOGRAPHY.md.

/** The licenses version 0 allows for an icon set, as SPDX ids. */
export const ICON_LICENSES = ["ISC", "MIT", "Apache-2.0"] as const;

export type IconSet = {
  /** The library's name for people, such as Lucide. */
  library: string;
  /** The npm package the implementation imports, and its exact version. */
  package: string;
  version: string;
  /** An SPDX license id. */
  license: string;
};

export type IconSize = { name: string; token: string };

export type IconDecl = {
  /** Absolute path of the declaration. */
  path: string;
  name: string;
  description: string | null;
  set: IconSet;
  /** The side of the square the icons are drawn on, in the library's units. */
  grid: number;
  /** The stroke width in grid units, or null for a set drawn in fills. */
  stroke: number | null;
  sizes: IconSize[];
  /** The color tokens an icon may be drawn in. */
  colors: string[];
  /** The color tokens icons are drawn on. */
  surfaces: string[];
  /** Meaning to the icon name the package exports, in declaration order. */
  meanings: Array<{ meaning: string; icon: string }>;
};

/** A package's committed name list: data/icon-names/<package>@<version>.json. */
export type IconNameList = {
  library: string;
  package: string;
  version: string;
  license: string;
  grid: number;
  stroke: { adjustable: true; default: number } | { weights: Record<string, number> };
  names: Set<string>;
};

export type IconsResult = { ok: true; icons: IconDecl[]; findings: Finding[] } | { ok: false; error: string };

// A space declaration, <name>.space.json: a base unit, a scale of steps as
// multiples of it or as explicit values, a variant per value of the system's
// density context, and the target sizes of interactive controls. Its shape
// follows schema/space.schema.json. Token paths are checked against the system
// in space.ts. The design is docs/design/SPACE.md.

/** WCAG 2.5.8's minimum target (24 CSS px) or 2.5.5's enhanced one (44 CSS px). */
export const TARGET_LEVELS = ["minimum", "enhanced"] as const;
export type TargetLevel = (typeof TARGET_LEVELS)[number];

/** A value in px: one for every density, or one per density value. */
export type SpacePx = number | Record<string, number>;

/** A step's or a target's value: a multiple of the base unit, or explicit px. */
export type SpaceAmount = { multiple: number } | { px: SpacePx };

export type SpaceStep = { name: string; amount: SpaceAmount; token: string | null };
export type SpaceTarget = { name: string; amount: SpaceAmount; level: TargetLevel; token: string | null };

/** How a density value changes the scale: base and grid times scale, unless grid is stated. */
export type SpaceDensityValue = { scale: number; grid: number | null };

export type SpaceDecl = {
  /** Absolute path of the declaration. */
  path: string;
  name: string;
  description: string | null;
  /** The base unit at the default density, in px. */
  base: number;
  /** The increment every value must be a whole multiple of at the default density, in px. Defaults to base. */
  grid: number;
  /** How far, in px, a value may sit off the grid. */
  tolerance: number;
  /** The most steps the scale may have. */
  maxSteps: number;
  /** The system's density context and a variant per value, or null when the scale has one variant. */
  density: { context: string; default: string; values: Record<string, SpaceDensityValue> } | null;
  /** From smallest to largest. */
  steps: SpaceStep[];
  targets: SpaceTarget[];
};

export type SpacesResult = { ok: true; spaces: SpaceDecl[]; findings: Finding[] } | { ok: false; error: string };

// A depth declaration, <name>.depth.json: ordered elevation levels, each a
// surface color token paired with a shadow per theme, whose colors are token
// references. Its shape follows schema/depth.schema.json. Token paths are
// checked against the system in depth.ts. The design is docs/design/DEPTH.md.

/** Which way surfaces go as levels rise: lighter, darker, or either (not checked). */
export const STACKING_DIRECTIONS = ["lighter", "darker", "any"] as const;
export type StackingDirection = (typeof STACKING_DIRECTIONS)[number];

/** One shadow layer, as DTCG's shadow type, in px, with its color a token reference and an alpha that multiplies the token's. */
export type ShadowLayer = { color: string; alpha: number; offsetX: number; offsetY: number; blur: number; spread: number };

export type DepthLevel = {
  name: string;
  /** The color token the level's surface is painted in. */
  surface: string;
  /** The shadow under each theme value, or under "*" when the declaration has no theme context. */
  shadow: Record<string, ShadowLayer[]>;
  /** The shadow token the implementation sets, if any. */
  token: string | null;
  /** A color token for a 1px border, if any. */
  border: string | null;
  /** Whether the level's edge must be perceivable at 3:1 against the level below (WCAG 1.4.11). */
  boundary: boolean;
};

export type DepthDecl = {
  /** Absolute path of the declaration. */
  path: string;
  name: string;
  description: string | null;
  /** The system's theme context, or null when shadows are the same in every theme. */
  theme: { context: string; default: string } | null;
  /** The stacking direction under each theme value, or under "*". */
  stacking: Record<string, StackingDirection>;
  /** Text colors every level's surface must carry, with their contrast floors. */
  foreground: Array<{ token: string; min: number }>;
  /** From lowest to highest. */
  levels: DepthLevel[];
};

export type DepthsResult = { ok: true; depths: DepthDecl[]; findings: Finding[] } | { ok: false; error: string };
