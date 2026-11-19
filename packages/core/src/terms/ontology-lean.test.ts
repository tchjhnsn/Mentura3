import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { ONTOLOGY, type Ontology } from "./ontology";
import { LEAN_ONTOLOGY_PATH, leanName, leanOntology } from "./ontology-lean";

const committed = readFileSync(new URL(`../../../../${LEAN_ONTOLOGY_PATH}`, import.meta.url), "utf8");
const copy = (): Ontology => structuredClone(ONTOLOGY);

describe("the ontology as Lean", () => {
  it("is current: the committed file is what the generator writes (node scripts/ontology-lean.ts)", () => {
    expect(committed).toBe(leanOntology(ONTOLOGY));
  });

  it("names every kept noun and every category once", () => {
    const live = ONTOLOGY.nouns.filter((n) => n.status !== "retired");
    for (const n of live) expect(committed).toContain(`  | .«${leanName(n.noun)}» => ${JSON.stringify(n.noun)}`);
    expect(committed).toContain("| .«beingAffected» => \"being affected\"");
  });

  it("writes the certificate the TypeScript check computes", () => {
    expect(committed).toContain("  | .«friend» => .«substance»");
    expect(committed).toContain("  | .«household» => 1");
  });

  it("refuses an ontology that fails its check", () => {
    const o = copy();
    o.nouns.find((n) => n.noun === "person")!.broader = ["friend"];
    expect(() => leanOntology(o)).toThrow(/U1/);
  });

  it("refuses two nouns with one Lean name", () => {
    const o = copy();
    o.nouns.push({ ...o.nouns.find((n) => n.noun === "friend group")!, noun: "friend-group", kinds: [] });
    expect(() => leanOntology(o)).toThrow(/both friendGroup/);
  });

  it("keeps a docstring from closing early", () => {
    const o = copy();
    o.nouns.find((n) => n.noun === "meal")!.meaning = "A meal -/ eaten.";
    expect(leanOntology(o)).toContain("A meal - / eaten.");
  });
});
