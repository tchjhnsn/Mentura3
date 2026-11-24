"use client";

// Which business the console is showing, for the parts drawn outside its pages (the sidebar, the switcher, the top
// bar). A sample business (data.ts, the design prototype) is known here; a real one is read from Naive by the business
// layout (src/app/studio/v/[slug]/layout.tsx), which hands it over with <BusinessSeen>.
import { useEffect, useSyncExternalStore } from "react";
import { VENTURES } from "./data";
import { hueOf, type Business } from "./business-data";

export type { Business } from "./business-data";


let seen = new Map<string, Business>();
const listeners = new Set<() => void>();
const subscribe = (f: () => void) => { listeners.add(f); return () => listeners.delete(f); };

/** Puts a real business where the sidebar and top bar can read it. Renders nothing. */
export function BusinessSeen({ value }: { value: Business }) {
  useEffect(() => {
    const was = seen.get(value.id);
    if (was && was.name === value.name && was.functions.join() === value.functions.join()) return;
    seen = new Map(seen).set(value.id, value);
    for (const f of listeners) f();
  }, [value]);
  return null;
}

/** The business at `slug`: a sample from data.ts, a real one once its layout has read it, else a placeholder named by
 * its id with no functions, so nothing shows a sample's data for a real business. */
export function useBusiness(slug: string | null): Business | null {
  const map = useSyncExternalStore(subscribe, () => seen, () => seen);
  if (!slug) return null;
  const sample = VENTURES.find((v) => v.slug === slug);
  if (sample) return { id: sample.slug, name: sample.name, hue: sample.hue, real: false, functions: [] };
  const id = decodeURIComponent(slug);
  return map.get(id) ?? { id, name: id, hue: hueOf(id), real: true, functions: [] };
}
