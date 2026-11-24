// A business as the console's sidebar and top bar need it, sample or real (./business.ts keeps the one on screen).
// No "use client": the business layout, a server component, builds a real one from what Naive returns.
import { FUNCTIONS, type FunctionId } from "./data";

export type Business = { id: string; name: string; hue: number; real: boolean; functions: FunctionId[] };

export const hueOf = (id: string) => [...id].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 7);

/** A real business as Naive describes it: its id, name and the functions it has turned on (venture.json departments). */
export function realBusiness(v: { id: string; name: string; departments: string[] }): Business {
  return { id: v.id, name: v.name, hue: hueOf(v.id), real: true, functions: v.departments.filter((d): d is FunctionId => FUNCTIONS.some((f) => f.id === d)) };
}
