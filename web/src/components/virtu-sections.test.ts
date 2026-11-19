import { describe, expect, it } from "vitest";
import { plainName, whyNot } from "./virtu-sections";
import { appearanceButtonOn } from "@/lib/themes";

describe("Virtu's sections", () => {
  it("say why a design can't be published, in one line", () => {
    const pass = { verdict: "pass" as const, findings: [], refused: [], looks: undefined };
    expect(whyNot(null)).toBeNull();
    expect(whyNot(pass)).toBeNull();
    expect(whyNot({ ...pass, verdict: "fail", findings: [{ severity: "warning", layer: "l", rule: "r", message: "only a warning", entities: [] }, { severity: "error", layer: "l", rule: "r", message: "Body text is 3.1:1 on the background.", entities: [] }] })).toBe("Body text is 3.1:1 on the background.");
    expect(whyNot({ ...pass, refused: [{ edit: { token: "x", context: null, value: 1 }, why: "no such token" }] })).toBe("Not applied: no such token");
  });
  it("name catalog entries plainly", () => {
    expect(plainName("holly-corners")).toBe("Holly corners");
    expect(plainName("northern-year")).toBe("Northern year");
  });
});

describe("the Appearance button cookie", () => {
  it("is on only when it says on", () => {
    expect(appearanceButtonOn("on")).toBe(true);
    expect(appearanceButtonOn(undefined)).toBe(false);
    expect(appearanceButtonOn("yes")).toBe(false);
  });
});
