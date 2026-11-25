// The Business Studio's pages, as the app's one sidebar lists them in place of Mentura's (src/components/sidebar.tsx):
// C3 the studio's pages, C4 one business's, C25 one function of a business, C26 a business's integrations. Each level replaces the whole sidebar.
import {
  ActivityIcon, BlocksIcon, BotIcon, BoxIcon, BuildingIcon, CalendarDaysIcon, FileTextIcon, FolderIcon, GaugeIcon, GlobeIcon, HandshakeIcon,
  HomeIcon, LandmarkIcon, LayoutGridIcon, LibraryIcon, LifeBuoyIcon, ListTodoIcon, MegaphoneIcon, PencilLineIcon, PlugIcon, PlusIcon,
  PuzzleIcon, ScaleIcon, ServerIcon, SettingsIcon, ShieldIcon, TagIcon, TargetIcon, TruckIcon, UsersRoundIcon, WorkflowIcon,
  DatabaseIcon,
} from "lucide-react";
import { fnOf, ventureHref, ventureOf, type FunctionId } from "./data";
import { fnsAt } from "./connect-data";
import { functionGroups, toolPath, universalTools, type Tool, type ToolKind } from "./tools";
import type { Business } from "./business-data";
import { CATEGORIES } from "./integrations";

/** `drills`: the row replaces the whole sidebar (a function), shown with a chevron. `quiet`: muted, like Add a function. */
/** `count`: a number at the row's end, as Typeform shows each category's count. */
export type NavItem = { href: string; label: string; icon: typeof HomeIcon; n: string; exact?: boolean; drills?: boolean; quiet?: boolean; count?: number };
/** `back`: the row at the top of a replaced sidebar that returns to the level above it. */
export type NavGroup = { label?: string; more?: boolean; back?: { href: string; label: string }; items: NavItem[] };

export const STUDIO_NAV: NavGroup[] = [
  { items: [
    { href: "/studio", label: "Home", icon: HomeIcon, n: "S1", exact: true },
    { href: "/studio/new", label: "New business", icon: PlusIcon, n: "S2" },
  ] },
  { label: "Find", items: [
    { href: "/studio/library", label: "Library", icon: LibraryIcon, n: "S3", exact: true },
  ] },
  { label: "Manage", items: [
    { href: "/studio/usage", label: "Usage", icon: GaugeIcon, n: "S6" },
    { href: "/studio/settings", label: "Settings", icon: SettingsIcon, n: "S7" },
  ] },
];

/** C4 one business: its universal tools, one row per function it has turned on (each replaces the sidebar with that
 * function's tools), then the pages used less often. Drawn from Naive's tool catalog (./tools.ts). */
export const ventureNav = (slug: string, biz?: Business | null): NavGroup[] => {
  const h = (r: string) => ventureHref(slug, r);
  const real = biz?.real ?? false;
  const tool = (t: Tool, exact = false): NavItem => t.id === "connections"
    // Connections opens the Integrations level (C26), which replaces the sidebar as a function does.
    ? { href: h("integrations"), label: "Integrations", icon: PlugIcon, n: "V20", drills: true }
    : { href: h(toolPath(t, real)), label: t.title, icon: TOOL_ICONS[t.id] ?? KIND_ICONS[t.kind], n: `T-${t.id}`, exact };
  const universal = universalTools();
  const daily = universal.filter((t) => !FOOT.includes(t.id));
  const foot = universal.filter((t) => FOOT.includes(t.id));
  const fns = businessFunctions(slug, biz);
  return [
    { items: daily.map((t) => tool(t, t.id === "home")) },
    { label: "Functions", items: [
      ...fns.map((id): NavItem => ({ href: h(`functions/${id}`), label: fnOf(id).label, icon: FN_ICONS[id], n: "V12", drills: true })),
      // Turning a function on is built only in the prototype (V11); a real business has no page for it yet.
      ...(real ? [] : [{ href: h("functions"), label: "Add a function", icon: PlusIcon, n: "V11", exact: true, quiet: true }]),
    ] },
    { items: [
      ...foot.filter((t) => t.id !== "settings").map((t) => tool(t)),
      ...(real ? [] : [
        { href: h("automations"), label: "Automations", icon: WorkflowIcon, n: "V8" },
        { href: h("skills"), label: "Skills and plugins", icon: PuzzleIcon, n: "V17" },
      ]),
      ...foot.filter((t) => t.id === "settings").map((t) => tool(t)),
    ] },
  ].filter((g) => g.items.length > 0);
};

