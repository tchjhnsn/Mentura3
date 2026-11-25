// Sources of truth (V27, M4, P13, P15, P16) over the pure model in integrations-sources.ts.
import { describe, expect, it } from "vitest";
import { MARKET } from "@reflect/core/marketplace";
import { SERVICE_CAPABILITIES } from "./integrations";
import { M4 } from "./integrations-machines";
import { ADAPTERS, RECORD_KINDS, itemsOf, sourceIdOf, sourcesOf, stripeCustomer, type Adapter, type SourceMap } from "./integrations-sources";

const conn = (id: string, connector: string, status = "connected", businesses: string[] | null = null) => ({ id, connector, status, businesses });
const rule = (record: string, sor: string) => ({ record, attribute: "*", phase: "*", product: "*", account: "*", actor: "*", system_of_record: sor, owner: "Torian" });
const stripe: Adapter = ADAPTERS.find((a) => a.service === "stripe")!;

describe("sources of truth", () => {
  it("every record kind starts in Reflect (M4 initial)", () => {
    for (const s of sourcesOf({}, [], "biz")) expect(s.state).toBe(M4.initial);
  });

  it("a rule whose connection is live here, with an adapter, is outside", () => {
    const c = conn("AbC_1", "stripe");
    const id = sourceIdOf("stripe", c.id);
    const map: SourceMap = { sources: [{ id, connector: "mcp:stripe" }], rules: [rule("customer", id)] };
    const s = sourcesOf(map, [c], "biz", [stripe]).find((x) => x.kind.type === "customer")!;
    expect(s.state).toBe("outside");
    expect(s.connection?.id).toBe("AbC_1");
  });

  it("P15: losing the connection, the grant or the adapter makes it unreachable, never Reflect", () => {
    const c = conn("AbC_1", "stripe");
    const id = sourceIdOf("stripe", c.id);
    const map: SourceMap = { sources: [{ id, connector: "mcp:stripe" }], rules: [rule("customer", id)] };
    const state = (cs: ReturnType<typeof conn>[], adapters: Adapter[]) => sourcesOf(map, cs, "biz", adapters).find((x) => x.kind.type === "customer")!.state;
    expect(state([], [stripe])).toBe("unreachable");
    expect(state([conn("AbC_1", "stripe", "expired")], [stripe])).toBe("unreachable");
    expect(state([conn("AbC_1", "stripe", "connected", ["other"])], [stripe])).toBe("unreachable");
    expect(state([c], [])).toBe("unreachable");
  });

  it("candidates are live services with the kind's capability, marked with or without an adapter (P13)", () => {
    const s = sourcesOf({}, [conn("x", "stripe"), conn("y", "slack"), conn("z", "hubspot", "expired")], "biz", [stripe]).find((k) => k.kind.type === "customer")!;
    expect(s.candidates.map((c) => [c.connection.connector, c.adapter !== null])).toEqual([["stripe", true]]);
  });

  it("source ids are Naive ids and differ by connection", () => {
    const a = sourceIdOf("stripe", "AbC_1"), b = sourceIdOf("stripe", "abc_1");
    expect(a).toMatch(/^[a-z][a-z0-9-]*$/);
    expect(a).not.toBe(b);
  });

  it("P13: every adapter names a catalog service that holds one of its record kind's capabilities", () => {
    for (const a of ADAPTERS) {
      const kind = RECORD_KINDS.find((k) => k.type === a.record);
      expect(kind, `${a.service} adapts ${a.record}, which is not a record kind`).toBeDefined();
      expect(MARKET.some((m) => m.id === a.service)).toBe(true);
      expect(kind!.capabilities.some((k) => SERVICE_CAPABILITIES[a.service]?.includes(k))).toBe(true);
    }
  });

  it("record kinds are distinct record types (P16 begins with one row per kind)", () => {
    expect(new Set(RECORD_KINDS.map((k) => k.type)).size).toBe(RECORD_KINDS.length);
  });
});

describe("adapters", () => {
  it("Stripe's customer becomes a Naive customer record", () => {
    expect(stripeCustomer({ id: "cus_9x", name: "Ada", email: "ada@example.test", created: 1700000000 })).toEqual({ id: "cus_9x", name: "Ada", summary: "ada@example.test, customer since 2023-11-14, from Stripe" });
    expect(stripeCustomer({ id: "cus_1", email: "b@example.test" })?.name).toBe("b@example.test");
    expect(stripeCustomer({ id: "../etc" })).toBeNull();
    expect(stripeCustomer("cus_1")).toBeNull();
  });
  it("reads items from structured content or JSON text", () => {
    expect(itemsOf({ data: [1, 2] }, "")).toEqual([1, 2]);
    expect(itemsOf(null, JSON.stringify([{ id: "cus_1" }]))).toEqual([{ id: "cus_1" }]);
    expect(itemsOf(null, "not json")).toEqual([]);
  });
  it("adapters only name read tools, and folders are Naive's for their record type", () => {
    for (const a of ADAPTERS) {
      expect(a.read).toMatch(/^(list|get|search|retrieve|read)_/);
      expect(a.folder).toMatch(/^[a-z][a-z0-9-]*$/);
    }
  });
});
