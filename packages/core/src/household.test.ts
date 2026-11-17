import { describe, expect, it } from "vitest";
import { arrangement, cleanMember, counts, householdPart, type Household } from "./household";

const Y = 2026;
const h: Household = {
  id: "h",
  members: [
    { id: "a", name: "Ann", relation: "self", born: 1990, account: true, you: true, keptBy: null, role: "admin" },
    { id: "b", name: "Ben", relation: "spouse", account: true, you: false, keptBy: null, role: "member" },
    { id: "c", name: "Cal", relation: "child", born: 2019, dependent: true, account: false, you: false, keptBy: "u1", role: "member" },
    { id: "d", name: "Dot", relation: "parent", born: 1950, account: false, you: false, keptBy: "u1", role: "member" },
  ],
};

describe("household", () => {
  it("cleans a member's facts", () => {
    expect(() => cleanMember({ name: " " }, Y)).toThrow(/name/);
    expect(cleanMember({ name: "Dot", relation: "parent", born: "1950", dependent: "on", junk: 1 }, Y)).toEqual({ name: "Dot", relation: "parent", born: 1950, dependent: true });
    expect(cleanMember({ name: "X", relation: "boss", born: "3000" }, Y)).toEqual({ name: "X", relation: "other" });
  });

  it("counts adults and children by age, by relation when age is unknown", () => {
    expect(counts(h.members, Y)).toEqual({ adults: 3, children: 1 });
    expect(counts([{ relation: "child" }], Y)).toEqual({ adults: 0, children: 1 });
  });

  it("says how the person lives from who is there, in the Census's terms", () => {
    expect(arrangement([{ relation: "self" }])).toBe("alone");
    expect(arrangement([{ relation: "self" }, { relation: "roommate" }])).toBe("nonfamily");
    expect(arrangement(h.members)).toBe("family");
  });

  it("fetches each part by path", () => {
    expect(householdPart(h, "", Y)).toMatchObject({ arrangement: "Family household", adults: 3, children: 1 });
    expect(householdPart(h, "members/c", Y)).toMatchObject({ name: "Cal", relation: "Son or daughter", age: 7, dependent: true, account: false });
    expect(householdPart(h, "counts", Y)).toEqual({ adults: 3, children: 1 });
    expect(householdPart(h, "members/zz", Y)).toBeNull();
    expect(householdPart(null, "", Y)).toMatchObject({ members: [] });
  });
});
