import { describe, expect, it } from "vitest";
import { MARKET } from "@reflect/core/marketplace";
import { explainPrompt, factsOf, plainExplanation, readExplanation } from "./explain";
import { alternativesFor, featured, profileLine, profileOf, recommend, recommendationFor, sectorName, sectorOf, SAMPLE_PROFILES } from "./recommend";

const base = { functions: ["finance", "marketing-and-sales", "customer-service", "risk-and-compliance"] as const };
const p = (more = {}) => ({ functions: [...base.functions], ...more });

describe("the recommender", () => {
  it("reads NAICS sectors, joining the ranges that are one sector", () => {
    expect(sectorOf("334")).toBe("31");
    expect(sectorOf("4541")).toBe("44");
    expect(sectorOf("513210")).toBe("51");
    expect(sectorName("523")).toBe("finance and insurance");
  });

  it("makes every point of a score a named factor", () => {
    for (const r of recommend(p({ phase: "validation", industry: { code: "523" }, regulation: "heavy", funding: "angel" }))) {
      expect(r.score).toBeCloseTo(r.factors.reduce((s, f) => s + f.points, 0));
      expect(new Set(r.factors.map((f) => f.id)).size).toBe(r.factors.length);
    }
  });

  it("weighs the industry a business is in", () => {
    const plain = recommendationFor("e-signature", p())!;
    const realty = recommendationFor("e-signature", p({ industry: { code: "531" } }))!;
    expect(realty.score - plain.score).toBe(2);
    expect(realty.factors.find((f) => f.id === "industry")?.text).toContain("real estate");
  });

  it("weighs heavy regulation and investors", () => {
    const r = recommendationFor("e-signature", p({ regulation: "heavy", funding: "venture-capital" }))!;
    expect(r.factors.map((f) => f.kind)).toEqual(expect.arrayContaining(["regulation", "funding"]));
  });

  it("sends what matters in a later phase down and marks it later", () => {
    const early = recommend(p({ phase: "discovery" }));
    const crm = early.find((r) => r.category.id === "crm")!;
    expect(crm.later).toBe(true);
    expect(crm.factors.find((f) => f.id === "phase")!.points).toBeLessThan(0);
    expect(recommendationFor("crm", p({ phase: "scale" }))!.later).toBe(false);
  });

  it("puts what a connection covers last", () => {
    const all = recommend(p({ connected: new Set(["stripe"]) }));
    expect(all.at(-1)?.category.id).toBe("payments");
  });

  it("features one integration a category, never a connected or later one, and only catalog integrations", () => {
    const f = featured(p({ phase: "discovery", connected: new Set(["stripe"]) }));
    const ids = new Set(MARKET.map((c) => c.id));
    expect(new Set(f.map((x) => x.rec.category.id)).size).toBe(f.length);
    for (const { integration, rec } of f) {
      expect(ids.has(integration.id)).toBe(true);
      expect(rec.connected || rec.later).toBe(false);
    }
  });

  it("offers a built-in tool as an alternative only when the business has its function", () => {
    expect(alternativesFor("crm", p()).some((a) => a.kind === "built-in" && a.tool === "pipeline")).toBe(true);
    expect(alternativesFor("crm", { functions: ["products"] }).some((a) => a.tool === "pipeline")).toBe(false);
  });

  it("offers what is already connected as an alternative", () => {
    const alt = alternativesFor("crm", { functions: [], connected: new Set(["supabase"]) });
    expect(alt.filter((a) => a.kind === "connected")).toEqual([expect.objectContaining({ label: "Your Supabase", integration: "supabase" })]);
  });

  it("reads a real business's profile, leaving what it does not know unknown", () => {
    expect(profileOf(["finance"], { phase: "validation", industry: { code: "523", label: null }, regulation: "heavy", funding: "angel" }))
      .toEqual({ functions: ["finance"], phase: "validation", industry: { code: "523", label: null }, regulation: "heavy", funding: "angel" });
    expect(profileOf(["finance"], { phase: "launch", industry: { code: "x", label: null }, regulation: "?", funding: 3 }))
      .toEqual({ functions: ["finance"], phase: null, industry: null, regulation: null, funding: null });
    expect(profileLine({ functions: [], ...SAMPLE_PROFILES["founder-raise"] })).toEqual(["investment services", "beachhead phase", "heavily regulated", "angel funded"]);
  });
});

describe("explaining a recommendation", () => {
  const r = recommendationFor("crm", p({ phase: "validation", industry: { code: "541" } }))!;

  it("gives the model only the factors and alternatives", () => {
    const prompt = explainPrompt(r, "Acme");
    for (const f of factsOf(r)) expect(prompt).toContain(`[${f.id}]`);
    expect(factsOf(r).some((f) => f.id === "a1")).toBe(r.alternatives.length > 0);
  });

  it("drops a sentence that cites nothing or an unknown id", () => {
    const out = readExplanation(["Businesses like yours lean on a CRM to keep deals [industry].", "You should buy the best one on the market.", "It is cheap and loved by all [price]."].join("\n"), r);
    expect(out).toEqual([{ text: "Businesses like yours lean on a CRM to keep deals.", cites: ["industry"] }]);
  });

  it("falls back to the factors themselves", () => {
    expect(plainExplanation(r).map((s) => s.cites[0])).toEqual(factsOf(r).filter((f) => f.id !== "connected").slice(0, 5).map((f) => f.id));
  });
});
