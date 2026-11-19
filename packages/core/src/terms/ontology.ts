// Reflect's ontology (packages/core/src/terms/ontology.json), in Naive's format, and its check. The top categories are
// Aristotle's ten Categories, each mapped to a BFO class; nouns name what life records are about and say what they are
// a kind of. The rules carry Naive's names (packages/naive/src/terms/upper-test.ts) so the two checks read alike:
//   U1  no noun is broader than itself through a chain of broader links
//   U2  a top category has nothing broader
//   U3  every noun has something broader
//   U4  every noun reaches exactly one top category
//   B1  each top category's BFO class is the label of its IRI
//   K1  every life record kind is listed by exactly one noun, and K2 every listed kind exists
//   G1  every noun names its kind of good: body, external or soul (Nicomachean Ethics I.8, 1098b12)
//   C1  every noun names its community: person, union, household, village or polis (Politics I.2)
// Pure: it reads nothing and is given the ontology and the kinds.
import ontologyJson from "./ontology.json" with { type: "json" };

export type Bfo = { class: string; iri: string };
export type TopCategory = { name: string; greek: string; meaning: string; standard: string; bfo: Bfo };
export type Noun = {
  noun: string;
  level: string;
  meaning: string;
  standard: string;
  status: "kept" | "retired";
  app: string | null;
  broader: string[];
  good: Good;
  community: Community;
  kinds: string[];
};
export type Ontology = { version: string; note: string; top_categories: TopCategory[]; nouns: Noun[] };

// The JSON is read as data and checked by checkOntology, so it is typed as the shape the check holds it to.
export const ONTOLOGY = ontologyJson as unknown as Ontology;

const OBO = "http://purl.obolibrary.org/obo/";
/** The BFO 2020 classes the top categories map to (ISO/IEC 21838-2), by IRI. */
export const BFO_LABELS: ReadonlyMap<string, string> = new Map([
  [`${OBO}BFO_0000004`, "independent continuant"],
  [`${OBO}BFO_0000008`, "temporal region"],
  [`${OBO}BFO_0000015`, "process"],
  [`${OBO}BFO_0000019`, "quality"],
  [`${OBO}BFO_0000020`, "specifically dependent continuant"],
  [`${OBO}BFO_0000023`, "role"],
  [`${OBO}BFO_0000029`, "site"],
  [`${OBO}BFO_0000145`, "relational quality"],
]);

/** The ten Categories, in Aristotle's order (Categories 4, 1b25-2a4). */
export const CATEGORIES = ["substance", "quantity", "quality", "relation", "place", "time", "position", "having", "doing", "being affected"] as const;
export type Category = (typeof CATEGORIES)[number];

/**
 * The three kinds of goods (Nicomachean Ethics I.8, 1098b12-14): goods of the body (health, strength), external goods
 * (wealth, friends, standing) and goods of the soul, which are goods most properly (the virtues and their activity).
 */
export const GOODS = ["body", "external", "soul"] as const;
export type Good = (typeof GOODS)[number];

/**
 * The communities, from the smallest (Politics I.2, 1252a24-1253a1): the person alone, the union of man and woman, the
 * household for everyday wants, the village of several households, and the polis, the complete community.
 */
export const COMMUNITIES = ["person", "union", "household", "village", "polis"] as const;
export type Community = (typeof COMMUNITIES)[number];

export type Verdict = { problems: string[]; categoryOf: Map<string, string> };

