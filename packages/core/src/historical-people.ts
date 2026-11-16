/**
 * Every person with a page in Scholē, across the eras (see `historical.ts` for what a page holds and why), and the
 * lookups the pages use. Pure: no I/O.
 */
import { workById } from "./topic-pages";
import type { CollectionItem } from "./collections";
import { ERAS, REL_ORDER, type Contemporary, type Era, type Named, type Passage, type Person, type Relation, type Rel } from "./historical";
import { ANCIENT } from "./people-ancient";
import { MEDIEVAL } from "./people-medieval";
import { RENAISSANCE } from "./people-renaissance";
import { ENLIGHTENMENT } from "./people-enlightenment";
import { FOUNDING } from "./people-founding";

export const PEOPLE: readonly Person[] = [...ANCIENT, ...MEDIEVAL, ...RENAISSANCE, ...ENLIGHTENMENT, ...FOUNDING];

export const personById = (id: string): Person | undefined => PEOPLE.find((x) => x.id === id);

/** The page for a name, if there is one ("Plato", "marcus aurelius"). */
export const personNamed = (name: string): Person | undefined => { const n = name.trim().toLowerCase(); return PEOPLE.find((x) => x.name.toLowerCase() === n); };

/** The page for an Open Library author, if there is one. */
export const personByOl = (ol: string): Person | undefined => PEOPLE.find((x) => x.ol === ol);

/** Where a person's page is. */
export const personHref = (x: Pick<Person, "name">, tab?: string): string => `/schole/people/${encodeURIComponent(x.name)}${tab ? `?tab=${tab}` : ""}`;

export const peopleOfEra = (era: Era): Person[] => PEOPLE.filter((x) => x.era === era);
export const eraOf = (x: Person) => ERAS.find((e) => e.id === x.era)!;

export type Tab = "works" | "music" | "theatre" | "people" | "read" | "about" | "time";

/** Whether they made anything Scholē has; Socrates and Alexander did not. */
export const hasWorks = (x: Person): boolean => x.works.length > 0 || (x.by?.length ?? 0) > 0;

export function tabLabel(x: Person, t: Tab): string {
  return { works: hasWorks(x) ? "Works" : "About them", music: "Music", theatre: "Theatre", people: "People", read: "What they read", about: "Read about", time: "Their time" }[t];
}

/**
 * The tabs in order: what they made (or, when nothing, what was made about them); Music and Theatre second when they
 * wrote about them; who they knew and what they read; Read about; then sections rebuilt from their time, or Their time
 * when there is no music section at all.
 */
export function tabsOf(x: Person): Tab[] {
  const own = (["music", "theatre"] as const).filter((t) => x[t]?.stance === "own");
  const rebuilt = (["music", "theatre"] as const).filter((t) => x[t]?.stance === "rebuilt");
  const tabs: Tab[] = ["works", ...own];
  if (x.relations.length || peopleOf(x).length) tabs.push("people");
  if (x.read.length) tabs.push("read");
  tabs.push("about", ...rebuilt);
  if (!x.music) tabs.push("time");
  return tabs;
}

/** A passage as a citation: "Republic III, 401d", or the plain title when the work has no page. */
export function cite(a: Passage): string {
  const w = workById(a.work);
  return `${w ? w.title : a.work} ${a.at}`;
}

/** Every passage that names a work, across people, with who wrote it: for the work page's "Named by". */
export function namedIn(work: string): { by: Person; n: Named }[] {
  return PEOPLE.flatMap((by) => (by.named ?? []).filter((n) => n.work === work).map((n) => ({ by, n })));
}

/** The musicians and poets of their time a page shows as faces, each once, leaving out those already among who they knew. */
export function peopleOf(x: Person): Contemporary[] {
  const seen = new Set<string>(x.relations.map((r) => r.name));
  return [...(x.music?.people ?? []), ...(x.theatre?.people ?? [])].filter((c) => !seen.has(c.name) && seen.add(c.name));
}

/** Who they knew, grouped by the tie, in the order biographies give them. */
export function relationsOf(x: Person): { rel: Rel; people: Relation[] }[] {
  return REL_ORDER.map((rel) => ({ rel, people: x.relations.filter((r) => r.rel === rel) })).filter((g) => g.people.length);
}

/** Where a person's page starts: a work page's first recording, or a recording of its own. */
export function startOf(x: Person): { title: string; work?: string; item?: CollectionItem } {
  if (typeof x.start !== "string") return { title: x.start.title, item: x.start };
  const w = workById(x.start);
  return { title: w?.title ?? x.start, work: x.start };
}
