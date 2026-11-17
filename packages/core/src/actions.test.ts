import { describe, expect, it } from "vitest";
import { TIERS, describeTier, isTier, offered } from "./actions.ts";

describe("action tiers", () => {
  it("lists each tier once, from asking nothing to never offered", () => {
    expect(TIERS.map((t) => t.id)).toEqual(["read", "own", "shared", "outside", "never"]);
    expect(TIERS.map((t) => t.asks)).toEqual(["nothing", "undo", "keep", "send", "not offered"]);
  });

  it("describes a tier and knows a tier from anything else", () => {
    expect(describeTier("shared").asks).toBe("keep");
    expect(describeTier("outside").says).toContain("outside Reflect");
    expect([isTier("own"), isTier("write"), isTier(undefined)]).toEqual([true, false, false]);
  });

  it("never offers a never action and offers every other", () => {
    expect(TIERS.filter((t) => offered(t.id)).map((t) => t.id)).toEqual(["read", "own", "shared", "outside"]);
  });
});