/** Checks the ontology against the rules above. `kinds` is every life record kind as `app:kind`. */
export function checkOntology(o: Ontology, kinds: readonly string[]): Verdict {
  const problems: string[] = [];
  const tops = new Set(o.top_categories.map((t) => t.name));
  const live = o.nouns.filter((n) => n.status !== "retired");
  const nouns = new Map<string, Noun>();
  for (const name of CATEGORIES) if (!tops.has(name)) problems.push(`top category ${name} is missing`);
  for (const t of o.top_categories) {
    if (!(CATEGORIES as readonly string[]).includes(t.name)) problems.push(`top category ${t.name} is not one of Aristotle's ten`);
    const label = BFO_LABELS.get(t.bfo.iri);
    if (label === undefined) problems.push(`B1 ${t.name}: BFO IRI ${t.bfo.iri} is not a class the ontology uses`);
    else if (label !== t.bfo.class) problems.push(`B1 ${t.name}: BFO class ${t.bfo.class} does not match ${t.bfo.iri}, which is ${label}`);
  }
  for (const n of live) {
    if (tops.has(n.noun) || nouns.has(n.noun)) problems.push(`${n.noun}: a top category and a noun, or two nouns, share this name`);
    nouns.set(n.noun, n);
  }
  for (const n of live) {
    // The JSON is typed by the shape the check holds it to, so read the two fields as plain values here.
    const good: unknown = n.good;
    const community: unknown = n.community;
    if (!(GOODS as readonly unknown[]).includes(good)) problems.push(`G1 ${n.noun}: good ${String(good)} is not one of ${GOODS.join(", ")}`);
    if (!(COMMUNITIES as readonly unknown[]).includes(community)) problems.push(`C1 ${n.noun}: community ${String(community)} is not one of ${COMMUNITIES.join(", ")}`);
  }
  const retired = new Set(o.nouns.filter((n) => n.status === "retired").map((n) => n.noun));
  for (const n of live) {
    if (n.broader.length === 0) problems.push(`U3 orphan: ${n.noun} has nothing broader`);
    for (const b of n.broader) {
      if (retired.has(b)) problems.push(`${n.noun}: broader ${b} is retired`);
      else if (!tops.has(b) && !nouns.has(b)) problems.push(`${n.noun}: broader ${b} is not a noun or a top category`);
    }
  }

  // Walk up from each noun; a noun seen twice on its own path is a cycle.
  const categoryOf = new Map<string, string>();
  const reached = (name: string, path: string[]): Set<string> => {
    if (tops.has(name)) return new Set([name]);
    if (path.includes(name)) {
      problems.push(`U1 broader cycle through: ${[...path.slice(path.indexOf(name)), name].join(" -> ")}`);
      return new Set();
    }
    const out = new Set<string>();
    for (const b of nouns.get(name)?.broader ?? []) for (const t of reached(b, [...path, name])) out.add(t);
    return out;
  };
  for (const n of live) {
    const t = [...reached(n.noun, [])];
    const [only] = t;
    if (t.length === 1 && only !== undefined) categoryOf.set(n.noun, only);
    else if (t.length > 1) problems.push(`U4 ${n.noun} reaches two top categories: ${t.join(", ")}`);
  }
  // U2 cannot fail in this format: a top category is not a noun, so it has no broader field.

  const listed = new Map<string, string[]>();
  for (const n of live) for (const k of n.kinds) listed.set(k, [...(listed.get(k) ?? []), n.noun]);
  const known = new Set(kinds);
  for (const k of kinds) {
    const by = listed.get(k) ?? [];
    if (by.length === 0) problems.push(`K1 life kind ${k} is listed by no noun`);
    else if (by.length > 1) problems.push(`K1 life kind ${k} is listed by ${by.join(" and ")}`);
  }
  for (const [k, by] of listed) if (!known.has(k)) problems.push(`K2 ${by.join(", ")} lists ${k}, which is not a life kind`);
  return { problems: [...new Set(problems)], categoryOf };
}

const cache = new WeakMap<Ontology, Map<string, string>>();
const categories = (o: Ontology): Map<string, string> => {
  let m = cache.get(o);
  if (!m) cache.set(o, (m = checkOntology(o, []).categoryOf));
  return m;
};

/** The noun a life record kind is about, or null. */
export function nounOfKind(app: string, kind: string, o: Ontology = ONTOLOGY): Noun | null {
  return o.nouns.find((n) => n.status !== "retired" && n.kinds.includes(`${app}:${kind}`)) ?? null;
}

/** The Aristotelian category a life record kind falls under, or null when no noun lists it. */
export function categoryOfKind(app: string, kind: string, o: Ontology = ONTOLOGY): Category | null {
  const n = nounOfKind(app, kind, o);
  if (!n) return null;
  const c = categories(o).get(n.noun);
  return (CATEGORIES as readonly string[]).includes(c ?? "") ? (c as Category) : null;
}

/** The kind of good a life record kind is, from its noun, or null when no noun lists it. */
export function goodOfKind(app: string, kind: string, o: Ontology = ONTOLOGY): Good | null {
  const g: unknown = nounOfKind(app, kind, o)?.good;
  return (GOODS as readonly unknown[]).includes(g) ? (g as Good) : null;
}

/** The community a life record kind belongs to, from its noun, or null when no noun lists it. */
export function communityOfKind(app: string, kind: string, o: Ontology = ONTOLOGY): Community | null {
  const c: unknown = nounOfKind(app, kind, o)?.community;
  return (COMMUNITIES as readonly unknown[]).includes(c) ? (c as Community) : null;
}
