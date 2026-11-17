import { describe, expect, it } from "vitest";
import { confirmsAdult } from "./adult";

describe("adult confirmation", () => {
  it("takes only an explicit true", () => {
    expect(confirmsAdult({ email: "a@b.c", adult: true })).toBe(true);
    for (const b of [{ adult: "true" }, { adult: 1 }, { adult: false }, {}, null, undefined, "adult"]) expect(confirmsAdult(b)).toBe(false);
  });
});
