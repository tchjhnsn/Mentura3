import { describe, expect, it } from "vitest";
import { APPS, cleanBody, type Field, type Kind } from "./life";
import { bodyOf, bodySchema, isLifeKind, parseBody } from "./life-body";
import { ORIGINS } from "./origins";

const KINDS: Kind[] = APPS.flatMap((a) => [...a.kinds]);

/** A value `cleanBody` would keep for a field. */
function sample(f: Field): string | number | boolean {
  switch (f.kind) {
    case "number":
      return f.signed ? -97.5 : 3;
    case "money":
      return 1250.5;
    case "check":
      return true;
    case "day":
      return "2026-11-19";
    case "choice":
      return f.options?.[0]?.id ?? "";
    case "origins":
      return ORIGINS.slice(0, 2).map((o) => o.id).join(",");
    case "long":
      return "A longer note.\nWith a second line.";
    case "text":
      return "Some words";
  }
}

/** A value of the wrong type for a field. */
const wrong = (f: Field): string | number => (f.kind === "number" || f.kind === "money" || f.kind === "check" ? "not a number" : 42);

describe("life record bodies", () => {
  it("declares kinds with unique ids", () => {
    expect(new Set(KINDS.map((k) => k.id)).size).toBe(KINDS.length);
    expect(KINDS.length).toBeGreaterThan(40);
  });

  for (const k of KINDS) {
    describe(k.id, () => {
      it("builds a schema", () => {
        expect(isLifeKind(k.id)).toBe(true);
        expect(bodySchema(k.id)).not.toBeNull();
      });

      it("passes a full sample body, and what cleanBody keeps of it", () => {
        const body = Object.fromEntries(k.fields.map((f) => [f.key, sample(f)]));
        expect(parseBody(k.id, body)).toEqual({ ok: true, body });
        expect(parseBody(k.id, cleanBody(k, body)).ok).toBe(true);
        expect(parseBody(k.id, {}).ok).toBe(true);
      });

      it("names the field when a value has the wrong type", () => {
        for (const f of k.fields) {
          const p = parseBody(k.id, { [f.key]: wrong(f) });
          expect(p.ok).toBe(false);
          if (!p.ok) expect(p.problems.map((x) => x.field)).toEqual([f.key]);
        }
      });
    });
  }

  it("keeps keys the kind does not declare, untyped", () => {
    const p = parseBody("receipt", { store: "Corner shop", legacy: { any: "shape" } });
    expect(p).toEqual({ ok: true, body: { store: "Corner shop", legacy: { any: "shape" } } });
  });

  it("refuses a choice outside the field's options and a malformed day", () => {
    const p = parseBody("receipt", { spend: "rent", day: "19/11/2026" });
    expect(p.ok).toBe(false);
    if (!p.ok) expect(p.problems.map((x) => x.field).sort()).toEqual(["day", "spend"]);
  });

  it("never puts the value in a problem", () => {
    const secret = "my sealed words ".repeat(30);
    const p = parseBody("receipt", { store: secret, total: secret, day: secret, spend: secret });
    expect(p.ok).toBe(false);
    if (!p.ok) for (const x of p.problems) expect(x.problem).not.toContain("sealed");
  });

  it("reports an unknown kind or a body that is not an object, without throwing", () => {
    expect(parseBody("no-such-kind", {})).toEqual({ ok: false, problems: [{ field: "", problem: "No such kind" }] });
    expect(parseBody("receipt", null).ok).toBe(false);
    expect(parseBody("receipt", "text").ok).toBe(false);
    expect(isLifeKind("no-such-kind")).toBe(false);
  });

  it("reads a body with its mismatched fields left out", () => {
    const b = bodyOf("receipt", { store: "Corner shop", total: "12", spend: "eating-out", note: "kept" });
    expect(b).toEqual({ store: "Corner shop", spend: "eating-out", note: "kept" });
    const spend: "groceries" | "eating-out" | undefined = b.spend;
    expect(spend).toBe("eating-out");
    expect(bodyOf("receipt", null)).toEqual({});
  });
});
