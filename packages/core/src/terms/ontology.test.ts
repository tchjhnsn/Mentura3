import { describe, expect, it } from "vitest";
import { APPS } from "../life";
import { CATEGORIES, COMMUNITIES, GOODS, ONTOLOGY, categoryOfKind, checkOntology, communityOfKind, goodOfKind, nounOfKind, type Ontology } from "./ontology";

const KINDS = APPS.flatMap((a) => a.kinds.map((k) => `${a.id}:${k.id}`));
const copy = (): Ontology => structuredClone(ONTOLOGY);

describe("Reflect's ontology", () => {
  it("passes every rule against the life kinds", () => {
    expect(checkOntology(ONTOLOGY, KINDS).problems).toEqual([]);
  });

  it("has Aristotle's ten Categories as its top categories, in his order", () => {
    expect(ONTOLOGY.top_categories.map((t) => t.name)).toEqual([...CATEGORIES]);
  });

  it("files every life kind under one category", () => {
    for (const a of APPS) for (const k of a.kinds) expect(categoryOfKind(a.id, k.id), `${a.id}:${k.id}`).not.toBeNull();
    expect(categoryOfKind("friends", "friend")).toBe("substance");
    expect(categoryOfKind("work", "quality")).toBe("quality");
    expect(categoryOfKind("work", "work")).toBe("doing");
    expect(nounOfKind("home", "water")?.noun).toBe("need");
  });

  it("files presentation under doing as a shared noun with no life kinds, so K1 and K2 still hold", () => {
    const p = ONTOLOGY.nouns.find((n) => n.noun === "presentation")!;
    expect(p).toMatchObject({ broader: ["doing"], app: null, kinds: [], good: "soul", community: "polis" });
    expect(checkOntology(ONTOLOGY, KINDS).categoryOf.get("presentation")).toBe("doing");
    expect(checkOntology(ONTOLOGY, KINDS).problems.filter((x) => /^K[12]/.test(x))).toEqual([]);
  });

  it("U1 finds a cycle", () => {
    const o = copy();
    o.nouns.find((n) => n.noun === "person")!.broader = ["friend"];
    expect(checkOntology(o, KINDS).problems.some((p) => p.startsWith("U1"))).toBe(true);
  });

  it("U3 finds an orphan", () => {
    const o = copy();
    o.nouns.find((n) => n.noun === "meal")!.broader = [];
    expect(checkOntology(o, KINDS).problems).toContain("U3 orphan: meal has nothing broader");
  });

  it("U4 finds a noun under two categories", () => {
    const o = copy();
    o.nouns.find((n) => n.noun === "meal")!.broader = ["artifact", "quality"];
    expect(checkOntology(o, KINDS).problems).toContain("U4 meal reaches two top categories: substance, quality");
  });

  it("B1 finds a BFO class that does not match its IRI", () => {
    const o = copy();
    o.top_categories[0]!.bfo.class = "process";
    expect(checkOntology(o, KINDS).problems.some((p) => p.startsWith("B1 substance"))).toBe(true);
  });

  it("S1 and S2: information records are sources, outside the ten Categories, never nouns", () => {
    expect(ONTOLOGY.sources.records).toEqual(["journal entry", "reflection", "conversation", "import"]);
    expect(ONTOLOGY.sources.bfo).toEqual({ class: "generically dependent continuant", iri: "http://purl.obolibrary.org/obo/BFO_0000031" });
    const o = copy();
    const meal = o.nouns.find((n) => n.noun === "meal")!;
    o.nouns.push({ ...meal, noun: "journal entry", kinds: [] });
    o.sources.bfo = { class: "process", iri: "http://purl.obolibrary.org/obo/BFO_0000015" };
    const p = checkOntology(o, KINDS).problems;
    expect(p).toContain("S1 journal entry is a source of field values, not a noun");
    expect(p.some((x) => x.startsWith("S2 sources"))).toBe(true);
  });

  it("K1 and K2 find a kind listed by no noun, by two, or one that does not exist", () => {
    const o = copy();
    const meal = o.nouns.find((n) => n.noun === "meal")!;
    meal.kinds = ["home:nothing"];
    o.nouns.find((n) => n.noun === "friend")!.kinds.push("friends:group");
    const p = checkOntology(o, KINDS).problems;
    expect(p).toContain("K1 life kind home:meal is listed by no noun");
    expect(p).toContain("K1 life kind friends:group is listed by friend group and friend");
    expect(p).toContain("K2 meal lists home:nothing, which is not a life kind");
  });

  it("refuses a top category that is not one of the ten", () => {
    const o = copy();
    o.top_categories[6] = { ...o.top_categories[6]!, name: "information" };
    const p = checkOntology(o, KINDS).problems;
    expect(p).toContain("top category position is missing");
    expect(p).toContain("top category information is not one of Aristotle's ten");
  });

  it("gives every life kind a kind of good and a community, following the apps' goods", () => {
    for (const a of APPS)
      for (const k of a.kinds) {
        expect(GOODS, `${a.id}:${k.id}`).toContain(goodOfKind(a.id, k.id));
        expect(COMMUNITIES, `${a.id}:${k.id}`).toContain(communityOfKind(a.id, k.id));
      }
    expect(goodOfKind("body", "health")).toBe("body");
    expect(goodOfKind("home", "water")).toBe("body");
    expect(goodOfKind("work", "quality")).toBe("soul");
    expect(goodOfKind("friends", "friend")).toBe("external");
    expect(communityOfKind("mate", "date")).toBe("union");
    expect(communityOfKind("kin", "relative")).toBe("village");
    expect(communityOfKind("polis", "election")).toBe("polis");
  });

  it("G1 and C1 find a good or a community outside the fixed lists", () => {
    const o = copy();
    const meal = o.nouns.find((n) => n.noun === "meal")! as unknown as Record<string, unknown>;
    meal.good = "pleasure";
    meal.community = "tribe";
    const p = checkOntology(o, KINDS).problems;
    expect(p).toContain("G1 meal: good pleasure is not one of body, external, soul");
    expect(p).toContain("C1 meal: community tribe is not one of person, union, household, village, polis");
  });
});
