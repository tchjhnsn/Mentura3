// The Venture Studio's pages, as the app's one sidebar lists them under Mentura's (src/components/sidebar.tsx):
// C3 the studio's pages, C4 one venture's.
import {
  ActivityIcon, BlocksIcon, BotIcon, FileTextIcon, GaugeIcon, HomeIcon, LayoutGridIcon, LibraryIcon, MapIcon, PlugIcon, PlusIcon,
  PresentationIcon, PuzzleIcon, ScaleIcon, SendIcon, SettingsIcon, TargetIcon, WorkflowIcon,
} from "lucide-react";
import { ventureHref } from "./data";

export type NavItem = { href: string; label: string; icon: typeof HomeIcon; n: string; exact?: boolean };
export type NavGroup = { label?: string; more?: boolean; items: NavItem[] };

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
    { href: "/studio/map", label: "Screen map", icon: MapIcon, n: "S0" },
  ] },
];

export const ventureNav = (slug: string): NavGroup[] => {
  const h = (r: string) => ventureHref(slug, r);
  return [
    { items: [
      { href: h(""), label: "Overview", icon: LayoutGridIcon, n: "V1", exact: true },
      { href: h("agents"), label: "Agents", icon: BotIcon, n: "V6" },
      { href: h("decisions"), label: "Decisions", icon: ScaleIcon, n: "V15" },
    ] },
    { label: "Make", items: [
      { href: h("files"), label: "Records and documents", icon: FileTextIcon, n: "V2" },
      { href: h("strategy"), label: "Strategy", icon: TargetIcon, n: "V4" },
      { href: h("decks/investor"), label: "Decks", icon: PresentationIcon, n: "V5" },
    ] },
    { label: "Run", items: [
      { href: h("functions"), label: "Functions", icon: BlocksIcon, n: "V11" },
      { href: h("skills"), label: "Skills and plugins", icon: PuzzleIcon, n: "V17" },
      { href: h("automations"), label: "Automations", icon: WorkflowIcon, n: "V8" },
      { href: h("outreach"), label: "Outreach", icon: SendIcon, n: "V13" },
    ] },
    { label: "Watch", items: [
      { href: h("activity"), label: "Activity", icon: ActivityIcon, n: "V9" },
    ] },
    { label: "Connect", items: [
      { href: h("connectors"), label: "Connectors", icon: PlugIcon, n: "V14" },
      { href: h("settings"), label: "Settings", icon: SettingsIcon, n: "V16" },
    ] },
  ];
};

export const slugOf = (path: string) => path.match(/^\/studio\/v\/([^/]+)/)?.[1] ?? null;

