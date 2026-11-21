// Scholē's screen inventory (Virtu format 0, design-system-theory docs/design/INVENTORY.md): every screen, part and
// shared component by number, with the Mobbin screens and flows each screen is built after. The JSON is the source.
import raw from "./schole.inventory.json";

export type InvPart = { id: string; name: string; job?: string };
export type InvScreen = { id: string; title: string; path: string; job: string; refs?: string[]; parts?: InvPart[]; states?: string[] };
export type InvComponent = { id: string; name: string; where: string[] };
export type Inventory = { app: string; title: string; prefixes: Record<string, string>; screens: InvScreen[]; components: InvComponent[] };

export const INVENTORY = raw as unknown as Inventory;
export const SCREENS = INVENTORY.screens;
export const COMPONENTS = INVENTORY.components;

const pattern = (p: string) => new RegExp(`^${p.replace(/\[[^\]]+\]/g, "[^/]+")}/?$`);
/** The inventory screen a path shows, or null for Scholē's older pages outside this rework. */
export function screenAt(path: string): InvScreen | null {
  return SCREENS.find((s) => pattern(s.path).test(path)) ?? null;
}
export const screenOf = (id: string): InvScreen => SCREENS.find((s) => s.id === id)!;

/** The app a Mobbin link points into, for the screen map's "Built after" lines. */
export const refName = (url: string): string => {
  const known: Record<string, string> = {
    "68933767-f763-41a5-94ed-967cadaac831": "Uxcel, Home",
    "371f86d9-e35f-43f9-b287-cc624e1a2de8": "Uxcel, Courses and a course page",
    "25541238-f28f-47a1-a7a2-5dd47c6737e8": "Uxcel, Onboarding",
    "19e96245-9a08-4ef1-a3af-14d154b50482": "Uxcel, Courses by level",
    "6f01f893-2d97-406b-844e-8ebfebf879d0": "Uxcel, Filtering courses",
    "df720b4d-3372-42ec-9122-e2eee8a7ca16": "Uxcel, Career paths",
    "a53088fe-2b34-42c8-b251-4bde66d109ff": "Uxcel, A career path",
    "2eedd9fc-eec6-444c-820e-f8e2e53df6f9": "Uxcel, Starting a lesson",
    "007c3248-0e23-4b9b-b512-1bd4d68494af": "Uxcel, Read theory",
    "dfc9a583-d2ba-4bc1-a71d-e33a5b73e04c": "Uxcel, Lesson detail",
    "0faf91f9-2b61-4c3f-8e0f-3ddf43b60944": "Uxcel, Completing a lesson",
    "ed7e20c6-209d-4f68-92fd-efe412a97471": "Uxcel, Sharing a lesson",
    "efb89081-dc1e-436c-8015-8099448218ec": "Uxcel, Skill graph",
    "f0a078e3-43bf-4848-b2f1-f79583faf833": "Uxcel, Bookmarks",
    "8cb4ef57-3a66-430a-a775-29a2c5d237f6": "Uxcel, Searching Uxcel",
    "ad2d1490-8529-4013-b250-2669e4d2e698": "Uxcel, Starting an assessment",
  };
  const id = url.split("/").pop() ?? "";
  return known[id] ?? "Mobbin";
};
