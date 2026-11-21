// Scholē's screen inventory (Virtu format 0, design-system-theory docs/design/INVENTORY.md): every screen, part and
// shared component by number, with the Mobbin screens and flows each screen is built after. The JSON is the source.
import raw from "./schole.inventory.json";

/** Scholē is three things of equal weight (Listen, Learn, Shelf), with its dialectic (Talk) and the person's own pages
 * (You). "map" is the screen map, which belongs to no area. */
export type Area = "listen" | "learn" | "shelf" | "talk" | "you" | "map";
export const AREAS: { id: Exclude<Area, "map">; label: string }[] = [
  { id: "listen", label: "Listen" },
  { id: "learn", label: "Learn" },
  { id: "shelf", label: "Shelf" },
  { id: "talk", label: "Talk" },
  { id: "you", label: "You" },
];

/** A screen or part with status "planned" is in the inventory before it is built; it may have no page yet. */
export type InvStatus = "planned";
export type InvPart = { id: string; name: string; job?: string; status?: InvStatus };
export type InvScreen = {
  id: string;
  area: Area;
  title: string;
  path: string;
  job: string;
  status?: InvStatus;
  refs?: string[];
  /** Why refs are empty, or what to read into them. */
  note?: string;
  parts?: InvPart[];
  states?: string[];
};
export type InvComponent = { id: string; name: string; where: string[] };
export type Inventory = {
  app: string;
  title: string;
  prefixes: Record<string, string>;
  /** Each Mobbin screen or flow id the inventory cites, with the app and what it shows. */
  refNames: Record<string, string>;
  screens: InvScreen[];
  components: InvComponent[];
};

export const INVENTORY = raw as unknown as Inventory;
export const SCREENS = INVENTORY.screens;
export const COMPONENTS = INVENTORY.components;
export const screensIn = (area: Area): InvScreen[] => SCREENS.filter((s) => s.area === area);

const pattern = (p: string) => new RegExp(`^${p.replace(/\[[^\]]+\]/g, "[^/]+")}/?$`);
const params = (p: string) => (p.match(/\[[^\]]+\]/g) ?? []).length;
// A literal segment beats a [param] one: /schole/courses/argument is L6, not the instrument course at [instrument].
const BY_SPECIFICITY = [...SCREENS].sort((a, b) => params(a.path) - params(b.path));
/** The inventory screen a path shows, or null for a path outside Scholē. */
export function screenAt(path: string): InvScreen | null {
  return BY_SPECIFICITY.find((s) => pattern(s.path).test(path)) ?? null;
}
export const screenOf = (id: string): InvScreen => SCREENS.find((s) => s.id === id)!;

/** The app and flow a Mobbin link points into, for the screen map's "Built after" lines. */
export const refName = (url: string): string => {
  const id = url.split("?")[0]?.split("/").pop() ?? "";
  return INVENTORY.refNames[id] ?? "Mobbin";
};