/** C25 one function of a business: a back row to the business, the function's overview, then its tools under the
 * process group each serves (APQC level 2), in phase order. Replaces the business's sidebar entirely, as Vercel's
 * sections replace its project sidebar. */
export const functionNav = (slug: string, fn: FunctionId): NavGroup[] => {
  const h = (r: string) => ventureHref(slug, r);
  return [
    { back: { href: h(""), label: fnOf(fn).label }, items: [{ href: h(`functions/${fn}`), label: "Overview", icon: LayoutGridIcon, n: "V12", exact: true }] },
    ...functionGroups(fn).map(({ group, tools }): NavGroup => ({
      label: group.name,
      items: tools.map((t) => ({ href: h(toolPath(t)), label: t.title, icon: TOOL_ICONS[t.id] ?? KIND_ICONS[t.kind], n: `T-${t.id}` })),
    })),
  ];
};

/** C26 a business's integrations, after Vercel's Marketplace sidebar: a back row to the business, the ways to browse,
 * the business's functions, then the categories that have something in the catalog, each with its count. */
export const integrationsNav = (slug: string, biz?: Business | null): NavGroup[] => {
  const h = (r: string) => ventureHref(slug, `integrations${r}`);
  return [
    { back: { href: ventureHref(slug, ""), label: "Integrations" }, items: [
      { href: h(""), label: "All", icon: LayoutGridIcon, n: "V20", exact: true },
      { href: h("/connected"), label: "Connected", icon: PlugIcon, n: "V25" },
      { href: h("/sources"), label: "Sources of truth", icon: DatabaseIcon, n: "V27" },
    ] },
    { label: "Functions", items: businessFunctions(slug, biz).map((id): NavItem => ({ href: h(`/function/${id}`), label: fnOf(id).label, icon: FN_ICONS[id], n: "V22" })) },
    { label: "Categories", items: CATEGORIES.filter((c) => c.members.length).map((c): NavItem => ({ href: h(`/category/${c.id}`), label: c.name, icon: TagIcon, n: "V21", count: c.members.length })) },
  ].filter((g) => g.items.length > 0);
};

/** The functions a business has: a real one's that its venture.json turns on, a sample's that its commitment level needs. */
export const businessFunctions = (slug: string, biz?: Business | null): FunctionId[] =>
  biz?.real ? biz.functions : fnsAt(ventureOf(slug).commitment);

/** Records, Connections and Settings sit at the foot of a business's sidebar: used less often than the rest. */
const FOOT = ["records", "connections", "settings"];

const TOOL_ICONS: Record<string, typeof HomeIcon> = {
  home: HomeIcon, decisions: ScaleIcon, agents: BotIcon, files: FolderIcon, records: FileTextIcon, tasks: ListTodoIcon, people: UsersRoundIcon,
  calendar: CalendarDaysIcon, activity: ActivityIcon, connections: PlugIcon, settings: SettingsIcon,
};
const KIND_ICONS: Record<ToolKind, typeof HomeIcon> = { view: GaugeIcon, editor: PencilLineIcon, workflow: WorkflowIcon, storage: FolderIcon, connection: PlugIcon };
const FN_ICONS: Record<FunctionId, typeof HomeIcon> = {
  strategy: TargetIcon, products: BoxIcon, "marketing-and-sales": MegaphoneIcon, "supply-chain": TruckIcon, "service-delivery": HandshakeIcon,
  "customer-service": LifeBuoyIcon, "human-capital": UsersRoundIcon, it: ServerIcon, finance: LandmarkIcon, assets: BuildingIcon,
  "risk-and-compliance": ShieldIcon, "external-relationships": GlobeIcon, capabilities: BlocksIcon,
};

export const slugOf = (path: string) => path.match(/^\/studio\/v\/([^/]+)/)?.[1] ?? null;

