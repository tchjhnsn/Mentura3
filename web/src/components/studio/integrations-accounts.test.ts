// R18, P26: a person may connect more than one account of one service; each further account carries its own name.
import { describe, expect, it } from "vitest";
import { ACCOUNT_LABEL_MAX, accountProblem } from "./integrations";

describe("another account of one service (P26)", () => {
  it("needs a name", () => {
    expect(accountProblem("  ", [null])).toMatch(/name/);
  });
  it("refuses a name already held, ignoring case and spaces", () => {
    expect(accountProblem(" work ", [null, "Work"])).toMatch(/already/);
  });
  it("refuses a name that is too long", () => {
    expect(accountProblem("x".repeat(ACCOUNT_LABEL_MAX + 1), [null])).toMatch(/characters/);
  });
  it("takes a new name beside the unnamed first account", () => {
    expect(accountProblem("Personal", [null, "Work"])).toBeNull();
  });
});
